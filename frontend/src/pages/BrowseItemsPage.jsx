import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Search, Filter, MapPin, Calendar, Tag, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  'Electronics', 'Accessories', 'Documents/ID Cards', 
  'Books/Stationery', 'Clothing', 'Keys', 'Bags', 'Other'
];

const LOCATIONS = [
  'Library', 'Canteen', 'Computer Lab', 'Classroom', 
  'Auditorium', 'Sports Ground', 'Hostel', 'Parking', 
  'Administrative Block', 'Other'
];

export const BrowseItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await api.getItems({ search, type, category, location, status });
      if (data.success) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [type, category, location, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const clearFilters = () => {
    setSearch('');
    setType('');
    setCategory('');
    setLocation('');
    setStatus('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
          Browse Active Campus Items
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Discover and search lost & found reports registered across campus.
        </p>
      </div>

      {/* Search & Multi-Filter Control Panel */}
      <div className="card">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Top Search Bar */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search keywords (e.g. wallet, MacBook, calculator, blue Nike)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>

          {/* Filter Dropdowns Row */}
          <div className="form-row">
            <div>
              <label className="form-label">Item Type</label>
              <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All Types (Lost & Found)</option>
                <option value="LOST">LOST Items Only</option>
                <option value="FOUND">FOUND Items Only</option>
              </select>
            </div>

            <div>
              <label className="form-label">Category</label>
              <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Campus Location</label>
              <select className="form-control" value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">All Locations</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Lifecycle Status</label>
              <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="APPROVED">Active (Approved)</option>
                <option value="MATCHED">Matched</option>
                <option value="CLAIMED">Claim Verification</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>
          </div>

          {(type || category || location || status || search) && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={clearFilters} className="btn btn-secondary btn-sm">
                Clear Filters
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Items Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading campus items...
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🔍</div>
          <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>No Matching Items Found</h3>
          <p>Try adjusting your search keywords or resetting filters.</p>
          <button onClick={clearFilters} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-img-wrap">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="item-img" />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-subtle)'
                  }}>
                    No Image Provided
                  </div>
                )}
                <span className={`item-type-badge ${item.item_type}`}>
                  {item.item_type}
                </span>
              </div>

              <div className="item-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 className="item-card-title">{item.title}</h3>
                  <StatusBadge status={item.status} />
                </div>

                <p className="item-card-desc">{item.description}</p>

                <div className="item-meta">
                  <span className="meta-item"><Tag size={13} /> {item.category}</span>
                  <span className="meta-item"><MapPin size={13} /> {item.location}</span>
                  <span className="meta-item"><Calendar size={13} /> {item.item_date}</span>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
                  <Link to={`/items/${item.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    View Item & Claims <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
