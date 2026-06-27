"""
inference.py
------------
HealthcareMLEngine — singleton that loads trained ML models and the disease
configuration once at application startup and provides prediction and
recommendation helpers.

Public API
----------
engine = HealthcareMLEngine()

engine.predict_diseases(symptoms, top_n=3)
    → list[dict]  # predicted diseases with confidence

engine.predict_risk_score(patient_profile)
    → float       # risk score 0–100

engine.get_recommendations(predicted_diseases, patient_profile)
    → dict        # medications, diet, lifestyle

engine.full_analysis(patient_profile, symptoms)
    → dict        # combined output of all above
"""

import json
import logging
import os
from threading import Lock
from typing import Any

import joblib
import numpy as np

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR = os.path.join(_SCRIPT_DIR, "models")
_CONFIG_PATH = os.path.join(_SCRIPT_DIR, "..", "data", "diseases_config.json")

# Model file names
_CLF_FILE = "disease_classifier.pkl"
_RISK_FILE = "risk_predictor.pkl"
_ENC_FILE = "label_encoder.pkl"
_FEAT_FILE = "feature_names.pkl"

# ---------------------------------------------------------------------------
# Singleton guard
# ---------------------------------------------------------------------------
_engine_instance: "HealthcareMLEngine | None" = None
_engine_lock = Lock()


def get_engine() -> "HealthcareMLEngine":
    """
    Return the application-wide singleton HealthcareMLEngine.

    The instance is created (and models loaded) only on the first call.
    Subsequent calls return the cached instance, making this thread-safe.
    """
    global _engine_instance
    if _engine_instance is None:
        with _engine_lock:
            if _engine_instance is None:
                _engine_instance = HealthcareMLEngine()
    return _engine_instance


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _encode_gender(gender: str) -> float:
    """Convert gender string to numeric representation."""
    mapping = {"M": 0.0, "m": 0.0, "male": 0.0,
               "F": 1.0, "f": 1.0, "female": 1.0,
               "Other": 0.5, "other": 0.5, "O": 0.5}
    return mapping.get(gender, 0.5)


def _risk_level(score: float) -> str:
    """Map a numeric risk score to a human-readable risk level."""
    if score < 25:
        return "low"
    elif score < 50:
        return "moderate"
    elif score < 75:
        return "high"
    else:
        return "critical"


# ---------------------------------------------------------------------------
# Main engine class
# ---------------------------------------------------------------------------

class HealthcareMLEngine:
    """
    Loads trained scikit-learn/XGBoost models and disease configuration,
    then exposes prediction and recommendation methods.

    Attributes
    ----------
    classifier      : Trained disease classification model
    risk_predictor  : Trained risk-score regression model
    label_encoder   : LabelEncoder mapping disease indices ↔ disease IDs
    feature_names   : dict with 'symptom_features' and 'all_features' lists
    diseases_config : Parsed diseases_config.json
    disease_map     : dict {disease_id → disease dict}
    symptom_features: Ordered list of symptom column names
    """

    def __init__(self) -> None:
        """
        Load all models and the disease configuration from disk.

        Raises
        ------
        FileNotFoundError
            If any required model file is missing — caller should run
            setup.py or train_models.py first.
        RuntimeError
            If a model file exists but cannot be loaded.
        """
        logger.info("Initialising HealthcareMLEngine …")
        self._load_models()
        self._load_config()
        logger.info("HealthcareMLEngine ready.")

    # ------------------------------------------------------------------
    # Private — loading
    # ------------------------------------------------------------------

    def _model_path(self, filename: str) -> str:
        """Return the full path to a model artefact file."""
        return os.path.join(_MODELS_DIR, filename)

    def _assert_exists(self, path: str) -> None:
        """Raise FileNotFoundError with a helpful message if path is absent."""
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"Model file not found: {path}\n"
                "Please run setup.py (or train_models.py) first to train and save the models."
            )

    def _load_models(self) -> None:
        """Load all joblib-serialised model artefacts from disk."""
        clf_path  = self._model_path(_CLF_FILE)
        risk_path = self._model_path(_RISK_FILE)
        enc_path  = self._model_path(_ENC_FILE)
        feat_path = self._model_path(_FEAT_FILE)

        for p in (clf_path, risk_path, enc_path, feat_path):
            self._assert_exists(p)

        try:
            self.classifier      = joblib.load(clf_path)
            self.risk_predictor  = joblib.load(risk_path)
            self.label_encoder   = joblib.load(enc_path)
            self.feature_names   = joblib.load(feat_path)
        except Exception as exc:
            raise RuntimeError(f"Failed to load model artefacts: {exc}") from exc

        self.symptom_features: list = self.feature_names["symptom_features"]
        self.all_features: list = self.feature_names["all_features"]
        logger.info(
            "Models loaded — %d symptom features, %d all features",
            len(self.symptom_features), len(self.all_features),
        )

    def _load_config(self) -> None:
        """Parse diseases_config.json and build an ID-keyed lookup dict."""
        if not os.path.exists(_CONFIG_PATH):
            raise FileNotFoundError(
                f"diseases_config.json not found at {_CONFIG_PATH}"
            )
        with open(_CONFIG_PATH, "r", encoding="utf-8") as fh:
            self.diseases_config: dict = json.load(fh)

        self.disease_map: dict[str, dict] = {
            d["id"]: d for d in self.diseases_config["diseases"]
        }
        logger.info("Disease config loaded — %d diseases.", len(self.disease_map))

    # ------------------------------------------------------------------
    # Private — feature builders
    # ------------------------------------------------------------------

    def _build_symptom_vector(self, symptoms: dict[str, int]) -> np.ndarray:
        """
        Convert a symptoms dict to an ordered numpy vector aligned with
        self.symptom_features.  Missing keys default to 0.

        Parameters
        ----------
        symptoms : dict, e.g. {"fever": 1, "cough": 1}

        Returns
        -------
        np.ndarray of shape (1, n_symptom_features)
        """
        vec = [float(symptoms.get(sym, 0)) for sym in self.symptom_features]
        return np.array(vec, dtype=float).reshape(1, -1)

    def _build_all_feature_vector(self, patient_profile: dict, symptoms: dict[str, int]) -> np.ndarray:
        """
        Build the full feature vector (symptoms + demographics) used by
        the risk predictor.

        Expected patient_profile keys
        -----------------------------
        age              : int or float
        gender           : str ("M", "F", "Other")
        bmi              : float
        blood_pressure_systolic  : int
        blood_pressure_diastolic : int

        Missing profile keys default to neutral/median values.
        """
        symptom_vals = [float(symptoms.get(sym, 0)) for sym in self.symptom_features]

        age    = float(patient_profile.get("age", 40))
        gender = _encode_gender(str(patient_profile.get("gender", "Other")))
        bmi    = float(patient_profile.get("bmi", 25.0))
        bp_sys = float(patient_profile.get("blood_pressure_systolic", 120))
        bp_dia = float(patient_profile.get("blood_pressure_diastolic", 80))

        # The order must match self.all_features (built during training)
        # Training order: symptom cols first, then age, gender_enc, bmi, bp_sys, bp_dia
        extra = [age, gender, bmi, bp_sys, bp_dia]
        full_vec = symptom_vals + extra
        return np.array(full_vec, dtype=float).reshape(1, -1)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def predict_diseases(
        self,
        symptoms: dict[str, int],
        top_n: int = 3,
    ) -> list[dict[str, Any]]:
        """
        Predict the top N most likely diseases from the provided symptoms.

        Parameters
        ----------
        symptoms : dict mapping symptom name → 0 or 1
        top_n    : number of top predictions to return (default 3)

        Returns
        -------
        list of dicts, each containing:
            disease_id   : str
            disease_name : str
            confidence   : float (0.0 – 1.0)
            severity     : str ("mild" | "moderate" | "severe")
        """
        X = self._build_symptom_vector(symptoms)

        # Get probability distribution over all classes
        try:
            proba = self.classifier.predict_proba(X)[0]
        except AttributeError:
            # Fallback: if model doesn't have predict_proba (rare edge case)
            pred_idx = int(self.classifier.predict(X)[0])
            proba = np.zeros(len(self.label_encoder.classes_))
            proba[pred_idx] = 1.0

        # Get top N indices sorted by probability descending
        top_indices = np.argsort(proba)[::-1][:top_n]

        results: list[dict] = []
        for idx in top_indices:
            disease_id = self.label_encoder.classes_[int(idx)]
            confidence = float(proba[idx])
            disease_info = self.disease_map.get(disease_id, {})
            results.append({
                "disease_id":   disease_id,
                "disease_name": disease_info.get("name", disease_id),
                "confidence":   round(confidence, 4),
                "severity":     disease_info.get("severity", "unknown"),
            })

        logger.debug("Disease predictions: %s", results)
        return results

    def predict_risk_score(self, patient_profile: dict, symptoms: dict[str, int] | None = None) -> float:
        """
        Predict a risk score between 0 and 100 for the given patient.

        Parameters
        ----------
        patient_profile : dict with keys: age, gender, bmi,
                          blood_pressure_systolic, blood_pressure_diastolic
        symptoms        : dict of symptom name → 0/1 (optional; defaults all to 0)

        Returns
        -------
        float : risk score clamped to [0, 100]
        """
        if symptoms is None:
            symptoms = {}

        X = self._build_all_feature_vector(patient_profile, symptoms)
        raw_score = float(self.risk_predictor.predict(X)[0])
        score = round(min(max(raw_score, 0.0), 100.0), 2)
        logger.debug("Predicted risk score: %.2f", score)
        return score

    def get_recommendations(
        self,
        predicted_diseases: list[dict],
        patient_profile: dict,
    ) -> dict[str, Any]:
        """
        Build medication, diet, and lifestyle recommendations based on the
        top predicted disease, with contraindication filtering.

        Parameters
        ----------
        predicted_diseases : Output of predict_diseases()
        patient_profile    : dict containing:
                             allergies          : list[str]
                             existing_conditions: list[str]
                             current_medications: list[str]

        Returns
        -------
        dict with keys:
            medications : list[dict]
            diet        : dict
            lifestyle   : dict
        """
        if not predicted_diseases:
            return {"medications": [], "diet": {}, "lifestyle": {}}

        top_disease_id = predicted_diseases[0]["disease_id"]
        disease_info   = self.disease_map.get(top_disease_id, {})

        if not disease_info:
            logger.warning("Disease '%s' not found in config.", top_disease_id)
            return {"medications": [], "diet": {}, "lifestyle": {}}

        # ---- Medication filtering based on patient profile ----
        patient_allergies    = [a.lower() for a in patient_profile.get("allergies", [])]
        patient_conditions   = [c.lower() for c in patient_profile.get("existing_conditions", [])]
        patient_medications  = [m.lower() for m in patient_profile.get("current_medications", [])]

        raw_medications = disease_info.get("medications", [])
        safe_medications: list[dict] = []

        for med in raw_medications:
            med_name       = med.get("name", "").lower()
            med_generic    = med.get("generic_name", "").lower()
            contraind_list = [c.lower() for c in med.get("contraindications", [])]

            # Check allergy clash (name or generic in patient allergies)
            allergy_clash = any(
                allergy in med_name or allergy in med_generic
                for allergy in patient_allergies
            )

            # Check contraindication clash with existing conditions
            condition_clash = any(
                any(cond in contra for cond in patient_conditions)
                for contra in contraind_list
            )

            if allergy_clash:
                logger.info(
                    "Excluding %s — patient allergy match.", med.get("name")
                )
                continue
            if condition_clash:
                logger.info(
                    "Excluding %s — contraindicated by existing condition.", med.get("name")
                )
                continue

            safe_medications.append(med)

        recommendations = {
            "medications": safe_medications,
            "diet":        disease_info.get("diet", {}),
            "lifestyle":   disease_info.get("lifestyle", {}),
        }

        logger.debug("Recommendations generated for disease: %s", top_disease_id)
        return recommendations

    def full_analysis(
        self,
        patient_profile: dict,
        symptoms: dict[str, int],
    ) -> dict[str, Any]:
        """
        Run the full ML analysis pipeline for a patient.

        Steps
        -----
        1. Predict top 3 diseases from symptoms.
        2. Predict risk score from demographics + symptoms.
        3. Generate recommendations based on the top disease.

        Parameters
        ----------
        patient_profile : dict with demographic keys and health-profile keys
                          (age, gender, bmi, blood_pressure_systolic,
                           blood_pressure_diastolic, allergies,
                           existing_conditions, current_medications)
        symptoms        : dict mapping symptom name → 0 or 1

        Returns
        -------
        dict:
            predictions   : list[dict]   — top-3 disease predictions
            risk_score    : float        — risk score (0–100)
            risk_level    : str          — "low" / "moderate" / "high" / "critical"
            recommendations: dict        — medications, diet, lifestyle
        """
        logger.info("Running full_analysis …")

        # 1. Disease predictions
        predictions = self.predict_diseases(symptoms, top_n=3)

        # 2. Risk score
        risk_score = self.predict_risk_score(patient_profile, symptoms)
        risk_lvl   = _risk_level(risk_score)

        # 3. Recommendations
        recs = self.get_recommendations(predictions, patient_profile)

        analysis = {
            "predictions":      predictions,
            "risk_score":       risk_score,
            "risk_level":       risk_lvl,
            "recommendations":  recs,
        }

        logger.info(
            "Analysis complete — top disease: %s | risk: %.1f (%s)",
            predictions[0]["disease_id"] if predictions else "N/A",
            risk_score,
            risk_lvl,
        )
        return analysis
