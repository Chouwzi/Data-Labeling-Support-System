import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import BrandLogo from './components/BrandLogo';
import './Login.css';

const API_BASE_URL = '/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (value) => {
    if (!value) {
      return { valid: false, message: 'Vui lòng nhập email' };
    }
    if (!EMAIL_REGEX.test(value)) {
      return { valid: false, message: 'Email không hợp lệ' };
    }
    return { valid: true };
  };

  const validatePassword = (value) => {
    if (!value) {
      return { valid: false, message: 'Vui lòng nhập mật khẩu' };
    }
    return { valid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.message);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message);
      return;
    }


    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      if (data.result) {
        login(data.result.accessToken, data.result.user.role, data.result.user.email);
        navigate(from, { replace: true });
      }
    } catch {
      setError('Thông tin không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError('');
  };

  return (
    <main className="login-wrapper">
      <div className="login-card fade-in-up">
        <header className="login-header">
          <div className="logo-mark">
            <BrandLogo size={48} />
          </div>
          <h1 className="login-title">Đăng nhập</h1>
          <p className="login-subtitle">DataLabel Pro</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="error-message visible" role="alert">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-field">
            <div className="input-wrapper">
              <svg
                className="input-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                type="email"
                id="email"
                className={`form-input ${error ? 'has-error' : ''}`}
                placeholder="Email"
                value={email}
                onChange={handleInputChange(setEmail)}
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-field">
            <div className="input-wrapper input-wrapper--with-toggle">
              <svg
                className="input-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`form-input form-input--password ${error ? 'has-error' : ''}`}
                placeholder="Mật khẩu"
                value={password}
                onChange={handleInputChange(setPassword)}
                autoComplete="current-password"
                disabled={loading}
                spellCheck="false"
              />
              <button
                type="button"
                className={`toggle-password ${showPassword ? 'active' : ''}`}
                onClick={togglePassword}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-actions">
            <a
              href="#forgot-password"
              className="link-forgot"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              Quên mật khẩu?
            </a>
          </div>

          <button
            type="submit"
            className={`btn-login ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            <span className="btn-text">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </span>
            <span className="btn-loader">
              <svg className="spinner" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            {!loading && (
              <svg
                className="btn-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
