"""
train_models.py
---------------
Trains and persists all machine-learning models required by the Healthcare
Recommendation System.

Models trained
--------------
1. disease_classifier  — RandomForestClassifier (primary) vs XGBoostClassifier
                         (secondary); the better-performing model is saved.
2. risk_predictor      — GradientBoostingRegressor that predicts a risk score
                         (0–100) from demographic + symptom features.

Artefacts saved to ./models/
- disease_classifier.pkl
- risk_predictor.pkl
- label_encoder.pkl
- feature_names.pkl   (dict with 'symptom_features' and 'all_features' keys)

Run with: python train_models.py
"""

import json
import logging
import os
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    mean_absolute_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# XGBoost is optional — we handle ImportError gracefully
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "..", "data")
MODELS_DIR = os.path.join(SCRIPT_DIR, "models")
TRAIN_DATA_PATH = os.path.join(DATA_DIR, "patient_data.csv")
CONFIG_PATH = os.path.join(DATA_DIR, "diseases_config.json")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
TEST_SIZE = 0.20
RANDOM_STATE = 42
RF_N_ESTIMATORS = 200
RF_MAX_DEPTH = 15
GBR_N_ESTIMATORS = 200
GBR_LEARNING_RATE = 0.05
GBR_MAX_DEPTH = 6

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_data(path: str) -> pd.DataFrame:
    """Load the patient CSV; exit with an informative message if missing."""
    if not os.path.exists(path):
        logger.error(
            "Training data not found at %s — run data_generator.py first.", path
        )
        sys.exit(1)
    df = pd.read_csv(path)
    logger.info("Loaded training data: %s rows × %s cols", *df.shape)
    return df


def load_symptom_list(config_path: str) -> list:
    """Return the ordered list of symptom column names from diseases_config.json."""
    with open(config_path, "r", encoding="utf-8") as fh:
        config = json.load(fh)
    return config["symptoms"]


def encode_gender_series(series: pd.Series) -> pd.Series:
    """Encode gender strings to float values."""
    mapping = {"M": 0.0, "F": 1.0, "Other": 0.5}
    return series.map(mapping).fillna(0.5)


def build_feature_matrices(df: pd.DataFrame, symptom_features: list):
    """
    Build feature matrices for both models.

    Returns
    -------
    X_symptoms : pd.DataFrame — 40 binary symptom columns (for disease classifier)
    X_all      : pd.DataFrame — demographics + symptoms (for risk predictor)
    y_disease  : pd.Series    — disease label strings
    y_risk     : pd.Series    — continuous risk scores
    """
    # Symptom-only feature matrix
    X_symptoms = df[symptom_features].astype(float)

    # All-features matrix for risk predictor
    X_all = df[symptom_features].astype(float).copy()
    X_all["age"] = df["age"].astype(float)
    X_all["gender_enc"] = encode_gender_series(df["gender"])
    X_all["bmi"] = df["bmi"].astype(float)
    X_all["bp_systolic"] = df["blood_pressure_systolic"].astype(float)
    X_all["bp_diastolic"] = df["blood_pressure_diastolic"].astype(float)

    y_disease = df["disease"]
    y_risk = df["risk_score"].astype(float)

    return X_symptoms, X_all, y_disease, y_risk


# ---------------------------------------------------------------------------
# Model trainers
# ---------------------------------------------------------------------------

def train_disease_classifier(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
    label_encoder: LabelEncoder,
) -> object:
    """
    Train a RandomForest and (if available) an XGBoost classifier.

    The model with the higher test-set accuracy is returned and saved.

    Parameters
    ----------
    X_train, X_test : Feature matrices
    y_train, y_test : Encoded integer labels
    label_encoder   : Fitted LabelEncoder used to decode predictions

    Returns
    -------
    best_clf : The winning classifier
    """
    logger.info("Training RandomForestClassifier …")
    rf_clf = RandomForestClassifier(
        n_estimators=RF_N_ESTIMATORS,
        max_depth=RF_MAX_DEPTH,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    rf_clf.fit(X_train, y_train)
    rf_pred = rf_clf.predict(X_test)
    rf_acc = accuracy_score(y_test, rf_pred)
    logger.info("RandomForest accuracy : %.4f", rf_acc)

    best_clf = rf_clf
    best_acc = rf_acc
    best_name = "RandomForest"

    if XGBOOST_AVAILABLE:
        logger.info("Training XGBoostClassifier …")
        # XGBoost requires integer labels starting at 0
        xgb_clf = XGBClassifier(
            n_estimators=RF_N_ESTIMATORS,
            max_depth=RF_MAX_DEPTH,
            learning_rate=0.05,
            use_label_encoder=False,
            eval_metric="mlogloss",
            random_state=RANDOM_STATE,
            n_jobs=-1,
            verbosity=0,
        )
        xgb_clf.fit(X_train, y_train)
        xgb_pred = xgb_clf.predict(X_test)
        xgb_acc = accuracy_score(y_test, xgb_pred)
        logger.info("XGBoost accuracy      : %.4f", xgb_acc)

        if xgb_acc > best_acc:
            best_clf = xgb_clf
            best_acc = xgb_acc
            best_name = "XGBoost"
    else:
        logger.warning("XGBoost not available — skipping XGBoost training.")

    logger.info("Selected classifier: %s (accuracy=%.4f)", best_name, best_acc)

    # Full classification report with the best model
    best_pred = best_clf.predict(X_test)
    target_names = list(label_encoder.classes_)
    report = classification_report(y_test, best_pred, target_names=target_names)
    logger.info("Classification report:\n%s", report)

    return best_clf


def train_risk_predictor(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
) -> GradientBoostingRegressor:
    """
    Train a GradientBoostingRegressor for risk score prediction.

    Parameters
    ----------
    X_train, X_test : Feature matrices (demographics + symptoms)
    y_train, y_test : Continuous risk scores

    Returns
    -------
    gbr : Fitted GradientBoostingRegressor
    """
    logger.info("Training GradientBoostingRegressor for risk score …")
    gbr = GradientBoostingRegressor(
        n_estimators=GBR_N_ESTIMATORS,
        learning_rate=GBR_LEARNING_RATE,
        max_depth=GBR_MAX_DEPTH,
        random_state=RANDOM_STATE,
        subsample=0.8,
        min_samples_leaf=5,
    )
    gbr.fit(X_train, y_train)
    preds = gbr.predict(X_test)

    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    logger.info("Risk predictor — MAE: %.4f | R²: %.4f", mae, r2)

    return gbr


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    """Entry point: loads data, trains models, and saves artefacts."""
    os.makedirs(MODELS_DIR, exist_ok=True)

    # ---- Load data ----
    df = load_data(TRAIN_DATA_PATH)
    symptom_features = load_symptom_list(CONFIG_PATH)

    # ---- Feature engineering ----
    X_symptoms, X_all, y_disease_str, y_risk = build_feature_matrices(df, symptom_features)

    # ---- Encode disease labels ----
    label_encoder = LabelEncoder()
    y_disease_enc = label_encoder.fit_transform(y_disease_str)
    logger.info("Disease classes: %s", list(label_encoder.classes_))

    # ---- Train/test split ----
    (
        X_sym_train, X_sym_test,
        y_dis_train, y_dis_test,
        X_all_train, X_all_test,
        y_risk_train, y_risk_test,
    ) = train_test_split(
        X_symptoms, y_disease_enc, X_all, y_risk,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y_disease_enc,
    )

    logger.info(
        "Split — train: %d | test: %d",
        len(X_sym_train), len(X_sym_test),
    )

    # ---- Train disease classifier ----
    disease_clf = train_disease_classifier(
        X_sym_train, X_sym_test,
        y_dis_train, y_dis_test,
        label_encoder,
    )

    # ---- Train risk predictor ----
    risk_predictor = train_risk_predictor(
        X_all_train, X_all_test,
        y_risk_train, y_risk_test,
    )

    # ---- Feature name registry ----
    all_feature_names = list(X_all.columns)
    feature_names = {
        "symptom_features": symptom_features,
        "all_features": all_feature_names,
    }

    # ---- Persist artefacts ----
    clf_path = os.path.join(MODELS_DIR, "disease_classifier.pkl")
    risk_path = os.path.join(MODELS_DIR, "risk_predictor.pkl")
    enc_path = os.path.join(MODELS_DIR, "label_encoder.pkl")
    feat_path = os.path.join(MODELS_DIR, "feature_names.pkl")

    joblib.dump(disease_clf, clf_path)
    logger.info("disease_classifier saved → %s", clf_path)

    joblib.dump(risk_predictor, risk_path)
    logger.info("risk_predictor saved     → %s", risk_path)

    joblib.dump(label_encoder, enc_path)
    logger.info("label_encoder saved      → %s", enc_path)

    joblib.dump(feature_names, feat_path)
    logger.info("feature_names saved      → %s", feat_path)

    # ---- Training summary ----
    logger.info("\n============================")
    logger.info("       TRAINING SUMMARY     ")
    logger.info("============================")
    logger.info("Training samples : %d", len(X_sym_train))
    logger.info("Test samples     : %d", len(X_sym_test))
    logger.info("Disease classes  : %d  → %s", len(label_encoder.classes_), list(label_encoder.classes_))
    logger.info("Symptom features : %d", len(symptom_features))
    logger.info("All features     : %d", len(all_feature_names))
    logger.info("Models saved to  : %s", MODELS_DIR)
    logger.info("============================\n")


if __name__ == "__main__":
    main()
