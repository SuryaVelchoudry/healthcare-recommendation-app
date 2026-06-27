import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, Info, Download, ArrowRight, HeartPulse, Droplets, Bed, Brain } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { assessmentAPI } from '../api/api';

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('predictions');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await assessmentAPI.getAssessment(id);
        setData(res.data);
      } catch (err) {
        setError('Failed to load assessment results.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) return (
    <div className="container flex-center" style={{ minHeight: '80vh' }}>
      <Activity size={48} className="text-gradient" style={{ animation: 'pulse 2s infinite' }} />
    </div>
  );

  if (error) return (
    <div className="container" style={{ paddingTop: '4rem' }}>
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--accent-coral)' }}>
        <AlertTriangle size={48} style={{ margin: '0 auto 1rem' }} />
        <h2>{error}</h2>
        <button className="btn-primary mt-2" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    </div>
  );

  if (!data) return null;

  const { predictions, risk_score, risk_level, recommendations } = data;
  const topPrediction = predictions?.[0];

  const getRiskColor = (level) => {
    switch(level.toLowerCase()) {
      case 'low': return 'var(--accent-primary)';
      case 'moderate': return 'var(--accent-gold)';
      case 'high': return 'var(--accent-coral)';
      case 'critical': return 'red';
      default: return 'white';
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="flex-between mb-4">
        <h2>Your Health Analysis</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-ghost" onClick={() => window.print()}><Download size={18} /> Save PDF</button>
          <button className="btn-primary" onClick={() => navigate('/assess')}>New Assessment</button>
        </div>
      </div>

      {/* Hero Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card mb-4" style={{ padding: '2rem', background: 'var(--gradient-hero)', borderTop: `4px solid ${getRiskColor(risk_level)}` }}
      >
        <div className="grid-3" style={{ gap: '2rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto' }}>
              {/* Simple CSS gauge representation */}
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-secondary)" strokeWidth="10" />
                <circle cx="50" cy="50" r="45" fill="none" stroke={getRiskColor(risk_level)} strokeWidth="10" 
                  strokeDasharray={`${risk_score * 2.82} 282`} strokeDashoffset="0" transform="rotate(-90 50 50)" 
                  style={{ transition: 'stroke-dasharray 1s ease-in-out' }} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{risk_score.toFixed(0)}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Score</div>
              </div>
            </div>
            <div className="mt-2" style={{ display: 'inline-block', padding: '0.25rem 1rem', borderRadius: '1rem', backgroundColor: `rgba(255,255,255,0.1)`, color: getRiskColor(risk_level), fontWeight: 'bold', textTransform: 'uppercase' }}>
              {risk_level} Risk
            </div>
          </div>
          
          <div style={{ gridColumn: 'span 2' }}>
            <h3 className="text-gradient">Primary Indication: {topPrediction?.disease_name || 'No specific condition detected'}</h3>
            <p className="text-secondary">Based on your symptoms and profile, our AI models indicate this as the most probable cause. Please review the recommendations below and consult a healthcare professional.</p>
            
            <div className="grid-2 mt-4" style={{ gap: '1rem' }}>
              <div className="glass-card p-2 text-center">
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{(topPrediction?.confidence * 100).toFixed(1)}%</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Model Confidence</div>
              </div>
              <div className="glass-card p-2 text-center">
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-coral)', textTransform: 'capitalize' }}>{topPrediction?.severity || 'Unknown'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Typical Severity</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', overflowX: 'auto' }}>
        {['predictions', 'medications', 'diet', 'lifestyle'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ 
              background: 'none', border: 'none', color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? 'bold' : 'normal', padding: '0.5rem 1rem', cursor: 'pointer',
              position: 'relative', textTransform: 'capitalize'
            }}
          >
            {tab}
            {activeTab === tab && <div style={{ position: 'absolute', bottom: '-17px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--accent-primary)' }} />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '400px' }}>
        {activeTab === 'predictions' && (
          <div className="grid-3" style={{ gap: '1rem' }}>
            {predictions?.map((pred, i) => (
              <motion.div key={pred.disease_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-4" style={{ border: i === 0 ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)' }}>
                {i === 0 && <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Primary Match</div>}
                <h3 style={{ margin: '0 0 1rem 0' }}>{pred.disease_name}</h3>
                
                <div style={{ marginBottom: '0.5rem' }}>
                  <div className="flex-between" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    <span>Confidence</span>
                    <span>{(pred.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pred.confidence * 100}%`, height: '100%', backgroundColor: i === 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  Severity: <strong style={{ color: pred.severity === 'severe' ? 'var(--accent-coral)' : 'inherit' }}>{pred.severity}</strong>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'medications' && (
          <div>
            {recommendations?.medications?.length > 0 ? (
              <div className="grid-2" style={{ gap: '1rem' }}>
                {recommendations.medications.map((med, i) => (
                  <div key={i} className="glass-card p-4">
                    <div className="flex-between mb-2">
                      <h3 style={{ margin: 0, color: 'var(--accent-primary)' }}>{med.name}</h3>
                      {med.requires_prescription && <span style={{ padding: '0.2rem 0.5rem', backgroundColor: 'rgba(255,107,107,0.1)', color: 'var(--accent-coral)', fontSize: '0.7rem', borderRadius: '1rem' }}>Rx Required</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Generic: {med.generic_name} | {med.category}</div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Usage:</strong> <span className="text-secondary">{med.usage}</span>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Dosage:</strong> <span className="text-secondary">{med.dosage}</span>
                      <br/>
                      <strong>Max Daily:</strong> <span className="text-secondary">{med.max_daily}</span>
                    </div>
                    
                    <div className="grid-2" style={{ gap: '1rem', fontSize: '0.8rem' }}>
                      <div style={{ backgroundColor: 'rgba(255,107,107,0.05)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        <strong style={{ color: 'var(--accent-coral)' }}>Side Effects:</strong>
                        <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
                          {med.side_effects.map((se, j) => <li key={j}>{se}</li>)}
                        </ul>
                      </div>
                      <div style={{ backgroundColor: 'rgba(255,107,107,0.05)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        <strong style={{ color: 'var(--accent-coral)' }}>Contraindications:</strong>
                        <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
                          {med.contraindications.map((ci, j) => <li key={j}>{ci}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-4 text-center">No medications recommended or available for this condition.</div>
            )}
            
            <div className="mt-4 p-4 glass-card" style={{ borderColor: 'var(--accent-coral)', backgroundColor: 'rgba(255,107,107,0.05)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--accent-coral)', fontWeight: 'bold' }}>
                <AlertTriangle size={20} /> MEDICAL DISCLAIMER
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                This AI-generated list is for informational purposes only. Do not take any medications without consulting a licensed physician or pharmacist. 
                Our algorithms filter based on the profile you provided, but cannot account for all medical variables.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'diet' && (
          <div className="grid-2" style={{ gap: '1.5rem' }}>
            <div className="glass-card p-4" style={{ gridColumn: '1 / -1' }}>
              <h3 className="mb-2">Dietary Summary</h3>
              <p className="text-secondary">{recommendations?.diet?.summary}</p>
            </div>
            
            <div className="glass-card p-4">
              <h3 style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} /> Foods to Include
              </h3>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1.5rem' }}>
                {recommendations?.diet?.foods_to_eat?.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
            
            <div className="glass-card p-4">
              <h3 style={{ color: 'var(--accent-coral)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} /> Foods to Avoid
              </h3>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1.5rem' }}>
                {recommendations?.diet?.foods_to_avoid?.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
            
            <div className="glass-card p-4" style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Droplets size={20} className="text-gradient" /> Hydration
              </h3>
              <p className="text-secondary m-0">{recommendations?.diet?.hydration}</p>
            </div>
          </div>
        )}

        {activeTab === 'lifestyle' && (
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="glass-card p-4">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
                <HeartPulse size={20} /> Exercise
              </h3>
              <p className="text-secondary">{recommendations?.lifestyle?.exercise}</p>
            </div>
            <div className="glass-card p-4">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
                <Bed size={20} /> Sleep
              </h3>
              <p className="text-secondary">{recommendations?.lifestyle?.sleep}</p>
            </div>
            <div className="glass-card p-4">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
                <Brain size={20} /> Stress Management
              </h3>
              <p className="text-secondary">{recommendations?.lifestyle?.stress_management}</p>
            </div>
            <div className="glass-card p-4">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
                <Info size={20} /> General Tips
              </h3>
              <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', margin: '0.5rem 0 0 0' }}>
                {recommendations?.lifestyle?.general_tips?.map((t, i) => <li key={i} className="mb-1">{t}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
