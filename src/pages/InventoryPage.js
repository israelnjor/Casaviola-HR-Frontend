import { useState, useEffect } from 'react';
import { getAllLists, createList, updateList, deleteList } from '../services/inventoryService';
import { useNavigate } from 'react-router-dom';
import useWindowSize from '../hooks/useWindowSize';

function InventoryPage() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({ status: 'Active' });
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();

  const { isMobile, isTablet } = useWindowSize();
  const isSmall = isMobile || isTablet;

  useEffect(() => { fetchLists(); }, []);

  const fetchLists = async () => {
    try {
      const res = await getAllLists();
      setLists(res.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createList(form);
      setShowModal(false);
      setForm({ status: 'Active' });
      fetchLists();
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = async () => {
    try {
      await updateList(editForm._id, editForm);
      setShowEditModal(false);
      setEditForm({});
      fetchLists();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this inventory list and all its items?')) {
      await deleteList(id);
      fetchLists();
    }
  };

  const statusStyle = (status) => ({
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: status === 'Active' ? '#e8f5e9' : status === 'Completed' ? '#e3f2fd' : '#fff8e1',
    color: status === 'Active' ? '#2e7d32' : status === 'Completed' ? '#1565c0' : '#f57f17',
  });

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={{ ...styles.page, padding: isSmall ? '8px 16px 24px' : '40px' }}>

      {/* Header */}
      <div style={{
        ...styles.header,
        flexDirection: isSmall ? 'column' : 'row',
        alignItems: isSmall ? 'center' : 'center',
        gap: isSmall ? 12 : 0,
        marginBottom: isSmall ? 16 : 28,
        textAlign: isSmall ? 'center' : 'left',
      }}>
        <div>
          <h1 style={{ ...styles.title, fontSize: isSmall ? 22 : 26 }}>Inventory Management</h1>
          <p style={styles.subtitle}>{lists.length} project{lists.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button style={{ ...styles.addBtn, width: isSmall ? '100%' : 'auto' }} onClick={() => setShowModal(true)}>
          + New Inventory List
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 16,
      }}>
        {[
          { label: 'Total Projects', value: lists.length, color: '#5c3d8f', bg: '#ede8f5' },
          { label: 'Active', value: lists.filter(l => l.status === 'Active').length, color: '#2e7d32', bg: '#e8f5e9' },
          { label: 'Completed', value: lists.filter(l => l.status === 'Completed').length, color: '#1565c0', bg: '#e3f2fd' },
          { label: 'On Hold', value: lists.filter(l => l.status === 'On Hold').length, color: '#f57f17', bg: '#fff8e1' },
        ].map((s, i) => (
          <div key={i} style={{ ...styles.statCard, background: s.bg, borderColor: s.color + '33' }}>
            <div style={{ fontSize: isSmall ? 22 : 26, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mobile Cards / Desktop Table */}
      {isSmall ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#aaa', background: '#fff', borderRadius: 12, border: '1px solid #ede8f5' }}>
              No inventory lists yet — create your first one
            </div>
          ) : (
            lists.map(list => (
              <div
                key={list._id}
                style={styles.mobileCard}
                onClick={() => navigate(`/inventory/${list._id}`)}
              >
                {/* Card Top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={styles.projectName}>{list.projectName}</div>
                    {list.description && <div style={styles.subRow}>{list.description}</div>}
                    {list.location && <div style={{ ...styles.subRow, marginTop: 2 }}>📍 {list.location}</div>}
                  </div>
                  <span style={statusStyle(list.status)}>{list.status}</span>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Total', value: list.totalItems, color: '#5c3d8f' },
                    { label: 'Used', value: list.totalUsed, color: '#c62828' },
                    { label: 'Remaining', value: list.totalRemaining, color: '#2e7d32' },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: '#faf8ff', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: stat.color, fontFamily: 'Georgia, serif' }}>{stat.value}</div>
                      <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, marginTop: 2, textTransform: 'uppercase' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div style={styles.mobileCardRow}>
                  <span style={styles.mobileCardLabel}>Total Value</span>
                  <span style={{ fontSize: 13, color: '#c9a84c', fontWeight: 700 }}>GH₵ {list.totalValue?.toLocaleString()}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }} onClick={e => e.stopPropagation()}>
                  <button style={{ ...styles.editBtn, flex: 1 }} onClick={() => { setEditForm(list); setShowEditModal(true); }}>Edit</button>
                  <button style={{ ...styles.viewBtn, flex: 1 }} onClick={() => navigate(`/inventory/${list._id}`)}>View Items</button>
                  <button style={{ ...styles.removeBtn, flex: 1 }} onClick={() => handleDelete(list._id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Desktop Table */
        <div style={{ ...styles.tableWrap, overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Project Name', 'Location', 'Total Items', 'Total Used', 'Remaining', 'Total Value', 'Status', 'Actions'].map(col => (
                  <th key={col} style={styles.th}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lists.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                    No inventory lists yet — create your first one
                  </td>
                </tr>
              ) : (
                lists.map((list, i) => (
                  <tr
                    key={list._id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#faf8ff', cursor: 'pointer' }}
                    onClick={() => navigate(`/inventory/${list._id}`)}
                  >
                    <td style={styles.td}>
                      <div style={styles.projectName}>{list.projectName}</div>
                      {list.description && <div style={styles.subRow}>{list.description}</div>}
                    </td>
                    <td style={{ ...styles.td, color: '#888' }}>{list.location || '—'}</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#5c3d8f' }}>{list.totalItems}</td>
                    <td style={{ ...styles.td, color: '#c62828', fontWeight: 600 }}>{list.totalUsed}</td>
                    <td style={{ ...styles.td, color: '#2e7d32', fontWeight: 600 }}>{list.totalRemaining}</td>
                    <td style={{ ...styles.td, color: '#c9a84c', fontWeight: 700 }}>GH₵ {list.totalValue?.toLocaleString()}</td>
                    <td style={styles.td}>
                      <span style={statusStyle(list.status)}>{list.status}</span>
                    </td>
                    <td style={styles.td} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={styles.editBtn} onClick={() => { setEditForm(list); setShowEditModal(true); }}>Edit</button>
                        <button style={styles.removeBtn} onClick={() => handleDelete(list._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, padding: isSmall ? 20 : 32 }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>New Inventory List</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={styles.formLabel}>Project Name</label>
                <input style={styles.input} placeholder='e.g. Spintex Property' value={form.projectName || ''} onChange={e => setForm({ ...form, projectName: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Location</label>
                <input style={styles.input} placeholder='e.g. Spintex, Accra' value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Status</label>
                <select style={styles.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {['Active', 'Completed', 'On Hold'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Description</label>
              <textarea rows={2} style={{ ...styles.input, resize: 'vertical' }} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleCreate}>Create List</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, padding: isSmall ? 20 : 32 }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Inventory List</h2>
              <button style={styles.closeBtn} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={styles.formLabel}>Project Name</label>
                <input style={styles.input} value={editForm.projectName || ''} onChange={e => setEditForm({ ...editForm, projectName: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Location</label>
                <input style={styles.input} value={editForm.location || ''} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Status</label>
                <select style={styles.input} value={editForm.status || 'Active'} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                  {['Active', 'Completed', 'On Hold'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Description</label>
              <textarea rows={2} style={{ ...styles.input, resize: 'vertical' }} value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
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
  page: { minHeight: '100vh', background: '#f5f0eb' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#5c3d8f' },
  header: { display: 'flex', justifyContent: 'space-between' },
  title: { fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif', margin: 0 },
  subtitle: { color: '#999', marginTop: 4, fontSize: 13 },
  addBtn: { background: '#5c3d8f', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  statCard: { padding: '16px', borderRadius: 12, border: '1px solid', textAlign: 'center' },
  mobileCard: { background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #ede8f5', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' },
  mobileCardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  mobileCardLabel: { fontSize: 12, color: '#aaa', fontWeight: 500 },
  tableWrap: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #ede8f5' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 20px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', borderBottom: '1px solid #f0eaf8', background: '#faf8ff' },
  td: { padding: '16px 20px', borderBottom: '1px solid #f5f0fa', verticalAlign: 'middle', fontSize: 14 },
  projectName: { fontSize: 14, fontWeight: 700, color: '#2d1b4e' },
  subRow: { fontSize: 12, color: '#aaa', marginTop: 3 },
  editBtn: { padding: '6px 14px', borderRadius: 7, border: '1px solid #ede8f5', background: '#fff', color: '#5c3d8f', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  removeBtn: { padding: '6px 14px', borderRadius: 7, border: 'none', background: '#fce4ec', color: '#c62828', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  viewBtn: { padding: '6px 14px', borderRadius: 7, border: '1px solid #ede8f5', background: '#faf8ff', color: '#5c3d8f', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
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

export default InventoryPage;