import React from 'react'

function Login() {
  return (
    <div className="login-card">
      <h1 className="project-title">Data Labeling</h1>
      <p className="subtitle">Sign In or Sign Up</p>

      <div className="button-group">
        <button className="login-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" />
          Continue with Google
        </button>

        <button className="login-btn">
          <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="Git" />
          Continue with GitHub
        </button>

        <button className="login-btn email-btn">
          <span>✉</span> Continue with Email
        </button>
      </div>

      <p className="terms-text">
        By continuing, you indicate that you accept our <br />
        <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </p>
    </div>
  )
}

export default Login