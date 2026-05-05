from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, DATABASE_URL
import models
from routers.auth import get_password_hash
from datetime import datetime, timedelta

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def seed():
    print("Seeding database...")
    
    # 1. Create extra users
    users_data = [
        {"nom": "Sarah Manager", "email": "sarah@valaflow.com", "role": "admin"},
        {"nom": "Jean Développeur", "email": "jean@valaflow.com", "role": "employe"},
        {"nom": "Marie Designer", "email": "marie@valaflow.com", "role": "employe"},
        {"nom": "Ahmed Expert", "email": "ahmed@valaflow.com", "role": "employe"},
    ]
    
    db_users = []
    for u in users_data:
        existing = db.query(models.User).filter(models.User.email == u["email"]).first()
        if not existing:
            new_user = models.User(nom=u["nom"], email=u["email"], password=get_password_hash("password123"), role=u["role"])
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            db_users.append(new_user)
        else:
            db_users.append(existing)

    sarah = db_users[0]
    jean = db_users[1]
    marie = db_users[2]
    ahmed = db_users[3]

    # 2. Create Projects
    projects_data = [
        {"nom": "Refonte Site Web E-commerce", "desc": "Migration vers Next.js et refonte de l'identité visuelle."},
        {"nom": "Application Mobile ValaFlow", "desc": "Développement de la version iOS et Android avec React Native."},
        {"nom": "Audit Sécurité Q2", "desc": "Vérification des vulnérabilités et mise à jour des certificats."},
    ]

    for p_info in projects_data:
        existing_p = db.query(models.Project).filter(models.Project.nom == p_info["nom"]).first()
        if not existing_p:
            project = models.Project(nom=p_info["nom"], description=p_info["desc"], user_id=sarah.id)
            db.add(project)
            db.commit()
            db.refresh(project)
            
            # Add members to projects
            members = [
                models.ProjectMember(project_id=project.id, user_id=sarah.id, role="manager"),
                models.ProjectMember(project_id=project.id, user_id=jean.id, role="member"),
                models.ProjectMember(project_id=project.id, user_id=marie.id, role="member"),
            ]
            db.add_all(members)
            db.commit()

            # Add various tasks
            tasks = [
                models.Task(nom="Maquettage Figma", project_id=project.id, assignee_id=marie.id, statut="Done", priority="High"),
                models.Task(nom="Setup API FastAPI", project_id=project.id, assignee_id=jean.id, statut="In Progress", priority="High"),
                models.Task(nom="Optimisation SEO", project_id=project.id, assignee_id=jean.id, statut="To Do", priority="Medium"),
                models.Task(nom="Review Design", project_id=project.id, assignee_id=sarah.id, statut="Blocked", priority="High"),
            ]
            db.add_all(tasks)
            db.commit()
            
            # Add some chat messages
            msg = models.ProjectMessage(text=f"Bienvenue sur le projet {project.nom} !", project_id=project.id, user_id=sarah.id)
            db.add(msg)
            db.commit()

    print("Seed completed successfully!")

if __name__ == "__main__":
    seed()
