import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';
import useAuthStore from '../hooks/useAuthStore';
import { ArrowRight, Dumbbell } from 'lucide-react';

const ROLES = [
  { value: 'member',  label: 'Member'  },
  { value: 'trainer', label: 'Trainer' },
];

const GOALS = [
  { value: 'weight_loss',     label: 'Weight Loss'     },
  { value: 'muscle_gain',     label: 'Muscle Gain'     },
  { value: 'endurance',       label: 'Endurance'       },
  { value: 'flexibility',     label: 'Flexibility'     },
  { value: 'general_fitness', label: 'General Fitness' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    age: '', weight: '', height: '', goal: 'general_fitness', phone: '',
    role: 'member',
  });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
       ...form,
        age:    form.age    ? parseInt(form.age)     : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        height: form.height ? parseFloat(form.height) : null,
        role:   form.role,
      };
      const { data } = await authAPI.register(payload);
      setAuth(data.user, data.access_token);
      toast.success('Account created! Welcome to SmartGym 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
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
        <h1 className="auth-hero-title">YOUR<br />JOURNEY<br /><span>STARTS NOW.</span></h1>
        <p className="auth-hero-sub">Join thousands of members getting AI-personalised workout plans and nutrition guidance.</p>
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { num: '12K+', label: 'Active Members' },
            { num: '94%',  label: 'Satisfaction Rate' },
            { num: '50+',  label: 'Workout Plans' },
            { num: '4',    label: 'Expert Trainers' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '16px', background: '#ffffff06', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--accent)' }}>{s.num}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-panel" style={{ overflowY: 'auto' }}>
        <h2 className="auth-form-title">JOIN THE GYM</h2>
        <p className="auth-form-sub">Create your account and get your personalised plan</p>

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" name="full_name" placeholder="John Doe" value={form.full_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" name="phone" placeholder="+1 555 0000" value={form.phone} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" name="password" placeholder="Min 8 characters" value={form.password} onChange={handleChange} required />
          </div>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Age</label>
              <input className="form-input" type="number" name="age" placeholder="25" value={form.age} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" type="number" name="weight" placeholder="70" value={form.weight} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input className="form-input" type="number" name="height" placeholder="175" value={form.height} onChange={handleChange} />
            </div>
          </div>
            <div className="form-group">
              <label className="form-label">Register As *</label>
              <select className="form-select" name="role" value={form.role} onChange={handleChange}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          <div className="form-group">
            <label className="form-label">Fitness Goal *</label>
            <select className="form-select" name="goal" value={form.goal} onChange={handleChange}>
              {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating account…' : <><span>Create Account</span><ArrowRight size={16} /></>}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Already a member? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
