from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@db:5432/{os.getenv('DB_NAME')}"
)
# Jeśli uruchamiasz lokalnie, a w ENV jest "db", zamień na "localhost"
if DATABASE_URL and "@db:" in DATABASE_URL:
    # Sprawdza czy nie jesteś w kontenerze (kontenery Dockera mają zazwyczaj plik .dockerenv)
    if not os.path.exists("/.dockerenv"):
        DATABASE_URL = DATABASE_URL.replace("@db:", "@localhost:")

print(f"DEBUG: Aktywny URL bazy: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# This function gives us a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()