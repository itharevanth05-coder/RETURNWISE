from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "RETURNWISE"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/returnwise.db"
    
    # Financial Decision Engine Defaults
    INSPECTION_COST_DEFAULT: float = 15.0  # Cost in $ to physically inspect a return
    RESTOCKING_FEE_RATE: float = 0.15     # 15% restocking fee if applicable
    CUSTOMER_FRICTION_WEIGHT: float = 0.4 # Weight of customer dissatisfaction in loss objective
    ESCALATION_OVERHEAD_COST: float = 25.0 # Cost of manual fraud agent review
    
    # Risk Thresholds
    LEGITIMATE_THRESHOLD: float = 0.35
    ABUSE_THRESHOLD: float = 0.65
    
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def normalized_database_url(self) -> str:
        """
        Normalizes PostgreSQL connection URLs (e.g. postgres:// -> postgresql://)
        and returns the active database connection string.
        """
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

settings = Settings()
