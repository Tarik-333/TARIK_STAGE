from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from typing import List, Dict

from database import get_db, SessionLocal
import models, schemas
from routers.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])

class ConnectionManager:
    def __init__(self):
        # project_id -> list of WebSockets
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: int):
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)

    def disconnect(self, websocket: WebSocket, project_id: int):
        if project_id in self.active_connections:
            self.active_connections[project_id].remove(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]

    async def broadcast(self, message: dict, project_id: int):
        if project_id in self.active_connections:
            for connection in self.active_connections[project_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.get("/project/{project_id}/messages", response_model=List[schemas.ProjectMessageResponse])
def get_chat_history(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
        
    messages = db.query(models.ProjectMessage).options(joinedload(models.ProjectMessage.author)).filter(models.ProjectMessage.project_id == project_id).order_by(models.ProjectMessage.created_at.asc()).all()
    return messages

@router.websocket("/ws/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: int, user_id: int = Query(...)):
    await manager.connect(websocket, project_id)
    
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            await websocket.close()
            return
            
        while True:
            data = await websocket.receive_text()
            
            # Save message to DB
            new_message = models.ProjectMessage(text=data, project_id=project_id, user_id=user_id)
            db.add(new_message)
            db.commit()
            db.refresh(new_message)
            
            # Re-fetch to get author info
            msg_with_author = db.query(models.ProjectMessage).options(joinedload(models.ProjectMessage.author)).filter(models.ProjectMessage.id == new_message.id).first()
            
            # Broadcast as JSON
            msg_dict = {
                "id": msg_with_author.id,
                "text": msg_with_author.text,
                "project_id": msg_with_author.project_id,
                "user_id": msg_with_author.user_id,
                "created_at": msg_with_author.created_at.isoformat(),
                "author": {
                    "id": msg_with_author.author.id,
                    "nom": msg_with_author.author.nom,
                    "email": msg_with_author.author.email
                }
            }
            await manager.broadcast(msg_dict, project_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
    finally:
        db.close()
