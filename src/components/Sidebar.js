import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useWindowSize from '../hooks/useWindowSize';
import { getRole, canManageStaff, canViewPayroll, canManageAttendance } from '../utils/roleUtils';

function Sidebar() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();
  const [isOpen, setIsOpen] = useState(false);
  const admin = JSON.parse(localStorage.getItem('casaviola_admin') || '{}');
  const role = getRole();

  const handleLogout = () => {
    localStorage.removeItem('casaviola_token');
    localStorage.removeItem('casaviola_admin');
    navigate('/login');
  };

  const isCollapsed = isMobile || isTablet;

  const allLinks = [
    { path: '/', label: 'Dashboard', icon: '⬡', show: true },
    { path: '/staff', label: 'Staff Directory', icon: '◈', show: true },
    { path: '/attendance', label: 'Attendance', icon: '◷', show: true },
    { path: '/tasks', label: 'Tasks', icon: '◉', show: true },
    { path: '/payroll', label: 'Payroll', icon: '◎', show: canViewPayroll() },
    { path: '/performance', label: 'Performance', icon: '◆', show: true },
    { path: '/inventory', label: 'Inventory', icon: '▣', show: true },
    { path: '/messages', label: 'Messages', icon: '◈', show: true },
    { path: '/logins', label: 'Manage Logins', icon: '🔐', show: canManageStaff() },
  ];

  const links = allLinks.filter(l => l.show);

  return (
    <>
      {/* Hamburger Button */}
      {isCollapsed && (
        <button onClick={() => setIsOpen(!isOpen)} style={styles.hamburger}>
          {isOpen ? '✕' : '☰'}
        </button>
      )}

      {/* Overlay */}
      {isCollapsed && isOpen && (
        <div style={styles.overlay} onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        transform: isCollapsed ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        transition: 'transform 0.3s ease',
        zIndex: isCollapsed ? 200 : 100,
      }}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>CV</div>
          <div>
            <div style={styles.logoText}>CasaViola</div>
            <div style={styles.logoSub}>Staff Portal</div>
          </div>
        </div>

        {/* Role Badge */}
        <div style={styles.roleBadge}>
          <span style={styles.roleText}>{role}</span>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {links.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              onClick={() => isCollapsed && setIsOpen(false)}
              style={({ isActive }) => ({
                ...styles.link,
                background: isActive ? '#ede8f5' : 'transparent',
                border: isActive ? `1px solid #5c3d8f33` : '1px solid transparent',
                color: isActive ? '#5c3d8f' : '#666',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              <span style={styles.icon}>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={styles.bottom}>
          <div style={styles.adminInfo}>
            <div style={styles.adminAvatar}>
              {admin.name?.charAt(0) || 'A'}
            </div>
            <div>
              <div style={styles.adminName}>{admin.name || 'Admin'}</div>
              <div style={styles.adminRole}>{admin.email || ''}</div>
            </div>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

const styles = {
  hamburger: { position: 'fixed', top: 16, left: 16, zIndex: 300, background: '#2d1b4e', color: '#fff', border: 'none', borderRadius: 8, width: 40, height: 40, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199 },
  sidebar: { width: 230, minHeight: '100vh', background: '#fff', borderRight: '1px solid #ede8f5', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0 },
  logo: { display: 'flex', alignItems: 'center', gap: 12, padding: '24px 20px 16px', borderBottom: '1px solid #ede8f5' },
  logoIcon: { width: 40, height: 40, borderRadius: 10, background: '#2d1b4e', color: '#c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, fontFamily: 'Georgia, serif' },
  logoText: { fontWeight: 700, fontSize: 16, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  logoSub: { fontSize: 11, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' },
  roleBadge: { padding: '8px 20px', borderBottom: '1px solid #ede8f5', background: '#faf8ff' },
  roleText: { fontSize: 11, fontWeight: 700, color: '#5c3d8f', textTransform: 'uppercase', letterSpacing: '0.08em' },
  nav: { flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' },
  link: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 8, fontSize: 14, textDecoration: 'none', transition: 'all 0.15s' },
  icon: { fontSize: 16 },
  bottom: { padding: '16px 20px', borderTop: '1px solid #ede8f5' },
  adminInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  adminAvatar: { width: 34, height: 34, borderRadius: '50%', background: '#ede8f5', color: '#5c3d8f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  adminName: { fontSize: 13, fontWeight: 600, color: '#2d1b4e' },
  adminRole: { fontSize: 11, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 },
  logoutBtn: { width: '100%', padding: '9px', background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
};

export default Sidebar;