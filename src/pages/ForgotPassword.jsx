import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/api';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleNextStep1 = async (e) => {
    e.preventDefault();
    if (emailOrPhone.trim()) {
      setIsLoading(true);
      try {
        await authService.forgotPassword(emailOrPhone);
        setStep(2);
        setCountdown(60); // Start 60s countdown
      } catch (err) {
        showToast(err.message, true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNextStep2 = async (e) => {
    e.preventDefault();
    if (otp.join('').length === 6) {
      setIsLoading(true);
      try {
        await authService.verifyOtp(emailOrPhone, otp.join(''));
        setStep(3);
      } catch (err) {
        showToast(err.message, true);
      } finally {
        setIsLoading(false);
      }
    } else {
      showToast("Vui lòng nhập đủ 6 số OTP!", true);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    try {
      await authService.forgotPassword(emailOrPhone);
      setCountdown(60);
      showToast('Đã gửi lại mã OTP!');
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword === confirmPassword) {
      setIsLoading(true);
      try {
        await authService.resetPassword(emailOrPhone, newPassword);
        showToast("Cập nhật mật khẩu thành công!");
        navigate('/login');
      } catch (err) {
        showToast(err.message, true);
      } finally {
        setIsLoading(false);
      }
    } else {
      showToast("Mật khẩu không khớp!", true);
    }
  };

  return (
    <div className="auth-page-container dark-theme" style={{ colorScheme: 'dark' }}>
      <Link to="/login" className="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg> Quay lại
      </Link>

      <div className="logo-section">
        <div className="logo-wrapper">
          <Link to="/" className="logo">
            <img src="/images/only_logo.png" alt="Nighthub Logo" />
          </Link>
        </div>
      </div>

      <div className="auth-card">
        {step === 1 && (
          <>
            <h2 className="card-title">Quên Mật Khẩu</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '20px', fontSize: '14px' }}>
              Vui lòng nhập Email hoặc Số điện thoại để nhận mã xác thực
            </p>
            <form className="auth-form" onSubmit={handleNextStep1}>
              <div className="input-group">
                <span className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </span>
                <input 
                  type="text" 
                  placeholder="Email" 
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  required 
                />
              </div>
              
              <button type="submit" className="auth-btn-submit" style={{ marginTop: '10px' }} disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Tiếp Tục'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="card-title">Xác Thực OTP</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '20px', fontSize: '14px' }}>
              Mã xác nhận gồm 6 số đã được gửi đến <br /> <strong>{emailOrPhone}</strong>
            </p>
            <form className="auth-form" onSubmit={handleNextStep2}>
              <div className="otp-container" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                {otp.map((data, index) => (
                  <input
                    className="otp-input"
                    type="text"
                    name="otp"
                    maxLength="1"
                    key={index}
                    value={data}
                    onChange={e => handleOtpChange(e.target, index)}
                    onKeyDown={e => handleOtpKeyDown(e, index)}
                    onFocus={e => e.target.select()}
                    style={{
                      width: '45px',
                      height: '55px',
                      fontSize: '24px',
                      textAlign: 'center',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-main)',
                      outline: 'none'
                    }}
                  />
                ))}
              </div>
              
              <button type="submit" className="auth-btn-submit" style={{ marginTop: '10px' }} disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Xác Thực'}
              </button>
              
              <div className="auth-nav-text" style={{ marginTop: '15px' }}>
                Chưa nhận được mã?{' '}
                {countdown > 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>Gửi lại sau {countdown}s</span>
                ) : (
                  <a href="#" onClick={(e) => { e.preventDefault(); handleResendOtp(); }}>Gửi lại</a>
                )}
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="card-title">Mật Khẩu Mới</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '20px', fontSize: '14px' }}>
              Vui lòng tạo mật khẩu mới cho tài khoản của bạn
            </p>
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="input-group" style={{ position: 'relative' }}>
                <span className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </span>
                <input 
                  type={showPwd ? "text" : "password"} 
                  placeholder="Mật khẩu mới" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                  style={{ paddingRight: '40px' }}
                />
                {newPassword.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setShowPwd(!showPwd)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    {showPwd ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                )}
              </div>
              
              <div className="input-group" style={{ position: 'relative' }}>
                <span className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </span>
                <input 
                  type={showConfirmPwd ? "text" : "password"} 
                  placeholder="Xác nhận mật khẩu" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  style={{ paddingRight: '40px' }}
                />
                {confirmPassword.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    {showConfirmPwd ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                )}
              </div>
              
              <button type="submit" className="auth-btn-submit" style={{ marginTop: '10px' }} disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Cập Nhật Mật Khẩu'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
