from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        conn.execute(text('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITHOUT TIME ZONE'))
        conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500)'))
        conn.commit()
        print("Migrations completed successfully.")

if __name__ == "__main__":
    migrate()
