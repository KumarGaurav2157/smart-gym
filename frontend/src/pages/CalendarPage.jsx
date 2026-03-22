import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Flame, Dumbbell, Calendar } from 'lucide-react';
import { workoutsAPI } from '../utils/api';
import useAuthStore from '../hooks/useAuthStore';
import toast from 'react-hot-toast';

const DAYS    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getCalorieColor(calories) {
  if (!calories || calories === 0) return null;
  if (calories < 200)  return { bg: '#00e67615', border: '#00e67640', text: '#00e676' };
  if (calories < 400)  return { bg: '#00e67625', border: '#00e67660', text: '#00e676' };
  if (calories < 600)  return { bg: '#ffa60020', border: '#ffa60060', text: '#ffa600' };
  return                      { bg: '#ff4d6d20', border: '#ff4d6d60', text: '#ff4d6d' };
}

function getCalorieLabel(calories) {
  if (!calories || calories === 0) return null;
  if (calories < 200)  return 'Light';
  if (calories < 400)  return 'Moderate';
  if (calories < 600)  return 'Active';
  return 'Intense';
}

export default function CalendarPage() {
  const { user }    = useAuthStore();
  const today       = new Date();
  const [current,   setCurrent]   = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [workouts,  setWorkouts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null); // selected date string YYYY-MM-DD

  useEffect(() => {
    workoutsAPI.my({ limit: 200 })
      .then(r => setWorkouts(r.data))
      .catch(() => toast.error('Failed to load workouts'))
      .finally(() => setLoading(false));
  }, []);

  // Build a map: { 'YYYY-MM-DD': { calories, workouts[] } }
  const dayMap = {};
  workouts.forEach(w => {
    const d   = new Date(w.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!dayMap[key]) dayMap[key] = { calories: 0, workouts: [] };
    dayMap[key].calories  += w.calories_burned || 0;
    dayMap[key].workouts.push(w);
  });

  // Calendar grid
  const firstDay   = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const cells      = [];
  for (let i = 0; i < firstDay; i++)       cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)   cells.push(d);

  const prevMonth = () => setCurrent(c => {
    if (c.month === 0) return { year: c.year - 1, month: 11 };
    return { year: c.year, month: c.month - 1 };
  });
  const nextMonth = () => setCurrent(c => {
    if (c.month === 11) return { year: c.year + 1, month: 0 };
    return { year: c.year, month: c.month + 1 };
  });

  const getKey = (day) =>
    `${current.year}-${String(current.month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  // Monthly stats
  const monthKeys    = Object.keys(dayMap).filter(k => k.startsWith(`${current.year}-${String(current.month+1).padStart(2,'0')}`));
  const monthCals    = monthKeys.reduce((s, k) => s + dayMap[k].calories, 0);
  const activeDays   = monthKeys.length;
  const bestDay      = monthKeys.reduce((best, k) => dayMap[k].calories > (dayMap[best]?.calories || 0) ? k : best, monthKeys[0]);
  const bestCals     = bestDay ? Math.round(dayMap[bestDay]?.calories || 0) : 0;

  const selectedData = selected ? dayMap[selected] : null;

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">CALORIE CALENDAR</h1>
        <p className="page-subtitle">Track your daily calorie burn across the month</p>
      </div>

      {/* Monthly Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Month Total',   value: `${Math.round(monthCals).toLocaleString()} kcal`, icon: <Flame size={18} />,    color: 'var(--accent)' },
          { label: 'Active Days',   value: `${activeDays} days`,                              icon: <Calendar size={18} />, color: '#4ea8de' },
          { label: 'Daily Average', value: `${activeDays ? Math.round(monthCals / activeDays) : 0} kcal`, icon: <Flame size={18} />, color: '#ffa600' },
          { label: 'Best Day',      value: `${bestCals} kcal`,                                icon: <Dumbbell size={18} />, color: '#ff4d6d' },
        ].map(s => (
          <div key={s.label} className="stat-card fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-value" style={{ color: s.color, fontSize: '1.8rem' }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div style={{ color: s.color, opacity: 0.7 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Calendar */}
        <div className="card fade-in">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button onClick={prevMonth} className="btn btn-ghost btn-sm">
              <ChevronLeft size={16} />
            </button>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.08em' }}>
              {MONTHS[current.month]} {current.year}
            </h2>
            <button onClick={nextMonth} className="btn btn-ghost btn-sm">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;

              const key      = getKey(day);
              const data     = dayMap[key];
              const calories = data ? Math.round(data.calories) : 0;
              const color    = getCalorieColor(calories);
              const isToday  = key === todayKey;
              const isSel    = key === selected;

              return (
                <div
                  key={key}
                  onClick={() => setSelected(isSel ? null : key)}
                  style={{
                    borderRadius: 8,
                    padding: '6px 4px',
                    textAlign: 'center',
                    cursor: data ? 'pointer' : 'default',
                    background: isSel ? 'var(--accent)' : color ? color.bg : 'transparent',
                    border: `1px solid ${isSel ? 'var(--accent)' : isToday ? 'var(--accent)' : color ? color.border : 'var(--border)'}`,
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    minHeight: 52,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                  }}
                >
                  {/* Day number */}
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    fontWeight: isToday ? 700 : 500,
                    color: isSel ? '#0a0b0d' : isToday ? 'var(--accent)' : color ? color.text : 'var(--text-secondary)',
                  }}>
                    {day}
                  </div>

                  {/* Calories */}
                  {calories > 0 && (
                    <div style={{
                      fontSize: '0.6rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: isSel ? '#0a0b0d' : color?.text,
                      lineHeight: 1,
                    }}>
                      🔥{calories}
                    </div>
                  )}

                  {/* Workout count dot */}
                  {data && data.workouts.length > 0 && (
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      {data.workouts.slice(0, 3).map((_, idx) => (
                        <div key={idx} style={{
                          width: 4, height: 4,
                          borderRadius: '50%',
                          background: isSel ? '#0a0b0d' : color?.text || 'var(--accent)',
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Light',    color: '#00e676', cal: '<200 kcal' },
              { label: 'Moderate', color: '#00e676', cal: '200-400 kcal' },
              { label: 'Active',   color: '#ffa600', cal: '400-600 kcal' },
              { label: 'Intense',  color: '#ff4d6d', cal: '600+ kcal' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color, opacity: 0.7 }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{l.label} ({l.cal})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selected && selectedData ? (
            <div className="card fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div className="card-title" style={{ marginBottom: 2 }}>
                    {new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <span className={`badge ${getCalorieLabel(selectedData.calories) === 'Intense' ? 'badge-red' : getCalorieLabel(selectedData.calories) === 'Active' ? 'badge-yellow' : 'badge-green'}`}>
                    {getCalorieLabel(selectedData.calories)}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--accent)' }}>
                    {Math.round(selectedData.calories)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    kcal burned
                  </div>
                </div>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                {selectedData.workouts.length} Workout{selectedData.workouts.length > 1 ? 's' : ''}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedData.workouts.map((w, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{w.workout_type}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {w.duration_minutes} min
                        {w.notes && ` · ${w.notes}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
                        🔥 {Math.round(w.calories_burned || 0)}
                      </div>
                      <span className={`badge ${w.difficulty === 'hard' ? 'badge-red' : w.difficulty === 'easy' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.6rem' }}>
                        {w.difficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📅</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 8 }}>
                SELECT A DAY
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Click any highlighted day on the calendar to see your workout details
              </p>
            </div>
          )}

          {/* Weekly Summary */}
          <div className="card fade-in">
            <div className="card-title">This Week</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 7 }, (_, i) => {
                const d   = new Date(today);
                d.setDate(today.getDate() - today.getDay() + i);
                const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                const data = dayMap[key];
                const cal  = data ? Math.round(data.calories) : 0;
                const max  = 700;
                const pct  = Math.min((cal / max) * 100, 100);
                const isT  = key === todayKey;

                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: isT ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isT ? 700 : 400 }}>
                      {DAYS[i]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{
                          width: `${pct}%`,
                          background: pct > 80 ? 'linear-gradient(90deg, #ff4d6d, #ff8a65)' :
                                      pct > 50 ? 'linear-gradient(90deg, #ffa600, #ffcc02)' :
                                      'linear-gradient(90deg, var(--accent), #00ff88)'
                        }} />
                      </div>
                    </div>
                    <div style={{ width: 60, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: cal > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {cal > 0 ? `${cal} kcal` : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}