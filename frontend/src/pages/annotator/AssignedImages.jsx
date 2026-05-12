import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Topbar from '@/components/common/Topbar';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import BrandLogo from '@/components/common/BrandLogo';
import { Search, Clock, AlertCircle, Play } from 'lucide-react';
import { getProjects, getTasks } from '@/services/api';
import '@/styles/ManagerDashboard.css';

const STATUS_FILTERS = ['All', 'Todo', 'In Progress', 'Rejected'];

const STATUS_BADGE_CLASS = {
  'Todo': 'status-badge--initialized',
  'In Progress': 'status-badge--in-progress',
  'Rejected': 'status-badge--completed',
};

export default function AssignedImages() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const projectsRes = await getProjects();
        const projects = projectsRes.data?.result?.data || projectsRes.data?.result?.content || projectsRes.data?.result || [];
        
        if (projects.length > 0) {
          // Lấy dự án đầu tiên làm mẫu
          const project = projects[0];
          const tasksRes = await getTasks(project.id);
          const tasks = tasksRes.data?.result || [];

          const userId = localStorage.getItem('userId');
          
          // Lọc task được giao cho user hiện tại
          const assignedTasks = tasks.filter(task => 
            task.annotatorId === userId || task.annotatorId === parseInt(userId)
          );

          // Nếu user chưa được giao task nào, hiển thị tất cả task của dự án để test
          const tasksToDisplay = assignedTasks.length > 0 ? assignedTasks : tasks;

          // Map dữ liệu từ API sang định dạng của UI
          const mappedImages = tasksToDisplay.map(task => {
            // Tách lấy tên file từ URL nếu có, nếu không thì dùng ID
            let filename = `Task_${task.id.toString().substring(0, 4)}`;
            if (task.imageUrl) {
              const parts = task.imageUrl.split('/');
              const lastPart = parts[parts.length - 1];
              if (lastPart && lastPart.includes('.')) {
                filename = lastPart;
              }
            }

            return {
              id: task.id,
              name: filename,
              status: task.status === 'ASSIGNED' ? 'Todo' : 
                      task.status === 'IN_PROGRESS' ? 'In Progress' : 
                      task.status === 'DONE' ? 'Completed' : 'Todo',
              updatedAt: task.updatedAt ? new Date(task.updatedAt).toLocaleString() : 'N/A',
              thumbnail: task.imageUrl || 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=300&h=200&fit=crop'
            };
          });

          setImages(mappedImages);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const filteredImages = images.filter((img) => {
    const matchSearch = img.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = selectedStatus === 'All' || img.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const userName = user?.fullName || user?.email || 'Annotator';
  const userRole = user?.role || 'ANNOTATOR';

  return (
    <div className="manager-layout">
      <AnnotatorSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />

      <div className="manager-main">
        <Topbar
          userName={userName}
          userRole={userRole}
          searchPlaceholder="Search images..."
          showCenterLinks
          onMenuClick={toggleSidebar}
          onLogout={handleLogout}
        />

        <main className="manager-content">
          <div className="manager-dashboard-grid">
            {/* Page Header */}
            <header className="manager-dashboard-grid__header">
              <div className="manager-page-header__brand" aria-hidden="true">
                <BrandLogo size={32} />
                <span className="manager-page-header__brand-name">DataLabel Pro</span>
              </div>
              <div className="manager-header-row">
                <div>
                  <h1 className="manager-page-title">Assigned Images</h1>
                  <p className="manager-page-subtitle">
                    Manage and annotate your assigned images.
                  </p>
                </div>
              </div>
            </header>

            {/* Filter Bar — full 12 columns */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ position: 'relative', maxWidth: '20rem', flex: '1' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-field__input"
                  style={{ paddingLeft: '2.25rem', height: '2.5rem' }}
                />
              </div>

              {/* Status Tabs */}
              <div style={{ display: 'flex', backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                {STATUS_FILTERS.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.8125rem',
                      fontWeight: selectedStatus === status ? 700 : 500,
                      color: selectedStatus === status ? '#059669' : '#6b7280',
                      backgroundColor: selectedStatus === status ? '#ecfdf5' : 'transparent',
                      border: 'none',
                      borderBottom: selectedStatus === status ? '2px solid #059669' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontFamily: 'inherit',
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Grid — full 12 columns */}
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
              {loading ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }} />
                  <p style={{ color: '#6b7280', marginTop: '1rem' }}>Loading tasks...</p>
                </div>
              ) : filteredImages.map((image) => (
                <div key={image.id} className="activity-section" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', aspectRatio: '16/10', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
                    <img
                      src={image.thumbnail}
                      alt={image.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <span
                      className={`status-badge ${STATUS_BADGE_CLASS[image.status] || 'status-badge--initialized'}`}
                      style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}
                    >
                      <span className="status-badge__dot" />
                      {image.status}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                    <div>
                      <p className="project-table__name-text">{image.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <Clock size={12} style={{ color: '#9ca3af' }} />
                        <span className="project-table__name-meta">{image.updatedAt}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/annotator/workspace/${image.id}`)}
                      className="create-project-btn"
                      style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                    >
                      {image.status === 'Todo' ? 'Start Annotation' : 'Continue'}
                      <Play size={14} style={{ marginLeft: '0.5rem' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {!loading && filteredImages.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 0' }}>
                <AlertCircle size={48} style={{ color: '#9ca3af', margin: '0 auto 1rem' }} />
                <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>No images found matching your criteria.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
