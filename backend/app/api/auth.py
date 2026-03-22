from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.models import User, Trainer, UserRole
from app.schemas.schemas import UserRegister, UserLogin, Token, UserResponse
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Set role
    role = UserRole.TRAINER if payload.role == "trainer" else UserRole.MEMBER

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        age=payload.age,
        weight=payload.weight,
        height=payload.height,
        goal=payload.goal,
        phone=payload.phone,
        role=role,
    )
    db.add(user)
    db.flush()  # get user.id before commit

    # ── If registering as trainer → auto add to trainers table ──
    if role == UserRole.TRAINER:
        trainer = Trainer(
            user_id=user.id,
            name=user.full_name,
            specialization="General Fitness",
            rating=0.0,
            experience_years=0,
            bio=f"Trainer at Smart Gym",
            is_active=True,
        )
        db.add(trainer)
        db.flush()
        user.trainer_id = None  # trainer doesn't assign themselves

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    updates: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    allowed = {"full_name", "age", "weight", "height", "goal", "phone", "avatar_url"}
    for key, val in updates.items():
        if key in allowed:
            setattr(current_user, key, val)
    db.commit()
    db.refresh(current_user)
    return current_user