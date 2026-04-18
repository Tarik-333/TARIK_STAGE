from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# --- Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

# --- User ---
class UserBase(BaseModel):
    nom: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Comment ---
class CommentBase(BaseModel):
    text: str

class CommentCreate(CommentBase):
    pass

class CommentResponse(CommentBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    author: Optional[UserResponse] = None
    class Config:
        from_attributes = True

# --- Task ---
class TaskBase(BaseModel):
    nom: str
    deadline: Optional[datetime] = None
    statut: str = "To Do"
    priority: str = "Medium"
    assignee_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    statut: Optional[str] = None
    nom: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None

class TaskResponse(TaskBase):
    id: int
    project_id: int
    created_at: datetime
    assignee: Optional[UserResponse] = None
    comments: List[CommentResponse] = []
    class Config:
        from_attributes = True

# --- Project ---
class ProjectBase(BaseModel):
    nom: str
    description: Optional[str] = None
    date_debut: Optional[datetime] = None
    date_fin: Optional[datetime] = None
    statut: str = "en cours"

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    created_at: datetime
    tasks: List[TaskResponse] = []
    class Config:
        from_attributes = True
