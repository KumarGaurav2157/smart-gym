from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.database import get_db
from app.models.models import User, Trainer, Payment, DietLog
from app.schemas.schemas import PaymentCreate, PaymentResponse, DietLogCreate, DietLogResponse, TrainerResponse
from app.services.auth_service import get_current_user, require_admin
from app.ml.ml_service import get_recommendations, fraud_detector

# ─── Recommendations ─────────────────────────────────────────────────────────
router = APIRouter()

@router.get("/recommend")
def recommend(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = current_user.goal.value if current_user.goal else "general_fitness"
    recs = get_recommendations(goal)
    return {"user_id": current_user.id, **recs, "generated_at": datetime.utcnow()}
