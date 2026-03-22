import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { workoutsAPI } from '../utils/api';
import useAuthStore from '../hooks/useAuthStore';

const WORKOUT_TYPES = ['Cardio','HIIT','Strength Training','Yoga','Cycling','Swimming','Boxing','CrossFit','Pilates','Running','Stretching','Other'];
const DIFFICULTIES  = ['easy', 'medium', 'hard'];

const MET_VALUES = {
  'Cardio':            7.0,
  'HIIT':              8.0,
  'Strength Training': 5.0,
  'Yoga':              3.0,
  'Cycling':           7.5,
  'Swimming':          8.0,
  'Boxing':            7.8,
  'CrossFit':          8.0,
  'Pilates':           3.8,
  'Running':           9.8,
  'Stretching':        2.5,
  'Other':             5.0,
};

const DIFFICULTY_MULTIPLIER = {
  'easy':   0.85,
  'medium': 1.0,
  'hard':   1.2,
};

function calculateCalories(workoutType, durationMinutes, weightKg, difficulty) {
  const met        = MET_VALUES[workoutType] || 5.0;
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] || 1.0;
  const hours      = durationMinutes / 60;
  const weight     = weightKg || 70;
  return Math.round(met * multiplier * weight * hours);
}

const empty = { 
  workout_type: 'Cardio', 
  duration_minutes: 45, 
  calories_burned: '', 
  difficulty: 'medium', 
  notes: '' 
};

export default function WorkoutsPage() {
  // ✅ Hook called inside component - correct!
  const { user } = useAuthStore();

  const [workouts, setWorkouts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({
    ...empty,
    calories_burned: calculateCalories('Cardio', 45, user?.weight, 'medium')
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await workoutsAPI.my({ limit: 50 });
      setWorkouts(data);
    } catch { 
      toast.error('Failed to load workouts'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (['workout_type', 'duration_minutes', 'difficulty'].includes(name)) {
        const calories = calculateCalories(
          updated.workout_type,
          parseInt(updated.duration_minutes) || 0,
          user?.weight || 70,
          updated.difficulty
        );
        updated.calories_burned = calories;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration_minutes: parseInt(form.duration_minutes),
        calories_burned:  form.calories_burned ? parseFloat(form.calories_burned) : null,
      };
      await workoutsAPI.log(payload);
      toast.success('Workout logged!');
      setShowForm(false);
      setForm({
        ...empty,
        calories_burned: calculateCalories('Cardio', 45, user?.weight, 'medium')
      });
      load();
    } catch { 
      toast.error('Failed to log workout'); 
    } finally { 
      setSaving(false); 
    }
  };

  const totalCalories = workouts.reduce((s, w) => s + (w.calories_burned || 0), 0);
  const avgDuration   = workouts.length 
    ? Math.round(workouts.reduce((s, w) => s + w.duration_minutes, 0) / workouts.length) 
    : 0;

  return (
    <div>
      <div className="page-header fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">WORKOUTS</h1>
          <p className="page-subtitle">Track and log your training sessions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Log Workout
        </button>
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Sessions',  value: workouts.length },
          { label: 'Calories Burned', value: `${totalCalories.toFixed(0)} kcal` },
          { label: 'Avg Duration',    value: `${avgDuration} min` },
        ].map(s => (
          <div key={s.label} className="stat-card fade-in">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Log Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 520, position: 'relative' }}>
            <button 
              onClick={() => setShowForm(false)} 
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: 24 }}>LOG WORKOUT</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Workout Type</label>
                  <select className="form-select" name="workout_type" value={form.workout_type} onChange={handleChange}>
                    {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select className="form-select" name="difficulty" value={form.difficulty} onChange={handleChange}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Duration (min) *</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    name="duration_minutes" 
                    value={form.duration_minutes} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Calories Burned
                    <span style={{ marginLeft: 6, fontSize: '0.68rem', color: 'var(--accent)' }}>
                      ⚡ Auto
                    </span>
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    name="calories_burned"
                    value={form.calories_burned}
                    onChange={handleChange}
                    placeholder="Auto calculated"
                    style={{ borderColor: form.calories_burned ? 'var(--accent)' : undefined }}
                  />
                </div>
              </div>

              {/* Calorie info box */}
              {form.calories_burned > 0 && (
                <div style={{ 
                  padding: '10px 14px', 
                  background: 'var(--accent-dim)', 
                  borderRadius: 8, 
                  marginBottom: 16,
                  fontSize: '0.8rem',
                  color: 'var(--accent)',
                  border: '1px solid #00e67630'
                }}>
                  🔥 <strong>{form.calories_burned} kcal</strong> estimated based on your weight 
                  ({user?.weight || 70}kg), {form.workout_type} at {form.difficulty} intensity 
                  for {form.duration_minutes} minutes
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input 
                  className="form-input" 
                  name="notes" 
                  value={form.notes} 
                  onChange={handleChange} 
                  placeholder="How did it go?" 
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, justifyContent: 'center' }} 
                  disabled={saving}>
                  {saving ? 'Saving…' : 'Log Workout'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card fade-in">
        <div className="card-title">Workout History</div>
        {loading ? <div className="spinner" /> : workouts.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>
            No workouts yet. Log your first session!
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Workout</th>
                  <th>Duration</th>
                  <th>Calories</th>
                  <th>Difficulty</th>
                  <th>Notes</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {workouts.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 600 }}>{w.workout_type}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{w.duration_minutes} min</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                      {w.calories_burned ? `🔥 ${w.calories_burned} kcal` : '—'}
                    </td>
                    <td>
                      <span className={`badge ${
                        w.difficulty === 'hard'   ? 'badge-red'    : 
                        w.difficulty === 'easy'   ? 'badge-green'  : 
                        'badge-yellow'
                      }`}>
                        {w.difficulty}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {w.notes || '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(w.created_at).toLocaleDateString()}
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