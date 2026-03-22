from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Trainer
from app.schemas.schemas import TrainerResponse
from app.services.auth_service import get_current_user

router = APIRouter()

@router.get("/", response_model=list[TrainerResponse])
def list_trainers(db: Session = Depends(get_db)):
    return db.query(Trainer).filter(Trainer.is_active == True).all()

@router.get("/{trainer_id}", response_model=TrainerResponse)
def get_trainer(trainer_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    return trainer
