import { useNavigate } from 'react-router-dom';
import BrandLogo from '@/components/common/BrandLogo';
import '@/styles/LandingPage.css';

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
      title: 'Data Management',
      description: 'Organize and categorize labeled data efficiently with an intuitive user interface.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: 'Team Collaboration',
      description: 'Enable simultaneous team access with flexible role-based access control.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      title: 'Quality Control',
      description: 'Ensure label accuracy with high-precision review and validation tools.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
      ),
      title: 'Multi-Format Export',
      description: 'Export annotations in popular ML formats including COCO JSON.'
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
      title: 'Sign In',
      description: 'Sign in to the system with your assigned account.'
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
      title: 'Create Projects',
      description: 'Initialize a new project and configure the label taxonomy.'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
      number: '03',
      title: 'Start Labeling',
      description: 'Leverage our high-speed labeling suite and export completed datasets.'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-brand">
            <BrandLogo size={32} />
            <span className="brand-text">DataLabel Pro</span>
          </div>
          <div className="nav-actions">
            <button className="btn-nav-primary" onClick={() => navigate('/login')}>
              Sign In
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
            Internal Data Labeling Platform
          </div>
          <h1 className="hero-title">
            High-Precision
            <span className="gradient-text"> Data Labeling Platform</span>
          </h1>
          <p className="hero-description">
            Streamline your annotation workflow. Build high-quality datasets for scalable AI models with enterprise-grade tools and collaboration features.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Get Started
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-bg-decoration" />
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Features</span>
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-description">
              Powerful tools designed for productive teams
            </p>
          </div>

          <div className="features-showcase">
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

      {/* Workflow Section */}
      <section className="workflow">
        <div className="section-container">
          <div className="workflow-header">
            <span className="section-tag">Workflow</span>
            <h2 className="section-title">3 Simple Steps</h2>
            <p className="section-description">
              Get started and begin labeling in minutes
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
              <BrandLogo size={28} />
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
