// ─── AnalyticsPage ────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { analyticsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.dashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;
  if (!data) return null;

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">ANALYTICS</h1>
        <p className="page-subtitle">Comprehensive gym performance metrics</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card fade-in">
          <div className="card-title">Monthly Revenue</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.revenue_trend} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#00e676" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card fade-in fade-in-delay-1">
          <div className="card-title">Daily Attendance</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.attendance_trend} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#4ea8de" strokeWidth={2} dot={{ fill: '#4ea8de', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card fade-in fade-in-delay-2">
        <div className="card-title">Top Workout Types</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.top_workout_types} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
            <Tooltip />
            <Bar dataKey="count" fill="#ffa600" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
