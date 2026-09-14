// src/components/AdminPanel.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { getAdmins, deleteAdmin, addAdmin, type AdminUser } from '../services/admin';
import { notifyError } from '../stores/notification';
import { Button, Input, Modal, Avatar, Badge, Card } from './ui';
import './AdminPanel.css';

// Clean SVG Icons
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export const AdminPanel: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Admin modal state
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Delete Admin modal state
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; email: string }>({
    open: false,
    email: '',
  });
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await getAdmins();
      if (data) setAdmins(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleAddSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      setAddError('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAddError('Please enter a valid email address');
      return;
    }

    setAddError('');
    setSubmittingAdd(true);

    try {
      const ok = await addAdmin(trimmedEmail);
      if (ok) {
        setNewEmail('');
        setShowAdd(false);
        await loadAdmins();
      }
    } catch (err) {
      notifyError('Failed to add administrator');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.email) return;

    setSubmittingDelete(true);
    try {
      const ok = await deleteAdmin(deleteModal.email);
      if (ok) {
        setDeleteModal({ open: false, email: '' });
        await loadAdmins();
      }
    } catch (err) {
      notifyError('Failed to delete administrator');
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div className="admin-panel">
      {/* Page Header */}
      <div className="admin-panel__header">
        <div>
          <div className="admin-panel__title-group">
            <h1 className="admin-panel__title">Administrators</h1>
            <Badge variant="light" color="blue" size="md">
              {admins.length} {admins.length === 1 ? 'admin' : 'admins'}
            </Badge>
          </div>
          <p className="admin-panel__subtitle">
            Manage administrative access and permissions for Berry Sites.
          </p>
        </div>

        <Button
          variant="filled"
          color="blue"
          size="sm"
          leftSection={<PlusIcon />}
          onClick={() => {
            setAddError('');
            setShowAdd(true);
          }}
        >
          Add Admin
        </Button>
      </div>

      {/* Main Content Card */}
      <Card padding="xs" withBorder>

        {/* Loading Skeleton */}
        {loading && (
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="admin-panel__skeleton-row">
                <div className="admin-panel__skeleton-avatar" />
                <div className="admin-panel__skeleton-lines">
                  <div className="admin-panel__skeleton-line" style={{ width: '35%' }} />
                  <div className="admin-panel__skeleton-line" style={{ width: '55%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table Content */}
        {!loading && admins.length > 0 && (
          <div className="admin-panel__table-wrapper">
            <table className="admin-panel__table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.email}>
                    <td>
                      <div className="admin-panel__profile">
                        <Avatar
                          src={admin.picture}
                          alt={admin.name || admin.email}
                          fallback={(admin.name || admin.email)[0].toUpperCase()}
                          size="md"
                        />
                        <div className="admin-panel__profile-details">
                          <span className="admin-panel__profile-name">
                            {admin.name || 'Not logged in'}
                          </span>
                          <span className="admin-panel__profile-email">
                            {admin.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-panel__actions">
                        <Button
                          variant="subtle"
                          color="red"
                          size="xs"
                          leftSection={<TrashIcon />}
                          onClick={() => setDeleteModal({ open: true, email: admin.email })}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && admins.length === 0 && (
          <div className="admin-panel__empty">
            <div className="admin-panel__empty-icon">
              <UsersIcon />
            </div>
            <h3 className="admin-panel__empty-title">
              No administrators yet
            </h3>
            <p className="admin-panel__empty-description">
              Get started by inviting your first administrator.
            </p>
              <Button
                variant="filled"
                size="sm"
                leftSection={<PlusIcon />}
                onClick={() => {
                  setAddError('');
                  setShowAdd(true);
                }}
              >
                Add Admin
              </Button>
          </div>
        )}
      </Card>

      {/* Add Admin Modal */}
      <Modal
        opened={showAdd}
        onClose={() => {
          if (!submittingAdd) {
            setShowAdd(false);
            setAddError('');
            setNewEmail('');
          }
        }}
        title="Add Administrator"
        size="md"
      >
        <form onSubmit={handleAddSubmit}>
          <Input
            label="Email address"
            description="The Google account email of the person you want to grant admin access."
            placeholder="colleague@example.com"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              if (addError) setAddError('');
            }}
            error={addError}
            withAsterisk
            autoFocus
            leftSection={<MailIcon />}
            disabled={submittingAdd}
          />

          <div className="admin-panel__modal-footer">
            <Button
              variant="default"
              size="sm"
              disabled={submittingAdd}
              onClick={() => {
                setShowAdd(false);
                setAddError('');
                setNewEmail('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="blue"
              size="sm"
              type="submit"
              loading={submittingAdd}
            >
              Add Admin
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        opened={deleteModal.open}
        onClose={() => {
          if (!submittingDelete) {
            setDeleteModal({ open: false, email: '' });
          }
        }}
        title="Remove Administrator"
        size="sm"
      >
        <div className="admin-panel__delete-alert">
          <span className="admin-panel__delete-alert-icon">
            <AlertTriangleIcon />
          </span>
          <div className="admin-panel__delete-alert-content">
            This will immediately revoke all administrative privileges for this account.
          </div>
        </div>

        <p style={{ margin: '0 0 1.25rem 0', color: 'var(--mantine-gray-8, #343a40)', fontSize: '0.9375rem' }}>
          Are you sure you want to remove <strong>{deleteModal.email}</strong> as an administrator?
        </p>

        <div className="admin-panel__modal-footer">
          <Button
            variant="default"
            size="sm"
            disabled={submittingDelete}
            onClick={() => setDeleteModal({ open: false, email: '' })}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color="red"
            size="sm"
            loading={submittingDelete}
            onClick={handleDeleteConfirm}
          >
            Remove Admin
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPanel;
