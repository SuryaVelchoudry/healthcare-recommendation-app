import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Plus, FileText, ChevronRight, Droplets, ShieldAlert, HeartPulse } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { assessmentAPI } from '../api/api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await assessmentAPI.getHistory();
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const chartData = [...history].reverse().map(item => ({
    date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: item.risk_score
  }));

  const getRiskColor = (level) => {
    if (!level) return 'var(--text-primary)';
    switch(level.toLowerCase()) {
      case 'low': return 'var(--accent-primary)';
      case 'moderate': return 'var(--accent-gold)';
      case 'high': return 'var(--accent-coral)';
      case 'critical': return 'red';
      default: return 'var(--text-primary)';
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>Welcome back, <span className="text-gradient">{user?.full_name?.split(' ')[0] || 'User'}</span></h1>
          <p className="text-secondary" style={{ margin: 0 }}>Here is your latest health summary.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/assess')}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} /> New Assessment
        </button>
      </div>

      <div className="grid-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card p-4">
          <div className="flex-between mb-4">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Droplets size={20} className="text-gradient" /> Blood Group</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{user?.blood_group || 'Unknown'}</div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex-between mb-4">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldAlert size={20} style={{ color: 'var(--accent-coral)' }} /> Allergies</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {user?.known_allergies?.length > 0 
              ? user.known_allergies.map((a, i) => <span key={i} style={{ padding: '0.2rem 0.6rem', backgroundColor: 'rgba(255,107,107,0.1)', color: 'var(--accent-coral)', borderRadius: '1rem', fontSize: '0.8rem' }}>{a}</span>)
              : <span className="text-muted">None reported</span>}
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex-between mb-4">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><HeartPulse size={20} className="text-gradient" /> Conditions</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {user?.existing_conditions?.length > 0 
              ? user.existing_conditions.map((c, i) => <span key={i} style={{ padding: '0.2rem 0.6rem', backgroundColor: 'rgba(20,255,236,0.1)', color: 'var(--accent-primary)', borderRadius: '1rem', fontSize: '0.8rem' }}>{c}</span>)
              : <span className="text-muted">None reported</span>}
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ gap: '1.5rem' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <h2 className="mb-4">Assessment History</h2>
          
          {loading ? (
            <div className="glass-card p-4 flex-center" style={{ minHeight: '200px' }}>
              <Activity size={32} className="spin text-gradient" />
            </div>
          ) : history.length > 0 ? (
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Date</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Top Indication</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Risk Level</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, i) => (
                    <tr key={item.id} style={{ borderBottom: i < history.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <td style={{ padding: '1rem' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.top_prediction}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          backgroundColor: `${getRiskColor(item.risk_level)}20`, 
                          color: getRiskColor(item.risk_level), 
                          borderRadius: '1rem', 
                          fontSize: '0.8rem',
                          textTransform: 'uppercase',
                          fontWeight: 'bold'
                        }}>
                          {item.risk_level}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <Link to={`/results/${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                          View Details <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-card p-4 flex-center" style={{ minHeight: '200px', flexDirection: 'column', gap: '1rem' }}>
              <FileText size={48} className="text-muted" />
              <p className="text-secondary" style={{ margin: 0 }}>No assessments found.</p>
              <button className="btn-primary mt-2" onClick={() => navigate('/assess')}>Start First Assessment</button>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="mb-4">Risk Trend</h2>
          <div className="glass-card p-4" style={{ height: '300px' }}>
            {history.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--accent-primary)" strokeWidth={3} dot={{ fill: 'var(--accent-primary)', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-center" style={{ height: '100%', color: 'var(--text-muted)', textAlign: 'center' }}>
                Not enough data.<br/>Complete at least 2 assessments.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
