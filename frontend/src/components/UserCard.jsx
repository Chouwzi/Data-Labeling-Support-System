import { Mail, Edit2, UserX, Users, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import AssignGroupDropdown from './AssignGroupDropdown';
import './UserCard.css';

const ROLE_COLORS = {
  MANAGER: { bg: '#ecfdf5', color: '#059669' },
  ANNOTATOR: { bg: '#eff6ff', color: '#1d4ed8' },
  REVIEWER: { bg: '#fdf4ff', color: '#7c3aed' },
};

const STATUS_COLORS = {
  active: { bg: '#ecfdf5', color: '#059669', dot: '#10b981' },
  disabled: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function UserCard({ user, groups, onUpdateUser, onEditRole }) {
  const [showActions, setShowActions] = useState(false);
  const roleStyle = ROLE_COLORS[user.role] || ROLE_COLORS.ANNOTATOR;
  const statusStyle = STATUS_COLORS[user.status] || STATUS_COLORS.active;
  const group = groups.find((g) => g.id === user.groupId);

  const handleToggleStatus = () => {
    onUpdateUser(user.id, {
      status: user.status === 'active' ? 'disabled' : 'active',
    });
    setShowActions(false);
  };

  return (
    <div className={`user-card ${user.status === 'disabled' ? 'user-card--disabled' : ''}`}>
      <div className="user-card__header">
        <div className="user-card__avatar" style={{ backgroundColor: roleStyle.bg }}>
          <span style={{ color: roleStyle.color }}>{getInitials(user.fullName)}</span>
        </div>
        <div className="user-card__info">
          <h3 className="user-card__name">{user.fullName}</h3>
          <p className="user-card__email">
            <Mail size={12} />
            {user.email}
          </p>
        </div>
        <div className="user-card__actions-wrapper">
          <button
            type="button"
            className="user-card__actions-toggle"
            onClick={() => setShowActions(!showActions)}
            aria-label="Toggle actions"
          >
            <MoreVertical size={16} />
          </button>
          {showActions && (
            <div className="user-card__actions-menu">
              <button
                type="button"
                className="user-card__action"
                onClick={() => {
                  onEditRole(user);
                  setShowActions(false);
                }}
              >
                <Edit2 size={14} />
                <span>Edit Role</span>
              </button>
              <button
                type="button"
                className={`user-card__action ${user.status === 'active' ? 'user-card__action--danger' : 'user-card__action--success'}`}
                onClick={handleToggleStatus}
              >
                <UserX size={14} />
                <span>{user.status === 'active' ? 'Disable' : 'Enable'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="user-card__badges">
        <span
          className="user-card__badge user-card__badge--role"
          style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
        >
          {user.role}
        </span>
        <span
          className="user-card__badge user-card__badge--status"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
        >
          <span className="user-card__status-dot" style={{ backgroundColor: statusStyle.dot }} />
          {user.status === 'active' ? 'Active' : 'Disabled'}
        </span>
        {group && (
          <span className="user-card__badge user-card__badge--group">
            <Users size={10} />
            {group.name}
          </span>
        )}
      </div>

      <div className="user-card__footer">
        <AssignGroupDropdown
          userId={user.id}
          currentGroupId={user.groupId}
          groups={groups}
          onAssignGroup={(groupId) => onUpdateUser(user.id, { groupId })}
          disabled={user.status === 'disabled'}
        />
      </div>
    </div>
  );
}
