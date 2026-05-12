import { useState, useEffect } from 'react';
import { getAllAttendance, createAttendance, deleteAttendance } from '../services/attendanceService';
import { getAllStaff } from '../services/staffService';
import useWindowSize from '../hooks/useWindowSize';

function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const { isMobile, isTablet } = useWindowSize();
  const isSmall = isMobile || isTablet;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [attendanceRes, staffRes] = await Promise.all([
        getAllAttendance(),
        getAllStaff(),
      ]);
      setRecords(attendanceRes.data);
      setStaff(staffRes.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const detectStatus = (clockIn) => {
    if (!clockIn) return 'Absent';
    const [h, m] = clockIn.split(':').map(Number);
    return h > 8 || (h === 8 && m > 15) ? 'Late' : 'Present';
  };

  const handleCreate = async () => {
    try {
      const status = detectStatus(form.clockIn);
      await createAttendance({ ...form, status });
      setShowModal(false);
      setForm({});
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this record?')) {
      await deleteAttendance(id);
      fetchData();
    }
  };

  const filteredRecords = records.filter(r =>
    r.date?.slice(0, 10) === selectedDate
  );

  const statusStyle = (status) => ({
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: status === 'Present' ? '#e8f5e9' : status === 'Late' ? '#fff8e1' : '#fce4ec',
    color: status === 'Present' ? '#2e7d32' : status === 'Late' ? '#f57f17' : '#c62828',
  });

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2);

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={{ ...styles.page, padding: isSmall ? '20px 16px' : '40px' }}>

      {/* Header */}
      <div style={{ ...styles.header, flexDirection: isSmall ? 'column' : 'row', alignItems: isSmall ? 'flex-start' : 'center', gap: isSmall ? 12 : 0 }}>
        <div>
          <h1 style={{ ...styles.title, fontSize: isSmall ? 22 : 26 }}>Attendance</h1>
          <p style={styles.subtitle}>Track daily staff attendance</p>
        </div>
        <button style={{ ...styles.addBtn}} onClick={() => setShowModal(true)}>
          + Log Attendance
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 20,
      }}>
        {[
          { label: 'Present', value: filteredRecords.filter(r => r.status === 'Present').length, color: '#2e7d32', bg: '#e8f5e9' },
          { label: 'Late', value: filteredRecords.filter(r => r.status === 'Late').length, color: '#f57f17', bg: '#fff8e1' },
          { label: 'Absent', value: staff.length - filteredRecords.length, color: '#c62828', bg: '#fce4ec' },
          { label: 'Total Staff', value: staff.length, color: '#5c3d8f', bg: '#ede8f5' },
        ].map((s, i) => (
          <div key={i} style={{ ...styles.statCard, background: s.bg, borderColor: s.color + '33' }}>
            <div style={{ fontSize: isSmall ? 22 : 28, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Date Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={styles.dateLabel}>Viewing:</span>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={styles.dateInput}
        />
        <span style={styles.dateCount}>{filteredRecords.length} records</span>
      </div>

      {/* Table */}
      <div style={{ ...styles.tableWrap, overflowX: 'auto' }}>
        <table style={{ ...styles.table, minWidth: isSmall ? 600 : '100%' }}>
          <thead>
            <tr>
              {['Employee', 'Date', 'Clock In', 'Clock Out', 'Status', 'Notes', 'Actions'].map(col => (
                <th key={col} style={styles.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                  No attendance records for this date
                </td>
              </tr>
            ) : (
              filteredRecords.map((r, i) => (
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
                  <td style={styles.td}>{r.date?.slice(0, 10)}</td>
                  <td style={styles.td}>{r.clockIn || '—'}</td>
                  <td style={styles.td}>{r.clockOut || '—'}</td>
                  <td style={styles.td}><span style={statusStyle(r.status)}>{r.status}</span></td>
                  <td style={{ ...styles.td, color: '#aaa', fontSize: 13 }}>{r.notes || '—'}</td>
                  <td style={styles.td}>
                    <button style={styles.removeBtn} onClick={() => handleDelete(r._id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Full Log */}
      <div style={{ ...styles.tableWrap, overflowX: 'auto', marginTop: 16 }}>
        <h3 style={{ padding: '16px 20px', fontSize: 16, fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif', borderBottom: '1px solid #f0eaf8' }}>Full Attendance Log</h3>
        <table style={{ ...styles.table, minWidth: isSmall ? 600 : '100%' }}>
          <thead>
            <tr>
              {['Employee', 'Date', 'Clock In', 'Clock Out', 'Status'].map(col => (
                <th key={col} style={styles.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...records].reverse().map((a, i) => (
              <tr key={a._id} style={{ background: i % 2 === 0 ? '#fff' : '#faf8ff' }}>
                <td style={{ ...styles.td, fontWeight: 500 }}>{a.staff?.fullName || 'Unknown'}</td>
                <td style={{ ...styles.td, color: '#aaa' }}>{a.date?.slice(0, 10)}</td>
                <td style={styles.td}>{a.clockIn}</td>
                <td style={styles.td}>{a.clockOut || '—'}</td>
                <td style={styles.td}><span style={statusStyle(a.status)}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, padding: isSmall ? 20 : 32 }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Log Attendance</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={styles.formLabel}>Staff Member</label>
                <select style={styles.input} value={form.staff || ''} onChange={e => setForm({ ...form, staff: e.target.value })}>
                  <option value=''>Select staff...</option>
                  {staff.map(s => (
                    <option key={s._id} value={s._id}>{s.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>Date</label>
                <input type='date' style={styles.input} value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Clock In</label>
                <input type='time' style={styles.input} value={form.clockIn || ''} onChange={e => setForm({ ...form, clockIn: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Clock Out</label>
                <input type='time' style={styles.input} value={form.clockOut || ''} onChange={e => setForm({ ...form, clockOut: e.target.value })} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Notes (optional)</label>
              <input style={styles.input} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder='e.g. Left early due to appointment' />
            </div>

            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
              ℹ️ Clock-in after 08:15 is automatically marked as Late.
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleCreate}>Log Attendance</button>
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
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  subtitle: { color: '#999', marginTop: 4, fontSize: 13 },
  addBtn: { background: '#5c3d8f', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  statCard: { padding: '16px', borderRadius: 12, border: '1px solid', textAlign: 'center' },
  dateLabel: { fontSize: 13, color: '#888', fontWeight: 500 },
  dateInput: { padding: '8px 12px', borderRadius: 8, border: '1px solid #e0d8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  dateCount: { fontSize: 13, color: '#5c3d8f', fontWeight: 600 },
  tableWrap: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #ede8f5' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 20px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', borderBottom: '1px solid #f0eaf8', background: '#faf8ff' },
  td: { padding: '16px 20px', borderBottom: '1px solid #f5f0fa', verticalAlign: 'middle' },
  employeeCell: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#ede8f5', color: '#5c3d8f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, fontFamily: 'Georgia, serif', flexShrink: 0 },
  name: { fontSize: 14, fontWeight: 600, color: '#2d1b4e' },
  subRow: { fontSize: 12, color: '#aaa', marginTop: 3 },
  removeBtn: { padding: '6px 14px', borderRadius: 7, border: 'none', background: '#fce4ec', color: '#c62828', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' },
  formLabel: { display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0d8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', color: '#888', fontWeight: 600, cursor: 'pointer' },
  saveBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#5c3d8f', color: '#fff', fontWeight: 600, cursor: 'pointer' },
};

export default AttendancePage;