import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  User, 
  LogOut, 
  Menu, 
  ChevronDown, 
  X, 
  BookOpen, 
  Send, 
  CheckCircle2, 
  ChevronRight,
  LifeBuoy
} from 'lucide-react';
import '@/styles/Topbar.css';

// Embedded standalone Modal with bulletproof centering & scrollability for short viewports
function EmbeddedModal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start', // Align to top of viewport to prevent off-screen clipping
      justifyContent: 'center',
      zIndex: 999999,
      padding: '2rem 1.5rem',
      overflowY: 'auto' // Parent scrollability for short viewports
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        marginTop: 'auto', // Centered vertically if space permits, aligns to top otherwise
        marginBottom: 'auto',
        position: 'relative'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #f1f5f9',
          flexShrink: 0
        }}>
          <h3 style={{ margin: 0, fontFamily: "'Manrope', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            {title}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '1.5rem', overflowY: 'visible', textAlign: 'left' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

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
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Dynamic state modals
  const [supportOpen, setSupportOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Self-contained Toast state
  const [toastMessage, setToastMessage] = useState(null);

  // Form states
  const [supportCategory, setSupportCategory] = useState('bug');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');

  // Active Doc Tab state
  const [activeDocTab, setActiveDocTab] = useState('basics');

  // FAQ Accordion Open state
  const [activeFaq, setActiveFaq] = useState(null);

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Project Assigned',
      desc: 'You have been assigned to "Urban Infrastructure Mapping".',
      time: '2 hours ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Bounding Box Rejected',
      desc: 'Reviewer requested adjustments on Image #42 coordinates.',
      time: '1 day ago',
      unread: true,
    },
    {
      id: 3,
      title: 'System Update Completed',
      desc: 'DataLabel Pro updated to v2.4.0 with new crosshairs feature.',
      time: '2 days ago',
      unread: true,
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

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

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    triggerToast('All notifications marked as read.');
  };

  const triggerToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    setSupportOpen(false);
    setSupportSubject('');
    setSupportMsg('');
    triggerToast('Support request submitted successfully!');
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
          <nav className="topbar__center" aria-label="Quick links" style={{ display: 'flex', gap: '1.5rem' }}>
            <button 
              type="button" 
              className="topbar__center-link" 
              onClick={() => setSupportOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Support
            </button>
            <button 
              type="button" 
              className="topbar__center-link" 
              onClick={() => setDocsOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Docs
            </button>
          </nav>
        )}

        <div className="topbar__right">
          <div className="topbar__actions" style={{ position: 'relative' }}>
            {/* 1. Notification Bell & Dropdown */}
            <div ref={notifRef} style={{ position: 'relative', display: 'inline-block' }}>
              <button
                type="button"
                className="topbar__icon-btn"
                aria-label="Notifications"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="topbar__notification-dot" aria-hidden="true" />
                )}
              </button>

              {notifOpen && (
                <div className="topbar__dropdown" style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  right: 0,
                  width: '22rem',
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  zIndex: 200,
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>Notifications</h4>
                    {unreadCount > 0 && (
                      <button 
                        type="button"
                        onClick={markAllAsRead}
                        style={{ background: 'none', border: 'none', color: '#059669', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '16rem', overflowY: 'auto' }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{
                        padding: '0.625rem',
                        borderRadius: '0.5rem',
                        backgroundColor: n.unread ? 'rgba(5, 150, 105, 0.04)' : 'transparent',
                        border: n.unread ? '1px solid rgba(5, 150, 105, 0.1)' : '1px solid #f1f5f9',
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: n.unread ? '#059669' : '#334155' }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#94a3b8', flexShrink: 0 }}>{n.time}</span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                          {n.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Help FAQ Accordion Trigger */}
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

      {/* Render Modals and Toasts using React Portals to append directly to document.body, bypassing sticky header backdrop-filter constraints */}
      {typeof document !== 'undefined' && createPortal(
        <>
          {/* Support Request Form Modal */}
          <EmbeddedModal 
            isOpen={supportOpen} 
            onClose={() => setSupportOpen(false)} 
            title="Submit Support Request"
          >
            <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Category
                </label>
                <select 
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value)}
                  style={{
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="bug">Report a Bug / Glitch</option>
                  <option value="image">Image Loading Problem</option>
                  <option value="account">Account Access & Security</option>
                  <option value="billing">Other Concerns</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Subject
                </label>
                <input 
                  type="text" 
                  placeholder="Brief summary of the issue..."
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  required
                  style={{
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Message details
                </label>
                <textarea 
                  rows={4}
                  placeholder="Provide a detailed description of what happened..."
                  value={supportMsg}
                  onChange={(e) => setSupportMsg(e.target.value)}
                  required
                  style={{
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setSupportOpen(false)}
                  className="btn btn--secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn--primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Send size={14} />
                  <span>Send Ticket</span>
                </button>
              </div>
            </form>
          </EmbeddedModal>

          {/* Docs / Help Guide Modal */}
          <EmbeddedModal
            isOpen={docsOpen}
            onClose={() => setDocsOpen(false)}
            title="DataLabel Pro Documentation"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setActiveDocTab('basics')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeDocTab === 'basics' ? '2px solid #059669' : '2px solid transparent',
                    color: activeDocTab === 'basics' ? '#059669' : '#64748b',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  System Basics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDocTab('bboxes')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeDocTab === 'bboxes' ? '2px solid #059669' : '2px solid transparent',
                    color: activeDocTab === 'bboxes' ? '#059669' : '#64748b',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Labeling Rules
                </button>
              </div>

              <div style={{ minHeight: '200px', fontSize: '0.875rem', lineHeight: '1.6', color: '#334155' }}>
                {activeDocTab === 'basics' && (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontWeight: 700 }}>Data Labeling Workflow</h4>
                    <p style={{ margin: '0 0 1rem 0' }}>
                      The Data-Labeling Support System manages raw imagery pipeline ingestion and classification tasks through three distinct project roles:
                    </p>
                    <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <li><strong>Manager:</strong> Allocates task payloads, establishes labeling taxonomies, and reviews real-time progress metrics.</li>
                      <li><strong>Annotator:</strong> Selects classes, outlines targets tightly using the workspace canvas, and saves coordinates.</li>
                      <li><strong>Reviewer:</strong> Examines final annotations, approving them to queue for COCO export or rejecting with category error notes.</li>
                    </ul>
                  </div>
                )}

                {activeDocTab === 'bboxes' && (
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontWeight: 700 }}>Bounding Box Specifications</h4>
                    <p style={{ margin: '0 0 0.75rem 0' }}>
                      Ensure high-quality output datasets by strictly adhering to standard machine learning target guidelines:
                    </p>
                    <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <li><strong>TIGHT BOUNDS:</strong> Crop precisely on object boundaries. Avoid including extra background margins or padding.</li>
                      <li><strong>NO CLIPPING:</strong> Ensure the box fully encapsulates all visible parts of the target classification category.</li>
                      <li><strong>OCCLUSION RULES:</strong> If an object is partially blocked, label the visible section or outline the approximate full boundary depending on project-specific rules.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </EmbeddedModal>

          {/* Help FAQ Modal */}
          <EmbeddedModal
            isOpen={helpOpen}
            onClose={() => setHelpOpen(false)}
            title="Help & Frequently Asked Questions"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  q: 'How do I draw bounding boxes?',
                  a: 'Switch your active tool to "Draw" (hotkey D) or click the rectangle icon in the toolbar, then click-and-drag over the image to draw rectangular boxes.'
                },
                {
                  q: 'How do I edit or delete existing boxes?',
                  a: 'Switch to the "Select" tool (hotkey V) or click the pointer icon, then click on the box border to select it. Drag edges or corners to adjust, or press "Delete" to remove it.'
                },
                {
                  q: 'Why is the Complete Task button disabled?',
                  a: 'The task requires at least one valid bounding box annotation to ensure you do not submit empty images to the reviewer.'
                },
                {
                  q: 'What formats can I export my labels in?',
                  a: 'Managers can export labeling project results in standardized COCO JSON formatting, completely formatted for direct machine learning training datasets.'
                }
              ].map((item, idx) => (
                <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      backgroundColor: activeFaq === idx ? 'rgba(5, 150, 105, 0.03)' : '#f8fafc',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: '#0f172a',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{item.q}</span>
                    <ChevronRight 
                      size={16} 
                      style={{
                        transform: activeFaq === idx ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        color: '#64748b'
                      }} 
                    />
                  </button>
                  {activeFaq === idx && (
                    <div style={{ padding: '1rem', fontSize: '0.8rem', lineHeight: '1.5', color: '#475569', backgroundColor: 'white', borderTop: '1px solid #e2e8f0' }}>
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </EmbeddedModal>

          {/* Floating self-contained success Toast */}
          {toastMessage && (
            <div style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.875rem 1.25rem',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              zIndex: 999999,
              animation: 'fade-in 0.3s ease-out'
            }}>
              <CheckCircle2 size={18} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{toastMessage}</span>
              <button 
                type="button"
                onClick={() => setToastMessage(null)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  cursor: 'pointer', 
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </>,
        document.body
      )}
    </header>
  );
}
