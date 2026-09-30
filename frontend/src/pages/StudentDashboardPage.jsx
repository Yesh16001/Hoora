import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, GitCompare, CheckSquare, CheckCircle2, PlusCircle, ArrowRight, MapPin, Calendar } from 'lucide-react';

export const StudentDashboardPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repRes, claimRes] = await Promise.all([
          api.getItems({ my_items: true }),
          api.getMyClaims()
        ]);
        if (repRes.success) setReports(repRes.items);
        if (claimRes.success) setClaims(claimRes.claims);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalReports = reports.length;
  const activeReports = reports.filter(r => r.status === 'APPROVED' || r.status === 'MATCHED').length;
  const pendingClaimsCount = claims.filter(c => c.status === 'PENDING').length;
  const returnedCount = reports.filter(r => r.status === 'RETURNED').length + claims.filter(c => c.item_status === 'RETURNED' || c.status === 'APPROVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
            Welcome, {user?.name}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Campus Item Recovery Dashboard • Manage your lost & found reports
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/report?type=LOST" className="btn btn-danger btn-sm">
            <PlusCircle size={16} /> Report Lost
          </Link>
          <Link to="/report?type=FOUND" className="btn btn-success btn-sm">
            <PlusCircle size={16} /> Report Found
          </Link>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(79, 70, 229, 0.15)', color: '#818cf8' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-val">{totalReports}</div>
            <div className="stat-lbl">Total Reports</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
            <GitCompare size={24} />
          </div>
          <div>
            <div className="stat-val">{activeReports}</div>
            <div className="stat-lbl">Active & Matching</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <div className="stat-val">{pendingClaimsCount}</div>
            <div className="stat-lbl">Pending Claims</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-val">{returnedCount}</div>
            <div className="stat-lbl">Items Recovered</div>
          </div>
        </div>
      </div>

      {/* Recent My Reports */}
      <div className="card">
        <div className="card-title">
          <span>My Recent Reports ({reports.length})</span>
          <Link to="/my-reports" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
            View All Reports →
          </Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading reports...</p>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <p style={{ fontWeight: 600 }}>No item reports submitted yet</p>
            <p style={{ fontSize: '0.85rem' }}>Report a lost or found item to start automated recovery matching.</p>
            <Link to="/report" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
              Create Report
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.slice(0, 4).map((item) => (
              <div key={item.id} style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)', 
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className={`badge ${item.item_type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
                    {item.item_type}
                  </span>
                  <div>
                    <Link to={`/items/${item.id}`} style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                      {item.title}
                    </Link>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      <span><MapPin size={12} style={{ display: 'inline' }} /> {item.location}</span>
                      <span><Calendar size={12} style={{ display: 'inline' }} /> {item.item_date}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <StatusBadge status={item.status} />
                  <Link to={`/matches/${item.id}`} className="btn btn-secondary btn-sm">
                    <GitCompare size={14} /> Smart Matches
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
