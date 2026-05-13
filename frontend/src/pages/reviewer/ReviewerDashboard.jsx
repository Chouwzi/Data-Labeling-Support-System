import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import ReviewerSidebar from '@/components/reviewer/ReviewerSidebar';
import Topbar from '@/components/common/Topbar';
import KpiCard from '@/components/dashboard/KpiCard';
import { ClipboardCheck, CheckSquare, XSquare, Clock, Filter, Search } from 'lucide-react';
import '@/styles/Dashboard.css';
import '@/styles/ReviewerDashboard.css';

// Mock Data for Pending Reviews
const MOCK_REVIEWS = [
  {
    id: 1,
    imageUrl: 'https://picsum.photos/400/300?random=1',
    fileName: 'landscape_01.jpg',
    annotatorName: 'Maya L.',
    submitTime: '10 mins ago',
    status: 'Pending Review',
    boxCount: 5,
  },
  {
    id: 2,
    imageUrl: 'https://picsum.photos/400/300?random=2',
    fileName: 'nature_02.jpg',
    annotatorName: 'James W.',
    submitTime: '30 mins ago',
    status: 'Pending Review',
    boxCount: 12,
  },
  {
    id: 3,
    imageUrl: 'https://picsum.photos/400/300?random=3',
    fileName: 'forest_03.jpg',
    annotatorName: 'Maya L.',
    submitTime: '1 hour ago',
    status: 'Waiting For Approval',
    boxCount: 8,
  },
];

export default function ReviewerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Only show first 2 items as "Recent"
  const recentReviews = MOCK_REVIEWS.slice(0, 2);

  return (
    <div className="dashboard-layout">
      <ReviewerSidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      
      <div className="dashboard-main">
        <Topbar
          userName={user?.fullName || 'Reviewer'}
          userRole="Data Reviewer"
          searchPlaceholder="Search..."
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="dashboard-content">
          <div className="content-header">
            <div>
              <h1 className="content-title">Reviewer Dashboard</h1>
              <p className="content-subtitle">Manage and verify annotations quality</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="kpi-grid">
            <KpiCard
              title="Pending Review"
              value="12"
              icon={ClipboardCheck}
              trend="4 new"
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

          {/* Recent Reviews Section */}
          <div style={{ marginTop: '32px' }}>
            <div className="content-header">
              <h2 className="section-title">Recent Pending Reviews</h2>
              <button 
                className="btn-back" 
                style={{ color: '#10b981' }}
                onClick={() => navigate('/reviewer/pending')}
              >
                View All
              </button>
            </div>
            
            <div className="reviews-grid" style={{ marginTop: '16px' }}>
              {recentReviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-card__image-container">
                    <img src={review.imageUrl} alt={review.fileName} className="review-card__image" />
                    <span className={`status-badge status-badge--${review.status === 'Pending Review' ? 'warning' : 'info'}`}>
                      {review.status}
                    </span>
                  </div>
                  <div className="review-card__content">
                    <h3 className="review-card__title">{review.fileName}</h3>
                    <div className="review-card__meta">
                      <p><span>Annotator:</span> {review.annotatorName}</p>
                      <p><span>Submitted:</span> {review.submitTime}</p>
                      <p><span>Boxes:</span> {review.boxCount}</p>
                    </div>
                    <button
                      className="btn btn--primary btn--full"
                      onClick={() => navigate(`/reviewer/workspace/${review.id}`)}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
