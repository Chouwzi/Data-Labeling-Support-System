import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { getMyAssignedImages } from '@/services/api';
import Topbar from '@/components/common/Topbar';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import '@/styles/Dashboard.css';
import '@/styles/ManagerDashboard.css';

const TASK_STATUSES = [
  { id: 'unlabeled', label: 'To Label', color: '#f59e0b', statuses: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
  { id: 'submitted', label: 'Submitted', color: '#10b981', statuses: ['PENDING_REVIEW', 'COMPLETED', 'APPROVED'] },
  { id: 'rework', label: 'Rework', color: '#ef4444', statuses: ['REJECTED'] },
];

export default function AnnotatorTasks() {
  const { projectId } = useParams();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('unlabeled');
  const [viewMode, setViewMode] = useState('grid');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectInfo, setProjectInfo] = useState({ name: 'Loading...', id: projectId });

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  // Helper to fix image URLs if they are absolute local paths
  const fixImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    // Normalize slashes for Windows paths
    const normalizedUrl = url.replace(/\\/g, '/');
    
    // If it's a local path from backend, we transform it to a relative API path
    // We look for the 'uploads' part in the path
    const uploadsIndex = normalizedUrl.toLowerCase().indexOf('uploads/');
    if (uploadsIndex !== -1) {
      const relativePath = normalizedUrl.substring(uploadsIndex + 8); // +8 for 'uploads/'
      return `/api/v1/uploads/${relativePath}`;
    }
    
    // Fallback: If it looks like a path, get the filename
    const fileName = normalizedUrl.split('/').pop();
    return `/api/v1/uploads/${fileName}`; 
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const res = await getMyAssignedImages({ 
          projectId: projectId, 
          page: 0,
          size: 1000
        });
        
        const resultData = res.data?.result?.data || res.data?.result || [];
        const rawData = Array.isArray(resultData) ? resultData : [];
        
        if (rawData.length > 0) {
          const firstTask = rawData[0];
          setProjectInfo({
            name: firstTask.project_name || firstTask.projectName || 'My Project',
            id: firstTask.project_id || firstTask.projectId || projectId
          });
        }
        
        const mappedTasks = rawData.map(item => ({
          id: item.task_id || item.taskId || item.id || `T-${Math.random().toString(36).substr(2, 5)}`,
          name: item.file_name || item.fileName || item.name || item.image_url?.split(/[\\/]/).pop() || 'Unnamed Image',
          status: item.status || 'PENDING',
          lastModified: (item.assigned_at || item.assignedAt || item.updated_at) 
            ? new Date(item.assigned_at || item.assignedAt || item.updated_at).toLocaleDateString() 
            : 'N/A',
          size: item.size_kb ? `${(item.size_kb / 1024).toFixed(1)} MB` : 'N/A',
          imageUrl: fixImageUrl(item.image_url || item.imageUrl)
        }));

        setTasks(mappedTasks);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [projectId]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.id.toLowerCase().includes(searchTerm.toLowerCase());
    const bucket = TASK_STATUSES.find((item) => item.id === statusFilter) || TASK_STATUSES[0];
    const matchesStatus = bucket.statuses.includes(task.status?.toUpperCase());
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status) => {
    const s = TASK_STATUSES.find(st => st.statuses.includes(status?.toUpperCase()));
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
          searchValue={searchTerm}
          onSearch={setSearchTerm}
          searchPlaceholder="Search by image name or ID..."
        />

        <main className="manager-content">
          <div className="tasks-page-container fade-in-up">
            <div className="tasks-header">
              <button className="back-btn" onClick={() => navigate('/annotator')}>
                <ChevronLeft size={20} />
                <span>Back to Projects</span>
              </button>
              <div className="project-title-area">
                <h2 className="project-name">{projectInfo.name}</h2>
                <span className="project-id">Project ID: {projectInfo.id}</span>
              </div>
            </div>

            <div className="tasks-filter-bar">
              <div className="filter-actions" style={{ width: '100%', justifyContent: 'space-between' }}>
                <div className="status-filters">
                  {TASK_STATUSES.map(status => (
                    <button
                      key={status.id}
                      className={`filter-tab ${statusFilter === status.id ? 'active' : ''}`}
                      onClick={() => setStatusFilter(status.id)}
                    >
                      {status.label} ({tasks.filter((task) => status.statuses.includes(task.status?.toUpperCase())).length})
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
                      {task.imageUrl ? (
                        <img 
                          src={task.imageUrl} 
                          alt={task.name} 
                          className="task-img-preview"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="placeholder-img" style={{ display: task.imageUrl ? 'none' : 'flex' }}>
                        <LayoutGrid size={24} opacity={0.2} />
                      </div>
                      <span className="task-status-preview" style={getStatusStyle(task.status)}>
                        {task.status}
                      </span>
                    </div>
                    
                    <div className="task-content">
                      <div className="task-main-info">
                        <div className="task-name-wrapper">
                          <span className="task-label">IMAGE NAME</span>
                          <h4 className="task-name">{task.name.length > 20 ? `${task.name.substring(0, 16)}...` : task.name}</h4>
                        </div>
                      </div>
                      
                      <div className="task-id-row">
                        <span className="id-tag">ID</span>
                        <code className="id-value">{task.id}</code>
                      </div>

                      <div className="task-meta">
                        <div className="meta-item"><Clock size={12} /> <span>{task.lastModified}</span></div>
                        <div className="meta-item"><span>{task.size}</span></div>
                      </div>

                      <div className="task-actions">
                        <button 
                          className="action-btn action-btn--primary"
                          onClick={() => navigate(`/annotator/projects/${projectId}/workspace/${task.id}`)}
                        >
                          <ExternalLink size={14} />
                          <span>{task.status === 'REJECTED' ? 'Fix annotations' : task.status === 'PENDING_REVIEW' ? 'View submission' : task.status === 'COMPLETED' || task.status === 'APPROVED' ? 'View result' : 'Label now'}</span>
                        </button>
                        <button className="action-btn action-btn--icon" title="View details">
                          <Info size={16} />
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
        .tasks-page-container { padding: 1rem 0; }
        .tasks-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
        .back-btn { display: flex; align-items: center; gap: 0.5rem; background: white; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 8px; color: #64748b; font-weight: 500; transition: all 0.2s; cursor: pointer; }
        .back-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .project-title-area .project-name { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0; }
        .project-title-area .project-id { font-size: 0.85rem; color: #64748b; font-family: monospace; }
        .tasks-filter-bar { display: flex; justify-content: space-between; align-items: center; background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .search-box { position: relative; flex: 1; min-width: 300px; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .search-box input { width: 100%; padding: 0.65rem 1rem 0.65rem 2.5rem; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; transition: all 0.2s; }
        .search-box input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .filter-actions { display: flex; align-items: center; gap: 1rem; }
        .status-filters { display: flex; background: #f1f5f9; padding: 0.25rem; border-radius: 8px; }
        .filter-tab { padding: 0.4rem 1rem; border: none; background: transparent; border-radius: 6px; font-size: 0.875rem; font-weight: 500; color: #64748b; transition: all 0.2s; cursor: pointer; }
        .filter-tab.active { background: white; color: #1e293b; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .view-switch { display: flex; gap: 0.25rem; }
        .view-btn { padding: 0.5rem; background: white; border: 1px solid #e2e8f0; border-radius: 6px; color: #64748b; cursor: pointer; }
        .view-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .tasks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
        .tasks-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .tasks-list .task-item { display: grid; grid-template-columns: 132px minmax(0, 1fr); }
        .tasks-list .task-preview { height: 100%; min-height: 112px; }
        .tasks-list .task-content { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 1rem; align-items: center; padding: 1rem; }
        .tasks-list .task-id-row, .tasks-list .task-meta { margin: 0; }
        .tasks-list .task-actions { min-width: 170px; }
        .tasks-grid .task-item { display: grid; grid-template-rows: 150px minmax(0, 1fr); }
        .tasks-grid .task-content { display: grid; gap: 0.75rem; min-width: 0; }
        .tasks-grid .task-id-row { min-width: 0; }
        .tasks-grid .task-meta { gap: 0.75rem; justify-content: flex-start; flex-wrap: wrap; }
        .task-item { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; transition: transform 0.2s, box-shadow 0.2s; }
        .task-item:hover { transform: translateY(-4px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .task-preview { height: 140px; background: #f8fafc; position: relative; display: flex; align-items: center; justify-content: center; }
        .task-img-preview { width: 100%; height: 100%; object-fit: cover; }
        .task-id-badge { position: absolute; top: 8px; left: 8px; background: rgba(15, 23, 42, 0.8); color: white; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-family: monospace; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .task-status-preview { position: absolute; top: 8px; right: 8px; padding: 0.2rem 0.7rem; border-radius: 999px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; z-index: 10; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); background-color: white !important; }
        .task-content { padding: 1.25rem; }
        .task-name-wrapper { display: flex; flex-direction: column; gap: 0.2rem; }
        .task-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em; }
        .task-name { margin: 0; font-size: 0.95rem; font-weight: 700; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .task-id-row { display: flex; align-items: center; gap: 0.5rem; margin: 0.75rem 0; background: #f8fafc; padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #f1f5f9; }
        .id-tag { font-size: 0.6rem; font-weight: 800; background: #e2e8f0; color: #475569; padding: 0.1rem 0.3rem; border-radius: 3px; }
        .id-value { font-size: 0.75rem; color: #64748b; font-family: 'JetBrains Mono', 'Fira Code', monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .task-meta { display: flex; justify-content: space-between; align-items: center; color: #94a3b8; font-size: 0.75rem; margin-bottom: 1rem; border-top: 1px solid #f8fafc; pt: 0.5rem; }
        .meta-item { display: flex; align-items: center; gap: 0.4rem; }
        .task-actions { display: flex; gap: 0.5rem; }
        .action-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem; border-radius: 6px; transition: all 0.2s; cursor: pointer; }
        .action-btn--primary { flex: 1; background: #10b981; color: white; border: none; font-weight: 500; }
        .action-btn--primary:hover { background: #059669; }
        .action-btn--icon { background: white; border: 1px solid #e2e8f0; color: #64748b; }
        .loading-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .tasks-header { align-items: flex-start; gap: 1rem; }
          .back-btn { width: auto; flex-shrink: 0; }
          .project-title-area { min-width: 0; }
          .project-title-area .project-id { display: block; overflow-wrap: anywhere; }
          .filter-actions { align-items: stretch; }
          .status-filters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); width: 100%; }
          .filter-tab { padding: 0.45rem 0.35rem; white-space: normal; }
          .tasks-grid { grid-template-columns: 1fr; gap: 0.875rem; }
          .tasks-list .task-item { grid-template-columns: 132px minmax(0, 1fr); }
          .tasks-list .task-content { display: grid; grid-template-columns: 1fr; gap: 0.65rem; }
          .task-meta { justify-content: flex-start; gap: 0.75rem; flex-wrap: wrap; }
          .task-actions { align-items: stretch; }
          .action-btn--primary { min-width: 0; }
        }
      `}} />
    </div>
  );
}
