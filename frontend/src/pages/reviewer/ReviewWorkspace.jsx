import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import ReviewerSidebar from '@/components/reviewer/ReviewerSidebar';
import Topbar from '@/components/common/Topbar';
import RejectModal from '@/components/reviewer/RejectModal';
import { ArrowLeft, Check, X, Info } from 'lucide-react';
import '@/styles/Dashboard.css';
import '@/styles/ReviewerDashboard.css';

// Mock Data for a specific review
const MOCK_REVIEW_DETAIL = {
  id: 1,
  imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b311?w=1200&h=800&fit=crop',
  fileName: 'landscape_01.jpg',
  projectName: 'Scenic Auto-Label',
  annotatorName: 'Maya L.',
  submitDate: '2026-05-12',
  labelType: 'Bounding Box',
  annotations: [
    { id: 1, label: 'Tree', x: 100, y: 150, width: 200, height: 300, color: '#10b981' },
    { id: 2, label: 'Mountain', x: 400, y: 50, width: 600, height: 400, color: '#3b82f6' },
    { id: 3, label: 'Lake', x: 200, y: 500, width: 800, height: 250, color: '#f59e0b' },
  ],
};

export default function ReviewWorkspace() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  
  const review = MOCK_REVIEW_DETAIL; // In real app, fetch by id

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleApprove = () => {
    setShowApproveModal(true);
  };

  const handleConfirmApprove = () => {
    // Simulate API call
    console.log('Approved task', id);
    setShowApproveModal(false);
    navigate('/reviewer');
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const handleConfirmReject = (reason, categories) => {
    // Simulate API call
    console.log('Rejected task', id, { reason, categories });
    setShowRejectModal(false);
    navigate('/reviewer');
  };

  return (
    <div className="dashboard-layout">
      <ReviewerSidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      
      <div className="dashboard-main">
        <Topbar
          userName={user?.fullName || 'Reviewer'}
          userRole="Data Reviewer"
          searchPlaceholder="Search reviews..."
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="dashboard-content">
          <div className="content-header">
            <button className="btn-back" onClick={() => navigate('/reviewer')}>
              <ArrowLeft size={16} />
              <span>Quay lại danh sách</span>
            </button>
            <div style={{ marginTop: '12px' }}>
              <h1 className="content-title">Review Image: {review.fileName}</h1>
              <p className="content-subtitle">Project: {review.projectName}</p>
            </div>
          </div>

          <div className="review-container">
            {/* Left: Image & Annotations */}
            <div className="review-canvas-area">
              <div className="image-viewer-container">
                <img src={review.imageUrl} alt={review.fileName} className="image-viewer" />
                <svg className="svg-overlay" viewBox="0 0 1200 800">
                  {review.annotations.map((ann) => (
                    <g key={ann.id} className="annotation-group">
                      <rect
                        x={ann.x}
                        y={ann.y}
                        width={ann.width}
                        height={ann.height}
                        fill="none"
                        stroke={ann.color}
                        strokeWidth="3"
                        className="bbox-rect"
                      />
                      <rect
                        x={ann.x}
                        y={ann.y - 25}
                        width={100}
                        height={25}
                        fill={ann.color}
                        className="bbox-label-bg"
                      />
                      <text
                        x={ann.x + 5}
                        y={ann.y - 7}
                        fill="#ffffff"
                        fontSize="14"
                        fontWeight="bold"
                        className="bbox-label-text"
                      >
                        {ann.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Right: Info & Actions */}
            <div className="review-sidebar-panel">
              <div className="panel-section">
                <h2 className="section-title">Thông tin chi tiết</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Image ID:</span>
                    <span className="info-value">{review.id}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Project:</span>
                    <span className="info-value">{review.projectName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Annotator:</span>
                    <span className="info-value">{review.annotatorName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Ngày nộp:</span>
                    <span className="info-value">{review.submitDate}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Tổng số nhãn:</span>
                    <span className="info-value">{review.annotations.length}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Loại:</span>
                    <span className="info-value">{review.labelType}</span>
                  </div>
                </div>
              </div>

              <div className="panel-section">
                <h2 className="section-title">Danh sách nhãn</h2>
                <div className="label-list">
                  {review.annotations.map((ann) => (
                    <div key={ann.id} className="label-item" style={{ borderLeftColor: ann.color }}>
                      <span className="label-name">{ann.label}</span>
                      <span className="label-coords">[{ann.x}, {ann.y}, {ann.width}, {ann.height}]</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-actions">
                <button className="btn btn--danger btn--full" onClick={handleReject}>
                  <X size={18} style={{ marginRight: '8px' }} />
                  Reject
                </button>
                <button className="btn btn--success btn--full" onClick={handleApprove}>
                  <Check size={18} style={{ marginRight: '8px' }} />
                  Approve
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Xác nhận Approve</h2>
            <p className="modal-text">Bạn có chắc chắn muốn phê duyệt hình ảnh này không?</p>
            <div className="modal-actions">
              <button className="btn btn--secondary" onClick={() => setShowApproveModal(false)}>Hủy</button>
              <button className="btn btn--success" onClick={handleConfirmApprove}>Đồng ý</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleConfirmReject}
        />
      )}
    </div>
  );
}
