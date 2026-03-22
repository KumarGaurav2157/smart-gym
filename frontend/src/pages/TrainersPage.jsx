import React, { useEffect, useState } from 'react';
import { trainersAPI } from '../utils/api';
import useAuthStore from '../hooks/useAuthStore';

export default function TrainersPage() {
  const { user }    = useAuthStore();
  const [trainers,  setTrainers]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    trainersAPI.list()
      .then(r => setTrainers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myTrainer = trainers.find(t => t.id === user?.trainer_id);

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">TRAINERS</h1>
        <p className="page-subtitle">Meet your coaching team</p>
      </div>

      {/* My Trainer highlight */}
      {myTrainer && (
        <div className="card fade-in" style={{ marginBottom: 24, borderColor: 'var(--accent)', background: 'linear-gradient(135deg, #0f1a12, var(--bg-card))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#0a0b0d', flexShrink: 0 }}>
              {myTrainer.name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                ⭐ Your Personal Trainer
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>{myTrainer.name}</div>
              <div style={{ color: 'var(--accent)', fontSize: '0.82rem', marginTop: 2 }}>{myTrainer.specialization}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#ffa600' }}>★ {myTrainer.rating}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{myTrainer.experience_years} years exp.</div>
            </div>
          </div>
          {myTrainer.bio && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 16, lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              {myTrainer.bio}
            </p>
          )}
        </div>
      )}

      {!myTrainer && (
        <div className="card fade-in" style={{ marginBottom: 24, textAlign: 'center', padding: '24px', borderStyle: 'dashed' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            You don't have a personal trainer assigned yet. Contact the gym admin to get assigned to a trainer.
          </p>
        </div>
      )}

      {/* All trainers */}
      {loading ? <div className="spinner" /> : (
        <div className="grid-2">
          {trainers.map(t => (
            <div key={t.id} className="card fade-in" style={{
              display: 'flex', gap: 16, alignItems: 'flex-start',
              borderColor: t.id === user?.trainer_id ? 'var(--accent)' : 'var(--border)',
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: t.id === user?.trainer_id ? 'var(--accent)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: t.id === user?.trainer_id ? '#0a0b0d' : 'var(--text-secondary)', flexShrink: 0 }}>
                {t.name?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{t.name}</div>
                  {t.id === user?.trainer_id && (
                    <span className="badge badge-green" style={{ fontSize: '0.6rem' }}>Your Trainer</span>
                  )}
                </div>
                <div style={{ color: 'var(--accent)', fontSize: '0.78rem', marginTop: 2 }}>{t.specialization}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
                  {t.experience_years} years exp. · ★ {t.rating}
                </div>
                {t.bio && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 8, lineHeight: 1.6 }}>{t.bio}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}