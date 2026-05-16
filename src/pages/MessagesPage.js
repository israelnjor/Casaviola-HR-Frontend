import { useState, useEffect } from 'react';
import { getAllTasks } from '../services/taskService';
import { getAllPayroll } from '../services/payrollService';
import { getAllLists } from '../services/inventoryService';
import { getAllAttendance } from '../services/attendanceService';
import { getAllStaff } from '../services/staffService';
import useWindowSize from '../hooks/useWindowSize';

const STORAGE_KEY = 'hrms_messages';

const loadMessages = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveMessages = (msgs) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
};

function MessagesPage() {
  const [messages, setMessages] = useState(loadMessages());
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', tag: 'General' });
  const [filter, setFilter] = useState('All');
  const [dismissedAlerts, setDismissedAlerts] = useState(
    () => JSON.parse(localStorage.getItem('hrms_dismissed_alerts') || '[]')
  );

  const { isMobile, isTablet } = useWindowSize();
  const isSmall = isMobile || isTablet;

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    try {
      const [tasksRes, payrollRes, inventoryRes, attendanceRes, staffRes] = await Promise.all([
        getAllTasks(),
        getAllPayroll(),
        getAllLists(),
        getAllAttendance(),
        getAllStaff(),
      ]);

      const today = new Date().toISOString().slice(0, 10);
      const generated = [];

      // Overdue tasks
      tasksRes.data
        .filter(t => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < new Date())
        .forEach(t => {
          generated.push({
            id: `overdue_${t._id}`,
            type: 'alert',
            tag: 'Tasks',
            title: 'Overdue Task',
            body: `"${t.title}" assigned to ${t.assignedTo?.fullName || 'Unknown'} was due on ${t.dueDate?.slice(0, 10)}.`,
            color: '#c62828', bg: '#fce4ec', icon: '🔴',
            date: new Date().toISOString(),
          });
        });

      // Pending payroll
      const pendingPayroll = payrollRes.data.filter(p => p.status === 'Pending');
      if (pendingPayroll.length > 0) {
        generated.push({
          id: 'pending_payroll',
          type: 'alert',
          tag: 'Payroll',
          title: 'Pending Payroll',
          body: `${pendingPayroll.length} payroll record${pendingPayroll.length > 1 ? 's' : ''} are awaiting payment. Review in the Payroll module.`,
          color: '#f57f17', bg: '#fff8e1', icon: '🟡',
          date: new Date().toISOString(),
        });
      }

      // Low stock
      inventoryRes.data
        .filter(l => l.totalRemaining < l.totalItems * 0.2 && l.totalItems > 0)
        .forEach(l => {
          generated.push({
            id: `lowstock_${l._id}`,
            type: 'alert',
            tag: 'Inventory',
            title: 'Low Stock Alert',
            body: `"${l.projectName}" has only ${l.totalRemaining} items remaining (${l.location || 'no location'}).`,
            color: '#c62828', bg: '#fce4ec', icon: '📦',
            date: new Date().toISOString(),
          });
        });

      // Late / absent today
      const todayAtt = attendanceRes.data.filter(a => a.date?.slice(0, 10) === today);
      const lateToday = todayAtt.filter(a => a.status === 'Late');
      const absentCount = staffRes.data.length - todayAtt.length;

      if (lateToday.length > 0) {
        generated.push({
          id: 'late_today',
          type: 'alert',
          tag: 'Attendance',
          title: 'Late Arrivals Today',
          body: `${lateToday.length} staff member${lateToday.length > 1 ? 's' : ''} clocked in late today: ${lateToday.map(a => a.staff?.fullName).join(', ')}.`,
          color: '#f57f17', bg: '#fff8e1', icon: '⏰',
          date: new Date().toISOString(),
        });
      }

      if (absentCount > 0) {
        generated.push({
          id: 'absent_today',
          type: 'alert',
          tag: 'Attendance',
          title: 'Absent Today',
          body: `${absentCount} staff member${absentCount > 1 ? 's have' : ' has'} not clocked in today.`,
          color: '#c62828', bg: '#fce4ec', icon: '🚫',
          date: new Date().toISOString(),
        });
      }

      setAlerts(generated.filter(a => !dismissedAlerts.includes(a.id)));
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  const persist = (updated) => {
    setMessages(updated);
    saveMessages(updated);
  };

  const handleCompose = () => {
    if (!form.title.trim()) return;
    const newMsg = {
      id: `msg_${Date.now()}`,
      type: 'message',
      tag: form.tag,
      title: form.title,
      body: form.body,
      read: false,
      pinned: false,
      date: new Date().toISOString(),
      color: '#5c3d8f', bg: '#ede8f5', icon: '💬',
    };
    persist([newMsg, ...messages]);
    setForm({ title: '', body: '', tag: 'General' });
    setShowCompose(false);
  };

  const toggleRead = (id) => {
    persist(messages.map(m => m.id === id ? { ...m, read: !m.read } : m));
  };

  const togglePin = (id) => {
    persist(messages.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));
  };

  const deleteMsg = (id) => {
    persist(messages.filter(m => m.id !== id));
  };

  const markAllRead = () => {
    persist(messages.map(m => ({ ...m, read: true })));
  };

  const clearRead = () => {
    persist(messages.filter(m => !m.read));
  };

  const dismissAlert = (id) => {
    const updated = [...dismissedAlerts, id];
    setDismissedAlerts(updated);
    localStorage.setItem('hrms_dismissed_alerts', JSON.stringify(updated));
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const tags = ['General', 'HR', 'Finance', 'Operations', 'Reminder'];
  const filterTabs = ['All', 'Unread', 'Pinned', 'Messages', 'Alerts'];

  const sortedMessages = [...messages].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.date) - new Date(a.date);
  });

  const allItems = [
    ...(filter === 'Messages' ? [] : alerts.map(a => ({ ...a, type: 'alert' }))),
    ...(filter === 'Alerts' ? [] : sortedMessages),
  ];

  const filtered = allItems.filter(item => {
    if (filter === 'Unread') return item.type === 'alert' || !item.read;
    if (filter === 'Pinned') return item.pinned;
    if (filter === 'Messages') return item.type === 'message';
    if (filter === 'Alerts') return item.type === 'alert';
    return true;
  });

  const unreadCount = messages.filter(m => !m.read).length + alerts.length;

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const tagStyle = (tag) => {
    const map = {
      General: { bg: '#ede8f5', color: '#5c3d8f' },
      HR: { bg: '#e3f2fd', color: '#1565c0' },
      Finance: { bg: '#fffde7', color: '#c9a84c' },
      Operations: { bg: '#e8f5e9', color: '#2e7d32' },
      Reminder: { bg: '#fff8e1', color: '#f57f17' },
      Tasks: { bg: '#fce4ec', color: '#c62828' },
      Payroll: { bg: '#fff8e1', color: '#f57f17' },
      Inventory: { bg: '#fce4ec', color: '#c62828' },
      Attendance: { bg: '#fff8e1', color: '#f57f17' },
    };
    const s = map[tag] || { bg: '#ede8f5', color: '#5c3d8f' };
    return { background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 };
  };

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
          <h1 style={{ ...styles.title, fontSize: isSmall ? 22 : 26 }}>
            Messages & Alerts
            {unreadCount > 0 && (
              <span style={styles.unreadBadge}>{unreadCount}</span>
            )}
          </h1>
          <p style={styles.subtitle}>{alerts.length} active alerts · {messages.filter(m => !m.read).length} unread messages</p>
        </div>
        <button style={{ ...styles.addBtn, width: isSmall ? '100%' : 'auto' }} onClick={() => setShowCompose(true)}>
          ✏️ Compose
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
          { label: 'Total Messages', value: messages.length, color: '#5c3d8f', bg: '#ede8f5' },
          { label: 'Unread', value: messages.filter(m => !m.read).length, color: '#c62828', bg: '#fce4ec' },
          { label: 'Pinned', value: messages.filter(m => m.pinned).length, color: '#c9a84c', bg: '#fffde7' },
          { label: 'Active Alerts', value: alerts.length, color: '#f57f17', bg: '#fff8e1' },
        ].map((s, i) => (
          <div key={i} style={{ ...styles.statCard, background: s.bg, borderColor: s.color + '33' }}>
            <div style={{ fontSize: isSmall ? 22 : 26, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs + Actions */}
      <div style={{
        display: 'flex',
        flexDirection: isSmall ? 'column' : 'row',
        alignItems: isSmall ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filterTabs.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              ...styles.filterBtn,
              background: filter === f ? '#5c3d8f' : '#fff',
              color: filter === f ? '#fff' : '#888',
              border: `1px solid ${filter === f ? '#5c3d8f' : '#e0d8f0'}`,
            }}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.actionBtn} onClick={markAllRead}>✓ Mark All Read</button>
          <button style={{ ...styles.actionBtn, color: '#c62828', borderColor: '#fce4ec' }} onClick={clearRead}>🗑 Clear Read</button>
        </div>
      </div>

      {/* Message List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#ccc', background: '#fff', borderRadius: 16, border: '1px solid #ede8f5' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 14 }}>No messages here</div>
          </div>
        ) : (
          filtered.map(item => {
            const isAlert = item.type === 'alert';
            const isUnread = !isAlert && !item.read;

            return (
              <div key={item.id} style={{
                ...styles.msgCard,
                borderLeft: `4px solid ${item.color}`,
                background: isUnread ? '#fdfbff' : '#fff',
                opacity: isAlert ? 1 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: item.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18, flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: isUnread ? 700 : 600, color: '#2d1b4e' }}>{item.title}</span>
                      {item.pinned && <span style={{ fontSize: 11, color: '#c9a84c' }}>📌 Pinned</span>}
                      {isUnread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c62828', display: 'inline-block' }} />}
                      <span style={tagStyle(item.tag)}>{item.tag}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#666', margin: '0 0 6px', lineHeight: 1.5 }}>{item.body}</p>
                    <div style={{ fontSize: 11, color: '#bbb' }}>{formatDate(item.date)}</div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: isSmall ? 'row' : 'column', gap: 6, flexShrink: 0 }}>
                    {isAlert ? (
                      <button style={styles.dismissBtn} onClick={() => dismissAlert(item.id)}>Dismiss</button>
                    ) : (
                      <>
                        <button
                          style={{ ...styles.iconBtn, color: item.read ? '#abf0a5' : '#5c3d8f', title: 'Mark read' }}
                          onClick={() => toggleRead(item.id)}
                          title={item.read ? 'Mark unread' : 'Mark read'}
                        >
                          {item.read ? '○' : '●'}
                        </button>
                        <button
                          style={{ ...styles.iconBtn,
                             color: item.pinned ? '#c9a84c' : '#ccc' }}
                          onClick={() => togglePin(item.id)}
                          title={item.pinned ? 'Unpin' : 'Pin'}
                        >
                          📌
                        </button>
                        <button
                          style={{ ...styles.iconBtn, color: '#c62828' }}
                          onClick={() => deleteMsg(item.id)}
                          title='Delete'
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, padding: isSmall ? 20 : 32 }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Compose Message</h2>
              <button style={styles.closeBtn} onClick={() => setShowCompose(false)}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Title</label>
              <input
                style={styles.input}
                placeholder='e.g. Team meeting reminder'
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.formLabel}>Message</label>
              <textarea
                rows={4}
                style={{ ...styles.input, resize: 'vertical' }}
                placeholder='Write your message here...'
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={styles.formLabel}>Tag / Category</label>
              <select style={styles.input} value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })}>
                {tags.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowCompose(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleCompose}>Send Message</button>
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
  title: { fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif', margin: 0, display: 'flex', alignItems: 'center', gap: 10 },
  unreadBadge: { background: '#c62828', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '2px 8px', fontFamily: 'inherit' },
  subtitle: { color: '#999', marginTop: 4, fontSize: 13 },
  addBtn: { background: '#5c3d8f', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  statCard: { padding: '16px', borderRadius: 12, border: '1px solid', textAlign: 'center' },
  filterBtn: { padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer' },
  actionBtn: { padding: '7px 14px', borderRadius: 8, border: '1px solid #e0d8f0', background: '#fff', color: '#5c3d8f', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  msgCard: { background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #ede8f5', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  iconBtn: { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', padding: '4px', lineHeight: 1 },
  dismissBtn: { padding: '5px 12px', borderRadius: 7, border: '1px solid #ede8f5', background: '#faf8ff', color: '#888', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' },
  formLabel: { display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0d8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', color: '#888', fontWeight: 600, cursor: 'pointer' },
  saveBtn: { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#5c3d8f', color: '#fff', fontWeight: 600, cursor: 'pointer' },
};

export default MessagesPage;