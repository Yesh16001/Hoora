import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { GitCompare, CheckCircle2, ArrowLeft, Tag, MapPin, Calendar, HelpCircle, ArrowRight } from 'lucide-react';

export const PotentialMatchesPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await api.getItemMatches(id);
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to calculate smart matches", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Running Explainable Matching Engine...</div>;
  }

  if (!data) {
    return (
      <div className="card empty-state">
        <h2>Unable to load matches</h2>
        <Link to="/browse" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Browse</Link>
      </div>
    );
  }

  const { target_item, matches } = data;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <Link to={`/items/${target_item.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Item Details
        </Link>
      </div>

      {/* Header Banner */}
      <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="stat-icon" style={{ width: '48px', height: '48px' }}>
            <GitCompare size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className={`badge ${target_item.item_type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
                TARGET {target_item.item_type}
              </span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{target_item.title}</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Comparing against opposite-type reports across category, location, date, and keyword similarity.
            </p>
          </div>
        </div>
      </div>

      {/* Matching Algorithm Explanation Card */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.02)', 
        border: '1px solid var(--border-color)', 
        borderRadius: 'var(--radius-md)', 
        padding: '1rem 1.25rem',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <HelpCircle size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-main)' }}>Explainable Rule-Based Matching Engine:</strong> Scores are computed transparently (Category: 30 pts, Location: 25 pts, Date Proximity: 20 pts, Keyword Similarity: 25 pts). Items with score ≥ 45% are shown below with detailed justification.
        </div>
      </div>

      {/* Match Results List */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
          Potential Matches Found ({matches.length})
        </h2>

        {matches.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon">🧩</div>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>No Strong Matches Discovered Yet</h3>
            <p style={{ fontSize: '0.9rem' }}>
              The matching engine checked candidate items, but none exceeded the similarity threshold for this item.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
              As new reports are submitted, potential matches will automatically update.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {matches.map(({ item, match_score, breakdown, reasons }) => (
              <div key={item.id} className="match-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <span className={`badge ${item.item_type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
                        {item.item_type} REPORT
                      </span>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{item.title}</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span><Tag size={12} style={{ display: 'inline' }} /> {item.category}</span>
                      <span><MapPin size={12} style={{ display: 'inline' }} /> {item.location}</span>
                      <span><Calendar size={12} style={{ display: 'inline' }} /> {item.item_date}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {match_score}% Match Score
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="score-progress-bar">
                  <div className="score-progress-fill" style={{ width: `${match_score}%` }}></div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {item.description}
                </p>

                {/* EXPLAINABLE WHY THIS MATCHES SECTION */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Why this matches:
                  </div>

                  <div className="reasons-list">
                    {reasons.map((reason, idx) => (
                      <div key={idx} className="reason-item">
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.25rem' }}>
                  <Link to={`/items/${item.id}`} className="btn btn-primary btn-sm">
                    View Candidate & Claim <ArrowRight size={14} />
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
