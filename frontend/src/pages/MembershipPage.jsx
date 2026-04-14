import React, { useState, useEffect, useCallback } from 'react';
import { Check, Crown, Star, Zap, Shield, RefreshCw } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../hooks/useAuthStore';
import toast from 'react-hot-toast';

// ── API client ────────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('gym_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Plan config ───────────────────────────────────────────────────────────────
const PLAN_ICONS = {
  '1month':  <Zap size={20} />,
  '3month':  <Star size={20} />,
  '6month':  <Shield size={20} />,
  '9month':  <Crown size={20} />,
  '12month': <Crown size={20} />,
};

const PLAN_COLORS = {
  '1month':  { bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', accent: '#4ea8de', border: '#4ea8de40' },
  '3month':  { bg: 'linear-gradient(135deg,#0f1a12,#162a1c)', accent: '#00e676', border: '#00e67640' },
  '6month':  { bg: 'linear-gradient(135deg,#1a120f,#2a1a0f)', accent: '#ffa600', border: '#ffa60040' },
  '9month':  { bg: 'linear-gradient(135deg,#1a0f1a,#2a0f2a)', accent: '#c084fc', border: '#c084fc40' },
  '12month': { bg: 'linear-gradient(135deg,#1a1000,#2a1f00)', accent: '#FFD700', border: '#FFD70040' },
};

// ── Load Razorpay script ──────────────────────────────────────────────────────
const loadRazorpayScript = () =>
  new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s    = document.createElement('script');
    s.src      = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload   = () => resolve(true);
    s.onerror  = () => resolve(false);
    document.body.appendChild(s);
  });

export default function MembershipPage() {
  const { user }    = useAuthStore();
  const [plans,     setPlans]     = useState([]);
  const [membership,setMembership]= useState(null);
  const [history,   setHistory]   = useState([]);
  const [rzStatus,  setRzStatus]  = useState({ razorpay_available: false, keys_configured: false, key_id_prefix: '' });
  const [loading,   setLoading]   = useState(true);
  const [paying,    setPaying]    = useState(null);
  const [tab,       setTab]       = useState('plans');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m, h, s] = await Promise.all([
        api.get('/membership/plans'),
        api.get('/membership/my-membership').catch(() => ({ data: null })),
        api.get('/membership/payment-history').catch(() => ({ data: [] })),
        api.get('/membership/razorpay-status').catch(() => ({ data: {} })),
      ]);
      setPlans(p.data);
      setMembership(m.data);
      setHistory(h.data);
      setRzStatus(s.data);
    } catch { toast.error('Failed to load membership data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const isReady = rzStatus.razorpay_available && rzStatus.keys_configured;

  // ── Real Razorpay Payment ─────────────────────────────────────────────────
  const handleRazorpay = async (planId) => {
    setPaying(planId);
    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Could not load Razorpay. Check internet connection.');
        return;
      }

      // 2. Create order on backend
      const { data: order } = await api.post('/membership/create-order', { plan_id: planId });

      // 3. Open Razorpay checkout
      const options = {
        key:         order.key_id,
        amount:      order.amount,
        currency:    order.currency,
        name:        'SmartGym',
        description: `${order.plan_name} Membership`,
        order_id:    order.order_id,
        prefill: {
          name:    order.user_name,
          email:   order.user_email,
          contact: order.user_phone || '',
        },
        theme:  { color: '#00e676' },
        handler: async (response) => {
          try {
            // 4. Verify payment on backend
            const { data: result } = await api.post('/membership/verify-payment', {
              plan_id:              planId,
              razorpay_order_id:    response.razorpay_order_id,
              razorpay_payment_id:  response.razorpay_payment_id,
              razorpay_signature:   response.razorpay_signature,
            });
            if (result.success) {
              toast.success(result.message || '🎉 Membership activated!');
              await loadAll();
              setTab('current');
            }
          } catch (err) {
            toast.error(err.response?.data?.detail || 'Payment verification failed');
          } finally {
            setPaying(null);
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled');
            setPaying(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        toast.error(`Payment failed: ${resp.error.description}`);
        setPaying(null);
      });
      rzp.open();

    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('RAZORPAY_NOT_INSTALLED')) {
        toast.error('Razorpay not installed. Run: pip install razorpay');
      } else if (detail.includes('RAZORPAY_KEYS_NOT_CONFIGURED')) {
        toast.error('Razorpay keys missing in .env file');
        setTab('setup');
      } else {
        toast.error(detail || 'Payment failed. Try again.');
      }
      setPaying(null);
    }
  };

  // ── Demo Payment ──────────────────────────────────────────────────────────
  const handleDemo = async (planId) => {
    setPaying(planId);
    try {
      const { data } = await api.post('/membership/demo-payment', { plan_id: planId });
      toast.success(data.message || '🎉 Demo membership activated!');
      await loadAll();
      setTab('current');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Demo payment failed');
    } finally {
      setPaying(null);
    }
  };

  if (loading) return <div className="spinner" />;

  const tabs = [
    { key: 'plans',   label: '💳 Plans'          },
    { key: 'current', label: '⭐ My Membership'   },
    { key: 'history', label: '📋 Payment History' },
    //{ key: 'setup',   label: '⚙️ Setup Guide'     },
  ];

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">MEMBERSHIP PLANS</h1>
        <p className="page-subtitle">Choose your plan — pay securely with Razorpay</p>
      </div>

      {/* Status bar */}
      {/* <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: rzStatus.razorpay_available ? 'var(--accent)' : 'var(--danger)' }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Razorpay: {rzStatus.razorpay_available ? '✅ Installed' : '❌ Not installed'}
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: rzStatus.keys_configured ? 'var(--accent)' : 'var(--warning)' }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Keys: {rzStatus.keys_configured ? `✅ ${rzStatus.key_id_prefix}...` : '⚠️ Not configured'}
          </span>
        </div>
        <button onClick={loadAll} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <RefreshCw size={14} />
        </button>
      </div> */}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Plans Tab ─────────────────────────────────────────────────────── */}
      {tab === 'plans' && (
        <>
          {!isReady && (
            <div style={{ padding: '14px 20px', background: '#ffa60015', border: '1px solid #ffa60040', borderRadius: 10, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--warning)', fontSize: '0.875rem' }}>
                  Running in Demo Mode
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {!rzStatus.razorpay_available
                    ? 'Razorpay not installed. Run: pip install razorpay'
                    : 'Add Razorpay keys to backend .env file. See Setup Guide tab.'}
                </div>
              </div>
              <button onClick={() => setTab('setup')} className="btn btn-ghost btn-sm">Setup →</button>
            </div>
          )}

          {/* Active membership banner */}
          {membership?.is_active && (
            <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg,#0f1a12,var(--bg-card))', borderColor: 'var(--accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0b0d', flexShrink: 0 }}>
                  <Shield size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--accent)' }}>
                    {membership.plan_name} — ACTIVE ✅
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Expires {membership.expiry_date} · {membership.days_left} days left
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--accent)' }}>
                  {membership.days_left}d
                </div>
              </div>
            </div>
          )}

          {/* Plans grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
            {plans.map((plan, i) => {
              const c = PLAN_COLORS[plan.id] || PLAN_COLORS['1month'];
              return (
                <div key={plan.id} style={{
                  background: c.bg, border: `1px solid ${c.border}`,
                  borderRadius: 'var(--radius-lg)', padding: 24,
                  position: 'relative', overflow: 'hidden',
                  transition: 'all 0.3s ease',
                }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${c.border}`; }}
                  onMouseOut={e  => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: plan.badge === 'Most Popular' ? 'var(--accent)' : '#FFD700', color: '#0a0b0d', fontSize: '0.62rem', fontWeight: 700, padding: '4px 12px', borderRadius: '0 var(--radius-lg) 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: c.accent + '20', border: `1px solid ${c.accent}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.accent }}>
                      {PLAN_ICONS[plan.id]}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.06em' }}>{plan.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{plan.duration} Month{plan.duration > 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', color: c.accent, lineHeight: 1 }}>
                        ₹{plan.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {plan.savings > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          ₹{plan.original.toLocaleString('en-IN')}
                        </span>
                        <span style={{ background: c.accent + '25', color: c.accent, fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                          SAVE ₹{plan.savings.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      ₹{Math.round(plan.price / plan.duration).toLocaleString('en-IN')}/month
                    </div>
                  </div>

                  {/* Features */}
                  <div style={{ marginBottom: 20 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: c.accent + '20', border: `1px solid ${c.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={9} color={c.accent} strokeWidth={3} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  {isReady ? (
                    <button
                      onClick={() => handleRazorpay(plan.id)}
                      disabled={!!paying}
                      style={{ width: '100%', padding: '11px', borderRadius: 10, background: c.accent, color: '#0a0b0d', border: 'none', cursor: paying ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)', fontSize: '0.875rem', opacity: paying === plan.id ? 0.7 : 1, transition: 'all 0.2s' }}>
                      {paying === plan.id ? '⏳ Processing…' : '💳 Pay with Razorpay'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        onClick={() => handleDemo(plan.id)}
                        disabled={!!paying}
                        style={{ width: '100%', padding: '11px', borderRadius: 10, background: c.accent, color: '#0a0b0d', border: 'none', cursor: paying ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)', fontSize: '0.875rem', opacity: paying === plan.id ? 0.7 : 1 }}>
                        {paying === plan.id ? '⏳ Activating…' : '🧪 Demo Subscribe'}
                      </button>
                      <button
                        onClick={() => setTab('setup')}
                        style={{ width: '100%', padding: '7px', borderRadius: 10, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.72rem' }}>
                        Enable real payments →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Accepted payment methods */}
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-title">Accepted Payment Methods</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['💳 Credit Card', '💳 Debit Card', '📱 UPI', '🏦 Net Banking', '📱 PhonePe', '📱 Google Pay', '📱 Paytm', '💰 Wallets'].map(m => (
                <div key={m} style={{ padding: '8px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {m}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── My Membership Tab ────────────────────────────────────────────── */}
      {tab === 'current' && (
        <div>
          {!membership || membership.status === 'no_membership' ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏋️</div>
              <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>NO ACTIVE MEMBERSHIP</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Subscribe to a plan to get full gym access</p>
              <button onClick={() => setTab('plans')} className="btn btn-primary">View Plans →</button>
            </div>
          ) : (
            <div className="grid-2">
              <div className="card fade-in" style={{ borderColor: membership.is_active ? 'var(--accent)' : 'var(--danger)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: membership.is_active ? 'var(--accent)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0b0d' }}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>{membership.plan_name} Plan</div>
                    <span className={`badge ${membership.is_active ? 'badge-green' : 'badge-red'}`}>
                      {membership.is_active ? '✅ Active' : '❌ Expired'}
                    </span>
                  </div>
                </div>

                {[
                  { label: 'Amount Paid',  value: `₹${membership.amount?.toLocaleString('en-IN')}` },
                  { label: 'Start Date',   value: membership.start_date   },
                  { label: 'Expiry Date',  value: membership.expiry_date  },
                  { label: 'Days Left',    value: `${membership.days_left} days` },
                  { label: 'Duration',     value: `${membership.duration} month(s)` },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.label}</span>
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{r.value}</span>
                  </div>
                ))}

                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Membership Progress</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                      {membership.days_left}/{membership.duration * 30} days
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill" style={{ width: `${Math.min(100, (membership.days_left / (membership.duration * 30)) * 100)}%` }} />
                  </div>
                </div>

                <button onClick={() => setTab('plans')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
                  Renew / Upgrade Plan
                </button>
              </div>

              <div className="card fade-in fade-in-delay-1">
                <div className="card-title">Plan Includes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(membership.features || []).map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={11} color="var(--accent)" strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Payment History Tab ───────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="card fade-in">
          <div className="card-title">Payment History</div>
          {history.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>No payments yet</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Date</th><th>Plan</th><th>Amount</th><th>Type</th><th>Status</th><th>Transaction</th></tr>
                </thead>
                <tbody>
                  {history.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{p.transaction_id?.split('_')[1] || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                      <td><span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{p.payment_type}</span></td>
                      <td><span className={`badge ${p.status === 'completed' ? 'badge-green' : 'badge-red'}`}>{p.status}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.transaction_id?.slice(0, 24)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Setup Guide Tab ───────────────────────────────────────────────── */}
      {tab === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Current status */}
          <div className="card fade-in" style={{ borderColor: isReady ? 'var(--accent)' : 'var(--warning)' }}>
            <div className="card-title">Current Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'razorpay package installed', ok: rzStatus.razorpay_available, fix: 'pip install razorpay' },
                { label: 'RAZORPAY_KEY_ID in .env',    ok: rzStatus.keys_configured,   fix: 'Add to backend/.env' },
                { label: 'RAZORPAY_KEY_SECRET in .env', ok: rzStatus.keys_configured,  fix: 'Add to backend/.env' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: s.ok ? 'var(--accent-dim)' : '#ff4d6d15', border: `1px solid ${s.ok ? 'var(--accent)' : 'var(--danger)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem' }}>
                    {s.ok ? '✅' : '❌'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{s.label}</div>
                    {!s.ok && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Fix: {s.fix}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step by step guide */}
          <div className="card fade-in fade-in-delay-1">
            <div className="card-title">Setup Steps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                {
                  step: '1', title: 'Create Razorpay Account',
                  desc: 'Sign up at dashboard.razorpay.com',
                  code: 'https://dashboard.razorpay.com/signup',
                  color: '#4ea8de',
                },
                {
                  step: '2', title: 'Install Razorpay Package',
                  desc: 'Run in backend terminal (with venv activated):',
                  code: 'pip install razorpay',
                  color: 'var(--accent)',
                },
                {
                  step: '3', title: 'Get API Keys',
                  desc: 'Razorpay Dashboard → Settings → API Keys → Generate Test Key',
                  code: 'Copy: Key ID (rzp_test_xxx) and Key Secret',
                  color: '#ffa600',
                },
                {
                  step: '4', title: 'Add to backend/.env',
                  desc: 'Open backend/.env in VS Code and add:',
                  code: 'RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx\nRAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx',
                  color: '#c084fc',
                },
                {
                  step: '5', title: 'Restart Backend',
                  desc: 'Stop and restart the backend server:',
                  code: 'uvicorn app.main:app --reload --host 127.0.0.1 --port 8000',
                  color: '#FFD700',
                },
                {
                  step: '6', title: 'Refresh This Page',
                  desc: 'Click refresh to check status:',
                  code: 'Status bar at top should show ✅ Installed and ✅ Keys configured',
                  color: 'var(--accent)',
                },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 14, padding: '14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: '#0a0b0d', flexShrink: 0 }}>
                    {s.step}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.9rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>{s.desc}</div>
                    <div style={{ background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: s.color, border: '1px solid var(--border)', whiteSpace: 'pre-line' }}>
                      {s.code}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test cards */}
          <div className="card fade-in fade-in-delay-2" style={{ borderColor: 'var(--accent)' }}>
            <div className="card-title">Test Payment Methods</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { method: '💳 Card',        detail: '4111 1111 1111 1111 · Any expiry · Any CVV', result: '✅ Success',  color: 'var(--accent)'  },
                { method: '📱 UPI',          detail: 'success@razorpay',                           result: '✅ Success',  color: 'var(--accent)'  },
                { method: '💳 Card (Fail)', detail: '4000 0000 0000 0002',                         result: '❌ Declined', color: 'var(--danger)'  },
                { method: '🏦 Net Banking', detail: 'Select any bank → Test mode → Success',       result: '✅ Success',  color: 'var(--accent)'  },
              ].map(c => (
                <div key={c.method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.method}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.detail}</div>
                  </div>
                  <span style={{ color: c.color, fontWeight: 600, fontSize: '0.82rem' }}>{c.result}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--accent-dim)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--accent)', border: '1px solid #00e67630' }}>
              💡 Use <strong>rzp_test_</strong> keys for testing (free, no real money). Switch to <strong>rzp_live_</strong> keys when going live.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}