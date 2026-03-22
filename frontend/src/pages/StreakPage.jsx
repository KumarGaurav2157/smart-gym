import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Target, Zap } from 'lucide-react';
import { workoutsAPI } from '../utils/api';
import useAuthStore from '../hooks/useAuthStore';

export default function StreakPage() {
  const { user }   = useAuthStore();
  const [workouts, setWorkouts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    workoutsAPI.my({ limit: 200 }).then(r => setWorkouts(r.data)).finally(() => setLoading(false));
  }, []);

  // Build set of workout dates
  const workoutDates = new Set(
    workouts.map(w => {
      const d = new Date(w.created_at);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })
  );

  // Calculate current streak
  const calcCurrentStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (workoutDates.has(key)) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  // Calculate longest streak
  const calcLongestStreak = () => {
    const dates = Array.from(workoutDates).sort();
    let longest = 0, current = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i-1]);
      const curr = new Date(dates[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) { current++; longest = Math.max(longest, current); }
      else current = 1;
    }
    return Math.max(longest, dates.length > 0 ? 1 : 0);
  };

  const currentStreak = calcCurrentStreak();
  const longestStreak = calcLongestStreak();
  const totalDays     = workoutDates.size;
  const thisWeek      = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return { day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i], done: workoutDates.has(key) };
  });

  // Last 30 days grid
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return { key, done: workoutDates.has(key), date: d.getDate() };
  });

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">WORKOUT STREAK</h1>
        <p className="page-subtitle">Stay consistent, build habits, achieve goals</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Current Streak', value: `${currentStreak} 🔥`, color: 'var(--accent)',  icon: <Flame size={18} /> },
          { label: 'Longest Streak', value: `${longestStreak} 🏆`, color: '#ffa600',        icon: <Trophy size={18} /> },
          { label: 'Total Active Days', value: totalDays,           color: '#4ea8de',        icon: <Target size={18} /> },
          { label: 'This Week',      value: `${thisWeek.filter(d=>d.done).length}/7`,        color: '#ff4d6d', icon: <Zap size={18} /> },
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
        {/* This Week */}
        <div className="card fade-in">
          <div className="card-title">This Week</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            {thisWeek.map(({ day, done }) => (
              <div key={day} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  width: '100%', aspectRatio: '1', borderRadius: 10, marginBottom: 6,
                  background: done ? 'var(--accent)' : 'var(--bg-secondary)',
                  border: `2px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: done ? '1.2rem' : '0.6rem', color: done ? '#0a0b0d' : 'var(--text-muted)',
                  boxShadow: done ? 'var(--accent-glow)' : 'none',
                  transition: 'all 0.3s ease',
                }}>
                  {done ? '🔥' : '○'}
                </div>
                <div style={{ fontSize: '0.68rem', color: done ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {day}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motivation */}
        <div className="card fade-in fade-in-delay-1" style={{ background: currentStreak >= 7 ? 'linear-gradient(135deg, #0f1a12, #0a0b0d)' : 'var(--bg-card)', borderColor: currentStreak >= 7 ? 'var(--accent)' : 'var(--border)' }}>
          <div className="card-title">Motivation</div>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>
            {currentStreak === 0 ? '💪' : currentStreak < 3 ? '🌱' : currentStreak < 7 ? '🔥' : currentStreak < 14 ? '⚡' : currentStreak < 30 ? '🏆' : '👑'}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 8 }}>
            {currentStreak === 0 && 'START YOUR STREAK TODAY!'}
            {currentStreak === 1 && 'GREAT START! KEEP GOING!'}
            {currentStreak >= 2  && currentStreak < 7  && `${currentStreak} DAYS STRONG!`}
            {currentStreak >= 7  && currentStreak < 14 && 'ONE WEEK WARRIOR! 🔥'}
            {currentStreak >= 14 && currentStreak < 30 && 'TWO WEEK CHAMPION! ⚡'}
            {currentStreak >= 30 && 'LEGENDARY STREAK! 👑'}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            {currentStreak === 0 && 'Log a workout today to start your streak. Every journey begins with a single step!'}
            {currentStreak >= 1  && currentStreak < 7  && `You're on a ${currentStreak}-day streak! Don't break the chain — log a workout today!`}
            {currentStreak >= 7  && `Incredible! ${currentStreak} consecutive days of training. You are unstoppable!`}
          </p>
        </div>
      </div>

      {/* Last 30 days */}
      <div className="card fade-in" style={{ marginTop: 20 }}>
        <div className="card-title">Last 30 Days Activity</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {last30.map(({ key, done, date }) => (
            <div key={key} title={key} style={{
              width: 36, height: 36, borderRadius: 8,
              background: done ? 'var(--accent)' : 'var(--bg-secondary)',
              border: `1px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
              color: done ? '#0a0b0d' : 'var(--text-muted)',
              fontWeight: done ? 700 : 400,
              boxShadow: done ? 'var(--accent-glow)' : 'none',
              transition: 'all 0.2s ease',
            }}>
              {done ? '🔥' : date}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--accent)' }} /> Workout day
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }} /> Rest day
          </div>
        </div>
      </div>
    </div>
  );
}