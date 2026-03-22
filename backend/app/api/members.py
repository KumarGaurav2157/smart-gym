from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import User, Workout, Attendance, Payment, DietLog
from app.schemas.schemas import WorkoutCreate, WorkoutResponse, PaymentCreate, PaymentResponse, DietLogCreate, DietLogResponse
from app.services.auth_service import get_current_user, require_admin

router = APIRouter()

# ─── Member list (admin) ──────────────────────────────────────────────────────
@router.get("/")
def list_members(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    members = db.query(User).offset(skip).limit(limit).all()
    return [{"id": m.id, "email": m.email, "full_name": m.full_name, "role": m.role,
             "membership_status": m.membership_status, "created_at": m.created_at} for m in members]

@router.get("/{member_id}")
def get_member(member_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role.value not in ("admin", "trainer") and current_user.id != member_id:
        raise HTTPException(status_code=403, detail="Not authorised")
    member = db.query(User).filter(User.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member

@router.get("/{member_id}/stats")
def member_stats(member_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workouts   = db.query(Workout).filter(Workout.user_id == member_id).all()
    attendance = db.query(Attendance).filter(Attendance.user_id == member_id).all()
    payments   = db.query(Payment).filter(Payment.user_id == member_id).all()
    return {
        "total_workouts":    len(workouts),
        "total_visits":      len(attendance),
        "total_spent":       sum(p.amount for p in payments),
        "avg_workout_mins":  round(sum(w.duration_minutes for w in workouts) / len(workouts), 1) if workouts else 0,
        "total_calories":    round(sum(w.calories_burned or 0 for w in workouts), 1),
    }
