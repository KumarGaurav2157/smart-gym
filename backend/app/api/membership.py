from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models.models import User, Payment
from app.services.auth_service import get_current_user, require_admin
import uuid
import hmac
import hashlib
import subprocess
import sys

router = APIRouter()

# ── Try importing razorpay at module level ────────────────────────────────────
RAZORPAY_AVAILABLE = False
try:
    import razorpay
    RAZORPAY_AVAILABLE = True
    print("✅ razorpay imported successfully")
except ImportError:
    print("❌ razorpay not found — trying pip install...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "razorpay"])
        import razorpay
        RAZORPAY_AVAILABLE = True
        print("✅ razorpay installed and imported successfully")
    except Exception as e:
        print(f"❌ Could not install razorpay: {e}")

# ── Plans (INR) ───────────────────────────────────────────────────────────────
PLANS = {
    "1month":  {"id": "1month",  "name": "Starter",   "duration": 1,  "price": 999,  "original": 999,   "savings": 0,    "description": "Perfect for beginners",    "features": ["Full gym access", "Locker room", "Basic equipment", "1 fitness assessment"]},
    "3month":  {"id": "3month",  "name": "Popular",   "duration": 3,  "price": 2499, "original": 2997,  "savings": 498,  "description": "Most popular choice",       "features": ["Full gym access", "Locker room", "All equipment", "2 fitness assessments", "1 PT session/month", "Group classes"], "badge": "Most Popular"},
    "6month":  {"id": "6month",  "name": "Committed", "duration": 6,  "price": 4499, "original": 5994,  "savings": 1495, "description": "Serious about fitness",     "features": ["Full gym access", "All equipment", "Unlimited assessments", "2 PT sessions/month", "Group classes", "Nutrition consultation"]},
    "9month":  {"id": "9month",  "name": "Dedicated", "duration": 9,  "price": 5999, "original": 8991,  "savings": 2992, "description": "For the dedicated athlete", "features": ["Full gym access", "All equipment", "Unlimited assessments", "3 PT sessions/month", "Group classes", "Nutrition consultation", "Guest passes x2"]},
    "12month": {"id": "12month", "name": "Champion",  "duration": 12, "price": 6999, "original": 11988, "savings": 4989, "description": "Best value — full year",    "features": ["Full gym access", "All equipment", "Unlimited assessments", "4 PT sessions/month", "Group classes", "Nutrition consultation", "Guest passes x4", "Premium locker", "Towel service"], "badge": "Best Value"},
}

def get_keys():
    """Get Razorpay keys from settings"""
    try:
        from app.config import settings
        return settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET
    except Exception:
        import os
        return os.getenv("RAZORPAY_KEY_ID", ""), os.getenv("RAZORPAY_KEY_SECRET", "")

@router.get("/plans")
def get_plans():
    return list(PLANS.values())

@router.get("/razorpay-status")
def razorpay_status():
    key_id, key_secret = get_keys()
    return {
        "razorpay_available": RAZORPAY_AVAILABLE,
        "keys_configured":    bool(key_id and key_secret),
        "key_id_prefix":      key_id[:15] if key_id else "",
        "python_path":        sys.executable,
    }

@router.get("/my-membership")
def my_membership(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payment = db.query(Payment).filter(
        Payment.user_id == current_user.id,
        Payment.payment_type == "membership",
        Payment.status == "completed"
    ).order_by(Payment.created_at.desc()).first()

    if not payment:
        return {"status": "no_membership", "message": "No active membership"}

    plan_id   = payment.transaction_id.split("_")[1] if payment.transaction_id and "_" in payment.transaction_id else "1month"
    plan      = PLANS.get(plan_id, PLANS["1month"])
    expiry    = payment.created_at + timedelta(days=30 * plan["duration"])
    days_left = (expiry - datetime.utcnow()).days

    return {
        "status":      "active" if days_left > 0 else "expired",
        "plan_id":     plan_id,
        "plan_name":   plan["name"],
        "amount":      payment.amount,
        "currency":    "INR",
        "start_date":  str(payment.created_at.date()),
        "expiry_date": str(expiry.date()),
        "days_left":   max(0, days_left),
        "is_active":   days_left > 0,
        "duration":    plan["duration"],
        "features":    plan["features"],
    }

@router.post("/create-order")
async def create_order(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not RAZORPAY_AVAILABLE:
        raise HTTPException(status_code=500, detail="RAZORPAY_NOT_INSTALLED")

    body    = await request.json()
    plan_id = body.get("plan_id")

    if plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    plan               = PLANS[plan_id]
    key_id, key_secret = get_keys()

    if not key_id or not key_secret:
        raise HTTPException(status_code=400, detail="RAZORPAY_KEYS_NOT_CONFIGURED")

    try:
        client = razorpay.Client(auth=(key_id, key_secret))
        order  = client.order.create({
            "amount":   plan["price"] * 100,
            "currency": "INR",
            "receipt":  f"rcpt_{current_user.id}_{plan_id}_{uuid.uuid4().hex[:6]}",
            "notes":    {"user_id": str(current_user.id), "plan_id": plan_id},
        })
        return {
            "order_id":   order["id"],
            "amount":     plan["price"] * 100,
            "currency":   "INR",
            "plan_id":    plan_id,
            "plan_name":  plan["name"],
            "key_id":     key_id,
            "user_name":  current_user.full_name,
            "user_email": current_user.email,
            "user_phone": current_user.phone or "",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Razorpay error: {str(e)}")

@router.post("/verify-payment")
async def verify_payment(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    body       = await request.json()
    plan_id    = body.get("plan_id")
    order_id   = body.get("razorpay_order_id")
    payment_id = body.get("razorpay_payment_id")
    signature  = body.get("razorpay_signature")

    if not all([plan_id, order_id, payment_id, signature]):
        raise HTTPException(status_code=400, detail="Missing payment details")

    _, key_secret = get_keys()

    message   = f"{order_id}|{payment_id}"
    generated = hmac.new(
        key_secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if generated != signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    plan    = PLANS.get(plan_id, PLANS["1month"])
    payment = Payment(
        user_id=current_user.id,
        amount=plan["price"],
        currency="INR",
        payment_type="membership",
        status="completed",
        transaction_id=f"rzp_{plan_id}_{payment_id}",
        is_flagged=False,
    )
    db.add(payment)
    current_user.membership_status = "active"
    db.commit()

    return {
        "success":  True,
        "message":  f"🎉 {plan['name']} Membership activated for {plan['duration']} month(s)!",
        "payment_id": payment_id,
        "plan":     plan["name"],
        "duration": plan["duration"],
    }

@router.post("/demo-payment")
async def demo_payment(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    body    = await request.json()
    plan_id = body.get("plan_id")
    if plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    plan    = PLANS[plan_id]
    payment = Payment(
        user_id=current_user.id,
        amount=plan["price"],
        currency="INR",
        payment_type="membership",
        status="completed",
        transaction_id=f"demo_{plan_id}_{uuid.uuid4().hex[:8]}",
        is_flagged=False,
    )
    db.add(payment)
    current_user.membership_status = "active"
    db.commit()
    return {"success": True, "message": f"🎉 Demo {plan['name']} Membership activated!"}

@router.get("/payment-history")
def payment_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payments = db.query(Payment).filter(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()).all()
    return [{"id": p.id, "amount": p.amount, "currency": p.currency or "INR",
             "payment_type": p.payment_type, "status": p.status,
             "transaction_id": p.transaction_id, "created_at": str(p.created_at)} for p in payments]

@router.get("/admin/all")
def all_memberships(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    payments = db.query(Payment).filter(Payment.payment_type == "membership").order_by(Payment.created_at.desc()).limit(100).all()
    result = []
    for p in payments:
        user = db.query(User).filter(User.id == p.user_id).first()
        result.append({"member_name": user.full_name if user else "Unknown",
                       "email": user.email if user else "Unknown",
                       "amount": p.amount, "currency": p.currency or "INR",
                       "status": p.status,
                       "plan": p.transaction_id.split("_")[1] if p.transaction_id and "_" in p.transaction_id else "unknown",
                       "created_at": str(p.created_at)})
    return result