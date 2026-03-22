# 🏋️ AI-Powered Smart Gym Management & Analytics Platform

A full-stack intelligent gym platform combining **FastAPI**, **React**, **MySQL**, and **Machine Learning** to deliver real-time analytics, churn prediction, revenue forecasting, and personalised fitness recommendations.

---

## 📁 Project Structure

```
smart-gym/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── config.py           # Environment settings
│   │   ├── database.py         # SQLAlchemy DB connection
│   │   ├── api/                # Route handlers
│   │   │   ├── auth.py         # Register / Login / Me
│   │   │   ├── members.py      # Member CRUD
│   │   │   ├── workouts.py     # Workout logging
│   │   │   ├── analytics.py    # Dashboard data
│   │   │   ├── predictions.py  # ML predictions
│   │   │   ├── recommendations.py  # AI plans
│   │   │   ├── trainers.py     # Trainer profiles
│   │   │   └── payments.py     # Payment + fraud detection
│   │   ├── models/
│   │   │   └── models.py       # SQLAlchemy ORM models
│   │   ├── schemas/
│   │   │   └── schemas.py      # Pydantic request/response schemas
│   │   ├── services/
│   │   │   └── auth_service.py # JWT auth helpers
│   │   └── ml/
│   │       └── ml_service.py   # All ML models (churn, segment, forecast, fraud, recommendations)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic.ini
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── App.js              # Router
│   │   ├── index.css           # Global design system (dark industrial theme)
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx       # KPI stats + charts
│   │   │   ├── WorkoutsPage.jsx        # Log & view workouts
│   │   │   ├── RecommendationsPage.jsx # AI plan + churn score
│   │   │   ├── AnalyticsPage.jsx       # Admin analytics (admin only)
│   │   │   ├── MembersPage.jsx         # Member list + churn (admin only)
│   │   │   ├── ForecastPage.jsx        # Revenue forecast (admin only)
│   │   │   ├── TrainersPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── AppShell.jsx        # Sidebar + topbar layout
│   │   ├── hooks/
│   │   │   └── useAuthStore.js         # Zustand auth state
│   │   └── utils/
│   │       └── api.js                  # Axios API client
│   ├── package.json
│   ├── Dockerfile
│   └── .env
│
├── database/
│   ├── setup.sql               # MySQL schema + seed admin user
│   └── seed.py                 # Python script for 50 members + full data
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Option 1 — Docker (Recommended)

```bash
# Clone and start all services
git clone <repo-url>
cd smart-gym

# Start MySQL + Backend + Frontend
docker-compose up --build

# Open browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Option 2 — Local Development

#### 1. MySQL Setup

```bash
# Run the schema setup
mysql -u root -p < database/setup.sql
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Seed Database (Optional — adds 50 members + realistic data)

```bash
cd smart-gym
python database/seed.py
```

#### 4. Frontend Setup

```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

---

## 🔑 Demo Credentials

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | admin@smartgym.com       | Admin@123  |
| Member| member1@smartgym.com     | Member@123 |

---

## 🤖 Machine Learning Models

| Model               | Algorithm            | Purpose                                    |
|---------------------|----------------------|--------------------------------------------|
| Churn Prediction    | Logistic Regression  | Identify at-risk members before they cancel|
| Member Segmentation | K-Means Clustering   | Casual / Regular / Power User / VIP        |
| Revenue Forecasting | Prophet (Time-Series)| 14–90 day revenue projections              |
| Fraud Detection     | Isolation Forest     | Flag anomalous payment transactions        |
| Recommendation      | Collaborative Rules  | Personalised workout + diet plans          |

> Models auto-train on synthetic data on first run and improve as real data accumulates. Trained models are persisted as `.pkl` files in `backend/app/ml/saved_models/`.

---

## 🌐 API Endpoints

| Method | Endpoint                          | Description              | Auth     |
|--------|-----------------------------------|--------------------------|----------|
| POST   | /api/auth/register                | Register new member      | Public   |
| POST   | /api/auth/login                   | Login                    | Public   |
| GET    | /api/auth/me                      | Current user             | Member+  |
| POST   | /api/workouts/log-workout         | Log workout session      | Member+  |
| GET    | /api/workouts/my-workouts         | My workout history       | Member+  |
| GET    | /api/recommendations/recommend    | AI workout + diet plan   | Member+  |
| GET    | /api/predictions/predict-churn/{id} | Churn risk score       | Member+  |
| GET    | /api/predictions/segment/{id}     | Member segment           | Member+  |
| GET    | /api/analytics/get-dashboard-data | Admin KPI dashboard      | Admin    |
| GET    | /api/predictions/forecast-revenue | Revenue forecast         | Admin    |
| GET    | /api/members/                     | All members list         | Admin    |

Full interactive docs: **http://localhost:8000/docs**

---

## 🎨 Frontend Pages

| Page            | Route              | Role    | Features                                      |
|-----------------|--------------------|---------|-----------------------------------------------|
| Login           | /login             | Public  | JWT auth, demo credentials panel              |
| Register        | /register          | Public  | Multi-field onboarding with goal selection    |
| Dashboard       | /dashboard         | Member  | Workout history, personal stats               |
| Dashboard       | /dashboard         | Admin   | KPI cards, revenue chart, member segments     |
| Workouts        | /workouts          | Member  | Log sessions, full workout history table      |
| AI Plan         | /recommendations   | Member  | Weekly workout + daily diet plan, churn score |
| Trainers        | /trainers          | Member  | Trainer profiles with specialisation          |
| Profile         | /profile           | Member  | Edit info, BMI calculator                     |
| Analytics       | /analytics         | Admin   | Revenue bar chart, attendance line chart      |
| Members         | /members           | Admin   | Member table + on-demand churn analysis       |
| Forecast        | /forecast          | Admin   | 14–90 day revenue projection with bands       |

---

## 🛠 Tech Stack

### Backend
- **FastAPI** — async Python REST API
- **SQLAlchemy** — ORM + MySQL integration
- **PyMySQL** — MySQL driver
- **Scikit-learn** — Logistic Regression, K-Means, Isolation Forest
- **Prophet** — Time-series revenue forecasting
- **Passlib + python-jose** — bcrypt hashing + JWT tokens
- **Pydantic v2** — request/response validation

### Frontend
- **React 18** — component-based SPA
- **React Router v6** — client-side routing
- **Recharts** — AreaChart, BarChart, LineChart, PieChart
- **Zustand** — lightweight global auth state
- **Axios** — HTTP client with JWT interceptors
- **react-hot-toast** — toast notifications
- **Lucide React** — icon library

### Infrastructure
- **MySQL 8** — relational database
- **Docker + Docker Compose** — containerised deployment
- **Nginx** — production React serving
- **Uvicorn** — ASGI server

---

## 🚢 Deployment

### Render (Backend)
1. Push `backend/` to GitHub
2. Create Web Service on Render → Python environment
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env.example`

### Netlify (Frontend)
1. Push `frontend/` to GitHub
2. Connect repo to Netlify
3. Build: `npm run build`
4. Publish: `build/`
5. Set `REACT_APP_API_URL` to your Render backend URL

### AWS RDS (Database)
1. Create MySQL 8.0 RDS instance
2. Run `database/setup.sql` against RDS endpoint
3. Update `DB_HOST`, `DB_USER`, `DB_PASSWORD` env vars

---

## 📈 Roadmap

- [ ] Real-time notifications (WebSockets)
- [ ] Equipment usage tracking
- [ ] Mobile app (React Native)
- [ ] Email/SMS churn intervention automation
- [ ] Stripe payment integration
- [ ] Trainer booking & scheduling
- [ ] Progress photos + body measurements
- [ ] Leaderboards + gamification

---

## 📄 License

MIT License — free to use and modify for commercial and personal projects.
