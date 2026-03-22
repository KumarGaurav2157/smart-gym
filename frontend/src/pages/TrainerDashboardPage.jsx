import React, { useEffect, useState } from 'react';
import { trainersAPI } from '../utils/api';
import useAuthStore from '../hooks/useAuthStore';
import toast from 'react-hot-toast';
import { Users, TrendingUp, AlertTriangle, Star, Dumbbell } from 'lucide-react';

const PERF_CONFIG = {
  excellent:       { label: 'Excellent',       badge: 'badge-green',  color: 'var(--accent)',  emoji: '🏆' },
  good:            { label: 'Good',            badge: 'badge-blue',   color: '#4ea8de',        emoji: '👍' },
  average:         { label: 'Average',         badge: 'badge-yellow', color: 'var(--warning)', emoji: '📈' },
  needs_attention: { label: 'Needs Attention', badge: 'badge-red',    color: 'var(--danger)',  emoji: '⚠️' },
};

export default function TrainerDashboardPage() {
  const { user }    = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [members,   setMembers]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [filter,    setFilter]    = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const dash = await trainersAPI.myDashboard();
        setDashboard(dash.data);
        const mem = await trainersAPI.members(dash.data.trainer_id);
        setMembers(mem.data);
      } catch (e) {
        toast.error('Could not load trainer dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = members.filter(m => {
    if (filter === 'all')             return true;
    if (filter === 'needs_attention') return m.performance === 'needs_attention';
    if (filter === 'excellent')       return m.performance === 'excellent';
    if (filter === 'inactive')        return m.days_since_workout > 7;
    return true;
  });

  if (loading) return <div className="spinner" />;

  if (!dashboard) return (
    <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>👨‍💼</div>
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>NO TRAINER PROFILE</h2>
      <p style={{ color: 'var(--text-muted)' }}>Your account needs a trainer profile linked. Contact admin.</p>
    </div>
  );

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">TRAINER DASHBOARD</h1>
        <p className="page-subtitle">Monitor your members' progress and performance</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Members',   value: dashboard.total_members,   color: 'var(--accent)', icon: <Users size={18} />        },
          { label: 'Active (30d)',    value: dashboard.active_members,  color: '#4ea8de',       icon: <TrendingUp size={18} />   },
          { label: 'Need Attention',  value: dashboard.needs_attention, color: 'var(--danger)', icon: <AlertTriangle size={18} /> },
          { label: 'Total Workouts',  value: dashboard.total_workouts,  color: '#ffa600',       icon: <Dumbbell size={18} />     },
        ].map(s => (
          <div key={s.label} className="stat-card fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div style={{ color: s.color, opacity: 0.6 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'all',             label: `All (${members.length})`                                                    },
          { key: 'needs_attention', label: `⚠️ Needs Attention (${members.filter(m => m.performance === 'needs_attention').length})` },
          { key: 'excellent',       label: `🏆 Excellent (${members.filter(m => m.performance === 'excellent').length})`             },
          { key: 'inactive',        label: `😴 Inactive 7d+ (${members.filter(m => m.days_since_workout > 7).length})`              },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`btn ${filter === f.key ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className={selected ? 'grid-2' : ''} style={{ alignItems: 'start' }}>
        {/* Members table */}
        <div className="card fade-in">
          <div className="card-title">Member Progress ({filtered.length})</div>
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>
              No members assigned yet.
            </p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Performance</th>
                    <th>Score</th>
                    <th>Workouts (30d)</th>
                    <th>Calories (30d)</th>
                    <th>Last Workout</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => {
                    const perf = PERF_CONFIG[m.performance] || PERF_CONFIG.average;
                    return (
                      <tr key={m.id}
                        onClick={() => setSelected(selected?.id === m.id ? null : m)}
                        style={{ cursor: 'pointer', background: selected?.id === m.id ? 'var(--accent-dim)' : 'transparent' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: perf.color + '30', border: `2px solid ${perf.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: perf.color, flexShrink: 0 }}>
                              {m.full_name?.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.full_name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                {m.goal?.replace(/_/g, ' ')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${perf.badge}`}>
                            {perf.emoji} {perf.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                              <div className="progress-fill" style={{ width: `${m.progress_score}%`, background: perf.color }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: perf.color }}>{m.progress_score}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#4ea8de' }}>{m.workouts_30d}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                          {Math.round(m.calories_30d).toLocaleString()} kcal
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: m.days_since_workout > 7 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {m.last_workout ? `${m.days_since_workout}d ago` : 'Never'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Member detail panel */}
        {selected && (() => {
          const perf = PERF_CONFIG[selected.performance] || PERF_CONFIG.average;
          const bmi  = selected.weight && selected.height
            ? (selected.weight / ((selected.height / 100) ** 2)).toFixed(1)
            : null;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card fade-in" style={{ borderColor: perf.color }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: perf.color + '25', border: `2px solid ${perf.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: perf.color }}>
                      {selected.full_name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{selected.full_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selected.email}</div>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</button>
                </div>

                {/* Performance badge */}
                <div style={{ padding: '12px 16px', background: perf.color + '15', borderRadius: 10, border: `1px solid ${perf.color}40`, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.5rem' }}>{perf.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: perf.color }}>{perf.label} Performance</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score: {selected.progress_score}/100</div>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Workouts (30d)', value: selected.workouts_30d,                            color: '#4ea8de' },
                    { label: 'Workouts (7d)',  value: selected.workouts_7d,                             color: 'var(--accent)' },
                    { label: 'Calories (30d)', value: `${Math.round(selected.calories_30d)} kcal`,      color: '#ffa600' },
                    { label: 'Avg Duration',   value: `${selected.avg_duration} min`,                   color: 'var(--accent)' },
                    { label: 'Total Workouts', value: selected.total_workouts,                          color: '#4ea8de' },
                    { label: 'BMI',            value: bmi || '—',                                       color: bmi && parseFloat(bmi) < 25 ? 'var(--accent)' : 'var(--warning)' },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Body stats */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                  {[
                    { label: 'Age',    value: selected.age    ? `${selected.age} yrs`  : '—' },
                    { label: 'Weight', value: selected.weight ? `${selected.weight} kg`: '—' },
                    { label: 'Height', value: selected.height ? `${selected.height} cm`: '—' },
                    { label: 'Goal',   value: selected.goal?.replace(/_/g, ' ') || '—'        },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '6px 12px', background: 'var(--bg-hover)', borderRadius: 20, fontSize: '0.78rem', color: 'var(--text-secondary)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{s.label}: </span>{s.value}
                    </div>
                  ))}
                </div>

                {/* Trainer recommendation */}
                <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>💡 Trainer Recommendation</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {selected.performance === 'excellent'       && `${selected.full_name.split(' ')[0]} is performing exceptionally! Consider adding advanced training challenges and increasing intensity to keep them motivated.`}
                    {selected.performance === 'good'            && `${selected.full_name.split(' ')[0]} is on track. Encourage them to push for one more session per week to reach the next level.`}
                    {selected.performance === 'average'         && `${selected.full_name.split(' ')[0]} needs more consistency. Schedule a check-in to understand barriers and adjust their program.`}
                    {selected.performance === 'needs_attention' && `⚠️ ${selected.full_name.split(' ')[0]} hasn't been active recently (${selected.days_since_workout} days since last workout). Reach out immediately to re-engage them before they churn.`}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}