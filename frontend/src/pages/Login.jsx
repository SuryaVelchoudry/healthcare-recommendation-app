import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, Heart, Activity, Shield,
  AlertCircle, ArrowRight, Stethoscope, Brain, CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errors = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Please enter a valid email';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Invalid email or password.';
      setError(typeof msg === 'string' ? msg : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const healthQuotes = [
    '"The greatest wealth is health."',
    '"Take care of your body — it\'s the only place you have to live."',
    '"Prevention is better than cure."',
  ];

  const [quoteIdx] = useState(() => Math.floor(Math.random() * healthQuotes.length));

  const leftPanelIcons = [
    { icon: <Heart size={30} />, color: '#FF6B6B', top: '20%', left: '15%', delay: 0 },
    { icon: <Activity size={26} />, color: '#14FFEC', top: '40%', right: '12%', delay: 0.4 },
    { icon: <Stethoscope size={28} />, color: '#7B61FF', bottom: '30%', left: '10%', delay: 0.8 },
    { icon: <Brain size={24} />, color: '#FFD700', top: '60%', right: '18%', delay: 1.2 },
    { icon: <Shield size={22} />, color: '#00D084', bottom: '20%', right: '10%', delay: 0.6 },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-primary)',
      paddingTop: 70,
    }}>
      {/* ── Left Panel ── */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          flex: 1,
          display: 'none',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0D1B2A 0%, #0A1628 50%, #0D0A1A 100%)',
          borderRight: '1px solid var(--border-color)',
        }}
        className="login-left-panel"
      >
        {/* Orbs */}
        <div className="orb orb-cyan" style={{ width: 350, height: 350, top: '-10%', left: '-10%', opacity: 0.2 }} />
        <div className="orb orb-purple" style={{ width: 280, height: 280, bottom: '5%', right: '-5%', opacity: 0.15 }} />

        {/* Floating icons */}
        {leftPanelIcons.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{ delay: item.delay, duration: 0.5 }}
            style={{
              position: 'absolute',
              top: item.top, left: item.left, right: item.right, bottom: item.bottom,
              color: item.color,
              filter: `drop-shadow(0 0 10px ${item.color}60)`,
              animation: `float ${5 + i}s ease-in-out infinite`,
              animationDelay: `${item.delay}s`,
            }}
          >
            {item.icon}
          </motion.div>
        ))}

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 2,
          height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '48px 40px', textAlign: 'center',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 28,
              boxShadow: 'var(--shadow-glow-strong)',
            }}
          >
            <Heart size={34} color="#0A0E1A" strokeWidth={2.5} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: '1.8rem', marginBottom: 16, lineHeight: 1.3 }}
          >
            Welcome Back to <span className="text-gradient">MediAI</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontStyle: 'italic',
              lineHeight: 1.6,
              maxWidth: 300,
              marginBottom: 48,
            }}
          >
            {healthQuotes[quoteIdx]}
          </motion.p>

          {/* Feature bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            {[
              'AI-powered symptom analysis',
              'Personalized medicine recommendations',
              'Track health trends over time',
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <CheckCircle size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Right Panel — Form ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 460 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="login-logo-mobile" style={{ display: 'none', justifyContent: 'center',
              alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Heart size={22} color="#0A0E1A" />
              </div>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem',
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>MediAI</span>
            </div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: 8 }}>Sign In</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Access your personalized health dashboard
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert alert-error"
              style={{ marginBottom: 24 }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Email address</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><Mail size={16} /></span>
                <input
                  type="email"
                  className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <span className="form-error">
                  <AlertCircle size={12} /> {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--accent-primary)', fontSize: '0.8rem', fontFamily: 'var(--font-primary)' }}>
                  Forgot password?
                </button>
              </div>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><Lock size={16} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="form-input-action"
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="form-error">
                  <AlertCircle size={12} /> {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Remember me */}
            <div style={{ marginBottom: 28 }}>
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Remember me for 30 days
                </span>
              </label>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem' }}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading ? (
                <>
                  <div className="spinner spinner-sm" style={{ borderTopColor: '#0A0E1A', borderColor: 'rgba(10,14,26,0.3)' }} />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="divider-text" style={{ margin: '28px 0' }}>
            New to MediAI?
          </div>

          {/* Register Link */}
          <Link to="/register" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
            Create an Account
          </Link>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 24, lineHeight: 1.5 }}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
            Your health data is encrypted and secure.
          </p>
        </div>
      </motion.div>

      <style>{`
        @media (min-width: 900px) {
          .login-left-panel { display: flex !important; }
          .login-logo-mobile { display: none !important; }
        }
        @media (max-width: 899px) {
          .login-logo-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
