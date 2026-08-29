from typing import Generator
from app.db.session import SessionLocal
from app.agent.investigator import investigator_agent

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
