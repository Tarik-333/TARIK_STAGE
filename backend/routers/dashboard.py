from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List

from database import get_db
import models, schemas
from routers.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=schemas.DashboardResponse)
def get_dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Base query for projects and tasks based on role
    if current_user.role in ["admin", "manager"]:
        projects_query = db.query(models.Project)
        tasks_query = db.query(models.Task)
        users_count = db.query(models.User).count()
    else:
        # Employee: Intelligent Personal Dashboard
        # Access strictly by explicit membership (ProjectMember) or Ownership
        member_proj_ids = [m.project_id for m in db.query(models.ProjectMember.project_id).filter(models.ProjectMember.user_id == current_user.id).all()]
        owned_proj_ids = [p.id for p in db.query(models.Project.id).filter(models.Project.user_id == current_user.id).all()]
        
        all_accessible_ids = list(set(member_proj_ids + owned_proj_ids))
        
        # Stats are limited to their projects
        projects_query = db.query(models.Project).filter(models.Project.id.in_(all_accessible_ids))
        
        # IMPORTANT: For an employee, the stats (total tasks, etc.) should focus on THEIR work
        # to make it a "Personal Dashboard"
        tasks_query = db.query(models.Task).filter(
            models.Task.project_id.in_(all_accessible_ids),
            models.Task.assignee_id == current_user.id
        )
        
        # Active users for an employee: count of unique people in their projects
        users_count = db.query(func.count(func.distinct(models.ProjectMember.user_id)))\
            .filter(models.ProjectMember.project_id.in_(all_accessible_ids))\
            .scalar() or 0

    # 1.5 Fetch specific tasks based on role
    my_tasks = []
    blocked_tasks = []
    if current_user.role in ["admin", "manager"]:
        blocked_tasks = db.query(models.Task).filter(models.Task.statut == "Blocked").order_by(models.Task.created_at.desc()).limit(5).all()
    else:
        my_tasks = db.query(models.Task).filter(
            models.Task.assignee_id == current_user.id,
            models.Task.statut != "Done"
        ).order_by(models.Task.deadline.asc().nulls_last()).limit(5).all()

    # 2. Data aggregation
    recent_projects = projects_query.order_by(models.Project.created_at.desc()).limit(5).all()
    all_tasks = tasks_query.all()
    total_projects = projects_query.count()
    total_tasks = len(all_tasks)
    completed_tasks = sum(1 for t in all_tasks if t.statut == "Done")
    progress = round((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0

    # 3. Status Distribution
    status_counts = {"To Do": 0, "In Progress": 0, "Blocked": 0, "Done": 0}
    for t in all_tasks:
        if t.statut in status_counts:
            status_counts[t.statut] += 1
    
    distribution = [schemas.StatusDistribution(name=k, value=v) for k, v in status_counts.items() if v > 0]

    # 4. Member Workload (Top 5)
    # If Admin/Manager: Global view. If Employee: Personal context (who else is busy in my projects?)
    if current_user.role in ["admin", "manager"]:
        workload_tasks = db.query(models.Task).filter(models.Task.statut != "Done").all()
    else:
        # For employee dashboard, show workload of their team members in common projects
        workload_tasks = db.query(models.Task).filter(
            models.Task.project_id.in_(all_accessible_ids),
            models.Task.statut != "Done"
        ).all()

    workload_map = {}
    users = db.query(models.User).all()
    user_map = {u.id: u.nom for u in users}
    
    for t in workload_tasks:
        if t.assignee_id:
            workload_map[t.assignee_id] = workload_map.get(t.assignee_id, 0) + 1
    
    workload = [
        schemas.MemberWorkload(name=user_map.get(uid, "Inconnu"), taches=count)
        for uid, count in workload_map.items()
    ]
    workload.sort(key=lambda x: x.taches, reverse=True)
    workload = workload[:5]

    # 5. Timeline (Last 7 days)
    timeline = []
    today = datetime.utcnow().date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%a")
        created = sum(1 for t in all_tasks if t.created_at.date() == day)
        completed = sum(1 for t in all_tasks if t.statut == "Done" and t.created_at.date() <= day)
        timeline.append(schemas.TimelinePoint(date=day_str, created=created, completed=completed))

    return schemas.DashboardResponse(
        stats=schemas.DashboardStats(
            totalProjects=total_projects,
            totalTasks=total_tasks,
            completedTasks=completed_tasks,
            activeUsers=users_count,
            progress=progress
        ),
        distribution=distribution,
        workload=workload,
        timeline=timeline,
        recentProjects=recent_projects,
        myTasks=my_tasks,
        blockedTasks=blocked_tasks
    )
