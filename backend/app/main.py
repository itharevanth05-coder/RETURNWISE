from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.db.base import Base
from app.db.session import engine
from app.db.seed_data import seed_database
from app.api.v1 import returns, investigate, simulate, analytics, customers, products, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed initial database
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous E-Commerce Returns Investigator API",
    lifespan=lifespan
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(health.router, prefix=f"{settings.API_V1_STR}/health", tags=["Health"])
app.include_router(returns.router, prefix=f"{settings.API_V1_STR}/returns", tags=["Returns"])
app.include_router(investigate.router, prefix=f"{settings.API_V1_STR}/investigate", tags=["Investigation"])
app.include_router(simulate.router, prefix=f"{settings.API_V1_STR}/simulate", tags=["Simulation"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
app.include_router(customers.router, prefix=f"{settings.API_V1_STR}/customers", tags=["Customers"])
app.include_router(products.router, prefix=f"{settings.API_V1_STR}/products", tags=["Products"])

@app.get("/ml-metrics", tags=["Analytics"])
def ml_metrics_root():
    import json
    from pathlib import Path
    metrics_path = Path(__file__).resolve().parent / "ml" / "artifacts" / "metrics.json"
    if metrics_path.exists():
        with open(metrics_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"status": "Metrics report not found."}

@app.get("/")
def root():
    return {
        "service": "RETURNWISE API",
        "status": "online",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_url": "/health",
        "ml_metrics_url": "/ml-metrics"
    }
