from database import SessionLocal
import models
from datetime import datetime, timedelta

def seed_dates():
    db = SessionLocal()
    p = db.query(models.Project).filter(models.Project.nom == 'Application de pointage RH').first()
    if not p:
        print("Project not found")
        return
    
    tasks = db.query(models.Task).filter(models.Task.project_id == p.id).all()
    base_date = datetime(2026, 5, 1)
    
    for i, t in enumerate(tasks):
        # Create a staggered timeline
        t.start_date = base_date + timedelta(days=i * 2)
        t.deadline = t.start_date + timedelta(days=4 + (i % 3))
        
    db.commit()
    print(f"✅ Mis à jour {len(tasks)} tâches pour le projet '{p.nom}' avec des dates en Mai 2026.")
    db.close()

if __name__ == "__main__":
    seed_dates()
