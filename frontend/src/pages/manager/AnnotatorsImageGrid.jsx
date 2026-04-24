import { useState, useCallback } from 'react';
import { ArrowLeft, Check, Image as ImageIcon, Loader, LayoutGrid } from 'lucide-react';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import Toast from '@/components/Toast';
import AnnotatorSelect from '@/components/AnnotatorSelect';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '@/styles/AnnotatorsImageGrid.css';

/* ── Mock images ──────────────────────────────────────────────── */

const INITIAL_IMAGES = [
  { id: 1, imageUrl: 'https://images.unsplash.com/photo-1767039050462-6c21a0ad1874?w=400&h=300&fit=crop', fileName: 'aerial_view_city_001.jpg', project: 'Urban Mapping Alpha', resolution: '1920×1080' },
  { id: 2, imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop', fileName: 'street_scene_tokyo_002.jpg', project: 'Autonomous Vehicle V4', resolution: '1920×1080' },
  { id: 3, imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop', fileName: 'forest_canopy_drone_003.jpg', project: 'Ecological Survey Beta', resolution: '3840×2160' },
  { id: 4, imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop', fileName: 'office_interior_004.jpg', project: 'Smart Building Dataset', resolution: '2560×1440' },
  { id: 5, imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop', fileName: 'medical_xray_005.jpg', project: 'Medical Imaging V2', resolution: '2048×2048' },
  { id: 6, imageUrl: 'https://images.unsplash.com/photo-1579820010410-c10411aaaa88?w=400&h=300&fit=crop', fileName: 'satellite_agriculture_006.jpg', project: 'Agricultural Monitor', resolution: '4096×4096' },
  { id: 7, imageUrl: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=400&h=300&fit=crop', fileName: 'night_traffic_hk_007.jpg', project: 'Autonomous Vehicle V4', resolution: '1920×1080' },
  { id: 8, imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop', fileName: 'coastline_satellite_008.jpg', project: 'Coastal Erosion Study', resolution: '3840×2160' },
  { id: 9, imageUrl: 'https://images.unsplash.com/photo-1615746934560-3f38a9e4dd2a?w=400&h=300&fit=crop', fileName: 'warehouse_indoor_009.jpg', project: 'Logistics Automation', resolution: '2560×1440' },
  { id: 10, imageUrl: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&h=300&fit=crop', fileName: 'sports_stadium_010.jpg', project: 'Event Detection AI', resolution: '1920×1080' },
];

/* ── Mock annotators ─────────────────────────────────────────── */

const MOCK_ANNOTATORS = [
  { id: 'a1', name: 'Alice Wong', email: 'alice@datalabel.pro', workload: 12 },
  { id: 'a2', name: 'Marcus Chen', email: 'marcus.chen@datalabel.pro', workload: 8 },
  { id: 'a3', name: 'Priya Nair', email: 'priya.nair@datalabel.pro', workload: 5 },
  { id: 'a4', name: 'Jordan Ellis', email: 'jordan.ellis@datalabel.pro', workload: 17 },
  { id: 'a5', name: 'Sofia Reyes', email: 'sofia.reyes@datalabel.pro', workload: 3 },
];

/* ── Component ────────────────────────────────────────────────── */

export default function AnnotatorsImageGrid() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [images, setImages] = useState(INITIAL_IMAGES.map(img => ({ ...img, status: 'unassigned', assignee: null })));
  const [activeTab, setActiveTab] = useState('unassigned');
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [selectedAnnotatorId, setSelectedAnnotatorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [toast, setToast] = useState(null);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  /* ── Selection ─────────────────────────────────────────────── */

  const toggleImage = (imageId) => {
    if (activeTab !== 'unassigned') return;
    setSelectedImageIds((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  };

  const selectAll = () => {
    if (activeTab !== 'unassigned') return;
    setSelectedImageIds(images.filter(img => img.status === 'unassigned').map((img) => img.id));
  };
  const clearSelection = () => setSelectedImageIds([]);

  /* ── Assign ───────────────────────────────────────────────── */

  const handleAssign = useCallback(() => {
    if (selectedImageIds.length === 0 || !selectedAnnotatorId) return;
    const annotator = MOCK_ANNOTATORS.find((a) => a.id === selectedAnnotatorId);
    if (!annotator) return;

    setIsAssigning(true);
    setTimeout(() => {
      setImages((prev) => prev.map((img) => 
        selectedImageIds.includes(img.id)
          ? { ...img, status: 'assigned', assignee: annotator.name }
          : img
      ));
      setSelectedImageIds([]);
      setSelectedAnnotatorId('');
      setIsAssigning(false);

      const count = selectedImageIds.length;
      setToast({
        message: `Successfully allocated ${count} image${count !== 1 ? 's' : ''} to ${annotator.name}`,
      });
    }, 1600);
  }, [selectedImageIds, selectedAnnotatorId]);

  const closeToast = useCallback(() => setToast(null), []);

  /* ── Derived ──────────────────────────────────────────────── */

  const displayedImages = images.filter((img) => img.status === activeTab);
  const selectedCount = selectedImageIds.length;
  const totalCount = displayedImages.length;
  const hasSelection = selectedCount > 0 && activeTab === 'unassigned';
  const canAssign = hasSelection && !!selectedAnnotatorId && !isAssigning;

  const userName = user?.fullName || user?.email || 'Manager';
  const userRole = user?.role === 'MANAGER' ? 'Lead Curator' : (user?.role || 'MANAGER');

  /* ── Render ───────────────────────────────────────────────── */

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
            <button type="button" className="aig-back-btn" onClick={() => navigate('/manager', { replace: true })}>
              <ArrowLeft size={15} />
              <span>Dashboard</span>
            </button>

            <div className="aig-page-header__brand">
              <LayoutGrid size={18} className="aig-page-header__brand-icon" />
              <span className="aig-page-header__brand-name">DataLabel Pro</span>
            </div>

            <h1 className="aig-page-title">Assign Images to Annotators</h1>
            <p className="aig-page-subtitle">
              Select images and choose an annotator to allocate work items to your team.
            </p>
          </div>

          {/* Tabs */}
          <div className="aig-tabs">
            <button
              className={`aig-tab ${activeTab === 'unassigned' ? 'aig-tab--active' : ''}`}
              onClick={() => { setActiveTab('unassigned'); clearSelection(); }}
            >
              Waiting List ({images.filter(img => img.status === 'unassigned').length})
            </button>
            <button
              className={`aig-tab ${activeTab === 'assigned' ? 'aig-tab--active' : ''}`}
              onClick={() => { setActiveTab('assigned'); clearSelection(); }}
            >
              Assigned ({images.filter(img => img.status === 'assigned').length})
            </button>
          </div>

          {/* Image Grid — dynamic padding for sticky bar */}
          {displayedImages.length > 0 ? (
            <div
              className={`aig-grid ${hasSelection ? 'aig-grid--has-selection' : ''}`}
              role="list"
              aria-label={`${activeTab === 'unassigned' ? 'Unassigned' : 'Assigned'} images`}
            >
              {displayedImages.map((image) => {
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
                      <img src={image.imageUrl} alt={image.fileName} className="aig-card__img" loading="lazy" />

                      {/* Selection overlay */}
                      <div className="aig-card__overlay" aria-hidden="true">
                        <div className="aig-card__check-circle">
                          <Check size={18} strokeWidth={3} />
                        </div>
                      </div>

                      {/* Corner check badge */}
                      {isSelected && (
                        <div className="aig-card__corner-badge" aria-hidden="true">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="aig-card__body">
                      <p className="aig-card__file-name" title={image.fileName}>{image.fileName}</p>
                      <div className="aig-card__meta">
                        <span className="aig-card__project">{image.project}</span>
                        <span className="aig-card__resolution">{image.resolution}</span>
                      </div>
                      <div className="aig-card__status">
                        {image.status === 'unassigned' ? (
                          <span className="aig-unassigned-badge">
                            <span className="aig-unassigned-badge__dot" />
                            unassigned
                          </span>
                        ) : (
                          <span className="aig-assigned-badge">
                            <Check size={12} strokeWidth={3} style={{ marginRight: '4px' }} />
                            Assigned to {image.assignee}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="aig-empty-state">
              <div className="aig-empty-state__icon-wrap">
                <ImageIcon size={32} strokeWidth={1.5} />
              </div>
              <h2 className="aig-empty-state__title">No images found</h2>
              <p className="aig-empty-state__body">
                {activeTab === 'unassigned' 
                  ? 'All images have been allocated to annotators. New uploads will appear here.'
                  : 'No images have been assigned yet.'}
              </p>
            </div>
          )}

          {/* Bottom info bar */}
          <div className="aig-bottom-bar">
            <div className="aig-bottom-bar__info">
              <ImageIcon size={14} strokeWidth={2} />
              <span>
                Showing <strong>{totalCount}</strong> unassigned image{totalCount !== 1 ? 's' : ''}
                {hasSelection && <> &mdash; <strong>{selectedCount} selected</strong></>}
              </span>
            </div>
            <p className="aig-bottom-bar__hint">
              Click any card to toggle selection. Choose an annotator and click Assign to allocate.
            </p>
          </div>
        </main>
      </div>

      {/* Sticky Bottom Action Bar — fixed at viewport bottom */}
      <div
        className={`aig-sticky-bar-wrapper ${hasSelection ? 'aig-sticky-bar-wrapper--active' : ''}`}
        aria-live="polite"
      >
        <div className="aig-sticky-bar" role="toolbar" aria-label="Image allocation controls">
          {/* Left: selection info */}
          <div className="aig-sticky-bar__left">
            <div className="aig-selection-pill">
              <span className="aig-selection-pill__dot" aria-hidden="true" />
              <span className="aig-selection-pill__count">{selectedCount}</span>
              <span className="aig-selection-pill__label">
                {selectedCount === 1 ? 'image selected' : 'images selected'}
              </span>
            </div>

            <div className="aig-sticky-bar__controls">
              {hasSelection && selectedCount < totalCount && (
                <button type="button" className="aig-link-btn" onClick={selectAll} aria-label="Select all images">
                  Select all ({totalCount})
                </button>
              )}
              {hasSelection && (
                <button type="button" className="aig-link-btn aig-link-btn--muted" onClick={clearSelection} aria-label="Clear selection">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right: annotator select + assign */}
          <div className="aig-sticky-bar__right">
            <div className="aig-assign-controls">
              <AnnotatorSelect
                annotators={MOCK_ANNOTATORS}
                selectedId={selectedAnnotatorId}
                onChange={setSelectedAnnotatorId}
                placeholder="Choose annotator..."
                disabled={!hasSelection}
              />

              <button
                type="button"
                className={`aig-assign-btn ${isAssigning ? 'aig-assign-btn--loading' : ''}`}
                onClick={handleAssign}
                disabled={!canAssign}
                aria-label={`Assign ${selectedCount} image${selectedCount !== 1 ? 's' : ''} to annotator`}
              >
                {isAssigning ? (
                  <>
                    <Loader size={15} className="aig-assign-btn__spinner" aria-hidden="true" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} strokeWidth={2.5} aria-hidden="true" />
                    <span>
                      Assign {selectedCount > 0 ? `${selectedCount} ` : ''}Image{selectedCount !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast message={toast.message} onClose={closeToast} />
      )}
    </div>
  );
}
