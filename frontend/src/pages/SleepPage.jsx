import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Plus, X, Moon, Sun, Clock } from 'lucide-react';
import useAuthStore from '../hooks/useAuthStore';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'smartgym_sleep_logs';

function getSleepQuality(hours) {
  if (hours >= 8)  return { label: 'Excellent', color: 'var(--accent)',  badge: 'badge-green'  };
  if (hours >= 7)  return { label: 'Good',      color: '#4ea8de',        badge: 'badge-blue'   };
  if (hours >= 6)  return { label: 'Fair',      color: 'var(--warning)', badge: 'badge-yellow' };
  return                  { label: 'Poor',      color: 'var(--danger)',  badge: 'badge-red'    };
}

export default function SleepPage() {
  const { user }   = useAuthStore();
  const [logs,     setLogs]     = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({
    date: new Date().toISOString().split('T')[0],
    bedtime: '22:00', wakeup: '06:00', notes: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${user?.id}`);
    if (saved) setLogs(JSON.parse(saved));
  }, [user?.id]);

  const saveLogs = (newLogs) => {
    setLogs(newLogs);
    localStorage.setItem(`${STORAGE_KEY}_${user?.id}`, JSON.stringify(newLogs));
  };

  const calcHours = (bedtime, wakeup) => {
    const [bh, bm] = bedtime.split(':').map(Number);
    const [wh, wm] = wakeup.split(':').map(Number);
    let hours = (wh + wm / 60) - (bh + bm / 60);
    if (hours < 0) hours += 24;
    return parseFloat(hours.toFixed(1));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const hours  = calcHours(form.bedtime, form.wakeup);
    const newLog = { ...form, hours, id: Date.now() };
    const newLogs = [...logs, newLog].sort((a, b) => new Date(a.date) - new Date(b.date));
    saveLogs(newLogs);
    setShowForm(false);
    toast.success(`${hours} hours logged!`);
  };

  const sorted   = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const last7    = sorted.slice(-7);
  const avgSleep = sorted.length ? parseFloat((sorted.reduce((s, l) => s + l.hours, 0) / sorted.length).toFixed(1)) : 0;
  const bestNight = sorted.reduce((best, l) => l.hours > (best?.hours || 0) ? l : best, null);
  const tonight   = calcHours(form.bedtime, form.wakeup);

  const chartData = last7.map(l => ({
    date:  new Date(l.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    hours: l.hours,
    quality: getSleepQuality(l.hours).label,
  }));

  return (
    <div>
      <div className="page-header fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">SLEEP TRACKER</h1>
          <p className="page-subtitle">Monitor your sleep for better recovery and performance</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Log Sleep
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Avg Sleep',    value: `${avgSleep}h`,                             color: '#4ea8de',        icon: <Moon size={18} /> },
          { label: 'Last Night',   value: sorted.length ? `${sorted[sorted.length-1].hours}h` : '—', color: 'var(--accent)', icon: <Clock size={18} /> },
          { label: 'Best Night',   value: bestNight ? `${bestNight.hours}h` : '—',    color: 'var(--warning)', icon: <Sun size={18} />  },
          { label: 'Nights Logged',value: sorted.length,                               color: '#ff4d6d',        icon: <Moon size={18} /> },
        ].map(s => (
          <div key={s.label} className="stat-card fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-value" style={{ color: s.color, fontSize: '2rem' }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div style={{ color: s.color, opacity: 0.6 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Chart */}
        <div className="card fade-in">
          <div className="card-title">Last 7 Nights</div>
          {chartData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No sleep data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 12]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}h`} />
                <Tooltip formatter={(v) => [`${v} hours`, 'Sleep']} />
                <ReferenceLine y={8} stroke="var(--accent)" strokeDasharray="4 4" label={{ value: '8h goal', fill: 'var(--accent)', fontSize: 10 }} />
                <Bar dataKey="hours" fill="#4ea8de" radius={[4, 4, 0, 0]}
                  label={false}
                  cell={(entry) => {
                    const q = getSleepQuality(entry.hours);
                    return <rect fill={q.color} />;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sleep Quality Guide */}
        <div className="card fade-in fade-in-delay-1">
          <div className="card-title">Sleep Quality Guide</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { range: '8+ hours',   label: 'Excellent', color: 'var(--accent)',  desc: 'Optimal recovery and performance' },
              { range: '7-8 hours',  label: 'Good',      color: '#4ea8de',        desc: 'Good recovery, slight fatigue' },
              { range: '6-7 hours',  label: 'Fair',      color: 'var(--warning)', desc: 'Reduced performance, more recovery needed' },
              { range: '<6 hours',   label: 'Poor',      color: 'var(--danger)',  desc: 'Poor recovery, affects workout quality' },
            ].map(q => (
              <div key={q.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: q.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{q.range} — {q.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--accent-dim)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--accent)', border: '1px solid #00e67630' }}>
            💡 Your average: <strong>{avgSleep}h</strong> — {getSleepQuality(avgSleep).label}
          </div>
        </div>
      </div>

      {/* Log form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
            <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: 24 }}>LOG SLEEP</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">🌙 Bedtime</label>
                  <input className="form-input" type="time" value={form.bedtime} onChange={e => setForm(p => ({ ...p, bedtime: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">☀️ Wake Up</label>
                  <input className="form-input" type="time" value={form.wakeup} onChange={e => setForm(p => ({ ...p, wakeup: e.target.value }))} />
                </div>
              </div>
              {/* Preview */}
              <div style={{ padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', color: 'var(--accent)', border: '1px solid #00e67630' }}>
                🛌 Total sleep: <strong>{tonight}h</strong> — {getSleepQuality(tonight).label}
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" placeholder="Felt rested, had dreams..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History */}
      <div className="card fade-in" style={{ marginTop: 20 }}>
        <div className="card-title">Sleep History</div>
        {sorted.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>No sleep logs yet!</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>Bedtime</th><th>Wake Up</th><th>Duration</th><th>Quality</th><th>Notes</th></tr></thead>
              <tbody>
                {[...sorted].reverse().map((log, i) => {
                  const q = getSleepQuality(log.hours);
                  return (
                    <tr key={log.id || i}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{new Date(log.date + 'T00:00:00').toLocaleDateString()}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>🌙 {log.bedtime}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>☀️ {log.wakeup}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: q.color, fontWeight: 600 }}>{log.hours}h</td>
                      <td><span className={`badge ${q.badge}`}>{q.label}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{log.notes || '—'}</td>
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