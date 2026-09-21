// src/components/ContactsAdmin.tsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Button, Input, Modal, Card, Badge } from './ui';
import {
  getOrCreateContactsSection,
  updateSectionContent,
  parseContactsJson,
  normalizeLanguage,
  type ContactItem,
} from '../services/content';
import { notifyError } from '../stores/notification';
import './ContactsAdmin.css';

// SVG Icons for Actions
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

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

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

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

function ExternalLinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

// Safely render SVG string in a div
function SvgRenderer({ svgString, className = '' }: { svgString: string; className?: string }) {
  if (!svgString || !svgString.trim()) {
    return <GlobeIcon />;
  }

  return (
    <div
      className={`contacts-admin__svg-container ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}

export const ContactsAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Content IDs from backend SectionContent
  const [enContentId, setEnContentId] = useState<string | null>(null);
  const [csContentId, setCsContentId] = useState<string | null>(null);

  // Language specific headers
  const [enTitle, setEnTitle] = useState('');
  const [enSubtitle, setEnSubtitle] = useState('');
  const [csTitle, setCsTitle] = useState('');
  const [csSubtitle, setCsSubtitle] = useState('');

  // Shared / Synchronized contact links across both languages
  const [items, setItems] = useState<ContactItem[]>([]);

  // Active language tab for editing title & subtitle
  const [activeTab, setActiveTab] = useState<'EN' | 'CS'>('EN');

  // Modal State for Add/Edit Contact Item
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContactItem | null>(null);
  const [itemLabel, setItemLabel] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [itemSvg, setItemSvg] = useState('');
  const [itemError, setItemError] = useState<string | null>(null);
  const [isSvgDragOver, setIsSvgDragOver] = useState(false);

  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  const svgFileInputRef = useRef<HTMLInputElement>(null);

  // Load section from API
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const section = await getOrCreateContactsSection();
        if (!section || !isMounted) return;

        const enContent = section.contents.find((c) => normalizeLanguage(c.language) === 'EN');
        const csContent = section.contents.find((c) => normalizeLanguage(c.language) === 'CS');

        let loadedEnTitle = '';
        let loadedEnSubtitle = '';
        let loadedCsTitle = '';
        let loadedCsSubtitle = '';
        let loadedItems: ContactItem[] = [];

        if (enContent) {
          setEnContentId(enContent.id);
          const enParsed = parseContactsJson(enContent.json);
          if (enParsed.title) {
            setEnTitle(enParsed.title);
            loadedEnTitle = enParsed.title;
          }
          if (enParsed.subtitle) {
            setEnSubtitle(enParsed.subtitle);
            loadedEnSubtitle = enParsed.subtitle;
          }
          if (enParsed.items && enParsed.items.length > 0) {
            setItems(enParsed.items);
            loadedItems = enParsed.items;
          }
        }

        if (csContent) {
          setCsContentId(csContent.id);
          const csParsed = parseContactsJson(csContent.json);
          if (csParsed.title) {
            setCsTitle(csParsed.title);
            loadedCsTitle = csParsed.title;
          }
          if (csParsed.subtitle) {
            setCsSubtitle(csParsed.subtitle);
            loadedCsSubtitle = csParsed.subtitle;
          }
          if (loadedItems.length === 0 && csParsed.items && csParsed.items.length > 0) {
            setItems(csParsed.items);
            loadedItems = csParsed.items;
          }
        }

        setInitialSnapshot(
          JSON.stringify({
            enTitle: loadedEnTitle,
            enSubtitle: loadedEnSubtitle,
            csTitle: loadedCsTitle,
            csSubtitle: loadedCsSubtitle,
            items: loadedItems.map(({ url, text, svg }) => ({ url, text, svg })),
          })
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute current state snapshot to detect unsaved changes
  const currentSnapshot = useMemo(() => {
    return JSON.stringify({
      enTitle,
      enSubtitle,
      csTitle,
      csSubtitle,
      items: items.map(({ url, text, svg }) => ({ url, text, svg })),
    });
  }, [enTitle, enSubtitle, csTitle, csSubtitle, items]);

  const hasChanges = initialSnapshot !== null && currentSnapshot !== initialSnapshot;

  // Save changes to backend
  const handleSave = async () => {
    if (!enContentId && !csContentId) {
      notifyError('No content records found to save.');
      return;
    }

    setSaving(true);
    try {
      const payloads: { id: string; content: string }[] = [];

      if (enContentId) {
        payloads.push({
          id: enContentId,
          content: JSON.stringify({
            title: enTitle,
            subtitle: enSubtitle,
            items,
          }),
        });
      }

      if (csContentId) {
        payloads.push({
          id: csContentId,
          content: JSON.stringify({
            title: csTitle,
            subtitle: csSubtitle,
            items,
          }),
        });
      }

      const success = await updateSectionContent(payloads);
      if (success) {
        setInitialSnapshot(currentSnapshot);
      }
    } finally {
      setSaving(false);
    }
  };

  // Reorder items
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  // Delete item
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Open modal for new item
  const openNewItemModal = () => {
    setEditingItem(null);
    setItemLabel('');
    setItemUrl('');
    setItemSvg('');
    setItemError(null);
    setIsSvgDragOver(false);
    setModalOpen(true);
  };

  // Open modal for editing existing item
  const openEditItemModal = (item: ContactItem) => {
    setEditingItem(item);
    setItemLabel(item.text);
    setItemUrl(item.url);
    setItemSvg(item.svg);
    setItemError(null);
    setIsSvgDragOver(false);
    setModalOpen(true);
  };

  // Handle uploaded SVG file
  const handleSvgFile = async (file: File) => {
    setItemError(null);
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    if (!isSvg) {
      setItemError('Please select a valid .svg file.');
      return;
    }

    try {
      const text = await file.text();
      if (!text.toLowerCase().includes('<svg')) {
        setItemError('The selected file does not contain valid SVG markup.');
        return;
      }

      setItemSvg(text.trim());

      // Auto-populate label from filename if empty
      if (!itemLabel.trim()) {
        const baseName = file.name.replace(/\.svg$/i, '');
        setItemLabel(baseName.charAt(0).toUpperCase() + baseName.slice(1));
      }
    } catch {
      setItemError('Failed to read the SVG file.');
    }
  };

  const handleSvgDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsSvgDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      handleSvgFile(dropped);
    }
  };

  // Save item inside modal
  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemLabel.trim()) {
      setItemError('Please enter a label for this contact.');
      return;
    }

    if (!itemUrl.trim()) {
      setItemError('Please enter a link URL.');
      return;
    }

    if (!itemSvg.trim()) {
      setItemError('Please upload an SVG icon for this contact.');
      return;
    }

    if (editingItem) {
      // Update existing item
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingItem.id
            ? { ...it, text: itemLabel.trim(), url: itemUrl.trim(), svg: itemSvg.trim() }
            : it
        )
      );
    } else {
      // Add new item
      const newItem: ContactItem = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        text: itemLabel.trim(),
        url: itemUrl.trim(),
        svg: itemSvg.trim(),
      };
      setItems((prev) => [...prev, newItem]);
    }

    setModalOpen(false);
  };

  return (
    <div className="contacts-admin">
      {/* Page Header */}
      <div className="contacts-admin__header">
        <div className="contacts-admin__title-group">
          <h1 className="contacts-admin__title">Contacts</h1>
        </div>

        <div className="contacts-admin__header-actions">
          <Button
            variant="default"
            size="sm"
            leftSection={<PlusIcon />}
            onClick={openNewItemModal}
            disabled={loading}
          >
            Add Contact
          </Button>

          <Button
            variant="filled"
            color="blue"
            size="sm"
            leftSection={<SaveIcon />}
            onClick={handleSave}
            loading={saving}
            disabled={loading || saving || !hasChanges}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="contacts-admin__loading">
          <div className="contacts-admin__skeleton" style={{ height: '140px' }} />
          <div className="contacts-admin__skeleton" style={{ height: '300px' }} />
        </div>
      ) : (
        <div className="contacts-admin__content">
          {/* Section Headers (Language Specific) */}
          <Card withBorder padding="md" className="contacts-admin__headers-card">
            <div className="contacts-admin__card-header">
              <div>
                <h3 className="contacts-admin__card-title">Section Headers</h3>
              </div>

              {/* Language Switcher Tabs */}
              <div className="contacts-admin__lang-tabs">
                <button
                  type="button"
                  className={`contacts-admin__lang-tab ${activeTab === 'EN' ? 'contacts-admin__lang-tab--active' : ''}`}
                  onClick={() => setActiveTab('EN')}
                >
                  English
                </button>
                <button
                  type="button"
                  className={`contacts-admin__lang-tab ${activeTab === 'CS' ? 'contacts-admin__lang-tab--active' : ''}`}
                  onClick={() => setActiveTab('CS')}
                >
                  Czech
                </button>
              </div>
            </div>

            <div className="contacts-admin__headers-inputs">
              {activeTab === 'EN' ? (
                <>
                  <Input
                    label="Title (English)"
                    placeholder="e.g. Get in Touch"
                    value={enTitle}
                    onChange={(e) => setEnTitle(e.target.value)}
                    description="Main heading for the contacts"
                  />
                  <Input
                    label="Subtitle (English)"
                    placeholder="e.g. Follow my work or reach out directly"
                    value={enSubtitle}
                    onChange={(e) => setEnSubtitle(e.target.value)}
                    description="Supporting text"
                  />
                </>
              ) : (
                <>
                  <Input
                    label="Title (Czech)"
                    placeholder="e.g. Get in Touch"
                    value={csTitle}
                    onChange={(e) => setCsTitle(e.target.value)}
                    description="Main heading for the contacts"
                  />
                  <Input
                    label="Subtitle (Czech)"
                    placeholder="e.g. Follow my work or reach out directly"
                    value={csSubtitle}
                    onChange={(e) => setCsSubtitle(e.target.value)}
                    description="Supporting text"
                  />
                </>
              )}
            </div>
          </Card>

          {/* Contact Items List (Synchronized in both languages) */}
          <Card withBorder padding="md" className="contacts-admin__list-card">
            <div className="contacts-admin__card-header">
              <div>
                <div className="contacts-admin__card-title-row">
                  <h3 className="contacts-admin__card-title">Contact Channels</h3>
                  <Badge variant="light" color="blue" size="sm">
                    {items.length} {items.length === 1 ? 'channel' : 'channels'}
                  </Badge>
                </div>
                <p className="contacts-admin__card-desc">
                  Contact channels (Instagram, X, Email, etc.) are <strong>automatically synchronized</strong> in both English and Czech.
                </p>
              </div>

              <Button
                variant="light"
                color="blue"
                size="xs"
                leftSection={<PlusIcon />}
                onClick={openNewItemModal}
              >
                Add Channel
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="contacts-admin__empty-list">
                <div className="contacts-admin__empty-icon">
                  <GlobeIcon />
                </div>
                <h4>No contact links added yet</h4>
                <p>Click "Add Contact" to upload an SVG icon and add your social media channels or links.</p>
                <Button
                  variant="filled"
                  color="blue"
                  size="sm"
                  leftSection={<PlusIcon />}
                  onClick={openNewItemModal}
                >
                  Add First Contact
                </Button>
              </div>
            ) : (
              <div className="contacts-admin__items-table">
                {items.map((item, index) => (
                  <div key={item.id} className="contacts-admin__item-row">
                    {/* Order buttons */}
                    <div className="contacts-admin__order-btns">
                      <button
                        type="button"
                        className="contacts-admin__icon-btn"
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                      >
                        <ArrowUpIcon />
                      </button>
                      <button
                        type="button"
                        className="contacts-admin__icon-btn"
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === items.length - 1}
                        title="Move Down"
                      >
                        <ArrowDownIcon />
                      </button>
                    </div>

                    {/* SVG Icon Badge */}
                    <div className="contacts-admin__item-icon-box">
                      <SvgRenderer svgString={item.svg} />
                    </div>

                    {/* Channel Info */}
                    <div className="contacts-admin__item-details">
                      <div className="contacts-admin__item-label">{item.text}</div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contacts-admin__item-url"
                        title={item.url}
                      >
                        <span>{item.url}</span>
                        <ExternalLinkIcon />
                      </a>
                    </div>

                    {/* Row Actions */}
                    <div className="contacts-admin__item-actions">
                      <button
                        type="button"
                        className="contacts-admin__row-btn"
                        onClick={() => openEditItemModal(item)}
                        title="Edit Contact"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="contacts-admin__row-btn contacts-admin__row-btn--delete"
                        onClick={() => removeItem(item.id)}
                        title="Delete Contact"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Contact Channel' : 'Add Contact Channel'}
        size="lg"
      >
        <form onSubmit={handleModalSave} className="contacts-admin__modal-form">
          {/* Label / Text */}
          <Input
            label="Channel Name / Text"
            placeholder="e.g. Instagram"
            value={itemLabel}
            onChange={(e) => setItemLabel(e.target.value)}
            withAsterisk
            required
          />

          {/* Link URL */}
          <Input
            label="Destination URL"
            placeholder="e.g. https://instagram.com/berry26"
            value={itemUrl}
            onChange={(e) => setItemUrl(e.target.value)}
            withAsterisk
            required
          />

          {/* SVG File Upload Area */}
          <div className="contacts-admin__svg-upload-section">
            <div className="contacts-admin__svg-header">
              <label className="contacts-admin__input-label">
                Icon (SVG) <span className="contacts-admin__required">*</span>
              </label>
              <span className="contacts-admin__input-hint">Upload any .svg vector file</span>
            </div>

            <input
              ref={svgFileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSvgFile(file);
                e.target.value = '';
              }}
            />

            {!itemSvg ? (
              <div
                className={`contacts-admin__svg-dropzone ${isSvgDragOver ? 'contacts-admin__svg-dropzone--active' : ''}`}
                onClick={() => svgFileInputRef.current?.click()}
                onDrop={handleSvgDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsSvgDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsSvgDragOver(false);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    svgFileInputRef.current?.click();
                  }
                }}
              >
                <div className="contacts-admin__svg-dropzone-icon">
                  <UploadIcon />
                </div>
                <div className="contacts-admin__svg-dropzone-text">
                  Click or drag & drop .svg file here
                </div>
                <p className="contacts-admin__svg-dropzone-sub">
                  Only vector SVG files are supported
                </p>
              </div>
            ) : (
              <div className="contacts-admin__svg-preview-panel">
                <div className="contacts-admin__svg-preview-display">
                  <SvgRenderer svgString={itemSvg} />
                </div>
                <div className="contacts-admin__svg-preview-meta">
                  <span className="contacts-admin__svg-status">SVG Icon Loaded</span>
                  <Button
                    type="button"
                    variant="default"
                    size="xs"
                    leftSection={<UploadIcon />}
                    onClick={() => svgFileInputRef.current?.click()}
                  >
                    Upload Different SVG
                  </Button>
                </div>
              </div>
            )}

            {/* Optional Raw SVG Code View / Edit */}
            <details className="contacts-admin__svg-code-details">
              <summary>View / Edit raw SVG markup</summary>
              <textarea
                className="contacts-admin__svg-textarea"
                rows={4}
                value={itemSvg}
                onChange={(e) => setItemSvg(e.target.value)}
                placeholder="<svg ...>...</svg>"
              />
            </details>
          </div>

          {itemError && <div className="contacts-admin__error-banner">{itemError}</div>}

          {/* Modal Footer */}
          <div className="contacts-admin__modal-footer">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              color="blue"
              size="sm"
            >
              {editingItem ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ContactsAdmin;
