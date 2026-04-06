import { useState } from 'react';
import { UserPlus, Mail, User, Lock, Shield } from 'lucide-react';
import './CreateUserForm.css';

const ROLES = [
  { value: '', label: 'Select a role' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ANNOTATOR', label: 'Annotator' },
  { value: 'REVIEWER', label: 'Reviewer' },
];

export default function CreateUserForm({ onSuccess, onSubmit }) {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    role: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }

      if (onSuccess) {
        onSuccess(formData);
      }

      setFormData({ email: '', fullName: '', password: '', role: '' });
    } catch (err) {
      setSubmitError(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.email && formData.fullName && formData.password && formData.role;

  return (
    <form className="create-user-form" onSubmit={handleSubmit} noValidate>
      {/* Email Field */}
      <div className="form-field">
        <label className="form-field__label" htmlFor="email">
          <Mail size={16} />
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className={`form-field__input ${errors.email ? 'form-field__input--error' : ''}`}
          placeholder="user@example.com"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="form-field__error">{errors.email}</p>
        )}
      </div>

      {/* Full Name Field */}
      <div className="form-field">
        <label className="form-field__label" htmlFor="fullName">
          <User size={16} />
          Full Name
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          className={`form-field__input ${errors.fullName ? 'form-field__input--error' : ''}`}
          placeholder="Enter full name"
          value={formData.fullName}
          onChange={handleChange}
          autoComplete="name"
          disabled={isSubmitting}
        />
        {errors.fullName && (
          <p className="form-field__error">{errors.fullName}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="form-field">
        <label className="form-field__label" htmlFor="password">
          <Lock size={16} />
          Temporary Password
        </label>
        <div className="form-field__password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            className={`form-field__input form-field__input--password ${errors.password ? 'form-field__input--error' : ''}`}
            placeholder="Min. 6 characters"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="form-field__password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={isSubmitting}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="form-field__error">{errors.password}</p>
        )}
      </div>

      {/* Role Field */}
      <div className="form-field">
        <label className="form-field__label" htmlFor="role">
          <Shield size={16} />
          Role
        </label>
        <div className="form-field__select-wrapper">
          <select
            id="role"
            name="role"
            className={`form-field__select ${errors.role ? 'form-field__input--error' : ''}`}
            value={formData.role}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <svg className="form-field__select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        {errors.role && (
          <p className="form-field__error">{errors.role}</p>
        )}
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="form-field__error form-field__error--submit">
          {submitError}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className={`create-user-form__submit ${isSubmitting ? 'loading' : ''}`}
        disabled={!isFormValid || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="create-user-form__spinner" />
            <span>Creating Account...</span>
          </>
        ) : (
          <>
            <UserPlus size={18} />
            <span>Create Account</span>
          </>
        )}
      </button>

      <p className="create-user-form__hint">
        Account will be created with temporary credentials
      </p>
    </form>
  );
}
