import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/styles/global.css';
import App from '@/App';

import React from 'react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Global Error Caught:", error, info);
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', background: '#991b1b', color: '#fef2f2', height: '100vh', width: '100vw', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>A Critical Error Occurred</h1>
          <p>Please share this error message to fix the crash:</p>
          <pre style={{ background: '#7f1d1d', padding: '15px', borderRadius: '8px', overflow: 'auto', marginTop: '15px' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <pre style={{ background: '#7f1d1d', padding: '15px', borderRadius: '8px', overflow: 'auto', marginTop: '15px', fontSize: '12px' }}>
            {this.state.info && this.state.info.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  </StrictMode>
);
