from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os
from google import genai
from pydantic import BaseModel
import json
import re

from database import get_db
import models
from routers.auth import get_current_user
from utils.authz import user_can_access_project

router = APIRouter(prefix="/ai", tags=["AI Chatbot"])

class ChatMessage(BaseModel):
    message: str
    project_id: int | None = None

@router.post("/chat")
def chat_with_ai(chat: ChatMessage, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="La clé API Gemini n'est pas configurée (GEMINI_API_KEY).")

    # If admin, fetch all. If employee, fetch their related projects/tasks.
    if current_user.role == "admin":
        projects = db.query(models.Project).all()
        tasks = db.query(models.Task).all()
        users = db.query(models.User).all()
        user_dict = {u.id: u.nom for u in users}
    else:
        # Employee context (only what they can access)
        owned_projects = db.query(models.Project).filter(models.Project.user_id == current_user.id).all()
        member_project_ids = [
            pm.project_id
            for pm in db.query(models.ProjectMember.project_id)
            .filter(models.ProjectMember.user_id == current_user.id)
            .all()
        ]
        member_projects = (
            db.query(models.Project).filter(models.Project.id.in_(member_project_ids)).all()
            if member_project_ids
            else []
        )

        project_dict = {p.id: p for p in owned_projects + member_projects}
        projects = list(project_dict.values())

        accessible_project_ids = list(project_dict.keys())
        tasks = (
            db.query(models.Task).filter(models.Task.project_id.in_(accessible_project_ids)).all()
            if accessible_project_ids
            else []
        )

        # Only include relevant users (avoid leaking all users)
        relevant_user_ids = {current_user.id}
        for p in projects:
            if p.user_id:
                relevant_user_ids.add(p.user_id)
        for t in tasks:
            if t.assignee_id:
                relevant_user_ids.add(t.assignee_id)

        users = db.query(models.User).filter(models.User.id.in_(relevant_user_ids)).all() if relevant_user_ids else [current_user]
        user_dict = {u.id: u.nom for u in users}

    # Fetch Notifications
    notifications = db.query(models.Notification).filter(models.Notification.user_id == current_user.id).order_by(models.Notification.created_at.desc()).limit(10).all()

    # Fetch Recent Comments on accessible tasks
    task_ids = [t.id for t in tasks]
    recent_comments = []
    if task_ids:
        recent_comments = db.query(models.Comment).filter(models.Comment.task_id.in_(task_ids)).order_by(models.Comment.created_at.desc()).limit(15).all()

    # Build Context String
    context_str = "Voici les données actuelles de la base de données (système de gestion de projet):\n"
    
    context_str += "PROJETS:\n"
    for p in projects:
        context_str += f"- ID: {p.id}, Nom: {p.nom}, Statut: {p.statut}, Deadline: {p.date_fin}\n"

    context_str += "\nTÂCHES:\n"
    for t in tasks:
        assignee_name = user_dict.get(t.assignee_id, "Non assigné")
        context_str += f"- ID: {t.id}, Projet ID: {t.project_id}, Nom: {t.nom}, Statut: {t.statut}, Priorité: {t.priority}, Assigné à: {assignee_name}, Deadline: {t.deadline}\n"

    context_str += "\nNOTIFICATIONS (Les 10 plus récentes de l'utilisateur):\n"
    for n in notifications:
        status_notif = "Lue" if n.is_read else "Non lue"
        context_str += f"- [{status_notif}] {n.message} (Date: {n.created_at.strftime('%Y-%m-%d %H:%M')})\n"

    context_str += "\nDERNIERS COMMENTAIRES SUR LES TÂCHES:\n"
    for c in recent_comments:
        author_name = user_dict.get(c.user_id, "Inconnu")
        task_name = next((t.nom for t in tasks if t.id == c.task_id), "Tâche inconnue")
        context_str += f"- {author_name} a commenté sur '{task_name}' : \"{c.text}\" (Date: {c.created_at.strftime('%Y-%m-%d %H:%M')})\n"

    context_str += "\nUTILISATEURS (contexte limité):\n"
    for u in users:
        if current_user.role == "admin":
            context_str += f"- ID: {u.id}, Nom: {u.nom}, Role: {u.role}\n"
        else:
            # For employees, do not expose roles or full directory of users
            context_str += f"- ID: {u.id}, Nom: {u.nom}\n"

    system_instruction = f"""
Tu es l'assistant IA officiel de 'ValaFlow', une application SaaS de gestion de projet.
L'utilisateur qui te parle s'appelle {current_user.nom} et a le rôle '{current_user.role}'. Tu agis comme un "Scrum Master" proactif et intelligent.

Voici le contexte complet des données de l'application auquel il a accès :
{context_str}

Règles à respecter :
1. Réponds toujours en français de manière polie, professionnelle, encourageante et claire.
2. N'invente jamais de tâches, de projets, de notifications ou de commentaires. Base-toi uniquement sur le contexte fourni ci-dessus.
3. Si l'utilisateur demande "quelles sont mes tâches urgentes", analyse la priorité (High) ET la deadline. S'il y a du retard, signale-le avec tact.
4. Si l'utilisateur te demande des nouvelles d'un projet ou d'une tâche, n'hésite pas à résumer les derniers commentaires pour lui donner une idée de l'avancement.
5. Utilise un formatage Markdown propre (puces, gras) pour faciliter la lecture, et rajoute quelques emojis pertinents.
6. Si tu ne trouves pas la réponse dans le contexte, dis-le honnêtement.
7. Sois concis. Ne répète pas tout le contexte, réponds de façon ciblée à la question posée.
8. IMPORTANTE NOUVELLE FONCTIONNALITÉ: Si l'utilisateur demande de *créer* ou *générer* des tâches (par exemple: "je veux 5 tâches", "crée des tâches"), tu DOIS répondre EXACTEMENT avec ce format JSON strict (et rien d'autre) dans un bloc ```json :
```json
[
  {{"nom": "Nom de la tâche", "statut": "To Do", "priority": "Medium", "assignee_id": null}}
]
```
Les statuts possibles sont : "To Do", "In Progress", "Blocked", "Done". Les priorités possibles sont : "Low", "Medium", "High". Si aucun utilisateur n'est spécifié, laisse `assignee_id` à null ou mets l'ID d'un utilisateur du contexte si pertinent.
Ne mets pas de blabla supplémentaire si tu génères des tâches, donne juste le bloc JSON.
Si ce n'est pas une demande de création, réponds normalement en texte.
"""

    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"{system_instruction}\n\nQuestion de l'utilisateur : {chat.message}"
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        response_text = response.text.strip()
        
        # Check if the response contains JSON for tasks
        json_match = re.search(r"```json\s*\n(.*?)\n\s*```", response_text, re.DOTALL)
        if json_match and chat.project_id:
            try:
                tasks_data = json.loads(json_match.group(1))
                created_count = 0
                for t_data in tasks_data:
                    new_task = models.Task(
                        nom=t_data.get("nom", "Tâche IA"),
                        statut=t_data.get("statut", "To Do"),
                        priority=t_data.get("priority", "Medium"),
                        assignee_id=t_data.get("assignee_id"),
                        project_id=chat.project_id
                    )
                    db.add(new_task)
                    created_count += 1
                db.commit()
                return {"response": f"J'ai créé {created_count} nouvelle(s) tâche(s) avec succès ! 🚀"}
            except Exception as e:
                db.rollback()
                print("Erreur de parsing JSON pour les tâches:", e)
        elif (response_text.startswith('[') and response_text.endswith(']')) and chat.project_id:
             try:
                tasks_data = json.loads(response_text)
                created_count = 0
                for t_data in tasks_data:
                    new_task = models.Task(
                        nom=t_data.get("nom", "Tâche IA"),
                        statut=t_data.get("statut", "To Do"),
                        priority=t_data.get("priority", "Medium"),
                        assignee_id=t_data.get("assignee_id"),
                        project_id=chat.project_id
                    )
                    db.add(new_task)
                    created_count += 1
                db.commit()
                return {"response": f"J'ai créé {created_count} nouvelle(s) tâche(s) avec succès ! 🚀"}
             except Exception as e:
                db.rollback()
                print("Erreur de parsing JSON brut pour les tâches:", e)

        return {"response": response_text}
    except Exception as e:
        print("Erreur Gemini (Chatbot):", e)
        raise HTTPException(status_code=500, detail="Erreur de connexion avec l'IA. Vérifiez votre clé API.")
