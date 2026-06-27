"""
data_generator.py
-----------------
Generates synthetic patient records for training the healthcare ML models.

Each record includes:
- Demographic features: patient_id, age, gender, bmi, blood_pressure_systolic,
  blood_pressure_diastolic
- Binary symptom features (0 or 1) for all 40 symptoms defined in diseases_config.json
- disease label (target class)
- risk_score (regression target, 0–100)

Disease distribution is balanced — each disease class receives the same number of records.

Run with: python data_generator.py
"""

import json
import os
import sys
import logging
import random

import numpy as np
import pandas as pd

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
CONFIG_PATH = os.path.join(DATA_DIR, "diseases_config.json")
OUTPUT_TRAIN = os.path.join(DATA_DIR, "patient_data.csv")
OUTPUT_TEST = os.path.join(DATA_DIR, "test_data.csv")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
TOTAL_TRAIN_RECORDS = 2500
TOTAL_TEST_RECORDS = 500

# Symptom probability parameters
PRIMARY_SYMPTOM_PROB_LOW = 0.80
PRIMARY_SYMPTOM_PROB_HIGH = 0.95
SECONDARY_SYMPTOM_PROB_LOW = 0.40
SECONDARY_SYMPTOM_PROB_HIGH = 0.65
NOISE_PROB_LOW = 0.05
NOISE_PROB_HIGH = 0.15

# Risk-score weights
RISK_AGE_WEIGHT = 30.0      # age/80 * 30  → 0–30
RISK_BMI_WEIGHT = 20.0      # normalised BMI contribution → 0–20
RISK_SYMPTOM_WEIGHT = 40.0  # total symptom severity → 0–40
RISK_NOISE_STD = 5.0        # Gaussian noise sigma


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_config(path: str) -> dict:
    """Load and return the diseases configuration JSON."""
    if not os.path.exists(path):
        logger.error("diseases_config.json not found at: %s", path)
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as fh:
        config = json.load(fh)
    logger.info("Loaded %d diseases from config.", len(config["diseases"]))
    return config


def encode_gender(gender: str) -> float:
    """Encode gender as a float for the regression model."""
    mapping = {"M": 0.0, "F": 1.0, "Other": 0.5}
    return mapping.get(gender, 0.5)


def compute_bmi_risk(bmi: float) -> float:
    """
    Compute a BMI-based risk component normalised to [0, 20].

    Under-weight (<18.5): moderate risk
    Normal (18.5–24.9):  low risk
    Over-weight (25–29.9): elevated risk
    Obese (≥30): high risk
    """
    if bmi < 18.5:
        return 10.0
    elif bmi < 25.0:
        return 2.0
    elif bmi < 30.0:
        return 10.0
    elif bmi < 35.0:
        return 15.0
    else:
        return 20.0


def compute_symptom_severity(symptom_row: dict, disease: dict, all_symptoms: list) -> float:
    """
    Compute a weighted symptom severity score in [0, 40].

    Primary symptoms active: +3 each (up to full cap)
    Secondary symptoms active: +1.5 each
    Random symptoms active: +0.5 each
    Result is then scaled to [0, 40].
    """
    primary = set(disease.get("primary_symptoms", []))
    secondary = set(disease.get("secondary_symptoms", []))

    raw = 0.0
    max_raw = len(primary) * 3 + len(secondary) * 1.5 + (len(all_symptoms) - len(primary) - len(secondary)) * 0.5

    for sym in all_symptoms:
        if symptom_row.get(sym, 0) == 1:
            if sym in primary:
                raw += 3.0
            elif sym in secondary:
                raw += 1.5
            else:
                raw += 0.5

    if max_raw == 0:
        return 0.0
    return min((raw / max_raw) * RISK_SYMPTOM_WEIGHT, RISK_SYMPTOM_WEIGHT)


def generate_symptom_row(disease: dict, all_symptoms: list, rng: np.random.Generator) -> dict:
    """
    Generate a realistic binary symptom row for the given disease.

    Primary symptoms have 80–95% probability of being 1.
    Secondary symptoms have 40–65% probability.
    All other symptoms have 5–15% probability (noise).
    """
    primary = set(disease.get("primary_symptoms", []))
    secondary = set(disease.get("secondary_symptoms", []))

    row: dict = {}
    for sym in all_symptoms:
        if sym in primary:
            p = rng.uniform(PRIMARY_SYMPTOM_PROB_LOW, PRIMARY_SYMPTOM_PROB_HIGH)
        elif sym in secondary:
            p = rng.uniform(SECONDARY_SYMPTOM_PROB_LOW, SECONDARY_SYMPTOM_PROB_HIGH)
        else:
            p = rng.uniform(NOISE_PROB_LOW, NOISE_PROB_HIGH)
        row[sym] = int(rng.random() < p)
    return row


def generate_records(
    config: dict,
    n_total: int,
    seed: int = 42,
) -> pd.DataFrame:
    """
    Generate *n_total* synthetic patient records with balanced disease distribution.

    Parameters
    ----------
    config : dict
        Parsed diseases_config.json
    n_total : int
        Total number of records to generate.
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    pd.DataFrame
        DataFrame with all feature columns, the disease label, and risk_score.
    """
    rng = np.random.default_rng(seed)
    diseases = config["diseases"]
    all_symptoms = config["symptoms"]
    n_diseases = len(diseases)

    # How many records per disease (balanced)
    per_disease = n_total // n_diseases
    remainder = n_total % n_diseases

    records = []
    patient_counter = 1

    for idx, disease in enumerate(diseases):
        n_for_this = per_disease + (1 if idx < remainder else 0)

        for _ in range(n_for_this):
            age = int(rng.integers(18, 81))
            gender = rng.choice(["M", "F", "Other"], p=[0.48, 0.48, 0.04])
            bmi = round(float(rng.uniform(15.0, 40.0)), 1)
            bp_sys = int(rng.integers(90, 181))
            bp_dia = int(rng.integers(60, 121))

            symptom_row = generate_symptom_row(disease, all_symptoms, rng)

            # Risk score composition
            age_risk = (age / 80.0) * RISK_AGE_WEIGHT
            bmi_risk = compute_bmi_risk(bmi)
            sym_risk = compute_symptom_severity(symptom_row, disease, all_symptoms)
            noise = float(rng.normal(0.0, RISK_NOISE_STD))
            risk_score = round(min(max(age_risk + bmi_risk + sym_risk + noise, 0.0), 100.0), 2)

            record = {
                "patient_id": f"P{patient_counter:05d}",
                "age": age,
                "gender": str(gender),
                "bmi": bmi,
                "blood_pressure_systolic": bp_sys,
                "blood_pressure_diastolic": bp_dia,
            }
            record.update(symptom_row)
            record["disease"] = disease["id"]
            record["risk_score"] = risk_score

            records.append(record)
            patient_counter += 1

    df = pd.DataFrame(records)
    # Shuffle to mix diseases
    df = df.sample(frac=1, random_state=int(seed)).reset_index(drop=True)
    return df


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    """Entry point: generates training and test datasets."""
    os.makedirs(DATA_DIR, exist_ok=True)

    logger.info("Loading diseases config …")
    config = load_config(CONFIG_PATH)

    logger.info("Generating %d training records …", TOTAL_TRAIN_RECORDS)
    train_df = generate_records(config, n_total=TOTAL_TRAIN_RECORDS, seed=42)

    logger.info("Generating %d test records …", TOTAL_TEST_RECORDS)
    test_df = generate_records(config, n_total=TOTAL_TEST_RECORDS, seed=123)

    # Save to CSV
    train_df.to_csv(OUTPUT_TRAIN, index=False)
    logger.info("Training data saved → %s  (shape: %s)", OUTPUT_TRAIN, train_df.shape)

    test_df.to_csv(OUTPUT_TEST, index=False)
    logger.info("Test data saved     → %s  (shape: %s)", OUTPUT_TEST, test_df.shape)

    # ----- Summary statistics -----
    logger.info("\n===== Summary =====")
    logger.info("Training set shape : %s", train_df.shape)
    logger.info("Test set shape     : %s", test_df.shape)
    logger.info("Disease distribution (training):\n%s", train_df["disease"].value_counts().to_string())
    logger.info("Risk score stats:\n%s", train_df["risk_score"].describe().to_string())
    logger.info("Gender distribution:\n%s", train_df["gender"].value_counts().to_string())
    logger.info("Age stats:\n%s", train_df["age"].describe().to_string())
    logger.info("BMI stats:\n%s", train_df["bmi"].describe().to_string())
    logger.info("===== Data generation complete =====")


if __name__ == "__main__":
    main()
