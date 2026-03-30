/**
 * Login Page - Interactions & Validation
 * Data Labeling Support System
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
    togglePasswordBtn: document.querySelector('.toggle-password'),
    glassCard: document.querySelector('.glass-card')
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
    addTiltEffect();
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

    // Input focus effects
    bindInputEvents();

    // Clear error on input
    bindInputErrorClear();

    // Magnetic button effect
    bindMagneticEffect();
  }

  // =============================================
  // Input Events
  // =============================================
  function bindInputEvents() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        input.closest('.input-group')?.classList.add('focused');
      });
      
      input.addEventListener('blur', () => {
        input.closest('.input-group')?.classList.remove('focused');
      });
    });
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
      
      // Success - Redirect or callback
      onLoginSuccess();
    } catch (error) {
      // Handle error
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
    // Show success feedback (optional)
    showSuccessAnimation();
    
    // Redirect to dashboard (example)
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
      
      // Remove highlight after animation
      setTimeout(() => {
        input.classList.remove('input-error');
      }, 3000);
    }
  }

  // =============================================
  // Success Animation
  // =============================================
  function showSuccessAnimation() {
    if (elements.submitBtn) {
      elements.submitBtn.innerHTML = `
        <svg class="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Đăng nhập thành công!</span>
      `;
      elements.submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    }
  }

  // =============================================
  // Magnetic Button Effect
  // =============================================
  function bindMagneticEffect() {
    const magneticBtn = document.querySelector('.magnetic-button');
    
    if (!magneticBtn) return;

    const bounds = magneticBtn.getBoundingClientRect();

    function moveMagnetic(e) {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      const x = mouseX - (bounds.left + bounds.width / 2);
      const y = mouseY - (bounds.top + bounds.height / 2);
      
      const percentX = x / (bounds.width / 2);
      const percentY = y / (bounds.height / 2);
      
      const maxMove = 10;
      const moveX = percentX * maxMove;
      const moveY = percentY * maxMove;
      
      magneticBtn.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }

    function resetMagnetic() {
      magneticBtn.style.transform = '';
    }

    magneticBtn.addEventListener('mousemove', moveMagnetic);
    magneticBtn.addEventListener('mouseleave', resetMagnetic);
  }

  // =============================================
  // 3D Tilt Effect
  // =============================================
  function addTiltEffect() {
    const card = elements.glassCard;
    
    if (!card) return;

    let isTiltEnabled = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    
    if (!isTiltEnabled) return;

    card.classList.add('tilt-card');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  }

  // =============================================
  // Keyboard Navigation
  // =============================================
  document.addEventListener('keydown', (e) => {
    // Enter key submits form when not in submit button
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
      elements.form?.dispatchEvent(new Event('submit'));
    }

    // Escape key closes any modals or clears error
    if (e.key === 'Escape') {
      hideError();
    }
  });

  // =============================================
  // Initialize on DOM Ready
  // =============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
