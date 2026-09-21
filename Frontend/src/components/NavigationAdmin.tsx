// src/components/NavigationAdmin.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  getNavLinks,
  saveNavLinks,
  type GetAllLinksDto,
  type Language,
} from '../services/nav';
import { Button, Input, Modal, Card, Badge } from './ui';
import './NavigationAdmin.css';

// SVG Icons
function ArrowUpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
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

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
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

export const NavigationAdmin: React.FC = () => {
  const [links, setLinks] = useState<GetAllLinksDto[]>([]);
  const [initialLinks, setInitialLinks] = useState<GetAllLinksDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Developer changes mode toggle (default OFF)
  const [allowDevChanges, setAllowDevChanges] = useState(false);

  // Add Link Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [addError, setAddError] = useState('');

  // Delete Link Modal state
  const [deleteTarget, setDeleteTarget] = useState<GetAllLinksDto | null>(null);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const data = await getNavLinks();
      if (data) {
        setLinks(data);
        setInitialLinks(JSON.parse(JSON.stringify(data)));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const isDirty = useMemo(() => {
    if (links.length !== initialLinks.length) return true;
    for (let i = 0; i < links.length; i++) {
      const a = links[i];
      const b = initialLinks[i];
      if (!b) return true;
      if (a.id !== b.id || a.url !== b.url || a.order !== b.order) return true;
      const aEn = a.contents.find((c) => c.language === 'EN')?.name ?? '';
      const bEn = b.contents.find((c) => c.language === 'EN')?.name ?? '';
      const aCs = a.contents.find((c) => c.language === 'CS')?.name ?? '';
      const bCs = b.contents.find((c) => c.language === 'CS')?.name ?? '';
      if (aEn !== bEn || aCs !== bCs) return true;
    }
    return false;
  }, [links, initialLinks]);

  const handleUrlChange = (index: number, value: string) => {
    setLinks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], url: value };
      return next;
    });
  };

  const handleContentNameChange = (index: number, language: Language, value: string) => {
    setLinks((prev) => {
      const next = [...prev];
      const item = next[index];
      let updatedContents = item.contents.map((c) =>
        c.language === language ? { ...c, name: value } : c
      );
      if (!updatedContents.some((c) => c.language === language)) {
        updatedContents.push({ language, name: value });
      }
      next[index] = { ...item, contents: updatedContents };
      return next;
    });
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setLinks((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= links.length - 1) return;
    setLinks((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setLinks((prev) =>
      prev
        .filter((item) => item.id !== deleteTarget.id)
        .map((item, idx) => ({ ...item, order: idx }))
    );
    setDeleteTarget(null);
  };

  const handleAddSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = newUrl.trim();
    if (!trimmed) {
      setAddError('Please enter a URL or path for the navigation link');
      return;
    }

    const newItem: GetAllLinksDto = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}`,
      url: trimmed,
      order: links.length,
      contents: [
        { language: 'EN', name: '' },
        { language: 'CS', name: '' },
      ],
    };

    setLinks((prev) => [...prev, newItem]);
    setNewUrl('');
    setAddError('');
    setShowAddModal(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await saveNavLinks(links);
      if (ok) {
        await loadLinks();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="nav-admin">
      {/* Header */}
      <div className="nav-admin__header">
        <div>
          <div className="nav-admin__title-group">
            <h1 className="nav-admin__title">Public Navigation</h1>
            <Badge variant="light" color="blue" size="md">
              {links.length} {links.length === 1 ? 'link' : 'links'}
            </Badge>
          </div>
        </div>

        <div className="nav-admin__header-actions">
          {/* Developer Mode Toggle Button */}
          <button
            type="button"
            className={`nav-admin__dev-toggle ${
              allowDevChanges ? 'nav-admin__dev-toggle--active' : ''
            }`}
            onClick={() => setAllowDevChanges((prev) => !prev)}
            title={allowDevChanges ? 'Developing changes enabled' : 'Developing changes disabled'}
          >
            {allowDevChanges ? <UnlockIcon /> : <LockIcon />}
            <span>
              {allowDevChanges ? 'Developing Changes: ON' : 'Allow Developing Changes'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <Card padding='xs' withBorder>
        {/* Loading Skeletons */}
        {loading && (
          <div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="nav-admin__skeleton-row">
                <div className="nav-admin__skeleton-badge" />
                <div className="nav-admin__skeleton-box" style={{ width: '25%' }} />
                <div className="nav-admin__skeleton-box" style={{ width: '30%' }} />
                <div className="nav-admin__skeleton-box" style={{ width: '30%' }} />
              </div>
            ))}
          </div>
        )}

        {/* Links List */}
        {!loading && links.length > 0 && (
          <div className="nav-admin__list">
            {links.map((link, index) => {
              const enContent = link.contents.find((c) => c.language === 'EN')?.name ?? '';
              const csContent = link.contents.find((c) => c.language === 'CS')?.name ?? '';

              return (
                <div key={link.id || index} className="nav-admin__row">
                  {/* URL Input (Editable ONLY when allowDevChanges is ON) */}
                  <div className="nav-admin__url-section">
                    <Input
                      placeholder="/example or #about"
                      value={link.url}
                      onChange={(e) => handleUrlChange(index, e.target.value)}
                      disabled={!allowDevChanges}
                      leftSection={<LinkIcon />}
                      size="sm"
                      title={!allowDevChanges ? 'Enable Developing Changes to edit URL' : undefined}
                    />
                  </div>

                  {/* Multi-language Name Inputs (Always editable) */}
                  <div className="nav-admin__lang-section">
                    <div className="nav-admin__lang-field">
                      <Input
                        placeholder="English title"
                        value={enContent}
                        onChange={(e) => handleContentNameChange(index, 'EN', e.target.value)}
                        leftSection={<span className="nav-admin__lang-tag">EN</span>}
                        size="sm"
                      />
                    </div>
                    <div className="nav-admin__lang-field">
                      <Input
                        placeholder="Český název"
                        value={csContent}
                        onChange={(e) => handleContentNameChange(index, 'CS', e.target.value)}
                        leftSection={<span className="nav-admin__lang-tag">CS</span>}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Order Up / Down Arrows */}
                  <div className="nav-admin__order-actions">
                    <button
                      type="button"
                      className="nav-admin__arrow-btn"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      title="Move up"
                      aria-label="Move item up"
                    >
                      <ArrowUpIcon />
                    </button>
                    <button
                      type="button"
                      className="nav-admin__arrow-btn"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === links.length - 1}
                      title="Move down"
                      aria-label="Move item down"
                    >
                      <ArrowDownIcon />
                    </button>
                  </div>

                  {/* Delete Button (Visible ONLY when allowDevChanges is ON) */}
                  {allowDevChanges && (
                    <div className="nav-admin__delete-section">
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        leftSection={<TrashIcon />}
                        onClick={() => setDeleteTarget(link)}
                        title="Delete navigation item"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && links.length === 0 && (
          <div className="nav-admin__empty">
            <div className="nav-admin__empty-icon">
              <LinkIcon />
            </div>
            <h3 className="nav-admin__empty-title">No navigation links yet</h3>
            <p className="nav-admin__empty-description">
              Start configuring your public menu by adding the first navigation element.
            </p>
            <Button
              variant="filled"
              size="sm"
              leftSection={<PlusIcon />}
              onClick={() => {
                setAddError('');
                setNewUrl('');
                setShowAddModal(true);
              }}
            >
              Add New Link
            </Button>
          </div>
        )}

        {/* Bottom Actions Bar */}
        {!loading && (
          <div className="nav-admin__footer">
            <div className="nav-admin__footer-left">
              <Button
                variant="default"
                disabled={!allowDevChanges}
                size="sm"
                leftSection={<PlusIcon />}
                onClick={() => {
                  setAddError('');
                  setNewUrl('');
                  setShowAddModal(true);
                }}
              >
                Add Link
              </Button>
            </div>

            <div className="nav-admin__footer-right">
              <Button
                variant="filled"
                color="blue"
                size="sm"
                leftSection={<SaveIcon />}
                loading={saving}
                disabled={loading || !isDirty}
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Link Modal */}
      <Modal
        opened={showAddModal}
        onClose={() => {
          if (!saving) {
            setShowAddModal(false);
            setAddError('');
            setNewUrl('');
          }
        }}
        title="Add Navigation Link"
        size="md"
      >
        <form onSubmit={handleAddSubmit}>
          <Input
            label="URL or Target Path"
            description="Enter the path (e.g. /comics, /illustration) or anchor (e.g. #about) for this link."
            placeholder="/comics"
            value={newUrl}
            onChange={(e) => {
              setNewUrl(e.target.value);
              if (addError) setAddError('');
            }}
            error={addError}
            withAsterisk
            autoFocus
            leftSection={<LinkIcon />}
          />

          <div className="nav-admin__modal-footer">
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setShowAddModal(false);
                setAddError('');
                setNewUrl('');
              }}
            >
              Cancel
            </Button>
            <Button variant="filled" color="blue" size="sm" type="submit">
              Add Link
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Navigation Item"
        size="sm"
      >
        <div className="nav-admin__delete-alert">
          <span className="nav-admin__delete-alert-icon">
            <AlertTriangleIcon />
          </span>
          <div className="nav-admin__delete-alert-content">
            This will remove this item from the list. Remember to save changes to persist your changes.
          </div>
        </div>

        <p style={{ margin: '0 0 1.25rem 0', color: 'var(--mantine-gray-8, #343a40)', fontSize: '0.9375rem' }}>
          Are you sure you want to delete the navigation item for{' '}
          <strong>{deleteTarget?.url}</strong>?
        </p>

        <div className="nav-admin__modal-footer">
          <Button
            variant="default"
            size="sm"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color="red"
            size="sm"
            onClick={handleDeleteConfirm}
          >
            Delete Item
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default NavigationAdmin;
