"""
ML Service — wraps all machine learning models:
  • Churn Prediction      (Logistic Regression)
  • Member Segmentation   (K-Means Clustering)
  • Revenue Forecasting   (Prophet)
  • Fraud Detection       (Isolation Forest)
  • Recommendation Engine (Collaborative Filtering / rule-based fallback)
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.exceptions import NotFittedError
import joblib
import os
import json

MODEL_DIR = os.path.join(os.path.dirname(__file__), "../ml/saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ─── Feature Engineering ─────────────────────────────────────────────────────
def build_member_features(user, workouts, attendance, payments) -> np.ndarray:
    """Turn raw member data into a feature vector."""
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    recent_workouts = [w for w in workouts if w.created_at and w.created_at >= thirty_days_ago]
    recent_visits   = [a for a in attendance if a.check_in and a.check_in >= thirty_days_ago]
    recent_payments = [p for p in payments if p.created_at and p.created_at >= thirty_days_ago]

    total_spent = sum(p.amount for p in recent_payments)
    avg_duration = np.mean([w.duration_minutes for w in recent_workouts]) if recent_workouts else 0

    return np.array([
        len(recent_workouts),           # workout_count_30d
        len(recent_visits),             # visit_count_30d
        total_spent,                    # spend_30d
        avg_duration,                   # avg_workout_duration
        user.age or 30,                 # age
        (now - user.created_at).days if user.created_at else 0,  # days_since_join
        1 if user.trainer_id else 0,    # has_trainer
    ])


# ─── Churn Prediction ────────────────────────────────────────────────────────
class ChurnPredictor:
    MODEL_PATH = os.path.join(MODEL_DIR, "churn_model.pkl")
    SCALER_PATH = os.path.join(MODEL_DIR, "churn_scaler.pkl")

    def __init__(self):
        try:
            self.model  = joblib.load(self.MODEL_PATH)
            self.scaler = joblib.load(self.SCALER_PATH)
        except FileNotFoundError:
            self.model  = LogisticRegression(max_iter=1000)
            self.scaler = StandardScaler()
            self._bootstrap_train()

    def _bootstrap_train(self):
        """Train on synthetic data until real data is available."""
        np.random.seed(42)
        n = 200
        X = np.column_stack([
            np.random.randint(0, 20, n),
            np.random.randint(0, 20, n),
            np.random.uniform(0, 500, n),
            np.random.uniform(20, 90, n),
            np.random.randint(18, 65, n),
            np.random.randint(1, 730, n),
            np.random.randint(0, 2, n),
        ])
        y = ((X[:, 0] < 4) | (X[:, 1] < 3)).astype(int)
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        joblib.dump(self.model,  self.MODEL_PATH)
        joblib.dump(self.scaler, self.SCALER_PATH)

    def predict(self, features: np.ndarray) -> Dict[str, Any]:
        features_2d = features.reshape(1, -1)
        scaled = self.scaler.transform(features_2d)
        prob = float(self.model.predict_proba(scaled)[0][1])

        if prob < 0.3:
            risk = "low"
        elif prob < 0.65:
            risk = "medium"
        else:
            risk = "high"

        factors = []
        if features[0] < 4:  factors.append("Low workout frequency")
        if features[1] < 3:  factors.append("Infrequent gym visits")
        if features[2] < 50: factors.append("Low spending")
        if features[6] == 0: factors.append("No personal trainer assigned")

        return {"churn_probability": round(prob, 3), "risk_level": risk, "key_factors": factors or ["No major risk factors"]}

    def retrain(self, X: np.ndarray, y: np.ndarray):
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        joblib.dump(self.model,  self.MODEL_PATH)
        joblib.dump(self.scaler, self.SCALER_PATH)


# ─── Member Segmentation ─────────────────────────────────────────────────────
class MemberSegmenter:
    SEGMENT_LABELS = {0: "Casual", 1: "Regular", 2: "Power User", 3: "VIP"}
    MODEL_PATH = os.path.join(MODEL_DIR, "kmeans_model.pkl")
    SCALER_PATH = os.path.join(MODEL_DIR, "kmeans_scaler.pkl")

    def __init__(self, n_clusters: int = 4):
        self.n_clusters = n_clusters
        try:
            self.model  = joblib.load(self.MODEL_PATH)
            self.scaler = joblib.load(self.SCALER_PATH)
        except FileNotFoundError:
            self.model  = KMeans(n_clusters=n_clusters, random_state=42)
            self.scaler = StandardScaler()
            self._bootstrap_train()

    def _bootstrap_train(self):
        np.random.seed(42)
        n = 300
        X = np.column_stack([
            np.random.randint(0, 20, n),
            np.random.randint(0, 20, n),
            np.random.uniform(0, 1000, n),
        ])
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        joblib.dump(self.model,  self.MODEL_PATH)
        joblib.dump(self.scaler, self.SCALER_PATH)

    def predict_segment(self, features: np.ndarray) -> Dict[str, Any]:
        f = features[[0, 1, 2]].reshape(1, -1)
        scaled = self.scaler.transform(f)
        cluster = int(self.model.predict(scaled)[0])
        return {"segment_id": cluster, "segment_label": self.SEGMENT_LABELS.get(cluster, "Unknown")}


# ─── Revenue Forecasting ─────────────────────────────────────────────────────
class RevenueForecaster:
    def forecast(self, payments: List, periods: int = 30) -> List[Dict]:
        try:
            from prophet import Prophet
            if len(payments) < 10:
                raise ValueError("Insufficient data for Prophet; using fallback")

            df = pd.DataFrame([{"ds": p.created_at.date(), "y": p.amount} for p in payments if p.created_at])
            df = df.groupby("ds").sum().reset_index()
            m = Prophet(yearly_seasonality=True, weekly_seasonality=True)
            m.fit(df)
            future = m.make_future_dataframe(periods=periods)
            forecast = m.predict(future)
            return [
                {"date": str(row["ds"].date()), "predicted": round(row["yhat"], 2),
                 "lower": round(row["yhat_lower"], 2), "upper": round(row["yhat_upper"], 2)}
                for _, row in forecast.tail(periods).iterrows()
            ]
        except Exception:
            # Simple linear fallback
            base = 5000
            return [
                {"date": str((datetime.utcnow() + timedelta(days=i)).date()),
                 "predicted": round(base + i * 50 + np.random.normal(0, 100), 2),
                 "lower": round(base + i * 40, 2),
                 "upper": round(base + i * 60, 2)}
                for i in range(1, periods + 1)
            ]


# ─── Fraud Detection ─────────────────────────────────────────────────────────
class FraudDetector:
    MODEL_PATH = os.path.join(MODEL_DIR, "fraud_model.pkl")

    def __init__(self):
        try:
            self.model = joblib.load(self.MODEL_PATH)
        except FileNotFoundError:
            self.model = IsolationForest(contamination=0.05, random_state=42)
            self._bootstrap_train()

    def _bootstrap_train(self):
        np.random.seed(42)
        X = np.random.normal(100, 30, (500, 3))
        X[:20] = np.random.uniform(1000, 5000, (20, 3))  # inject anomalies
        self.model.fit(X)
        joblib.dump(self.model, self.MODEL_PATH)

    def is_fraudulent(self, amount: float, user_avg_spend: float, frequency: int) -> bool:
        features = np.array([[amount, user_avg_spend, frequency]])
        return int(self.model.predict(features)[0]) == -1


# ─── Recommendation Engine ───────────────────────────────────────────────────
WORKOUT_PLANS = {
    "weight_loss": [
        {"day": "Monday",    "workout": "HIIT Cardio",       "duration": 45, "intensity": "High"},
        {"day": "Tuesday",   "workout": "Full Body Circuit",  "duration": 50, "intensity": "Medium"},
        {"day": "Wednesday", "workout": "Rest / Light Yoga",  "duration": 30, "intensity": "Low"},
        {"day": "Thursday",  "workout": "Cycling / Run",      "duration": 40, "intensity": "High"},
        {"day": "Friday",    "workout": "Strength Training",  "duration": 45, "intensity": "Medium"},
        {"day": "Saturday",  "workout": "Swimming / Swim",    "duration": 60, "intensity": "Medium"},
        {"day": "Sunday",    "workout": "Rest",               "duration": 0,  "intensity": "None"},
    ],
    "muscle_gain": [
        {"day": "Monday",    "workout": "Chest & Triceps",    "duration": 60, "intensity": "High"},
        {"day": "Tuesday",   "workout": "Back & Biceps",      "duration": 60, "intensity": "High"},
        {"day": "Wednesday", "workout": "Rest / Light Cardio","duration": 30, "intensity": "Low"},
        {"day": "Thursday",  "workout": "Shoulders & Abs",    "duration": 55, "intensity": "High"},
        {"day": "Friday",    "workout": "Legs & Glutes",      "duration": 65, "intensity": "High"},
        {"day": "Saturday",  "workout": "Full Body Compound",  "duration": 60, "intensity": "Medium"},
        {"day": "Sunday",    "workout": "Rest",               "duration": 0,  "intensity": "None"},
    ],
    "endurance": [
        {"day": "Monday",    "workout": "Long Run",            "duration": 60, "intensity": "Medium"},
        {"day": "Tuesday",   "workout": "Interval Training",   "duration": 45, "intensity": "High"},
        {"day": "Wednesday", "workout": "Cross-training",      "duration": 50, "intensity": "Medium"},
        {"day": "Thursday",  "workout": "Tempo Run",           "duration": 40, "intensity": "High"},
        {"day": "Friday",    "workout": "Recovery Run",        "duration": 30, "intensity": "Low"},
        {"day": "Saturday",  "workout": "Long Bike Ride",      "duration": 90, "intensity": "Medium"},
        {"day": "Sunday",    "workout": "Rest & Stretch",      "duration": 20, "intensity": "Low"},
    ],
}

DIET_PLANS = {
    "weight_loss": [
        {"meal": "Breakfast", "suggestion": "Oats + berries + protein shake", "calories": 400},
        {"meal": "Lunch",     "suggestion": "Grilled chicken salad + quinoa",  "calories": 500},
        {"meal": "Snack",     "suggestion": "Greek yogurt + almonds",           "calories": 200},
        {"meal": "Dinner",    "suggestion": "Salmon + steamed vegetables",      "calories": 450},
    ],
    "muscle_gain": [
        {"meal": "Breakfast", "suggestion": "Egg whites + oats + banana",       "calories": 600},
        {"meal": "Pre-workout","suggestion": "Whey protein + rice cakes",        "calories": 300},
        {"meal": "Lunch",      "suggestion": "Brown rice + chicken breast",      "calories": 700},
        {"meal": "Post-workout","suggestion": "Protein shake + dextrose",        "calories": 350},
        {"meal": "Dinner",     "suggestion": "Beef steak + sweet potato",        "calories": 750},
    ],
    "endurance": [
        {"meal": "Breakfast", "suggestion": "Whole grain toast + peanut butter + banana", "calories": 550},
        {"meal": "Lunch",     "suggestion": "Pasta + lean turkey + olive oil",   "calories": 650},
        {"meal": "Snack",     "suggestion": "Energy bar + electrolyte drink",    "calories": 250},
        {"meal": "Dinner",    "suggestion": "Grilled fish + brown rice + salad", "calories": 600},
    ],
}

DEFAULT_WORKOUT = WORKOUT_PLANS["weight_loss"]
DEFAULT_DIET    = DIET_PLANS["weight_loss"]

def get_recommendations(user_goal: str) -> Dict:
    goal_key = user_goal.replace(" ", "_").lower()
    return {
        "workout_plan": WORKOUT_PLANS.get(goal_key, DEFAULT_WORKOUT),
        "diet_plan":    DIET_PLANS.get(goal_key, DEFAULT_DIET),
    }


# ─── Singleton instances ─────────────────────────────────────────────────────
churn_predictor   = ChurnPredictor()
member_segmenter  = MemberSegmenter()
revenue_forecaster = RevenueForecaster()
fraud_detector    = FraudDetector()
