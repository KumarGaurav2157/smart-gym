from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, Workout, Attendance, Payment
from app.services.auth_service import get_current_user, require_admin
from app.ml.ml_service import (
    churn_predictor, member_segmenter, revenue_forecaster,
    fraud_detector, build_member_features
)

router = APIRouter()

@router.get("/predict-churn/{user_id}")
def predict_churn(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role.value not in ("admin", "trainer") and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorised")

    workouts   = db.query(Workout).filter(Workout.user_id == user_id).all()
    attendance = db.query(Attendance).filter(Attendance.user_id == user_id).all()
    payments   = db.query(Payment).filter(Payment.user_id == user_id).all()

    features = build_member_features(target, workouts, attendance, payments)
    result   = churn_predictor.predict(features)
    return {"user_id": user_id, **result}

@router.get("/segment/{user_id}")
def segment_member(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target     = db.query(User).filter(User.id == user_id).first()
    workouts   = db.query(Workout).filter(Workout.user_id == user_id).all()
    attendance = db.query(Attendance).filter(Attendance.user_id == user_id).all()
    payments   = db.query(Payment).filter(Payment.user_id == user_id).all()

    features = build_member_features(target, workouts, attendance, payments)
    return {"user_id": user_id, **member_segmenter.predict_segment(features)}

@router.get("/forecast-revenue")
def forecast_revenue(periods: int = 30, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    payments = db.query(Payment).filter(Payment.status == "completed").all()
    return revenue_forecaster.forecast(payments, periods=periods)
