import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search, PlusCircle, Shield, FileText, CheckSquare, 
  LogOut, LogIn, UserPlus, Compass, LayoutDashboard, CompassIcon 
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="brand">
          <div className="brand-icon">
            <Compass size={22} />
          </div>
          <span>CampusFind</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/browse" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Search size={16} />
            <span>Browse Items</span>
          </NavLink>

          {user && user.role === 'student' && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/report" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <PlusCircle size={16} />
                <span>Report Item</span>
              </NavLink>
              <NavLink to="/my-reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileText size={16} />
                <span>My Reports</span>
              </NavLink>
              <NavLink to="/my-claims" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <CheckSquare size={16} />
                <span>My Claims</span>
              </NavLink>
            </>
          )}

          {user && user.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Shield size={16} />
              <span>Admin Dashboard</span>
            </NavLink>
          )}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <div className="user-badge">
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name}</span>
              <span className={`role-tag ${user.role}`}>{user.role}</span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} />
                <span>Log In</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={15} />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
