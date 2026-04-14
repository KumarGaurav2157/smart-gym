from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, members, workouts, analytics, predictions, recommendations, trainers, payments, membership
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Gym Management Platform",
    description="AI-Powered Smart Gym Management & Analytics Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,            prefix="/api/auth",            tags=["Authentication"])
app.include_router(members.router,         prefix="/api/members",         tags=["Members"])
app.include_router(workouts.router,        prefix="/api/workouts",        tags=["Workouts"])
app.include_router(analytics.router,       prefix="/api/analytics",       tags=["Analytics"])
app.include_router(predictions.router,     prefix="/api/predictions",     tags=["ML Predictions"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(trainers.router,        prefix="/api/trainers",        tags=["Trainers"])
app.include_router(payments.router,        prefix="/api/payments",        tags=["Payments"])
app.include_router(membership.router,      prefix="/api/membership",      tags=["Membership"])

@app.get("/")
def root():
    return {"message": "Smart Gym Platform API", "status": "running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}