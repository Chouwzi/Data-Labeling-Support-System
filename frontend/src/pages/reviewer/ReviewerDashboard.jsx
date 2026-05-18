import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import ReviewerSidebar from '@/components/reviewer/ReviewerSidebar';
import Topbar from '@/components/common/Topbar';
import KpiCard from '@/components/dashboard/KpiCard';
import { ClipboardCheck, CheckSquare, XSquare, Clock, Filter, Search } from 'lucide-react';
import { getReviewQueueImages, getCompletedReviewImages } from '@/services/api';
import '@/styles/Dashboard.css';
import '@/styles/ReviewerDashboard.css';

export default function ReviewerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isDashboard = location.pathname === '/reviewer';
  const isCompletedTab = location.pathname === '/reviewer/completed';

  let pageTitle = 'Reviewer Dashboard';
  let pageSubtitle = 'Manage and verify annotations quality';
  if (isCompletedTab) {
    pageTitle = 'Completed Reviews';
    pageSubtitle = 'History of approved and verified annotations';
  } else if (!isDashboard) {
    pageTitle = 'Pending Reviews';
    pageSubtitle = 'Annotations currently waiting for your verification';
  }

  const fetchReviews = async () => {
    try {
      setLoading(true);
      if (isCompletedTab) {
        try {
          // Attempt to fetch real completed data from the new backend API
          const res = await getCompletedReviewImages();
          const data = res.data?.result?.data || res.data?.result || [];
          setReviews(data);
        } catch (apiError) {
          console.warn('Completed API not ready yet, falling back to mock data', apiError);
          // Fallback if backend hasn't implemented it yet
          setReviews([
            {
              task_id: 'mock-1',
              image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=300&fit=crop',
              status: 'COMPLETED',
              annotator_name: 'Bui Trang',
              submitted_at: new Date().toISOString()
            }
          ]);
        }
      } else {
        const res = await getReviewQueueImages();
        const data = res.data?.result?.data || res.data?.result || [];
        setReviews(data);
      }
    } catch (err) {
      console.error('Failed to fetch reviewer queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [isCompletedTab]);

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

  const filteredReviews = reviews.filter((review) => {
    const imageUrl = review.image_url || review.imageUrl || '';
    const fileName = imageUrl ? imageUrl.replace(/\\/g, '/').split('/').pop() : '';
    const annotatorName = review.annotator_name || review.annotatorName || 'Unknown';
    const matchesSearch = fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          annotatorName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="dashboard-layout">
      <ReviewerSidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      
      <div className="dashboard-main">
        <Topbar
          userName={user?.fullName || 'Reviewer'}
          userRole="Data Reviewer"
          searchPlaceholder="Search by file or annotator..."
          searchValue={searchTerm}
          onSearch={setSearchTerm}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="dashboard-content">
          <div className="content-header">
            <div>
              <h1 className="content-title">{pageTitle}</h1>
              <p className="content-subtitle">{pageSubtitle}</p>
            </div>
          </div>

          {/* KPI Cards (Only show on Dashboard) */}
          {isDashboard && (
            <div className="kpi-grid">
              <KpiCard
                title="Pending Review"
                value={reviews.length.toString()}
                icon={ClipboardCheck}
                trend="Real-time"
                variant="warning"
              />
              <KpiCard
                title="Approved Today"
                value="45"
                icon={CheckSquare}
                trend="+12%"
                variant="success"
              />
              <KpiCard
                title="Rejected Today"
                value="3"
                icon={XSquare}
                trend="-2%"
                variant="danger"
              />
              <KpiCard
                title="Avg. Review Time"
                value="2.5m"
                icon={Clock}
                trend="-10s"
                variant="primary"
              />
            </div>
          )}


          {/* Grid List */}
          {loading ? (
            <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.7)', borderRadius: '12px', border: '1px dashed #cbd5e1', marginTop: '20px' }}>
              <p style={{ fontSize: '16px', color: '#64748b' }}>
                {isCompletedTab ? 'No completed reviews yet.' : 'No pending reviews found.'}
              </p>
            </div>
          ) : (
            <div className="reviews-grid">
              {filteredReviews.map((review) => {
                const imageUrl = review.image_url || review.imageUrl || '';
                const fileName = imageUrl ? imageUrl.replace(/\\/g, '/').split('/').pop() : 'image.jpg';
                const taskId = review.task_id || review.taskId;
                const annotatorName = review.annotator_name || review.annotatorName || 'Unassigned';
                const submittedAt = review.submitted_at || review.submittedAt;
                const annotationsCount = review.annotations?.length || 0;
                
                return (
                  <div key={taskId} className="review-card">
                    <div className="review-card__image-container">
                      <img src={transformImageUrl(imageUrl)} alt={fileName} className="review-card__image" />
                      <span className={`status-badge ${isCompletedTab ? 'status-badge--success' : 'status-badge--warning'}`}>
                        {review.status || (isCompletedTab ? 'COMPLETED' : 'PENDING_REVIEW')}
                      </span>
                    </div>
                    <div className="review-card__content">
                      <h3 className="review-card__title">{fileName}</h3>
                      <div className="review-card__meta">
                        <p><span>Annotator:</span> {annotatorName}</p>
                        <p><span>{isCompletedTab ? 'Reviewed At:' : 'Submitted:'}</span> {submittedAt ? new Date(submittedAt).toLocaleString() : 'RECENT'}</p>
                        {!isCompletedTab && <p><span>Boxes:</span> {annotationsCount}</p>}
                      </div>
                      {!isCompletedTab ? (
                        <button
                          className="btn btn--primary btn--full"
                          onClick={() => navigate(`/reviewer/workspace/${taskId}`)}
                        >
                          Review Now
                        </button>
                      ) : (
                        <button
                          className="btn btn--outline btn--full"
                          style={{ cursor: 'default', color: '#059669', borderColor: '#059669', background: '#ecfdf5' }}
                        >
                          <CheckSquare size={16} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'text-bottom' }} /> Verified
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
