import { useState } from 'react';
import { Filter, MoreHorizontal, Edit2, Eye } from 'lucide-react';

const PROJECTS = [
  {
    id: 1,
    name: 'Satellite Analysis Alpha',
    category: 'Geospatial',
    status: 'in_progress',
    progress: 68,
    created: '2 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=80&h=80&fit=crop',
  },
  {
    id: 2,
    name: 'Autonomous Driving Beta',
    category: 'CV / Automotive',
    status: 'in_progress',
    progress: 92,
    created: '5 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=80&h=80&fit=crop',
  },
  {
    id: 3,
    name: 'Medical Imaging V2',
    category: 'Healthcare',
    status: 'initialized',
    progress: 45,
    created: '1 week ago',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=80&h=80&fit=crop',
  },
];

const STATUS_CLASS = {
  initialized: 'status-badge--initialized',
  in_progress: 'status-badge--in-progress',
  completed: 'status-badge--completed',
};

const STATUS_LABEL = {
  initialized: 'Initialized',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function ProjectTable({ totalProjects = 42, embedded = false }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  return (
    <div
      className={`project-table-card ${embedded ? 'project-table-card--embedded' : ''}`}
    >
      {/* Header */}
      <div className="project-table-card__header">
        <div>
          <h3 className="project-table-card__title">Current Projects</h3>
          <p className="project-table-card__subtitle">
            Tracking {totalProjects} active labeling campaigns
          </p>
        </div>
        <div className="project-table-card__actions">
          <button
            type="button"
            className="project-table-card__action-btn"
            aria-label="Filter projects"
          >
            <Filter size={16} />
          </button>
          <button
            type="button"
            className="project-table-card__action-btn"
            aria-label="More options"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <table className="project-table" role="table">
        <thead>
          <tr>
            <th scope="col">Project Name</th>
            <th scope="col">Status</th>
            <th scope="col">Progress</th>
            <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {PROJECTS.map((project) => (
            <tr key={project.id}>
              {/* Project Name */}
              <td>
                <div className="project-table__name">
                  <img
                    src={project.imageUrl}
                    alt=""
                    className="project-table__thumb"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="project-table__name-text">{project.name}</p>
                    <p className="project-table__name-meta">
                      Created {project.created} &bull; {project.category}
                    </p>
                  </div>
                </div>
              </td>

              {/* Status */}
              <td>
                <span className={`status-badge ${STATUS_CLASS[project.status]}`}>
                  <span className="status-badge__dot" aria-hidden="true" />
                  {STATUS_LABEL[project.status]}
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

              {/* Actions */}
              <td>
                <div className="project-table__actions">
                  <button
                    type="button"
                    className="project-table__action-btn"
                    aria-label={`Edit ${project.name}`}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="project-table__action-btn"
                    aria-label={`View ${project.name}`}
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="project-table-card__footer">
        <p className="project-table-card__footer-text">
          Showing {itemsPerPage} of {totalProjects} projects
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
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage >= Math.ceil(totalProjects / itemsPerPage)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
