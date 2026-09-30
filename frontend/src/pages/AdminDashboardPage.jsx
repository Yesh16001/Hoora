import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Shield, FileText, CheckSquare, CheckCircle2, Clock, 
  XCircle, Eye, Check, RefreshCw, Lock, Image as ImageIcon, 
  Sparkles, History, Zap, Settings, Key
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [allClaims, setAllClaims] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, claims, items, audit
  const [loading, setLoading] = useState(true);

  // Gemini API Key Config State
  const [showConfigAi, setShowConfigAi] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  // Evidence Inspection Modal
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // AI Verification State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [verifyingAi, setVerifyingAi] = useState(false);

  const { showToast } = useAuth();

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, itemsRes, claimsRes, auditRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminItems(),
        api.getAdminClaims(),
        api.getAuditLogs()
      ]);
      if (dashRes.success) setDashboard(dashRes);
      if (itemsRes.success) setAllItems(itemsRes.items);
      if (claimsRes.success) setAllClaims(claimsRes.claims);
      if (auditRes.success) setAuditLogs(auditRes.logs);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveAiKey = async (e) => {
    e.preventDefault();
    setSavingKey(true);
    try {
      const res = await api.configAiKey(geminiApiKey);
      if (res.success) {
        showToast(res.message, 'success');
        setShowConfigAi(false);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingKey(false);
    }
  };

  const handleRunAiVerify = async () => {
    if (!selectedClaim) return;
    setVerifyingAi(true);
    try {
      const res = await api.aiVerifyClaim(
        selectedClaim.item_title, 
        selectedClaim.item_description || '', 
        selectedClaim.evidence
      );
      if (res.success) {
        setAiAnalysis(res.analysis);
        showToast('🤖 AI Evidence Verification complete!', 'success');
      }
    } catch (err) {
      showToast('AI verification failed', 'error');
    } finally {
      setVerifyingAi(false);
    }
  };

  const handleUpdateItemStatus = async (itemId, status) => {
    try {
      const res = await api.updateItemStatus(itemId, status);
      if (res.success) {
        showToast(res.message, 'success');
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateClaimStatus = async (claimId, status) => {
    setProcessing(true);
    try {
      const res = await api.updateClaimStatus(claimId, status, adminNotes);
      if (res.success) {
        showToast(res.message, 'success');
        setSelectedClaim(null);
        setAiAnalysis(null);
        setAdminNotes('');
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading Central Admin Recovery Dashboard...</div>;
  }

  const { stats, pending_items, pending_claims } = dashboard || { stats: {} };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Quick Config */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', width: '52px', height: '52px' }}>
            <Shield size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
              Central Admin Recovery Dashboard
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Human-in-the-loop verification • Immutable system audit trail • Gemini AI assistance
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowConfigAi(!showConfigAi)} className="btn btn-secondary btn-sm" style={{ borderColor: '#a855f7', color: '#c084fc' }}>
            <Key size={14} /> Configure Gemini Key
          </button>
          <button onClick={fetchAdminData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>
      </div>

      {/* AI Key Configuration Modal / Drawer */}
      {showConfigAi && (
        <div className="card" style={{ border: '1px solid #a855f7', background: 'rgba(168, 85, 247, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Sparkles size={18} /> Live Google Gemini AI Key Settings
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Paste your Google Gemini API key below to enable real-time generative AI analysis for claim verification and item auto-tagging. (Leave blank to use the built-in offline smart engine).
          </p>
          <form onSubmit={handleSaveAiKey} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="password"
              className="form-control"
              placeholder="AIzaSy..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingKey} style={{ whiteSpace: 'nowrap' }}>
              {savingKey ? 'Saving...' : 'Save AI Key'}
            </button>
          </form>
        </div>
      )}

      {/* Admin Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(79, 70, 229, 0.15)', color: '#818cf8' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.total_reports || 0}</div>
            <div className="stat-lbl">Total Reports</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.pending_reports || 0}</div>
            <div className="stat-lbl">Pending Reports</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.pending_claims || 0}</div>
            <div className="stat-lbl">Claims Awaiting Verification</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.returned_items || 0}</div>
            <div className="stat-lbl">Returned Items</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', pb: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('overview')}
        >
          Verification Priority ({pending_claims?.length || 0} Claims, {pending_items?.length || 0} Reports)
        </button>
        <button
          className={`btn ${activeTab === 'claims' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('claims')}
        >
          All Evidence Claims ({allClaims.length})
        </button>
        <button
          className={`btn ${activeTab === 'items' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('items')}
        >
          All Campus Items ({allItems.length})
        </button>
        <button
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('audit')}
          style={{ borderColor: 'rgba(99, 102, 241, 0.4)' }}
        >
          <History size={14} /> System Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & PENDING QUEUE */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Claims Awaiting Verification */}
          <div className="card">
            <h2 className="card-title" style={{ color: '#fbbf24' }}>
              <span><CheckSquare size={20} style={{ display: 'inline', marginRight: '0.5rem' }} /> Evidence Claims Awaiting Verification ({pending_claims.length})</span>
            </h2>

            {pending_claims.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
                No pending claims awaiting verification.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Claimant</th>
                      <th>Text & Photo Evidence</th>
                      <th>Submitted Date</th>
                      <th>Fast-Path Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending_claims.map((claim) => (
                      <tr key={claim.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ color: '#fff' }}>{claim.item_title}</strong>
                            {claim.is_valuable === 1 && <span className="badge badge-pending"><Lock size={10} /> Sensitive</span>}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {claim.category} • {claim.location}
                          </div>
                        </td>
                        <td>
                          <div>{claim.claimant_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{claim.claimant_email}</div>
                        </td>
                        <td style={{ maxWidth: '280px' }}>
                          <div style={{ 
                            background: 'rgba(255, 255, 255, 0.04)', 
                            border: '1px solid var(--border-color)', 
                            padding: '0.5rem', 
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem'
                          }}>
                            <div>{claim.evidence}</div>
                            {claim.image_proof_url && (
                              <div style={{ marginTop: '0.35rem', color: '#34d399', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <ImageIcon size={12} /> Image Proof Attached
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{claim.created_at.split(' ')[0]}</td>
                        <td>
                          <button
                            onClick={() => { setSelectedClaim(claim); setAiAnalysis(null); }}
                            className="btn btn-primary btn-sm"
                          >
                            <Zap size={14} color="#fbbf24" /> Review Evidence
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Item Reports */}
          <div className="card">
            <h2 className="card-title">
              <span><Clock size={20} style={{ display: 'inline', marginRight: '0.5rem' }} /> Pending Item Reports ({pending_items.length})</span>
            </h2>

            {pending_items.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
                No pending item reports awaiting approval.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Title & Description</th>
                      <th>Category & Location</th>
                      <th>Reporter</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending_items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className={`badge ${item.item_type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
                            {item.item_type}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#fff' }}>{item.title}</strong>
                          {item.is_valuable === 1 && <span className="badge badge-pending" style={{ marginLeft: '0.5rem' }}>High-Value Asset</span>}
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.description}</div>
                        </td>
                        <td>
                          <div>{item.category}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.location} ({item.item_date})</div>
                        </td>
                        <td>
                          <div>{item.reporter_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.reporter_email}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleUpdateItemStatus(item.id, 'APPROVED')}
                              className="btn btn-success btn-sm"
                            >
                              <Check size={14} /> Approve Report
                            </button>
                            <button
                              onClick={() => handleUpdateItemStatus(item.id, 'REJECTED')}
                              className="btn btn-danger btn-sm"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ALL CLAIMS */}
      {activeTab === 'claims' && (
        <div className="card">
          <h2 className="card-title">All Submitted Ownership Claims</h2>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Item Title</th>
                  <th>Claimant</th>
                  <th>Text Evidence</th>
                  <th>Proof Photo</th>
                  <th>Claim Status</th>
                  <th>Admin Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allClaims.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td><strong style={{ color: '#fff' }}>{c.item_title}</strong></td>
                    <td>{c.claimant_name} ({c.claimant_email})</td>
                    <td style={{ maxWidth: '240px', fontSize: '0.85rem' }}>{c.evidence}</td>
                    <td>
                      {c.image_proof_url ? (
                        <a href={c.image_proof_url} target="_blank" rel="noreferrer" style={{ color: 'var(--secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                          View Photo Proof
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        c.status === 'APPROVED' ? 'badge-approved' : 
                        c.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.admin_notes || '—'}</td>
                    <td>
                      <button onClick={() => { setSelectedClaim(c); setAiAnalysis(null); }} className="btn btn-secondary btn-sm">
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ALL ITEMS */}
      {activeTab === 'items' && (
        <div className="card">
          <h2 className="card-title">All Campus Item Reports & Lifecycle Control</h2>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Category & Location</th>
                  <th>Reporter</th>
                  <th>Status</th>
                  <th>Manage Lifecycle</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>
                      <span className={`badge ${item.item_type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
                        {item.item_type}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#fff' }}>{item.title}</strong>
                      {item.is_valuable === 1 && <span className="badge badge-pending" style={{ marginLeft: '0.5rem' }}>High-Value Asset</span>}
                    </td>
                    <td>{item.category} @ {item.location}</td>
                    <td>{item.reporter_name}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>
                      <select
                        className="form-control"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', width: 'auto' }}
                        value={item.status}
                        onChange={(e) => handleUpdateItemStatus(item.id, e.target.value)}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="MATCHED">MATCHED</option>
                        <option value="CLAIMED">CLAIMED</option>
                        <option value="RETURNED">RETURNED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: IMMUTABLE AUDIT TRAIL LOGS */}
      {activeTab === 'audit' && (
        <div className="card">
          <div className="card-title">
            <span>📜 Immutable System Audit Log & Lifecycle History ({auditLogs.length})</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>Every action logged for full accountability</span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action Type</th>
                  <th>Item Ref</th>
                  <th>Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {log.created_at}
                    </td>
                    <td>
                      <strong style={{ color: '#fff' }}>{log.actor_name}</strong>
                      <span className={`role-tag ${log.actor_role}`} style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                        {log.actor_role}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.item_id ? `#${log.item_id}` : '—'}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EVIDENCE INSPECTION & AI VERIFICATION MODAL */}
      {selectedClaim && (
        <div className="modal-backdrop" onClick={() => setSelectedClaim(null)}>
          <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', width: '40px', height: '40px' }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Admin Evidence Inspection</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Claim #{selectedClaim.id} for "{selectedClaim.item_title}"</p>
                </div>
              </div>

              <button
                onClick={handleRunAiVerify}
                disabled={verifyingAi}
                className="btn btn-secondary btn-sm"
                style={{ borderColor: '#a855f7', color: '#c084fc' }}
              >
                <Sparkles size={14} />
                {verifyingAi ? 'AI Inspecting...' : '🤖 Run AI Verification'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CLAIMANT</div>
                <strong style={{ color: '#fff' }}>{selectedClaim.claimant_name}</strong> ({selectedClaim.claimant_email})
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  SUBMITTED IDENTIFYING EVIDENCE
                </div>
                <p style={{ color: '#fff', fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {selectedClaim.evidence}
                </p>

                {selectedClaim.image_proof_url && (
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, marginBottom: '0.5rem' }}>
                      📷 UPLOADED PROOF / RECEIPT IMAGE VERIFICATION:
                    </div>
                    <a href={selectedClaim.image_proof_url} target="_blank" rel="noreferrer">
                      <img src={selectedClaim.image_proof_url} alt="Proof Evidence" style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                    </a>
                  </div>
                )}
              </div>

              {/* AI Verification Assessment Result Card */}
              {aiAnalysis && (
                <div style={{ 
                  background: 'rgba(168, 85, 247, 0.1)', 
                  border: '1px solid rgba(168, 85, 247, 0.3)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '1rem' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', fontWeight: 700, fontSize: '0.9rem' }}>
                      <Sparkles size={16} /> {aiAnalysis.ai_engine || 'AI Verification Assessment'}
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {aiAnalysis.ai_confidence_score}% Confidence
                    </span>
                  </div>
                  <p style={{ color: '#fff', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{aiAnalysis.analysis}</p>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    AI Recommendation: <strong style={{ color: '#c084fc' }}>{aiAnalysis.recommendation}</strong>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Administrator Notes / Remarks</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Verified scratch on inner flap & purchase receipt photo."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => handleUpdateClaimStatus(selectedClaim.id, 'REJECTED')}
                className="btn btn-danger"
                disabled={processing}
              >
                Reject Claim
              </button>
              <button
                type="button"
                onClick={() => handleUpdateClaimStatus(selectedClaim.id, 'APPROVED')}
                className="btn btn-success"
                disabled={processing}
              >
                Approve Ownership & Mark Claimed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
