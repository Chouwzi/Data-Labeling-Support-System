import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import ReviewerSidebar from '@/components/reviewer/ReviewerSidebar';
import Topbar from '@/components/common/Topbar';
import RejectModal from '@/components/reviewer/RejectModal';
import { ArrowLeft, Check, X, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { getReviewQueueImages, approveReviewImage, rejectReviewImage } from '@/services/api';
import '@/styles/Dashboard.css';
import '@/styles/ReviewerDashboard.css';

let pendingReviewQueueCache = null;

export default function ReviewWorkspace() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || null;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  const [review, setReview] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [highlightBoxes, setHighlightBoxes] = useState(false);

  useEffect(() => {
    const fetchReviewDetail = async () => {
      try {
        setLoading(true);
        const cacheKey = projectId || 'all';
        const queueData = pendingReviewQueueCache?.key === cacheKey ? pendingReviewQueueCache.data : await getReviewQueueImages(projectId).then((res) => {
          const data = res.data?.result?.data || res.data?.result || [];
          const normalized = Array.isArray(data) ? data : [];
          pendingReviewQueueCache = { key: cacheKey, data: normalized };
          return normalized;
        });
        setQueue(queueData.map((item) => ({
          id: item.task_id || item.taskId,
          fileName: (item.image_url || item.imageUrl || '').replace(/\\/g, '/').split('/').pop() || 'image.jpg',
        })).filter((item) => item.id));
        const currentReview = queueData.find((r) => (r.task_id || r.taskId) === id);
        if (currentReview) {
          setReview(currentReview);
        } else {
          console.warn(`Task ${id} not found in pending reviews queue.`);
          navigate(projectId ? `/reviewer/tasks?projectId=${projectId}` : '/reviewer');
        }
      } catch (err) {
        console.error('Failed to fetch review detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviewDetail();
  }, [id, navigate, projectId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
        event.preventDefault();
        setHighlightBoxes(true);
      }
    };
    const handleKeyUp = (event) => {
      if (event.code === 'Space') {
        setHighlightBoxes(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const transformImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const normalizedUrl = url.replace(/\\/g, '/');
    const uploadsIndex = normalizedUrl.toLowerCase().indexOf('uploads/');
    if (uploadsIndex !== -1) {
      const relativePath = normalizedUrl.substring(uploadsIndex + 8);
      return `/api/v1/uploads/${relativePath}`;
    }
    const fileName = normalizedUrl.split('/').pop();
    return `/api/v1/uploads/${fileName}`; 
  };

  const handleImageLoad = (e) => {
    setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
    setImageLoaded(true);
  };

  const handleApprove = () => {
    setShowApproveModal(true);
  };

  const currentQueueIndex = queue.findIndex((item) => item.id === id);
  const previousReview = currentQueueIndex > 0 ? queue[currentQueueIndex - 1] : null;
  const nextReview = currentQueueIndex >= 0 && currentQueueIndex < queue.length - 1 ? queue[currentQueueIndex + 1] : null;
  const navigateToNext = () => {
    const target = nextReview || previousReview;
    const suffix = projectId ? `?projectId=${projectId}` : '';
    navigate(target ? `/reviewer/workspace/${target.id}${suffix}` : (projectId ? `/reviewer/tasks${suffix}` : '/reviewer'));
  };

  const handleConfirmApprove = async () => {
    try {
      setSubmitting(true);
      await approveReviewImage(id);
      pendingReviewQueueCache = null;
      setShowApproveModal(false);
      navigateToNext();
    } catch (err) {
      console.error('Failed to approve image:', err);
      alert('Failed to approve image. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (rejectionData) => {
    try {
      setSubmitting(true);
      await rejectReviewImage(id, rejectionData.defectCategoryId, rejectionData.note);
      pendingReviewQueueCache = null;
      setShowRejectModal(false);
      navigateToNext();
    } catch (err) {
      console.error('Failed to reject image:', err);
      alert('Failed to reject image. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #e2e8f0', borderTop: '5px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="dashboard-layout" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <h2 style={{ color: '#64748b', marginBottom: '20px' }}>Workspace task details could not be loaded.</h2>
        <button className="btn btn--primary" onClick={() => navigate('/reviewer')}>Back to List</button>
      </div>
    );
  }

  const imageUrl = review.image_url || review.imageUrl || '';
  const fileName = imageUrl ? imageUrl.replace(/\\/g, '/').split('/').pop() : 'image.jpg';
  const annotatorName = review.annotator_name || review.annotatorName || 'Unassigned';
  const submittedAt = review.submitted_at || review.submittedAt;
  const annotations = review.annotations || [];

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
            <button className="btn-back" onClick={() => navigate(projectId ? `/reviewer/tasks?projectId=${projectId}` : '/reviewer')}>
              <ArrowLeft size={16} />
              <span>Back to list</span>
            </button>
            <div style={{ marginTop: '12px' }}>
              <h1 className="content-title">Review Image: {fileName}</h1>
              <p className="content-subtitle">Annotator: {annotatorName}</p>
            </div>
            <div className="review-workspace-nav">
              <button className="btn btn--secondary" onClick={() => previousReview && navigate(`/reviewer/workspace/${previousReview.id}${projectId ? `?projectId=${projectId}` : ''}`)} disabled={!previousReview}>
                <ChevronLeft size={16} /> Previous
              </button>
              <button className="btn btn--secondary" onClick={() => nextReview && navigate(`/reviewer/workspace/${nextReview.id}${projectId ? `?projectId=${projectId}` : ''}`)} disabled={!nextReview}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="review-container">
            {/* Left: Image & Annotations */}
            <div className="review-canvas-area">
              <div className="image-viewer-container" style={{ position: 'relative', width: '100%', height: 'auto', display: 'inline-block' }}>
                <img 
                  src={transformImageUrl(imageUrl)} 
                  alt={fileName} 
                  className="image-viewer" 
                  onLoad={handleImageLoad}
                  loading="eager"
                  decoding="async"
                  style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '75vh', objectFit: 'contain' }}
                />
                {imageLoaded && imageSize.width > 0 && (
                  <svg 
                    className={`svg-overlay review-bbox-overlay ${highlightBoxes ? 'review-bbox-overlay--highlight' : ''}`} 
                    viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                  >
                    {annotations.map((ann) => {
                      const geom = ann.geometry || {};
                      const x = (geom.x || 0) * imageSize.width;
                      const y = (geom.y || 0) * imageSize.height;
                      const width = (geom.width || 0) * imageSize.width;
                      const height = (geom.height || 0) * imageSize.height;
                      const color = ann.color_hex || ann.colorHex || '#3b82f6';
                      const labelName = ann.label_name || ann.labelName || 'Object';
                      
                      return (
                        <g key={ann.id || Math.random()} className="annotation-group">
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={highlightBoxes ? `${color}22` : `${color}10`}
                            stroke={color}
                            strokeWidth={highlightBoxes ? 7 : 4}
                            className="bbox-rect review-bbox-rect"
                            vectorEffect="non-scaling-stroke"
                          />
                          <rect
                            x={x}
                            y={y - 20 >= 0 ? y - 20 : 0}
                            width={Math.max(80, labelName.length * 8 + 10)}
                            height={20}
                            fill={color}
                            className="bbox-label-bg"
                          />
                          <text
                            x={x + 5}
                            y={y - 20 >= 0 ? y - 5 : 12}
                            fill="#ffffff"
                            fontSize="12"
                            fontWeight="bold"
                            className="bbox-label-text"
                          >
                            {labelName}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>

            {/* Right: Info & Actions */}
            <div className="review-sidebar-panel">
              <div className="panel-content-scrollable">
                <div className="panel-section">
                  <h2 className="section-title">Review Context</h2>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Task ID:</span>
                      <span className="info-value" style={{ wordBreak: 'break-all', fontSize: '12px' }}>{id}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Annotator:</span>
                      <span className="info-value">{annotatorName}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Submission Date:</span>
                      <span className="info-value">{submittedAt ? new Date(submittedAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Total Labels:</span>
                      <span className="info-value">{annotations.length}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Type:</span>
                      <span className="info-value">Bounding Box</span>
                    </div>
                  </div>
                </div>

                <div className="panel-section">
                  <h2 className="section-title">Label List</h2>
                  <div className="label-list">
                    {annotations.map((ann) => {
                      const geom = ann.geometry || {};
                      const x = geom.x ? geom.x.toFixed(3) : '0';
                      const y = geom.y ? geom.y.toFixed(3) : '0';
                      const w = geom.width ? geom.width.toFixed(3) : '0';
                      const h = geom.height ? geom.height.toFixed(3) : '0';
                      const color = ann.color_hex || ann.colorHex || '#3b82f6';
                      const labelName = ann.label_name || ann.labelName || 'Object';
                      
                      return (
                        <div key={ann.id || Math.random()} className="label-item" style={{ borderLeftColor: color, borderLeftWidth: '4px' }}>
                          <span className="label-name">{labelName}</span>
                          <span className="label-coords">[{x}, {y}, {w}, {h}]</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="panel-section">
                  <h2 className="section-title"><MessageSquare size={16} /> Feedback</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
                    Use Reject to attach a defect category and actionable note to the annotator. Approve only when boxes and labels are ready for export.
                  </p>
                </div>
              </div>

              <div className="panel-actions">
                <button className="btn btn--success btn--full" onClick={handleApprove} disabled={submitting}>
                  <Check size={18} style={{ marginRight: '8px' }} />
                  Approve
                </button>
                <button className="btn btn--danger btn--full" onClick={handleReject} disabled={submitting}>
                  <X size={18} style={{ marginRight: '8px' }} />
                  Reject
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
            <h2 className="modal-title">Confirm Approval</h2>
            <p className="modal-text">Are you sure you want to approve this image and mark it as Completed?</p>
            <div className="modal-actions">
              <button className="btn btn--secondary" onClick={() => setShowApproveModal(false)} disabled={submitting}>Cancel</button>
              <button className="btn btn--success" onClick={handleConfirmApprove} disabled={submitting}>
                {submitting ? 'Approving...' : 'Confirm'}
              </button>
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
