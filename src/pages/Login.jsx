import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { authService } from '../services/api';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await authService.login(email, password);
      login(data.token, data.user);
      
      // Điều hướng dựa trên vai trò
      if (data.user.role === 'USER') {
        navigate('/');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSocialLogin = async () => {
    setError('');
    try {
      // Gọi API social-login (không cần mật khẩu, tự động đăng nhập TK013)
      const data = await authService.socialLogin();
      login(data.token, data.user);
      
      if (data.user.role === 'USER') {
        navigate('/');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError('Lỗi đăng nhập: ' + err.message);
    }
  };

  return (
    <div className="auth-page-container dark-theme" style={{ colorScheme: 'dark' }}>
      <Link to="/" className="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg> Trang chủ
      </Link>

      <div className="logo-section">
        <div className="logo-wrapper">
          <Link to="/" className="logo">
            <img src="/images/only_logo.png" alt="Nighthub Logo" />
          </Link>
        </div>
      </div>

      <div className="auth-card">
        <h2 className="card-title">Đăng Nhập</h2>
        <form className="auth-form" onSubmit={handleLogin}>
          {error && <div style={{ color: '#ff4b4b', marginBottom: '15px', textAlign: 'center', fontSize: '14px', background: 'rgba(255, 75, 75, 0.1)', padding: '10px', borderRadius: '4px' }}>{error}</div>}
          <div className="input-group">
            <span className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </span>
            <input type="text" placeholder="Email hoặc số điện thoại" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          
          <div className="input-group" style={{ position: 'relative' }}>
            <span className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </span>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Mật khẩu" 
              required 
              style={{ paddingRight: '40px' }} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password.length > 0 && (
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            )}
          </div>
          
          <div className="auth-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <Link to="/forgot-password" className="forgot-pwd-link">Quên mật khẩu?</Link>
          </div>
          
          <button type="submit" className="auth-btn-submit">Đăng Nhập</button>
          
          <div className="divider"><span>Hoặc đăng nhập bằng</span></div>
          
          <div className="social-login">
            <button type="button" className="social-btn fb" onClick={handleSocialLogin}>
              <img src="/images/logo_fb.webp" alt="Facebook Logo" /> Đăng nhập bằng Facebook
            </button>
            <button type="button" className="social-btn gg" onClick={handleSocialLogin}>
              <img src="/images/logo_gg.png" alt="Google Logo" /> Đăng nhập bằng Google
            </button>
            <button type="button" className="social-btn ap" onClick={handleSocialLogin}>
              <img src="/images/logo_apple_white.png" alt="Apple Logo" /> Đăng nhập bằng Apple
            </button>
          </div>
          
          <div className="auth-nav-text">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
