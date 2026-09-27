// src/components/PagesAdmin.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  getAllPages,
  createPage,
  updatePage,
  deletePage,
  slugify,
  type PageDto,
  type PageType,
  type Language,
  type PageContentDto,
} from '../services/pages';
import { Button, Input, Modal, Badge, Combobox, type ComboboxItem } from './ui';
import { PageGalleryAdmin } from './PageGalleryAdmin';
import './PagesAdmin.css';

// SVG Icons
function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
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

function AlertTriangleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

const LANGUAGE_OPTIONS: ComboboxItem[] = [
  { value: 'EN', label: 'English' },
  { value: 'CS', label: 'Czech' },
];

export const PagesAdmin: React.FC = () => {
  const [pages, setPages] = useState<PageDto[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<Language>('EN');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorTab, setEditorTab] = useState<'content' | 'gallery'>('content');

  // Editable state of current page
  const [editUrl, setEditUrl] = useState('');
  const [editContents, setEditContents] = useState<{ [key in Language]: { title: string; subtitle: string } }>({
    EN: { title: '', subtitle: '' },
    CS: { title: '', subtitle: '' },
  });

  // Pristine snapshot to track unsaved changes
  const [originalSnapshot, setOriginalSnapshot] = useState<{
    url: string;
    contents: { [key in Language]: { title: string; subtitle: string } };
  } | null>(null);

  // Unsaved Changes Discard Modal
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Create Page Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPageType, setCreatePageType] = useState<PageType>('COMICS');
  const [createLang, setCreateLang] = useState<Language>('EN');
  const [createUrl, setCreateUrl] = useState('');
  const [createUrlManuallyEdited, setCreateUrlManuallyEdited] = useState(false);
  const [createContents, setCreateContents] = useState<{ [key in Language]: { title: string; subtitle: string } }>({
    EN: { title: '', subtitle: '' },
    CS: { title: '', subtitle: '' },
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete Page Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedPage = useMemo(() => {
    return pages.find((p) => p.id === selectedPageId) || null;
  }, [pages, selectedPageId]);

  const loadPages = async (preserveSelectedId?: string) => {
    setLoading(true);
    try {
      const data = await getAllPages();
      if (data) {
        setPages(data);
        const targetId = preserveSelectedId || (data.length > 0 ? data[0].id : null);
        if (targetId && data.some((p) => p.id === targetId)) {
          setSelectedPageId(targetId);
          initEditorState(data.find((p) => p.id === targetId)!);
        } else {
          setSelectedPageId(null);
          setOriginalSnapshot(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const initEditorState = (page: PageDto) => {
    const en = page.contents.find((c) => c.language === 'EN') || { title: '', subtitle: '' };
    const cs = page.contents.find((c) => c.language === 'CS') || { title: '', subtitle: '' };

    const contentsMap = {
      EN: { title: en.title, subtitle: en.subtitle },
      CS: { title: cs.title, subtitle: cs.subtitle },
    };

    setEditUrl(page.url);
    setEditContents(contentsMap);
    setOriginalSnapshot({
      url: page.url,
      contents: JSON.parse(JSON.stringify(contentsMap)),
    });
  };

  // Has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!originalSnapshot) return false;
    if (editUrl !== originalSnapshot.url) return true;
    if (editContents.EN.title !== originalSnapshot.contents.EN.title) return true;
    if (editContents.EN.subtitle !== originalSnapshot.contents.EN.subtitle) return true;
    if (editContents.CS.title !== originalSnapshot.contents.CS.title) return true;
    if (editContents.CS.subtitle !== originalSnapshot.contents.CS.subtitle) return true;
    return false;
  }, [editUrl, editContents, originalSnapshot]);

  // Request page selection change with unsaved changes guard
  const requestSelectPage = (targetId: string) => {
    if (targetId === selectedPageId) return;

    if (hasUnsavedChanges) {
      setPendingAction(() => () => {
        const targetPage = pages.find((p) => p.id === targetId);
        if (targetPage) {
          setSelectedPageId(targetId);
          initEditorState(targetPage);
        }
      });
      setShowDiscardModal(true);
    } else {
      const targetPage = pages.find((p) => p.id === targetId);
      if (targetPage) {
        setSelectedPageId(targetId);
        initEditorState(targetPage);
      }
    }
  };

  // Request open Create Page Modal with unsaved changes guard
  const requestOpenCreateModal = () => {
    if (hasUnsavedChanges) {
      setPendingAction(() => () => {
        openCreateModalInternal();
      });
      setShowDiscardModal(true);
    } else {
      openCreateModalInternal();
    }
  };

  const openCreateModalInternal = () => {
    setCreatePageType('COMICS');
    setCreateLang('EN');
    setCreateUrl('');
    setCreateUrlManuallyEdited(false);
    setCreateContents({
      EN: { title: '', subtitle: '' },
      CS: { title: '', subtitle: '' },
    });
    setCreateError('');
    setShowCreateModal(true);
  };

  const handleDiscardAndProceed = () => {
    setShowDiscardModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Handle Create Page English Title change (auto-generate URL for COMICS)
  const handleCreateEnTitleChange = (val: string) => {
    setCreateContents((prev) => ({
      ...prev,
      EN: { ...prev.EN, title: val },
    }));

    if (createPageType === 'COMICS' && !createUrlManuallyEdited) {
      const slug = slugify(val);
      setCreateUrl(slug ? `/${slug}` : '');
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    const trimmedUrl = createUrl.trim();
    if (!trimmedUrl) {
      setCreateError('URL is required. Provide a title to generate URL or specify a URL.');
      return;
    }

    setCreateSubmitting(true);
    try {
      const result = await createPage({
        pageType: createPageType,
        url: trimmedUrl,
        contents: [
          { language: 'EN', title: createContents.EN.title.trim(), subtitle: createContents.EN.subtitle.trim() },
          { language: 'CS', title: createContents.CS.title.trim(), subtitle: createContents.CS.subtitle.trim() },
        ],
      });

      if (result.success && result.pageId) {
        setShowCreateModal(false);
        await loadPages(result.pageId);
      } else if (result.error) {
        setCreateError(result.error);
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedPage || !hasUnsavedChanges) return;

    const trimmedUrl = editUrl.trim();
    if (!trimmedUrl) return;

    setSaving(true);
    try {
      const result = await updatePage({
        id: selectedPage.id,
        url: trimmedUrl,
        contents: [
          { language: 'EN', title: editContents.EN.title.trim(), subtitle: editContents.EN.subtitle.trim() },
          { language: 'CS', title: editContents.CS.title.trim(), subtitle: editContents.CS.subtitle.trim() },
        ],
      });

      if (result.success) {
        // Update local pages state & snapshot
        const updatedContents: PageContentDto[] = [
          { language: 'EN', title: editContents.EN.title.trim(), subtitle: editContents.EN.subtitle.trim() },
          { language: 'CS', title: editContents.CS.title.trim(), subtitle: editContents.CS.subtitle.trim() },
        ];

        setPages((prev) =>
          prev.map((p) => (p.id === selectedPage.id ? { ...p, url: trimmedUrl, contents: updatedContents } : p))
        );

        setOriginalSnapshot({
          url: trimmedUrl,
          contents: JSON.parse(JSON.stringify(editContents)),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async () => {
    if (!selectedPage) return;

    setDeleting(true);
    try {
      const result = await deletePage(selectedPage.id);
      if (result.success) {
        setShowDeleteModal(false);
        const remaining = pages.filter((p) => p.id !== selectedPage.id);
        setPages(remaining);
        if (remaining.length > 0) {
          setSelectedPageId(remaining[0].id);
          initEditorState(remaining[0]);
        } else {
          setSelectedPageId(null);
          setOriginalSnapshot(null);
        }
      }
    } finally {
      setDeleting(false);
    }
  };

  const pageOptions: ComboboxItem[] = useMemo(() => {
    return pages.map((p) => {
      const en = p.contents.find((c) => c.language === 'EN');
      const cs = p.contents.find((c) => c.language === 'CS');
      const displayTitle = en?.title || cs?.title || p.url;
      const isComics = p.pageType === 'COMICS';

      return {
        value: p.id,
        label: displayTitle,
        description: p.url,
        badge: (
          <Badge size="xs" color={isComics ? 'blue' : 'gray'}>
            {p.pageType}
          </Badge>
        ),
      };
    });
  }, [pages]);

  return (
    <div className="pages-admin">
      {/* Header */}
      <div className="pages-admin__header">
        <div className="pages-admin__title-group">
          <h1 className="pages-admin__title">Pages</h1>
          <Badge size="md" color="blue">
            {pages.length} {pages.length === 1 ? 'page' : 'pages'}
          </Badge>
        </div>

        <div className="pages-admin__header-actions">
          <Button
            variant="filled"
            color="blue"
            leftSection={<PlusIcon />}
            onClick={requestOpenCreateModal}
          >
            New Page
          </Button>
        </div>
      </div>

      {/* Controls Bar: Select Page & Select Language Comboboxes */}
      <div className="pages-admin__controls">
        <Combobox
          label="Select Page"
          placeholder={loading ? 'Loading pages...' : 'Choose a page...'}
          data={pageOptions}
          value={selectedPageId}
          onChange={requestSelectPage}
          searchable
          disabled={loading || pages.length === 0}
        />

        <Combobox
          label="Edit Language"
          data={LANGUAGE_OPTIONS}
          value={selectedLang}
          onChange={(val) => setSelectedLang(val as Language)}
          disabled={!selectedPage}
        />
      </div>

      {/* Active Page Editor */}
      {selectedPage ? (
        <div className="pages-admin__editor-card">
          <div className="pages-admin__editor-header">
            <div className="pages-admin__editor-info">
              <Badge size="md" color={selectedPage.pageType === 'COMICS' ? 'blue' : 'gray'}>
                {selectedPage.pageType}
              </Badge>
              <h2 className="pages-admin__editor-title">
                {editContents[selectedLang].title || selectedPage.url}
              </h2>
            </div>

            {/* Sub-tabs: Page Details vs Page Gallery */}
            <div className="pages-admin__section-tabs">
              <button
                type="button"
                className={`pages-admin__section-tab ${editorTab === 'content' ? 'pages-admin__section-tab--active' : ''}`}
                onClick={() => setEditorTab('content')}
              >
                Page Details
              </button>
              <button
                type="button"
                className={`pages-admin__section-tab ${editorTab === 'gallery' ? 'pages-admin__section-tab--active' : ''}`}
                onClick={() => setEditorTab('gallery')}
              >
                Page Gallery
              </button>
            </div>
          </div>

          {editorTab === 'gallery' ? (
            <PageGalleryAdmin
              pageId={selectedPage.id}
              pageTitle={editContents[selectedLang].title || selectedPage.url}
            />
          ) : (
            <>
              {/* Standard Page Dev Warning */}
              {selectedPage.pageType === 'STANDART' && (
                <div className="pages-admin__warning-box">
                  <AlertTriangleIcon />
                  <div>
                    Standard pages use static URLs and fixed routes. Modifying or adding them is intended for development purposes.
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="pages-admin__fields">
                <Input
                  label="Page URL"
                  description="Routing path for this page (e.g. /comics/my-comic or /about)"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  required
                />

                <Input
                  label={`Title (${selectedLang})`}
                  placeholder={`Page title in ${selectedLang === 'EN' ? 'English' : 'Czech'}`}
                  value={editContents[selectedLang].title}
                  onChange={(e) =>
                    setEditContents((prev) => ({
                      ...prev,
                      [selectedLang]: { ...prev[selectedLang], title: e.target.value },
                    }))
                  }
                />

                <Input
                  label={`Subtitle (${selectedLang})`}
                  placeholder={`Page subtitle in ${selectedLang === 'EN' ? 'English' : 'Czech'}`}
                  value={editContents[selectedLang].subtitle}
                  onChange={(e) =>
                    setEditContents((prev) => ({
                      ...prev,
                      [selectedLang]: { ...prev[selectedLang], subtitle: e.target.value },
                    }))
                  }
                />
              </div>

              {/* Footer Actions */}
              <div className="pages-admin__footer">
                <div className="pages-admin__footer-left">
                  <Button
                    variant="danger"
                    color="red"
                    size="sm"
                    leftSection={<TrashIcon />}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Page
                  </Button>

                  {hasUnsavedChanges && (
                    <span className="pages-admin__unsaved-badge">
                      • Unsaved changes
                    </span>
                  )}
                </div>

                <Button
                  variant="filled"
                  color="blue"
                  size="sm"
                  leftSection={<SaveIcon />}
                  loading={saving}
                  disabled={!hasUnsavedChanges || !editUrl.trim()}
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        !loading && (
          <div className="pages-admin__empty">
            <h3 className="pages-admin__empty-title">No pages found</h3>
            <p className="pages-admin__empty-text">
              Create your first page to start publishing content.
            </p>
            <Button
              variant="filled"
              color="blue"
              leftSection={<PlusIcon />}
              onClick={requestOpenCreateModal}
            >
              Create Page
            </Button>
          </div>
        )
      )}

      {/* Create Page Modal */}
      <Modal
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Page"
        size="md"
      >
        <form onSubmit={handleCreatePage} className="pages-admin__modal-form">
          {/* Page Type Selector */}
          <div>
            <label className="mantine-input__label">Page Type</label>
            <div className="pages-admin__type-tabs">
              <button
                type="button"
                className={`pages-admin__type-tab ${createPageType === 'COMICS' ? 'pages-admin__type-tab--active' : ''}`}
                onClick={() => {
                  setCreatePageType('COMICS');
                  if (!createUrlManuallyEdited && createContents.EN.title) {
                    const slug = slugify(createContents.EN.title);
                    setCreateUrl(slug ? `/${slug}` : '');
                  }
                }}
              >
                COMICS
              </button>
              <button
                type="button"
                className={`pages-admin__type-tab ${createPageType === 'STANDART' ? 'pages-admin__type-tab--active' : ''}`}
                onClick={() => setCreatePageType('STANDART')}
              >
                STANDARD
              </button>
            </div>
          </div>

          {/* Warning banner when STANDARD is selected */}
          {createPageType === 'STANDART' && (
            <div className="pages-admin__warning-box">
              <AlertTriangleIcon />
              <div>
                Creating new STANDARD pages is only for developing and should be used carefully.
              </div>
            </div>
          )}

          {/* Content Language Switcher */}
          <div>
            <div className="pages-admin__lang-tabs">
              <button
                type="button"
                className={`pages-admin__lang-tab ${createLang === 'EN' ? 'pages-admin__lang-tab--active' : ''}`}
                onClick={() => setCreateLang('EN')}
              >
                English {createContents.EN.title ? '✓' : ''}
              </button>
              <button
                type="button"
                className={`pages-admin__lang-tab ${createLang === 'CS' ? 'pages-admin__lang-tab--active' : ''}`}
                onClick={() => setCreateLang('CS')}
              >
                Czech {createContents.CS.title ? '✓' : ''}
              </button>
            </div>
          </div>

          {/* Title & Subtitle inputs for active createLang */}
          {createLang === 'EN' ? (
            <>
              <Input
                label="English Title"
                placeholder="Title in English"
                value={createContents.EN.title}
                onChange={(e) => handleCreateEnTitleChange(e.target.value)}
                withAsterisk={createPageType === 'COMICS' && !createUrl.trim()}
              />
              <Input
                label="English Subtitle"
                placeholder="Subtitle in English"
                value={createContents.EN.subtitle}
                onChange={(e) =>
                  setCreateContents((prev) => ({
                    ...prev,
                    EN: { ...prev.EN, subtitle: e.target.value },
                  }))
                }
              />
            </>
          ) : (
            <>
              <Input
                label="Czech Title"
                placeholder="Název v češtině"
                value={createContents.CS.title}
                onChange={(e) =>
                  setCreateContents((prev) => ({
                    ...prev,
                    CS: { ...prev.CS, title: e.target.value },
                  }))
                }
              />
              <Input
                label="Czech Subtitle"
                placeholder="Podtitul v češtině"
                value={createContents.CS.subtitle}
                onChange={(e) =>
                  setCreateContents((prev) => ({
                    ...prev,
                    CS: { ...prev.CS, subtitle: e.target.value },
                  }))
                }
              />
            </>
          )}

          {/* URL Input */}
          <Input
            label="URL Path"
            description={
              createPageType === 'COMICS'
                ? 'Generated automatically from English title, but can be customized.'
                : 'Define static route path (e.g. /about)'
            }
            placeholder={createPageType === 'COMICS' ? '/my-comic' : '/about'}
            value={createUrl}
            onChange={(e) => {
              setCreateUrlManuallyEdited(true);
              setCreateUrl(e.target.value);
            }}
            required
            withAsterisk
          />

          {createError && <p className="mantine-input__error">{createError}</p>}

          <div className="pages-admin__modal-actions">
            <Button
              variant="default"
              onClick={() => setShowCreateModal(false)}
              disabled={createSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              color="blue"
              loading={createSubmitting}
              disabled={!createUrl.trim()}
            >
              Create Page
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discard Unsaved Changes Modal */}
      <Modal
        opened={showDiscardModal}
        onClose={() => {
          setShowDiscardModal(false);
          setPendingAction(null);
        }}
        title="Discard Unsaved Changes?"
        size="sm"
      >
        <p className="pages-admin__delete-modal-text">
          You have unsaved changes on the current page. If you leave now, your changes will be discarded.
        </p>
        <div className="pages-admin__modal-actions">
          <Button
            variant="default"
            onClick={() => {
              setShowDiscardModal(false);
              setPendingAction(null);
            }}
          >
            Keep Editing
          </Button>
          <Button
            variant="danger"
            color="red"
            onClick={handleDiscardAndProceed}
          >
            Discard Changes
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Page"
        size="sm"
      >
        <p className="pages-admin__delete-modal-text">
          Are you sure you want to delete this page (<strong>{selectedPage?.url}</strong>)? This action cannot be undone.
        </p>
        <div className="pages-admin__modal-actions">
          <Button
            variant="default"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            color="red"
            loading={deleting}
            onClick={handleDeletePage}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PagesAdmin;
