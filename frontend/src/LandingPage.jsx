import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v18M3 12h18" />
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      title: 'Quản lý dữ liệu',
      description: 'Tổ chức và phân loại dữ liệu gắn nhãn một cách hiệu quả với giao diện trực quan.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: 'Cộng tác nhóm',
      description: 'Nhiều người cùng làm việc trên dự án với hệ thống phân quyền linh hoạt.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      title: 'Kiểm soát chất lượng',
      description: 'Đảm bảo độ chính xác của nhãn với các công cụ review và xác thực.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
      ),
      title: 'Xuất dữ liệu đa dạng',
      description: 'Hỗ trợ nhiều định dạng xuất phù hợp với các framework ML phổ biến.'
    }
  ];

  const steps = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      number: '01',
      title: 'Đăng nhập',
      description: 'Sử dụng tài khoản được cấp phát để truy cập hệ thống'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
      number: '02',
      title: 'Tạo dự án',
      description: 'Thiết lập dự án mới và cấu hình các loại nhãn theo nhu cầu'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
      number: '03',
      title: 'Bắt đầu gắn nhãn',
      description: 'Sử dụng công cụ gắn nhãn và xuất dữ liệu đã hoàn thành'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-brand">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="4" width="40" height="40" rx="10" fill="#006c51" fillOpacity="0.15" stroke="#006c51" strokeWidth="1.5"/>
              <circle cx="16" cy="16" r="5" fill="#006c51"/>
              <circle cx="32" cy="16" r="5" fill="#00a67e"/>
              <circle cx="16" cy="32" r="5" fill="#00a67e"/>
              <circle cx="32" cy="32" r="5" fill="#006c51"/>
            </svg>
            <span className="brand-text">DataLabel Pro</span>
          </div>
          <div className="nav-actions">
            <button className="btn-nav-primary" onClick={() => navigate('/login')}>
              Đăng nhập
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg-gradient" />
        <div className="hero-container">
          <div className="hero-badge">
            <span className="badge-dot" />
            Nền tảng gắn nhãn dữ liệu nội bộ
          </div>
          <h1 className="hero-title">
            Nền tảng gắn nhãn dữ liệu
            <span className="gradient-text"> chính xác cao</span>
          </h1>
          <p className="hero-description">
            Streamline your annotation workflow. Build high-quality datasets for scalable AI models with enterprise-grade tools and collaboration features.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Bắt đầu
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section - Redesigned */}
      <section className="features">
        <div className="features-bg-decoration" />
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Tính năng</span>
            <h2 className="section-title">Mọi thứ bạn cần</h2>
            <p className="section-description">
              Công cụ mạnh mẽ được thiết kế cho đội ngũ làm việc hiệu quả
            </p>
          </div>
          
          <div className="features-showcase">
            {/* Feature 1 & 2 - Top Row */}
            <div className="features-row">
              {features.slice(0, 2).map((feature, index) => (
                <div key={index} className="feature-card-large">
                  <div className="feature-card-inner">
                    <div className="feature-icon-large">
                      {feature.icon}
                    </div>
                    <div className="feature-content">
                      <h3 className="feature-title">{feature.title}</h3>
                      <p className="feature-description">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Feature 3 & 4 - Bottom Row */}
            <div className="features-row">
              {features.slice(2, 4).map((feature, index) => (
                <div key={index} className="feature-card-large">
                  <div className="feature-card-inner">
                    <div className="feature-icon-large">
                      {feature.icon}
                    </div>
                    <div className="feature-content">
                      <h3 className="feature-title">{feature.title}</h3>
                      <p className="feature-description">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section - Redesigned */}
      <section className="workflow">
        <div className="section-container">
          <div className="workflow-header">
            <span className="section-tag">Quy trình</span>
            <h2 className="section-title">3 bước đơn giản</h2>
            <p className="section-description">
              Bắt đầu sử dụng chỉ trong vài phút
            </p>
          </div>
          
          <div className="workflow-timeline">
            {steps.map((step, index) => (
              <div key={index} className="workflow-step">
                <div className="step-connector">
                  <div className="step-line" />
                  <div className="step-circle">
                    {step.icon}
                  </div>
                  <div className="step-number-badge">{step.number}</div>
                </div>
                <div className="step-details">
                  <h4 className="step-title">{step.title}</h4>
                  <p className="step-description">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Workflow Visual */}
          <div className="workflow-visual-container">
            <div className="visual-card">
              <div className="visual-header">
                <div className="visual-dots">
                  <span /><span /><span />
                </div>
                <span className="visual-title">Annotation Tool</span>
              </div>
              <div className="visual-content">
                <div className="mock-tool">
                  <div className="tool-sidebar">
                    <div className="tool-label active">Object</div>
                    <div className="tool-label">Text</div>
                    <div className="tool-label">Region</div>
                    <div className="tool-divider" />
                    <div className="tool-label">Polygon</div>
                    <div className="tool-label">Mask</div>
                  </div>
                  <div className="tool-canvas">
                    <div className="canvas-grid" />
                    <div className="canvas-box" style={{ top: '20%', left: '10%', width: '35%', height: '50%' }}>
                      <span className="box-label">Person</span>
                    </div>
                    <div className="canvas-box" style={{ top: '55%', left: '55%', width: '30%', height: '35%' }}>
                      <span className="box-label">Car</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="nav-brand">
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="4" width="40" height="40" rx="10" fill="#006c51" fillOpacity="0.15" stroke="#006c51" strokeWidth="1.5"/>
                <circle cx="16" cy="16" r="5" fill="#006c51"/>
                <circle cx="32" cy="16" r="5" fill="#00a67e"/>
                <circle cx="16" cy="32" r="5" fill="#00a67e"/>
                <circle cx="32" cy="32" r="5" fill="#006c51"/>
              </svg>
              <span className="brand-text">DataLabel Pro</span>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 DataLabel Pro. Internal use only.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;