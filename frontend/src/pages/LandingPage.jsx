import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, GitCompare, ArrowRight, FilePlus, CheckCircle2 } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      {/* Hero Section */}
      <section style={{ 
        textAlign: 'center', 
        padding: '3rem 1rem', 
        background: 'radial-gradient(circle at center, rgba(79, 70, 229, 0.15) 0%, transparent 70%)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <span className="badge badge-approved" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', marginBottom: '1.25rem' }}>
          🎓 Official Campus Recovery Platform
        </span>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 800, 
          fontFamily: "'Space Grotesk', sans-serif",
          lineHeight: 1.2,
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Find it. Verify it. Return it.
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: 'var(--text-muted)', 
          maxWidth: '680px', 
          margin: '0 auto 2rem auto' 
        }}>
          CampusFind is a complete campus item-recovery workflow with explainable rule-based matching, evidence verification, and controlled item lifecycle tracking.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/browse" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            <Search size={18} />
            <span>Browse Active Items</span>
          </Link>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            <span>Demo Login</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Item Recovery Lifecycle Section */}
      <section className="card">
        <h2 className="card-title" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
          The Campus Item Recovery Workflow
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1rem', 
          textAlign: 'center' 
        }}>
          {[
            { step: '1. REPORT', desc: 'Submit Lost or Found details with category & location', color: '#38bdf8' },
            { step: '2. MATCH', desc: 'Explainable Rule-Based Engine calculates match score', color: '#818cf8' },
            { step: '3. CLAIM', desc: 'Claimant submits unique identifying evidence', color: '#a78bfa' },
            { step: '4. VERIFY', desc: 'Campus Admin inspects evidence & approves claim', color: '#fbbf24' },
            { step: '5. RETURN', desc: 'Item safely handed back & marked Returned', color: '#34d399' }
          ].map((item, idx) => (
            <div key={idx} style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1.25rem 1rem'
            }}>
              <div style={{ fontWeight: 800, color: item.color, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {item.step}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Differentiating Features Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <div className="stat-icon" style={{ marginBottom: '1rem' }}>
            <GitCompare size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Explainable Smart Matching</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Our transparent engine scores matches across Category, Campus Location, Date Proximity, and Keyword Tokens — with step-by-step reasons.
          </p>
        </div>

        <div className="card">
          <div className="stat-icon" style={{ marginBottom: '1rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <ShieldCheck size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Evidence-Based Claiming</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Prevents false claims. Students must submit private identifying details (scratch marks, contents, model numbers) for admin verification.
          </p>
        </div>

        <div className="card">
          <div className="stat-icon" style={{ marginBottom: '1rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Controlled Item Lifecycle</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Strict state machine transitions: PENDING → APPROVED → MATCHED → CLAIMED → RETURNED. Eliminates manual confusion.
          </p>
        </div>
      </section>
    </div>
  );
};
