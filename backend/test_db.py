import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERREUR: DATABASE_URL non trouvée.")
    exit(1)

print(f"Connexion à: {DATABASE_URL[:20]}...")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("SUCCÈS: La connexion à Neon fonctionne parfaitement !")
except Exception as e:
    print(f"ERREUR DE CONNEXION: {e}")
