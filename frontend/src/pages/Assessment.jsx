import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, Activity, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { healthAPI, assessmentAPI } from '../api/api';

const STEPS = ['Basic Info', 'Medical History', 'Symptoms', 'Lifestyle'];

export default function Assessment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    health_profile: {
      age: user?.date_of_birth ? new Date().getFullYear() - new Date(user.date_of_birth).getFullYear() : 30,
      gender: user?.gender || 'Other',
      weight_kg: 70,
      height_cm: 170,
      blood_pressure_systolic: 120,
      blood_pressure_diastolic: 80,
      blood_group: user?.blood_group || 'Unknown',
      existing_conditions: user?.existing_conditions || [],
      current_medications: [],
      allergies: user?.known_allergies || []
    },
    symptoms: {},
    lifestyle: {
      exercise_frequency: 'sometimes',
      diet_type: 'mixed',
      sleep_hours: 7,
      stress_level: 'medium',
      smoking: false,
      alcohol: 'occasional',
      water_intake_liters: 2.0
    }
  });

  const [medInput, setMedInput] = useState('');

  useEffect(() => {
    healthAPI.getSymptoms()
      .then(res => setAvailableSymptoms(res.data.symptoms || []))
      .catch(err => console.error("Failed to load symptoms", err));
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      // ensure bmi is calculated
      const h_m = formData.health_profile.height_cm / 100;
      const bmi = formData.health_profile.weight_kg / (h_m * h_m);
      
      const payload = {
        ...formData,
        health_profile: {
          ...formData.health_profile,
          bmi: parseFloat(bmi.toFixed(2))
        }
      };

      const res = await assessmentAPI.analyze(payload);
      navigate(`/results/${res.data.assessment_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during analysis.');
      setLoading(false);
    }
  };

  const toggleSymptom = (sym) => {
    setFormData(prev => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [sym]: prev.symptoms[sym] ? 0 : 1
      }
    }));
  };

  const addMedication = (e) => {
    if (e.key === 'Enter' && medInput.trim()) {
      e.preventDefault();
      if (!formData.health_profile.current_medications.includes(medInput.trim())) {
        setFormData(prev => ({
          ...prev,
          health_profile: {
            ...prev.health_profile,
            current_medications: [...prev.health_profile.current_medications, medInput.trim()]
          }
        }));
      }
      setMedInput('');
    }
  };
  
  const removeMedication = (med) => {
    setFormData(prev => ({
      ...prev,
      health_profile: {
        ...prev.health_profile,
        current_medications: prev.health_profile.current_medications.filter(m => m !== med)
      }
    }));
  };

  const bmi = formData.health_profile.weight_kg / Math.pow(formData.health_profile.height_cm / 100, 2);
  const selectedSymptomsCount = Object.values(formData.symptoms).filter(v => v === 1).length;

  return (
    <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px', margin: '0 auto', minHeight: '80vh' }}>
      <div className="glass-card p-4">
        {/* Progress Stepper */}
        <div className="flex-between mb-4" style={{ position: 'relative' }}>
          {STEPS.map((step, idx) => (
            <div key={step} className="flex-center" style={{ flexDirection: 'column', zIndex: 1 }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: idx <= currentStep ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: idx <= currentStep ? '#000' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', marginBottom: '0.5rem', transition: 'var(--transition-normal)'
              }}>
                {idx < currentStep ? <Check size={16} /> : idx + 1}
              </div>
              <span style={{ fontSize: '0.75rem', color: idx <= currentStep ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {step}
              </span>
            </div>
          ))}
          <div style={{ position: 'absolute', top: '16px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--border-color)', zIndex: 0 }} />
        </div>

        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255,107,107,0.1)', color: 'var(--accent-coral)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            style={{ minHeight: '300px' }}
          >
            {/* Step 1: Basic Info */}
            {currentStep === 0 && (
              <div className="grid-2" style={{ gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Age</label>
                  <input type="number" value={formData.health_profile.age} onChange={e => setFormData(p => ({...p, health_profile: {...p.health_profile, age: Number(e.target.value)}}))} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Gender</label>
                  <select value={formData.health_profile.gender} onChange={e => setFormData(p => ({...p, health_profile: {...p.health_profile, gender: e.target.value}}))} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Height (cm)</label>
                  <input type="number" value={formData.health_profile.height_cm} onChange={e => setFormData(p => ({...p, health_profile: {...p.health_profile, height_cm: Number(e.target.value)}}))} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Weight (kg)</label>
                  <input type="number" value={formData.health_profile.weight_kg} onChange={e => setFormData(p => ({...p, health_profile: {...p.health_profile, weight_kg: Number(e.target.value)}}))} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(20,255,236,0.05)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Calculated BMI: <strong>{bmi.toFixed(1)}</strong></span>
                    <span style={{ color: bmi > 25 ? 'var(--accent-coral)' : 'var(--accent-primary)' }}>
                      {bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'}
                    </span>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Systolic BP (Normal: 120)</label>
                  <input type="number" value={formData.health_profile.blood_pressure_systolic} onChange={e => setFormData(p => ({...p, health_profile: {...p.health_profile, blood_pressure_systolic: Number(e.target.value)}}))} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Diastolic BP (Normal: 80)</label>
                  <input type="number" value={formData.health_profile.blood_pressure_diastolic} onChange={e => setFormData(p => ({...p, health_profile: {...p.health_profile, blood_pressure_diastolic: Number(e.target.value)}}))} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
              </div>
            )}

            {/* Step 2: Medical History */}
            {currentStep === 1 && (
              <div>
                <div className="mb-4">
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Current Medications (Press Enter to add)</label>
                  <input 
                    type="text" 
                    value={medInput} 
                    onChange={e => setMedInput(e.target.value)} 
                    onKeyDown={addMedication}
                    placeholder="e.g. Paracetamol, Lisinopril..."
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', marginBottom: '0.5rem' }} 
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {formData.health_profile.current_medications.map(med => (
                      <span key={med} style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {med} <button onClick={() => removeMedication(med)} style={{ background: 'none', border: 'none', color: 'var(--accent-coral)', cursor: 'pointer' }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Known Allergies (from Profile)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {formData.health_profile.allergies.length > 0 ? formData.health_profile.allergies.map(a => (
                       <span key={a} style={{ padding: '0.25rem 0.5rem', backgroundColor: 'rgba(255,107,107,0.2)', border: '1px solid var(--accent-coral)', color: 'var(--text-primary)', borderRadius: '1rem', fontSize: '0.8rem' }}>{a}</span>
                    )) : <span style={{ color: 'var(--text-muted)' }}>None reported</span>}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Existing Conditions (from Profile)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {formData.health_profile.existing_conditions.length > 0 ? formData.health_profile.existing_conditions.map(c => (
                       <span key={c} style={{ padding: '0.25rem 0.5rem', backgroundColor: 'rgba(20,255,236,0.1)', border: '1px solid var(--accent-primary)', color: 'var(--text-primary)', borderRadius: '1rem', fontSize: '0.8rem' }}>{c}</span>
                    )) : <span style={{ color: 'var(--text-muted)' }}>None reported</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Symptoms */}
            {currentStep === 2 && (
              <div>
                <div className="flex-between mb-4">
                  <h3 style={{ margin: 0 }}>Select Symptoms</h3>
                  <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--accent-primary)', color: '#000', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {selectedSymptomsCount} selected
                  </span>
                </div>
                
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search symptoms..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {availableSymptoms.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).map(sym => (
                    <button
                      key={sym}
                      onClick={() => toggleSymptom(sym)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${formData.symptoms[sym] ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        backgroundColor: formData.symptoms[sym] ? 'rgba(20,255,236,0.1)' : 'var(--bg-card)',
                        color: formData.symptoms[sym] ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        textTransform: 'capitalize'
                      }}
                    >
                      {sym.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Lifestyle */}
            {currentStep === 3 && (
              <div className="grid-2" style={{ gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Exercise Frequency</label>
                  <select value={formData.lifestyle.exercise_frequency} onChange={e => setFormData(p => ({...p, lifestyle: {...p.lifestyle, exercise_frequency: e.target.value}}))} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="never">Never</option>
                    <option value="rarely">Rarely</option>
                    <option value="sometimes">Sometimes</option>
                    <option value="regularly">Regularly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Diet Type</label>
                  <select value={formData.lifestyle.diet_type} onChange={e => setFormData(p => ({...p, lifestyle: {...p.lifestyle, diet_type: e.target.value}}))} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="mixed">Mixed</option>
                    <option value="non-vegetarian">Non-Vegetarian</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Sleep (Hours): {formData.lifestyle.sleep_hours}</label>
                  <input type="range" min="3" max="12" step="0.5" value={formData.lifestyle.sleep_hours} onChange={e => setFormData(p => ({...p, lifestyle: {...p.lifestyle, sleep_hours: Number(e.target.value)}}))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Stress Level</label>
                  <select value={formData.lifestyle.stress_level} onChange={e => setFormData(p => ({...p, lifestyle: {...p.lifestyle, stress_level: e.target.value}}))} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="low">Low 😌</option>
                    <option value="medium">Medium 😐</option>
                    <option value="high">High 😰</option>
                    <option value="severe">Severe 😫</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.lifestyle.smoking} onChange={e => setFormData(p => ({...p, lifestyle: {...p.lifestyle, smoking: e.target.checked}}))} style={{ width: '20px', height: '20px' }} />
                    Do you smoke?
                  </label>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Alcohol Consumption</label>
                  <select value={formData.lifestyle.alcohol} onChange={e => setFormData(p => ({...p, lifestyle: {...p.lifestyle, alcohol: e.target.value}}))} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="never">Never</option>
                    <option value="occasional">Occasional</option>
                    <option value="moderate">Moderate</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="flex-between mt-4" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            className="btn-ghost" 
            onClick={handleBack} 
            disabled={currentStep === 0}
            style={{ opacity: currentStep === 0 ? 0 : 1 }}
          >
            <ChevronLeft size={18} style={{ marginRight: '0.5rem' }} /> Back
          </button>
          
          <button 
            className="btn-primary" 
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? <Activity size={18} className="spin" /> : currentStep === STEPS.length - 1 ? 'Analyze Health Profile' : 'Next Step'}
            {!loading && currentStep < STEPS.length - 1 && <ChevronRight size={18} style={{ marginLeft: '0.5rem' }} />}
          </button>
        </div>
      </div>
    </div>
  );
}
