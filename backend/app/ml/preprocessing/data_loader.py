import os
from pathlib import Path
from typing import Optional, Tuple
import pandas as pd
from sqlalchemy import create_engine
from app.config import settings

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"

class DataLoader:
    """
    Unified Data Ingestion Layer for ReturnWise ML Pipelines.
    Loads and standardizes records from CSV datasets or the SQLite database.
    """

    @staticmethod
    def load_csv_dataset(csv_path: Optional[str] = None) -> pd.DataFrame:
        """
        Loads the structured returns dataset from CSV.
        """
        if csv_path is None:
            csv_path = str(DATA_DIR / "synthetic_returns.csv")
        
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Dataset CSV not found at: {csv_path}")
            
        df = pd.read_csv(csv_path)
        return df

    @staticmethod
    def load_db_dataset(db_url: Optional[str] = None) -> pd.DataFrame:
        """
        Extracts tabular returns dataset by joining Customer, Product, Order,
        and ReturnRequest entities from the SQLite database.
        """
        if db_url is None:
            db_url = settings.normalized_database_url

        connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
        engine = create_engine(db_url, connect_args=connect_args)

        query = """
        SELECT
            rr.id AS return_id,
            rr.return_ref,
            rr.days_since_delivery,
            rr.stated_reason,
            rr.customer_comment,
            rr.claimed_condition,
            rr.photos_provided,
            c.id AS customer_id,
            c.return_rate,
            c.serial_wardrober_score AS wardrobe_score,
            c.wardrobing_flag_count AS wardrobe_flags,
            c.total_orders,
            c.total_spend,
            c.total_returns,
            c.ltv_tier,
            p.id AS product_id,
            p.price,
            p.cost_price,
            p.category,
            p.batch_defect_rate,
            p.historical_return_rate,
            p.is_high_shrink,
            p.requires_serial_check,
            p.expected_salvage_rate AS salvage_rate,
            d.risk_category,
            d.abuse_probability,
            d.defect_probability,
            d.selected_action,
            d.loss_prevented
        FROM return_requests rr
        JOIN customers c ON rr.customer_id = c.id
        JOIN products p ON rr.product_id = p.id
        LEFT JOIN decisions d ON rr.id = d.return_id
        """

        with engine.connect() as conn:
            df = pd.read_sql_query(query, conn)
            
        return df
