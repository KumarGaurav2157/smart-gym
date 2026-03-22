import React, { useEffect, useState } from 'react';
import { Users, Dumbbell, TrendingUp, AlertTriangle, Activity, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useAuthStore from '../hooks/useAuthStore';
import { analyticsAPI, workoutsAPI, membersAPI } from '../utils/api';

const PIE_COLORS = ['#00e676', '#4ea8de', '#ffa600', '#ff4d6d'];

function StatCard({ icon, label, value, change, changeDir }) {
  return (
    <div className="stat-card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
          {change && <div className={`stat-change ${changeDir}`}>{changeDir === 'up' ? '↑' : '↓'} {change}</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [data, setData] = useState(null);
  const [myWorkouts, setMyWorkouts] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (isAdmin) {
          const { data: d } = await analyticsAPI.dashboard();
          setData(d);
        } else {
          const [wRes, sRes] = await Promise.all([
            workoutsAPI.my({ limit: 10 }),
            membersAPI.stats(user.id),
          ]);
          setMyWorkouts(wRes.data);
          setMyStats(sRes.data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [isAdmin, user?.id]);

  if (loading) return <div className="spinner" />;

  // ── Admin Dashboard ─────────────────────────────────────────────────────────
  if (isAdmin && data) return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">DASHBOARD</h1>
        <p className="page-subtitle">Real-time gym performance overview</p>
      </div>

      <div className="grid-stat" style={{ marginBottom: 28 }}>
        <StatCard icon={<Users size={18} />}     label="Total Members"      value={data.total_members}                change="3.2% this month"  changeDir="up" />
        <StatCard icon={<Activity size={18} />}  label="Active Members"     value={data.active_members}               change="1.5%"              changeDir="up" />
        <StatCard icon={<DollarSign size={18} />}label="Monthly Revenue"    value={`$${data.monthly_revenue.toLocaleString()}`} change="8.1%" changeDir="up" />
        <StatCard icon={<Dumbbell size={18} />}  label="Workouts Today"     value={data.total_workouts_today}         change=""                  changeDir="up" />
        <StatCard icon={<AlertTriangle size={18}/>} label="Churn Risk"      value={data.churn_risk_count}             change="members at risk"   changeDir="down" />
        <StatCard icon={<TrendingUp size={18} />}label="Attendance Rate"    value={`${data.avg_attendance_rate}%`}   change="vs last month"     changeDir="up" />
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card fade-in fade-in-delay-1">
          <div className="card-title">Revenue Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.revenue_trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00e676" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#00e676" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card fade-in fade-in-delay-2">
          <div className="card-title">Member Segments</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={data.member_segments} dataKey="count" nameKey="segment" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {data.member_segments.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {data.member_segments.map((s, i) => (
                <div key={s.segment} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i] }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.segment}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{s.count}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card fade-in fade-in-delay-3">
        <div className="card-title">Attendance (Last 7 Days)</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data.attendance_trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4ea8de" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4ea8de" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#4ea8de" fill="url(#att)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // ── Member Dashboard ─────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">WELCOME, {user?.full_name?.split(' ')[0]?.toUpperCase()}</h1>
        <p className="page-subtitle">Here's your fitness overview</p>
      </div>

      {myStats && (
        <div className="grid-stat" style={{ marginBottom: 28 }}>
          <StatCard icon={<Dumbbell size={18} />}    label="Total Workouts"    value={myStats.total_workouts}   />
          <StatCard icon={<Activity size={18} />}     label="Gym Visits"        value={myStats.total_visits}     />
          <StatCard icon={<TrendingUp size={18} />}   label="Calories Burned"   value={myStats.total_calories?.toFixed(0) || 0} />
          <StatCard icon={<DollarSign size={18} />}   label="Total Spent"       value={`$${myStats.total_spent?.toFixed(0) || 0}`} />
        </div>
      )}

      <div className="card fade-in">
        <div className="card-title">Recent Workouts</div>
        {myWorkouts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
            No workouts logged yet. <a href="/workouts">Log your first workout →</a>
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Type</th><th>Duration</th><th>Calories</th><th>Difficulty</th><th>Date</th></tr>
              </thead>
              <tbody>
                {myWorkouts.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 500 }}>{w.workout_type}</td>
                    <td>{w.duration_minutes} min</td>
                    <td>{w.calories_burned ? `${w.calories_burned} kcal` : '—'}</td>
                    <td>
                      <span className={`badge ${w.difficulty === 'hard' ? 'badge-red' : w.difficulty === 'easy' ? 'badge-green' : 'badge-yellow'}`}>
                        {w.difficulty}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
