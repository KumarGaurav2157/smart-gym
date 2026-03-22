from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List
from app.database import get_db
from app.models.models import User, Workout, Attendance, Payment, Trainer, DietLog
from app.schemas.schemas import PaymentCreate, PaymentResponse, DietLogCreate, DietLogResponse
from app.services.auth_service import get_current_user, require_admin
from app.ml.ml_service import (
    churn_predictor, member_segmenter, revenue_forecaster,
    fraud_detector, get_recommendations, build_member_features
)

# ─── Analytics ───────────────────────────────────────────────────────────────
router = APIRouter()

@router.get("/get-dashboard-data")
def dashboard_data(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    total_members  = db.query(User).count()
    active_members = db.query(User).filter(User.membership_status == "active").count()
    thirty_ago     = datetime.utcnow() - timedelta(days=30)

    monthly_revenue = db.query(func.sum(Payment.amount)).filter(Payment.created_at >= thirty_ago).scalar() or 0

    # Attendance trend last 7 days
    attendance_trend = []
    for i in range(7):
        day = datetime.utcnow() - timedelta(days=i)
        count = db.query(Attendance).filter(
            func.date(Attendance.check_in) == day.date()
        ).count()
        attendance_trend.append({"date": str(day.date()), "count": count})

    # Revenue trend last 6 months
    revenue_trend = []
    for i in range(6):
        month_start = (datetime.utcnow().replace(day=1) - timedelta(days=30 * i))
        rev = db.query(func.sum(Payment.amount)).filter(
            func.year(Payment.created_at) == month_start.year,
            func.month(Payment.created_at) == month_start.month
        ).scalar() or 0
        revenue_trend.append({"month": month_start.strftime("%b %Y"), "revenue": round(float(rev), 2)})

    # Top workout types
    workout_counts = db.query(Workout.workout_type, func.count(Workout.id)).group_by(Workout.workout_type).limit(5).all()
    top_workouts   = [{"type": t, "count": c} for t, c in workout_counts]

    # Churn risk count (simplified)
    high_risk = 0
    members = db.query(User).filter(User.membership_status == "active").all()
    for m in members[:50]:  # sample for performance
        workouts   = db.query(Workout).filter(Workout.user_id == m.id).all()
        attendance = db.query(Attendance).filter(Attendance.user_id == m.id).all()
        payments   = db.query(Payment).filter(Payment.user_id == m.id).all()
        try:
            features = build_member_features(m, workouts, attendance, payments)
            result   = churn_predictor.predict(features)
            if result["risk_level"] == "high":
                high_risk += 1
        except Exception:
            pass

    return {
        "total_members": total_members,
        "active_members": active_members,
        "monthly_revenue": round(float(monthly_revenue), 2),
        "avg_attendance_rate": round(active_members / max(total_members, 1) * 100, 1),
        "churn_risk_count": high_risk,
        "total_workouts_today": db.query(Workout).filter(func.date(Workout.created_at) == datetime.utcnow().date()).count(),
        "top_workout_types": top_workouts,
        "revenue_trend": list(reversed(revenue_trend)),
        "attendance_trend": list(reversed(attendance_trend)),
        "member_segments": [
            {"segment": "Casual", "count": 40},
            {"segment": "Regular", "count": 35},
            {"segment": "Power User", "count": 20},
            {"segment": "VIP", "count": 5},
        ],
    }
@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.models import Workout, Attendance
    from sqlalchemy import func
    from datetime import datetime, timedelta

    thirty_ago = datetime.utcnow() - timedelta(days=30)

    # Get all active members
    members = db.query(User).filter(User.membership_status == "active").all()

    leaderboard = []
    for member in members:
        # Calories burned this month
        calories = db.query(func.sum(Workout.calories_burned)).filter(
            Workout.user_id == member.id,
            Workout.created_at >= thirty_ago
        ).scalar() or 0

        # Workout count this month
        workout_count = db.query(func.count(Workout.id)).filter(
            Workout.user_id == member.id,
            Workout.created_at >= thirty_ago
        ).scalar() or 0

        # Attendance this month
        attendance_count = db.query(func.count(Attendance.id)).filter(
            Attendance.user_id == member.id,
            Attendance.check_in >= thirty_ago
        ).scalar() or 0

        # Calculate streak
        all_workouts = db.query(Workout.created_at).filter(
            Workout.user_id == member.id
        ).order_by(Workout.created_at.desc()).all()

        streak = 0
        if all_workouts:
            workout_dates = set()
            for w in all_workouts:
                if w.created_at:
                    d = w.created_at.date()
                    workout_dates.add(d)

            from datetime import date, timedelta as td
            today = date.today()
            for i in range(365):
                check = today - td(days=i)
                if check in workout_dates:
                    streak += 1
                elif i > 0:
                    break

        leaderboard.append({
            "id":            member.id,
            "full_name":     member.full_name,
            "goal":          member.goal.value if member.goal else "general_fitness",
            "calories":      round(float(calories), 0),
            "workouts":      workout_count,
            "attendance":    attendance_count,
            "streak":        streak,
            "is_me":         member.id == current_user.id,
        })

    return leaderboard
