import { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, FolderPlus } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import UserCard from './components/UserCard';
import Filters from './components/Filters';
import CreateGroupModal from './components/CreateGroupModal';
import CreateUserForm from './components/CreateUserForm';
import Modal from './components/Modal';
import { useAuth } from './contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import { getUsers, createUser as createUserApi, updateUser as updateUserApi } from './utils/api';
import './AdminDashboard.css';
import './UsersPage.css';

export default function UsersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([
    { id: 1, name: 'Team Alpha' },
    { id: 2, name: 'Team Beta' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from API on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getUsers();
        // Map backend response to frontend format
        const mappedUsers = data.map(u => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          status: u.active ? 'active' : 'disabled',
          groupId: null,
        }));
        setUsers(mappedUsers);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Không thể tải danh sách người dùng');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await updateUserApi(userId, updates);
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
      );
    } catch (err) {
      console.error('Failed to update user:', err);
      setError('Không thể cập nhật người dùng');
    }
  };

  const handleCreateGroup = (groupName) => {
    const newGroup = {
      id: groups.length > 0 ? Math.max(...groups.map((g) => g.id)) + 1 : 1,
      name: groupName,
    };
    setGroups((prev) => [...prev, newGroup]);
  };

  const handleCreateUser = async (userData) => {
    try {
      const newUser = await createUserApi(userData);
      const mappedUser = {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.active ? 'active' : 'disabled',
        groupId: null,
      };
      setUsers((prev) => [...prev, mappedUser]);
    } catch (err) {
      console.error('Failed to create user:', err);
      throw err;
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesGroup = !groupFilter || u.groupId === Number(groupFilter);

    return matchesSearch && matchesRole && matchesGroup;
  });

  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      <div className="admin-main">
        <Topbar
          userName={user?.email || 'Administrator'}
          userRole="SENIOR ADMINISTRATOR"
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="admin-content">
          <div className="users-header">
            <button
              type="button"
              className="log-back-btn"
              onClick={() => navigate('/admin/dashboard', { replace: true })}
              aria-label="Quay lại Dashboard"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Dashboard</span>
            </button>
            <h1 className="admin-page-title">User Management</h1>
            <p className="admin-page-subtitle">
              Manage system users, roles, and team assignments.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message visible" role="alert">
              <span>{error}</span>
            </div>
          )}

          {/* Toolbar */}
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

          {/* Loading State */}
          {loading ? (
            <div className="users-loading">
              <p>Đang tải danh sách người dùng...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="users-grid">
              {filteredUsers.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  groups={groups}
                  onUpdateUser={handleUpdateUser}
                  onEditRole={() => console.log('Edit role for:', u.fullName)}
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

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSave={handleCreateGroup}
      />

      <Modal
        isOpen={showCreateUserModal}
        onClose={() => {
          setShowCreateUserModal(false);
        }}
        title="Create New Account"
      >
        <CreateUserForm
          onSuccess={() => {
            setShowCreateUserModal(false);
          }}
          onSubmit={handleCreateUser}
        />
      </Modal>
    </div>
  );
}
