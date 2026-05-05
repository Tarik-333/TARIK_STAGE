from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import DATABASE_URL
import models

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def update_seed():
    # 1. Delete Sarah
    sarah = db.query(models.User).filter(models.User.email == "sarah@valaflow.com").first()
    if sarah:
        # 1. Re-assign or delete projects
        other_admin = db.query(models.User).filter(models.User.role == "admin", models.User.id != sarah.id).first()
        if other_admin:
            db.query(models.Project).filter(models.Project.user_id == sarah.id).update({"user_id": other_admin.id})
            db.commit()
        
        # 2. Delete references that don't cascade automatically
        db.query(models.ProjectMessage).filter(models.ProjectMessage.user_id == sarah.id).delete()
        db.query(models.ProjectMember).filter(models.ProjectMember.user_id == sarah.id).delete()
        db.query(models.Attachment).filter(models.Attachment.user_id == sarah.id).delete()
        db.query(models.Notification).filter(models.Notification.user_id == sarah.id).delete()
        db.commit()
        
        db.delete(sarah)
        db.commit()
        print("Sarah deleted.")

    # 2. Rename Jean to Omar
    jean = db.query(models.User).filter(models.User.email == "jean@valaflow.com").first()
    if jean:
        jean.nom = "Omar"
        jean.email = "omar@valaflow.com"
        db.commit()
        print("Jean renamed to Omar.")

    # 3. Rename Marie to Youness
    marie = db.query(models.User).filter(models.User.email == "marie@valaflow.com").first()
    if marie:
        marie.nom = "Youness"
        marie.email = "youness@valaflow.com"
        db.commit()
        print("Marie renamed to Youness.")

if __name__ == "__main__":
    update_seed()
