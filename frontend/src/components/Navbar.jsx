import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, User, LogOut, ChevronDown, Menu, X, Activity, LayoutDashboard, ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── Scroll Effect ──
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Close mobile menu on route change ──
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/', label: 'Home', icon: null },
    ...(isAuthenticated
      ? [
          { to: '/assess', label: 'Assess', icon: <ClipboardList size={14} /> },
          { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
        ]
      : []),
  ];

  const userInitial = user?.full_name
    ? user.full_name.charAt(0).toUpperCase()
    : user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 'var(--z-sticky)',
          transition: 'all 0.3s ease',
          backgroundColor: scrolled ? 'rgba(10,14,26,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <div className="container">
          <div className="flex-between" style={{ height: 70 }}>
            {/* ── Logo ── */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(20,255,236,0.3)',
                }}
              >
                <Heart size={20} color="#0A0E1A" strokeWidth={2.5} />
              </motion.div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.02em',
                }}
              >
                MediAI
              </span>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="flex items-center gap-2" style={{ display: 'flex' }}>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: isActive(link.to) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    transition: 'color 0.2s ease',
                    textDecoration: 'none',
                  }}
                  className="nav-link-desktop"
                >
                  {link.icon}
                  {link.label}
                  {isActive(link.to) && (
                    <motion.div
                      layoutId="activeNav"
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '60%',
                        height: 2,
                        borderRadius: 2,
                        background: 'var(--gradient-primary)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* ── Right side ── */}
            <div className="flex items-center gap-3" style={{ display: 'flex' }}>
              {isAuthenticated ? (
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDropdownOpen((p) => !p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px 6px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#0A0E1A',
                      }}
                    >
                      {userInitial}
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, maxWidth: 100,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.full_name?.split(' ')[0] || user?.username || 'User'}
                    </span>
                    <ChevronDown size={14} style={{ color: 'var(--text-muted)',
                      transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s ease' }} />
                  </motion.button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          right: 0,
                          minWidth: 200,
                          background: 'rgba(15,22,41,0.98)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          backdropFilter: 'blur(20px)',
                          boxShadow: 'var(--shadow-card)',
                          zIndex: 100,
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                            {user?.full_name || user?.username}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                            {user?.email}
                          </p>
                        </div>

                        <Link to="/dashboard" className="dropdown-item">
                          <LayoutDashboard size={15} />
                          Dashboard
                        </Link>
                        <Link to="/assess" className="dropdown-item">
                          <Activity size={15} />
                          New Assessment
                        </Link>

                        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 4 }}>
                          <button onClick={handleLogout} className="dropdown-item danger" style={{ width: '100%' }}>
                            <LogOut size={15} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center" style={{ gap: 10 }}>
                  <Link to="/login" className="btn btn-ghost btn-sm">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Get Started
                  </Link>
                </div>
              )}

              {/* ── Mobile Menu Toggle ── */}
              <button
                onClick={() => setMobileOpen((p) => !p)}
                style={{
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
                className="mobile-menu-btn"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 70,
              left: 0,
              right: 0,
              background: 'rgba(10,14,26,0.98)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border-color)',
              zIndex: 'calc(var(--z-sticky) - 1)',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    color: isActive(link.to) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    background: isActive(link.to) ? 'rgba(20,255,236,0.06)' : 'transparent',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}

              {!isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  <Link to="/login" className="btn btn-ghost">Login</Link>
                  <Link to="/register" className="btn btn-primary">Get Started</Link>
                </div>
              ) : (
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-error)',
                    background: 'rgba(255,107,107,0.06)',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    fontFamily: 'var(--font-primary)',
                    width: '100%',
                    marginTop: 8,
                  }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .nav-link-desktop { display: none !important; }
        }
        .nav-link-desktop:hover {
          color: var(--text-primary) !important;
          background: rgba(255,255,255,0.04);
        }
      `}</style>
    </>
  );
};

export default Navbar;
