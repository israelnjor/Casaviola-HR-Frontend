import { useState, useEffect } from 'react';
import { getAllLogins, createStaffLogin, toggleLogin, deleteLogin } from '../services/authService';
import { getAllStaff } from '../services/staffService';
import useWindowSize from '../hooks/useWindowSize';
import { canCreateLogins } from '../utils/roleUtils';
import { useNavigate } from 'react-router-dom';

function ManageLoginsPage() {
  const [logins, setLogins] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ role: 'Customer Service' });
  const { isMobile, isTablet } = useWindowSize();
  const isSmall = isMobile || isTablet;
  const navigate = useNavigate();

  useEffect(() => {
    if (!canCreateLogins()) { navigate('/'); return; }
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      const [loginsRes, staffRes] = await Promise.all([
        getAllLogins(),
        getAllStaff(),
      ]);
      setLogins(loginsRes.data);
      setStaff(staffRes.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createStaffLogin(form);
      setShowModal(false);
      setForm({ role: 'Customer Service' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating login');
    }
  };

  const handleToggle = async (id) => {
    await toggleLogin(id);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this login? The staff member will lose access.')) {
      await deleteLogin(id);
      fetchData();
    }
  };

  const roleColor = (role) => {
    const map = {
      CEO: { bg: '#2d1b4e', color: '#fff' },
      GM: { bg: '#5c3d8f', color: '#fff' },
      Admin: { bg: '#1565c0', color: '#fff' },
      Finance: { bg: '#c9a84c', color: '#fff' },
      'Property Listings': { bg: '#2e7d32', color: '#fff' },
      'Estate Manager': { bg: '#f57f17', color: '#fff' },
      'Customer Service': { bg: '#888', color: '#fff' },
    };
    return map[role] || { bg: '#888', color: '#fff' };
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={{ ...styles.page, padding: isSmall ? '20px 16px' : '40px' }}>

      {/* Header */}
      <div style={{ ...styles.header, flexDirection: isSmall ? 'column' : 'row', gap: isSmall ? 12 : 0 }}>
        <div>
          <h1 style={{ ...styles.title, fontSize: isSmall ? 22 : 26 }}>Manage Logins</h1>
          <p style={styles.subtitle}>{logins.length} accounts · {logins.filter(l => l.isActive).length} active</p>
        </div>
        <button style={{ ...styles.addBtn, width: isSmall ? '100%' : 'auto' }} onClick={() => setShowModal(true)}>
          + Create Login
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Accounts', value: logins.length, color: '#5c3d8f', bg: '#ede8f5' },
          { label: 'Active', value: logins.filter(l => l.isActive).length, color: '#2e7d32', bg: '#e8f5e9' },
          { label: 'Inactive', value: logins.filter(l => !l.isActive).length, color: '#c62828', bg: '#fce4ec' },
          { label: 'Staff Linked', value: logins.filter(l => l.staffProfile).length, color: '#f57f17', bg: '#fff8e1' },
        ].map((s, i) => (
          <div key={i} style={{ ...styles.statCard, background: s.bg, borderColor: s.color + '33' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Logins List */}
      {isSmall ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {logins.map(l => {
            const rc = roleColor(l.role);
            return (
              <div key={l._id} style={styles.mobileCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={styles.avatar}>{getInitials(l.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.name}>{l.name}</div>
                    <div style={styles.subRow}>{l.email}</div>
                  </div>
                  <span style={{ ...styles.rolePill, background: rc.bg, color: rc.color }}>{l.role}</span>
                </div>
                {l.staffProfile && (
                  <div style={styles.mobileCardRow}>
                    <span style={styles.mobileCardLabel}>Linked to</span>
                    <span style={styles.mobileCardValue}>{l.staffProfile.fullName}</span>
                  </div>
                )}
                <div style={styles.mobileCardRow}>
                  <span style={styles.mobileCardLabel}>Status</span>
                  <span style={{ color: l.isActive ? '#2e7d32' : '#c62828', fontWeight: 600, fontSize: 13 }}>
                    {l.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button style={{ ...styles.toggleBtn, flex: 1, background: l.isActive ? '#fff8e1' : '#e8f5e9', color: l.isActive ? '#f57f17' : '#2e7d32' }} onClick={() => handleToggle(l._id)}>
                    {l.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button style={{ ...styles.removeBtn, flex: 1 }} onClick={() => handleDelete(l._id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Account', 'Role', 'Linked Staff', 'Created', 'Status', 'Actions'].map(col => (
                  <th key={col} style={styles.th}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logins.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                    No logins yet — create one above
                  </td>
                </tr>
              ) : (
                logins.map((l, i) => {
                  const rc = roleColor(l.role);
                  return (
                    <tr key={l._id} style={{ background: i % 2 === 0 ? '#fff' : '#faf8ff' }}>
                      <td style={styles.td}>
                        <div style={styles.employeeCell}>
                          <div style={styles.avatar}>{getInitials(l.name)}</div>
                          <div>
                            <div style={styles.name}>{l.name}</div>
                            <div style={styles.subRow}>{l.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.rolePill, background: rc.bg, color: rc.color }}>{l.role}</span>
                      </td>
                      <td style={styles.td}>
                        {l.staffProfile ? (
                          <div>
                            <div style={styles.name}>{l.staffProfile.fullName}</div>
                            <div style={styles.subRow}>{l.staffProfile.department}</div>
                          </div>
                        ) : <span style={{ color: '#ccc' }}>Not linked</span>}
                      </td>
                      <td style={{ ...styles.td, color: '#aaa', fontSize: 13 }}>
                        {new Date(l.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: l.isActive ? '#e8f5e9' : '#fce4ec',
                          color: l.isActive ? '#2e7d32' : '#c62828',
                        }}>{l.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            style={{ ...styles.toggleBtn, background: l.isActive ? '#fff8e1' : '#e8f5e9', color: l.isActive ? '#f57f17' : '#2e7d32' }}
                            onClick={() => handleToggle(l._id)}
                          >
                            {l.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button style={styles.removeBtn} onClick={() => handleDelete(l._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Login Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, padding: isSmall ? 20 : 32 }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create Staff Login</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Link to Staff Profile (optional)</label>
              <select style={styles.input} value={form.staffProfile || ''} onChange={e => {
                const selected = staff.find(s => s._id === e.target.value);
                setForm({ ...form, staffProfile: e.target.value, name: selected?.fullName || form.name, email: selected?.email || form.email });
              }}>
                <option value=''>Select staff member...</option>
                {staff.map(s => <option key={s._id} value={s._id}>{s.fullName} — {s.department}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={styles.formLabel}>Full Name</label>
                <input style={styles.input} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Email</label>
                <input type='email' style={styles.input} value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Password</label>
                <input type='password' style={styles.input} value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder='Set a password' />
              </div>
              <div>
                <label style={styles.formLabel}>Role</label>
                <select style={styles.input} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {['CEO', 'GM', 'Admin', 'Finance', 'Property Listings', 'Estate Manager', 'Customer Service'].map(r => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ background: '#ede8f5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#5c3d8f' }}>
              ℹ️ Share the email and password with the staff member so they can log in.
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleCreate}>Create Login</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f0eb' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#5c3d8f' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  subtitle: { color: '#999', marginTop: 4, fontSize: 13 },
  addBtn: { background: '#5c3d8f', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  statCard: { padding: '16px', borderRadius: 12, border: '1px solid', textAlign: 'center' },
  mobileCard: { background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #ede8f5', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  mobileCardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  mobileCardLabel: { fontSize: 12, color: '#aaa', fontWeight: 500 },
  mobileCardValue: { fontSize: 13, color: '#2d1b4e', fontWeight: 500 },
  tableWrap: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #ede8f5' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 20px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', borderBottom: '1px solid #f0eaf8', background: '#faf8ff' },
  td: { padding: '16px 20px', borderBottom: '1px solid #f5f0fa', verticalAlign: 'middle' },
  employeeCell: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: '50%', background: '#ede8f5', color: '#5c3d8f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, fontFamily: 'Georgia, serif', flexShrink: 0 },
  name: { fontSize: 14, fontWeight: 600, color: '#2d1b4e' },
  subRow: { fontSize: 12, color: '#aaa', marginTop: 3 },
  rolePill: { padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  toggleBtn: { padding: '6px 14px', borderRadius: 7, border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  removeBtn: { padding: '6px 14px', borderRadius: 7, border: 'none', background: '#fce4ec', color: '#c62828', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' },
  formLabel: { display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0d8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', color: '#888', fontWeight: 600, cursor: 'pointer' },
  saveBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#5c3d8f', color: '#fff', fontWeight: 600, cursor: 'pointer' },
};

export default ManageLoginsPage;