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
    profile_picture: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

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

# --- Attachment ---
class AttachmentResponse(BaseModel):
    id: int
    file_name: str
    file_url: str
    public_id: str
    task_id: int
    user_id: int
    created_at: datetime
    uploader: Optional[UserResponse] = None
    class Config:
        from_attributes = True

# --- Notification ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

# --- AI Prompt ---
class AIPrompt(BaseModel):
    prompt: str

# --- Project Message (Chat) ---
class ProjectMessageBase(BaseModel):
    text: str

class ProjectMessageCreate(ProjectMessageBase):
    pass

class ProjectMessageResponse(ProjectMessageBase):
    id: int
    project_id: int
    user_id: int
    created_at: datetime
    author: Optional[UserResponse] = None
    class Config:
        from_attributes = True

# --- Task ---
class TaskBase(BaseModel):
    nom: str
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    statut: str = "To Do"
    priority: str = "Medium"
    assignee_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    statut: Optional[str] = None
    nom: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[datetime] = None
    start_date: Optional[datetime] = None
    assignee_id: Optional[int] = None

class TaskResponse(TaskBase):
    id: int
    project_id: int
    created_at: datetime
    assignee: Optional[UserResponse] = None
    comments: List[CommentResponse] = []
    attachments: List[AttachmentResponse] = []
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

# --- Project Members ---
class ProjectMemberBase(BaseModel):
    user_id: int
    role: str = "member"


class ProjectMemberCreate(ProjectMemberBase):
    pass


class ProjectMemberResponse(ProjectMemberBase):
    id: int
    project_id: int
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- Dashboard ---
class DashboardStats(BaseModel):
    totalProjects: int
    totalTasks: int
    completedTasks: int
    activeUsers: int
    progress: int

class StatusDistribution(BaseModel):
    name: str
    value: int

class MemberWorkload(BaseModel):
    name: str
    taches: int

class TimelinePoint(BaseModel):
    date: str
    created: int
    completed: int

class DashboardResponse(BaseModel):
    stats: DashboardStats
    distribution: List[StatusDistribution]
    workload: List[MemberWorkload]
    timeline: List[TimelinePoint]
    recentProjects: List[ProjectResponse]
    myTasks: List[TaskResponse] = []
    blockedTasks: List[TaskResponse] = []
