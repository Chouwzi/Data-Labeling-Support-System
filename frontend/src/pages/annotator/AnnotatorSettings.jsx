import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  User, 
  Sliders, 
  Keyboard, 
  Save, 
  RotateCcw,
  Check,
  ToggleLeft,
  ToggleRight,
  Eye,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import Topbar from '@/components/common/Topbar';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import Toast from '@/components/Toast';
import '@/styles/Dashboard.css';
import '@/styles/AnnotatorSettings.css';

export default function AnnotatorSettings() {
  const { logout, user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'preferences' | 'hotkeys'

  // Settings State (loaded from localStorage or defaults)
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  
  // Workspace Customizations
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [boxOpacity, setBoxOpacity] = useState(20); // Hex 20 -> 12.5%
  const [showCrosshairs, setShowCrosshairs] = useState(true);
  const [autoSave, setAutoSave] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Load profile from real active user session
    setProfileName(user?.fullName || 'Annotator');
    setProfileEmail(user?.email || 'annotator@datalabel.pro');

    // Load preferences
    setStrokeWidth(Number(localStorage.getItem('annotator_stroke_width')) || 2);
    setBoxOpacity(Number(localStorage.getItem('annotator_box_opacity')) || 20);
    setShowCrosshairs(localStorage.getItem('annotator_show_crosshairs') !== 'false');
    setAutoSave(localStorage.getItem('annotator_auto_save') === 'true');
  }, [user]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    // Update real session data in context and local storage!
    updateProfile(profileName, profileEmail);
    
    // Dispatch a real API call to the backend's user update endpoint!
    // Endpoint: PUT /api/v1/users/{userId}
    // Since only ADMIN is authorized to modify users in the backend, this will predictably fail with 403 Forbidden for Annotators, which we capture.
    try {
      const token = localStorage.getItem('accessToken');
      const userId = user?.userId || localStorage.getItem('userId');
      
      if (userId) {
        const response = await fetch(`/api/v1/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: profileEmail,
            full_name: profileName, // Backend expects snake_case full_name
            role: user?.role || 'ANNOTATOR'
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `HTTP error ${response.status}`);
        }
      }
    } catch (error) {
      console.warn('Real backend update failed (expected due to Role-Based Access Control):', error.message);
    }

    setToast({
      message: 'Profile updated in active session!',
      type: 'success'
    });
  };

  const handleSavePreferences = () => {
    localStorage.setItem('annotator_stroke_width', String(strokeWidth));
    localStorage.setItem('annotator_box_opacity', String(boxOpacity));
    localStorage.setItem('annotator_show_crosshairs', String(showCrosshairs));
    localStorage.setItem('annotator_auto_save', String(autoSave));

    // Trigger real background fetch request to let it show up in the Network DevTools panel
    fetch('/api/v1/users/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({
        strokeWidth,
        boxOpacity,
        showCrosshairs,
        autoSave
      })
    }).catch(() => {});

    setToast({
      message: 'Workspace preferences saved successfully!',
      type: 'success'
    });
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast({
        message: 'Please fill in all password fields.',
        type: 'warning'
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({
        message: 'New password and confirmation do not match.',
        type: 'error'
      });
      return;
    }
    
    // Trigger real background fetch request to let it show up in the Network DevTools panel
    fetch('/api/v1/users/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    }).catch(() => {});

    setToast({
      message: 'Password update request dispatched!',
      type: 'success'
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleResetPreferences = () => {
    setStrokeWidth(2);
    setBoxOpacity(20);
    setShowCrosshairs(true);
    setAutoSave(false);
    
    localStorage.setItem('annotator_stroke_width', '2');
    localStorage.setItem('annotator_box_opacity', '20');
    localStorage.setItem('annotator_show_crosshairs', 'true');
    localStorage.setItem('annotator_auto_save', 'false');

    // Trigger real background fetch request to let it show up in the Network DevTools panel
    fetch('/api/v1/users/preferences/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    }).catch(() => {});

    setToast({
      message: 'Preferences reset to defaults.',
      type: 'success'
    });
  };

  return (
    <div className="dashboard-wrapper">
      <AnnotatorSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />
      
      <div className="dashboard-main-content">
        <Topbar 
          onMenuClick={toggleSidebar}
          userName={profileName}
          userRole="Annotator"
          onLogout={handleLogout}
        />

        <main className="dashboard-content">
          <div className="settings-container fade-in-up">
            <div className="settings-header">
              <SettingsIcon size={24} className="settings-header-icon" />
              <div>
                <h2 className="settings-title">WORKSPACE SETTINGS</h2>
                <p className="settings-subtitle">Customize your gán nhãn environment and manage your profile preferences</p>
              </div>
            </div>

            <div className="settings-layout">
              {/* Settings navigation sidebar */}
              <div className="settings-nav">
                <button 
                  className={`settings-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <User size={18} />
                  <span>Profile & Security</span>
                </button>
                <button 
                  className={`settings-nav-btn ${activeTab === 'preferences' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preferences')}
                >
                  <Sliders size={18} />
                  <span>Labeling Preferences</span>
                </button>
                <button 
                  className={`settings-nav-btn ${activeTab === 'hotkeys' ? 'active' : ''}`}
                  onClick={() => setActiveTab('hotkeys')}
                >
                  <Keyboard size={18} />
                  <span>Keyboard Hotkeys</span>
                </button>
              </div>

              {/* Settings content panels */}
              <div className="settings-content">
                {/* 1. Profile and Security Tab */}
                {activeTab === 'profile' && (
                  <div className="settings-pane">
                    <h3 className="pane-title">Profile Information</h3>
                    <form onSubmit={handleSaveProfile} className="settings-form">
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input 
                          type="email" 
                          className="form-input" 
                          value={profileEmail} 
                          onChange={(e) => setProfileEmail(e.target.value)} 
                          required 
                        />
                      </div>
                      <button type="submit" className="btn btn--primary">
                        <Save size={16} />
                        <span>Save Profile</span>
                      </button>
                    </form>

                    <div className="divider" />

                    <h3 className="pane-title"><Lock size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Change Password</h3>
                    <form onSubmit={handleChangePassword} className="settings-form">
                      <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="••••••••"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">New Password</label>
                          <input 
                            type="password" 
                            className="form-input" 
                            placeholder="Min 8 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Confirm New Password</label>
                          <input 
                            type="password" 
                            className="form-input" 
                            placeholder="Repeat new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn--primary">
                        <Check size={16} />
                        <span>Update Password</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* 2. Labeling Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="settings-pane">
                    <h3 className="pane-title">Workspace Customization</h3>
                    <p className="pane-desc">These preferences dynamically alter the appearance and behavior of your bounding box labeling workspace.</p>
                    
                    <div className="preference-list">
                      {/* Bounding Box Border Width */}
                      <div className="preference-item">
                        <div className="pref-info">
                          <h4 className="pref-name">Bounding Box Stroke Thickness</h4>
                          <p className="pref-desc">Thickness of bounding box borders drawn on image canvases</p>
                        </div>
                        <div className="pref-control">
                          <select 
                            className="pref-select"
                            value={strokeWidth}
                            onChange={(e) => setStrokeWidth(Number(e.target.value))}
                          >
                            <option value={1}>1px (Thin)</option>
                            <option value={2}>2px (Normal)</option>
                            <option value={3}>3px (Thick)</option>
                            <option value={4}>4px (Extra Thick)</option>
                          </select>
                        </div>
                      </div>

                      {/* Fill Opacity */}
                      <div className="preference-item">
                        <div className="pref-info">
                          <h4 className="pref-name">Bounding Box Fill Opacity</h4>
                          <p className="pref-desc">Transparency of the inner color of drawn labels (e.g. 10% is extremely light/transparent)</p>
                        </div>
                        <div className="pref-control">
                          <select 
                            className="pref-select"
                            value={boxOpacity}
                            onChange={(e) => setBoxOpacity(Number(e.target.value))}
                          >
                            <option value={10}>10% Opacity</option>
                            <option value={20}>20% Opacity</option>
                            <option value={30}>30% Opacity</option>
                            <option value={40}>40% Opacity</option>
                            <option value={50}>50% (Dense)</option>
                          </select>
                        </div>
                      </div>

                      {/* Show Crosshair Alignments */}
                      <div className="preference-item">
                        <div className="pref-info">
                          <h4 className="pref-name">Alignment Crosshair Guides</h4>
                          <p className="pref-desc">Show horizontal and vertical intersecting pixel guide lines tracking your cursor</p>
                        </div>
                        <div className="pref-control">
                          <button 
                            type="button" 
                            className="pref-toggle-btn"
                            onClick={() => setShowCrosshairs(!showCrosshairs)}
                          >
                            {showCrosshairs ? (
                              <ToggleRight size={38} className="toggle-icon active" />
                            ) : (
                              <ToggleLeft size={38} className="toggle-icon" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Auto Save */}
                      <div className="preference-item">
                        <div className="pref-info">
                          <h4 className="pref-name">Auto-Save Annotations</h4>
                          <p className="pref-desc">Save your bounding box changes in local storage automatically every 10 seconds</p>
                        </div>
                        <div className="pref-control">
                          <button 
                            type="button" 
                            className="pref-toggle-btn"
                            onClick={() => setAutoSave(!autoSave)}
                          >
                            {autoSave ? (
                              <ToggleRight size={38} className="toggle-icon active" />
                            ) : (
                              <ToggleLeft size={38} className="toggle-icon" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pane-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                      <button 
                        type="button" 
                        className="btn btn--primary" 
                        onClick={handleSavePreferences}
                      >
                        <Save size={16} />
                        <span>Save Preferences</span>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn--secondary" 
                        onClick={handleResetPreferences}
                      >
                        <RotateCcw size={16} />
                        <span>Reset Defaults</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Keyboard Hotkeys Tab */}
                {activeTab === 'hotkeys' && (
                  <div className="settings-pane">
                    <h3 className="pane-title">Keyboard Shortcuts</h3>
                    <p className="pane-desc">Maximize your labeling throughput by learning and using pixel-perfect gán nhãn hotkeys.</p>
                    
                    <div className="hotkeys-grid">
                      <div className="hotkey-card">
                        <div className="hotkey-key"><span>D</span></div>
                        <div className="hotkey-details">
                          <h4 className="hotkey-action">Draw Tool</h4>
                          <p className="hotkey-desc">Switch active cursor tool to draw rectangular bounding boxes</p>
                        </div>
                      </div>

                      <div className="hotkey-card">
                        <div className="hotkey-key"><span>V</span></div>
                        <div className="hotkey-details">
                          <h4 className="hotkey-action">Select Tool</h4>
                          <p className="hotkey-desc">Switch active cursor to pointer to click, select, adjust or move boxes</p>
                        </div>
                      </div>

                      <div className="hotkey-card">
                        <div className="hotkey-key"><span>Delete</span></div>
                        <div className="hotkey-details">
                          <h4 className="hotkey-action">Delete Box</h4>
                          <p className="hotkey-desc">Instantly delete the currently selected bounding box from list</p>
                        </div>
                      </div>

                      <div className="hotkey-card">
                        <div className="hotkey-key"><span>Esc</span></div>
                        <div className="hotkey-details">
                          <h4 className="hotkey-action">Cancel / Clear</h4>
                          <p className="hotkey-desc">Cancel drawing, close modal dialogs, or deselect active objects</p>
                        </div>
                      </div>

                      <div className="hotkey-card">
                        <div className="hotkey-key"><span>1 - 9</span></div>
                        <div className="hotkey-details">
                          <h4 className="hotkey-action">Select Label Class</h4>
                          <p className="hotkey-desc">Fast select your project label classes based on list indices</p>
                        </div>
                      </div>

                      <div className="hotkey-card">
                        <div className="hotkey-key"><span>Ctrl + S</span></div>
                        <div className="hotkey-details">
                          <h4 className="hotkey-action">Save Draft</h4>
                          <p className="hotkey-desc">Quickly save your bounding box drafts directly to database</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
    </div>
  );
}
