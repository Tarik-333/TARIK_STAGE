from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import cloudinary
import cloudinary.uploader


from database import get_db
import models, schemas

router = APIRouter(prefix="/auth", tags=["Authentication"])

cloudinary.config(
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
  api_key = os.getenv('CLOUDINARY_API_KEY'),
  api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

SECRET_KEY = os.environ.get("SECRET_KEY")
ALGORITHM = os.environ.get("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
MAIL_FROM = os.environ.get("MAIL_FROM", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be set in environment variables.")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # Bcrypt limit is 72 bytes. 50 characters is safe even with special chars.
    return pwd_context.hash(password[:50])

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_from_token(token: str, db: Session) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return get_user_from_token(token, db)

def send_reset_email(to_email: str, reset_link: str, user_name: str):
    """Send password reset email via Gmail SMTP."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "ValaFlow — Réinitialisation de votre mot de passe"
        msg["From"] = f"ValaFlow <{MAIL_FROM}>"
        msg["To"] = to_email

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
                .header {{ background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); padding: 40px 32px; text-align: center; }}
                .logo-wrap {{ display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.07); border-radius: 20px; padding: 14px; margin-bottom: 16px; }}
                .header h1 {{ color: white; margin: 8px 0 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }}
                .header p {{ color: rgba(255,255,255,0.65); margin: 8px 0 0; font-size: 14px; }}
                .body {{ padding: 40px 32px; }}
                .body p {{ color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }}
                .button {{ display: block; width: fit-content; margin: 32px auto; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white !important; text-decoration: none; padding: 16px 40px; border-radius: 16px; font-weight: 800; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 8px 20px rgba(37,99,235,0.35); }}
                .link-box {{ background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 16px 0; word-break: break-all; font-size: 12px; color: #64748b; }}
                .footer {{ background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }}
                .footer p {{ color: #94a3b8; font-size: 12px; margin: 0; }}
                .expire {{ background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #92400e; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://res.cloudinary.com/dfa2nvo9f/image/upload/v1778005675/valaflow/logo.png" 
                         width="80" height="80" alt="ValaFlow Logo"
                         style="margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;" />
                    <h1>ValaFlow</h1>
                    <p>Réinitialisation de mot de passe</p>
                </div>
                <div class="body">
                    <p>Bonjour <strong>{user_name}</strong>,</p>
                    <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte ValaFlow associé à <strong>{to_email}</strong>.</p>
                    <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                    <a href="{reset_link}" class="button">Réinitialiser mon mot de passe</a>
                    <div class="expire">
                        ⏱️ Ce lien est valable pendant <strong>1 heure</strong> uniquement.
                    </div>
                    <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
                    <div class="link-box">{reset_link}</div>
                    <p>Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe reste inchangé.</p>
                </div>
                <div class="footer">
                    <p>© 2026 ValaFlow · Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                </div>
            </div>
        </body>
        </html>

        """

        part = MIMEText(html_body, "html", "utf-8")
        msg.attach(part)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.sendmail(MAIL_FROM, to_email, msg.as_string())

        print(f"[EMAIL SENT] Reset email sent to {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {to_email}: {e}")
        return False

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if user already exists
        existing_user = db.query(models.User).filter(models.User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="L'email est déjà utilisé")
            
        hashed_password = get_password_hash(user.password)
        new_user = models.User(nom=user.nom, email=user.email, password=hashed_password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"SUCCESS: User {user.email} created.")
        return new_user
    except Exception as e:
        print(f"CRITICAL ERROR DURING REGISTRATION: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # form_data.username is actually the email for us
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants incorrects", headers={"WWW-Authenticate": "Bearer"})
    if not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants incorrects", headers={"WWW-Authenticate": "Bearer"})
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me/profile_picture", response_model=schemas.UserResponse)
def upload_profile_picture(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(file.file, folder=f"projectflow/profiles/{current_user.id}", resource_type="image")
        
        # Update user profile picture URL
        current_user.profile_picture = result.get("secure_url")
        db.commit()
        db.refresh(current_user)
        return current_user
    except Exception as e:
        print("Upload Error:", e)
        raise HTTPException(status_code=500, detail="Erreur lors de l'upload vers Cloudinary. Vérifiez vos clés API.")

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # Don't reveal if email exists or not (security)
        return {"message": "Si l'adresse email existe, un lien de réinitialisation a été envoyé."}
        
    # Generate a reset token valid for 1 hour
    expire = datetime.utcnow() + timedelta(hours=1)
    to_encode = {"sub": user.email, "exp": expire, "type": "reset_password"}
    reset_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    # Send email in background so API responds quickly
    background_tasks.add_task(send_reset_email, user.email, reset_link, user.nom)
    
    return {"message": "Si l'adresse email existe, un lien de réinitialisation a été envoyé."}

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Lien de réinitialisation invalide ou expiré"
    )
    try:
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "reset_password":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise credentials_exception
        
    # Update password
    hashed_password = get_password_hash(request.new_password)
    user.password = hashed_password
    db.commit()
    
    return {"message": "Mot de passe mis à jour avec succès"}

from typing import List
@router.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seul un admin peut lister les utilisateurs")
    return db.query(models.User).all()

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, new_role: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Action réservée aux admins")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    user.role = new_role
    db.commit()
    return {"message": "Rôle mis à jour"}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Action réservée aux admins")
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous supprimer vous-même")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Optional: nullify references in tasks instead of deleting tasks
    db.query(models.Task).filter(models.Task.assignee_id == user_id).update({"assignee_id": None})
    
    db.delete(user)
    db.commit()
    return {"message": "Utilisateur supprimé"}

