import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Dumbbell, BarChart3, Brain, Users,
  UserCheck, User, TrendingUp, LogOut, Bell, Search,
  CalendarDays, Flame, Moon, Droplets, Trophy, CreditCard
} from 'lucide-react';
import useAuthStore from '../../hooks/useAuthStore';
import toast from 'react-hot-toast';

const memberNav = [
  { to: '/dashboard',       icon: <LayoutDashboard size={16} />, label: 'Dashboard'        },
  { to: '/workouts',        icon: <Dumbbell size={16} />,        label: 'Workouts'          },
  { to: '/calendar',        icon: <CalendarDays size={16} />,    label: 'Calorie Calendar'  },
  { to: '/streak',          icon: <Flame size={16} />,           label: 'Streak'            },
  { to: '/weight',          icon: <TrendingUp size={16} />,      label: 'Weight Progress'   },
  { to: '/sleep',           icon: <Moon size={16} />,            label: 'Sleep Tracker'     },
  { to: '/water',           icon: <Droplets size={16} />,        label: 'Water Tracker'     },
  { to: '/leaderboard',     icon: <Trophy size={16} />,          label: 'Leaderboard'       },
  { to: '/recommendations', icon: <Brain size={16} />,           label: 'AI Plan'           },
  { to: '/membership',      icon: <CreditCard size={16} />,      label: 'Membership'        },
  { to: '/trainers',        icon: <UserCheck size={16} />,       label: 'Trainers'          },
  { to: '/profile',         icon: <User size={16} />,            label: 'Profile'           },
];

const adminNav = [
  { to: '/analytics', icon: <BarChart3 size={16} />,  label: 'Analytics' },
  { to: '/members',   icon: <Users size={16} />,       label: 'Members'   },
  { to: '/forecast',  icon: <TrendingUp size={16} />,  label: 'Forecast'  },
];

const trainerNav = [
  { to: '/trainer-dashboard', icon: <UserCheck size={16} />, label: 'My Members' },
];

export default function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">S</div>
          <span className="sidebar-logo-text">SMART<span>GYM</span></span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {memberNav.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              {icon}{label}
            </NavLink>
          ))}

          {user?.role === 'trainer' && (
            <>
              <div className="nav-section-label">Trainer</div>
              {trainerNav.map(({ to, icon, label }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                  {icon}{label}
                </NavLink>
              ))}
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="nav-section-label">Admin</div>
              {adminNav.map(({ to, icon, label }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                  {icon}{label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.full_name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button onClick={handleLogout} title="Logout"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Search size={16} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Search members, workouts…</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative' }}>
            <Bell size={18} />
            <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%' }} />
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}