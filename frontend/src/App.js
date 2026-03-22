import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './hooks/useAuthStore';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import WorkoutsPage from './pages/WorkoutsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import MembersPage from './pages/MembersPage';
import TrainersPage from './pages/TrainersPage';
import ProfilePage from './pages/ProfilePage';
import ForecastPage from './pages/ForecastPage';
import CalendarPage from './pages/CalendarPage';
import StreakPage from './pages/StreakPage';
import WeightPage from './pages/WeightPage';
import SleepPage from './pages/SleepPage';
import WaterPage from './pages/WaterPage';
import LeaderboardPage from './pages/LeaderboardPage';
import TrainerDashboardPage from './pages/TrainerDashboardPage';
import MembershipPage from './pages/MembershipPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#161a22',
            color: '#e8eaf0',
            border: '1px solid #252b38',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#00e676', secondary: '#0a0b0d' } },
          error:   { iconTheme: { primary: '#ff4d6d', secondary: '#fff'    } },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/login"           element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register"        element={token ? <Navigate to="/dashboard" /> : <RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Private routes */}
        <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"          element={<DashboardPage />} />
          <Route path="workouts"           element={<WorkoutsPage />} />
          <Route path="recommendations"    element={<RecommendationsPage />} />
          <Route path="trainers"           element={<TrainersPage />} />
          <Route path="profile"            element={<ProfilePage />} />
          <Route path="calendar"           element={<CalendarPage />} />
          <Route path="streak"             element={<StreakPage />} />
          <Route path="weight"             element={<WeightPage />} />
          <Route path="sleep"              element={<SleepPage />} />
          <Route path="water"              element={<WaterPage />} />
          <Route path="leaderboard"        element={<LeaderboardPage />} />
          <Route path="membership"         element={<MembershipPage />} />
          <Route path="change-password"    element={<ChangePasswordPage />} />
          <Route path="trainer-dashboard"  element={<TrainerDashboardPage />} />
          <Route path="analytics"          element={<PrivateRoute adminOnly><AnalyticsPage /></PrivateRoute>} />
          <Route path="members"            element={<PrivateRoute adminOnly><MembersPage /></PrivateRoute>} />
          <Route path="forecast"           element={<PrivateRoute adminOnly><ForecastPage /></PrivateRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}