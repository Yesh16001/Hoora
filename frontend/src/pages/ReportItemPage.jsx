import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FilePlus, AlertCircle, Upload, Sparkles, Lock } from 'lucide-react';

const CATEGORIES = [
  'Electronics', 'Accessories', 'Documents/ID Cards', 
  'Books/Stationery', 'Clothing', 'Keys', 'Bags', 'Other'
];

const LOCATIONS = [
  'Library', 'Canteen', 'Computer Lab', 'Classroom', 
  'Auditorium', 'Sports Ground', 'Hostel', 'Parking', 
  'Administrative Block', 'Other'
];

export const ReportItemPage = () => {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') || 'LOST';

  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState(defaultType);
  const [category, setCategory] = useState('Accessories');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Library');
  const [itemDate, setItemDate] = useState(new Date().toISOString().split('T')[0]);
  const [contactInfo, setContactInfo] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isValuable, setIsValuable] = useState(false);

  const [aiTagging, setAiTagging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { showToast } = useAuth();
  const navigate = useNavigate();

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (/gold|diamond|cash|jewelry|chain|necklace|rolex|rupee|dollar/i.test(val)) {
      setIsValuable(true);
    }
  };

  const handleRunAiAutoTag = async () => {
    if (!title && !description) {
      showToast('Enter a title or description first for AI tagging', 'info');
      return;
    }
    setAiTagging(true);
    try {
      const res = await api.aiAutoTag(title, description);
      if (res.success) {
        const d = res.data;
        if (d.category) setCategory(d.category);
        if (d.is_valuable) setIsValuable(true);
        if (d.refined_title) setTitle(d.refined_title);
        showToast('✨ AI successfully categorized and analyzed item!', 'success');
      }
    } catch (err) {
      showToast('AI Auto-tagging failed', 'error');
    } finally {
      setAiTagging(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      if (res.success) {
        setImageUrl(res.url);
        showToast('Photo uploaded successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation checks
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters long.');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long to help matching.');
      return;
    }

    if (!category || !itemType || !location || !itemDate) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createItem({
        title: title.trim(),
        item_type: itemType,
        category,
        description: description.trim(),
        location,
        item_date: itemDate,
        contact_info: contactInfo.trim(),
        image_url: imageUrl.trim(),
        is_valuable: isValuable ? 1 : 0
      });

      if (res.success) {
        showToast(res.message, 'success');
        navigate(`/matches/${res.item_id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit report');
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-icon">
              <FilePlus size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Report Campus Item</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Submit accurate details to enable explainable rule-based matching.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunAiAutoTag}
            disabled={aiTagging}
            className="btn btn-secondary btn-sm"
            style={{ borderColor: '#a855f7', color: '#c084fc' }}
          >
            <Sparkles size={14} />
            {aiTagging ? 'AI Analyzing...' : '✨ AI Auto-Tag & Detect'}
          </button>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            color: '#f87171',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Report Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button
                type="button"
                className={`btn ${itemType === 'LOST' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setItemType('LOST')}
                style={{ justifyContent: 'center', padding: '0.75rem' }}
              >
                I LOST an Item
              </button>
              <button
                type="button"
                className={`btn ${itemType === 'FOUND' ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => setItemType('FOUND')}
                style={{ justifyContent: 'center', padding: '0.75rem' }}
              >
                I FOUND an Item
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Item Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Gold chain necklace, iPhone 15 Pro, Black wallet"
              value={title}
              onChange={handleTitleChange}
              required
            />
          </div>

          {/* High Value Anti-Fraud Safeguard Option */}
          <div style={{ 
            background: isValuable ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)', 
            border: `1px solid ${isValuable ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}`, 
            borderRadius: 'var(--radius-md)', 
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isValuable}
                onChange={(e) => setIsValuable(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
              />
              <div>
                <span style={{ fontWeight: 700, color: isValuable ? '#fbbf24' : 'var(--text-main)', fontSize: '0.9rem' }}>
                  🔒 High-Value / Luxury Confidential Item (Gold, Cash, Luxury Jewelry)
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  If checked, this item is strictly restricted to Admin and Reporter view to prevent fraudulent claims.
                </p>
              </div>
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Campus Location *</label>
              <select className="form-control" value={location} onChange={(e) => setLocation(e.target.value)}>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Date Lost/Found *</label>
            <input
              type="date"
              className="form-control"
              value={itemDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setItemDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description *</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Describe color, brand, condition, unique marks, contents, or precise location details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Information (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Phone number, Telegram handle, or preferred email"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
            />
          </div>

          {/* Image Upload & Photo Verification Section */}
          <div className="form-group">
            <label className="form-label">Item Photo / Verification Image</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Image URL or upload file below..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <label className="btn btn-secondary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                <Upload size={16} />
                {uploading ? 'Uploading...' : 'Upload File'}
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {imageUrl && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={imageUrl} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }} />
                <span style={{ fontSize: '0.8rem', color: '#34d399' }}>✓ Photo attached</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting || uploading} style={{ flex: 1 }}>
              {submitting ? 'Submitting Report...' : 'Submit Report & Run Match Engine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
