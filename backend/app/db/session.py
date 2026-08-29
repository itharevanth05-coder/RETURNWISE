from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

db_url = settings.normalized_database_url

# Configure database engine based on dialect (PostgreSQL vs SQLite)
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        echo=False
    )
else:
    # Production PostgreSQL connection settings with connection pooling & pre-ping
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
