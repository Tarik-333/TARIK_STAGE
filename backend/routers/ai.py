from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os
from google import genai
from pydantic import BaseModel

from database import get_db
import models
from routers.auth import get_current_user
from utils.authz import user_can_access_project

router = APIRouter(prefix="/ai", tags=["AI Chatbot"])

class ChatMessage(BaseModel):
    message: str

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
"""

    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"{system_instruction}\n\nQuestion de l'utilisateur : {chat.message}"
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        return {"response": response.text.strip()}
    except Exception as e:
        print("Erreur Gemini (Chatbot):", e)
        raise HTTPException(status_code=500, detail="Erreur de connexion avec l'IA. Vérifiez votre clé API.")
