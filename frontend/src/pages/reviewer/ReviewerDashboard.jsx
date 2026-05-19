import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import ReviewerSidebar from '@/components/reviewer/ReviewerSidebar';
import Topbar from '@/components/common/Topbar';
import KpiCard from '@/components/dashboard/KpiCard';
import { 
  ClipboardCheck, 
  CheckSquare, 
  XSquare, 
  Clock, 
  Filter, 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  Award, 
  MessageSquare, 
  AlertTriangle,
  BarChart2,
  Calendar
} from 'lucide-react';
import { getReviewQueueImages, getCompletedReviewImages } from '@/services/api';
import '@/styles/Dashboard.css';
import '@/styles/ReviewerDashboard.css';

const MOCK_COMPLETED_REVIEWS = [
  {
    task_id: 'mock-rev-1',
    image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=300&fit=crop',
    status: 'APPROVED',
    annotator_name: 'Bui Trang',
    submitted_at: '2026-05-19T06:09:28.000Z',
    reviewed_at: '2026-05-19T06:12:15.000Z',
    defect_category_name: null,
    comments: 'Excellent work, all bounding boxes are extremely precise.',
    annotations: [{}, {}, {}, {}]
  },
  {
    task_id: 'mock-rev-2',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
    status: 'REJECTED',
    annotator_name: 'Minh Thu',
    submitted_at: '2026-05-18T14:22:10.000Z',
    reviewed_at: '2026-05-19T01:30:00.000Z',
    defect_category_name: 'Boundary Mismatch',
    comments: 'Bounding boxes for vehicles are drawn too wide. Please snap to edges.',
    annotations: [{}, {}]
  },
  {
    task_id: 'mock-rev-3',
    image_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop',
    status: 'APPROVED',
    annotator_name: 'Hoang Nam',
    submitted_at: '2026-05-18T10:05:45.000Z',
    reviewed_at: '2026-05-18T11:15:20.000Z',
    defect_category_name: null,
    comments: 'Great labeling on background elements.',
    annotations: [{}, {}, {}, {}, {}, {}]
  },
  {
    task_id: 'mock-rev-4',
    image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    status: 'APPROVED',
    annotator_name: 'Bui Trang',
    submitted_at: '2026-05-18T09:12:30.000Z',
    reviewed_at: '2026-05-18T10:00:15.000Z',
    defect_category_name: null,
    comments: 'Very clean tree segmentation bounds.',
    annotations: [{}, {}, {}]
  },
  {
    task_id: 'mock-rev-5',
    image_url: 'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=400&h=300&fit=crop',
    status: 'REJECTED',
    annotator_name: 'Hoang Nam',
    submitted_at: '2026-05-17T16:40:00.000Z',
    reviewed_at: '2026-05-18T08:20:00.000Z',
    defect_category_name: 'Missed Bounding Box',
    comments: 'Forgot to label 3 pedestrians in the shadows.',
    annotations: [{}]
  },
  {
    task_id: 'mock-rev-6',
    image_url: 'https://images.unsplash.com/photo-1472214222541-d510753a49fa?w=400&h=300&fit=crop',
    status: 'APPROVED',
    annotator_name: 'Viet Hoang',
    submitted_at: '2026-05-17T13:00:00.000Z',
    reviewed_at: '2026-05-17T15:10:00.000Z',
    defect_category_name: null,
    comments: 'All objects detected correctly.',
    annotations: [{}, {}, {}, {}, {}]
  },
  {
    task_id: 'mock-rev-7',
    image_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
    status: 'APPROVED',
    annotator_name: 'Minh Thu',
    submitted_at: '2026-05-17T11:15:00.000Z',
    reviewed_at: '2026-05-17T12:00:00.000Z',
    defect_category_name: null,
    comments: 'Accurate label boundaries.',
    annotations: [{}, {}]
  },
  {
    task_id: 'mock-rev-8',
    image_url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop',
    status: 'REJECTED',
    annotator_name: 'Viet Hoang',
    submitted_at: '2026-05-16T15:30:00.000Z',
    reviewed_at: '2026-05-16T17:45:00.000Z',
    defect_category_name: 'Incorrect Class Label',
    comments: 'Trucks are labeled as compact cars. Please re-read taxonomies.',
    annotations: [{}, {}, {}, {}]
  },
  {
    task_id: 'mock-rev-9',
    image_url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=300&fit=crop',
    status: 'APPROVED',
    annotator_name: 'Bui Trang',
    submitted_at: '2026-05-16T09:40:00.000Z',
    reviewed_at: '2026-05-16T10:30:00.000Z',
    defect_category_name: null,
    comments: 'Solid quality work.',
    annotations: [{}, {}, {}, {}, {}, {}, {}]
  },
  {
    task_id: 'mock-rev-10',
    image_url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400&h=300&fit=crop',
    status: 'APPROVED',
    annotator_name: 'Minh Thu',
    submitted_at: '2026-05-15T15:00:00.000Z',
    reviewed_at: '2026-05-15T16:15:00.000Z',
    defect_category_name: null,
    comments: 'Perfect labels.',
    annotations: [{}, {}]
  }
];

export default function ReviewerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  // Custom filter states for Completed Stats tab
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedAnnotator, setSelectedAnnotator] = useState('ALL');

  const isDashboard = location.pathname === '/reviewer';
  const isCompletedTab = location.pathname === '/reviewer/completed';

  let pageTitle = 'Reviewer Dashboard';
  let pageSubtitle = 'Manage and verify annotations quality';
  if (isCompletedTab) {
    pageTitle = 'Review Statistics';
    pageSubtitle = 'Comprehensive performance metrics and curation quality review';
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
          if (data && data.length > 0) {
            setReviews(data);
          } else {
            setReviews(MOCK_COMPLETED_REVIEWS);
          }
        } catch (apiError) {
          console.warn('Completed API not ready yet, falling back to mock data', apiError);
          setReviews(MOCK_COMPLETED_REVIEWS);
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

  // Compute values dynamically from "reviews" list
  const totalReviewed = reviews.length;
  const approvedList = reviews.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED');
  const approvedCount = approvedList.length;
  const rejectedList = reviews.filter(r => r.status === 'REJECTED');
  const rejectedCount = rejectedList.length;
  const approvalRate = totalReviewed > 0 ? ((approvedCount / totalReviewed) * 100).toFixed(1) : '0';
  const rejectionRate = totalReviewed > 0 ? ((rejectedCount / totalReviewed) * 100).toFixed(1) : '0';
  const avgReviewTime = '1.8m';

  // Compute unique list of annotators dynamically for the dropdown filter
  const uniqueAnnotators = [...new Set(reviews.map(r => r.annotator_name || r.annotatorName || 'Unknown'))].filter(Boolean);

  // Compute common defect categories distribution dynamically
  const defectBreakdown = {};
  reviews.forEach(r => {
    if (r.status === 'REJECTED') {
      const cat = r.defect_category_name || r.defectCategory || 'Uncategorized';
      defectBreakdown[cat] = (defectBreakdown[cat] || 0) + 1;
    }
  });

  // Compute leaderboard stats dynamically
  const annotatorStatsMap = {};
  reviews.forEach(r => {
    const name = r.annotator_name || r.annotatorName || 'Unknown';
    if (!annotatorStatsMap[name]) {
      annotatorStatsMap[name] = { name, total: 0, approved: 0, rejected: 0 };
    }
    annotatorStatsMap[name].total += 1;
    if (r.status === 'APPROVED' || r.status === 'COMPLETED') {
      annotatorStatsMap[name].approved += 1;
    } else if (r.status === 'REJECTED') {
      annotatorStatsMap[name].rejected += 1;
    }
  });

  const annotatorLeaderboard = Object.values(annotatorStatsMap).map(stat => ({
    ...stat,
    rate: stat.total > 0 ? Math.round((stat.approved / stat.total) * 100) : 0
  })).sort((a, b) => b.rate - a.rate);

  // Filter reviews specifically for listing in the Table / Grid
  const filteredReviews = reviews.filter((review) => {
    const imageUrl = review.image_url || review.imageUrl || '';
    const fileName = imageUrl ? imageUrl.replace(/\\/g, '/').split('/').pop() : '';
    const annotatorName = review.annotator_name || review.annotatorName || 'Unknown';
    const status = review.status || 'COMPLETED';

    const matchesSearch = fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          annotatorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'ALL' || 
                          (selectedStatus === 'APPROVED' && (status === 'APPROVED' || status === 'COMPLETED')) ||
                          (selectedStatus === 'REJECTED' && status === 'REJECTED');
                          
    const matchesAnnotator = selectedAnnotator === 'ALL' || annotatorName === selectedAnnotator;

    return matchesSearch && matchesStatus && matchesAnnotator;
  });

  // SVG Circle stroke length math: radius = 50, circumference = 2 * Math.PI * 50 = 314.16
  const strokeCircumference = 314.16;
  const approvedStrokeOffset = strokeCircumference * (1 - approvedCount / (totalReviewed || 1));
  const rejectedStrokeOffset = strokeCircumference * (1 - rejectedCount / (totalReviewed || 1));

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

          {/* ========================================================= */}
          {/* STATS VIEW (Completed Tab) */}
          {/* ========================================================= */}
          {isCompletedTab ? (
            <div className="stats-dashboard">
              {/* KPI metrics row */}
              <div className="kpi-container-custom">
                <KpiCard
                  title="Total Reviewed"
                  value={totalReviewed.toString()}
                  icon={ClipboardCheck}
                  trend="Lifetime"
                  variant="primary"
                />
                <KpiCard
                  title="Approved Annotations"
                  value={`${approvedCount} (${approvalRate}%)`}
                  icon={ThumbsUp}
                  trend="Acceptance"
                  variant="success"
                />
                <KpiCard
                  title="Rejected / Redo"
                  value={`${rejectedCount} (${rejectionRate}%)`}
                  icon={ThumbsDown}
                  trend="Issue Rate"
                  variant="danger"
                />
                <KpiCard
                  title="Avg. Review Time"
                  value={avgReviewTime}
                  icon={Clock}
                  trend="Speed / Item"
                  variant="warning"
                />
              </div>

              {/* Charts grid */}
              <div className="stats-grid-2col">
                {/* Outcomes Donut Chart */}
                <div className="stats-card-premium">
                  <h3 className="stats-card-title">
                    <BarChart2 size={18} style={{ color: '#10b981' }} />
                    Review Quality Distribution
                  </h3>
                  <div className="donut-chart-container">
                    <div className="donut-chart-graphic">
                      <svg className="donut-chart-svg" width="150" height="150" viewBox="0 0 120 120">
                        <circle className="donut-chart-bg" cx="60" cy="60" r="50" />
                        {totalReviewed > 0 && (
                          <>
                            {/* Approved stroke */}
                            <circle 
                              className="donut-chart-segment-approved" 
                              cx="60" 
                              cy="60" 
                              r="50" 
                              strokeDasharray={strokeCircumference}
                              strokeDashoffset={approvedStrokeOffset}
                            />
                            {/* Rejected stroke offset begins at approved end */}
                            <circle 
                              className="donut-chart-segment-rejected" 
                              cx="60" 
                              cy="60" 
                              r="50" 
                              strokeDasharray={strokeCircumference}
                              strokeDashoffset={rejectedStrokeOffset}
                              style={{ transform: `rotate(${(approvedCount / totalReviewed) * 360}deg)`, transformOrigin: '60px 60px' }}
                            />
                          </>
                        )}
                      </svg>
                      <div className="donut-chart-center-text">
                        <span className="donut-chart-center-val">{approvalRate}%</span>
                        <span className="donut-chart-center-lbl">Pass Rate</span>
                      </div>
                    </div>

                    <div className="donut-chart-legend">
                      <div className="legend-item">
                        <div className="legend-dot legend-dot--approved"></div>
                        <span className="legend-lbl">Approved</span>
                        <span className="legend-val">{approvedCount} imgs</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-dot legend-dot--rejected"></div>
                        <span className="legend-lbl">Rejected</span>
                        <span className="legend-val">{rejectedCount} imgs</span>
                      </div>
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
                        <span>Grand Total:</span>
                        <span>{totalReviewed} items</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Common defect categories */}
                <div className="stats-card-premium">
                  <h3 className="stats-card-title">
                    <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                    Common Annotation Errors
                  </h3>
                  <div className="defect-bar-list">
                    {Object.keys(defectBreakdown).length > 0 ? (
                      Object.entries(defectBreakdown).map(([category, count]) => {
                        const percent = rejectedCount > 0 ? (count / rejectedCount) * 100 : 0;
                        return (
                          <div key={category} className="defect-bar-item">
                            <div className="defect-bar-meta">
                              <span className="defect-bar-lbl">{category}</span>
                              <span className="defect-bar-val">{count} error(s) ({Math.round(percent)}%)</span>
                            </div>
                            <div className="defect-bar-track">
                              <div className="defect-bar-fill" style={{ width: `${percent}%`, backgroundColor: '#ef4444' }}></div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: '14px' }}>
                        No defects or rejection errors detected in the current review logs.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Leaderboard grid */}
              <div className="stats-card-premium" style={{ marginBottom: '8px' }}>
                <h3 className="stats-card-title">
                  <Award size={18} style={{ color: '#f59e0b' }} />
                  Annotator Quality Leaderboard
                </h3>
                <div className="leaderboard-list">
                  {annotatorLeaderboard.map((item) => (
                    <div key={item.name} className="leaderboard-item">
                      <div className="leaderboard-avatar">
                        {item.name.charAt(0)}
                      </div>
                      <div className="leaderboard-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span className="leaderboard-name">{item.name}</span>
                          <span className="leaderboard-rate">Quality Score: {item.rate}%</span>
                        </div>
                        <div className="leaderboard-track">
                          <div className="leaderboard-fill" style={{ width: `${item.rate}%` }}></div>
                        </div>
                      </div>
                      <div className="leaderboard-stats">
                        <span className="leaderboard-count" style={{ color: '#047857', fontWeight: 600 }}>Approved: {item.approved}</span>
                        <span className="leaderboard-count" style={{ color: '#b91c1c', fontWeight: 600 }}>Rejected: {item.rejected}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* History list section */}
              <div className="history-section">
                <div className="history-section-header">
                  <h3 className="history-section-title">Reviewed Images History Log</h3>
                  <div className="history-controls">
                    {/* Status filter dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Filter size={14} style={{ color: '#64748b' }} />
                      <select 
                        className="history-select" 
                        value={selectedStatus} 
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        <option value="ALL">All Outcomes</option>
                        <option value="APPROVED">Approved Only</option>
                        <option value="REJECTED">Rejected Only</option>
                      </select>
                    </div>

                    {/* Annotator filter dropdown */}
                    <select 
                      className="history-select" 
                      value={selectedAnnotator} 
                      onChange={(e) => setSelectedAnnotator(e.target.value)}
                    >
                      <option value="ALL">All Annotators</option>
                      {uniqueAnnotators.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Log history list */}
                {loading ? (
                  <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                    <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '30px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>No reviewed images match the selected filters.</p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>File Name</th>
                          <th>Annotator</th>
                          <th>Reviewed Time</th>
                          <th>Outcome</th>
                          <th>Defect/Feedback comments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReviews.map((review) => {
                          const imageUrl = review.image_url || review.imageUrl || '';
                          const fileName = imageUrl ? imageUrl.replace(/\\/g, '/').split('/').pop() : 'image.jpg';
                          const annotatorName = review.annotator_name || review.annotatorName || 'Unknown';
                          const status = review.status || 'COMPLETED';
                          
                          // Format date nicely
                          const reviewDateStr = review.reviewed_at || review.reviewedAt || review.submitted_at || review.submittedAt || new Date().toISOString();
                          const formattedDate = new Date(reviewDateStr).toLocaleString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          const isApproved = status === 'APPROVED' || status === 'COMPLETED';
                          const defectCategory = review.defect_category_name || review.defectCategory || '';

                          return (
                            <tr key={review.task_id || Math.random()}>
                              <td>
                                <img src={transformImageUrl(imageUrl)} alt={fileName} className="thumb-preview" />
                              </td>
                              <td className="file-name-cell">
                                {fileName}
                              </td>
                              <td>{annotatorName}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                  <Calendar size={13} style={{ color: '#94a3b8' }} />
                                  {formattedDate}
                                </div>
                              </td>
                              <td>
                                <span className={`badge-premium ${isApproved ? 'badge-premium--approved' : 'badge-premium--rejected'}`}>
                                  {isApproved ? 'Approved' : 'Rejected'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  {!isApproved && defectCategory && (
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                      <AlertTriangle size={10} /> {defectCategory}
                                    </span>
                                  )}
                                  <span className="comment-bubble" title={review.comments || 'No comments'}>
                                    {review.comments || '—'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // =========================================================
            // STANDARD REVIEW QUEUE VIEW (Dashboard Tab)
            // =========================================================
            <>
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
                    No pending reviews found.
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
                          <span className="status-badge status-badge--warning">
                            {review.status || 'PENDING_REVIEW'}
                          </span>
                        </div>
                        <div className="review-card__content">
                          <h3 className="review-card__title">{fileName}</h3>
                          <div className="review-card__meta">
                            <p><span>Annotator:</span> {annotatorName}</p>
                            <p><span>Submitted:</span> {submittedAt ? new Date(submittedAt).toLocaleString() : 'RECENT'}</p>
                            <p><span>Boxes:</span> {annotationsCount}</p>
                          </div>
                          <button
                            className="btn btn--primary btn--full"
                            onClick={() => navigate(`/reviewer/workspace/${taskId}`)}
                          >
                            Review Now
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
