import React, { useEffect, useState } from 'react';
import { Search, TrendingDown } from 'lucide-react';
import { membersAPI, predictionsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [churnMap, setChurnMap] = useState({});

  useEffect(() => {
    membersAPI.list({ limit: 50 })
      .then(r => setMembers(r.data))
      .catch(() => toast.error('Failed to load members'))
      .finally(() => setLoading(false));
  }, []);

  const runChurnAnalysis = async () => {
    toast.loading('Running churn analysis…', { id: 'churn' });
    const results = {};
    for (const m of members.slice(0, 20)) {
      try {
        const { data } = await predictionsAPI.churn(m.id);
        results[m.id] = data;
      } catch { /* skip */ }
    }
    setChurnMap(results);
    toast.success('Churn analysis complete', { id: 'churn' });
  };

  const filtered = members.filter(m =>
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">MEMBERS</h1>
          <p className="page-subtitle">{members.length} total members</p>
        </div>
        <button className="btn btn-ghost" onClick={runChurnAnalysis}>
          <TrendingDown size={15} /> Churn Analysis
        </button>
      </div>

      <div className="card fade-in" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 20 }}>
          <Search size={15} color="var(--text-muted)" />
          <input style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem', flex: 1 }}
            placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Churn Risk</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const c = churnMap[m.id];
                  return (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>{m.full_name}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{m.email}</td>
                      <td><span className={`badge ${m.role === 'admin' ? 'badge-blue' : m.role === 'trainer' ? 'badge-yellow' : 'badge-gray'}`}>{m.role}</span></td>
                      <td><span className={`badge ${m.membership_status === 'active' ? 'badge-green' : 'badge-red'}`}>{m.membership_status}</span></td>
                      <td>
                        {c ? (
                          <span className={`badge ${c.risk_level === 'high' ? 'badge-red' : c.risk_level === 'medium' ? 'badge-yellow' : 'badge-green'}`}>
                            {c.risk_level} ({Math.round(c.churn_probability * 100)}%)
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(m.created_at).toLocaleDateString()}
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
