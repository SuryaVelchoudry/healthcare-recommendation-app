from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# Auth
class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    date_of_birth: str
    gender: str
    blood_group: Optional[str] = None
    known_allergies: Optional[List[str]] = None
    existing_conditions: Optional[List[str]] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str
    full_name: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    date_of_birth: str
    gender: str
    blood_group: Optional[str] = None
    known_allergies: Optional[List[str]] = None
    existing_conditions: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Assessment
class HealthProfile(BaseModel):
    age: int
    gender: str
    weight_kg: float
    height_cm: float
    bmi: float
    blood_pressure_systolic: int
    blood_pressure_diastolic: int
    blood_group: str
    existing_conditions: List[str]
    current_medications: List[str]
    allergies: List[str]

class LifestyleInfo(BaseModel):
    exercise_frequency: str
    diet_type: str
    sleep_hours: float
    stress_level: str
    smoking: bool
    alcohol: str
    water_intake_liters: float

class AssessmentRequest(BaseModel):
    health_profile: HealthProfile
    symptoms: Dict[str, int]
    lifestyle: LifestyleInfo

class DiseasePrediction(BaseModel):
    disease_id: str
    disease_name: str
    confidence: float
    severity: str

class MedicationInfo(BaseModel):
    name: str
    generic_name: str
    dosage: str
    max_daily: str
    usage: str
    side_effects: List[str]
    contraindications: List[str]
    category: str
    requires_prescription: bool

class DietPlan(BaseModel):
    summary: str
    foods_to_eat: List[str]
    foods_to_avoid: List[str]
    hydration: str

class LifestyleRecommendation(BaseModel):
    exercise: str
    sleep: str
    stress_management: str
    general_tips: List[str]

class Recommendations(BaseModel):
    medications: List[MedicationInfo]
    diet: DietPlan
    lifestyle: LifestyleRecommendation

class AssessmentResponse(BaseModel):
    assessment_id: int
    predictions: List[DiseasePrediction]
    risk_score: float
    risk_level: str
    recommendations: Recommendations
    created_at: datetime

class AssessmentHistoryItem(BaseModel):
    id: int
    created_at: datetime
    top_prediction: str
    risk_score: float
    risk_level: str
