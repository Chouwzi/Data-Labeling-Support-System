import React, { useState } from 'react';
import axios from 'axios';
import './login.css'; 

function Login() {
  
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleLoginRequest = async (provider) => {
    setLoadingProvider(provider);
    
    try {
      
      const response = await axios.post('http://localhost:5000/api/v1/auth/login', {
        authProvider: provider,
        requestedAt: new Date().toISOString()
      });

      console.log("Phản hồi từ Server:", response.data);

      if (response.data && response.data.token) {
        localStorage.setItem('accessToken', response.data.token);
        console.log("Đã lưu JWT Token thành công!");
      }

      alert(`Đăng nhập qua ${provider} thành công!`);
      

    } catch (error) {
      console.error("Lỗi kết nối API:", error);
      
      alert(`Đã gửi yêu cầu đến /api/v1/auth/login, chờ Backend của Chương phản hồi!`);
    } finally {
      
      setLoadingProvider(null);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="page-background">
        <div className="bg-glow"></div>
      </div>

      <main className="login-card">
        <header className="login-header">
          <div className="logo-mark"></div>
          <h1 className="project-title">Data Labeling</h1>
          <p className="subtitle">Sign In or Sign Up</p>
        </header>

        <div className="button-group">
          {/* Nút Google */}
          <button 
            className="login-btn" 
            onClick={() => handleLoginRequest('Google')}
            disabled={loadingProvider !== null}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" />
            <span>{loadingProvider === 'Google' ? "Connecting..." : "Continue with Google"}</span>
          </button>

          {/* Nút GitHub */}
          <button 
            className="login-btn" 
            onClick={() => handleLoginRequest('GitHub')}
            disabled={loadingProvider !== null}
          >
            <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="Git" />
            <span>{loadingProvider === 'GitHub' ? "Connecting..." : "Continue with GitHub"}</span>
          </button>

          {/* Nút Email */}
          <button 
            className="login-btn email-btn" 
            onClick={() => handleLoginRequest('Email')}
            disabled={loadingProvider !== null}
          >
            <span className="icon-mail">✉</span>
            <span>{loadingProvider === 'Email' ? "Sending..." : "Continue with Email"}</span>
          </button>
        </div>

        <footer className="login-footer">
          <p className="terms-text">
            By continuing, you indicate that you accept our <br />
            <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default Login;