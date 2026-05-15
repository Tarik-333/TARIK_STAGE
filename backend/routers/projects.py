from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas
from routers.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[schemas.ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        if current_user.role in ["admin", "manager"]:
            projects = db.query(models.Project).all()
        else:
            # Employé logic
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
        return projects
    except Exception as e:
        print(f"ERROR FETCHING PROJECTS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur base de données: {str(e)}")

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    from utils.authz import user_can_access_project
    
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    if not user_can_access_project(db, current_user, project_id):
        raise HTTPException(status_code=403, detail="Accès refusé à ce projet")
        
    return project

@router.post("", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Seul un admin ou un manager peut créer un projet")
        
    new_project = models.Project(**project.model_dump(), user_id=current_user.id)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: int, project_update: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Seul un admin ou un manager peut modifier un projet")
        
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
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Seul un admin ou un manager peut supprimer un projet")
        
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
        
    db.delete(project)
    db.commit()
    return None
