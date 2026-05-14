import { useState, useEffect } from 'react';
import { getAllStaff } from '../services/staffService';
import { getAllAttendance } from '../services/attendanceService';
import { getAllTasks } from '../services/taskService';
import { getAllPayroll } from '../services/payrollService';
import { getAllPerformance } from '../services/performanceService';
import { getAllLists } from '../services/inventoryService';
import { useNavigate } from 'react-router-dom';
import useWindowSize from '../hooks/useWindowSize';

function DashboardPage() {
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();
  const isSmall = isMobile || isTablet;
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [staffRes, attendanceRes, tasksRes, payrollRes, performanceRes, inventoryRes] = await Promise.all([
        getAllStaff(),
        getAllAttendance(),
        getAllTasks(),
        getAllPayroll(),
        getAllPerformance(),
        getAllLists(),
      ]);
      setStaff(staffRes.data);
      setAttendance(attendanceRes.data);
      setTasks(tasksRes.data);
      setPayroll(payrollRes.data);
      setPerformance(performanceRes.data);
      setInventory(inventoryRes.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const todayAttendance = attendance.filter(a => a.date?.slice(0, 10) === today);
  const presentToday = todayAttendance.filter(a => a.status === 'Present').length;
  const lateToday = todayAttendance.filter(a => a.status === 'Late').length;
  const absentToday = staff.length - todayAttendance.length;

  const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const overdueTasks = tasks.filter(t => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < new Date());

  const totalPayroll = payroll.reduce((sum, p) => sum + (p.netPay || 0), 0);
  const pendingPayroll = payroll.filter(p => p.status === 'Pending').length;

  const avgKpi = performance.length
    ? Math.round(performance.reduce((sum, r) => sum + r.kpiScore, 0) / performance.length)
    : 0;

  const lowStockItems = inventory.filter(l => l.totalRemaining < l.totalItems * 0.2 && l.totalItems > 0);

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2);

  const greeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={{ ...styles.page, padding: isSmall ? '8px 16px 24px' : '40px' }}>

      {/* Welcome Header */}
      <div style={{
        ...styles.welcomeBox,
        flexDirection: 'column',
        alignItems: isSmall ? 'center' : 'flex-start',
        padding: isSmall ? '20px 20px' : '28px 32px',
        gap: 16,
        textAlign: isSmall ? 'center' : 'left',
      }}>
        <div style={{ width: '100%' }}>
          <h1 style={{ ...styles.welcomeTitle, fontSize: isSmall ? 20 : 26 }}>{greeting()}, Admin 👋</h1>
          <p style={styles.welcomeDate}>{formatDate()}</p>
        </div>
        <div style={{
          ...styles.welcomeStats,
          width: '100%',
          justifyContent: isSmall ? 'space-around' : 'flex-start',
          gap: isSmall ? 0 : 24,
        }}>
          <div style={styles.welcomeStat}>
            <span style={{ ...styles.welcomeStatNum, fontSize: isSmall ? 22 : 26 }}>{staff.filter(s => s.status === 'Active').length}</span>
            <span style={styles.welcomeStatLabel}>Active Staff</span>
          </div>
          <div style={styles.welcomeDivider} />
          <div style={styles.welcomeStat}>
            <span style={{ ...styles.welcomeStatNum, fontSize: isSmall ? 22 : 26 }}>{tasks.filter(t => t.status === 'Done').length}</span>
            <span style={styles.welcomeStatLabel}>Tasks Done</span>
          </div>
          <div style={styles.welcomeDivider} />
          <div style={styles.welcomeStat}>
            <span style={{ ...styles.welcomeStatNum, fontSize: isSmall ? 22 : 26, color: overdueTasks.length > 0 ? '#c62828' : '#2e7d32' }}>{overdueTasks.length}</span>
            <span style={styles.welcomeStatLabel}>Overdue</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? 10 : 16,
        marginBottom: 16,
      }}>
        {[
          { label: 'Total Staff', value: staff.length, sub: `${staff.filter(s => s.status === 'Active').length} active`, color: '#5c3d8f', bg: '#ede8f5', path: '/staff' },
          { label: 'Present Today', value: presentToday, sub: `${lateToday} late · ${absentToday} absent`, color: '#2e7d32', bg: '#e8f5e9', path: '/attendance' },
          { label: 'Pending Tasks', value: pendingTasks, sub: `${inProgressTasks} in progress`, color: '#f57f17', bg: '#fff8e1', path: '/tasks' },
          { label: 'Monthly Payroll', value: `GH₵ ${totalPayroll.toLocaleString()}`, sub: `${pendingPayroll} pending payment`, color: '#1565c0', bg: '#e3f2fd', path: '/payroll' },
          { label: 'Avg KPI Score', value: `${avgKpi}%`, sub: `${performance.length} reviews`, color: '#c9a84c', bg: '#fffde7', path: '/performance' },
          { label: 'Inventory Lists', value: inventory.length, sub: `${lowStockItems.length} low stock`, color: lowStockItems.length > 0 ? '#c62828' : '#5c3d8f', bg: lowStockItems.length > 0 ? '#fce4ec' : '#ede8f5', path: '/inventory' },
        ].map((s, i) => (
          <div key={i} onClick={() => navigate(s.path)} style={{
            ...styles.statCard,
            background: s.bg,
            borderColor: s.color + '33',
            cursor: 'pointer',
            padding: isMobile ? '14px 16px' : '20px 24px',
          }}>
            <div style={{ fontSize: isMobile ? 10 : 11, color: s.color, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
            <div style={{ fontSize: isMobile ? 10 : 12, color: s.color + 'aa', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2 — Recent Tasks & Alerts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr',
        gap: 16,
        marginBottom: 16,
      }}>

        {/* Recent Tasks */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Recent Tasks</h3>
            <button style={styles.seeAll} onClick={() => navigate('/tasks')}>See all →</button>
          </div>
          {tasks.slice(0, 4).map(task => {
            const isOverdue = task.status !== 'Done' && task.dueDate && new Date(task.dueDate) < new Date();
            return (
              <div key={task._id} style={styles.taskRow}>
                <div style={{ width: 3, height: 40, borderRadius: 2, background: task.status === 'Done' ? '#2e7d32' : task.status === 'In Progress' ? '#1565c0' : isOverdue ? '#c62828' : '#f57f17', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...styles.taskTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                  <div style={styles.taskMeta}>
                    {task.assignedTo?.fullName} · Due {task.dueDate?.slice(0, 10) || '—'}
                    {isOverdue && <span style={styles.overdueBadge}>Overdue</span>}
                  </div>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, flexShrink: 0,
                  background: task.status === 'Done' ? '#e8f5e9' : task.status === 'In Progress' ? '#e3f2fd' : '#fff8e1',
                  color: task.status === 'Done' ? '#2e7d32' : task.status === 'In Progress' ? '#1565c0' : '#f57f17',
                }}>{task.status}</span>
              </div>
            );
          })}
          {tasks.length === 0 && <div style={styles.empty}>No tasks yet</div>}
        </div>

        {/* Alerts */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Alerts</h3>
          </div>

          {overdueTasks.length > 0 && (
            <>
              <div style={styles.alertSection}>🔴 Overdue Tasks</div>
              {overdueTasks.slice(0, 3).map(t => (
                <div key={t._id} style={styles.alertRow}>
                  <div style={styles.alertDot} />
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.alertTitle}>{t.title}</div>
                    <div style={styles.alertSub}>Assigned to {t.assignedTo?.fullName} · Due {t.dueDate?.slice(0, 10)}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {pendingPayroll > 0 && (
            <>
              <div style={{ ...styles.alertSection, color: '#f57f17' }}>🟡 Pending Payroll</div>
              <div style={styles.alertRow}>
                <div style={{ ...styles.alertDot, background: '#f57f17' }} />
                <div>
                  <div style={styles.alertTitle}>{pendingPayroll} payroll record{pendingPayroll > 1 ? 's' : ''} unpaid</div>
                  <div style={styles.alertSub}>Mark them as paid in Payroll module</div>
                </div>
              </div>
            </>
          )}

          {lowStockItems.length > 0 && (
            <>
              <div style={{ ...styles.alertSection, color: '#c62828' }}>📦 Low Stock</div>
              {lowStockItems.slice(0, 3).map(l => (
                <div key={l._id} style={styles.alertRow}>
                  <div style={{ ...styles.alertDot, background: '#c62828' }} />
                  <div>
                    <div style={styles.alertTitle}>{l.projectName}</div>
                    <div style={styles.alertSub}>Only {l.totalRemaining} items remaining</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {overdueTasks.length === 0 && pendingPayroll === 0 && lowStockItems.length === 0 && (
            <div style={styles.empty}>✅ No alerts — everything looks good!</div>
          )}
        </div>

      </div>

      {/* Row 3 — Staff Overview & Today's Attendance */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr',
        gap: 16,
        marginBottom: 16,
      }}>

        {/* Staff Overview */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Staff Overview</h3>
            <button style={styles.seeAll} onClick={() => navigate('/staff')}>See all →</button>
          </div>
          {staff.slice(0, 6).map(s => (
            <div key={s._id} style={styles.staffRow}>
              <div style={styles.avatar}>{getInitials(s.fullName)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.staffName}>{s.fullName}</div>
                <div style={{ ...styles.staffRole, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.role} · {s.department}</div>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, flexShrink: 0,
                background: s.status === 'Active' ? '#e8f5e9' : s.status === 'On Leave' ? '#fff8e1' : '#fce4ec',
                color: s.status === 'Active' ? '#2e7d32' : s.status === 'On Leave' ? '#f57f17' : '#c62828',
              }}>{s.status}</span>
            </div>
          ))}
          {staff.length === 0 && <div style={styles.empty}>No staff yet</div>}
        </div>

        {/* Today's Attendance */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Today's Attendance</h3>
            <button style={styles.seeAll} onClick={() => navigate('/attendance')}>See all →</button>
          </div>
          <div style={styles.attStats}>
            {[
              { label: 'Present', value: presentToday, color: '#2e7d32', bg: '#e8f5e9' },
              { label: 'Late', value: lateToday, color: '#f57f17', bg: '#fff8e1' },
              { label: 'Absent', value: absentToday, color: '#c62828', bg: '#fce4ec' },
            ].map((s, i) => (
              <div key={i} style={{ ...styles.attCard, background: s.bg }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {todayAttendance.slice(0, 4).map(a => (
            <div key={a._id} style={styles.staffRow}>
              <div style={styles.avatar}>{getInitials(a.staff?.fullName)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.staffName}>{a.staff?.fullName}</div>
                <div style={styles.staffRole}>In: {a.clockIn} · Out: {a.clockOut || '—'}</div>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, flexShrink: 0,
                background: a.status === 'Present' ? '#e8f5e9' : '#fff8e1',
                color: a.status === 'Present' ? '#2e7d32' : '#f57f17',
              }}>{a.status}</span>
            </div>
          ))}
          {todayAttendance.length === 0 && <div style={styles.empty}>No attendance logged today</div>}
        </div>

      </div>

    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f0eb' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#5c3d8f' },
  welcomeBox: { background: '#2d1b4e', borderRadius: 16, marginBottom: 16, display: 'flex' },
  welcomeTitle: { fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', margin: 0 },
  welcomeDate: { color: '#9b7fc7', marginTop: 4, fontSize: 14 },
  welcomeStats: { display: 'flex', alignItems: 'center' },
  welcomeStat: { textAlign: 'center' },
  welcomeStatNum: { display: 'block', fontWeight: 700, color: '#c9a84c', fontFamily: 'Georgia, serif' },
  welcomeStatLabel: { display: 'block', fontSize: 11, color: '#9b7fc7', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' },
  welcomeDivider: { width: 1, height: 40, background: '#3d2860', margin: '0 20px' },
  statCard: { borderRadius: 12, border: '1px solid', transition: 'transform 0.15s' },
  card: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #ede8f5' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  seeAll: { background: 'none', border: 'none', color: '#5c3d8f', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  taskRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f5f0fa' },
  taskTitle: { fontSize: 13, fontWeight: 600, color: '#2d1b4e' },
  taskMeta: { fontSize: 11, color: '#aaa', marginTop: 2 },
  overdueBadge: { background: '#fce4ec', color: '#c62828', padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 6 },
  staffRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#ede8f5', color: '#5c3d8f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, fontFamily: 'Georgia, serif', flexShrink: 0 },
  staffName: { fontSize: 13, fontWeight: 600, color: '#2d1b4e' },
  staffRole: { fontSize: 11, color: '#aaa', marginTop: 2 },
  attStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 },
  attCard: { padding: '12px', borderRadius: 10, textAlign: 'center' },
  alertSection: { fontSize: 12, fontWeight: 700, color: '#c62828', marginBottom: 10, marginTop: 8 },
  alertRow: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  alertDot: { width: 8, height: 8, borderRadius: '50%', background: '#c62828', flexShrink: 0, marginTop: 4 },
  alertTitle: { fontSize: 13, fontWeight: 600, color: '#2d1b4e' },
  alertSub: { fontSize: 11, color: '#aaa', marginTop: 2 },
  empty: { textAlign: 'center', color: '#ccc', fontSize: 13, padding: '20px 0' },
};

export default DashboardPage;