from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserRegister, UserLogin, Token, UserResponse
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, get_current_user
)

router = APIRouter()

# ── In-memory reset token store ───────────────────────────────────────────────
RESET_TOKENS = {}  # { token: { user_id, otp, email, expires_at } }

# ─── Register ─────────────────────────────────────────────────────────────────
@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    from app.models.models import UserRole, Trainer
    role = UserRole.TRAINER if getattr(payload, 'role', None) == "trainer" else UserRole.MEMBER

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
    db.flush()

    if role == UserRole.TRAINER:
        trainer = Trainer(
            user_id=user.id,
            name=user.full_name,
            specialization="General Fitness",
            rating=0.0,
            experience_years=0,
            bio="Trainer at Smart Gym",
            is_active=True,
        )
        db.add(trainer)

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserResponse.model_validate(user))


# ─── Login ────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserResponse.model_validate(user))


# ─── Get current user ─────────────────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ─── Update profile ───────────────────────────────────────────────────────────
@router.put("/me", response_model=UserResponse)
async def update_me(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updates = await request.json()
    allowed = {"full_name", "age", "weight", "height", "goal", "phone", "avatar_url"}
    for key, val in updates.items():
        if key in allowed:
            setattr(current_user, key, val)
    db.commit()
    db.refresh(current_user)
    return current_user


# ─── Forgot Password ──────────────────────────────────────────────────────────
@router.post("/forgot-password")
async def forgot_password(request: Request, db: Session = Depends(get_db)):
    body  = await request.json()
    email = body.get("email", "").strip().lower()

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    user = db.query(User).filter(User.email == email).first()

    # Always return success (security — don't reveal if email exists)
    if not user:
        return {
            "success":      True,
            "message":      "If this email is registered, a reset code has been sent.",
            "email_sent":   False,
            "reset_token":  "",
        }

    # Generate 6-digit OTP and secure token
    otp   = str(secrets.randbelow(900000) + 100000)
    token = secrets.token_urlsafe(32)

    # Store with 15 min expiry
    RESET_TOKENS[token] = {
        "user_id":    user.id,
        "otp":        otp,
        "email":      email,
        "expires_at": datetime.utcnow() + timedelta(minutes=15),
    }

    # Try to send real email
    from app.services.email_service import send_reset_email
    email_sent = await send_reset_email(email, user.full_name, otp)

    print(f"🔑 OTP for {email}: {otp}")  # Always log for debugging

    response = {
        "success":     True,
        "message":     f"Reset code sent to {email}" if email_sent else "Reset code generated",
        "email_sent":  email_sent,
        "reset_token": token,
        "expires_in":  "15 minutes",
    }

    # Show OTP in response if email not configured (demo mode)
    if not email_sent:
        response["otp_demo"] = otp
        response["note"]     = "Email not configured. Showing OTP here for demo. See Setup Guide to enable emails."

    return response


# ─── Verify OTP ───────────────────────────────────────────────────────────────
@router.post("/verify-otp")
async def verify_otp(request: Request):
    body        = await request.json()
    token       = body.get("reset_token", "")
    otp_entered = body.get("otp", "").strip()

    token_data = RESET_TOKENS.get(token)
    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if datetime.utcnow() > token_data["expires_at"]:
        del RESET_TOKENS[token]
        raise HTTPException(status_code=400, detail="Reset code has expired. Request a new one.")

    if token_data["otp"] != otp_entered:
        raise HTTPException(status_code=400, detail="Incorrect reset code. Please try again.")

    return {"success": True, "message": "Code verified!", "reset_token": token}


# ─── Reset Password ───────────────────────────────────────────────────────────
@router.post("/reset-password")
async def reset_password(request: Request, db: Session = Depends(get_db)):
    body         = await request.json()
    token        = body.get("reset_token", "")
    new_password = body.get("new_password", "")

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    token_data = RESET_TOKENS.get(token)
    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if datetime.utcnow() > token_data["expires_at"]:
        del RESET_TOKENS[token]
        raise HTTPException(status_code=400, detail="Token expired. Request a new reset code.")

    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(new_password)
    db.commit()
    del RESET_TOKENS[token]

    return {"success": True, "message": "Password reset successfully! You can now login."}


# ─── Change Password (logged in) ──────────────────────────────────────────────
@router.post("/change-password")
async def change_password(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    body         = await request.json()
    old_password = body.get("old_password", "")
    new_password = body.get("new_password", "")

    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    current_user.hashed_password = hash_password(new_password)
    db.commit()

    return {"success": True, "message": "Password changed successfully!"}