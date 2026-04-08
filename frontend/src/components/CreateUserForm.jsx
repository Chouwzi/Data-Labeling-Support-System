import { useState } from 'react';
import { UserPlus, Mail, User, Lock, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; 
import './CreateUserForm.css';

const ROLES = [
  { value: '', label: 'Select a role' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ANNOTATOR', label: 'Annotator' },
  { value: 'REVIEWER', label: 'Reviewer' },
];

export default function CreateUserForm({ onSuccess }) {
  const { user } = useAuth();
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
    if (submitError) setSubmitError('');
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
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setSubmitError("Phiên đăng nhập đã hết hạn.");
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');

    const payload = {
      email: formData.email.trim(),
      full_name: formData.fullName.trim(),
      password: formData.password,
      role: formData.role,
      active: true
    };

    try {
      const response = await fetch('http://localhost:8080/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.accessToken || localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload),
      });

      // Nếu server không phản hồi JSON (lỗi 500 nặng), fetch sẽ nhảy xuống catch
      const data = await response.json();

      if (!response.ok) {
        // --- Xử lý LTJ-137: Email trùng ---
        if (data.message === "USER_ALREADY_EXISTS") {
          setErrors(prev => ({
            ...prev,
            email: 'Email này đã tồn tại trong hệ thống. Vui lòng dùng email khác!'
          }));
          return; 
        }
        throw new Error(data.message || "Có lỗi xảy ra");
      }

      alert("Tạo tài khoản thành công!");
      if (onSuccess) onSuccess(data);
      setFormData({ email: '', fullName: '', password: '', role: '' });

    } catch (err) {
      // Khi Backend chưa bật, nó sẽ nhảy vào đây và hiện "Failed to fetch" lên UI của Trang
      setSubmitError(err.message === "Failed to fetch" ? "Không thể kết nối tới Server (BE). Trang đã bật Backend chưa?" : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.email && formData.fullName && formData.password && formData.role;

  return (
    <form className="create-user-form" onSubmit={handleSubmit} noValidate>
      {submitError && <div className="form-field__error-banner">{submitError}</div>}

      {/* Email Field */}
      <div className="form-field">
        <label className="form-field__label" htmlFor="email">
          <Mail size={16} /> Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className={`form-field__input ${errors.email ? 'form-field__input--error' : ''}`}
          placeholder="user@example.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        {errors.email && <p className="form-field__error">{errors.email}</p>}
      </div>

      {/* Full Name Field */}
      <div className="form-field">
        <label className="form-field__label" htmlFor="fullName">
          <User size={16} /> Full Name
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          className={`form-field__input ${errors.fullName ? 'form-field__input--error' : ''}`}
          placeholder="Enter full name"
          value={formData.fullName}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        {errors.fullName && <p className="form-field__error">{errors.fullName}</p>}
      </div>

      {/* Password Field */}
      <div className="form-field">
        <label className="form-field__label" htmlFor="password">
          <Lock size={16} /> Temporary Password
        </label>
        <div className="form-field__password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            className={`form-field__input ${errors.password ? 'form-field__input--error' : ''}`}
            placeholder="Min. 8 characters"
            value={formData.password}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="form-field__password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <p className="form-field__error">{errors.password}</p>}
      </div>

      {/* Role Field */}
      <div className="form-field">
        <label className="form-field__label" htmlFor="role">
          <Shield size={16} /> Role
        </label>
        <select
          id="role"
          name="role"
          className={`form-field__select ${errors.role ? 'form-field__input--error' : ''}`}
          value={formData.role}
          onChange={handleChange}
          disabled={isSubmitting}
        >
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
        {errors.role && <p className="form-field__error">{errors.role}</p>}
      </div>

      <button
        type="submit"
        className={`create-user-form__submit ${isSubmitting ? 'loading' : ''}`}
        disabled={!isFormValid || isSubmitting}
      >
        {isSubmitting ? "Creating..." : "Create Account"}
      </button>
    </form>
  );
}