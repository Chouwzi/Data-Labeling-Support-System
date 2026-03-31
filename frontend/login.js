/**
 * Login Page - Interactions & Validation
 * Data Labeling Support System
 * Clean SaaS Design (No animations)
 */

(function() {
  'use strict';

  // =============================================
  // DOM Elements
  // =============================================
  const elements = {
    form: document.getElementById('login-form'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    submitBtn: document.getElementById('login-submit'),
    errorMessage: document.getElementById('login-error-message'),
    errorText: document.querySelector('.error-text'),
    togglePasswordBtn: document.querySelector('.toggle-password')
  };

  // =============================================
  // State
  // =============================================
  const state = {
    isPasswordVisible: false,
    isSubmitting: false
  };

  // =============================================
  // Initialize
  // =============================================
  function init() {
    initializeLucideIcons();
    bindEvents();
  }

  // =============================================
  // Lucide Icons Initialization
  // =============================================
  function initializeLucideIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // =============================================
  // Event Bindings
  // =============================================
  function bindEvents() {
    // Form submission
    if (elements.form) {
      elements.form.addEventListener('submit', handleSubmit);
    }

    // Password visibility toggle
    if (elements.togglePasswordBtn) {
      elements.togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }

    // Clear error on input
    bindInputErrorClear();

    // Keyboard navigation
    bindKeyboardNavigation();
  }

  // =============================================
  // Clear Error on Input
  // =============================================
  function bindInputErrorClear() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        hideError();
        input.classList.remove('input-error');
      });
    });
  }

  // =============================================
  // Keyboard Navigation
  // =============================================
  function bindKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Escape clears error
      if (e.key === 'Escape') {
        hideError();
      }
    });
  }

  // =============================================
  // Password Visibility Toggle
  // =============================================
  function togglePasswordVisibility() {
    state.isPasswordVisible = !state.isPasswordVisible;
    
    if (elements.passwordInput) {
      elements.passwordInput.type = state.isPasswordVisible ? 'text' : 'password';
    }
    
    if (elements.togglePasswordBtn) {
      elements.togglePasswordBtn.classList.toggle('active', state.isPasswordVisible);
      elements.togglePasswordBtn.setAttribute('aria-label', 
        state.isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
      );
    }
  }

  // =============================================
  // Form Submission
  // =============================================
  async function handleSubmit(event) {
    event.preventDefault();

    if (state.isSubmitting) return;

    const email = elements.emailInput?.value.trim();
    const password = elements.passwordInput?.value;

    // Validate inputs
    if (!validateInputs(email, password)) {
      return;
    }

    // Set loading state
    setLoadingState(true);

    try {
      // Simulate API call - Replace with actual API endpoint
      await simulateLogin(email, password);
      
      // Success
      onLoginSuccess();
    } catch (error) {
      onLoginError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoadingState(false);
    }
  }

  // =============================================
  // Validation
  // =============================================
  function validateInputs(email, password) {
    // Email validation
    if (!email) {
      showError('Vui lòng nhập địa chỉ email.');
      highlightError(elements.emailInput);
      return false;
    }

    if (!isValidEmail(email)) {
      showError('Địa chỉ email không hợp lệ.');
      highlightError(elements.emailInput);
      return false;
    }

    // Password validation
    if (!password) {
      showError('Vui lòng nhập mật khẩu.');
      highlightError(elements.passwordInput);
      return false;
    }

    if (password.length < 6) {
      showError('Mật khẩu phải có ít nhất 6 ký tự.');
      highlightError(elements.passwordInput);
      return false;
    }

    return true;
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // =============================================
  // API Simulation
  // =============================================
  function simulateLogin(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Demo: Accept any valid format email with password >= 6 chars
        if (email && password.length >= 6) {
          resolve({ success: true });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1500);
    });
  }

  // =============================================
  // Login States
  // =============================================
  function setLoadingState(isLoading) {
    state.isSubmitting = isLoading;
    
    if (elements.submitBtn) {
      elements.submitBtn.disabled = isLoading;
      elements.submitBtn.classList.toggle('loading', isLoading);
    }
  }

  function onLoginSuccess() {
    // Show success feedback
    if (elements.submitBtn) {
      elements.submitBtn.innerHTML = `
        <svg class="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width: 20px; height: 20px;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span class="btn-text">Đăng nhập thành công!</span>
      `;
      elements.submitBtn.style.background = '#10b981';
    }
    
    // Redirect (example)
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1000);
  }

  function onLoginError(message) {
    showError(message);
  }

  // =============================================
  // Error Display
  // =============================================
  function showError(message) {
    if (elements.errorMessage && elements.errorText) {
      elements.errorText.textContent = message;
      elements.errorMessage.classList.add('visible');
      
      // Re-initialize icon
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  function hideError() {
    if (elements.errorMessage) {
      elements.errorMessage.classList.remove('visible');
    }
  }

  function highlightError(input) {
    if (input) {
      input.classList.add('input-error');
    }
  }

  // =============================================
  // Initialize on DOM Ready
  // =============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
