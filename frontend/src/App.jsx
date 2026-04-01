import React, { useState } from 'react';
import './App.css';
import LandingPage from './LandingPage';
import Login from './Login';

function App() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      {showLogin ? (
        <div className="App">
          <Login />
        </div>
      ) : (
        <LandingPage onGetStarted={() => setShowLogin(true)} />
      )}
    </>
  );
}

export default App;