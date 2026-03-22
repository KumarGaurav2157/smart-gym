from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class MembershipStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"

class GoalType(str, enum.Enum):
    WEIGHT_LOSS = "weight_loss"
    MUSCLE_GAIN = "muscle_gain"
    ENDURANCE = "endurance"
    FLEXIBILITY = "flexibility"
    GENERAL_FITNESS = "general_fitness"

class UserRole(str, enum.Enum):
    MEMBER = "member"
    TRAINER = "trainer"
    ADMIN = "admin"

# ─── Users ───────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id                = Column(Integer, primary_key=True, index=True)
    email             = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password   = Column(String(255), nullable=False)
    full_name         = Column(String(255), nullable=False)
    role              = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in x]), default=UserRole.MEMBER)
    age               = Column(Integer)
    weight            = Column(Float)
    height            = Column(Float)
    goal              = Column(Enum(GoalType, values_callable=lambda x: [e.value for e in x]), default=GoalType.GENERAL_FITNESS)
    membership_status = Column(Enum(MembershipStatus, values_callable=lambda x: [e.value for e in x]    ), default=MembershipStatus.ACTIVE)
    trainer_id        = Column(Integer, ForeignKey("trainers.id"), nullable=True)
    phone             = Column(String(20))
    avatar_url        = Column(String(500))
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    updated_at        = Column(DateTime(timezone=True), onupdate=func.now())
    last_login        = Column(DateTime(timezone=True))

    workouts   = relationship("Workout", back_populates="user")
    attendance = relationship("Attendance", back_populates="user")
    payments   = relationship("Payment", back_populates="user")
    diet_logs  = relationship("DietLog", back_populates="user")
    trainer    = relationship("Trainer", back_populates="members", foreign_keys=[trainer_id])

# ─── Trainers ────────────────────────────────────────────────────────────────
class Trainer(Base):
    __tablename__ = "trainers"
    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, nullable=True)
    name             = Column(String(255), nullable=False)
    specialization   = Column(String(255))
    rating           = Column(Float, default=0.0)
    experience_years = Column(Integer, default=0)
    bio              = Column(Text)
    avatar_url       = Column(String(500))
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    members = relationship("User", back_populates="trainer", foreign_keys="User.trainer_id")

# ─── Workouts ────────────────────────────────────────────────────────────────
class Workout(Base):
    __tablename__ = "workouts"
    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    workout_type     = Column(String(100), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    calories_burned  = Column(Float)
    notes            = Column(Text)
    difficulty       = Column(String(20))
    exercises        = Column(Text)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="workouts")

# ─── Attendance ───────────────────────────────────────────────────────────────
class Attendance(Base):
    __tablename__ = "attendance"
    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    check_in         = Column(DateTime(timezone=True), server_default=func.now())
    check_out        = Column(DateTime(timezone=True))
    duration_minutes = Column(Integer)

    user = relationship("User", back_populates="attendance")

# ─── Payments ────────────────────────────────────────────────────────────────
class Payment(Base):
    __tablename__ = "payments"
    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount         = Column(Float, nullable=False)
    currency       = Column(String(10), default="USD")
    payment_type   = Column(String(50))
    status         = Column(String(50), default="completed")
    transaction_id = Column(String(255), unique=True)
    is_flagged     = Column(Boolean, default=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="payments")

# ─── Diet Logs ───────────────────────────────────────────────────────────────
class DietLog(Base):
    __tablename__ = "diet_logs"
    id        = Column(Integer, primary_key=True, index=True)
    user_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    calories  = Column(Float, nullable=False)
    protein_g = Column(Float)
    carbs_g   = Column(Float)
    fat_g     = Column(Float)
    meal_type = Column(String(50))
    notes     = Column(Text)
    logged_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="diet_logs")

# ─── ML Results (cache) ──────────────────────────────────────────────────────
class MLPrediction(Base):
    __tablename__ = "ml_predictions"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    model_type = Column(String(100))
    prediction = Column(Text)
    confidence = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())