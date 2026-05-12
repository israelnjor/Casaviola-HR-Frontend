import { useState, useEffect } from 'react';
import { getAllPayroll, createPayroll, updatePayroll, deletePayroll } from '../services/payrollService';
import { getAllStaff } from '../services/staffService';

function PayrollPage() {
  const [payroll, setPayroll] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({ bonus: 0, deductions: 0 });
  const [editForm, setEditForm] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [payrollRes, staffRes] = await Promise.all([
        getAllPayroll(),
        getAllStaff(),
      ]);
      setPayroll(payrollRes.data);
      setStaff(staffRes.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createPayroll(form);
      setShowModal(false);
      setForm({ bonus: 0, deductions: 0 });
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = async () => {
    try {
      await updatePayroll(editForm._id, editForm);
      setShowEditModal(false);
      setEditForm({});
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await updatePayroll(id, { status: 'Paid' });
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this payroll record?')) {
      await deletePayroll(id);
      fetchData();
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2);

  const netPay = (f) => Number(f.basicSalary || 0) + Number(f.bonus || 0) - Number(f.deductions || 0);

  const totalPayroll = payroll.reduce((sum, p) => sum + (p.netPay || 0), 0);
  const totalPaid = payroll.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.netPay || 0), 0);
  const totalPending = payroll.filter(p => p.status === 'Pending').reduce((sum, p) => sum + (p.netPay || 0), 0);

  // Auto-fill basic salary when staff is selected
  const handleStaffSelect = (staffId) => {
    const selected = staff.find(s => s._id === staffId);
    setForm({ ...form, staff: staffId, basicSalary: selected?.baseSalary || 0 });
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Payroll & Compensation</h1>
          <p style={styles.subtitle}>Manage monthly staff salaries and payments</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>+ Run Payroll</button>
      </div>

      {/* Stat Cards */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total Payroll', value: `GH₵ ${totalPayroll.toLocaleString()}`, color: '#5c3d8f', bg: '#ede8f5' },
          { label: 'Total Paid', value: `GH₵ ${totalPaid.toLocaleString()}`, color: '#2e7d32', bg: '#e8f5e9' },
          { label: 'Pending Payment', value: `GH₵ ${totalPending.toLocaleString()}`, color: '#f57f17', bg: '#fff8e1' },
          { label: 'Total Records', value: payroll.length, color: '#1565c0', bg: '#e3f2fd' },
        ].map((s, i) => (
          <div key={i} style={{ ...styles.statCard, background: s.bg, borderColor: s.color + '33' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Employee', 'Month', 'Basic (GH₵)', 'Bonus', 'Deductions', 'Net Pay', 'Status', 'Actions'].map(col => (
                <th key={col} style={styles.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payroll.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                  No payroll records yet
                </td>
              </tr>
            ) : (
              payroll.map((p, i) => (
                <tr key={p._id} style={{ background: i % 2 === 0 ? '#fff' : '#faf8ff' }}>
                  <td style={styles.td}>
                    <div style={styles.employeeCell}>
                      <div style={styles.avatar}>{getInitials(p.staff?.fullName)}</div>
                      <div>
                        <div style={styles.name}>{p.staff?.fullName}</div>
                        <div style={styles.subRow}>{p.staff?.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>{p.month}</td>
                  <td style={styles.td}>{p.basicSalary?.toLocaleString()}</td>
                  <td style={{ ...styles.td, color: '#2e7d32', fontWeight: 600 }}>+{p.bonus?.toLocaleString()}</td>
                  <td style={{ ...styles.td, color: '#c62828', fontWeight: 600 }}>-{p.deductions?.toLocaleString()}</td>
                  <td style={{ ...styles.td, color: '#5c3d8f', fontWeight: 700, fontSize: 15 }}>GH₵ {p.netPay?.toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: p.status === 'Paid' ? '#e8f5e9' : '#fff8e1',
                      color: p.status === 'Paid' ? '#2e7d32' : '#f57f17',
                    }}>{p.status}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {p.status === 'Pending' && (
                        <button style={styles.paidBtn} onClick={() => handleMarkPaid(p._id)}>Mark Paid</button>
                      )}
                      <button style={styles.editBtn} onClick={() => { setEditForm(p); setShowEditModal(true); }}>Edit</button>
                      <button style={styles.removeBtn} onClick={() => handleDelete(p._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Payroll Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Run Payroll</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={styles.formGrid}>
              <div>
                <label style={styles.formLabel}>Staff Member</label>
                <select style={styles.input} value={form.staff || ''} onChange={e => handleStaffSelect(e.target.value)}>
                  <option value=''>Select staff...</option>
                  {staff.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>Month</label>
                <input style={styles.input} placeholder='e.g. May 2026' value={form.month || ''} onChange={e => setForm({ ...form, month: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Basic Salary (GH₵)</label>
                <input type='number' style={styles.input} value={form.basicSalary || ''} onChange={e => setForm({ ...form, basicSalary: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Bonus (GH₵)</label>
                <input type='number' style={styles.input} value={form.bonus || 0} onChange={e => setForm({ ...form, bonus: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Deductions (GH₵)</label>
                <input type='number' style={styles.input} value={form.deductions || 0} onChange={e => setForm({ ...form, deductions: e.target.value })} />
              </div>
            </div>

            {/* Net Pay Preview */}
            {form.basicSalary && (
              <div style={styles.netPayPreview}>
                <span style={{ color: '#888', fontSize: 13 }}>Net Pay: </span>
                <span style={{ color: '#5c3d8f', fontWeight: 700, fontSize: 20, fontFamily: 'Georgia, serif' }}>
                  GH₵ {netPay(form).toLocaleString()}
                </span>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Notes (optional)</label>
              <input style={styles.input} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleCreate}>Create Record</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payroll Modal */}
      {showEditModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Payroll</h2>
              <button style={styles.closeBtn} onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <div style={styles.formGrid}>
              <div>
                <label style={styles.formLabel}>Month</label>
                <input style={styles.input} value={editForm.month || ''} onChange={e => setEditForm({ ...editForm, month: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Basic Salary (GH₵)</label>
                <input type='number' style={styles.input} value={editForm.basicSalary || ''} onChange={e => setEditForm({ ...editForm, basicSalary: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Bonus (GH₵)</label>
                <input type='number' style={styles.input} value={editForm.bonus || 0} onChange={e => setEditForm({ ...editForm, bonus: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Deductions (GH₵)</label>
                <input type='number' style={styles.input} value={editForm.deductions || 0} onChange={e => setEditForm({ ...editForm, deductions: e.target.value })} />
              </div>
            </div>

            {/* Net Pay Preview */}
            <div style={styles.netPayPreview}>
              <span style={{ color: '#888', fontSize: 13 }}>Net Pay: </span>
              <span style={{ color: '#5c3d8f', fontWeight: 700, fontSize: 20, fontFamily: 'Georgia, serif' }}>
                GH₵ {netPay(editForm).toLocaleString()}
              </span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Notes (optional)</label>
              <input style={styles.input} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
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
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { padding: '20px 24px', borderRadius: 12, border: '1px solid', textAlign: 'center' },
  tableWrap: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #ede8f5' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 20px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', borderBottom: '1px solid #f0eaf8', background: '#faf8ff' },
  td: { padding: '16px 20px', borderBottom: '1px solid #f5f0fa', verticalAlign: 'middle', fontSize: 14 },
  employeeCell: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: '50%', background: '#ede8f5', color: '#5c3d8f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, fontFamily: 'Georgia, serif', flexShrink: 0 },
  name: { fontSize: 14, fontWeight: 600, color: '#2d1b4e' },
  subRow: { fontSize: 12, color: '#aaa', marginTop: 3 },
  paidBtn: { padding: '6px 12px', borderRadius: 7, border: 'none', background: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  editBtn: { padding: '6px 12px', borderRadius: 7, border: '1px solid #ede8f5', background: '#fff', color: '#5c3d8f', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  removeBtn: { padding: '6px 12px', borderRadius: 7, border: 'none', background: '#fce4ec', color: '#c62828', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  netPayPreview: { background: '#ede8f5', borderRadius: 10, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  formLabel: { display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0d8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', color: '#888', fontWeight: 600, cursor: 'pointer' },
  saveBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#5c3d8f', color: '#fff', fontWeight: 600, cursor: 'pointer' },
};

export default PayrollPage;