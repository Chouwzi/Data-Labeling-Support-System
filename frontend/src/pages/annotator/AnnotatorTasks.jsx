import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  MoreVertical,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import Topbar from '@/components/common/Topbar';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import '@/styles/Dashboard.css';
import '@/styles/ManagerDashboard.css';

const TASK_STATUSES = [
  { id: 'all', label: 'All Tasks', color: 'var(--color-text-secondary)' },
  { id: 'PENDING', label: 'Pending', color: '#f59e0b', icon: Clock },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6', icon: Clock },
  { id: 'COMPLETED', label: 'Completed', color: '#10b981', icon: CheckCircle2 },
  { id: 'REJECTED', label: 'Rejected', color: '#ef4444', icon: AlertCircle },
];

export default function AnnotatorTasks() {
  const { projectId } = useParams();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    // Mock data for images/tasks
    const mockTasks = [
      { id: 'IMG_001', name: 'satellite_urban_001.jpg', status: 'COMPLETED', lastModified: '2024-05-14', size: '2.4 MB' },
      { id: 'IMG_002', name: 'satellite_urban_002.jpg', status: 'PENDING', lastModified: '2024-05-14', size: '3.1 MB' },
      { id: 'IMG_003', name: 'satellite_urban_003.jpg', status: 'IN_PROGRESS', lastModified: '2024-05-13', size: '1.8 MB' },
      { id: 'IMG_004', name: 'satellite_urban_004.jpg', status: 'REJECTED', lastModified: '2024-05-12', size: '2.9 MB' },
      { id: 'IMG_005', name: 'satellite_urban_005.jpg', status: 'PENDING', lastModified: '2024-05-14', size: '2.7 MB' },
      { id: 'IMG_006', name: 'satellite_urban_006.jpg', status: 'COMPLETED', lastModified: '2024-05-11', size: '3.5 MB' },
      { id: 'IMG_007', name: 'satellite_urban_007.jpg', status: 'PENDING', lastModified: '2024-05-14', size: '2.2 MB' },
      { id: 'IMG_008', name: 'satellite_urban_008.jpg', status: 'IN_PROGRESS', lastModified: '2024-05-14', size: '2.1 MB' },
    ];

    setTimeout(() => {
      setTasks(mockTasks);
      setIsLoading(false);
    }, 800);
  }, [projectId]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status) => {
    const s = TASK_STATUSES.find(st => st.id === status);
    return {
      backgroundColor: `${s?.color}15`,
      color: s?.color,
      borderColor: `${s?.color}30`
    };
  };

  return (
    <div className="manager-layout">
      <AnnotatorSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />
      
      <div className="manager-main">
        <Topbar 
          onMenuClick={toggleSidebar}
          userName={user?.fullName || 'Annotator'}
          userRole="Annotator"
          onLogout={logout}
        />

        <main className="manager-content">
          <div className="tasks-page-container fade-in-up">
            {/* Header / Breadcrumbs */}
            <div className="tasks-header">
              <button className="back-btn" onClick={() => navigate('/annotator')}>
                <ChevronLeft size={20} />
                <span>Back to Projects</span>
              </button>
              <div className="project-title-area">
                <h2 className="project-name">Urban Infrastructure Mapping</h2>
                <span className="project-id">Project ID: {projectId}</span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="tasks-filter-bar">
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search by image name or ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-actions">
                <div className="status-filters">
                  {TASK_STATUSES.map(status => (
                    <button
                      key={status.id}
                      className={`filter-tab ${statusFilter === status.id ? 'active' : ''}`}
                      onClick={() => setStatusFilter(status.id)}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>

                <div className="view-switch">
                  <button 
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="List View"
                  >
                    <ListIcon size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tasks Display */}
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading image list...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={48} />
                <p>No images found matching your filters.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'tasks-grid' : 'tasks-list'}>
                {filteredTasks.map(task => (
                  <div key={task.id} className="task-item">
                    <div className="task-preview">
                      <div className="placeholder-img">
                        <LayoutGrid size={24} opacity={0.2} />
                      </div>
                      <span className="task-id-badge">{task.id}</span>
                    </div>
                    
                    <div className="task-content">
                      <div className="task-main-info">
                        <h4 className="task-name">{task.name}</h4>
                        <div 
                          className="status-badge"
                          style={getStatusStyle(task.status)}
                        >
                          {task.status}
                        </div>
                      </div>
                      
                      <div className="task-meta">
                        <span><Clock size={12} /> {task.lastModified}</span>
                        <span>{task.size}</span>
                      </div>

                      <div className="task-actions">
                        <button className="action-btn action-btn--primary">
                          <span>Label Now</span>
                          <ExternalLink size={14} />
                        </button>
                        <button className="action-btn action-btn--icon">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .tasks-page-container {
          padding: 1rem 0;
        }

        .tasks-header {
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
          padding: 0;
          transition: color 0.2s;
        }

        .back-btn:hover {
          color: var(--color-primary);
        }

        .project-name {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-text);
          margin: 0;
        }

        .project-id {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .tasks-filter-bar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
          background: #ffffff;
          padding: 1.25rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        @media (min-width: 1024px) {
          .tasks-filter-bar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-box input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
        }

        .search-box input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(0, 108, 81, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-secondary);
        }

        .filter-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .status-filters {
          display: flex;
          background: #f8fafc;
          padding: 0.25rem;
          border-radius: var(--radius-md);
          gap: 0.25rem;
        }

        .filter-tab {
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          border: none;
          background: none;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-tab:hover {
          color: var(--color-primary);
        }

        .filter-tab.active {
          background: #ffffff;
          color: var(--color-primary);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .view-switch {
          display: flex;
          gap: 0.5rem;
          border-left: 1px solid rgba(0, 0, 0, 0.1);
          padding-left: 1rem;
        }

        .view-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0, 0, 0, 0.05);
          background: #ffffff;
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-btn:hover {
          background: #f1f5f9;
          color: var(--color-primary);
        }

        .view-btn.active {
          background: var(--color-primary);
          color: #ffffff;
          border-color: var(--color-primary);
        }

        /* Grid Display */
        .tasks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .task-item {
          background: #ffffff;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          border: 1px solid rgba(0, 0, 0, 0.03);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .task-item:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
        }

        .task-preview {
          height: 160px;
          background: #f1f5f9;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .placeholder-img {
          color: var(--color-primary);
        }

        .task-id-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .task-content {
          padding: 1.25rem;
        }

        .task-main-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
          gap: 0.5rem;
        }

        .task-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
          word-break: break-all;
        }

        .status-badge {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 12px;
          border: 1px solid;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .task-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-bottom: 1.25rem;
        }

        .task-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .task-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .action-btn--primary {
          flex: 1;
          background: var(--color-primary);
          color: #ffffff;
        }

        .action-btn--primary:hover {
          background: var(--color-primary-dark);
          box-shadow: 0 4px 12px rgba(0, 108, 81, 0.2);
        }

        .action-btn--icon {
          width: 38px;
          background: #f1f5f9;
          color: var(--color-text-secondary);
        }

        .action-btn--icon:hover {
          background: #e2e8f0;
          color: var(--color-text);
        }

        /* List Mode adjustment would go here */
      `}} />
    </div>
  );
}
