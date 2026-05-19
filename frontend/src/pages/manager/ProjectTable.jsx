import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Edit2, Eye, MoreHorizontal, Clock, FolderPlus, Trash2 } from 'lucide-react';

export default function ProjectTable({ projects = [], statusColors = {}, totalProjects = 42, onEdit, onDelete }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuProjectId, setActiveMenuProjectId] = useState(null);
  const itemsPerPage = 4;
  const navigate = useNavigate();

  const userRole = localStorage.getItem('role') || 'MANAGER';
  const prefix = userRole === 'ADMIN' ? '/admin' : '/manager';

  const paginated = projects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(projects.length / itemsPerPage);

  const handleMoreClick = (projectId, e) => {
    e.stopPropagation();
    setActiveMenuProjectId(activeMenuProjectId === projectId ? null : projectId);
  };

  const openProject = (projectId, tab) => {
    navigate(`${prefix}/projects/${projectId}${tab ? `?tab=${tab}` : ''}`);
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
                label: project.status || 'Initialized',
              };
              const progress = Number(project.progress || 0);

              return (
                <tr
                  key={project.id}
                  className="project-table__row"
                  tabIndex={0}
                  onClick={() => openProject(project.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openProject(project.id);
                    }
                  }}
                >
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
                    <span className="status-badge status-badge--pill project-table__status" style={{ backgroundColor: status.bg, color: status.text }}>
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
                        <span className="project-progress__label">{progress}%</span>
                        <span className="project-progress__meta">{project.taskCount || 0} tasks</span>
                      </div>
                      <div
                        className="project-progress__bar"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`project-progress__fill project-progress__fill--${project.status?.toLowerCase() || 'draft'}`}
                          style={{ width: `${progress}%` }}
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
                    <div className="project-table__actions">
                      <button
                        type="button"
                        className="project-table__action-btn project-table__action-btn--edit"
                        aria-label={`Edit ${project.name}`}
                        title="Edit Project"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(project);
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="project-table__action-btn project-table__action-btn--view"
                        aria-label={`View ${project.name}`}
                        title="Assign Images"
                        onClick={(e) => {
                          e.stopPropagation();
                          openProject(project.id, 'tasks');
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      <div className="project-table__menu-wrap">
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
                          <div className="project-table__menu">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openProject(project.id, 'labels');
                              }}
                            >
                              <Edit2 size={13} />
                              Taxonomy Labels
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openProject(project.id, 'tasks');
                              }}
                            >
                              <Eye size={13} />
                              Assign Images
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openProject(project.id, 'dataset');
                              }}
                            >
                              <FolderPlus size={13} />
                              Upload Images
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openProject(project.id, 'dataset');
                              }}
                            >
                              <Database size={13} />
                              Dataset
                            </button>
                            <button
                              type="button"
                              className="project-table__menu-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete?.(project);
                              }}
                            >
                              <Trash2 size={13} />
                              Delete Project
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
