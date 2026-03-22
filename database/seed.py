"""
Seed script — populates the database with realistic demo data.
Run: python database/seed.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal, engine
from backend.app.models.models import Base, User, Trainer, Workout, Attendance, Payment, DietLog
from backend.app.services.auth_service import hash_password

Base.metadata.create_all(bind=engine)

WORKOUT_TYPES  = ["Cardio", "HIIT", "Strength Training", "Yoga", "Cycling", "Swimming", "Boxing", "CrossFit", "Pilates", "Running"]
DIFFICULTIES   = ["easy", "medium", "hard"]
GOALS          = ["weight_loss", "muscle_gain", "endurance", "flexibility", "general_fitness"]
PAYMENT_TYPES  = ["membership", "personal_training", "supplement"]
MEAL_TYPES     = ["breakfast", "lunch", "dinner", "snack"]

def rand_date(days_back: int = 365) -> datetime:
    return datetime.utcnow() - timedelta(days=random.randint(0, days_back))

def seed():
    db: Session = SessionLocal()
    try:
        print("🌱 Seeding database...")

        # ── Trainers ──────────────────────────────────────────────────────────
        trainers_data = [
            {"name": "Alex Johnson",  "specialization": "Strength & Conditioning", "rating": 4.8, "experience_years": 8,  "bio": "NSCA-certified strength coach specialising in powerlifting."},
            {"name": "Maria Santos",  "specialization": "Yoga & Flexibility",       "rating": 4.9, "experience_years": 12, "bio": "E-RYT 500 yoga instructor with therapeutic expertise."},
            {"name": "David Kim",     "specialization": "HIIT & Cardio",            "rating": 4.7, "experience_years": 5,  "bio": "ACSM-certified trainer focused on high-intensity training."},
            {"name": "Sarah Williams","specialization": "Nutrition & Wellness",     "rating": 4.6, "experience_years": 7,  "bio": "Registered dietitian and certified personal trainer."},
        ]
        trainers = []
        for td in trainers_data:
            existing = db.query(Trainer).filter(Trainer.name == td["name"]).first()
            if not existing:
                t = Trainer(**td)
                db.add(t)
                db.flush()
                trainers.append(t)
            else:
                trainers.append(existing)
        db.commit()
        print(f"  ✓ {len(trainers)} trainers")

        # ── Admin user ─────────────────────────────────────────────────────────
        admin = db.query(User).filter(User.email == "admin@smartgym.com").first()
        if not admin:
            admin = User(
                email="admin@smartgym.com",
                hashed_password=hash_password("Admin@123"),
                full_name="Gym Admin",
                role="admin",
                age=35, weight=80.0, height=178.0,
                goal="general_fitness",
                membership_status="active",
            )
            db.add(admin)
            db.commit()
        print("  ✓ Admin user (admin@smartgym.com / Admin@123)")

        # ── Member users ───────────────────────────────────────────────────────
        first_names = ["James","Emma","Noah","Olivia","Liam","Ava","William","Sophia","Lucas","Isabella",
                       "Mason","Mia","Ethan","Charlotte","Logan","Amelia","Aiden","Harper","Jackson","Evelyn"]
        last_names  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Taylor"]

        members = []
        for i in range(50):
            email = f"member{i+1}@smartgym.com"
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                members.append(existing)
                continue

            fn = random.choice(first_names)
            ln = random.choice(last_names)
            m  = User(
                email=email,
                hashed_password=hash_password("Member@123"),
                full_name=f"{fn} {ln}",
                role="member",
                age=random.randint(18, 65),
                weight=round(random.uniform(50, 110), 1),
                height=round(random.uniform(155, 195), 1),
                goal=random.choice(GOALS),
                membership_status=random.choice(["active"] * 8 + ["inactive", "cancelled"]),
                trainer_id=random.choice(trainers).id if random.random() > 0.4 else None,
                created_at=rand_date(730),
            )
            db.add(m)
            db.flush()
            members.append(m)
        db.commit()
        print(f"  ✓ {len(members)} members")

        # ── Workouts ───────────────────────────────────────────────────────────
        workout_count = 0
        for member in members:
            n_workouts = random.randint(5, 80)
            for _ in range(n_workouts):
                w = Workout(
                    user_id=member.id,
                    workout_type=random.choice(WORKOUT_TYPES),
                    duration_minutes=random.randint(20, 120),
                    calories_burned=round(random.uniform(150, 800), 1),
                    difficulty=random.choice(DIFFICULTIES),
                    created_at=rand_date(365),
                )
                db.add(w)
                workout_count += 1
        db.commit()
        print(f"  ✓ {workout_count} workouts")

        # ── Attendance ─────────────────────────────────────────────────────────
        att_count = 0
        for member in members:
            n_visits = random.randint(3, 100)
            for _ in range(n_visits):
                check_in  = rand_date(365)
                duration  = random.randint(30, 180)
                check_out = check_in + timedelta(minutes=duration)
                a = Attendance(
                    user_id=member.id,
                    check_in=check_in,
                    check_out=check_out,
                    duration_minutes=duration,
                )
                db.add(a)
                att_count += 1
        db.commit()
        print(f"  ✓ {att_count} attendance records")

        # ── Payments ───────────────────────────────────────────────────────────
        pay_count = 0
        for i, member in enumerate(members):
            n_payments = random.randint(1, 12)
            for j in range(n_payments):
                p = Payment(
                    user_id=member.id,
                    amount=round(random.choice([29.99, 49.99, 79.99, 99.99, 149.99, 199.99]), 2),
                    currency="USD",
                    payment_type=random.choice(PAYMENT_TYPES),
                    status="completed",
                    transaction_id=f"TXN-{member.id:04d}-{j:04d}",
                    is_flagged=random.random() < 0.02,
                    created_at=rand_date(365),
                )
                db.add(p)
                pay_count += 1
        db.commit()
        print(f"  ✓ {pay_count} payment records")

        # ── Diet Logs ──────────────────────────────────────────────────────────
        diet_count = 0
        for member in random.sample(members, min(20, len(members))):
            for _ in range(random.randint(5, 30)):
                d = DietLog(
                    user_id=member.id,
                    calories=round(random.uniform(200, 900), 1),
                    protein_g=round(random.uniform(10, 60), 1),
                    carbs_g=round(random.uniform(20, 120), 1),
                    fat_g=round(random.uniform(5, 40), 1),
                    meal_type=random.choice(MEAL_TYPES),
                    logged_at=rand_date(90),
                )
                db.add(d)
                diet_count += 1
        db.commit()
        print(f"  ✓ {diet_count} diet logs")

        print("\n✅ Database seeded successfully!")
        print("   Login: admin@smartgym.com / Admin@123")
        print("   Members: member1@smartgym.com to member50@smartgym.com / Member@123")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
