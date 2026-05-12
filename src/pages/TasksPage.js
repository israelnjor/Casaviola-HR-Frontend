import { useState, useEffect } from 'react';
import { getAllTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { getAllStaff } from '../services/staffService';

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ priority: 'Medium', status: 'Pending' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [filterStatus, setFilterStatus] = useState('All');
  const [expandedTask, setExpandedTask] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, staffRes] = await Promise.all([
        getAllTasks(),
        getAllStaff(),
      ]);
      setTasks(tasksRes.data);
      setStaff(staffRes.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createTask(form);
      setShowModal(false);
      setForm({ priority: 'Medium', status: 'Pending' });
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = async () => {
    try {
      await updateTask(editForm._id, editForm);
      setShowEditModal(false);
      setEditForm({});
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateTask(id, { status });
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this task?')) {
      await deleteTask(id);
      fetchData();
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2);

  const priorityStyle = (priority) => ({
    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: priority === 'Urgent' ? '#fce4ec' : priority === 'High' ? '#fff8e1' : priority === 'Medium' ? '#e3f2fd' : '#e8f5e9',
    color: priority === 'Urgent' ? '#c62828' : priority === 'High' ? '#f57f17' : priority === 'Medium' ? '#1565c0' : '#2e7d32',
  });

  const statusStyle = (status) => ({
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: status === 'Done' ? '#e8f5e9' : status === 'In Progress' ? '#e3f2fd' : '#fff8e1',
    color: status === 'Done' ? '#2e7d32' : status === 'In Progress' ? '#1565c0' : '#f57f17',
  });

  const filteredTasks = filterStatus === 'All' ? tasks : tasks.filter(t => t.status === filterStatus);

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Task Management</h1>
          <p style={styles.subtitle}>{tasks.length} total tasks · {tasks.filter(t => t.status === 'Done').length} completed</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>+ Assign Task</button>
      </div>

      {/* Stat Cards */}
      <div style={styles.statsRow}>
        {[
          { label: 'Pending', value: tasks.filter(t => t.status === 'Pending').length, color: '#f57f17', bg: '#fff8e1' },
          { label: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length, color: '#1565c0', bg: '#e3f2fd' },
          { label: 'Done', value: tasks.filter(t => t.status === 'Done').length, color: '#2e7d32', bg: '#e8f5e9' },
          { label: 'Total Tasks', value: tasks.length, color: '#5c3d8f', bg: '#ede8f5' },
        ].map((s, i) => (
          <div key={i} style={{ ...styles.statCard, background: s.bg, borderColor: s.color + '33' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Row */}
      <div style={styles.filterRow}>
        <span style={styles.filterLabel}>Filter:</span>
        {['All', 'Pending', 'In Progress', 'Done'].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)} style={{
            ...styles.filterBtn,
            background: filterStatus === f ? '#5c3d8f' : '#fff',
            color: filterStatus === f ? '#fff' : '#888',
            border: `1px solid ${filterStatus === f ? '#5c3d8f' : '#e0d8f0'}`,
          }}>
            {f}
          </button>
        ))}
        <span style={styles.filterCount}>{filteredTasks.length} tasks</span>
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                  No tasks found
                </td>
              </tr>
            ) : (
              filteredTasks.map((task, i) => (
                <>
                  {/* Task Title Row - clickable */}
                  <tr
                    key={task._id + '_title'}
                    onClick={() => setExpandedTask(expandedTask === task._id ? null : task._id)}
                    style={{ background: '#f5f0fa', cursor: 'pointer' }}
                  >
                    <td colSpan={5} style={styles.taskTitleRow}>
                      <div style={styles.taskTitleCell}>
                        <span style={styles.expandIcon}>
                          {expandedTask === task._id ? '▼' : '▶'}
                        </span>
                        <span style={styles.taskTitleText}>{task.title}</span>
                        {expandedTask !== task._id && task.description && (
                          <span style={styles.taskDescPreview}>{task.description}</span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Description Row */}
                  {expandedTask === task._id && task.description && (
                    <tr key={task._id + '_desc'}>
                      <td colSpan={5} style={styles.descRow}>
                        <div style={styles.descBox}>
                          <span style={styles.descLabel}>Description</span>
                          <p style={styles.descText}>{task.description}</p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Inline Header Row */}
                  <tr key={task._id + '_header'} style={{ background: '#f0eaf8' }}>
                    <td style={styles.inlineHeader}>Assigned To</td>
                    <td style={styles.inlineHeader}>Priority</td>
                    <td style={styles.inlineHeader}>Due Date</td>
                    <td style={styles.inlineHeader}>Status</td>
                    <td style={styles.inlineHeader}>Actions</td>
                  </tr>

                  {/* Data Row */}
                  <tr key={task._id + '_data'} style={{ background: i % 2 === 0 ? '#fff' : '#faf8ff', borderBottom: '8px solid #f5f0eb' }}>
                    <td style={styles.td}>
                      {task.assignedTo ? (
                        <div style={styles.assigneeCell}>
                          <div style={styles.miniAvatar}>{getInitials(task.assignedTo.fullName)}</div>
                          <div>
                            <div style={styles.assigneeName}>{task.assignedTo.fullName}</div>
                            <div style={styles.assigneeRole}>{task.assignedTo.role}</div>
                          </div>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={styles.td}>
                      <span style={priorityStyle(task.priority)}>{task.priority}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: 13, color: '#c9a84c', fontWeight: 600 }}>
                        {task.dueDate ? task.dueDate.slice(0, 10) : '—'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <select
                        value={task.status}
                        onChange={e => handleStatusChange(task._id, e.target.value)}
                        style={{ ...statusStyle(task.status), border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        {['Pending', 'In Progress', 'Done'].map(s => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={styles.editBtn} onClick={() => { setEditForm(task); setShowEditModal(true); }}>Edit</button>
                        <button style={styles.removeBtn} onClick={() => handleDelete(task._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Assign New Task</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Task Title</label>
              <input style={styles.input} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder='e.g. Follow up with Ridge leads' />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Description</label>
              <textarea rows={3} style={{ ...styles.input, resize: 'vertical' }} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.formLabel}>Assign To</label>
                <select style={styles.input} value={form.assignedTo || ''} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value=''>Select staff...</option>
                  {staff.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>Priority</label>
                <select style={styles.input} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>Due Date</label>
                <input type='date' style={styles.input} value={form.dueDate || ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Status</label>
                <select style={styles.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {['Pending', 'In Progress', 'Done'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleCreate}>Assign Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Task</h2>
              <button style={styles.closeBtn} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Task Title</label>
              <input style={styles.input} value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Description</label>
              <textarea rows={3} style={{ ...styles.input, resize: 'vertical' }} value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.formLabel}>Assign To</label>
                <select style={styles.input} value={editForm.assignedTo?._id || editForm.assignedTo || ''} onChange={e => setEditForm({ ...editForm, assignedTo: e.target.value })}>
                  <option value=''>Select staff...</option>
                  {staff.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>Priority</label>
                <select style={styles.input} value={editForm.priority || 'Medium'} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}>
                  {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.formLabel}>Due Date</label>
                <input type='date' style={styles.input} value={editForm.dueDate?.slice(0, 10) || ''} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} />
              </div>
              <div>
                <label style={styles.formLabel}>Status</label>
                <select style={styles.input} value={editForm.status || 'Pending'} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                  {['Pending', 'In Progress', 'Done'].map(s => <option key={s}>{s}</option>)}
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
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { padding: '20px 24px', borderRadius: 12, border: '1px solid', textAlign: 'center' },
  filterRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterLabel: { fontSize: 13, color: '#888', fontWeight: 500 },
  filterBtn: { padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  filterCount: { fontSize: 13, color: '#5c3d8f', fontWeight: 600, marginLeft: 8 },
  tableWrap: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #ede8f5' },
  table: { width: '100%', borderCollapse: 'collapse' },
  taskTitleRow: { padding: '14px 20px', borderBottom: '1px solid #ede8f5' },
  taskTitleCell: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  expandIcon: { fontSize: 10, color: '#5c3d8f', flexShrink: 0, marginTop: 3 },
  taskTitleText: { fontSize: 14, fontWeight: 700, color: '#2d1b4e', lineHeight: 1.5 },
  taskDescPreview: { fontSize: 12, color: '#bbb', marginLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 },
  descRow: { padding: 0, background: '#faf8ff' },
  descBox: { padding: '12px 48px 16px', borderBottom: '1px solid #ede8f5' },
  descLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5c3d8f' },
  descText: { fontSize: 13, color: '#555', marginTop: 6, lineHeight: 1.6 },
  inlineHeader: { padding: '8px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9b7fc7', borderBottom: '1px solid #ede8f5' },
  td: { padding: '14px 20px', borderBottom: '1px solid #f5f0fa', verticalAlign: 'middle' },
  assigneeCell: { display: 'flex', alignItems: 'center', gap: 10 },
  miniAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#ede8f5', color: '#5c3d8f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 },
  assigneeName: { fontSize: 13, fontWeight: 600, color: '#2d1b4e' },
  assigneeRole: { fontSize: 11, color: '#aaa', marginTop: 2 },
  editBtn: { padding: '6px 14px', borderRadius: 7, border: '1px solid #ede8f5', background: '#fff', color: '#5c3d8f', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  removeBtn: { padding: '6px 14px', borderRadius: 7, border: 'none', background: '#fce4ec', color: '#c62828', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
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

export default TasksPage;