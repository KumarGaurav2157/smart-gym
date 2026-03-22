import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';
import useAuthStore from '../hooks/useAuthStore';
import { Save, User } from 'lucide-react';

const GOALS = [
  { value: 'weight_loss',     label: 'Weight Loss'     },
  { value: 'muscle_gain',     label: 'Muscle Gain'     },
  { value: 'endurance',       label: 'Endurance'       },
  { value: 'flexibility',     label: 'Flexibility'     },
  { value: 'general_fitness', label: 'General Fitness' },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    age:    user?.age    || '',
    weight: user?.weight || '',
    height: user?.height || '',
    goal:   user?.goal   || 'general_fitness',
    phone:  user?.phone  || '',
  });
  const [saving, setSaving] = useState(false);

  const bmi = form.weight && form.height
    ? (form.weight / ((form.height / 100) ** 2)).toFixed(1)
    : null;

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authAPI.updateMe(form);
      updateUser(data);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">PROFILE</h1>
        <p className="page-subtitle">Manage your account and fitness goals</p>
      </div>

      <div className="grid-2">
        <div className="card fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#0a0b0d' }}>
              {initials}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem' }}>{user?.full_name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user?.email}</div>
              <span className={`badge ${user?.role === 'admin' ? 'badge-blue' : 'badge-green'}`} style={{ marginTop: 6 }}>
                {user?.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" name="full_name" value={form.full_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 555 0000" />
            </div>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Age</label>
                <input className="form-input" type="number" name="age" value={form.age} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input className="form-input" type="number" name="weight" value={form.weight} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input className="form-input" type="number" name="height" value={form.height} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Fitness Goal</label>
              <select className="form-select" name="goal" value={form.goal} onChange={handleChange}>
                {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {bmi && (
            <div className="card fade-in fade-in-delay-1">
              <div className="card-title">Body Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'BMI',    value: bmi, color: parseFloat(bmi) < 18.5 ? 'var(--info)' : parseFloat(bmi) < 25 ? 'var(--accent)' : parseFloat(bmi) < 30 ? 'var(--warning)' : 'var(--danger)' },
                  { label: 'Weight', value: `${form.weight} kg` },
                  { label: 'Height', value: `${form.height} cm` },
                  { label: 'Age',    value: `${form.age} yrs`  },
                ].map(s => (
                  <div key={s.label} style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: s.color || 'var(--accent)' }}>{s.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--accent)' }}>
                BMI {bmi}: {parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Healthy weight ✓' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'} 
              </div>
            </div>
          )}

          <div className="card fade-in fade-in-delay-2">
            <div className="card-title">Account Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Member Since', value: new Date(user?.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                { label: 'Membership',   value: user?.membership_status },
                { label: 'Goal',         value: user?.goal?.replace(/_/g, ' ') },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, textTransform: 'capitalize' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
