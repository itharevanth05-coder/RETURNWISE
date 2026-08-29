import pytest
import numpy as np
import pandas as pd
from app.ml.preprocessing.pipeline import FeaturePreprocessor
from app.ml.preprocessing.data_loader import DataLoader
from app.ml.preprocessing.schemas import COMPONENTS_SPEC, TargetStatus

def test_components_registry():
    assert len(COMPONENTS_SPEC) == 6
    assert COMPONENTS_SPEC[4].target_status == TargetStatus.AVAILABLE
    assert COMPONENTS_SPEC[5].target_status == TargetStatus.AVAILABLE
    assert COMPONENTS_SPEC[6].target_status == TargetStatus.DETERMINISTIC_CALCULATION

def test_data_loader_csv():
    df = DataLoader.load_csv_dataset()
    assert len(df) >= 1000
    assert "is_abuse" in df.columns
    assert "salvage_rate" in df.columns
    assert "stated_reason" in df.columns

def test_data_loader_db():
    df = DataLoader.load_db_dataset()
    assert len(df) > 0
    assert "return_ref" in df.columns
    assert "price" in df.columns

def test_preprocessing_missing_values_and_unseen_categories():
    # Synthetic train df
    train_data = {
        "return_rate": [0.1, 0.5, np.nan],
        "wardrobe_score": [0.0, 0.8, 0.2],
        "wardrobe_flags": [0, 3, 1],
        "batch_defect_rate": [0.01, 0.02, np.nan],
        "price": [100.0, 500.0, 200.0],
        "cost_price": [40.0, 200.0, 80.0],
        "days_since_delivery": [2, 25, 5],
        "photos_provided": [1, 0, 1],
        "category": ["Electronics", "Apparel", "Footwear"],
        "stated_reason": ["DEFECTIVE", "CHANGED_MIND", "DOES_NOT_FIT"],
        "claimed_condition": ["UNOPENED", "USED", "OPENED_LIKE_NEW"],
        "customer_comment": [
            "Screen cracked and broken",
            "Wore to wedding party on weekend",
            "Size fits slightly small"
        ],
        "is_abuse": [0, 1, 0]
    }
    train_df = pd.DataFrame(train_data)

    preprocessor = FeaturePreprocessor(include_tfidf=False)
    X_train = preprocessor.fit_transform(train_df)
    assert X_train.shape[0] == 3
    assert not np.isnan(X_train).any()

    # Test with unseen category & missing values
    test_data = {
        "return_rate": [np.nan],
        "wardrobe_score": [np.nan],
        "wardrobe_flags": [np.nan],
        "batch_defect_rate": [np.nan],
        "price": [np.nan],
        "cost_price": [np.nan],
        "days_since_delivery": [np.nan],
        "photos_provided": [np.nan],
        "category": ["NEW_UNSEEN_CATEGORY"],
        "stated_reason": ["NEW_REASON"],
        "claimed_condition": [np.nan],
        "customer_comment": [None],
        "is_abuse": [0]
    }
    test_df = pd.DataFrame(test_data)
    X_test = preprocessor.transform(test_df)
    assert X_test.shape[0] == 1
    assert X_test.shape[1] == X_train.shape[1]
    assert not np.isnan(X_test).any()

def test_train_val_test_split_and_leakage():
    df = DataLoader.load_csv_dataset()
    preprocessor = FeaturePreprocessor(include_tfidf=True, max_tfidf_features=20)
    
    splits = preprocessor.prepare_splits(
        df,
        target_col="is_abuse",
        test_size=0.15,
        val_size=0.15,
        random_state=42
    )

    n_total = len(df)
    n_train = len(splits.X_train)
    n_val = len(splits.X_val)
    n_test = len(splits.X_test)

    assert n_train + n_val + n_test == n_total
    assert n_train == pytest.approx(0.70 * n_total, abs=5)
    assert n_val == pytest.approx(0.15 * n_total, abs=5)
    assert n_test == pytest.approx(0.15 * n_total, abs=5)

    # Dimensionality check
    n_features = len(splits.feature_names)
    assert splits.X_train.shape[1] == n_features
    assert splits.X_val.shape[1] == n_features
    assert splits.X_test.shape[1] == n_features

    # Leakage check
    leakage = FeaturePreprocessor.verify_no_leakage(
        train_df=pd.DataFrame({"x": range(n_train)}),
        val_df=pd.DataFrame({"x": range(n_val)}),
        test_df=pd.DataFrame({"x": range(n_test)}),
        X_train=splits.X_train,
        X_val=splits.X_val,
        X_test=splits.X_test,
        feature_names=splits.feature_names,
        target_col="is_abuse"
    )

    assert leakage["all_passed"] is True
    assert leakage["target_not_in_features"] is True
    assert leakage["no_id_columns_leaked"] is True
