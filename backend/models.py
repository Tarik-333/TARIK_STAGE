from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default="employe") # "admin" or "employe"
    profile_picture = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="assignee")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    date_debut = Column(DateTime, nullable=True)
    date_fin = Column(DateTime, nullable=True)
    statut = Column(String(20), default="en cours") # "en cours", "terminé"
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    messages = relationship("ProjectMessage", back_populates="project", cascade="all, delete-orphan")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")


class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (UniqueConstraint("project_id", "user_id", name="uq_project_member"),)

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(30), default="member")  # member | manager
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="members")
    user = relationship("User")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    start_date = Column(DateTime, nullable=True)
    deadline = Column(DateTime, nullable=True)
    statut = Column(String(20), default="To Do") # "To Do", "In Progress", "Done", "Blocked"
    priority = Column(String(20), default="Medium") # "Low", "Medium", "High"
    project_id = Column(Integer, ForeignKey("projects.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="comments")
    author = relationship("User", back_populates="comments")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    public_id = Column(String(255), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="attachments")
    uploader = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String(255), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class ProjectMessage(Base):
    __tablename__ = "project_messages"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="messages")
    author = relationship("User")
