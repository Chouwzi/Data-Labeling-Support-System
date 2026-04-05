import { Users } from 'lucide-react';
import './AssignGroupDropdown.css';

export default function AssignGroupDropdown({ userId, currentGroupId, groups, onAssignGroup, disabled }) {
  const currentGroup = groups.find((g) => g.id === currentGroupId);

  return (
    <div className="assign-group">
      <label className="assign-group__label">
        <Users size={12} />
        Group
      </label>
      <div className="assign-group__select-wrapper">
        <select
          className="assign-group__select"
          value={currentGroupId || ''}
          onChange={(e) => onAssignGroup(e.target.value ? Number(e.target.value) : null)}
          disabled={disabled}
        >
          <option value="">Unassigned</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <svg className="assign-group__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  );
}
