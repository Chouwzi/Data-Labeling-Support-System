import { useState } from 'react';
import { Edit2, Eye, MoreHorizontal, Clock } from 'lucide-react';

export default function ProjectTable({ projects = [], statusColors = {}, totalProjects = 42 }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const paginated = projects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(projects.length / itemsPerPage);

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
                            {project.created}
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
                        <span className="project-progress__label">{project.progress}%</span>
                      </div>
                      <div
                        className="project-progress__bar"
                        role="progressbar"
                        aria-valuenow={project.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`project-progress__fill project-progress__fill--${project.status}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Images count */}
                  <td className="project-table__td--numeric">
                    <span className="project-table__metric">
                      {project.images.toLocaleString()}
                    </span>
                  </td>

                  {/* Labels count */}
                  <td className="project-table__td--numeric">
                    <span className="project-table__metric">
                      {project.labels.toLocaleString()}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="project-table__td--actions">
                    <div className="project-table__actions">
                      <button
                        type="button"
                        className="project-table__action-btn project-table__action-btn--edit"
                        aria-label={`Edit ${project.name}`}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="project-table__action-btn project-table__action-btn--view"
                        aria-label={`View ${project.name}`}
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        className="project-table__action-btn project-table__action-btn--more"
                        aria-label="More options"
                        title="More"
                      >
                        <MoreHorizontal size={14} />
                      </button>
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
