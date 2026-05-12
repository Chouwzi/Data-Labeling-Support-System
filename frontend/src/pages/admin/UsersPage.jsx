import { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, FolderPlus } from 'lucide-react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import UserCard from '@/components/UserCard';
import Filters from '@/components/Filters';
import CreateGroupModal from '@/components/CreateGroupModal';
import CreateUserForm from '@/components/CreateUserForm';
import Modal from '@/components/Modal';
import RoleModal from '@/components/RoleModal';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import { getUsers, createUser, updateUserRole, toggleUserStatus } from '@/services/api';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  // Role modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleTargetUser, setRoleTargetUser] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // Gọi API lấy danh sách users
  useEffect(() => {
    async function fetchUsers() {
      try {
        setUsersLoading(true);
        const res = await getUsers();
        setUsers(res.data.result || []);
      } catch (err) {
        setUsersError(err.response?.data?.message || 'Không thể tải danh sách users');
      } finally {
        setUsersLoading(false);
      }
    }
    fetchUsers();
  }, []);

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

  const handleUpdateUser = (userId, updates) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
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
      const res = await getUsers();
      setUsers(res.data.result || []);
    } catch (err) {
      console.error('Update role failed:', err);
    } finally {
      setRoleLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newActive = !user.active;
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, active: newActive } : u))
    );
    try {
      await toggleUserStatus(user, newActive);
      const res = await getUsers();
      setUsers(res.data.result || []);
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !newActive } : u))
      );
      console.error('Toggle status failed:', err);
    }
  };

  const handleCreateGroup = (groupName) => {
    const newGroup = {
      id: groups.length > 0 ? Math.max(...groups.map((g) => g.id)) + 1 : 1,
      name: groupName,
    };
    setGroups((prev) => [...prev, newGroup]);
  };

  // Chuẩn hóa dữ liệu user từ API (snake_case → camelCase)
  const normalizedUsers = users.map((u) => ({
    id: u.id,
    fullName: u.fullName || u.full_name,
    email: u.email,
    role: u.role,
    active: u.active,
    groupId: u.groupId || null,
  }));

  const filteredUsers = normalizedUsers.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesGroup = !groupFilter || String(u.groupId) === groupFilter;

    return matchesSearch && matchesRole && matchesGroup;
  });

  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      <div className="admin-main">
        <Topbar
          userName={user?.fullName || user?.email || 'Administrator'}
          userRole={user?.role ? user.role.replace('_', ' ') : 'USER'}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="admin-content">
          <div className="users-header">
            <button
              type="button"
              className="log-back-btn"
              onClick={() => navigate('/admin', { replace: true })}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Dashboard</span>
            </button>
            <h1 className="admin-page-title">User Management</h1>
            <p className="admin-page-subtitle">
              Manage system users, roles, and team assignments.
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
            />

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
            <div className="users-grid">
              {filteredUsers.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  groups={groups}
                  onUpdateUser={handleUpdateUser}
                  onEditRole={handleEditRole}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          ) : (
            <div className="users-empty">
              <p>No users found matching your filters.</p>
            </div>
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
          onSuccess={() => {
            setShowCreateUserModal(false);
          }}
        />
      </Modal>

      <RoleModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        user={roleTargetUser}
        onSave={handleSaveRole}
        loading={roleLoading}
      />
    </div>
  );
}
