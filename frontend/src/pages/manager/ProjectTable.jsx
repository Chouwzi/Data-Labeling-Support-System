import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Eye, MoreHorizontal, Clock, FolderPlus, AlignLeft } from 'lucide-react';

export default function ProjectTable({ projects = [], statusColors = {}, totalProjects = 42 }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuProjectId, setActiveMenuProjectId] = useState(null);
  const itemsPerPage = 4;
  const navigate = useNavigate();

  const paginated = projects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(projects.length / itemsPerPage);

  const handleMoreClick = (projectId, e) => {
    e.stopPropagation();
    setActiveMenuProjectId(activeMenuProjectId === projectId ? null : projectId);
  };

  useEffect(() => {
    const handleClose = () => setActiveMenuProjectId(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  return (
    <div className="project-table-card">
      {/* Header */}
      <div className="project-table-card__header">
        <div>
          <h3 className="project-table-card__title">Current Projects</h3>
          <p className="project-table-card__subtitle">
            Showing {paginated.length} of {projects.length} projects
            {projects.length !== totalProjects && ` (filtered from ${totalProjects} total)`}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="project-table-wrap">
        <table className="project-table" role="table">
          <thead>
            <tr>
              <th scope="col" className="project-table__th--project">Project</th>
              <th scope="col">Status</th>
              <th scope="col">Progress</th>
              <th scope="col" className="project-table__th--numeric">Images</th>
              <th scope="col" className="project-table__th--numeric">Labels</th>
              <th scope="col" className="project-table__th--actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((project) => {
              const status = statusColors[project.status] || {
                bg: '#dcfce7',
                text: '#15803d',
                label: project.status,
              };

              return (
                <tr key={project.id} className="project-table__row">
                  {/* Project Name + Thumbnail */}
                  <td className="project-table__td--project">
                    <div className="project-table__name">
                      <div className="project-table__thumb-wrap">
                        <img
                          src={project.imageUrl}
                          alt=""
                          className="project-table__thumb"
                          aria-hidden="true"
                          loading="lazy"
                        />
                        <div
                          className="project-table__thumb-overlay"
                          style={{ backgroundColor: status.bg + 'cc' }}
                        />
                      </div>
                      <div className="project-table__name-info">
                        <p className="project-table__name-text">{project.name}</p>
                        <p className="project-table__name-meta">
                          <span className="project-table__category-tag">{project.category}</span>
                          <span className="project-table__created">
                            <Clock size={10} />
                            {(() => {
                              const dateVal = project.created_at || project.createdAt || project.created;
                              if (!dateVal) return 'N/A';
                              if (typeof dateVal === 'string' && dateVal.includes('/')) return dateVal; // already formatted
                              try {
                                if (Array.isArray(dateVal)) {
                                  const [y, m, d] = dateVal;
                                  return new Date(y, m - 1, d).toLocaleDateString();
                                }
                                const d = new Date(dateVal);
                                return isNaN(d) ? 'N/A' : d.toLocaleDateString();
                              } catch {
                                return 'N/A';
                              }
                            })()}
                          </span>
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td>
                    <span
                      className="status-badge status-badge--pill"
                      style={{ backgroundColor: status.bg, color: status.text }}
                    >
                      <span
                        className={`status-badge__dot status-badge__dot--${project.status}`}
                        aria-hidden="true"
                      />
                      {status.label}
                    </span>
                  </td>

                  {/* Progress */}
                  <td>
                    <div className="project-progress">
                      <div className="project-progress__header">
                        <span className="project-progress__label">{project.progress || 0}%</span>
                      </div>
                      <div
                        className="project-progress__bar"
                        role="progressbar"
                        aria-valuenow={project.progress || 0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`project-progress__fill project-progress__fill--${project.status?.toLowerCase() || 'draft'}`}
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Images count */}
                  <td className="project-table__td--numeric">
                    <span className="project-table__metric">
                      {(project.imageCount || project.images || 0).toLocaleString()}
                    </span>
                  </td>

                  {/* Labels count */}
                  <td className="project-table__td--numeric">
                    <span className="project-table__metric">
                      {(Array.isArray(project.labels) ? project.labels.length : (project.labels || 0)).toLocaleString()}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="project-table__td--actions">
                    <div className="project-table__actions" style={{ position: 'relative', display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="project-table__action-btn project-table__action-btn--edit"
                        aria-label={`Edit ${project.name}`}
                        title="Edit Taxonomy"
                        onClick={() => navigate(`/manager/taxonomy/${project.id}`)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="project-table__action-btn project-table__action-btn--view"
                        aria-label={`View ${project.name}`}
                        title="Assign Images"
                        onClick={() => navigate('/manager/annotators')}
                      >
                        <Eye size={14} />
                      </button>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          type="button"
                          className="project-table__action-btn project-table__action-btn--more"
                          aria-label="More options"
                          title="More Actions"
                          onClick={(e) => handleMoreClick(project.id, e)}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        
                        {activeMenuProjectId === project.id && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.375rem',
                            width: '180px',
                            background: '#ffffff',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            zIndex: 220,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0.25rem 0'
                          }}>
                            <button
                              type="button"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                border: 'none',
                                background: 'transparent',
                                fontSize: '0.8125rem',
                                color: '#374151',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              onClick={() => navigate(`/manager/taxonomy/${project.id}`)}
                            >
                              <Edit2 size={13} style={{ color: '#6b7280' }} />
                              Taxonomy Labels
                            </button>
                            <button
                              type="button"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                border: 'none',
                                background: 'transparent',
                                fontSize: '0.8125rem',
                                color: '#374151',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              onClick={() => navigate('/manager/annotators')}
                            >
                              <Eye size={13} style={{ color: '#6b7280' }} />
                              Assign Images
                            </button>
                            <button
                              type="button"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                border: 'none',
                                background: 'transparent',
                                fontSize: '0.8125rem',
                                color: '#374151',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              onClick={() => navigate('/manager/upload-images')}
                            >
                              <FolderPlus size={13} style={{ color: '#6b7280' }} />
                              Upload Images
                            </button>
                            <button
                              type="button"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                border: 'none',
                                background: 'transparent',
                                fontSize: '0.8125rem',
                                color: '#374151',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              onClick={() => navigate('/manager/reports')}
                            >
                              <AlignLeft size={13} style={{ color: '#6b7280' }} />
                              Progress Report
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {totalPages > 1 && (
        <div className="project-table-card__footer">
          <p className="project-table-card__footer-text">
            Page {currentPage} of {totalPages}
          </p>
          <div className="pagination-btns">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`pagination-btn ${currentPage === page ? 'pagination-btn--active' : ''}`}
                onClick={() => setCurrentPage(page)}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
