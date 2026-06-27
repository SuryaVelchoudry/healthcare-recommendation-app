import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Lock, Eye, EyeOff, Heart, AlertCircle,
  ChevronRight, ChevronLeft, Check, Calendar, Droplets,
  ArrowRight, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Password Strength Meter ──
const PasswordStrength = ({ password }) => {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#FF6B6B', '#FFB347', '#4A9EFF', '#00D084'];

  if (!password) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= score ? colors[score] : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '0.75rem', color: colors[score] || 'var(--text-muted)' }}>
        {labels[score] || 'Very weak'}
      </span>
    </div>
  );
};

// ── Multi-Select Chips ──
const ChipSelector = ({ label, options, selected, onChange }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`chip ${selected.includes(opt.value) ? 'active' : ''}`}
          onClick={() => {
            if (selected.includes(opt.value)) {
              onChange(selected.filter((s) => s !== opt.value));
            } else {
              onChange([...selected, opt.value]);
            }
          }}
        >
          {selected.includes(opt.value) && <Check size={11} />}
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const Register = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 1 — Account Info
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 — Health Profile
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);

  const { register } = useAuth();
  const navigate = useNavigate();

  const allergyOptions = [
    { value: 'penicillin', label: 'Penicillin' },
    { value: 'aspirin', label: 'Aspirin' },
    { value: 'sulfonamides', label: 'Sulfonamides' },
    { value: 'nsaids', label: 'NSAIDs' },
    { value: 'none', label: 'None' },
    { value: 'other', label: 'Other' },
  ];

  const conditionOptions = [
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'hypertension', label: 'Hypertension' },
    { value: 'asthma', label: 'Asthma' },
    { value: 'heart_disease', label: 'Heart Disease' },
    { value: 'thyroid', label: 'Thyroid' },
    { value: 'none', label: 'None' },
    { value: 'other', label: 'Other' },
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const validateStep1 = () => {
    const errors = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required';
    if (!username.trim()) errors.username = 'Username is required';
    else if (username.length < 3) errors.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.username = 'Username can only contain letters, numbers, and underscores';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Please enter a valid email';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!dob) errors.dob = 'Date of birth is required';
    if (!gender) errors.gender = 'Please select your gender';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setError('');
    setLoading(true);

    const payload = {
      full_name: fullName,
      username,
      email,
      password,
      date_of_birth: dob,
      gender,
      blood_group: bloodGroup || null,
      known_allergies: allergies,
      existing_conditions: conditions,
    };

    try {
      await register(payload);
      navigate('/dashboard', { state: { welcome: true } });
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Registration failed. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      if (err.response?.status === 400) {
        // Go back to step 1 if email/username conflict
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({
      x: direction < 0 ? 60 : -60,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(1);

  const goBack = () => {
    setDirection(-1);
    setStep(1);
  };

  const goNext = () => {
    setDirection(1);
    handleNext();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      paddingTop: 70,
      padding: '90px 24px 40px',
    }}>
      {/* Background */}
      <div className="orb orb-cyan" style={{ width: 400, height: 400, top: '-10%', right: '-5%', opacity: 0.1 }} />
      <div className="orb orb-purple" style={{ width: 350, height: 350, bottom: '5%', left: '-5%', opacity: 0.08 }} />

      <div style={{ width: '100%', maxWidth: 560, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <Heart size={22} color="#0A0E1A" />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>MediAI</span>
        </div>

        {/* Card */}
        <div className="glass-card-xl" style={{ padding: '40px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: 8 }}>Create Account</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {step === 1 ? 'Set up your account credentials' : 'Tell us about your health'}
            </p>
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.875rem', fontWeight: 600,
                    background: s < step ? 'var(--gradient-primary)' : s === step ? 'rgba(20,255,236,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${s <= step ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    color: s < step ? '#0A0E1A' : s === step ? 'var(--accent-primary)' : 'var(--text-muted)',
                    transition: 'all 0.3s ease',
                    boxShadow: s === step ? '0 0 15px rgba(20,255,236,0.3)' : 'none',
                  }}>
                    {s < step ? <Check size={16} /> : s}
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 500,
                    color: s === step ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}>
                    {s === 1 ? 'Account' : 'Health'}
                  </span>
                </div>
                {s < 2 && (
                  <div style={{
                    flex: 1, height: 2, maxWidth: 60, borderRadius: 1,
                    background: step > 1 ? 'var(--gradient-primary)' : 'var(--border-color)',
                    transition: 'background 0.4s ease',
                    marginBottom: 22,
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert alert-error"
              style={{ marginBottom: 20 }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem' }}>{error}</span>
            </motion.div>
          )}

          {/* ── Steps ── */}
          <form onSubmit={handleSubmit} noValidate>
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 ? (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {/* Full Name */}
                  <div className="form-group" style={{ marginBottom: 18 }}>
                    <label className="form-label">Full Name</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon"><User size={15} /></span>
                      <input
                        type="text"
                        className={`form-input ${fieldErrors.fullName ? 'error' : ''}`}
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => { setFullName(e.target.value); setFieldErrors(p => ({...p, fullName: ''})); }}
                      />
                    </div>
                    {fieldErrors.fullName && <span className="form-error"><AlertCircle size={11} /> {fieldErrors.fullName}</span>}
                  </div>

                  {/* Username */}
                  <div className="form-group" style={{ marginBottom: 18 }}>
                    <label className="form-label">Username</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>@</span>
                      <input
                        type="text"
                        className={`form-input ${fieldErrors.username ? 'error' : ''}`}
                        placeholder="johndoe_123"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value.toLowerCase()); setFieldErrors(p => ({...p, username: ''})); }}
                      />
                    </div>
                    {fieldErrors.username && <span className="form-error"><AlertCircle size={11} /> {fieldErrors.username}</span>}
                  </div>

                  {/* Email */}
                  <div className="form-group" style={{ marginBottom: 18 }}>
                    <label className="form-label">Email address</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon"><Mail size={15} /></span>
                      <input
                        type="email"
                        className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: ''})); }}
                      />
                    </div>
                    {fieldErrors.email && <span className="form-error"><AlertCircle size={11} /> {fieldErrors.email}</span>}
                  </div>

                  {/* Password */}
                  <div className="form-group" style={{ marginBottom: 18 }}>
                    <label className="form-label">Password</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon"><Lock size={15} /></span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({...p, password: ''})); }}
                      />
                      <button type="button" className="form-input-action" onClick={() => setShowPassword(p => !p)}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                    {fieldErrors.password && <span className="form-error"><AlertCircle size={11} /> {fieldErrors.password}</span>}
                  </div>

                  {/* Confirm Password */}
                  <div className="form-group" style={{ marginBottom: 28 }}>
                    <label className="form-label">Confirm Password</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon"><Lock size={15} /></span>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        className={`form-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(p => ({...p, confirmPassword: ''})); }}
                      />
                      <button type="button" className="form-input-action" onClick={() => setShowConfirm(p => !p)}>
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && <span className="form-error"><AlertCircle size={11} /> {fieldErrors.confirmPassword}</span>}
                    {confirmPassword && password === confirmPassword && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Check size={12} /> Passwords match
                      </span>
                    )}
                  </div>

                  <button type="button" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }} onClick={goNext}>
                    Continue
                    <ChevronRight size={16} />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {/* Date of Birth */}
                  <div className="form-group" style={{ marginBottom: 18 }}>
                    <label className="form-label">Date of Birth</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon"><Calendar size={15} /></span>
                      <input
                        type="date"
                        className={`form-input ${fieldErrors.dob ? 'error' : ''}`}
                        value={dob}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => { setDob(e.target.value); setFieldErrors(p => ({...p, dob: ''})); }}
                      />
                    </div>
                    {fieldErrors.dob && <span className="form-error"><AlertCircle size={11} /> {fieldErrors.dob}</span>}
                  </div>

                  {/* Gender */}
                  <div className="form-group" style={{ marginBottom: 18 }}>
                    <label className="form-label">Gender</label>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {['Male', 'Female', 'Other', 'Prefer not to say'].map((g) => (
                        <label key={g} className="form-radio" style={{ cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="gender"
                            value={g.toLowerCase().replace(/ /g, '_')}
                            checked={gender === g.toLowerCase().replace(/ /g, '_')}
                            onChange={(e) => { setGender(e.target.value); setFieldErrors(p => ({...p, gender: ''})); }}
                          />
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{g}</span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.gender && <span className="form-error"><AlertCircle size={11} /> {fieldErrors.gender}</span>}
                  </div>

                  {/* Blood Group */}
                  <div className="form-group" style={{ marginBottom: 18 }}>
                    <label className="form-label">Blood Group <span style={{ color: 'var(--text-muted)' }}>(Optional)</span></label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
                        <Droplets size={15} style={{ color: 'var(--text-muted)' }} />
                      </span>
                      <select
                        className="form-input"
                        style={{ paddingLeft: 36 }}
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                      >
                        <option value="">Select blood group</option>
                        {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div style={{ marginBottom: 18 }}>
                    <ChipSelector
                      label="Known Allergies (select all that apply)"
                      options={allergyOptions}
                      selected={allergies}
                      onChange={setAllergies}
                    />
                  </div>

                  {/* Conditions */}
                  <div style={{ marginBottom: 28 }}>
                    <ChipSelector
                      label="Existing Conditions (select all that apply)"
                      options={conditionOptions}
                      selected={conditions}
                      onChange={setConditions}
                    />
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={goBack}
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>
                    <motion.button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 2, justifyContent: 'center', padding: 14 }}
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {loading ? (
                        <>
                          <div className="spinner spinner-sm" style={{ borderTopColor: '#0A0E1A', borderColor: 'rgba(10,14,26,0.3)' }} />
                          Creating account…
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} />
                          Create Account
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
