import React from 'react';
import platformImg from './assets/preview.jpg';

function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-container">
      <nav className="navbar">
        <div className="logo-section">
          <span className="logo-text">Data Labeling</span>
        </div>
        <div className="nav-actions">
          <button className="btn-signin-nav" onClick={onGetStarted}>Sign in</button>
          <button className="btn-getstarted-nav" onClick={onGetStarted}>Get Started</button>
        </div>
      </nav>

      <main className="hero-section">
        <h1 className="hero-title">
          High-Precision <span className="purple-text">Data Labeling</span> <br /> 
          for Enterprise AI
        </h1>
        
        <p className="hero-subtitle">
          Streamline your annotation workflow. <br />
          Build high-quality datasets for scalable AI models with Data Labeling.
        </p>
        
        <div className="hero-buttons">
          <button className="btn-pink-solid" onClick={onGetStarted}>Get Started</button>
          <button className="btn-purple-outline">Request a Demo</button>
        </div>

        <div className="platform-preview">
          <img src={platformImg} alt="Data Labeling Platform Overview" />
        </div>
      </main>
    </div>
  );
}

export default LandingPage;