import { useState, useCallback } from 'react';
import { ArrowLeft, Check, X, Image as ImageIcon, Loader } from 'lucide-react';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '@/styles/AnnotatorsImageGrid.css';

const MOCK_IMAGES = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1767039050462-6c21a0ad1874?w=400&h=300&fit=crop',
    fileName: 'aerial_view_city_001.jpg',
    status: 'unassigned',
    project: 'Urban Mapping Alpha',
    resolution: '1920×1080',
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop',
    fileName: 'street_scene_tokyo_002.jpg',
    status: 'unassigned',
    project: 'Autonomous Vehicle V4',
    resolution: '1920×1080',
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
    fileName: 'forest_canopy_drone_003.jpg',
    status: 'unassigned',
    project: 'Ecological Survey Beta',
    resolution: '3840×2160',
  },
  {
    id: 4,
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop',
    fileName: 'office_interior_004.jpg',
    status: 'unassigned',
    project: 'Smart Building Dataset',
    resolution: '2560×1440',
  },
  {
    id: 5,
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
    fileName: 'medical_xray_005.jpg',
    status: 'unassigned',
    project: 'Medical Imaging V2',
    resolution: '2048×2048',
  },
  {
    id: 6,
    imageUrl: 'https://images.unsplash.com/photo-1579820010410-c10411aaaa88?w=400&h=300&fit=crop',
    fileName: 'satellite_agriculture_006.jpg',
    status: 'unassigned',
    project: 'Agricultural Monitor',
    resolution: '4096×4096',
  },
  {
    id: 7,
    imageUrl: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=400&h=300&fit=crop',
    fileName: 'night_traffic_hk_007.jpg',
    status: 'unassigned',
    project: 'Autonomous Vehicle V4',
    resolution: '1920×1080',
  },
  {
    id: 8,
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop',
    fileName: 'coastline_satellite_008.jpg',
    status: 'unassigned',
    project: 'Coastal Erosion Study',
    resolution: '3840×2160',
  },
  {
    id: 9,
    imageUrl: 'https://images.unsplash.com/photo-1615746934560-3f38a9e4dd2a?w=400&h=300&fit=crop',
    fileName: 'warehouse_indoor_009.jpg',
    status: 'unassigned',
    project: 'Logistics Automation',
    resolution: '2560×1440',
  },
  {
    id: 10,
    imageUrl: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&h=300&fit=crop',
    fileName: 'sports_stadium_010.jpg',
    status: 'unassigned',
    project: 'Event Detection AI',
    resolution: '1920×1080',
  },
];

export default function AnnotatorsImageGrid() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationDone, setAllocationDone] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleImage = (imageId) => {
    setSelectedImageIds((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  };

  const selectAll = () => {
    setSelectedImageIds(MOCK_IMAGES.map((img) => img.id));
  };

  const clearSelection = () => {
    setSelectedImageIds([]);
  };

  const handleAllocate = () => {
    if (selectedImageIds.length === 0) return;
    setIsAllocating(true);
    setTimeout(() => {
      setIsAllocating(false);
      setAllocationDone(true);
      setTimeout(() => {
        setAllocationDone(false);
        setSelectedImageIds([]);
      }, 2500);
    }, 1800);
  };

  const selectedCount = selectedImageIds.length;
  const totalCount = MOCK_IMAGES.length;
  const allSelected = selectedCount === totalCount;

  const userName = user?.fullName || user?.email || 'Manager';
  const userRole = user?.role === 'MANAGER' ? 'Lead Curator' : (user?.role || 'MANAGER');

  return (
    <div className="manager-layout">
      <ManagerSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />

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
          {/* Page Header */}
          <div className="aig-page-header">
            <div className="aig-page-header__top">
              <button
                type="button"
                className="aig-back-btn"
                onClick={() => navigate('/manager', { replace: true })}
              >
                <ArrowLeft size={16} />
                <span>Dashboard</span>
              </button>
            </div>
            <div className="aig-page-header__brand">
              <ImageIcon size={20} className="aig-page-header__brand-icon" />
              <span className="aig-page-header__brand-name">DataLabel Pro</span>
            </div>
            <h1 className="aig-page-title">Assign Images to Annotators</h1>
            <p className="aig-page-subtitle">
              Select one or more unassigned images below to allocate them to your annotation team.
            </p>
          </div>

          {/* Selection Action Bar */}
          <div className="aig-action-bar">
            <div className="aig-action-bar__left">
              <div className="aig-selection-counter">
                <span className="aig-selection-counter__number">{selectedCount}</span>
                <span className="aig-selection-counter__label">
                  {selectedCount === 1 ? 'image selected' : 'images selected'}
                </span>
              </div>

              {selectedCount > 0 && selectedCount < totalCount && (
                <button
                  type="button"
                  className="aig-text-btn"
                  onClick={selectAll}
                >
                  Select all ({totalCount})
                </button>
              )}

              {selectedCount > 0 && (
                <button
                  type="button"
                  className="aig-text-btn aig-text-btn--danger"
                  onClick={clearSelection}
                >
                  Clear selection
                </button>
              )}
            </div>

            <div className="aig-action-bar__right">
              {selectedCount > 0 && (
                <div className="aig-total-counter">
                  {selectedCount} of {totalCount} images
                </div>
              )}

              <button
                type="button"
                className={`aig-allocate-btn ${allocationDone ? 'aig-allocate-btn--success' : ''}`}
                onClick={handleAllocate}
                disabled={selectedCount === 0 || isAllocating || allocationDone}
              >
                {isAllocating ? (
                  <>
                    <Loader size={16} className="aig-spinner" />
                    <span>Allocating...</span>
                  </>
                ) : allocationDone ? (
                  <>
                    <Check size={16} />
                    <span>Allocated!</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Allocate {selectedCount > 0 ? `${selectedCount} ` : ''}Image{selectedCount !== 1 ? 's' : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Image Grid */}
          <div className="aig-grid" role="list" aria-label="Unassigned images">
            {MOCK_IMAGES.map((image) => {
              const isSelected = selectedImageIds.includes(image.id);
              return (
                <article
                  key={image.id}
                  className={`aig-card ${isSelected ? 'aig-card--selected' : ''}`}
                  role="listitem"
                  onClick={() => toggleImage(image.id)}
                  aria-selected={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleImage(image.id);
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <div className="aig-card__thumb">
                    <img
                      src={image.imageUrl}
                      alt={image.fileName}
                      className="aig-card__img"
                      loading="lazy"
                    />

                    {/* Selection overlay */}
                    <div className="aig-card__overlay" aria-hidden="true">
                      <div className="aig-card__check-circle">
                        <Check size={18} strokeWidth={3} />
                      </div>
                    </div>

                    {/* Selected corner accent */}
                    {isSelected && (
                      <div className="aig-card__selected-badge" aria-hidden="true">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="aig-card__body">
                    <div className="aig-card__file-row">
                      <span className="aig-card__file-name" title={image.fileName}>
                        {image.fileName}
                      </span>
                    </div>
                    <div className="aig-card__meta">
                      <span className="aig-card__project">{image.project}</span>
                      <span className="aig-card__resolution">{image.resolution}</span>
                    </div>
                    <div className="aig-card__status">
                      <span className="aig-status-badge">
                        <span className="aig-status-badge__dot" />
                        {image.status}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Bottom info bar */}
          <div className="aig-bottom-bar">
            <div className="aig-bottom-bar__info">
              <ImageIcon size={14} />
              <span>
                Showing {totalCount} unassigned images &bull;{' '}
                <strong>{selectedCount} selected</strong>
              </span>
            </div>
            <p className="aig-bottom-bar__hint">
              Click any card to select it. Click again to deselect. All selections are local — no changes are saved until you click Allocate.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
