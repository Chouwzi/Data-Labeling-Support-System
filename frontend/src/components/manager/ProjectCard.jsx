import { useNavigate } from 'react-router-dom';
import { Edit2, Eye, Clock, Image as ImageIcon, Tag, Users } from 'lucide-react';

export default function ProjectCard({ project, statusColors }) {
  const status = statusColors[project.status] || statusColors.initialized;
  const isNew = Boolean(project.isNew);
  const navigate = useNavigate();

  const userRole = localStorage.getItem('role') || 'MANAGER';
  const prefix = userRole === 'ADMIN' ? '/admin' : '/manager';

  return (
    <article className="project-card" role="listitem">
      {/* Thumbnail */}
      <div className="project-card__thumb">
        <img
          src={project.imageUrl}
          alt={project.name}
          className="project-card__img"
          loading="lazy"
         />
        <div
          className="project-card__status-badge"
          style={{ backgroundColor: status.bg, color: status.text }}
        >
          {status.label}
        </div>
        {isNew && (
          <span className="project-new-badge" style={{ position: 'absolute', top: '0.5rem', left: '0.5rem' }}>
            NEW
          </span>
        )}
      </div>

      {/* Body */}
      <div className="project-card__body">
        <div className="project-card__header">
          <div>
            <h3 className="project-card__name">{project.name}</h3>
            <p className="project-card__category">{project.category}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="project-card__progress-section">
          <div className="project-card__progress-header">
            <span className="project-card__progress-label">Progress</span>
            <span className="project-card__progress-pct">{project.progress}%</span>
          </div>
          <div className="project-card__progress-bar" role="progressbar" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={`project-card__progress-fill project-card__progress-fill--${project.status}`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Meta row */}
        <div className="project-card__meta-row">
          <div className="project-card__meta-item">
            <ImageIcon size={13} />
            <span>{project.images.toLocaleString()} images</span>
          </div>
          <div className="project-card__meta-item">
            <Tag size={13} />
            <span>{project.labels.toLocaleString()} labels</span>
          </div>
        </div>

        {/* Footer */}
        <div className="project-card__footer">
          {/* Member avatars */}
          <div className="project-card__members">
            <div className="project-card__members-list">
              {project.members.slice(0, 3).map((member, i) => (
                <div
                  key={i}
                  className="project-card__avatar"
                  style={{
                    backgroundColor: member.color + '22',
                    borderColor: member.color + '55',
                    color: member.color,
                    zIndex: 3 - i,
                  }}
                  title={member.name}
                >
                  {member.name.charAt(0)}
                </div>
              ))}
              {project.annotators > 3 && (
                <div
                  className="project-card__avatar project-card__avatar--overflow"
                  title={`+${project.annotators - 3} more`}
                >
                  +{project.annotators - 3}
                </div>
              )}
            </div>
            <span className="project-card__member-count">
              <Users size={12} />
              {project.annotators}
            </span>
          </div>

          {/* Actions */}
          <div className="project-card__actions">
            <button
              type="button"
              className="project-card__action-btn"
              aria-label={`Edit ${project.name}`}
              title="Edit Taxonomy"
              onClick={() => navigate(`${prefix}/taxonomy/${project.id}`)}
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              className="project-card__action-btn project-card__action-btn--primary"
              aria-label={`View ${project.name}`}
              title="Assign Images"
              onClick={() => navigate(`${prefix}/annotators`)}
            >
              <Eye size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
