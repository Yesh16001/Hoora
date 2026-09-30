import React from 'react';

export const Footer = () => {
  return (
    <footer className="footer">
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
        <p style={{ fontWeight: 700, color: 'var(--text-main)' }}>CampusFind — "Find it. Verify it. Return it."</p>
        <p style={{ color: 'var(--text-muted)' }}>
          Streamlined College Lost & Found Recovery System • Built for College Hackathon
        </p>
      </div>
    </footer>
  );
};
