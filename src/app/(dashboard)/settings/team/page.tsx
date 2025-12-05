'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  MoreVertical,
  Trash2,
  Clock,
  Check,
  X,
  AlertCircle,
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
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
  profileImageUrl: string | null;
  licenseNumber: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  inviter: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface TenantInfo {
  id: string;
  name: string;
  subscriptionTier: string;
  maxUsers: number;
  currentUsers: number;
}

const roleOptions = [
  { value: 'AGENT', label: 'Agent' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'SELLER', label: 'Seller' },
];

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  AGENT: 'bg-green-100 text-green-700',
  SELLER: 'bg-neutral-100 text-neutral-700',
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('AGENT');
  const [editRole, setEditRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch team data
  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamRes, invitationsRes] = await Promise.all([
        fetch('/api/team'),
        fetch('/api/team/invitations'),
      ]);

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeam(teamData.team);
        setTenant(teamData.tenant);
      } else if (teamRes.status === 403) {
        setError('You do not have permission to view team members');
      }

      if (invitationsRes.ok) {
        const invData = await invitationsRes.json();
        setInvitations(invData.invitations);
      }
    } catch (err) {
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('AGENT');
        fetchTeamData();
        // Show success message with invite URL
        alert(`Invitation sent! Share this link:\n${data.invitation.inviteUrl}`);
      } else {
        alert(data.error || 'Failed to send invitation');
      }
    } catch (err) {
      alert('Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/team/invitations?id=${invitationId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTeamData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel invitation');
      }
    } catch (err) {
      alert('Failed to cancel invitation');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/team/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setSelectedMember(null);
        fetchTeamData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update role');
      }
    } catch (err) {
      alert('Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/team/${selectedMember.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setShowRemoveModal(false);
        setSelectedMember(null);
        fetchTeamData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove team member');
      }
    } catch (err) {
      alert('Failed to remove team member');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (member: TeamMember) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setShowEditModal(true);
  };

  const openRemoveModal = (member: TeamMember) => {
    setSelectedMember(member);
    setShowRemoveModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Access Denied</h2>
        <p className="text-neutral-500">{error}</p>
      </div>
    );
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Team Management</h1>
          <p className="text-neutral-500">
            {tenant?.currentUsers} of {tenant?.maxUsers} users • {tenant?.subscriptionTier} plan
          </p>
        </div>
        <Button
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setShowInviteModal(true)}
          disabled={tenant && tenant.currentUsers >= tenant.maxUsers}
        >
          Invite Member
        </Button>
      </div>

      {/* Team Members */}
      <Card>
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-neutral-500" />
            <h2 className="font-semibold text-neutral-900">Team Members</h2>
            <Badge variant="neutral" size="sm">
              {team.length}
            </Badge>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-100">
            {team.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 hover:bg-neutral-50"
              >
                <div className="flex items-center gap-4">
                  <Avatar name={`${member.firstName} ${member.lastName}`} size="md" />
                  <div>
                    <p className="font-medium text-neutral-900">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-sm text-neutral-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      roleColors[member.role] || roleColors.AGENT
                    )}
                  >
                    {member.role}
                  </div>
                  {member.lastLoginAt && (
                    <span className="text-xs text-neutral-400 hidden sm:block">
                      Last active {formatRelativeTime(new Date(member.lastLoginAt))}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-2 rounded hover:bg-neutral-100"
                      title="Edit role"
                    >
                      <Shield className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      onClick={() => openRemoveModal(member)}
                      className="p-2 rounded hover:bg-red-50"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <div className="p-4 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-neutral-500" />
              <h2 className="font-semibold text-neutral-900">Pending Invitations</h2>
              <Badge variant="warning" size="sm">
                {pendingInvitations.length}
              </Badge>
            </div>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{invitation.email}</p>
                      <p className="text-sm text-neutral-500">
                        Invited by {invitation.inviter.firstName} {invitation.inviter.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        roleColors[invitation.role] || roleColors.AGENT
                      )}
                    >
                      {invitation.role}
                    </div>
                    <span className="text-xs text-neutral-400 hidden sm:block">
                      Expires {formatRelativeTime(new Date(invitation.expiresAt))}
                    </span>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="p-2 rounded hover:bg-red-50"
                      title="Cancel invitation"
                    >
                      <X className="w-4 h-4 text-neutral-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <Select
            label="Role"
            options={roleOptions}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          />
          <div className="p-3 bg-neutral-50 rounded-lg text-sm text-neutral-600">
            <p className="font-medium mb-1">Role Permissions:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Agent:</strong> Manage own leads, properties, and showings</li>
              <li><strong>Manager:</strong> View all data, invite team members, assign leads</li>
              <li><strong>Seller:</strong> Limited access to view assigned properties</li>
            </ul>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Change Role"
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          {selectedMember && (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <Avatar name={`${selectedMember.firstName} ${selectedMember.lastName}`} size="sm" />
              <div>
                <p className="font-medium text-neutral-900">
                  {selectedMember.firstName} {selectedMember.lastName}
                </p>
                <p className="text-sm text-neutral-500">{selectedMember.email}</p>
              </div>
            </div>
          )}
          <Select
            label="New Role"
            options={[...roleOptions, { value: 'ADMIN', label: 'Admin' }]}
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
          />
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Role'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Remove Member Modal */}
      <Modal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        title="Remove Team Member"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="text-sm text-red-700">
              This action cannot be undone. The user will lose access to this team.
            </p>
          </div>
          {selectedMember && (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <Avatar name={`${selectedMember.firstName} ${selectedMember.lastName}`} size="sm" />
              <div>
                <p className="font-medium text-neutral-900">
                  {selectedMember.firstName} {selectedMember.lastName}
                </p>
                <p className="text-sm text-neutral-500">{selectedMember.email}</p>
              </div>
            </div>
          )}
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowRemoveModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={submitting}
            >
              {submitting ? 'Removing...' : 'Remove Member'}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
