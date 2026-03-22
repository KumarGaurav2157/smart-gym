from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.models import MembershipStatus, GoalType, UserRole

# ─── Auth Schemas ────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    goal: Optional[GoalType] = GoalType.GENERAL_FITNESS
    phone: Optional[str] = None
    role: Optional[str] = "member"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    age: Optional[int]
    weight: Optional[float]
    height: Optional[float]
    goal: Optional[GoalType]
    membership_status: MembershipStatus
    trainer_id: Optional[int]
    avatar_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

Token.model_rebuild()

# ─── Workout Schemas ─────────────────────────────────────────────────────────
class WorkoutCreate(BaseModel):
    workout_type: str
    duration_minutes: int
    calories_burned: Optional[float] = None
    notes: Optional[str] = None
    difficulty: Optional[str] = "medium"
    exercises: Optional[str] = None   # JSON string

class WorkoutResponse(WorkoutCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Attendance Schemas ───────────────────────────────────────────────────────
class AttendanceCreate(BaseModel):
    user_id: int

class AttendanceResponse(BaseModel):
    id: int
    user_id: int
    check_in: datetime
    check_out: Optional[datetime]
    duration_minutes: Optional[int]

    class Config:
        from_attributes = True

# ─── Payment Schemas ──────────────────────────────────────────────────────────
class PaymentCreate(BaseModel):
    amount: float
    currency: str = "USD"
    payment_type: str
    transaction_id: str

class PaymentResponse(PaymentCreate):
    id: int
    user_id: int
    status: str
    is_flagged: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Diet Log Schemas ─────────────────────────────────────────────────────────
class DietLogCreate(BaseModel):
    calories: float
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    meal_type: Optional[str] = None
    notes: Optional[str] = None

class DietLogResponse(DietLogCreate):
    id: int
    user_id: int
    logged_at: datetime

    class Config:
        from_attributes = True

# ─── Trainer Schemas ──────────────────────────────────────────────────────────
class TrainerResponse(BaseModel):
    id: int
    name: str
    specialization: Optional[str]
    rating: float
    experience_years: int
    bio: Optional[str]
    avatar_url: Optional[str]

    class Config:
        from_attributes = True

# ─── Analytics Schemas ────────────────────────────────────────────────────────
class DashboardData(BaseModel):
    total_members: int
    active_members: int
    monthly_revenue: float
    avg_attendance_rate: float
    churn_risk_count: int
    total_workouts_today: int
    top_workout_types: List[dict]
    revenue_trend: List[dict]
    attendance_trend: List[dict]
    member_segments: List[dict]

# ─── ML Prediction Schemas ────────────────────────────────────────────────────
class ChurnPrediction(BaseModel):
    user_id: int
    churn_probability: float
    risk_level: str  # low / medium / high
    key_factors: List[str]

class RevenueForeccast(BaseModel):
    period: str
    predicted_revenue: float
    lower_bound: float
    upper_bound: float

class RecommendationResponse(BaseModel):
    user_id: int
    workout_plan: List[dict]
    diet_plan: List[dict]
    generated_at: datetime
