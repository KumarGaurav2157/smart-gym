import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { predictionsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function ForecastPage() {
  const [data, setData] = useState([]);
  const [periods, setPeriods] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await predictionsAPI.forecast(periods);
      setData(d);
    } catch { toast.error('Failed to load forecast'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [periods]);

  const totalPredicted = data.reduce((s, d) => s + d.predicted, 0);

  return (
    <div>
      <div className="page-header fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">REVENUE FORECAST</h1>
          <p className="page-subtitle">ML-powered revenue prediction using Prophet time-series model</p>
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={periods} onChange={e => setPeriods(Number(e.target.value))}>
          <option value={14}>Next 14 days</option>
          <option value={30}>Next 30 days</option>
          <option value={60}>Next 60 days</option>
          <option value={90}>Next 90 days</option>
        </select>
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        <div className="stat-card fade-in">
          <div className="stat-value">${totalPredicted.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="stat-label">Projected Revenue ({periods}d)</div>
        </div>
        <div className="stat-card fade-in fade-in-delay-1">
          <div className="stat-value">${data.length ? (totalPredicted / data.length).toFixed(0) : 0}</div>
          <div className="stat-label">Daily Average</div>
        </div>
        <div className="stat-card fade-in fade-in-delay-2">
          <div className="stat-value">{data.length ? `$${Math.max(...data.map(d => d.upper)).toFixed(0)}` : '—'}</div>
          <div className="stat-label">Best Case Scenario</div>
        </div>
      </div>

      <div className="card fade-in">
        <div className="card-title">Revenue Projection with Confidence Bands</div>
        {loading ? <div className="spinner" /> : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="conf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00e676" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(data.length / 6)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v.toLocaleString()}`} />
              <Tooltip formatter={(v, n) => [`$${Number(v).toLocaleString()}`, n]} />
              <Area type="monotone" dataKey="upper"     stroke="none"    fill="url(#conf)" name="Upper Bound" />
              <Area type="monotone" dataKey="predicted" stroke="#00e676" fill="none"       strokeWidth={2.5} name="Predicted" />
              <Area type="monotone" dataKey="lower"     stroke="none"    fill="var(--bg-primary)" name="Lower Bound" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card fade-in" style={{ marginTop: 24 }}>
        <div className="card-title">Forecast Breakdown</div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Date</th><th>Predicted</th><th>Lower Bound</th><th>Upper Bound</th></tr></thead>
            <tbody>
              {data.slice(0, 10).map(d => (
                <tr key={d.date}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{d.date}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>${d.predicted.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>${d.lower.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>${d.upper.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
