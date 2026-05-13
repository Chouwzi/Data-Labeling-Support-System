import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import ReviewerSidebar from '@/components/reviewer/ReviewerSidebar';
import Topbar from '@/components/common/Topbar';
import { Filter, Search } from 'lucide-react';
import '@/styles/Dashboard.css';
import '@/styles/ReviewerDashboard.css';

// Mock Data for Completed Reviews
const MOCK_REVIEWS = [
  {
    id: 4,
    imageUrl: 'https://picsum.photos/400/300?random=4',
    fileName: 'city_04.jpg',
    annotatorName: 'John D.',
    submitTime: '2 days ago',
    status: 'Completed',
    boxCount: 15,
  },
  {
    id: 5,
    imageUrl: 'https://picsum.photos/400/300?random=5',
    fileName: 'mountain_05.jpg',
    annotatorName: 'James W.',
    submitTime: '3 days ago',
    status: 'Completed',
    boxCount: 7,
  },
];

export default function ReviewerCompleted() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const filteredReviews = MOCK_REVIEWS.filter((review) => {
    const matchesSearch = review.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          review.annotatorName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="dashboard-layout">
      <ReviewerSidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      
      <div className="dashboard-main">
        <Topbar
          userName={user?.fullName || 'Reviewer'}
          userRole="Data Reviewer"
          searchPlaceholder="Search completed reviews..."
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="dashboard-content">
          <div className="content-header">
            <div>
              <h1 className="content-title">Completed Reviews</h1>
              <p className="content-subtitle">History of approved annotations</p>
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
          </div>

          {/* Grid List */}
          <div className="reviews-grid">
            {filteredReviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-card__image-container">
                  <img src={review.imageUrl} alt={review.fileName} className="review-card__image" />
                  <span className="status-badge" style={{ backgroundColor: '#def7ec', color: '#03543f' }}>
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
                    className="btn btn--secondary btn--full"
                    onClick={() => navigate(`/reviewer/workspace/${review.id}`)}
                  >
                    View Details
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
