import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import ReviewerSidebar from '@/components/reviewer/ReviewerSidebar';
import Topbar from '@/components/common/Topbar';
import { Filter, Search } from 'lucide-react';
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

export default function ReviewerPending() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const filteredReviews = MOCK_REVIEWS.filter((review) => {
    const matchesSearch = review.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          review.annotatorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || review.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <div>
              <h1 className="content-title">Pending Reviews</h1>
              <p className="content-subtitle">Files waiting for your inspection</p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="filter-bar">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by file or annotator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <Filter size={18} className="filter-icon" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Statuses</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Waiting For Approval">Waiting For Approval</option>
              </select>
            </div>
          </div>

          {/* Grid List */}
          <div className="reviews-grid">
            {filteredReviews.map((review) => (
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
        </main>
      </div>
    </div>
  );
}
