import { useState, useRef, useEffect } from 'react';
import { Search, Bell, HelpCircle, User, LogOut, Menu, ChevronDown, Check, LifeBuoy, FileText } from 'lucide-react';
import Modal from '@/components/Modal';
import '@/styles/Topbar.css';

export default function Topbar({
  userName = 'Julian Casablancas',
  userRole = 'Senior Administrator',
  userAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  searchPlaceholder = 'Search system configuration...',
  showCenterLinks = false,
  searchValue = '',
  onSearch,
  onMenuClick,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', category: 'bug', desc: '' });
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout?.();
  };

  const handleProfile = () => {
    setMenuOpen(false);
  };

  return (
    <header className="topbar" role="banner">
      <div className="topbar__inner">
        <div className="topbar__left">
          <button
            type="button"
            className="topbar__menu-btn"
            aria-label="Open navigation menu"
            onClick={onMenuClick}
          >
            <Menu size={24} />
          </button>
          <div className="topbar__search">
            <Search size={18} className="topbar__search-icon" />
            <input
              type="text"
              className="topbar__search-input"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>

        {showCenterLinks && (
          <nav className="topbar__center" aria-label="Quick links">
            <a 
              href="#" 
              className="topbar__center-link"
              onClick={(e) => { e.preventDefault(); setSupportOpen(true); }}
            >
              Support
            </a>
            <a 
              href="#" 
              className="topbar__center-link"
              onClick={(e) => { e.preventDefault(); setDocsOpen(true); }}
            >
              Docs
            </a>
          </nav>
        )}

        <div className="topbar__right">
          <div className="topbar__actions">
            <div ref={notifRef} style={{ position: 'relative', display: 'inline-block' }}>
              <button
                type="button"
                className={`topbar__icon-btn ${notifOpen ? 'topbar__icon-btn--active' : ''}`}
                aria-label="Notifications"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell size={20} />
                <span className="topbar__notification-dot" aria-hidden="true" />
              </button>

              {notifOpen && (
                <div className="topbar__notif-dropdown" role="menu">
                  <div className="topbar__notif-header">
                    <h3>Notifications</h3>
                    <button type="button" onClick={() => setNotifOpen(false)}>Mark all as read</button>
                  </div>
                  <div className="topbar__notif-list">
                    <div className="topbar__notif-item unread">
                      <div className="topbar__notif-icon success">✓</div>
                      <div className="topbar__notif-content">
                        <p>Project <strong>Visual-QA-Alpha</strong> reached 100% completion</p>
                        <span>10 minutes ago</span>
                      </div>
                    </div>
                    <div className="topbar__notif-item unread">
                      <div className="topbar__notif-icon info">i</div>
                      <div className="topbar__notif-content">
                        <p><strong>Maya L.</strong> submitted 48 labels for review</p>
                        <span>35 minutes ago</span>
                      </div>
                    </div>
                    <div className="topbar__notif-item">
                      <div className="topbar__notif-icon warning">!</div>
                      <div className="topbar__notif-content">
                        <p><strong>Medical Imaging V2</strong> paused — awaiting validation</p>
                        <span>1 hour ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              type="button" 
              className="topbar__icon-btn" 
              aria-label="Help"
              onClick={() => setHelpOpen(true)}
            >
              <HelpCircle size={20} />
            </button>
          </div>

          <div className="topbar__divider" aria-hidden="true" />

          <div className="topbar__user" ref={menuRef}>
            <div className="topbar__user-info">
              <p className="topbar__user-name">{userName}</p>
              <p className="topbar__user-role">{userRole}</p>
            </div>
            <button
              type="button"
              className="topbar__avatar-btn"
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Account menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <img alt="" className="topbar__avatar" src={userAvatar} />
              <ChevronDown size={14} className="topbar__chevron" />
            </button>

            {menuOpen && (
              <div className="topbar__dropdown" role="menu">
                <button
                  type="button"
                  className="topbar__dropdown-item"
                  role="menuitem"
                  onClick={handleProfile}
                >
                  <User size={18} />
                  Profile
                </button>
                <button
                  type="button"
                  className="topbar__dropdown-item topbar__dropdown-item--danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Docs Modal */}
      <Modal isOpen={docsOpen} onClose={() => setDocsOpen(false)} title="System Documentation & Guides">
        <div style={{ fontFamily: 'Inter, sans-serif', color: '#374151', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <FileText size={18} style={{ color: '#006c51' }} /> 1. Project Workflow Overview
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.45', margin: 0 }}>
              The pipeline consists of four distinct stages: <strong>Created</strong> (initial project setup), <strong>Assigned</strong> (images distributed to curators), <strong>In Progress</strong> (curation active), and <strong>Completed</strong> (ready for model ingestion).
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <Check size={18} style={{ color: '#006c51' }} /> 2. Keyboard Shortcuts (Hotkeys)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.375rem 0.75rem', fontSize: '0.8125rem', background: '#f9fafb', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>Space</span>
              <span>Submit Annotation / Approve File</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>Esc</span>
              <span>Cancel Current Polygon Selection</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>Ctrl + Z</span>
              <span>Undo Last Polygon Node Placement</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>D / A</span>
              <span>Navigate to Next / Previous image</span>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <LifeBuoy size={18} style={{ color: '#006c51' }} /> 3. Data Integrity & Taxonomy Rules
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.45', margin: 0 }}>
              All labeled bounding box coords are normalized coordinates ([0, 1]). Please double-check labeling instructions in the project guidelines document before publishing datasets.
            </p>
          </div>
        </div>
      </Modal>

      {/* Support Modal */}
      <Modal isOpen={supportOpen} onClose={() => setSupportOpen(false)} title="System Support & Assistance">
        {supportSubmitted ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: '#d1fae5', color: '#059669', fontSize: '24px', fontWeight: 'bold', marginBottom: '1rem' }}>✓</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 0.25rem 0' }}>Request Submitted!</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Our support desk will respond shortly via email.</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSupportSubmitted(true); setTimeout(() => { setSupportSubmitted(false); setSupportOpen(false); setSupportForm({ name: '', email: '', category: 'bug', desc: '' }); }, 2500); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'Inter, sans-serif', textAlign: 'left' }}>
            <div className="form-field">
              <label className="form-field__label" htmlFor="support-name">Full Name</label>
              <input type="text" id="support-name" required className="form-field__input" style={{ height: '40px' }} value={supportForm.name} onChange={(e) => setSupportForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="support-email">Email Address</label>
              <input type="email" id="support-email" required className="form-field__input" style={{ height: '40px' }} value={supportForm.email} onChange={(e) => setSupportForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="support-category">Category</label>
              <div className="form-field__select-wrapper">
                <select id="support-category" className="form-field__select" style={{ height: '40px' }} value={supportForm.category} onChange={(e) => setSupportForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="bug">Report a Bug / Glitch</option>
                  <option value="feature">Request new UI Capability</option>
                  <option value="question">General Technical Inquiry</option>
                </select>
                <ChevronDown className="form-field__select-arrow" size={18} />
              </div>
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="support-desc">Description</label>
              <textarea id="support-desc" required className="form-field__textarea" rows={3} value={supportForm.desc} onChange={(e) => setSupportForm(p => ({ ...p, desc: e.target.value }))} />
            </div>
            
            <div style={{ marginTop: '0.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '0.375rem' }}>System Environment Diagnostics:</span>
              <div className="diagnostics-grid">
                <div className="diagnostic-item">
                  <span className="diagnostic-label">Environment</span>
                  <span className="diagnostic-value"><span className="diagnostic-status"></span> Active (Online)</span>
                </div>
                <div className="diagnostic-item">
                  <span className="diagnostic-label">App Stable Version</span>
                  <span className="diagnostic-value">v1.0.4-stable</span>
                </div>
              </div>
            </div>
            
            <div className="form-actions" style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="create-project-submit-btn" style={{ height: '42px', flex: 1 }}>Submit Support Ticket</button>
              <button type="button" className="cancel-btn" style={{ height: '42px' }} onClick={() => setSupportOpen(false)}>Cancel</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Help Modal */}
      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Quick Help & FAQs">
        <div style={{ fontFamily: 'Inter, sans-serif', color: '#374151', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: '0 0 0.25rem 0' }}>Q: How do I assign dataset items to an Annotator?</h4>
            <p style={{ fontSize: '0.8125rem', color: '#4b5563', margin: 0 }}>
              Navigate to the <strong>Annotators</strong> dashboard tab. Highlight the images you wish to assign by dragging or box-selecting them, select the target curator and project, then click <strong>Assign Selected</strong>!
            </p>
          </div>
          <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: '0 0 0.25rem 0' }}>Q: How do I export labeled annotations to train AI models?</h4>
            <p style={{ fontSize: '0.8125rem', color: '#4b5563', margin: 0 }}>
              In the <strong>Projects</strong> tab under the Manager Dashboard, select the project and select <strong>Export COCO</strong> from the actions panel to download a standard JSON file.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: '0 0 0.25rem 0' }}>Q: What image file dimensions are supported?</h4>
            <p style={{ fontSize: '0.8125rem', color: '#4b5563', margin: 0 }}>
              The system dynamically resizes and retains exact scaling ratios for any image sizes. For optimal accuracy and rendering performance, we suggest keeping dimensions below 4K resolution.
            </p>
          </div>
        </div>
      </Modal>
    </header>
  );
}
