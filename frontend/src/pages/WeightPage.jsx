import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Plus, X, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { authAPI } from '../utils/api';
import useAuthStore from '../hooks/useAuthStore';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'smartgym_weight_logs';

export default function WeightPage() {
  const { user, updateUser } = useAuthStore();
  const [logs,     setLogs]     = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ weight: '', date: new Date().toISOString().split('T')[0], notes: '' });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${user?.id}`);
    if (saved) {
      setLogs(JSON.parse(saved));
    } else if (user?.weight) {
      // Seed with current profile weight
      const initial = [{ weight: user.weight, date: new Date().toISOString().split('T')[0], notes: 'Starting weight' }];
      setLogs(initial);
      localStorage.setItem(`${STORAGE_KEY}_${user?.id}`, JSON.stringify(initial));
    }
  }, [user?.id]);

  const saveLogs = (newLogs) => {
    setLogs(newLogs);
    localStorage.setItem(`${STORAGE_KEY}_${user?.id}`, JSON.stringify(newLogs));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.weight) return;
    const newLog  = { ...form, weight: parseFloat(form.weight), id: Date.now() };
    const newLogs = [...logs, newLog].sort((a, b) => new Date(a.date) - new Date(b.date));
    saveLogs(newLogs);
    setShowForm(false);
    setForm({ weight: '', date: new Date().toISOString().split('T')[0], notes: '' });
    toast.success('Weight logged!');
  };

  const handleDelete = (id) => {
    saveLogs(logs.filter(l => l.id !== id));
    toast.success('Entry removed');
  };

  const sorted    = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest    = sorted[sorted.length - 1]?.weight || user?.weight || 0;
  const first     = sorted[0]?.weight || latest;
  const change    = parseFloat((latest - first).toFixed(1));
  const minW      = Math.min(...sorted.map(l => l.weight)) - 2;
  const maxW      = Math.max(...sorted.map(l => l.weight)) + 2;
  const bmi       = user?.height ? (latest / ((user.height / 100) ** 2)).toFixed(1) : null;

  const chartData = sorted.map(l => ({
    date:   new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: l.weight,
  }));

  return (
    <div>
      <div className="page-header fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">WEIGHT PROGRESS</h1>
          <p className="page-subtitle">Track your body weight over time</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Log Weight
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Current Weight', value: `${latest} kg`,   color: 'var(--accent)' },
          { label: 'Starting Weight', value: `${first} kg`,   color: '#4ea8de' },
          { label: 'Total Change',   value: `${change > 0 ? '+' : ''}${change} kg`,
            color: change < 0 ? 'var(--accent)' : change > 0 ? 'var(--danger)' : 'var(--text-secondary)' },
          { label: 'BMI',            value: bmi || '—',        color: bmi && parseFloat(bmi) < 25 ? 'var(--accent)' : 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="stat-card fade-in">
            <div className="stat-value" style={{ color: s.color, fontSize: '1.8rem' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            {s.label === 'Total Change' && (
              <div style={{ marginTop: 6 }}>
                {change < 0 ? <TrendingDown size={16} color="var(--accent)" /> :
                 change > 0 ? <TrendingUp   size={16} color="var(--danger)" /> :
                              <Minus        size={16} color="var(--text-muted)" />}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card fade-in" style={{ marginBottom: 20 }}>
        <div className="card-title">Weight Over Time</div>
        {sorted.length < 2 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Log at least 2 entries to see your progress chart 📈
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00e676" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[minW, maxW]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}kg`} />
              <Tooltip formatter={(v) => [`${v} kg`, 'Weight']} />
              {user?.weight && <ReferenceLine y={user.weight} stroke="#4ea8de" strokeDasharray="4 4" label={{ value: 'Start', fill: '#4ea8de', fontSize: 10 }} />}
              <Line type="monotone" dataKey="weight" stroke="#00e676" strokeWidth={2.5}
                dot={{ fill: '#00e676', r: 5, strokeWidth: 2, stroke: '#0a0b0d' }}
                activeDot={{ r: 7, fill: '#00e676' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Log form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
            <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: 24 }}>LOG WEIGHT</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Weight (kg) *</label>
                <input className="form-input" type="number" step="0.1" placeholder="70.5"
                  value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date"
                  value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" placeholder="After morning run..." 
                  value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History table */}
      <div className="card fade-in">
        <div className="card-title">Weight History</div>
        {sorted.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No entries yet. Log your first weight!</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>Weight</th><th>Change</th><th>BMI</th><th>Notes</th><th></th></tr></thead>
              <tbody>
                {[...sorted].reverse().map((log, i, arr) => {
                  const prev   = arr[i + 1];
                  const diff   = prev ? parseFloat((log.weight - prev.weight).toFixed(1)) : null;
                  const logBmi = user?.height ? (log.weight / ((user.height / 100) ** 2)).toFixed(1) : null;
                  return (
                    <tr key={log.id || i}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{new Date(log.date + 'T00:00:00').toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{log.weight} kg</td>
                      <td>
                        {diff !== null && (
                          <span style={{ color: diff < 0 ? 'var(--accent)' : diff > 0 ? 'var(--danger)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                            {diff > 0 ? '+' : ''}{diff} kg
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{logBmi || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{log.notes || '—'}</td>
                      <td>
                        {log.id && (
                          <button onClick={() => handleDelete(log.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.75rem' }}>✕</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}