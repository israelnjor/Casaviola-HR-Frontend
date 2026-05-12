import { useState, useEffect } from 'react';
import { getAllStaff, createStaff, deleteStaff, updateStaff } from '../services/staffService';
import useWindowSize from '../hooks/useWindowSize';

function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const { isMobile, isTablet } = useWindowSize();
  const isSmall = isMobile || isTablet;


  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const res = await getAllStaff();
      setStaff(res.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createStaff(form);
      setShowModal(false);
      setForm({});
      fetchStaff();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove this staff member?')) {
      await deleteStaff(id);
      fetchStaff();
    }
  };

  const handleEdit = async () => {
    try {
      await updateStaff(editForm._id, editForm);
      setShowEditModal(false);
      setEditForm({});
      fetchStaff();
    } catch (error) {
      console.log(error);
    }
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2);

  const statusStyle = (status) => ({
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: status === 'Active' ? '#e8f5e9' : status === 'On Leave' ? '#fff8e1' : '#fce4ec',
    color: status === 'Active' ? '#2e7d32' : status === 'On Leave' ? '#f57f17' : '#c62828',
  });

  const departments = ['All', ...new Set(staff.map(s => s.department).filter(Boolean))];

  const filteredStaff = staff.filter(s => {
    const matchSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.role?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'All' || s.department === filterDept;
    const matchStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Staff Directory</h1>
          <p style={styles.subtitle}>{staff.length} employees registered</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>
          + Add Staff
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ 
             display: 'grid', 
             gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
             gap: 16, 
             marginBottom: 16 
        }}>
        {[
          { label: 'Total Staff', value: staff.length, color: '#5c3d8f', bg: '#ede8f5' },
          { label: 'Active', value: staff.filter(s => s.status === 'Active').length, color: '#2e7d32', bg: '#e8f5e9' },
          { label: 'On Leave', value: staff.filter(s => s.status === 'On Leave').length, color: '#f57f17', bg: '#fff8e1' },
          { label: 'Terminated', value: staff.filter(s => s.status === 'Terminated').length, color: '#c62828', bg: '#fce4ec' },
        ].map((s, i) => (
          <div key={i} style={{ ...styles.statCard, background: s.bg, borderColor: s.color + '33' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Department Breakdown */}
      <div style={{ 
             display: 'grid', 
             gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', 
             gap: 12, 
             marginBottom: 20 
        }}>
        {['Sales', 'Operations', 'Finance', 'Administration', 'Marketing'].map(dept => (
          <div key={dept} style={styles.deptCard}>
            <div style={styles.deptCount}>{staff.filter(s => s.department === dept).length}</div>
            <div style={styles.deptLabel}>{dept}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div style={{ 
             display: 'flex', 
             flexDirection: isSmall ? 'column' : 'row',
             alignItems: isSmall ? 'flex-start' : 'center', 
             gap: 12, 
             marginBottom: 16,
             flexWrap: 'wrap'
           }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder='Search by name, role or email...'
          style={styles.searchInput}
        />
        <div style={styles.filters}>
          <select style={styles.filterSelect} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
          <select style={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {['All', 'Active', 'On Leave', 'Terminated'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <span style={styles.filterCount}>{filteredStaff.length} results</span>
      </div>

      {/* Table */}
      <div style={{
        ...styles.tableWrap,
        overflowX: 'auto'
      }}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Employee', 'Department', 'Contact', 'Status', 'Actions'].map(col => (
                <th key={col} style={styles.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                  No staff found
                </td>
              </tr>
            ) : (
              filteredStaff.map((s, i) => (
                <tr key={s._id} style={{ background: i % 2 === 0 ? '#fff' : '#faf8ff' }}>
                  <td style={styles.td}>
                    <div style={styles.employeeCell}>
                      <div style={styles.avatar}>{getInitials(s.fullName)}</div>
                      <div>
                        <div style={styles.name}>{s.fullName}</div>
                        <div style={styles.subRow}>
                          {s.role} &nbsp;·&nbsp;
                          <span style={styles.salary}>GH₵ {s.baseSalary?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.deptBadge}>{s.department}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.name}>{s.email}</div>
                    <div style={styles.subRow}>{s.phone}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={statusStyle(s.status)}>{s.status}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button style={styles.editBtn} onClick={() => { setEditForm(s); setShowEditModal(true); }}>Edit</button>
                      <button style={styles.removeBtn} onClick={() => handleDelete(s._id)}>Remove</button>
                    </div>
                    <button style={styles.viewBtn} onClick={() => setSelectedStaff(s)}>
                      View Full Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Side Drawer */}
      {selectedStaff && (
        <div style={styles.drawerOverlay} onClick={() => setSelectedStaff(null)}>
          <div style={styles.drawer} onClick={e => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <div style={styles.drawerAvatar}>{getInitials(selectedStaff.fullName)}</div>
              <div>
                <div style={styles.drawerName}>{selectedStaff.fullName}</div>
                <div style={styles.drawerRole}>{selectedStaff.role}</div>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedStaff(null)}>✕</button>
            </div>
            <div style={styles.drawerDivider} />
            <div style={styles.drawerSection}>
              <div style={styles.sectionTitle}>Personal Information</div>
              {[
                ['Email', selectedStaff.email],
                ['Phone', selectedStaff.phone],
                ['Date of Birth', selectedStaff.dateOfBirth?.slice(0, 10) || '—'],
                ['Address', selectedStaff.address || '—'],
              ].map(([label, value]) => (
                <div key={label} style={styles.drawerRow}>
                  <span style={styles.drawerLabel}>{label}</span>
                  <span style={styles.drawerValue}>{value}</span>
                </div>
              ))}
            </div>
            <div style={styles.drawerDivider} />
            <div style={styles.drawerSection}>
              <div style={styles.sectionTitle}>Employment Information</div>
              {[
                ['Department', selectedStaff.department],
                ['Employment Type', selectedStaff.employmentType],
                ['Start Date', selectedStaff.startDate?.slice(0, 10) || '—'],
                ['Status', selectedStaff.status],
              ].map(([label, value]) => (
                <div key={label} style={styles.drawerRow}>
                  <span style={styles.drawerLabel}>{label}</span>
                  <span style={styles.drawerValue}>{value}</span>
                </div>
              ))}
            </div>
            <div style={styles.drawerDivider} />
            <div style={styles.drawerSection}>
              <div style={styles.sectionTitle}>Salary Information</div>
              {[
                ['Base Salary', `GH₵ ${selectedStaff.baseSalary?.toLocaleString()}`],
                ['Payment Type', selectedStaff.paymentType],
              ].map(([label, value]) => (
                <div key={label} style={styles.drawerRow}>
                  <span style={styles.drawerLabel}>{label}</span>
                  <span style={styles.drawerValue}>{value}</span>
                </div>
              ))}
            </div>
            <div style={styles.drawerDivider} />
            <div style={styles.drawerSection}>
              <div style={styles.sectionTitle}>Emergency Contact</div>
              {[
                ['Name', selectedStaff.emergencyContact?.name || '—'],
                ['Phone', selectedStaff.emergencyContact?.phone || '—'],
                ['Relationship', selectedStaff.emergencyContact?.relationship || '—'],
              ].map(([label, value]) => (
                <div key={label} style={styles.drawerRow}>
                  <span style={styles.drawerLabel}>{label}</span>
                  <span style={styles.drawerValue}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add New Staff</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={styles.formGrid}>
              {[
                { label: 'Full Name', key: 'fullName' },
                { label: 'Email', key: 'email' },
                { label: 'Phone', key: 'phone' },
                { label: 'Role', key: 'role' },
                { label: 'Start Date', key: 'startDate', type: 'date' },
                { label: 'Base Salary (GH₵)', key: 'baseSalary', type: 'number' },
              ].map(field => (
                <div key={field.key}>
                  <label style={styles.formLabel}>{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    style={styles.input}
                    value={form[field.key] || ''}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label style={styles.formLabel}>Department</label>
                <select style={styles.input} value={form.department || ''} onChange={e => setForm({ ...form, department: e.target.value })}>
                  <option value=''>Select...</option>
                  {['Sales', 'Operations', 'Finance', 'Administration', 'Marketing'].map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>Status</label>
                <select style={styles.input} value={form.status || 'Active'} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {['Active', 'On Leave', 'Terminated'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Address</label>
              <input style={styles.input} value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleCreate}>Add Staff</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Staff</h2>
              <button style={styles.closeBtn} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div style={styles.formGrid}>
              {[
                { label: 'Full Name', key: 'fullName' },
                { label: 'Email', key: 'email' },
                { label: 'Phone', key: 'phone' },
                { label: 'Role', key: 'role' },
                { label: 'Base Salary (GH₵)', key: 'baseSalary', type: 'number' },
              ].map(field => (
                <div key={field.key}>
                  <label style={styles.formLabel}>{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    style={styles.input}
                    value={editForm[field.key] || ''}
                    onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label style={styles.formLabel}>Department</label>
                <select style={styles.input} value={editForm.department || ''} onChange={e => setEditForm({ ...editForm, department: e.target.value })}>
                  {['Sales', 'Operations', 'Finance', 'Administration', 'Marketing'].map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>Status</label>
                <select style={styles.input} value={editForm.status || ''} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                  {['Active', 'On Leave', 'Terminated'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f0eb', padding: '40px' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#5c3d8f' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  subtitle: { color: '#999', marginTop: 4, fontSize: 13 },
  addBtn: { background: '#5c3d8f', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 },
  statCard: { padding: '20px 24px', borderRadius: 12, border: '1px solid', textAlign: 'center' },
  deptRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 },
  deptCard: { background: '#fff', borderRadius: 10, padding: '14px 16px', textAlign: 'center', border: '1px solid #ede8f5' },
  deptCount: { fontSize: 22, fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  deptLabel: { fontSize: 11, color: '#aaa', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
  filterRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8, border: '1px solid #e0d8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  filters: { display: 'flex', gap: 8 },
  filterSelect: { padding: '9px 14px', borderRadius: 8, border: '1px solid #e0d8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#555' },
  filterCount: { fontSize: 13, color: '#5c3d8f', fontWeight: 600 },
  tableWrap: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #ede8f5' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 20px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', borderBottom: '1px solid #f0eaf8', background: '#faf8ff' },
  td: { padding: '16px 20px', borderBottom: '1px solid #f5f0fa', verticalAlign: 'middle' },
  employeeCell: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: '#ede8f5', color: '#5c3d8f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, fontFamily: 'Georgia, serif', flexShrink: 0 },
  name: { fontSize: 14, fontWeight: 600, color: '#2d1b4e' },
  subRow: { fontSize: 12, color: '#aaa', marginTop: 3 },
  salary: { color: '#c9a84c', fontWeight: 600 },
  deptBadge: { background: '#ede8f5', color: '#5c3d8f', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  actions: { display: 'flex', gap: 8 },
  editBtn: { padding: '6px 14px', borderRadius: 7, border: '1px solid #ede8f5', background: '#fff', color: '#5c3d8f', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  removeBtn: { padding: '6px 14px', borderRadius: 7, border: 'none', background: '#fce4ec', color: '#c62828', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  viewBtn: { marginTop: 6, width: '100%', padding: '5px 0', borderRadius: 7, border: '1px solid #ede8f5', background: '#faf8ff', color: '#5c3d8f', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  formLabel: { display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0d8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', color: '#888', fontWeight: 600, cursor: 'pointer' },
  saveBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#5c3d8f', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  drawerOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999 },
  drawer: { position: 'fixed', top: 0, right: 0, width: 400, height: '100vh', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', overflowY: 'auto', zIndex: 1000, padding: 28 },
  drawerHeader: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, position: 'relative' },
  drawerAvatar: { width: 56, height: 56, borderRadius: '50%', background: '#ede8f5', color: '#5c3d8f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, fontFamily: 'Georgia, serif', flexShrink: 0 },
  drawerName: { fontSize: 18, fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  drawerRole: { fontSize: 13, color: '#999', marginTop: 3 },
  drawerDivider: { height: 1, background: '#f0eaf8', margin: '16px 0' },
  drawerSection: { marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5c3d8f', marginBottom: 12 },
  drawerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  drawerLabel: { fontSize: 13, color: '#aaa' },
  drawerValue: { fontSize: 13, color: '#2d1b4e', fontWeight: 500, textAlign: 'right', maxWidth: 220 },
};

export default StaffPage;