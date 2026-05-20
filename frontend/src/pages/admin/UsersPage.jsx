import { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, FolderPlus, Edit2, Lock, Unlock, UsersRound } from 'lucide-react';
import Sidebar from '@/components/common/Sidebar';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import Filters from '@/components/Filters';
import CreateGroupModal from '@/components/CreateGroupModal';
import CreateUserForm from '@/components/CreateUserForm';
import Modal from '@/components/Modal';
import RoleModal from '@/components/RoleModal';
import Toast from '@/components/Toast';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  getUsers,
  createUser,
  updateUser,
  updateUserRole,
  toggleUserStatus,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  deleteUser,
  getAdminUserPerformance,
} from '@/services/api';
import '@/styles/AdminDashboard.css';
import '@/styles/UsersPage.css';

export default function UsersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState('users');
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Role modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleTargetUser, setRoleTargetUser] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const isManager = user?.role === 'MANAGER';

  // Gọi API lấy danh sách users
  useEffect(() => {
    async function fetchUsers() {
      try {
        setUsersLoading(true);
        const [res, groupsRes, performanceRes] = await Promise.all([
          getUsers(),
          getGroups().catch(() => ({ data: { result: [] } })),
          getAdminUserPerformance().catch(() => ({ data: { result: [] } })),
        ]);
        setUsers(res.data.result || []);
        setGroups(groupsRes.data.result || []);
        setPerformance(performanceRes.data.result || []);
      } catch (err) {
        setUsersError(err.response?.data?.message || 'Không thể tải danh sách users');
      } finally {
        setUsersLoading(false);
      }
    }
    fetchUsers();
  }, [isManager]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleCreateUser = async (formData) => {
    try {
      await createUser(formData);
      const res = await getUsers();
      setUsers(res.data.result || []);
      setShowCreateUserModal(false);
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Tạo user thất bại');
    }
  };

  const handleEditRole = (user) => {
    setRoleTargetUser(user);
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (user, newRole) => {
    setRoleLoading(true);
    try {
      await updateUserRole(user, newRole);
      setRoleModalOpen(false);
      setToast({ type: 'success', message: `Đã cập nhật vai trò của ${user.fullName || user.email} thành ${newRole}!` });
      const res = await getUsers();
      setUsers(res.data.result || []);
    } catch (err) {
      console.error('Update role failed:', err);
      setToast({ type: 'error', message: 'Cập nhật vai trò thất bại!' });
    } finally {
      setRoleLoading(false);
    }
  };

  const handleEditName = async (targetUser) => {
    const nextName = window.prompt('Tên người dùng', targetUser.fullName || '');
    if (!nextName || nextName.trim() === targetUser.fullName) return;
    try {
      await updateUser(targetUser.id, {
        email: targetUser.email,
        full_name: nextName.trim(),
        role: targetUser.role,
        active: targetUser.active,
        group_id: targetUser.groupId,
      });
      setToast({ type: 'success', message: 'Đã cập nhật tên người dùng.' });
      const res = await getUsers();
      setUsers(res.data.result || []);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Cập nhật tên thất bại.' });
    }
  };

  const handleAssignGroup = async (targetUser, groupId) => {
    try {
      await updateUser(targetUser.id, {
        email: targetUser.email,
        full_name: targetUser.fullName,
        role: targetUser.role,
        active: targetUser.active,
        group_id: groupId || null,
      });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, group_id: groupId || null, groupId: groupId || null } : u)));
      setToast({ type: 'success', message: 'Đã cập nhật group.' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Cập nhật group thất bại.' });
    }
  };

  const handleToggleStatus = async (user) => {
    const newActive = !user.active;
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, active: newActive } : u))
    );
    try {
      await toggleUserStatus(user, newActive);
      setToast({ 
        type: 'success', 
        message: `${newActive ? 'Đã kích hoạt' : 'Đã khóa'} tài khoản của ${user.fullName || user.email}!` 
      });
      const res = await getUsers();
      setUsers(res.data.result || []);
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !newActive } : u))
      );
      setToast({ type: 'error', message: 'Cập nhật trạng thái thất bại!' });
      console.error('Toggle status failed:', err);
    }
  };

  const handleCreateGroup = async (groupPayload) => {
    try {
      const res = await createGroup(typeof groupPayload === 'string' ? { name: groupPayload } : groupPayload);
      setGroups((prev) => [...prev, res.data.result]);
      setToast({ type: 'success', message: 'Đã tạo group.' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Tạo group thất bại.' });
      throw err;
    }
  };

  const refreshUsersAndGroups = async () => {
    const [usersRes, groupsRes] = await Promise.all([
      getUsers(),
      getGroups().catch(() => ({ data: { result: [] } })),
    ]);
    setUsers(usersRes.data.result || []);
    setGroups(groupsRes.data.result || []);
  };

  const handleEditGroup = async (group) => {
    const nextName = window.prompt('Group name', group.name || '');
    if (!nextName) return;
    const nextDescription = window.prompt('Group description', group.description || '') ?? group.description;
    try {
      await updateGroup(group.id, {
        name: nextName.trim(),
        description: nextDescription,
        manager_id: group.manager_id || group.managerId || null,
      });
      await refreshUsersAndGroups();
      setToast({ type: 'success', message: 'Đã cập nhật group.' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Cập nhật group thất bại.' });
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Xóa group "${group.name}"? Thành viên sẽ cần được gán lại group khác.`)) return;
    try {
      await deleteGroup(group.id);
      if (selectedGroupId === group.id) setSelectedGroupId(null);
      await refreshUsersAndGroups();
      setToast({ type: 'success', message: 'Đã xóa group.' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Xóa group thất bại.' });
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Xóa user "${targetUser.email}"?`)) return;
    try {
      await deleteUser(targetUser.id);
      await refreshUsersAndGroups();
      setToast({ type: 'success', message: 'Đã xóa user.' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Xóa user thất bại.' });
    }
  };

  // Chuẩn hóa dữ liệu user từ API (snake_case → camelCase)
  const normalizedUsers = users.map((u) => ({
    id: u.id,
    fullName: u.fullName || u.full_name,
    email: u.email,
    role: u.role,
    active: u.active,
    groupId: u.groupId || u.group_id || null,
  }));

  const performanceByUserId = performance.reduce((acc, item) => {
    acc[item.userId || item.user_id] = item;
    return acc;
  }, {});

  const filteredUsers = normalizedUsers.filter((u) => {
    const isActive = u.active === true || u.active === 'active';
    const matchesSearch =
      !searchQuery ||
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesStatus = !statusFilter || (statusFilter === 'active' ? isActive : !isActive);
    const matchesGroup = !groupFilter || String(u.groupId) === groupFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesGroup;
  });

  const userSummary = normalizedUsers.reduce(
    (acc, current) => {
      acc.total += 1;
      if (current.active === true || current.active === 'active') acc.active += 1;
      else acc.disabled += 1;
      acc.roles[current.role] = (acc.roles[current.role] || 0) + 1;
      return acc;
    },
    { total: 0, active: 0, disabled: 0, roles: {} }
  );

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const selectedGroupMembers = selectedGroupId
    ? normalizedUsers.filter((item) => item.groupId === selectedGroupId)
    : [];

  return (
    <div className={isManager ? 'manager-layout' : 'admin-layout'}>
      {isManager ? (
        <ManagerSidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      ) : (
        <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      )}

      <div className={isManager ? 'manager-main' : 'admin-main'}>
        <Topbar
          userName={user?.fullName || user?.email || 'Administrator'}
          userRole={user?.role ? user.role.replace('_', ' ') : 'USER'}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className={isManager ? 'manager-content' : 'admin-content'}>
          <div className="users-header">
            <button
              type="button"
              className="log-back-btn"
              onClick={() => navigate(isManager ? '/manager' : '/admin', { replace: true })}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Dashboard</span>
            </button>
            <h1 className="admin-page-title">{isManager ? 'Group Members' : 'User Management'}</h1>
            <p className="admin-page-subtitle">
              {isManager ? 'Manage annotator and reviewer roles inside your group.' : 'Manage system users, roles, and team assignments.'}
            </p>
          </div>

          <div className="users-toolbar">
            <Filters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              groupFilter={groupFilter}
              onGroupFilterChange={setGroupFilter}
              groups={groups}
              roleOptions={isManager ? [
                { value: 'ANNOTATOR', label: 'Annotator' },
                { value: 'REVIEWER', label: 'Reviewer' },
              ] : undefined}
            />

            <label className="users-status-filter">
              <span>Status</span>
              <select
                aria-label="Status filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>

            {!isManager && (
              <div className="users-toolbar__actions">
                <button
                  type="button"
                  className="users-btn users-btn--secondary"
                  onClick={() => setShowCreateGroupModal(true)}
                >
                  <FolderPlus size={16} />
                  <span>Create Group</span>
                </button>
                <button
                  type="button"
                  className="users-btn users-btn--primary"
                  onClick={() => setShowCreateUserModal(true)}
                >
                  <UserPlus size={16} />
                  <span>Create Account</span>
                </button>
              </div>
            )}
          </div>

          {!isManager && (
            <div className="users-summary" role="tablist" aria-label="Admin people views">
              <button type="button" role="tab" className={activeAdminTab === 'users' ? 'users-summary__chip users-summary__chip--active' : 'users-summary__chip'} onClick={() => setActiveAdminTab('users')}>
                Users <strong>{userSummary.total}</strong>
              </button>
              <button type="button" role="tab" className={activeAdminTab === 'groups' ? 'users-summary__chip users-summary__chip--active' : 'users-summary__chip'} onClick={() => setActiveAdminTab('groups')}>
                Groups <strong>{groups.length}</strong>
              </button>
            </div>
          )}

          {(!isManager && activeAdminTab === 'groups') ? (
            <>
              <div className="admin-groups-grid">
                {groups.map((group) => (
                  <article
                    key={group.id}
                    className={selectedGroupId === group.id ? 'admin-group-card admin-group-card--active' : 'admin-group-card'}
                  >
                    <button type="button" className="admin-group-card__main" onClick={() => setSelectedGroupId(group.id)}>
                      <span className="admin-group-card__icon"><UsersRound size={18} /></span>
                      <strong>{group.name}</strong>
                      <small>{group.description || 'No description yet'}</small>
                      <span>{group.member_count || group.memberCount || 0} members</span>
                    </button>
                    <div className="admin-group-card__actions">
                      <button type="button" onClick={() => handleEditGroup(group)}>Edit</button>
                      <button type="button" onClick={() => handleDeleteGroup(group)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="users-table-shell">
                <table className="users-table" aria-label="Group members">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th className="users-table__actions-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedGroup ? selectedGroupMembers : normalizedUsers.filter((item) => item.groupId)).map((member) => (
                      <tr key={member.id}>
                        <td>{member.fullName || 'Unnamed user'}</td>
                        <td className="users-table__email">{member.email}</td>
                        <td><span className={`users-role users-role--${member.role?.toLowerCase()}`}>{member.role}</span></td>
                        <td>{member.active ? 'Active' : 'Disabled'}</td>
                        <td>
                          <div className="users-row-actions">
                            <button type="button" onClick={() => handleEditName(member)}><Edit2 size={14} /> Name</button>
                            <button type="button" onClick={() => handleEditRole(member)}><Edit2 size={14} /> Role</button>
                            <button type="button" onClick={() => handleAssignGroup(member, null)}>Remove</button>
                            <button type="button" className="users-row-actions__danger" onClick={() => handleDeleteUser(member)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
          <>
          <div className="users-summary" aria-label="User summary">
            <button type="button" className={!roleFilter && !statusFilter ? 'users-summary__chip users-summary__chip--active' : 'users-summary__chip'} onClick={() => { setRoleFilter(''); setStatusFilter(''); }}>
              All <strong>{userSummary.total}</strong>
            </button>
            <button type="button" className={statusFilter === 'active' ? 'users-summary__chip users-summary__chip--active' : 'users-summary__chip'} onClick={() => setStatusFilter('active')}>
              Active <strong>{userSummary.active}</strong>
            </button>
            <button type="button" className={statusFilter === 'disabled' ? 'users-summary__chip users-summary__chip--active' : 'users-summary__chip'} onClick={() => setStatusFilter('disabled')}>
              Disabled <strong>{userSummary.disabled}</strong>
            </button>
            {(isManager ? ['REVIEWER', 'ANNOTATOR'] : ['ADMIN', 'MANAGER', 'REVIEWER', 'ANNOTATOR']).map((role) => (
              <button
                type="button"
                key={role}
                className={roleFilter === role ? 'users-summary__chip users-summary__chip--active' : 'users-summary__chip'}
                onClick={() => setRoleFilter(role)}
              >
                {role.toLowerCase()} <strong>{userSummary.roles[role] || 0}</strong>
              </button>
            ))}
          </div>

          {usersLoading ? (
            <div className="users-empty">
              <p>Đang tải danh sách users...</p>
            </div>
          ) : usersError ? (
            <div className="users-empty">
              <p style={{ color: 'red' }}>{usersError}</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="users-table-shell">
              <table className="users-table" aria-label="Users">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    {!isManager && <th>Group</th>}
                    <th>Work</th>
                    <th className="users-table__actions-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isActive = u.active === true || u.active === 'active';
                    const perf = performanceByUserId[u.id] || {};
                    const isCurrentManager = isManager && String(u.id) === String(user?.userId);
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="users-table__identity">
                            <span>{(u.fullName || u.email || 'U').slice(0, 1).toUpperCase()}</span>
                            <div>
                              <strong>{u.fullName || 'Unnamed user'}</strong>
                              <small>{u.id?.toString().slice(0, 8) || 'No id'}</small>
                            </div>
                          </div>
                        </td>
                        <td className="users-table__email">{u.email}</td>
                        <td><span className={`users-role users-role--${u.role?.toLowerCase()}`}>{u.role}</span></td>
                        <td>
                          <span className={`users-status ${isActive ? 'users-status--active' : 'users-status--disabled'}`}>
                            <i aria-hidden="true" />
                            {isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        {!isManager && (
                          <td className="users-table__muted">
                            <select
                              aria-label={`Group for ${u.email}`}
                              value={u.groupId || ''}
                              onChange={(event) => handleAssignGroup(u, event.target.value || null)}
                            >
                              <option value="">No group</option>
                              {groups.map((g) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                              ))}
                            </select>
                          </td>
                        )}
                        <td className="users-table__muted">
                          {u.role === 'REVIEWER'
                            ? `${perf.reviewed || 0} reviewed / ${perf.pendingToReview || perf.pending_to_review || 0} pending`
                            : `${perf.completed || 0} done / ${perf.rejected || 0} rework`}
                        </td>
                        <td>
                          <div className="users-row-actions">
                            {!isManager && (
                              <button type="button" onClick={() => handleEditName(u)}>
                                <Edit2 size={14} />
                                Name
                              </button>
                            )}
                            {isCurrentManager ? (
                              <button type="button" disabled title="Managers cannot edit their own role">
                                <Edit2 size={14} />
                                Own role
                              </button>
                            ) : (
                              <button type="button" onClick={() => handleEditRole(u)}>
                                <Edit2 size={14} />
                                Role
                              </button>
                            )}
                            {!isManager && (
                              <button
                                type="button"
                                className={isActive ? 'users-row-actions__danger' : 'users-row-actions__success'}
                                onClick={() => handleToggleStatus(u)}
                              >
                                {isActive ? <Lock size={14} /> : <Unlock size={14} />}
                                {isActive ? 'Lock' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="users-empty">
              <p>No users found matching your filters.</p>
            </div>
          )}
          </>
          )}
        </main>
      </div>

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSave={handleCreateGroup}
      />

      <Modal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        title="Create New Account"
      >
        <CreateUserForm
          onSubmit={handleCreateUser}
          onSuccess={async () => {
            setShowCreateUserModal(false);
            setToast({ type: 'success', message: 'Tạo tài khoản thành công!' });
            const res = await getUsers();
            setUsers(res.data.result || []);
          }}
        />
      </Modal>

      <RoleModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        user={roleTargetUser}
        onSave={handleSaveRole}
        loading={roleLoading}
        allowedRoles={isManager ? ['ANNOTATOR', 'REVIEWER'] : undefined}
      />

      {toast && (
        <Toast
          type={toast.type || 'success'}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
