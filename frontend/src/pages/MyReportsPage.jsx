import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, GitCompare, PlusCircle, MapPin, Calendar } from 'lucide-react';

export const MyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyReports = async () => {
      try {
        const res = await api.getItems({ my_items: true });
        if (res.success) {
          setReports(res.items);
        }
      } catch (err) {
        console.error("Failed to load my reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyReports();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Reported Items</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Track lost and found items you have reported on campus.
          </p>
        </div>
        <Link to="/report" className="btn btn-primary btn-sm">
          <PlusCircle size={16} /> Submit New Report
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading your reports...</div>
      ) : reports.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📁</div>
          <h3>No Reports Found</h3>
          <p>You haven't submitted any lost or found item reports yet.</p>
          <Link to="/report" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>Report an Item</Link>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title & Description</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`badge ${item.item_type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
                        {item.item_type}
                      </span>
                    </td>
                    <td>
                      <Link to={`/items/${item.id}`} style={{ fontWeight: 700, color: '#fff' }}>
                        {item.title}
                      </Link>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxLines: 1 }}>
                        {item.description.slice(0, 60)}...
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.location}</td>
                    <td>{item.item_date}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>
                      <Link to={`/matches/${item.id}`} className="btn btn-secondary btn-sm">
                        <GitCompare size={14} /> Smart Matches
                      </Link>
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
