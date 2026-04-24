from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os
from google import genai
from pydantic import BaseModel

from database import get_db
import models
from routers.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Chatbot"])

class ChatMessage(BaseModel):
    message: str

@router.post("/chat")
def chat_with_ai(chat: ChatMessage, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="La clé API Gemini n'est pas configurée (GEMINI_API_KEY).")

    # Fetch context: all projects, tasks, and users
    users = db.query(models.User).all()
    user_dict = {u.id: u.nom for u in users}

    # If admin, fetch all. If employee, fetch their related projects/tasks.
    if current_user.role == "admin":
        projects = db.query(models.Project).all()
        tasks = db.query(models.Task).all()
    else:
        # Employee context
        owned_projects = db.query(models.Project).filter(models.Project.user_id == current_user.id).all()
        assigned_tasks = db.query(models.Task).filter(models.Task.assignee_id == current_user.id).all()
        assigned_project_ids = [t.project_id for t in assigned_tasks]
        assigned_projects = db.query(models.Project).filter(models.Project.id.in_(assigned_project_ids)).all()
        
        project_dict = {p.id: p for p in owned_projects + assigned_projects}
        projects = list(project_dict.values())
        
        # Also include tasks of those projects so they know the project context
        if project_dict.keys():
            tasks = db.query(models.Task).filter(models.Task.project_id.in_(project_dict.keys())).all()
        else:
            tasks = []

    # Build Context String
    context_str = "Voici les données actuelles de la base de données (système de gestion de projet):\n"
    
    context_str += "PROJETS:\n"
    for p in projects:
        context_str += f"- ID: {p.id}, Nom: {p.nom}, Statut: {p.statut}, Deadline: {p.date_fin}\n"

    context_str += "\nTÂCHES:\n"
    for t in tasks:
        assignee_name = user_dict.get(t.assignee_id, "Non assigné")
        context_str += f"- ID: {t.id}, Projet ID: {t.project_id}, Nom: {t.nom}, Statut: {t.statut}, Priorité: {t.priority}, Assigné à: {assignee_name}, Deadline: {t.deadline}\n"

    context_str += "\nEMPLOYÉS (Utilisateurs):\n"
    for u in users:
        context_str += f"- ID: {u.id}, Nom: {u.nom}, Role: {u.role}\n"

    system_instruction = f"""
Tu es l'assistant IA officiel de 'ProjectFlow', une application SaaS de gestion de projet.
L'utilisateur qui te parle s'appelle {current_user.nom} et a le rôle '{current_user.role}'.

Voici le contexte complet des données de l'application auquel il a accès :
{context_str}

Règles à respecter :
1. Réponds toujours en français de manière polie, professionnelle, encourageante et claire.
2. N'invente jamais de tâches ou de projets. Base-toi uniquement sur le contexte fourni ci-dessus.
3. Si l'utilisateur demande "quelles sont mes tâches urgentes", cherche les tâches qui ont une priorité "High" ou dont la deadline est très proche, et qui sont assignées à {current_user.nom}.
4. Utilise un formatage Markdown propre (puces, gras) pour faciliter la lecture, et rajoute quelques emojis pertinents.
5. Si tu ne trouves pas la réponse dans le contexte, dis-le honnêtement.
6. Ne répète pas tout le contexte, réponds juste à la question posée par l'utilisateur.
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
