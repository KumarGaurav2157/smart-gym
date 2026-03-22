import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';
import useAuthStore from '../hooks/useAuthStore';
import { Dumbbell, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      setAuth(data.user, data.access_token);
      toast.success(`Welcome back, ${data.user.full_name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell size={22} color="#0a0b0d" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.1em' }}>SMARTGYM</span>
        </div>
        <h1 className="auth-hero-title">TRAIN<br />SMARTER.<br /><span>NOT HARDER.</span></h1>
        <p className="auth-hero-sub">AI-powered gym management that predicts churn, personalises training, and grows your revenue — automatically.</p>

        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Churn Prevention',    val: '32% reduction' },
            { label: 'Revenue Forecast',    val: '94% accuracy'  },
            { label: 'Member Retention',    val: '+41%'           },
          ].map(stat => (
            <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{stat.label}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent)' }}>{stat.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-panel">
        <h2 className="auth-form-title">SIGN IN</h2>
        <p className="auth-form-sub">Enter your credentials to access the platform</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label"><Mail size={12} style={{ display: 'inline', marginRight: 6 }} />Email</label>
            <input className="form-input" type="email" name="email" placeholder="you@gym.com"
              value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label"><Lock size={12} style={{ display: 'inline', marginRight: 6 }} />Password</label>
            <input className="form-input" type="password" name="password" placeholder="••••••••"
              value={form.password} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem', marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing in…' : <><span>Sign In</span><ArrowRight size={16} /></>}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          New member? <Link to="/register">Create account</Link>
        </p>
        <p style={{ marginTop: 12, textAlign: 'center', fontSize: '0.875rem' }}>
          <Link to="/forgot-password" style={{ color: 'var(--text-muted)' }}>Forgot your password?</Link>
        </p>

        <div style={{ marginTop: 32, padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Demo Credentials</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>admin@smartgym.com / Admin@123</p>
        </div>
      </div>
    </div>
  );
}