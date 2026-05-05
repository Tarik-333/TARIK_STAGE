from __future__ import annotations

from sqlalchemy.orm import Session

import models


def user_can_access_project(db: Session, user: models.User, project_id: int) -> bool:
    """
    Access rules (STRICT):
    - admin: always
    - project owner: always
    - project member (ProjectMember): yes
    """
    if user.role == "admin":
        return True

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        return False

    if project.user_id == user.id:
        return True

    member = (
        db.query(models.ProjectMember)
        .filter(models.ProjectMember.project_id == project_id, models.ProjectMember.user_id == user.id)
        .first()
    )
    return member is not None

