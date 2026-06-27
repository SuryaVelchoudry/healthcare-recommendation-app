from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
import json
import os
from dotenv import load_dotenv

load_dotenv()

from . import schemas
from . import auth
from database.db import get_db, init_db
from database.models import User, Assessment
from ml.inference import get_engine

app = FastAPI(title="Healthcare Recommendation API", version="1.0.0")

# Build allowed origins: always include localhost for dev, plus any configured production origins
_ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")
_EXTRA_ORIGINS = [o.strip() for o in _ALLOWED_ORIGINS_ENV.split(",") if o.strip()]

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://healthcare-recommendation.vercel.app",
    # Vercel preview deployments (any subdomain)
    "https://healthcare-recommendation-surya.vercel.app",
    "https://healthcare-recommendation-suryavelchoudry.vercel.app",
] + _EXTRA_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://healthcare-recommendation.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()
    try:
        get_engine()
    except Exception as e:
        print(f"Warning: ML Engine could not be initialized: {e}")

@app.post("/api/auth/register", response_model=schemas.UserResponse)
async def register(user: schemas.UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where((User.username == user.username) | (User.email == user.email)))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        date_of_birth=user.date_of_birth,
        gender=user.gender,
        blood_group=user.blood_group,
        known_allergies=json.dumps(user.known_allergies) if user.known_allergies else "[]",
        existing_conditions=json.dumps(user.existing_conditions) if user.existing_conditions else "[]"
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return schemas.UserResponse(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        full_name=db_user.full_name,
        date_of_birth=db_user.date_of_birth,
        gender=db_user.gender,
        blood_group=db_user.blood_group,
        known_allergies=json.loads(db_user.known_allergies),
        existing_conditions=json.loads(db_user.existing_conditions),
        created_at=db_user.created_at
    )

@app.post("/api/auth/login", response_model=schemas.Token)
async def login(user_credentials: schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_credentials.email))
    user = result.scalars().first()
    
    if not user or not auth.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id, "username": user.username, "full_name": user.full_name}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
async def get_me(current_user: User = Depends(auth.get_current_user)):
    return schemas.UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        date_of_birth=current_user.date_of_birth,
        gender=current_user.gender,
        blood_group=current_user.blood_group,
        known_allergies=json.loads(current_user.known_allergies) if current_user.known_allergies else [],
        existing_conditions=json.loads(current_user.existing_conditions) if current_user.existing_conditions else [],
        created_at=current_user.created_at
    )

@app.put("/api/auth/me", response_model=schemas.UserResponse)
async def update_me(update_data: schemas.UserRegister, current_user: User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    current_user.full_name = update_data.full_name
    current_user.date_of_birth = update_data.date_of_birth
    current_user.gender = update_data.gender
    current_user.blood_group = update_data.blood_group
    current_user.known_allergies = json.dumps(update_data.known_allergies) if update_data.known_allergies else "[]"
    current_user.existing_conditions = json.dumps(update_data.existing_conditions) if update_data.existing_conditions else "[]"
    
    if update_data.password:
        current_user.hashed_password = auth.get_password_hash(update_data.password)
        
    await db.commit()
    await db.refresh(current_user)
    return await get_me(current_user)

@app.post("/api/assessments/analyze", response_model=schemas.AssessmentResponse)
async def analyze_assessment(request: schemas.AssessmentRequest, current_user: User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    engine = get_engine()
    
    patient_profile = request.health_profile.model_dump()
    symptoms = request.symptoms
    
    analysis = engine.full_analysis(patient_profile, symptoms)
    
    db_assessment = Assessment(
        user_id=current_user.id,
        symptoms=json.dumps(symptoms),
        health_profile=json.dumps(patient_profile),
        predictions=json.dumps(analysis["predictions"]),
        risk_score=analysis["risk_score"],
        recommendations=json.dumps(analysis["recommendations"])
    )
    
    db.add(db_assessment)
    await db.commit()
    await db.refresh(db_assessment)
    
    return schemas.AssessmentResponse(
        assessment_id=db_assessment.id,
        predictions=analysis["predictions"],
        risk_score=analysis["risk_score"],
        risk_level=analysis["risk_level"],
        recommendations=analysis["recommendations"],
        created_at=db_assessment.created_at
    )

@app.get("/api/assessments/history", response_model=List[schemas.AssessmentHistoryItem])
async def get_history(current_user: User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assessment).where(Assessment.user_id == current_user.id).order_by(Assessment.created_at.desc()))
    assessments = result.scalars().all()
    
    history = []
    for a in assessments:
        preds = json.loads(a.predictions)
        top_pred = preds[0]["disease_name"] if preds else "Unknown"
        from ml.inference import _risk_level
        risk_lvl = _risk_level(a.risk_score)
        
        history.append(schemas.AssessmentHistoryItem(
            id=a.id,
            created_at=a.created_at,
            top_prediction=top_pred,
            risk_score=a.risk_score,
            risk_level=risk_lvl
        ))
        
    return history

@app.get("/api/assessments/{assessment_id}", response_model=schemas.AssessmentResponse)
async def get_assessment(assessment_id: int, current_user: User = Depends(auth.get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assessment).where((Assessment.id == assessment_id) & (Assessment.user_id == current_user.id)))
    assessment = result.scalars().first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    from ml.inference import _risk_level
    
    return schemas.AssessmentResponse(
        assessment_id=assessment.id,
        predictions=json.loads(assessment.predictions),
        risk_score=assessment.risk_score,
        risk_level=_risk_level(assessment.risk_score),
        recommendations=json.loads(assessment.recommendations),
        created_at=assessment.created_at
    )

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/api/symptoms")
async def get_symptoms():
    config_path = os.path.join(os.path.dirname(__file__), "..", "data", "diseases_config.json")
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
            return {"symptoms": config.get("symptoms", [])}
    except Exception as e:
        return {"symptoms": [], "error": str(e)}
