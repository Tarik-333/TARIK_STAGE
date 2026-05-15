from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
import models, schemas
from routers.auth import get_current_user
from utils.authz import user_can_access_project


router = APIRouter(prefix="/projects", tags=["Project Members"])


def _ensure_project(db: Session, project_id: int) -> models.Project:
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return project


def _require_owner_or_admin(project: models.Project, current_user: models.User):
    if current_user.role in ["admin", "manager"]:
        return
    if project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Non autorisé")


@router.get("/{project_id}/members", response_model=List[schemas.ProjectMemberResponse])
def list_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not user_can_access_project(db, current_user, project_id):
        raise HTTPException(status_code=403, detail="Accès refusé à ce projet")

    _ensure_project(db, project_id)
    return (
        db.query(models.ProjectMember)
        .options(joinedload(models.ProjectMember.user))
        .filter(models.ProjectMember.project_id == project_id)
        .order_by(models.ProjectMember.id.asc())
        .all()
    )


@router.post(
    "/{project_id}/members",
    response_model=schemas.ProjectMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    project_id: int,
    payload: schemas.ProjectMemberCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = _ensure_project(db, project_id)
    _require_owner_or_admin(project, current_user)

    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    existing = (
        db.query(models.ProjectMember)
        .filter(models.ProjectMember.project_id == project_id, models.ProjectMember.user_id == payload.user_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Utilisateur déjà membre de ce projet")

    member = models.ProjectMember(project_id=project_id, user_id=payload.user_id, role=payload.role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return (
        db.query(models.ProjectMember)
        .options(joinedload(models.ProjectMember.user))
        .filter(models.ProjectMember.id == member.id)
        .first()
    )


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = _ensure_project(db, project_id)
    _require_owner_or_admin(project, current_user)

    member = (
        db.query(models.ProjectMember)
        .filter(models.ProjectMember.project_id == project_id, models.ProjectMember.user_id == user_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Membre non trouvé")

    db.delete(member)
    db.commit()
    return None

