import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { 
  GitCompare, ShieldCheck, MapPin, Calendar, Tag, 
  User, Phone, ArrowLeft, Lock, Upload, Info
} from 'lucide-react';

export const ItemDetailsPage = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Claim modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [imageProofUrl, setImageProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const fetchItemDetail = async () => {
    try {
      const data = await api.getItemDetail(id);
      if (data.success) {
        setItem(data.item);
      }
    } catch (err) {
      console.error("Failed to fetch item detail", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemDetail();
  }, [id]);

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingProof(true);
    try {
      const res = await api.uploadFile(file);
      if (res.success) {
        setImageProofUrl(res.url);
        showToast('Proof photo attached successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!evidence.trim()) {
      showToast('Please provide identifying evidence', 'error');
      return;
    }

    setClaiming(true);
    try {
      const res = await api.submitClaim(item.id, evidence.trim(), imageProofUrl.trim());
      if (res.success) {
        showToast(res.message, 'success');
        setShowClaimModal(false);
        setEvidence('');
        setImageProofUrl('');
        fetchItemDetail();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading item details...</div>;
  }

  if (!item) {
    return (
      <div className="card empty-state">
        <h2>Item Report Not Found</h2>
        <p>The requested report does not exist or has been removed.</p>
        <Link to="/browse" className="btn btn-primary" style={{ marginTop: '1rem' }}>Return to Browse</Link>
      </div>
    );
  }

  const isOwner = user && user.id === item.reported_by;
  // Allow claim if user is logged in student and item is active/matched
  const canClaim = user && user.role === 'student' && !isOwner && item.status !== 'CLAIMED' && item.status !== 'RETURNED';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <Link to="/browse" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Browse
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {/* Left Column: Image & Actions */}
          <div>
            <div className="item-img-wrap" style={{ height: '260px', borderRadius: 'var(--radius-md)' }}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="item-img" />
              ) : (
                <div style={{ 
                  width: '100%', height: '100%', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-subtle)' 
                }}>
                  No Photo Attached
                </div>
              )}
              <span className={`item-type-badge ${item.item_type}`}>
                {item.item_type} REPORT
              </span>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to={`/matches/${item.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <GitCompare size={18} /> Run Explainable Smart Match
              </Link>

              {/* CLAIM BUTTON */}
              {canClaim ? (
                <button onClick={() => setShowClaimModal(true)} className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }}>
                  <ShieldCheck size={18} /> Claim This Item with Evidence
                </button>
              ) : isOwner ? (
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.04)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '0.75rem', 
                  fontSize: '0.85rem', 
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <Info size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
                  You reported this item report. Use "Smart Match" above to discover candidates.
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Column: Key Details & Metadata */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{item.title}</h1>
                {item.is_valuable === 1 && (
                  <span className="badge badge-pending" style={{ marginTop: '0.35rem' }}>
                    <Lock size={12} /> High-Value Protected Asset
                  </span>
                )}
              </div>
              <StatusBadge status={item.status} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              <span className="meta-item"><Tag size={14} /> Category: <strong>{item.category}</strong></span>
              <span className="meta-item"><MapPin size={14} /> Location: <strong>{item.location}</strong></span>
              <span className="meta-item"><Calendar size={14} /> Date: <strong>{item.item_date}</strong></span>
            </div>

            <div style={{ 
              background: item.is_masked ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.03)', 
              border: `1px solid ${item.is_masked ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}`, 
              borderRadius: 'var(--radius-md)', 
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ fontSize: '0.95rem', color: item.is_masked ? '#fbbf24' : 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Description
              </h3>
              <p style={{ color: '#fff', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{item.description}</p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.85rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Reporter Information</h4>
              <p style={{ color: '#fff', fontWeight: 600 }}><User size={14} style={{ display: 'inline' }} /> {item.reporter_name}</p>
              {item.contact_info && (
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}><Phone size={14} style={{ display: 'inline' }} /> Contact: {item.contact_info}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EVIDENCE-BASED CLAIM MODAL */}
      {showClaimModal && (
        <div className="modal-backdrop" onClick={() => setShowClaimModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', width: '40px', height: '40px' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Evidence-Based Claim Submission</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Item: {item.title}</p>
              </div>
            </div>

            <div style={{ 
              background: 'rgba(99, 102, 241, 0.1)', 
              border: '1px solid rgba(99, 102, 241, 0.2)', 
              borderRadius: 'var(--radius-md)', 
              padding: '0.85rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: '#a5b4fc',
              display: 'flex',
              gap: '0.5rem'
            }}>
              <Lock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Security Notice:</strong> Your evidence and proof photos are kept strictly confidential and only visible to authorized Campus Administrators for verification.
              </div>
            </div>

            <form onSubmit={handleClaimSubmit}>
              <div className="form-group">
                <label className="form-label">
                  Identifying Evidence & Specific Ownership Details *
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Provide details that only the true owner would know:
• Unique scratches, markings, or engravings
• Color of inner lining or case details
• Contents inside (ID card name, specific cash denomination, wallpaper image)
• Serial / Model numbers"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  required
                />
              </div>

              {/* Photo Proof Upload */}
              <div className="form-group">
                <label className="form-label">Attach Proof Photo / Receipt / Purchase Invoice (Optional)</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Photo proof URL or upload file..."
                    value={imageProofUrl}
                    onChange={(e) => setImageProofUrl(e.target.value)}
                  />
                  <label className="btn btn-secondary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <Upload size={16} />
                    {uploadingProof ? 'Uploading...' : 'Upload Proof'}
                    <input type="file" accept="image/*" onChange={handleProofUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                {imageProofUrl && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={imageProofUrl} alt="Proof" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }} />
                    <span style={{ fontSize: '0.8rem', color: '#34d399' }}>✓ Proof image attached for admin verification</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowClaimModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={claiming || uploadingProof}>
                  {claiming ? 'Submitting Evidence...' : 'Submit Claim for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
