from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    blood_group = Column(String, nullable=True)
    known_allergies = Column(Text, nullable=True) # JSON string
    existing_conditions = Column(Text, nullable=True) # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    assessments = relationship("Assessment", back_populates="user")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    symptoms = Column(Text, nullable=False) # JSON string
    health_profile = Column(Text, nullable=False) # JSON string
    predictions = Column(Text, nullable=False) # JSON string
    risk_score = Column(Float, nullable=False)
    recommendations = Column(Text, nullable=False) # JSON string
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="assessments")
