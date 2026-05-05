from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from typing import List
import os
import cloudinary
import cloudinary.uploader
from google import genai
import json

from database import get_db
import models, schemas
from routers.auth import get_current_user
from utils.authz import user_can_access_project

router = APIRouter(prefix="/tasks", tags=["Tasks"])

cloudinary.config(
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
  api_key = os.getenv('CLOUDINARY_API_KEY'),
  api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

@router.get("/project/{project_id}", response_model=List[schemas.TaskResponse])
def get_tasks(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not user_can_access_project(db, current_user, project_id):
        raise HTTPException(status_code=403, detail="Accès refusé à ce projet")

    query = db.query(models.Task).options(
        joinedload(models.Task.assignee), 
        joinedload(models.Task.comments).joinedload(models.Comment.author),
        joinedload(models.Task.attachments).joinedload(models.Attachment.uploader)
    ).filter(models.Task.project_id == project_id)
    
    # "✅ Voir ses tâches assignées"
    if current_user.role != "admin":
        query = query.filter(models.Task.assignee_id == current_user.id)
            
    return query.order_by(models.Task.id.desc()).all()

@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task_detail(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).options(
        joinedload(models.Task.assignee), 
        joinedload(models.Task.comments).joinedload(models.Comment.author),
        joinedload(models.Task.attachments).joinedload(models.Attachment.uploader)
    ).filter(models.Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
    if not user_can_access_project(db, current_user, task.project_id):
        raise HTTPException(status_code=403, detail="Accès refusé")
        
    return task

@router.post("/project/{project_id}", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(project_id: int, task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seul un admin peut créer une tâche")
        
    new_task = models.Task(**task.model_dump(), project_id=project_id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    if new_task.assignee_id:
        notif = models.Notification(
            user_id=new_task.assignee_id,
            message=f"Vous avez été assigné à la tâche : {new_task.nom}"
        )
        db.add(notif)
        db.commit()
        
    return new_task

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    
    old_assignee = task.assignee_id
    old_statut = task.statut
    
    if current_user.role != "admin":
        # "✅ Modifier statut de ses tâches"
        if task.assignee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Seul l'assigné peut modifier sa tâche")
            
        update_data = task_update.model_dump(exclude_unset=True)
        # Verify they only update statut
        for k in update_data.keys():
            if k != "statut":
                raise HTTPException(status_code=403, detail=f"Un employé ne peut modifier que le statut")
        task.statut = update_data.get("statut", task.statut)
    else:
        # Admin can update everything
        for key, value in task_update.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(task, key, value)
            
    # Trigger Notifications
    if task.assignee_id and task.assignee_id != old_assignee:
        notif_assign = models.Notification(
            user_id=task.assignee_id,
            message=f"Vous avez été assigné à la tâche : {task.nom}"
        )
        db.add(notif_assign)
        
    if task.statut != old_statut:
        project = db.query(models.Project).filter(models.Project.id == task.project_id).first()
        # Notifier l'admin/propriétaire du projet si l'employé change le statut
        if project and project.user_id != current_user.id:
            notif_statut = models.Notification(
                user_id=project.user_id,
                message=f"La tâche '{task.nom}' est passée en : {task.statut}"
            )
            db.add(notif_statut)

    db.commit()
    db.refresh(task)
    
    return db.query(models.Task).options(
        joinedload(models.Task.assignee), 
        joinedload(models.Task.comments).joinedload(models.Comment.author),
        joinedload(models.Task.attachments).joinedload(models.Attachment.uploader)
    ).filter(models.Task.id == task_id).first()

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seul un admin peut supprimer une tâche")
        
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
    db.delete(task)
    db.commit()
    return None

# --- COMMENTS ---
@router.post("/{task_id}/comments", response_model=schemas.CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(task_id: int, comment: schemas.CommentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
    if current_user.role != "admin" and task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous devez être assigné pour commenter")
        
    new_comment = models.Comment(**comment.model_dump(), task_id=task_id, user_id=current_user.id)
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    return db.query(models.Comment).options(joinedload(models.Comment.author)).filter(models.Comment.id == new_comment.id).first()


# --- ATTACHMENTS (Cloudinary) ---
@router.post("/{task_id}/attachments", response_model=schemas.AttachmentResponse, status_code=status.HTTP_201_CREATED)
def add_attachment(task_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
    if current_user.role != "admin" and task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Non autorisé")

    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(file.file, folder=f"projectflow/tasks/{task_id}", resource_type="auto")
        
        new_attachment = models.Attachment(
            file_name=file.filename,
            file_url=result.get("secure_url"),
            public_id=result.get("public_id"),
            task_id=task_id,
            user_id=current_user.id
        )
        db.add(new_attachment)
        db.commit()
        db.refresh(new_attachment)
        
        return db.query(models.Attachment).options(joinedload(models.Attachment.uploader)).filter(models.Attachment.id == new_attachment.id).first()
    except Exception as e:
        print("Upload Error:", e)
        raise HTTPException(status_code=500, detail="Erreur lors de l'upload vers Cloudinary. Vérifiez vos clés API.")

@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(attachment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    attachment = db.query(models.Attachment).filter(models.Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
    if current_user.role != "admin" and attachment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Non autorisé")

    try:
        # Delete from Cloudinary
        cloudinary.uploader.destroy(attachment.public_id)
    except Exception as e:
        print("Cloudinary Delete Error:", e)
        
    db.delete(attachment)
    db.commit()
    return None

# --- AI GENERATION ---
@router.post("/project/{project_id}/generate-ai", status_code=status.HTTP_201_CREATED)
def generate_tasks_ai(project_id: int, ai_prompt: schemas.AIPrompt, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seul un admin peut générer des tâches via l'IA")
        
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="La clé API Gemini n'est pas configurée (GEMINI_API_KEY).")

    genai_client = None
    # We do not use genai.configure anymore with the new SDK, we pass it to the Client.
    
    # Prompting Gemini
    system_instruction = "Tu es un chef de projet expert. Ton rôle est de découper un objectif de projet en une liste de tâches réalisables. Tu dois répondre STRICTEMENT en JSON pur, sans aucun bloc de code markdown (pas de ```json), juste le tableau JSON. Chaque objet du tableau doit avoir deux clés : 'nom' (le nom de la tâche, court et clair) et 'priority' (soit 'Low', 'Medium', ou 'High'). Génère entre 5 et 10 tâches selon la complexité."
    
    try:
        client = genai.Client(api_key=api_key)
        prompt = f"{system_instruction}\n\nObjectif du projet: {ai_prompt.prompt}"
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        # Parse JSON
        text_response = response.text.strip()
        if text_response.startswith('```json'):
            text_response = text_response[7:-3].strip()
        elif text_response.startswith('```'):
            text_response = text_response[3:-3].strip()
            
        tasks_data = json.loads(text_response)
        
        created_tasks = []
        for t in tasks_data:
            new_task = models.Task(
                nom=t.get('nom', 'Tâche sans nom'),
                priority=t.get('priority', 'Medium'),
                statut='To Do',
                project_id=project_id
            )
            db.add(new_task)
            created_tasks.append(new_task)
            
        db.commit()
        
        return {"message": f"{len(created_tasks)} tâches générées avec succès !"}
        
    except json.JSONDecodeError:
        print("Erreur de parsing JSON:", response.text if 'response' in locals() else "Pas de réponse")
        raise HTTPException(status_code=500, detail="L'IA n'a pas répondu dans le bon format JSON. Veuillez réessayer.")
    except Exception as e:
        print("Erreur Gemini:", e)
        raise HTTPException(status_code=500, detail="Erreur de connexion avec l'IA. Vérifiez votre clé API.")
