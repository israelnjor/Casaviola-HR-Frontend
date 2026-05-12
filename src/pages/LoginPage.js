import { useState } from 'react';
import { login } from '../services/authService';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await login(form);
      localStorage.setItem('casaviola_token', res.data.token);
      localStorage.setItem('casaviola_admin', JSON.stringify(res.data.admin));
      navigate('/');
    } catch (error) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>CV</div>
          <div>
            <div style={styles.logoText}>CasaViola</div>
            <div style={styles.logoSub}>Staff Portal</div>
          </div>
        </div>

        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.subtitle}>Sign in to your admin account</p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.formGroup}>
          <label style={styles.label}>Email Address</label>
          <input
            style={styles.input}
            type='email'
            placeholder='admin@casaviola.com'
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            onKeyPress={handleKeyPress}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type='password'
            placeholder='Enter your password'
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyPress={handleKeyPress}
          />
        </div>

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={styles.footer}>CasaViola Properties · Internal System</p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f0eb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { background: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #ede8f5' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 },
  logoIcon: { width: 44, height: 44, borderRadius: 10, background: '#2d1b4e', color: '#c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, fontFamily: 'Georgia, serif' },
  logoText: { fontWeight: 700, fontSize: 18, color: '#2d1b4e', fontFamily: 'Georgia, serif' },
  logoSub: { fontSize: 11, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: 700, color: '#2d1b4e', fontFamily: 'Georgia, serif', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#999', marginBottom: 24 },
  error: { background: '#fce4ec', color: '#c62828', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #e0d8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '13px', background: '#5c3d8f', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 },
  footer: { textAlign: 'center', fontSize: 12, color: '#ccc', marginTop: 24 },
};

export default LoginPage;