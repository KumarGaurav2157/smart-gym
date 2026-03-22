import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Dumbbell, BarChart3, Brain, Users,
  UserCheck, User, TrendingUp, LogOut, Bell,
  CalendarDays, Flame, Moon, Droplets, Trophy,
  CreditCard, Menu, X, ChevronRight
} from 'lucide-react';
import useAuthStore from '../../hooks/useAuthStore';
import toast from 'react-hot-toast';

const memberNav = [
  { to: '/dashboard',       icon: <LayoutDashboard size={18} />, label: 'Dashboard'       },
  { to: '/workouts',        icon: <Dumbbell size={18} />,        label: 'Workouts'         },
  { to: '/calendar',        icon: <CalendarDays size={18} />,    label: 'Calorie Calendar' },
  { to: '/streak',          icon: <Flame size={18} />,           label: 'Streak'           },
  { to: '/weight',          icon: <TrendingUp size={18} />,      label: 'Weight Progress'  },
  { to: '/sleep',           icon: <Moon size={18} />,            label: 'Sleep Tracker'    },
  { to: '/water',           icon: <Droplets size={18} />,        label: 'Water Tracker'    },
  { to: '/leaderboard',     icon: <Trophy size={18} />,          label: 'Leaderboard'      },
  { to: '/recommendations', icon: <Brain size={18} />,           label: 'AI Plan'          },
  { to: '/membership',      icon: <CreditCard size={18} />,      label: 'Membership'       },
  { to: '/trainers',        icon: <UserCheck size={18} />,       label: 'Trainers'         },
  { to: '/profile',         icon: <User size={18} />,            label: 'Profile'          },
];

const adminNav = [
  { to: '/analytics', icon: <BarChart3 size={18} />,  label: 'Analytics' },
  { to: '/members',   icon: <Users size={18} />,       label: 'Members'   },
  { to: '/forecast',  icon: <TrendingUp size={18} />,  label: 'Forecast'  },
];

const trainerNav = [
  { to: '/trainer-dashboard', icon: <UserCheck size={18} />, label: 'My Members' },
];

// Bottom nav items for mobile (most used)
const mobileBottomNav = [
  { to: '/dashboard',   icon: <LayoutDashboard size={20} />, label: 'Home'     },
  { to: '/workouts',    icon: <Dumbbell size={20} />,        label: 'Workout'  },
  { to: '/calendar',    icon: <CalendarDays size={20} />,    label: 'Calendar' },
  { to: '/leaderboard', icon: <Trophy size={20} />,          label: 'Ranks'    },
  { to: '/profile',     icon: <User size={20} />,            label: 'Profile'  },
];

export default function AppShell() {
  const { user, logout }    = useAuthStore();
  const navigate            = useNavigate();
  const location            = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Close sidebar on ESC key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">S</div>
        <span className="sidebar-logo-text">SMART<span>GYM</span></span>
        {/* Close button - mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="mobile-close-btn"
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'none' }}>
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {memberNav.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {icon}<span>{label}</span><ChevronRight size={14} className="nav-arrow" />
          </NavLink>
        ))}

        {user?.role === 'trainer' && (
          <>
            <div className="nav-section-label">Trainer</div>
            {trainerNav.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                {icon}<span>{label}</span><ChevronRight size={14} className="nav-arrow" />
              </NavLink>
            ))}
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <div className="nav-section-label">Admin</div>
            {adminNav.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                {icon}<span>{label}</span><ChevronRight size={14} className="nav-arrow" />
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.full_name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button onClick={handleLogout} title="Logout"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <aside className="sidebar desktop-sidebar">
        <SidebarContent />
      </aside>

      {/* ── Mobile Overlay ────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 998,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Mobile Sidebar (slide-in) ─────────────────────────────────────── */}
      <aside className={`sidebar mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <SidebarContent />
      </aside>

      {/* ── Topbar ────────────────────────────────────────────────────────── */}
      <header className="topbar">
        {/* Hamburger - mobile only */}
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'none', padding: 4 }}>
          <Menu size={22} />
        </button>

        {/* Logo - mobile only */}
        <div className="mobile-logo" style={{ display: 'none', fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.1em' }}>
          SMART<span style={{ color: 'var(--accent)' }}>GYM</span>
        </div>

        {/* Desktop search */}
        <div className="desktop-search" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Smart Gym Platform</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative', padding: 4 }}>
            <Bell size={18} />
            <span style={{ position: 'absolute', top: 0, right: 0, width: 7, height: 7, background: 'var(--accent)', borderRadius: '50%' }} />
          </button>
          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => navigate('/profile')}>
            {initials}
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Navigation ──────────────────────────────────────── */}
      <nav className="mobile-bottom-nav">
        {mobileBottomNav.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
        {/* More button opens sidebar */}
        <button className="bottom-nav-item" onClick={() => setSidebarOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px' }}>
          <Menu size={20} />
          <span style={{ fontSize: '0.6rem' }}>More</span>
        </button>
      </nav>
    </div>
  );
}