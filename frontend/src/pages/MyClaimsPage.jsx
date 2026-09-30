import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CheckSquare, ShieldCheck, Tag, MapPin } from 'lucide-react';

export const MyClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await api.getMyClaims();
        if (res.success) {
          setClaims(res.claims);
        }
      } catch (err) {
        console.error("Failed to fetch my claims", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Evidence Claims</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Track claims you submitted for verifying item ownership.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading claims...</div>
      ) : claims.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🛡️</div>
          <h3>No Active Claims</h3>
          <p>You haven't submitted ownership evidence for any item yet.</p>
          <Link to="/browse" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>Browse Items</Link>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Item Title</th>
                  <th>Submitted Evidence</th>
                  <th>Date Claimed</th>
                  <th>Claim Status</th>
                  <th>Item Lifecycle</th>
                  <th>Admin Notes</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id}>
                    <td>
                      <Link to={`/items/${claim.item_id}`} style={{ fontWeight: 700, color: '#fff' }}>
                        {claim.item_title}
                      </Link>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {claim.category} • {claim.location}
                      </div>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.03)', 
                        padding: '0.5rem 0.75rem', 
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-color)'
                      }}>
                        {claim.evidence}
                      </div>
                    </td>
                    <td>{claim.created_at.split(' ')[0]}</td>
                    <td>
                      <span className={`badge ${
                        claim.status === 'APPROVED' ? 'badge-approved' : 
                        claim.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'
                      }`}>
                        {claim.status === 'APPROVED' ? 'CLAIM VERIFIED' : claim.status}
                      </span>
                    </td>
                    <td><StatusBadge status={claim.item_status} /></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {claim.admin_notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
