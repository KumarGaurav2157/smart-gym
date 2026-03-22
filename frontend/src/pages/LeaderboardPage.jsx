import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../utils/api';
import useAuthStore from '../hooks/useAuthStore';
import toast from 'react-hot-toast';

function RankBadge({ rank }) {
  if (rank === 1) return <span style={{ fontSize: '1.4rem' }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: '1.4rem' }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: '1.4rem' }}>🥉</span>;
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', width: 28, textAlign: 'center', display: 'inline-block' }}>
      #{rank}
    </span>
  );
}

export default function LeaderboardPage() {
  const { user }  = useAuthStore();
  const [tab,     setTab]     = useState('calories');
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.leaderboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  // Sort based on active tab
  const board = [...data].sort((a, b) => {
    if (tab === 'calories')   return b.calories   - a.calories;
    if (tab === 'attendance') return b.workouts   - a.workouts;
    if (tab === 'streak')     return b.streak     - a.streak;
    return 0;
  });

  const me     = board.find(m => m.is_me);
  const myRank = board.findIndex(m => m.is_me) + 1;

  const getValue = (member) => {
    if (tab === 'calories')   return `${Math.round(member.calories).toLocaleString()} kcal`;
    if (tab === 'attendance') return `${member.workouts} sessions`;
    if (tab === 'streak')     return `${member.streak} days 🔥`;
    return '';
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">LEADERBOARD</h1>
        <p className="page-subtitle">Real rankings based on actual member activity this month</p>
      </div>

      {/* My Rank Card */}
      {me && (
        <div className="card fade-in" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #0f1a12, var(--bg-card))', borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#0a0b0d', flexShrink: 0 }}>
              {me.full_name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{me.full_name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Your current ranking this month</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--accent)', lineHeight: 1 }}>#{myRank}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rank</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 20px', borderLeft: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#ffa600' }}>🔥{Math.round(me.calories)}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kcal</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 20px', borderLeft: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#4ea8de' }}>{me.workouts}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Workouts</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 20px', borderLeft: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--accent)' }}>{me.streak}🔥</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Streak</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'calories',   label: '🔥 Calories Burned' },
          { key: 'attendance', label: '🏋️ Most Workouts'   },
          { key: 'streak',     label: '⚡ Longest Streak'   },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {board.length >= 3 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-end', justifyContent: 'center' }}>
          {/* 2nd */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#C0C0C025', border: '2px solid #C0C0C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 auto 8px', color: '#C0C0C0' }}>
              {board[1]?.full_name?.charAt(0)}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>{board[1]?.full_name?.split(' ')[0]}</div>
            <div style={{ background: '#C0C0C020', border: '1px solid #C0C0C060', borderRadius: '8px 8px 0 0', padding: '16px 8px' }}>
              <div style={{ fontSize: '1.4rem' }}>🥈</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#C0C0C0', marginTop: 4 }}>
                {board[1] && getValue(board[1])}
              </div>
            </div>
          </div>

          {/* 1st */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>👑</div>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#FFD70025', border: '3px solid #FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.5rem', margin: '0 auto 8px', color: '#FFD700', boxShadow: '0 0 20px #FFD70050' }}>
              {board[0]?.full_name?.charAt(0)}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 4, color: '#FFD700' }}>{board[0]?.full_name?.split(' ')[0]}</div>
            <div style={{ background: '#FFD70020', border: '1px solid #FFD70060', borderRadius: '8px 8px 0 0', padding: '24px 8px' }}>
              <div style={{ fontSize: '1.6rem' }}>🥇</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#FFD700', marginTop: 4, fontWeight: 600 }}>
                {board[0] && getValue(board[0])}
              </div>
            </div>
          </div>

          {/* 3rd */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#CD7F3225', border: '2px solid #CD7F32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.2rem', margin: '0 auto 8px', color: '#CD7F32' }}>
              {board[2]?.full_name?.charAt(0)}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>{board[2]?.full_name?.split(' ')[0]}</div>
            <div style={{ background: '#CD7F3220', border: '1px solid #CD7F3260', borderRadius: '8px 8px 0 0', padding: '12px 8px' }}>
              <div style={{ fontSize: '1.3rem' }}>🥉</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#CD7F32', marginTop: 4 }}>
                {board[2] && getValue(board[2])}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Table */}
      <div className="card fade-in">
        <div className="card-title">Full Rankings — {tab === 'calories' ? 'Calories Burned' : tab === 'attendance' ? 'Workout Count' : 'Streak'} This Month</div>
        {board.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>
            No members found. Start logging workouts to appear on the leaderboard!
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Member</th>
                  <th>🔥 Calories</th>
                  <th>🏋️ Workouts</th>
                  <th>⚡ Streak</th>
                  <th>Goal</th>
                </tr>
              </thead>
              <tbody>
                {board.map((m, i) => (
                  <tr key={m.id} style={{ background: m.is_me ? 'var(--accent-dim)' : 'transparent' }}>
                    <td><RankBadge rank={i + 1} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: m.is_me ? 'var(--accent)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: m.is_me ? '#0a0b0d' : 'var(--text-secondary)', flexShrink: 0 }}>
                          {m.full_name?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: m.is_me ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {m.full_name} {m.is_me ? '(You)' : ''}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>
                      {Math.round(m.calories).toLocaleString()}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#4ea8de' }}>{m.workouts}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#ffa600' }}>{m.streak} 🔥</td>
                    <td>
                      <span className="badge badge-gray" style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}>
                        {m.goal?.replace(/_/g, ' ')}
                      </span>
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