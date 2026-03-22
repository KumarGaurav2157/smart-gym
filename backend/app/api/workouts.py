from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import User, Workout
from app.schemas.schemas import WorkoutCreate, WorkoutResponse
from app.services.auth_service import get_current_user

router = APIRouter()

@router.post("/log-workout", response_model=WorkoutResponse)
def log_workout(payload: WorkoutCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workout = Workout(user_id=current_user.id, **payload.model_dump())
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return workout

@router.get("/my-workouts", response_model=List[WorkoutResponse])
def my_workouts(skip: int = 0, limit: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Workout).filter(Workout.user_id == current_user.id).offset(skip).limit(limit).all()

@router.get("/{workout_id}", response_model=WorkoutResponse)
def get_workout(workout_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workout = db.query(Workout).filter(Workout.id == workout_id, Workout.user_id == current_user.id).first()
    if not workout:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout
