import React, { useEffect, useState } from 'react';
import { Brain, Utensils, Flame, Clock } from 'lucide-react';
import { recommendationsAPI, predictionsAPI } from '../utils/api';
import useAuthStore from '../hooks/useAuthStore';
import toast from 'react-hot-toast';

const INTENSITY_COLOR = { High: 'badge-red', Medium: 'badge-yellow', Low: 'badge-green', None: 'badge-gray' };

export default function RecommendationsPage() {
  const { user } = useAuthStore();
  const [recs,    setRecs]    = useState(null);
  const [churn,   setChurn]   = useState(null);
  const [segment, setSegment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, cRes, sRes] = await Promise.all([
          recommendationsAPI.get(),
          predictionsAPI.churn(user.id),
          predictionsAPI.segment(user.id),
        ]);
        setRecs(rRes.data);
        setChurn(cRes.data);
        setSegment(sRes.data);
      } catch { toast.error('Failed to load recommendations'); }
      finally { setLoading(false); }
    };
    load();
  }, [user.id]);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">AI PLAN</h1>
        <p className="page-subtitle">Personalised workout and nutrition plan powered by machine learning</p>
      </div>

      {/* Member Insights */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {churn && (
          <div className={`card fade-in`} style={{ borderColor: churn.risk_level === 'high' ? 'var(--danger)' : churn.risk_level === 'medium' ? 'var(--warning)' : 'var(--accent)' }}>
            <div className="card-title">Engagement Score</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div>
                <div className="stat-value" style={{ color: churn.risk_level === 'high' ? 'var(--danger)' : churn.risk_level === 'medium' ? 'var(--warning)' : 'var(--accent)' }}>
                  {Math.round((1 - churn.churn_probability) * 100)}%
                </div>
                <div className="stat-label">Retention Score</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(1 - churn.churn_probability) * 100}%`, background: churn.risk_level === 'high' ? 'var(--danger)' : churn.risk_level === 'medium' ? 'var(--warning)' : 'linear-gradient(90deg, var(--accent), #00ff88)' }} />
                </div>
                <div style={{ marginTop: 12 }}>
                  {churn.key_factors.map(f => (
                    <div key={f} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>• {f}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {segment && (
          <div className="card fade-in fade-in-delay-1">
            <div className="card-title">Your Segment</div>
            <div className="stat-value">{segment.segment_label?.toUpperCase()}</div>
            <div className="stat-label">Member Category</div>
            <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {segment.segment_label === 'VIP'        && 'Elite member — you are in our top tier! You receive priority booking, exclusive classes, and dedicated support.'}
              {segment.segment_label === 'Power User' && 'You train hard and often. Keep pushing — exclusive challenges and leaderboard spots await.'}
              {segment.segment_label === 'Regular'    && 'Consistent and committed. A few more sessions per week could unlock Power User status.'}
              {segment.segment_label === 'Casual'     && 'Getting started is the hardest part — you\'ve done it. Check out your AI plan to build momentum.'}
            </p>
          </div>
        )}
      </div>

      {recs && (
        <div className="grid-2">
          {/* Workout Plan */}
          <div className="card fade-in fade-in-delay-2">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <Brain size={18} />
              </div>
              <div>
                <div className="card-title" style={{ marginBottom: 0 }}>Weekly Workout Plan</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Goal: {user.goal?.replace(/_/g, ' ')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recs.workout_plan.map(day => (
                <div key={day.day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 72, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{day.day.slice(0,3).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{day.workout}</div>
                    {day.duration > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>
                        <Clock size={11} /> {day.duration} min
                      </div>
                    )}
                  </div>
                  <span className={`badge ${INTENSITY_COLOR[day.intensity] || 'badge-gray'}`}>{day.intensity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Diet Plan */}
          <div className="card fade-in fade-in-delay-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#ffa60018', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                <Utensils size={18} />
              </div>
              <div>
                <div className="card-title" style={{ marginBottom: 0 }}>Daily Nutrition Plan</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tailored to your goal</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recs.diet_plan.map(meal => (
                <div key={meal.meal} style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '0.06em', color: 'var(--warning)' }}>{meal.meal.toUpperCase()}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <Flame size={11} /> {meal.calories} kcal
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{meal.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
