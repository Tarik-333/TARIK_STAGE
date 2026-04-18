from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas
from routers.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/", response_model=List[schemas.ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "admin":
        projects = db.query(models.Project).all()
    else:
        # Employé: Voir seulement les projets où il participe (ou a des tâches)
        owned_projects = db.query(models.Project).filter(models.Project.user_id == current_user.id).all()
        assigned_tasks = db.query(models.Task).filter(models.Task.assignee_id == current_user.id).all()
        assigned_project_ids = [t.project_id for t in assigned_tasks]
        assigned_projects = db.query(models.Project).filter(models.Project.id.in_(assigned_project_ids)).all()
        
        project_dict = {p.id: p for p in owned_projects + assigned_projects}
        projects = list(project_dict.values())
        
    return projects

@router.post("/", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seul un admin peut créer un projet")
        
    new_project = models.Project(**project.model_dump(), user_id=current_user.id)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: int, project_update: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seul un admin peut modifier un projet")
        
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
        
    for key, value in project_update.model_dump().items():
        setattr(project, key, value)
        
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seul un admin peut supprimer un projet")
        
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
        
    db.delete(project)
    db.commit()
    return None
