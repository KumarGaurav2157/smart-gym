import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Dumbbell, Mail, KeyRound, Lock, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });

const STEPS = {
  EMAIL:    'email',
  OTP:      'otp',
  PASSWORD: 'password',
  SUCCESS:  'success',
};

export default function ForgotPasswordPage() {
  const [step,        setStep]       = useState(STEPS.EMAIL);
  const [email,       setEmail]      = useState('');
  const [otp,         setOtp]        = useState('');
  const [demoOtp,     setDemoOtp]    = useState('');
  const [resetToken,  setResetToken] = useState('');
  const [newPassword, setNewPassword]= useState('');
  const [confirmPass, setConfirmPass]= useState('');
  const [loading,     setLoading]    = useState(false);

  // ── Step 1: Request OTP ──────────────────────────────────────────────────
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setResetToken(data.reset_token);
      setDemoOtp(data.otp_demo || '');
      setStep(STEPS.OTP);
      if (data.email_sent) {
        toast.success(`✅ Reset code sent to ${email}`);
      } else {
        toast.success('Reset code generated! (Demo mode — see code below)');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { reset_token: resetToken, otp });
      setStep(STEPS.PASSWORD);
      toast.success('Code verified! Set your new password.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ───────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPass) {
      toast.error('Passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        reset_token:  resetToken,
        new_password: newPassword,
      });
      setStep(STEPS.SUCCESS);
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left hero */}
      <div className="auth-hero">
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell size={22} color="#0a0b0d" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.1em' }}>SMARTGYM</span>
        </div>
        <h1 className="auth-hero-title">FORGOT<br />YOUR<br /><span>PASSWORD?</span></h1>
        <p className="auth-hero-sub">No worries! Enter your email and we'll send you a reset code to get back into your account.</p>

        {/* Steps indicator */}
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { step: 1, label: 'Enter your email',    active: step === STEPS.EMAIL    },
            { step: 2, label: 'Enter the reset code', active: step === STEPS.OTP      },
            { step: 3, label: 'Set new password',    active: step === STEPS.PASSWORD  },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: s.active ? 'var(--accent)' : 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700,
                color: s.active ? '#0a0b0d' : 'var(--text-muted)',
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}>
                {s.step}
              </div>
              <span style={{ fontSize: '0.85rem', color: s.active ? 'var(--accent)' : 'var(--text-muted)', fontWeight: s.active ? 600 : 400 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">

        {/* ── Step 1: Email ── */}
        {step === STEPS.EMAIL && (
          <>
            <h2 className="auth-form-title">RESET PASSWORD</h2>
            <p className="auth-form-sub">Enter your registered email address</p>
            <form onSubmit={handleRequestOtp}>
              <div className="form-group">
                <label className="form-label">
                  <Mail size={12} style={{ display: 'inline', marginRight: 6 }} />
                  Email Address
                </label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@gym.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 8 }}
                disabled={loading}>
                {loading ? 'Sending…' : <><span>Send Reset Code</span><ArrowRight size={16} /></>}
              </button>
            </form>
            <p style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Remember your password? <Link to="/login">Sign in</Link>
            </p>
          </>
        )}

        {/* ── Step 2: OTP ── */}
        {step === STEPS.OTP && (
          <>
            <h2 className="auth-form-title">ENTER CODE</h2>
            <p className="auth-form-sub">Enter the 6-digit reset code</p>

            {/* Email sent status */}
            {demoOtp ? (
              <div style={{ padding: '16px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 10, marginBottom: 24 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  🔑 Demo Reset Code (Email not configured)
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--accent)', letterSpacing: '0.3em', textAlign: 'center' }}>
                  {demoOtp}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                  Configure Gmail to send real emails — see Setup Guide below
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', background: '#00e67615', border: '1px solid #00e67640', borderRadius: 10, marginBottom: 24 }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>
                  ✅ Reset code sent to your email!
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Check your inbox at <strong>{email}</strong>. Also check spam folder.
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label className="form-label">
                  <KeyRound size={12} style={{ display: 'inline', marginRight: 6 }} />
                  6-Digit Reset Code
                </label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  style={{ fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                  required
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Code expires in 15 minutes
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 8 }}
                disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying…' : <><span>Verify Code</span><ArrowRight size={16} /></>}
              </button>
            </form>

            <button
              onClick={() => { setStep(STEPS.EMAIL); setOtp(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 16 }}>
              <ArrowLeft size={14} /> Back to email
            </button>
          </>
        )}

        {/* ── Step 3: New Password ── */}
        {step === STEPS.PASSWORD && (
          <>
            <h2 className="auth-form-title">NEW PASSWORD</h2>
            <p className="auth-form-sub">Choose a strong new password</p>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">
                  <Lock size={12} style={{ display: 'inline', marginRight: 6 }} />
                  New Password
                </label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Lock size={12} style={{ display: 'inline', marginRight: 6 }} />
                  Confirm New Password
                </label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  required
                />
                {confirmPass && newPassword !== confirmPass && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 4 }}>
                    ❌ Passwords do not match
                  </div>
                )}
                {confirmPass && newPassword === confirmPass && newPassword.length >= 6 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: 4 }}>
                    ✅ Passwords match
                  </div>
                )}
              </div>

              {/* Password strength */}
              {newPassword && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>Password Strength</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: newPassword.length < 6 ? '25%' : newPassword.length < 8 ? '50%' : newPassword.length < 12 ? '75%' : '100%',
                      background: newPassword.length < 6 ? 'var(--danger)' : newPassword.length < 8 ? 'var(--warning)' : newPassword.length < 12 ? '#4ea8de' : 'var(--accent)',
                    }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {newPassword.length < 6 ? '❌ Too short' : newPassword.length < 8 ? '⚠️ Weak' : newPassword.length < 12 ? '✅ Good' : '💪 Strong'}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 8 }}
                disabled={loading || newPassword !== confirmPass || newPassword.length < 6}>
                {loading ? 'Resetting…' : <><span>Reset Password</span><ArrowRight size={16} /></>}
              </button>
            </form>
          </>
        )}

        {/* ── Step 4: Success ── */}
        {step === STEPS.SUCCESS && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-dim)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--accent)' }}>
              <CheckCircle size={40} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 12 }}>PASSWORD RESET!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center', padding: '13px 32px', display: 'inline-flex', gap: 8 }}>
              <span>Go to Login</span><ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}