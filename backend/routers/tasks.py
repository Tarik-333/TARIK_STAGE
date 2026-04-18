from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from typing import List

from database import get_db
import models, schemas
from routers.auth import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/project/{project_id}", response_model=List[schemas.TaskResponse])
def get_tasks(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Task).options(joinedload(models.Task.assignee), joinedload(models.Task.comments).joinedload(models.Comment.author)).filter(models.Task.project_id == project_id)
    
    # "✅ Voir ses tâches assignées"
    if current_user.role != "admin":
        query = query.filter(models.Task.assignee_id == current_user.id)
            
    return query.order_by(models.Task.id.desc()).all()

@router.post("/project/{project_id}", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(project_id: int, task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seul un admin peut créer une tâche")
        
    new_task = models.Task(**task.model_dump(), project_id=project_id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    
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
            
    db.commit()
    db.refresh(task)
    
    return db.query(models.Task).options(joinedload(models.Task.assignee), joinedload(models.Task.comments).joinedload(models.Comment.author)).filter(models.Task.id == task_id).first()

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

