import os
import json
import random
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score
)
from xgboost import XGBClassifier

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

def generate_synthetic_dataset(n_samples: int = 2000) -> pd.DataFrame:
    """
    Generates synthetic training dataset modeling realistic return scenarios.
    """
    np.random.seed(42)
    random.seed(42)

    categories = ["Electronics", "Luxury Apparel", "Designer Handbags", "Footwear", "Apparel", "Home & Kitchen"]
    reasons = ["DEFECTIVE", "DOES_NOT_FIT", "CHANGED_MIND", "NOT_AS_DESCRIBED", "WRONG_ITEM"]
    conditions = ["UNOPENED", "OPENED_LIKE_NEW", "USED", "DAMAGED"]
    
    comments_pool = {
        "legit_defect": [
            "Screen flickers and has green lines",
            "Stopped powering on after 2 days",
            "Left speaker makes a buzzing sound",
            "Zipper arrived broken and jammed",
            "Missing power cable and scratches on lens"
        ],
        "wardrobing": [
            "Wore to wedding party over the weekend, no longer needed",
            "Tags removed for event photoshoot, want refund",
            "Used for Saturday dinner, slightly tight",
            "Dress worn once for gala evening, return please",
            "Wore to church event, returned Monday"
        ],
        "sizing": [
            "Size 9 fits too small, need half size up",
            "Sleeves are too long, otherwise nice fabric",
            "Too loose around the waist",
            "Did not fit my shoulders properly"
        ],
        "remorse": [
            "Changed mind, found cheaper elsewhere",
            "ISP provided complimentary router so unneeded",
            "Ordered wrong color variant by accident",
            "Do not need this anymore"
        ]
    }

    condition_score_map = {
        "UNOPENED": 1.0,
        "OPENED_LIKE_NEW": 0.8,
        "USED": 0.4,
        "DAMAGED": 0.2
    }

    data = []
    for i in range(n_samples):
        cat = random.choice(categories)
        is_wardrobe_target = cat in ["Luxury Apparel", "Designer Handbags"]
        is_elec = cat == "Electronics"
        
        # Decide persona
        persona_roll = random.random()
        if persona_roll < 0.22:
            # Serial Wardrober / Abuser
            ret_rate = np.random.uniform(0.50, 0.95)
            wardrobe_score = np.random.uniform(0.70, 0.98)
            wardrobe_flags = random.randint(2, 6)
            batch_defect = np.random.uniform(0.01, 0.03)
            reason = "DEFECTIVE" if random.random() < 0.6 else "CHANGED_MIND"
            comment = random.choice(comments_pool["wardrobing"])
            condition = random.choice(["USED", "OPENED_LIKE_NEW"])
            days = random.randint(3, 28)
            photos = random.random() < 0.15
            is_abuse = 1
        elif persona_roll < 0.38:
            # Defective Batch Victim
            ret_rate = np.random.uniform(0.02, 0.15)
            wardrobe_score = np.random.uniform(0.0, 0.10)
            wardrobe_flags = 0
            batch_defect = np.random.uniform(0.08, 0.25)
            reason = "DEFECTIVE"
            comment = random.choice(comments_pool["legit_defect"])
            condition = random.choice(["OPENED_LIKE_NEW", "DAMAGED"])
            days = random.randint(1, 5)
            photos = random.random() < 0.85
            is_abuse = 0
        else:
            # Honest Standard / Sizing / Remorse
            ret_rate = np.random.uniform(0.02, 0.20)
            wardrobe_score = np.random.uniform(0.0, 0.25)
            wardrobe_flags = 0
            batch_defect = np.random.uniform(0.01, 0.04)
            reason = random.choice(["DOES_NOT_FIT", "CHANGED_MIND", "WRONG_ITEM"])
            comment = random.choice(comments_pool["sizing"] if reason == "DOES_NOT_FIT" else comments_pool["remorse"])
            condition = "UNOPENED" if random.random() < 0.7 else "OPENED_LIKE_NEW"
            days = random.randint(1, 14)
            photos = random.random() < 0.60
            is_abuse = 0

        price = np.random.uniform(40.0, 1200.0) if is_elec or is_wardrobe_target else np.random.uniform(25.0, 300.0)
        cost_price = price * np.random.uniform(0.35, 0.55)
        
        # Salvage rate target
        base_salvage = 0.85 if condition == "UNOPENED" else (0.65 if condition == "OPENED_LIKE_NEW" else (0.35 if condition == "USED" else 0.20))
        salvage_rate = max(0.10, base_salvage - (days * 0.005) - (0.08 if is_elec else 0.0) + np.random.normal(0, 0.02))
        salvage_rate = min(0.85, max(0.10, salvage_rate))

        data.append({
            "return_rate": ret_rate,
            "wardrobe_score": wardrobe_score,
            "wardrobe_flags": wardrobe_flags,
            "batch_defect_rate": batch_defect,
            "price": price,
            "cost_price": cost_price,
            "days_since_delivery": days,
            "photos_provided": 1 if photos else 0,
            "category": cat,
            "stated_reason": reason,
            "claimed_condition": condition,
            "condition_score": condition_score_map.get(condition, 0.6),
            "customer_comment": comment,
            "salvage_rate": salvage_rate,
            "is_abuse": is_abuse
        })

    df = pd.DataFrame(data)
    return df

def train_and_export_models():
    """
    Trains all ML models using proper 80/20 train/test splits, computes evaluation metrics on test sets,
    and exports artifacts and metrics.json to backend/app/ml/artifacts/.
    """
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    csv_path = DATA_DIR / "synthetic_returns.csv"
    if not csv_path.exists():
        print("Generating synthetic returns training dataset...")
        df = generate_synthetic_dataset(2000)
        df.to_csv(csv_path, index=False)
        print(f"Exported synthetic returns dataset to {csv_path}")
    else:
        df = pd.read_csv(csv_path)
        if "condition_score" not in df.columns:
            condition_score_map = {"UNOPENED": 1.0, "OPENED_LIKE_NEW": 0.8, "USED": 0.4, "DAMAGED": 0.2}
            df["condition_score"] = df["claimed_condition"].map(condition_score_map).fillna(0.6)

    total_records = len(df)
    print(f"Loaded dataset with {total_records} records.")

    # 80/20 Stratified Train / Test Split
    train_df, test_df = train_test_split(
        df,
        test_size=0.20,
        random_state=42,
        stratify=df["is_abuse"]
    )
    print(f"Dataset split: {len(train_df)} Training samples, {len(test_df)} Test samples.")

    metrics_report = {
        "dataset_type": "Synthetic Retail Returns Benchmark",
        "total_records": total_records,
        "train_records": len(train_df),
        "test_records": len(test_df),
        "models": {}
    }

    # =========================================================================
    # 1. Train Reason NLP Classifier (TF-IDF + Logistic Regression)
    # =========================================================================
    print("\n--- Training Component 1: Return-Reason NLP Classifier ---")
    tfidf = TfidfVectorizer(max_features=500, stop_words="english", ngram_range=(1, 2))
    X_train_text = tfidf.fit_transform(train_df["customer_comment"].fillna(""))
    X_test_text = tfidf.transform(test_df["customer_comment"].fillna(""))

    nlp_model = LogisticRegression(C=1.0, max_iter=1000, random_state=42)
    nlp_model.fit(X_train_text, train_df["is_abuse"])

    y_pred_nlp = nlp_model.predict(X_test_text)
    y_prob_nlp = nlp_model.predict_proba(X_test_text)[:, 1]

    nlp_metrics = {
        "model_name": "TF-IDF (500 max features, 1-2 ngrams) + Logistic Regression",
        "task": "Binary Comment Semantics Classification",
        "accuracy": round(float(accuracy_score(test_df["is_abuse"], y_pred_nlp)), 4),
        "precision": round(float(precision_score(test_df["is_abuse"], y_pred_nlp)), 4),
        "recall": round(float(recall_score(test_df["is_abuse"], y_pred_nlp)), 4),
        "f1": round(float(f1_score(test_df["is_abuse"], y_pred_nlp)), 4),
        "roc_auc": round(float(roc_auc_score(test_df["is_abuse"], y_prob_nlp)), 4)
    }
    metrics_report["models"]["return_reason_nlp"] = nlp_metrics
    print(f"NLP Test Metrics: Accuracy={nlp_metrics['accuracy']}, F1={nlp_metrics['f1']}, ROC-AUC={nlp_metrics['roc_auc']}")

    joblib.dump(
        {"vectorizer": tfidf, "model": nlp_model, "metrics": nlp_metrics},
        ARTIFACTS_DIR / "reason_classifier.joblib"
    )

    # =========================================================================
    # 2. Train Return-Abuse Risk Model (XGBoost)
    # =========================================================================
    print("\n--- Training Component 4: Return-Abuse Risk Model (XGBoost) ---")
    feature_cols = [
        "return_rate", "wardrobe_score", "wardrobe_flags", "batch_defect_rate",
        "price", "days_since_delivery", "photos_provided"
    ]
    X_train_tab = train_df[feature_cols]
    X_test_tab = test_df[feature_cols]

    xgb_model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.08,
        eval_metric="logloss",
        random_state=42
    )
    xgb_model.fit(X_train_tab, train_df["is_abuse"])

    y_pred_xgb = xgb_model.predict(X_test_tab)
    y_prob_xgb = xgb_model.predict_proba(X_test_tab)[:, 1]

    xgb_metrics = {
        "model_name": "XGBoost Classifier (100 estimators, max depth 4, lr 0.08)",
        "task": "Return Abuse Risk Prediction",
        "features": feature_cols,
        "accuracy": round(float(accuracy_score(test_df["is_abuse"], y_pred_xgb)), 4),
        "precision": round(float(precision_score(test_df["is_abuse"], y_pred_xgb)), 4),
        "recall": round(float(recall_score(test_df["is_abuse"], y_pred_xgb)), 4),
        "f1": round(float(f1_score(test_df["is_abuse"], y_pred_xgb)), 4),
        "roc_auc": round(float(roc_auc_score(test_df["is_abuse"], y_prob_xgb)), 4)
    }
    metrics_report["models"]["return_abuse_xgboost"] = xgb_metrics
    print(f"XGBoost Test Metrics: Accuracy={xgb_metrics['accuracy']}, F1={xgb_metrics['f1']}, ROC-AUC={xgb_metrics['roc_auc']}")

    joblib.dump(
        {"model": xgb_model, "feature_names": feature_cols, "metrics": xgb_metrics},
        ARTIFACTS_DIR / "abuse_risk.joblib"
    )

    # =========================================================================
    # 3. Train Resale-Value Regressor (Gradient Boosting)
    # =========================================================================
    print("\n--- Training Component 5: Resale-Value Regressor ---")
    resale_feature_cols = [
        "price", "cost_price", "days_since_delivery", "photos_provided",
        "batch_defect_rate", "condition_score"
    ]
    X_train_resale = train_df[resale_feature_cols]
    X_test_resale = test_df[resale_feature_cols]

    resale_model = GradientBoostingRegressor(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.05,
        random_state=42
    )
    resale_model.fit(X_train_resale, train_df["salvage_rate"])

    y_pred_salvage = resale_model.predict(X_test_resale)

    mae = float(mean_absolute_error(test_df["salvage_rate"], y_pred_salvage))
    rmse = float(np.sqrt(mean_squared_error(test_df["salvage_rate"], y_pred_salvage)))
    r2 = float(r2_score(test_df["salvage_rate"], y_pred_salvage))

    resale_metrics = {
        "model_name": "Gradient Boosting Regressor (100 estimators, max depth 4, lr 0.05)",
        "task": "Continuous Resale Salvage Rate Estimation",
        "features": resale_feature_cols,
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2_score": round(r2, 4)
    }
    metrics_report["models"]["resale_value_regressor"] = resale_metrics
    print(f"Resale Regressor Test Metrics: MAE={resale_metrics['mae']}, RMSE={resale_metrics['rmse']}, R2={resale_metrics['r2_score']}")

    joblib.dump(
        {"model": resale_model, "feature_names": resale_feature_cols, "metrics": resale_metrics},
        ARTIFACTS_DIR / "resale_value.joblib"
    )

    # =========================================================================
    # 4. Record Deterministic Components in Report
    # =========================================================================
    metrics_report["models"]["customer_behavior_model"] = {
        "type": "Deterministic Weighted Scoring Formula",
        "algorithm": "0.60 * return_rate_velocity + 0.25 * wardrober_score + 0.15 * flags",
        "metrics": "N/A (Deterministic Formula)"
    }
    metrics_report["models"]["product_defect_model"] = {
        "type": "Deterministic Anomaly & Likelihood Formula",
        "algorithm": "0.50 * batch_defect_rate + 0.30 * sku_rate + keyword_boosts",
        "metrics": "N/A (Deterministic Formula)"
    }
    metrics_report["models"]["expected_loss_engine"] = {
        "type": "Deterministic Financial Expected-Loss Payoff Matrix & Decision Optimizer",
        "algorithm": "Pure Mathematical Accounting & Customer Friction Loss Minimization",
        "metrics": "N/A (Deterministic Accounting Engine)"
    }

    # Save metrics.json
    metrics_json_path = ARTIFACTS_DIR / "metrics.json"
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_report, f, indent=2)
    print(f"\nAll models trained and verified! Evaluation report written to: {metrics_json_path}")

if __name__ == "__main__":
    train_and_export_models()
