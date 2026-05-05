from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, projects, tasks, notifications, ai, chat, reports, dashboard, memberships

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ProjectFlow API")

# Configure CORS for React frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(notifications.router)
app.include_router(ai.router)
app.include_router(chat.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(memberships.router)

@app.get("/")
def root():
    return {"message": "ProjectFlow API is running"}