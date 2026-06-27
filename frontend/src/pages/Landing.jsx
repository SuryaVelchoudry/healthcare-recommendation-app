import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';
import {
  Heart, Activity, Pill, Stethoscope, Brain, Apple, Shield,
  TrendingUp, ClipboardList, ArrowRight, Star, CheckCircle,
  Zap, Users, ChevronRight, AlertTriangle
} from 'lucide-react';

// ── Animated Counter ──
const AnimatedCounter = ({ end, suffix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// ── Typing Effect ──
const TypingEffect = ({ phrases }) => {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const current = phrases[phraseIdx];
    const speed = deleting ? 40 : 80;

    const timer = setTimeout(() => {
      if (!deleting && charIdx < current.length) {
        setText(current.slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
      } else if (!deleting && charIdx === current.length) {
        setTimeout(() => setDeleting(true), 1800);
      } else if (deleting && charIdx > 0) {
        setText(current.slice(0, charIdx - 1));
        setCharIdx((c) => c - 1);
      } else if (deleting && charIdx === 0) {
        setDeleting(false);
        setPhraseIdx((p) => (p + 1) % phrases.length);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [charIdx, deleting, phraseIdx, phrases]);

  return (
    <span style={{ color: 'var(--accent-primary)', position: 'relative' }}>
      {text}
      <span style={{
        borderRight: '2px solid var(--accent-primary)',
        marginLeft: 2,
        animation: 'blink 0.8s step-end infinite',
      }} />
    </span>
  );
};

// ── Feature Card ──
const FeatureCard = ({ icon, title, description, color, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
      className="glass-card"
      style={{ padding: 28 }}
    >
      <div
        className="icon-md"
        style={{
          width: 52, height: 52,
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `rgba(${color}, 0.1)`,
          border: `1px solid rgba(${color}, 0.2)`,
          color: `rgb(${color})`,
          marginBottom: 18,
        }}
      >
        {icon}
      </div>
      <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>
        {title}
      </h4>
      <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
        {description}
      </p>
    </motion.div>
  );
};

// ── Step Card ──
const StepCard = ({ number, title, description, icon, isLast, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: 52, height: 52,
        borderRadius: '50%',
        background: 'var(--gradient-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', fontWeight: 700, color: '#0A0E1A',
        boxShadow: 'var(--shadow-glow)',
        flexShrink: 0,
      }}>
        {number}
      </div>
      {!isLast && (
        <div style={{
          width: 2, flex: 1, minHeight: 50,
          background: 'linear-gradient(to bottom, var(--accent-primary), transparent)',
          marginTop: 8, opacity: 0.4,
        }} />
      )}
    </div>
    <div style={{ paddingTop: 10, paddingBottom: isLast ? 0 : 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ color: 'var(--accent-primary)' }}>{icon}</span>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h4>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
        {description}
      </p>
    </div>
  </motion.div>
);

// ── Landing Page ──
const Landing = () => {
  const featuresRef = useRef(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: <Activity size={22} />,
      title: 'Symptom Analysis',
      description: 'Advanced AI analyzes 40+ symptoms to identify patterns and correlations with precision.',
      color: '20, 255, 236',
      delay: 0,
    },
    {
      icon: <Pill size={22} />,
      title: 'Medicine Recommendations',
      description: 'Get personalized medication suggestions based on your condition, allergies, and history.',
      color: '123, 97, 255',
      delay: 0.1,
    },
    {
      icon: <Apple size={22} />,
      title: 'Personalized Diet Plans',
      description: 'Receive customized nutrition guidance to support your health recovery and maintenance.',
      color: '0, 208, 132',
      delay: 0.2,
    },
    {
      icon: <TrendingUp size={22} />,
      title: 'Lifestyle Guidance',
      description: 'Holistic lifestyle recommendations including exercise, sleep, and stress management.',
      color: '255, 179, 71',
      delay: 0.3,
    },
    {
      icon: <Shield size={22} />,
      title: 'Risk Assessment',
      description: 'Comprehensive risk scoring to understand your health vulnerability and preventive steps.',
      color: '255, 107, 107',
      delay: 0.4,
    },
    {
      icon: <ClipboardList size={22} />,
      title: 'Health History',
      description: 'Track your health journey over time with detailed assessment history and trends.',
      color: '74, 158, 255',
      delay: 0.5,
    },
  ];

  const stats = [
    { value: 15, suffix: '+', label: 'Diseases Detected' },
    { value: 40, suffix: '+', label: 'Symptoms Analyzed' },
    { value: 98, suffix: '%', label: 'Accuracy Rate' },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Your Profile',
      description: 'Set up your health profile with basic information, medical history, and existing conditions.',
      icon: <Users size={18} />,
    },
    {
      number: '02',
      title: 'Enter Your Symptoms',
      description: 'Select from our comprehensive list of 40+ symptoms you are currently experiencing.',
      icon: <ClipboardList size={18} />,
    },
    {
      number: '03',
      title: 'AI Analysis',
      description: 'Our advanced ML model processes your data against thousands of clinical patterns.',
      icon: <Brain size={18} />,
    },
    {
      number: '04',
      title: 'Get Personalized Results',
      description: 'Receive a comprehensive health report with predictions, medications, diet plans, and lifestyle tips.',
      icon: <Star size={18} />,
    },
  ];

  const floatingIcons = [
    { icon: <Heart size={28} />, top: '15%', left: '8%', color: '#FF6B6B', delay: 0 },
    { icon: <Activity size={24} />, top: '25%', right: '10%', color: '#14FFEC', delay: 0.5 },
    { icon: <Pill size={22} />, bottom: '30%', left: '6%', color: '#7B61FF', delay: 1 },
    { icon: <Stethoscope size={26} />, top: '50%', right: '7%', color: '#FFD700', delay: 1.5 },
    { icon: <Brain size={24} />, bottom: '20%', right: '12%', color: '#00D084', delay: 0.7 },
    { icon: <Shield size={22} />, top: '70%', left: '9%', color: '#4A9EFF', delay: 1.2 },
  ];

  return (
    <div style={{ background: 'var(--bg-primary)' }}>
      {/* ── Hero Section ── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: 70,
        }}
      >
        {/* Background Orbs */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'var(--gradient-hero)',
          zIndex: 0,
        }} />
        <div className="orb orb-cyan" style={{ width: 500, height: 500, top: '-10%', left: '-5%' }} />
        <div className="orb orb-purple" style={{ width: 400, height: 400, top: '20%', right: '-5%' }} />
        <div className="orb orb-teal" style={{ width: 350, height: 350, bottom: '-5%', left: '30%' }} />

        {/* Floating Medical Icons */}
        {floatingIcons.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.35, scale: 1 }}
            transition={{ duration: 0.6, delay: item.delay + 0.5 }}
            style={{
              position: 'absolute',
              top: item.top,
              left: item.left,
              right: item.right,
              bottom: item.bottom,
              color: item.color,
              zIndex: 1,
              filter: `drop-shadow(0 0 12px ${item.color}60)`,
              animation: `float ${6 + i}s ease-in-out infinite`,
              animationDelay: `${item.delay}s`,
            }}
          >
            {item.icon}
          </motion.div>
        ))}

        {/* Hero Content */}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="badge badge-primary" style={{ marginBottom: 24, fontSize: '0.75rem' }}>
                <Zap size={12} />
                AI-Powered Healthcare Platform
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{
                fontSize: 'clamp(2.2rem, 5.5vw, 4rem)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                lineHeight: 1.15,
                marginBottom: 20,
              }}
            >
              Your{' '}
              <span className="text-gradient">AI-Powered</span>
              <br />
              Health Guardian
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              style={{ fontSize: '1.25rem', marginBottom: 8, height: 36 }}
            >
              <TypingEffect phrases={[
                'Analyze your symptoms instantly',
                'Get personalized medicine plans',
                'Track your health journey',
                'Prevent diseases early',
              ]} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              style={{
                fontSize: '1.05rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: 40,
                marginTop: 16,
                maxWidth: 580,
                margin: '16px auto 40px',
              }}
            >
              Our AI analyzes your symptoms, medical history, and lifestyle to provide accurate
              disease predictions and personalized health recommendations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <Link to="/assess" className="btn btn-primary btn-lg">
                <Activity size={18} />
                Start Assessment
                <ArrowRight size={16} />
              </Link>
              <button onClick={scrollToFeatures} className="btn btn-secondary btn-lg">
                Learn More
                <ChevronRight size={16} />
              </button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
                gap: 24, marginTop: 48, flexWrap: 'wrap' }}
            >
              {['HIPAA Compliant', 'Encrypted Data', 'Trusted by Doctors'].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6,
                  color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <CheckCircle size={14} style={{ color: 'var(--accent-primary)' }} />
                  {item}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            color: 'var(--text-muted)', fontSize: '0.75rem', zIndex: 2,
          }}
        >
          <div style={{ width: 24, height: 40, borderRadius: 12, border: '1.5px solid var(--border-hover)',
            display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 4, height: 8, borderRadius: 2, background: 'var(--accent-primary)' }}
            />
          </div>
          Scroll to explore
        </motion.div>
      </section>

      {/* ── Stats Bar ── */}
      <section style={{
        padding: '28px 0',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', gap: 80, flexWrap: 'wrap' }}>
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{
                  fontSize: 'clamp(2rem, 3vw, 2.8rem)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.1,
                }}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4, fontWeight: 500 }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section ref={featuresRef} className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <div className="badge badge-primary" style={{ marginBottom: 16 }}>
              <Star size={12} />
              Features
            </div>
            <h2 className="section-title">
              Everything You Need for <span className="text-gradient">Better Health</span>
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              Our comprehensive platform combines cutting-edge AI with medical expertise to deliver
              accurate, personalized healthcare insights.
            </p>
          </motion.div>

          <div className="grid-3">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{
        padding: 'var(--space-24) 0',
        background: 'rgba(255,255,255,0.01)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="badge badge-purple" style={{ marginBottom: 16 }}>
                How It Works
              </div>
              <h2 className="section-title" style={{ marginBottom: 16 }}>
                From Symptoms to <span className="text-gradient">Solutions</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.7 }}>
                Our streamlined 4-step process transforms your health information into
                actionable personalized recommendations in minutes.
              </p>
              <Link to="/register" className="btn btn-primary">
                Get Started Free
                <ArrowRight size={16} />
              </Link>
            </motion.div>

            <div>
              {steps.map((step, i) => (
                <StepCard
                  key={i}
                  {...step}
                  isLast={i === steps.length - 1}
                  delay={i * 0.15}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card"
            style={{
              padding: '60px 48px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(13,115,119,0.15), rgba(20,255,236,0.05))',
              borderColor: 'rgba(20,255,236,0.15)',
              boxShadow: '0 0 60px rgba(20,255,236,0.08)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: -50, right: -50,
              width: 200, height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(20,255,236,0.1), transparent)',
            }} />
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', marginBottom: 16 }}>
              Start Your <span className="text-gradient">Health Journey</span> Today
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
              Join thousands who trust MediAI for personalized health guidance. Free to use,
              accurate, and available anytime.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Free Account
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn btn-ghost btn-lg">
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Medical Disclaimer ── */}
      <section style={{ padding: '0 0 var(--space-16)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="alert alert-warning"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 600, color: 'var(--color-warning)', marginBottom: 4, fontSize: '0.9rem' }}>
                Medical Disclaimer
              </p>
              <p style={{ color: 'rgba(255,179,71,0.8)', fontSize: '0.825rem', lineHeight: 1.6, margin: 0 }}>
                MediAI is an AI-powered informational tool and is <strong>NOT a substitute for professional
                medical advice, diagnosis, or treatment</strong>. Always consult a qualified healthcare
                provider for medical concerns. Never disregard professional medical advice or delay seeking
                it based on information from this platform. In case of emergency, call your local emergency
                services immediately.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '32px 0',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Heart size={18} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                MediAI
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
              © 2024 MediAI. For informational purposes only.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (max-width: 768px) {
          .grid-3 { grid-template-columns: 1fr; }
          section > .container > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;
