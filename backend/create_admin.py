import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

import bcrypt
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")

EMAIL = "tarik@gmail.com"
PASSWORD = "Tarik@3333"
NOM = "Tarik"
ROLE = "admin"

hashed = bcrypt.hashpw(PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": EMAIL})
    row = result.fetchone()

    if row:
        conn.execute(
            text("UPDATE users SET password = :pwd, role = :role WHERE email = :email"),
            {"pwd": hashed, "role": ROLE, "email": EMAIL}
        )
        conn.commit()
        print("OK - Compte mis a jour : " + EMAIL + " role=" + ROLE)
    else:
        conn.execute(
            text("INSERT INTO users (nom, email, password, role) VALUES (:nom, :email, :pwd, :role)"),
            {"nom": NOM, "email": EMAIL, "pwd": hashed, "role": ROLE}
        )
        conn.commit()
        print("OK - Compte admin cree : " + EMAIL + " / " + PASSWORD + " role=" + ROLE)

    # Verify
    res2 = conn.execute(text("SELECT id, nom, email, role FROM users WHERE email = :email"), {"email": EMAIL})
    u = res2.fetchone()
    if u:
        print("Verification : id=" + str(u[0]) + " nom=" + u[1] + " email=" + u[2] + " role=" + u[3])
