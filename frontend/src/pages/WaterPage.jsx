import React, { useState, useEffect } from 'react';
import { Droplets, Plus, Minus, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import useAuthStore from '../hooks/useAuthStore';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'smartgym_water_logs';
const GOAL_ML     = 2500; // daily goal

const QUICK_AMOUNTS = [
  { label: 'Sip',    ml: 100,  icon: '💧' },
  { label: 'Glass',  ml: 250,  icon: '🥛' },
  { label: 'Bottle', ml: 500,  icon: '🍶' },
  { label: 'Large',  ml: 750,  icon: '🫙' },
];

export default function WaterPage() {
  const { user }  = useAuthStore();
  const todayKey  = new Date().toISOString().split('T')[0];
  const [allLogs, setAllLogs] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${user?.id}`);
    if (saved) setAllLogs(JSON.parse(saved));
  }, [user?.id]);

  const saveLogs = (newLogs) => {
    setAllLogs(newLogs);
    localStorage.setItem(`${STORAGE_KEY}_${user?.id}`, JSON.stringify(newLogs));
  };

  const todayTotal  = (allLogs[todayKey] || []).reduce((s, e) => s + e.ml, 0);
  const percentage  = Math.min((todayTotal / GOAL_ML) * 100, 100);

  const addWater = (ml) => {
    const entry   = { ml, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), id: Date.now() };
    const dayLogs = [...(allLogs[todayKey] || []), entry];
    saveLogs({ ...allLogs, [todayKey]: dayLogs });
    if (todayTotal + ml >= GOAL_ML && todayTotal < GOAL_ML) toast.success('🎉 Daily goal reached!');
    else toast.success(`+${ml}ml added!`);
  };

  const removeEntry = (id) => {
    const dayLogs = (allLogs[todayKey] || []).filter(e => e.id !== id);
    saveLogs({ ...allLogs, [todayKey]: dayLogs });
  };

  const resetToday = () => {
    saveLogs({ ...allLogs, [todayKey]: [] });
    toast.success('Today reset!');
  };

  // Last 7 days chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d   = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const ml  = (allLogs[key] || []).reduce((s, e) => s + e.ml, 0);
    return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), ml, goal: GOAL_ML };
  });

  const avgMl    = Math.round(last7.reduce((s, d) => s + d.ml, 0) / 7);
  const goalDays = last7.filter(d => d.ml >= GOAL_ML).length;

  // Water level color
  const waterColor = percentage >= 100 ? 'var(--accent)' : percentage >= 60 ? '#4ea8de' : percentage >= 30 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">WATER TRACKER</h1>
        <p className="page-subtitle">Stay hydrated for peak performance — goal: {GOAL_ML}ml/day</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: "Today's Intake",  value: `${todayTotal}ml`,  color: waterColor },
          { label: 'Daily Goal',      value: `${GOAL_ML}ml`,     color: 'var(--text-secondary)' },
          { label: '7-Day Average',   value: `${avgMl}ml`,       color: '#4ea8de' },
          { label: 'Goals Hit (7d)',  value: `${goalDays}/7`,    color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="stat-card fade-in">
            <div className="stat-value" style={{ color: s.color, fontSize: '1.8rem' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Today's tracker */}
        <div className="card fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Today</div>
            <button onClick={resetToday} className="btn btn-ghost btn-sm">
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          {/* Big water display */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 16px', borderRadius: '50%', background: 'var(--bg-secondary)', border: `4px solid ${waterColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: `0 0 30px ${waterColor}40` }}>
              <div style={{ fontSize: '2rem' }}>💧</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: waterColor }}>{Math.round(percentage)}%</div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: waterColor, fontWeight: 600 }}>
              {todayTotal}ml / {GOAL_ML}ml
            </div>
            <div className="progress-bar" style={{ marginTop: 10, height: 10, borderRadius: 5 }}>
              <div className="progress-fill" style={{ width: `${percentage}%`, background: `linear-gradient(90deg, ${waterColor}, ${waterColor}cc)`, transition: 'width 0.5s ease' }} />
            </div>
            {percentage >= 100 && (
              <div style={{ marginTop: 8, color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>
                🎉 Daily goal achieved!
              </div>
            )}
          </div>

          {/* Quick add buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
            {QUICK_AMOUNTS.map(({ label, ml, icon }) => (
              <button key={label} onClick={() => addWater(ml)} style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 4px', cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.2s ease', color: 'var(--text-primary)',
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = waterColor; e.currentTarget.style.background = '#4ea8de18'; }}
                onMouseOut={e  => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{label}</div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{ml}ml</div>
              </button>
            ))}
          </div>

          {/* Today's log */}
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {(allLogs[todayKey] || []).length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px 0' }}>
                No water logged yet today. Stay hydrated! 💧
              </p>
            ) : (
              [...(allLogs[todayKey] || [])].reverse().map(entry => (
                <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1rem' }}>💧</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#4ea8de', fontWeight: 600 }}>{entry.ml}ml</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{entry.time}</span>
                    <button onClick={() => removeEntry(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.75rem' }}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 7-day chart + tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card fade-in fade-in-delay-1">
            <div className="card-title">Last 7 Days</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={last7} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v/1000}L`} />
                <Tooltip formatter={(v) => [`${v}ml`, 'Water']} />
                <ReferenceLine y={GOAL_ML} stroke="var(--accent)" strokeDasharray="4 4" label={{ value: 'Goal', fill: 'var(--accent)', fontSize: 10 }} />
                <Bar dataKey="ml" fill="#4ea8de" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card fade-in fade-in-delay-2">
            <div className="card-title">Hydration Tips</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { tip: 'Drink 500ml first thing in the morning', icon: '🌅' },
                { tip: 'Have a glass before every meal',         icon: '🍽️' },
                { tip: 'Drink 500ml before and after workout',   icon: '🏋️' },
                { tip: 'Set hourly reminders on your phone',     icon: '⏰' },
                { tip: 'Drink more in hot weather or high intensity', icon: '🌡️' },
              ].map(t => (
                <div key={t.tip} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{t.icon}</span>
                  <span>{t.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}