import { Search, Filter } from 'lucide-react';
import './Filters.css';

export default function Filters({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  groupFilter,
  onGroupFilterChange,
  groups,
  roleOptions,
}) {
  const roles = roleOptions || [
    { value: 'MANAGER', label: 'Manager' },
    { value: 'ANNOTATOR', label: 'Annotator' },
    { value: 'REVIEWER', label: 'Reviewer' },
  ];

  return (
    <div className="filters">
      <div className="filters__search">
        <Search size={18} className="filters__search-icon" />
        <input
          type="text"
          className="filters__search-input"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filters__dropdowns">
        <div className="filters__select-wrapper">
          <select
            className="filters__select"
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          <svg className="filters__select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        <div className="filters__select-wrapper">
          <Filter size={14} className="filters__group-icon" />
          <select
            className="filters__select filters__select--group"
            value={groupFilter}
            onChange={(e) => onGroupFilterChange(e.target.value)}
          >
            <option value="">All Groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <svg className="filters__select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
