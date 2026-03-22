from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, Payment
from app.schemas.schemas import PaymentCreate, PaymentResponse
from app.services.auth_service import get_current_user
from app.ml.ml_service import fraud_detector

router = APIRouter()

@router.post("/", response_model=PaymentResponse)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from sqlalchemy import func
    avg_spend = db.query(func.avg(Payment.amount)).filter(Payment.user_id == current_user.id).scalar() or 0
    freq      = db.query(Payment).filter(Payment.user_id == current_user.id).count()
    is_fraud  = fraud_detector.is_fraudulent(payload.amount, float(avg_spend), freq)

    payment = Payment(
        user_id=current_user.id,
        is_flagged=is_fraud,
        **payload.model_dump()
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.get("/my-payments", response_model=list[PaymentResponse])
def my_payments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Payment).filter(Payment.user_id == current_user.id).all()
