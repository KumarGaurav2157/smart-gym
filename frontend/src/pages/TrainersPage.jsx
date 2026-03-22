// ─── TrainersPage ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
export function TrainersPage() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { trainersAPI } = require('../utils/api');

  useEffect(() => {
    trainersAPI.list().then(r => setTrainers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">TRAINERS</h1>
        <p className="page-subtitle">Meet your coaching team</p>
      </div>
      {loading ? <div className="spinner" /> : (
        <div className="grid-2">
          {trainers.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px', gridColumn: '1/-1' }}>
              No trainers found. Add trainers via the admin panel or database.
            </div>
          ) : trainers.map(t => (
            <div key={t.id} className="card fade-in" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#0a0b0d', flexShrink: 0 }}>
                {t.name?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{t.name}</div>
                <div style={{ color: 'var(--accent)', fontSize: '0.78rem', marginTop: 2 }}>{t.specialization}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>{t.experience_years} years exp. · ★ {t.rating}</div>
                {t.bio && <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 8, lineHeight: 1.6 }}>{t.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default TrainersPage;
