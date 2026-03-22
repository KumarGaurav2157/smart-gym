from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import get_db
from app.models.models import Trainer, User, Workout, Attendance
from app.schemas.schemas import TrainerResponse
from app.services.auth_service import get_current_user

router = APIRouter()

@router.get("/", response_model=list[TrainerResponse])
def list_trainers(db: Session = Depends(get_db)):
    return db.query(Trainer).filter(Trainer.is_active == True).all()

@router.get("/{trainer_id}", response_model=TrainerResponse)
def get_trainer(trainer_id: int, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    return trainer

@router.get("/{trainer_id}/members")
def get_trainer_members(
    trainer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only the trainer themselves or admin can see this
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    thirty_ago = datetime.utcnow() - timedelta(days=30)
    seven_ago  = datetime.utcnow() - timedelta(days=7)

    members = db.query(User).filter(User.trainer_id == trainer_id).all()

    result = []
    for m in members:
        # Last 30 days workouts
        workouts_30d = db.query(Workout).filter(
            Workout.user_id == m.id,
            Workout.created_at >= thirty_ago
        ).all()

        # Last 7 days workouts
        workouts_7d = db.query(Workout).filter(
            Workout.user_id == m.id,
            Workout.created_at >= seven_ago
        ).all()

        # All time workouts
        all_workouts = db.query(Workout).filter(Workout.user_id == m.id).all()

        # Attendance last 30 days
        attendance_30d = db.query(Attendance).filter(
            Attendance.user_id == m.id,
            Attendance.check_in >= thirty_ago
        ).count()

        # Calories last 30 days
        calories_30d = sum(w.calories_burned or 0 for w in workouts_30d)

        # Avg workout duration
        avg_duration = round(
            sum(w.duration_minutes for w in all_workouts) / len(all_workouts), 1
        ) if all_workouts else 0

        # Progress score (0-100)
        score = min(100, (
            len(workouts_30d) * 5 +      # 5 pts per workout
            attendance_30d * 3 +          # 3 pts per visit
            (calories_30d / 100)          # 1 pt per 100 kcal
        ))

        # Performance label
        if score >= 70:   performance = "excellent"
        elif score >= 40: performance = "good"
        elif score >= 20: performance = "average"
        else:             performance = "needs_attention"

        # Last workout date
        last_workout = max(
            (w.created_at for w in all_workouts if w.created_at),
            default=None
        )
        days_since = (datetime.utcnow() - last_workout).days if last_workout else 999

        result.append({
            "id":             m.id,
            "full_name":      m.full_name,
            "email":          m.email,
            "age":            m.age,
            "weight":         m.weight,
            "height":         m.height,
            "goal":           m.goal.value if m.goal else "general_fitness",
            "membership_status": m.membership_status.value if m.membership_status else "active",
            "workouts_30d":   len(workouts_30d),
            "workouts_7d":    len(workouts_7d),
            "attendance_30d": attendance_30d,
            "calories_30d":   round(calories_30d, 0),
            "avg_duration":   avg_duration,
            "progress_score": round(score, 1),
            "performance":    performance,
            "days_since_workout": days_since,
            "last_workout":   str(last_workout.date()) if last_workout else None,
            "total_workouts": len(all_workouts),
        })

    # Sort by progress score descending
    result.sort(key=lambda x: x["progress_score"], reverse=True)
    return result

@router.get("/my/dashboard")
def trainer_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find trainer profile for current user
    trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer profile not found")

    members = db.query(User).filter(User.trainer_id == trainer.id).all()
    thirty_ago = datetime.utcnow() - timedelta(days=30)

    total_members    = len(members)
    active_members   = 0
    needs_attention  = 0
    total_workouts   = 0

    for m in members:
        workouts = db.query(Workout).filter(
            Workout.user_id == m.id,
            Workout.created_at >= thirty_ago
        ).count()
        total_workouts += workouts
        if workouts >= 4:  active_members += 1
        if workouts < 2:   needs_attention += 1

    return {
        "trainer_id":       trainer.id,
        "trainer_name":     trainer.name,
        "total_members":    total_members,
        "active_members":   active_members,
        "needs_attention":  needs_attention,
        "total_workouts":   total_workouts,
        "rating":           trainer.rating,
    }