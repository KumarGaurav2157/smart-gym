import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });
api.interceptors.request.use(c => {
  const t = localStorage.getItem('gym_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

export default function ChangePasswordPage() {
  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [show,    setShow]    = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = form.new_password.length < 6 ? 'weak'
    : form.new_password.length < 8  ? 'fair'
    : form.new_password.length < 12 ? 'good'
    : 'strong';

  const strengthConfig = {
    weak:   { width: '25%', color: 'var(--danger)',  label: '❌ Too short (min 6)' },
    fair:   { width: '50%', color: 'var(--warning)', label: '⚠️ Weak'              },
    good:   { width: '75%', color: '#4ea8de',        label: '✅ Good'              },
    strong: { width: '100%',color: 'var(--accent)',  label: '💪 Strong'            },
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      toast.error('Passwords do not match!'); return;
    }
    if (form.new_password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    if (form.old_password === form.new_password) {
      toast.error('New password must be different from current password'); return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        old_password: form.old_password,
        new_password: form.new_password,
      });
      setSuccess(true);
      toast.success('Password changed successfully!');
      setForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">CHANGE PASSWORD</h1>
        <p className="page-subtitle">Update your account password</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card fade-in">
          {success ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-dim)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent)' }}>
                <CheckCircle size={36} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: 8 }}>PASSWORD CHANGED!</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
                Your password has been updated successfully.
              </p>
              <button onClick={() => setSuccess(false)} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Change Again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Current password */}
              <div className="form-group">
                <label className="form-label">
                  <Lock size={12} style={{ display: 'inline', marginRight: 6 }} />
                  Current Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={show.old ? 'text' : 'password'}
                    name="old_password"
                    placeholder="Enter current password"
                    value={form.old_password}
                    onChange={handleChange}
                    style={{ paddingRight: 44 }}
                    required
                  />
                  <button type="button" onClick={() => setShow(p => ({ ...p, old: !p.old }))}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {show.old ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="form-group">
                <label className="form-label">
                  <Lock size={12} style={{ display: 'inline', marginRight: 6 }} />
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={show.new ? 'text' : 'password'}
                    name="new_password"
                    placeholder="Min 6 characters"
                    value={form.new_password}
                    onChange={handleChange}
                    style={{ paddingRight: 44 }}
                    required
                  />
                  <button type="button" onClick={() => setShow(p => ({ ...p, new: !p.new }))}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {show.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength indicator */}
                {form.new_password && (
                  <div style={{ marginTop: 8 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: strengthConfig[strength].width, background: strengthConfig[strength].color, transition: 'all 0.3s ease' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: strengthConfig[strength].color, marginTop: 4 }}>
                      {strengthConfig[strength].label}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="form-group">
                <label className="form-label">
                  <Lock size={12} style={{ display: 'inline', marginRight: 6 }} />
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={show.confirm ? 'text' : 'password'}
                    name="confirm_password"
                    placeholder="Repeat new password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    style={{ paddingRight: 44 }}
                    required
                  />
                  <button type="button" onClick={() => setShow(p => ({ ...p, confirm: !p.confirm }))}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.confirm_password && (
                  <div style={{ fontSize: '0.72rem', marginTop: 4, color: form.new_password === form.confirm_password ? 'var(--accent)' : 'var(--danger)' }}>
                    {form.new_password === form.confirm_password ? '✅ Passwords match' : '❌ Passwords do not match'}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }}
                disabled={loading || form.new_password !== form.confirm_password || form.new_password.length < 6}>
                {loading ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          )}
        </div>

        {/* Tips */}
        <div className="card fade-in fade-in-delay-1">
          <div className="card-title">Password Tips</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { tip: 'Use at least 8 characters',                    icon: '📏' },
              { tip: 'Mix uppercase and lowercase letters',          icon: '🔡' },
              { tip: 'Include numbers and special characters',       icon: '🔢' },
              { tip: "Don't use your name or email in the password", icon: '🚫' },
              { tip: 'Use a unique password for this account',       icon: '🔑' },
              { tip: 'Never share your password with anyone',        icon: '🤫' },
            ].map(t => (
              <div key={t.tip} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{t.icon}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.tip}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: '14px', background: 'var(--accent-dim)', borderRadius: 10, border: '1px solid var(--accent)', fontSize: '0.82rem', color: 'var(--accent)' }}>
            💡 Strong password example: <span style={{ fontFamily: 'var(--font-mono)' }}>Gym@2024!</span>
          </div>
        </div>
      </div>
    </div>
  );
}