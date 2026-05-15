import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { getProjects } from '@/services/api';
import { FileText, Download, ExternalLink, Info, BookOpen, Search } from 'lucide-react';
import Topbar from '@/components/common/Topbar';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import '@/styles/Dashboard.css';
import '@/styles/ManagerDashboard.css';

export default function AnnotatorDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const res = await getProjects();
        const mockData = [
          {
            id: 'mock-1',
            name: 'Urban Infrastructure Mapping',
            description: 'Identifying building footprints and road networks from high-resolution satellite imagery.',
            guidelineUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            labels: [
              { name: 'Building', color: '#3b82f6', rule: 'Outline all permanent structures.' },
              { name: 'Road', color: '#64748b', rule: 'Map paved and unpaved pathways.' },
              { name: 'Vegetation', color: '#22c55e', rule: 'Include forests and small parks.' },
              { name: 'Water', color: '#0ea5e9', rule: 'Highlight rivers, lakes, and pools.' }
            ]
          },
          {
            id: 'mock-2',
            name: 'Agricultural Crop Classification',
            description: 'Classifying different types of crops (corn, wheat, soy) based on spectral signatures.',
            guidelineUrl: null,
            labels: [
              { name: 'Corn', color: '#eab308', rule: 'Yellowish hues in early July.' },
              { name: 'Wheat', color: '#f59e0b', rule: 'Golden brown before harvest.' },
              { name: 'Soybean', color: '#84cc16', rule: 'Green lush rows in late summer.' }
            ]
          },
          {
            id: 'mock-3',
            name: 'Traffic Sign Recognition',
            description: 'Labeling standard traffic signs and signal states for autonomous vehicle training.',
            guidelineUrl: 'https://raw.githubusercontent.com/mdn/learning-area/master/html/forms/file-examples/test.txt',
            labels: [
              { name: 'Prohibitory', color: '#ef4444', rule: 'Circular with red borders.' },
              { name: 'Warning', color: '#f97316', rule: 'Triangular yellow backgrounds.' },
              { name: 'Mandatory', color: '#2563eb', rule: 'Circular blue backgrounds.' }
            ]
          },
          {
            id: 'mock-4',
            name: 'Self-Driving Car Perception',
            description: 'Complex multi-object detection for advanced autonomous driving systems.',
            guidelineUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            labels: [
              { name: 'Car', color: '#3b82f6', rule: 'All passenger vehicles.' },
              { name: 'Truck', color: '#1d4ed8', rule: 'Large transport vehicles.' },
              { name: 'Bus', color: '#1e40af', rule: 'Public transit vehicles.' },
              { name: 'Motorcycle', color: '#60a5fa', rule: 'Two-wheeled motor vehicles.' },
              { name: 'Bicycle', color: '#93c5fd', rule: 'Non-motorized cycles.' },
              { name: 'Pedestrian', color: '#f43f5e', rule: 'Include people with strollers.' },
              { name: 'Traffic Light', color: '#fbbf24', rule: 'Capture all signal states.' },
              { name: 'Stop Sign', color: '#dc2626', rule: 'Octagonal red signs only.' },
              { name: 'Lane Mark', color: '#ffffff', rule: 'White and yellow road lines.' },
              { name: 'Sidewalk', color: '#94a3b8', rule: 'Designated walking paths.' },
              { name: 'Fence', color: '#475569', rule: 'All types of barriers.' },
              { name: 'Sky', color: '#7dd3fc', rule: 'Upper background region.' }
            ]
          }
        ];

        let data = res.data?.result?.data || res.data?.result || res.data || [];
        data = Array.isArray(data) ? data : [];
        setProjects(data);
      } catch (err) {
        // Task 84 will handle real integration. For now, silence 403 to keep console clean.
        if (err.response?.status === 403) {
          console.warn('Dashboard running in Preview Mode (using mock data).');
        } else {
          console.error('Project fetch error:', err);
        }
        
        const mockData = [
          {
            id: 'mock-1',
            name: 'Urban Infrastructure Mapping',
            description: 'Identifying building footprints and road networks from high-resolution satellite imagery.',
            guidelineUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            labels: [
              { name: 'Building', color: '#3b82f6', rule: 'Outline all permanent structures.' },
              { name: 'Road', color: '#64748b', rule: 'Map paved and unpaved pathways.' },
              { name: 'Vegetation', color: '#22c55e', rule: 'Include forests and small parks.' },
              { name: 'Water', color: '#0ea5e9', rule: 'Highlight rivers, lakes, and pools.' }
            ]
          },
          {
            id: 'mock-2',
            name: 'Agricultural Crop Classification',
            description: 'Classifying different types of crops (corn, wheat, soy) based on spectral signatures.',
            guidelineUrl: null,
            labels: [
              { name: 'Corn', color: '#eab308', rule: 'Yellowish hues in early July.' },
              { name: 'Wheat', color: '#f59e0b', rule: 'Golden brown before harvest.' },
              { name: 'Soybean', color: '#84cc16', rule: 'Green lush rows in late summer.' }
            ]
          },
          {
            id: 'mock-3',
            name: 'Traffic Sign Recognition',
            description: 'Labeling standard traffic signs and signal states for autonomous vehicle training.',
            guidelineUrl: 'https://raw.githubusercontent.com/mdn/learning-area/master/html/forms/file-examples/test.txt',
            labels: [
              { name: 'Prohibitory', color: '#ef4444', rule: 'Circular with red borders.' },
              { name: 'Warning', color: '#f97316', rule: 'Triangular yellow backgrounds.' },
              { name: 'Mandatory', color: '#2563eb', rule: 'Circular blue backgrounds.' }
            ]
          },
          {
            id: 'mock-4',
            name: 'Self-Driving Car Perception',
            description: 'Complex multi-object detection for advanced autonomous driving systems.',
            guidelineUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            labels: [
              { name: 'Car', color: '#3b82f6', rule: 'All passenger vehicles.' },
              { name: 'Truck', color: '#1d4ed8', rule: 'Large transport vehicles.' },
              { name: 'Bus', color: '#1e40af', rule: 'Public transit vehicles.' },
              { name: 'Motorcycle', color: '#60a5fa', rule: 'Two-wheeled motor vehicles.' },
              { name: 'Bicycle', color: '#93c5fd', rule: 'Non-motorized cycles.' },
              { name: 'Pedestrian', color: '#f43f5e', rule: 'Include people with strollers.' },
              { name: 'Traffic Light', color: '#fbbf24', rule: 'Capture all signal states.' },
              { name: 'Stop Sign', color: '#dc2626', rule: 'Octagonal red signs only.' },
              { name: 'Lane Mark', color: '#ffffff', rule: 'White and yellow road lines.' },
              { name: 'Sidewalk', color: '#94a3b8', rule: 'Designated walking paths.' },
              { name: 'Fence', color: '#475569', rule: 'All types of barriers.' },
              { name: 'Sky', color: '#7dd3fc', rule: 'Upper background region.' }
            ]
          }
        ];
        
        setProjects(mockData);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
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
          showCenterLinks
        />

        <main className="manager-content">
          <div className="dashboard-content fade-in-up">
            <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">156</span>
              <span className="stat-label">Labels Completed</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">24</span>
              <span className="stat-label">Working Hours</span>
            </div>
          </div>
        </div>

        {/* Guideline Section */}
        <div className="guideline-section">
          <div className="section-header">
            <BookOpen size={20} className="section-icon" />
            <h3 className="section-title">PROJECT GUIDELINES</h3>
          </div>

          {isLoading ? (
            <div className="loading-state">Loading projects...</div>
          ) : loadError ? (
            <div className="empty-guideline">
              <Info size={32} />
              <p>{loadError}</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-guideline">
              <Info size={32} />
              <p>You are not assigned to any projects yet.</p>
            </div>
          ) : (
            <div className="guideline-grid">
              {projects.map((project) => (
                <ProjectGuidelineCard key={project.id} project={project} />
              ))}
            </div>
          )}
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Sub-component for individual project card to manage its own search state
function ProjectGuidelineCard({ project }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLabels = (project.labels || []).filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="guideline-card">
      <div className="guideline-card__info">
        <div className="guideline-card__icon">
          <FileText size={24} />
        </div>
        <div className="guideline-card__details">
          <h4 className="guideline-card__name">{project.name || 'Unnamed Project'}</h4>
          <p className="guideline-card__desc">
            {project.description || 'No project description available.'}
          </p>
        </div>
      </div>

      {/* Task 83: Enhanced Label Taxonomy / Legend with scroll */}
      <div className="label-taxonomy">
        <div className="taxonomy-header">
          <h5 className="taxonomy-title">LABEL LEGEND</h5>
          <div className="taxonomy-search">
            <Search size={12} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search labels..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="taxonomy-grid scrollable-taxonomy">
          {filteredLabels.map((label, idx) => (
            <div key={idx} className="taxonomy-item" title={label.rule || `Rules for ${label.name}`}>
              <span 
                className="taxonomy-color" 
                style={{ backgroundColor: label.color }} 
              />
              <div className="taxonomy-info">
                <span className="taxonomy-name">{label.name}</span>
                <span className="taxonomy-rule">{label.rule || 'Standard labeling rules apply.'}</span>
              </div>
            </div>
          ))}
          {filteredLabels.length === 0 && (
            <span className="taxonomy-empty">
              {searchTerm ? 'No matching labels' : 'No labels defined'}
            </span>
          )}
        </div>
      </div>
      
      <div className="guideline-card__actions">
        {project.guidelineUrl ? (
          <>
            <button 
              className="guideline-btn guideline-btn--view"
              onClick={() => window.open(project.guidelineUrl, '_blank')}
              title="View Online"
            >
              <ExternalLink size={16} />
              <span>View</span>
            </button>
            <a 
              href={project.guidelineUrl} 
              download 
              className="guideline-btn guideline-btn--download"
              title="Download File"
            >
              <Download size={16} />
              <span>Download</span>
            </a>
          </>
        ) : (
          <span className="guideline-not-available">
            Guideline not available
          </span>
        )}
      </div>
    </div>
  );
}
