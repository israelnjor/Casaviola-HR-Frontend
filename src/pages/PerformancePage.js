import { useState, useEffect } from 'react';
import { getAllPerformance, createPerformance, updatePerformance, deletePerformance } from '../services/performanceService';
import { getAllStaff } from '../services/staffService';
import useWindowSize from '../hooks/useWindowSize';

function PerformancePage() {
  const [reviews, setReviews] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({ rating: 3, kpiScore: 0 });
  const [editForm, setEditForm] = useState({});

  const { isMobile, isTablet } = useWindowSize();
  const isSmall = isMobile || isTablet;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [reviewsRes, staffRes] = await Promise.all([
        getAllPerformance(),
        getAllStaff(),
      ]);
      setReviews(reviewsRes.data);
      setStaff(staffRes.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createPerformance(form);
      setShowModal(false);
      setForm({ rating: 3, kpiScore: 0 });
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = async () => {
    try {
      await updatePerformance(editForm._id, editForm);
      setShowEditModal(false);
      setEditForm({});
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this review?')) {
      await deletePerformance(id);
      fetchData();
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2);
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  const avgKpi = reviews.length
    ? Math.round(reviews.reduce((sum, r) => sum + r.kpiScore, 0) / reviews.length)
    : 0;

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const kpiColor = (score) =>
    score >= 80 ? '#2e7d32' : score >= 60 ? '#f57f17' : '#c62828';

  const kpiBg = (score) =>
    score >= 80 ? '#e8f5e9' : score >= 60 ? '#fff8e1' : '#fce4ec';

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={{ ...styles.page, padding: isSmall ? '8px 16px 24px' : '40px' }}>

      {/* Header */}
      <div style={{
        ...styles.header,
        flexDirection: isSmall ? 'column' : 'row',
        alignItems: isSmall ? 'center' : 'center',
        textAlign: isSmall ? 'center' : 'left',
        gap: isSmall ? 12 : 0,
        marginBottom: isSmall ? 16 : 28,
      }}>
        <div>
          <h1 style={{ ...styles.title, fontSize: isSmall ? 22 : 26 }}>Performance Reviews</h1>
          <p style={styles.subtitle}>Track staff KPIs and quarterly performance</p>
        </div>
        <button style={{ ...styles.addBtn, width: isSmall ? '100%' : 'auto' }} onClick={() => setShowModal(true)}>
          + Add Review
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
          { label: 'Total Reviews', value: reviews.length, color: '#5c3d8f', bg: '#ede8f5' },
          { label: 'Average KPI', value: `${avgKpi}%`, color: avgKpi >= 80 ? '#2e7d32' : avgKpi >= 60 ? '#f57f17' : '#c62828', bg: avgKpi >= 80 ? '#e8f5e9' : avgKpi >= 60 ? '#fff8e1' : '#fce4ec' },
          { label: 'Average Rating', value: `${avgRating} / 5`, color: '#c9a84c', bg: '#fffde7' },
          { label: 'Staff Reviewed', value: [...new Set(reviews.map(r => r.staff?._id))].length, color: '#1565c0', bg: '#e3f2fd' },
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
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#aaa', background: '#fff', borderRadius: 12, border: '1px solid #ede8f5' }}>
              No reviews yet
            </div>
          ) : (
            reviews.map(r => (
              <div key={r._id} style={styles.mobileCard}>
                {/* Employee Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={styles.avatar}>{getInitials(r.staff?.fullName)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.name}>{r.staff?.fullName}</div>
                    <div style={styles.subRow}>{r.staff?.role}</div>
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                    background: kpiBg(r.kpiScore), color: kpiColor(r.kpiScore), flexShrink: 0,
                  }}>
                    {r.kpiScore}%
                  </span>
                </div>

                {/* Score Details */}
                <div style={{ background: '#faf8ff', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                  <div style={styles.mobileCardRow}>
                    <span style={styles.mobileCardLabel}>Period</span>
                    <span style={styles.mobileCardValue}>{r.period}</span>
                  </div>
                  <div style={styles.mobileCardRow}>
                    <span style={styles.mobileCardLabel}>Rating</span>
                    <span style={{ color: '#c9a84c', fontSize: 16, letterSpacing: 2 }}>{stars(r.rating)}</span>
                  </div>
                  {r.reviewer && (
                    <div style={styles.mobileCardRow}>
                      <span style={styles.mobileCardLabel}>Reviewer</span>
                      <span style={styles.mobileCardValue}>{r.reviewer}</span>
                    </div>
                  )}
                  {r.notes && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #ede8f5' }}>
                      <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Notes</div>
                      <div style={{ fontSize: 13, color: '#888' }}>{r.notes}</div>
                    </div>
                  )}
                </div>

                {/* KPI Progress Bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase' }}>KPI Score</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: kpiColor(r.kpiScore) }}>{r.kpiScore}%</span>
                  </div>
                  <div style={{ height: 6, background: '#ede8f5', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${r.kpiScore}%`,
                      background: kpiColor(r.kpiScore),
                      borderRadius: 3,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ ...styles.editBtn, flex: 1 }} onClick={() => { setEditForm(r); setShowEditModal(true); }}>Edit</button>
                  <button style={{ ...styles.removeBtn, flex: 1 }} onClick={() => handleDelete(r._id)}>Delete</button>
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
                {['Employee', 'Period', 'Rating', 'KPI Score', 'Notes', 'Reviewer', 'Actions'].map(col => (
                  <th key={col} style={styles.th}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                    No reviews yet
                  </td>
                </tr>
              ) : (
                reviews.map((r, i) => (
                  <tr key={r._id} style={{ background: i % 2 === 0 ? '#fff' : '#faf8ff' }}>
                    <td style={styles.td}>
                      <div style={styles.employeeCell}>
                        <div style={styles.avatar}>{getInitials(r.staff?.fullName)}</div>
                        <div>
                          <div style={styles.name}>{r.staff?.fullName}</div>
                          <div style={styles.subRow}>{r.staff?.role}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{r.period}</td>
                    <td style={{ ...styles.td, color: '#c9a84c', fontSize: 16, letterSpacing: 2 }}>
                      {stars(r.rating)}
                    </td>
                    <td style={styles.td}>
                      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, background: kpiBg(r.kpiScore), color: kpiColor(r.kpiScore) }}>
                        {r.kpiScore}%
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: '#888', fontSize: 13, maxWidth: 200 }}>{r.notes || '—'}</td>
                    <td style={{ ...styles.td, color: '#aaa' }}>{r.reviewer}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={styles.editBtn} onClick={() => { setEditForm(r); setShowEditModal(true); }}>Edit</button>
                        <button style={styles.removeBtn} onClick={() => handleDelete(r._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Review Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, padding: isSmall ? 20 : 32 }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add Performance Review</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ gridColumn: isSmall ? '1' : 'span 2' }}>
                <label style={styles.formLabel}>Staff Member</label>
                <select style={styles.input} value={form.staff || ''} onChange={e => setForm({ ...form, staff: e.target.value })}>
                  <option value=''>Select staff...</option>
                  {staff.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>Review Period</label>
                <input style={styles.input} placeholder='e.g. Q2 2026' value={form.period || ''} onChange={e => setForm({ ...form, period: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Star Rating (1–5)</label>
                <select style={styles.input} value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>KPI Score (0–100)</label>
                <input type='number' min={0} max={100} style={styles.input} value={form.kpiScore} onChange={e => setForm({ ...form, kpiScore: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Reviewer</label>
                <input style={styles.input} placeholder='e.g. Manager name' value={form.reviewer || ''} onChange={e => setForm({ ...form, reviewer: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Notes</label>
              <textarea rows={3} style={{ ...styles.input, resize: 'vertical' }} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleCreate}>Save Review</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {showEditModal && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, padding: isSmall ? 20 : 32 }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Review</h2>
              <button style={styles.closeBtn} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={styles.formLabel}>Review Period</label>
                <input style={styles.input} value={editForm.period || ''} onChange={e => setEditForm({ ...editForm, period: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Star Rating (1–5)</label>
                <select style={styles.input} value={editForm.rating || 3} onChange={e => setEditForm({ ...editForm, rating: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>KPI Score (0–100)</label>
                <input type='number' min={0} max={100} style={styles.input} value={editForm.kpiScore || ''} onChange={e => setEditForm({ ...editForm, kpiScore: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Reviewer</label>
                <input style={styles.input} value={editForm.reviewer || ''} onChange={e => setEditForm({ ...editForm, reviewer: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Notes</label>
              <textarea rows={3} style={{ ...styles.input, resize: 'vertical' }} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
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
  editBtn: { padding: '6px 14px', borderRadius: 7, border: '1px solid #ede8f5', background: '#fff', color: '#5c3d8f', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
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

export default PerformancePage;