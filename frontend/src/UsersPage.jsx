import { useState } from 'react';
import { ArrowLeft, UserPlus, FolderPlus } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import UserCard from './components/UserCard';
import Filters from './components/Filters';
import CreateGroupModal from './components/CreateGroupModal';
import CreateUserForm from './components/CreateUserForm';
import Modal from './components/Modal';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import './UsersPage.css';

// Mock users - UI only, no API
const INITIAL_USERS = [
  {
    id: 1,
    fullName: 'Nguyen Van A',
    email: 'nguyenvana@example.com',
    role: 'MANAGER',
    status: 'active',
    groupId: 1,
  },
  {
    id: 2,
    fullName: 'Tran Thi B',
    email: 'tranthib@example.com',
    role: 'ANNOTATOR',
    status: 'active',
    groupId: 2,
  },
  {
    id: 3,
    fullName: 'Le Van C',
    email: 'levanc@example.com',
    role: 'REVIEWER',
    status: 'active',
    groupId: 1,
  },
  {
    id: 4,
    fullName: 'Pham Thi D',
    email: 'phamthid@example.com',
    role: 'ANNOTATOR',
    status: 'disabled',
    groupId: null,
  },
  {
    id: 5,
    fullName: 'Hoang Van E',
    email: 'hoangvane@example.com',
    role: 'MANAGER',
    status: 'active',
    groupId: 2,
  },
  {
    id: 6,
    fullName: 'Duong Thi F',
    email: 'duongthif@example.com',
    role: 'REVIEWER',
    status: 'active',
    groupId: null,
  },
];

export default function UsersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State
  const [users, setUsers] = useState(INITIAL_USERS);
  const [groups, setGroups] = useState([
    { id: 1, name: 'Team Alpha' },
    { id: 2, name: 'Team Beta' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleUpdateUser = (userId, updates) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
  };

  const handleCreateGroup = (groupName) => {
    const newGroup = {
      id: groups.length > 0 ? Math.max(...groups.map((g) => g.id)) + 1 : 1,
      name: groupName,
    };
    setGroups((prev) => [...prev, newGroup]);
  };

  const handleCreateUser = (userData) => {
    console.log('User data ready for API:', userData);
    // UI only - in real app, this would call an API
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesGroup = !groupFilter || user.groupId === Number(groupFilter);

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

          {/* User List */}
          {filteredUsers.length > 0 ? (
            <div className="users-grid">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  groups={groups}
                  onUpdateUser={handleUpdateUser}
                  onEditRole={() => console.log('Edit role for:', user.fullName)}
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
        />
      </Modal>
    </div>
  );
}
