from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas
from routers.auth import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

# We get tasks by project
@router.get("/project/{project_id}", response_model=List[schemas.TaskResponse])
def get_tasks(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Verify project belongs to user
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
        
    tasks = db.query(models.Task).filter(models.Task.project_id == project_id).all()
    return tasks

@router.post("/project/{project_id}", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(project_id: int, task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
        
    new_task = models.Task(**task.model_dump(), project_id=project_id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).join(models.Project).filter(models.Task.id == task_id, models.Project.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
    for key, value in task_update.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(task, key, value)
            
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).join(models.Project).filter(models.Task.id == task_id, models.Project.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
    db.delete(task)
    db.commit()
    return None
