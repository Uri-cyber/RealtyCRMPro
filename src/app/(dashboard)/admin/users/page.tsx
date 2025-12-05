'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  X,
  Eye,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Badge,
  Avatar,
  Input,
  Select,
  Modal,
  ModalFooter,
} from '@/components/ui';
import { cn, formatRelativeTime } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
  profileImageUrl: string | null;
  licenseNumber: string | null;
  bio: string | null;
  timezone: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    leads: number;
    properties: number;
    showings: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
}

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'SELLER', label: 'Seller' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const createRoleOptions = [
  { value: 'AGENT', label: 'Agent' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'SELLER', label: 'Seller' },
  { value: 'ADMIN', label: 'Admin' },
];

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  AGENT: 'bg-green-100 text-green-700',
  SELLER: 'bg-neutral-100 text-neutral-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'AGENT',
    phone: '',
    licenseNumber: '',
  });
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: '',
    phone: '',
    licenseNumber: '',
    bio: '',
    isActive: true,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users
  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
        setStats(data.stats);
      } else if (res.status === 403) {
        setError('You do not have permission to access admin features');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  // Create user
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();

      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'AGENT',
          phone: '',
          licenseNumber: '',
        });
        fetchUsers(pagination.page);
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (err) {
      alert('Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  // Update user
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (res.ok) {
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers(pagination.page);
      } else {
        alert(data.error || 'Failed to update user');
      }
    } catch (err) {
      alert('Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (res.ok) {
        fetchUsers(pagination.page);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update user status');
      }
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!selectedUser) return;

    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers(pagination.page);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      alert('Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone || '',
      licenseNumber: user.licenseNumber || '',
      bio: user.bio || '',
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  // Open delete modal
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  if (error && error.includes('permission')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Access Denied</h2>
        <p className="text-neutral-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">User Management</h1>
          <p className="text-neutral-500">
            Manage all users in your organization
          </p>
        </div>
        <Button
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Total Users</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-neutral-300" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-300" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Inactive</p>
                  <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                </div>
                <UserX className="w-8 h-8 text-red-300" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Admins</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.byRole['ADMIN'] || 0}</p>
                </div>
                <Shield className="w-8 h-8 text-purple-300" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                options={roleOptions}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-36"
              />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-36"
              />
              <Button
                variant="outline"
                onClick={() => fetchUsers(pagination.page)}
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-neutral-500" />
            <h2 className="font-semibold text-neutral-900">Users</h2>
            <Badge variant="neutral" size="sm">
              {pagination.totalCount}
            </Badge>
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
              <p className="text-neutral-500">{error}</p>
              <Button
                variant="outline"
                onClick={() => fetchUsers(pagination.page)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-neutral-300 mb-4" />
              <p className="text-neutral-500">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    'flex items-center justify-between p-4 hover:bg-neutral-50',
                    !user.isActive && 'bg-neutral-50 opacity-60'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Avatar name={`${user.firstName} ${user.lastName}`} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-900">
                          {user.firstName} {user.lastName}
                        </p>
                        {!user.isActive && (
                          <Badge variant="danger" size="sm">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4 text-sm text-neutral-500">
                      <span title="Leads">{user._count.leads} leads</span>
                      <span title="Properties">{user._count.properties} properties</span>
                    </div>
                    <div
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        roleColors[user.role] || roleColors.AGENT
                      )}
                    >
                      {user.role}
                    </div>
                    {user.lastLoginAt && (
                      <span className="text-xs text-neutral-400 hidden lg:block">
                        {formatRelativeTime(new Date(user.lastLoginAt))}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openViewModal(user)}
                        className="p-2 rounded hover:bg-neutral-100"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-neutral-400" />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 rounded hover:bg-neutral-100"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4 text-neutral-400" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className="p-2 rounded hover:bg-neutral-100"
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? (
                          <UserX className="w-4 h-4 text-neutral-400 hover:text-red-500" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-neutral-400 hover:text-green-500" />
                        )}
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="p-2 rounded hover:bg-red-50"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-neutral-200">
            <p className="text-sm text-neutral-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-neutral-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New User"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={createForm.firstName}
              onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={createForm.lastName}
              onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email Address"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            helperText="Minimum 8 characters with uppercase, lowercase, and number"
            required
          />
          <Select
            label="Role"
            options={createRoleOptions}
            value={createForm.role}
            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone (optional)"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            />
            <Input
              label="License # (optional)"
              value={createForm.licenseNumber}
              onChange={(e) => setCreateForm({ ...createForm, licenseNumber: e.target.value })}
            />
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create User'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <Avatar name={`${selectedUser.firstName} ${selectedUser.lastName}`} size="sm" />
              <div>
                <p className="font-medium text-neutral-900">{selectedUser.email}</p>
                <p className="text-sm text-neutral-500">
                  Joined {formatRelativeTime(new Date(selectedUser.createdAt))}
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              required
            />
          </div>
          <Select
            label="Role"
            options={createRoleOptions}
            value={editForm.role}
            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
            <Input
              label="License #"
              value={editForm.licenseNumber}
              onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={editForm.isActive}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="rounded border-neutral-300"
            />
            <label htmlFor="isActive" className="text-sm text-neutral-700">
              User is active
            </label>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View User Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="User Details"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={`${selectedUser.firstName} ${selectedUser.lastName}`} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p className="text-neutral-500">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      roleColors[selectedUser.role]
                    )}
                  >
                    {selectedUser.role}
                  </div>
                  <Badge variant={selectedUser.isActive ? 'success' : 'danger'} size="sm">
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg">
              <div>
                <p className="text-xs text-neutral-500">Phone</p>
                <p className="text-sm font-medium text-neutral-900">
                  {selectedUser.phone || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">License #</p>
                <p className="text-sm font-medium text-neutral-900">
                  {selectedUser.licenseNumber || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Timezone</p>
                <p className="text-sm font-medium text-neutral-900">
                  {selectedUser.timezone}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Last Login</p>
                <p className="text-sm font-medium text-neutral-900">
                  {selectedUser.lastLoginAt
                    ? formatRelativeTime(new Date(selectedUser.lastLoginAt))
                    : 'Never'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-900">
                  {selectedUser._count.leads}
                </p>
                <p className="text-xs text-neutral-500">Leads</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-900">
                  {selectedUser._count.properties}
                </p>
                <p className="text-xs text-neutral-500">Properties</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-900">
                  {selectedUser._count.showings}
                </p>
                <p className="text-xs text-neutral-500">Showings</p>
              </div>
            </div>

            {selectedUser.bio && (
              <div>
                <p className="text-xs text-neutral-500 mb-1">Bio</p>
                <p className="text-sm text-neutral-700">{selectedUser.bio}</p>
              </div>
            )}

            <div className="text-xs text-neutral-400">
              <p>Created: {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              <p>Updated: {new Date(selectedUser.updatedAt).toLocaleDateString()}</p>
            </div>

            <ModalFooter>
              <Button variant="outline" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowViewModal(false);
                openEditModal(selectedUser);
              }}>
                Edit User
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="text-sm text-red-700">
              This will deactivate the user and unassign their leads. This action cannot be easily undone.
            </p>
          </div>
          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <Avatar name={`${selectedUser.firstName} ${selectedUser.lastName}`} size="sm" />
              <div>
                <p className="font-medium text-neutral-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-sm text-neutral-500">{selectedUser.email}</p>
              </div>
            </div>
          )}
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete User'}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
