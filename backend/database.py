import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    print(f"DEBUG: DATABASE_URL found (starts with {DATABASE_URL[:15]}...)")
else:
    print("DEBUG: DATABASE_URL NOT FOUND in environment variables!")
    # Fallback for local dev
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/projectflow"

engine = create_engine(DATABASE_URL)
print("DEBUG: SQLAlchemy engine created.")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
