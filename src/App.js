import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import StaffPage from './pages/StaffPage';
import AttendancePage from './pages/AttendancePage';
import TasksPage from './pages/TasksPage';
import PayrollPage from './pages/PayrollPage';
import PerformancePage from './pages/PerformancePage';
import InventoryPage from './pages/InventoryPage';
import InventoryDetailPage from './pages/InventoryDetailPage';
import LoginPage from './pages/LoginPage';
import useWindowSize from './hooks/useWindowSize';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('casaviola_token');
  return token ? children : <Navigate to='/login' />;
};

function AppLayout({ children }) {
  const { isMobile, isTablet } = useWindowSize();
  const isCollapsed = isMobile || isTablet;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{
        marginLeft: isCollapsed ? 0 : 230,
        flex: 1,
        minHeight: '100vh',
        background: '#f5f0eb',
        paddingTop: isCollapsed ? 20 : 0,
        transition: 'margin-left 0.3s ease',
        maxWidth: '100%',
      }}>
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/*' element={
          <PrivateRoute>
            <AppLayout>
              <Routes>
                <Route path='/' element={<DashboardPage />} />
                <Route path='/staff' element={<StaffPage />} />
                <Route path='/attendance' element={<AttendancePage />} />
                <Route path='/tasks' element={<TasksPage />} />
                <Route path='/payroll' element={<PayrollPage />} />
                <Route path='/performance' element={<PerformancePage />} />
                <Route path='/inventory' element={<InventoryPage />} />
                <Route path='/inventory/:listId' element={<InventoryDetailPage />} />
              </Routes>
            </AppLayout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;