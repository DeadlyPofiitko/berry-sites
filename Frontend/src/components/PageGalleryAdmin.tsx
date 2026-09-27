// src/components/PageGalleryAdmin.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Modal, Badge, Input } from './ui';
import {
  PatternType,
  getPagePatterns,
  createPattern,
  changePatterns,
  deletePattern,
  getThumbnailUrl,
  getFullImageUrl,
  getAvailableQualities,
  type PatternDto,
  type PatternImageDto,
} from '../services/pattern';
import { getAllImages, type BackendImage } from '../services/image';
import { PageGallery } from './PageGallery';
import './PageGalleryAdmin.css';

interface PageGalleryAdminProps {
  pageId: string;
  pageTitle?: string;
}

// Icons
function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
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

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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

function ReplaceIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

export const PageGalleryAdmin: React.FC<PageGalleryAdminProps> = ({ pageId, pageTitle }) => {
  const [patterns, setPatterns] = useState<PatternDto[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');
  const [allImages, setAllImages] = useState<BackendImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');

  // Add Pattern Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatternType, setSelectedPatternType] = useState<PatternType>(PatternType.ROW);
  const [creatingPattern, setCreatingPattern] = useState(false);

  // Delete Pattern Modal
  const [patternToDelete, setPatternToDelete] = useState<PatternDto | null>(null);
  const [deletingPattern, setDeletingPattern] = useState(false);

  // Image Picker Modal
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{
    patternId: string;
    targetIndex: number;
    isReplace: boolean;
  } | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerFilter, setPickerFilter] = useState<'all' | 'landscape' | 'portrait'>('all');

  // Load patterns & uploaded images
  const loadData = useCallback(async () => {
    if (!pageId) return;
    setLoading(true);
    try {
      const [patternsData, imagesData] = await Promise.all([
        getPagePatterns(pageId),
        getAllImages(),
      ]);
      setPatterns(patternsData);
      setInitialSnapshot(JSON.stringify(patternsData));
      setAllImages(imagesData);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map image ID to BackendImage for name & quick access
  const imageMap = useMemo(() => {
    const map = new Map<string, BackendImage>();
    allImages.forEach((img) => map.set(img.id, img));
    return map;
  }, [allImages]);

  // Check unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(patterns) !== initialSnapshot;
  }, [patterns, initialSnapshot]);

  // Validate if patterns can be saved
  const validationError = useMemo(() => {
    for (let i = 0; i < patterns.length; i++) {
      const p = patterns[i];
      const isColumn =
        p.patternType === PatternType.COLUMN ||
        p.patternType === 1 ||
        p.patternType === 'COLUMN' ||
        p.patternType === 'Column';

      if (p.images.length > 3) {
        return `Row #${i + 1} has more than 3 images (maximum is 3).`;
      }
      if (isColumn && p.images.length !== 3) {
        return `Column Pattern (Row #${i + 1}) requires exactly 3 images (1 portrait and 2 landscape). Currently has ${p.images.length}.`;
      }
    }
    return null;
  }, [patterns]);

  // Add pattern handler
  const handleAddPattern = async () => {
    setCreatingPattern(true);
    try {
      const success = await createPattern(pageId, selectedPatternType);
      if (success) {
        setShowAddModal(false);
        await loadData();
      }
    } finally {
      setCreatingPattern(false);
    }
  };

  // Delete pattern handler
  const handleDeletePattern = async () => {
    if (!patternToDelete) return;
    setDeletingPattern(true);
    try {
      const success = await deletePattern(patternToDelete.id);
      if (success) {
        setPatternToDelete(null);
        await loadData();
      }
    } finally {
      setDeletingPattern(false);
    }
  };

  // Move pattern row up or down
  const movePatternRow = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= patterns.length) return;

    setPatterns((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[newIdx];
      next[newIdx] = temp;
      return next.map((p, idx) => ({ ...p, order: idx }));
    });
  };

  // Move image left or right within a pattern
  const moveImageInPattern = (patternId: string, imgIdx: number, direction: 'left' | 'right') => {
    setPatterns((prev) =>
      prev.map((p) => {
        if (p.id !== patternId) return p;
        const newIdx = direction === 'left' ? imgIdx - 1 : imgIdx + 1;
        if (newIdx < 0 || newIdx >= p.images.length) return p;

        const nextImages = [...p.images];
        const temp = nextImages[imgIdx];
        nextImages[imgIdx] = nextImages[newIdx];
        nextImages[newIdx] = temp;
        return {
          ...p,
          images: nextImages.map((img, i) => ({ ...img, order: i })),
        };
      })
    );
  };

  // Remove image from pattern
  const removeImageFromPattern = (patternId: string, imgIdx: number) => {
    setPatterns((prev) =>
      prev.map((p) => {
        if (p.id !== patternId) return p;
        const nextImages = p.images.filter((_, i) => i !== imgIdx);
        return {
          ...p,
          images: nextImages.map((img, i) => ({ ...img, order: i })),
        };
      })
    );
  };

  // Open image picker for a specific pattern slot
  const openImagePicker = (patternId: string, targetIndex: number, isReplace: boolean) => {
    setPickerTarget({ patternId, targetIndex, isReplace });
    setPickerSearch('');
    setPickerFilter('all');
    setShowPicker(true);
  };

  // Select image from picker
  const handleSelectImage = (image: BackendImage) => {
    if (!pickerTarget) return;
    const { patternId, targetIndex, isReplace } = pickerTarget;

    setPatterns((prev) =>
      prev.map((p) => {
        if (p.id !== patternId) return p;
        const newImg: PatternImageDto = {
          order: targetIndex,
          imageId: image.id,
          width: image.width,
          height: image.height,
        };

        let nextImages = [...p.images];
        if (isReplace && targetIndex < nextImages.length) {
          nextImages[targetIndex] = newImg;
        } else {
          // If inserting or appending
          if (targetIndex >= nextImages.length) {
            nextImages.push(newImg);
          } else {
            nextImages.splice(targetIndex, 0, newImg);
          }
        }

        return {
          ...p,
          images: nextImages.map((img, i) => ({ ...img, order: i })),
        };
      })
    );

    setShowPicker(false);
    setPickerTarget(null);
  };

  // Save all pattern orders and images to backend
  const handleSaveChanges = async () => {
    if (validationError) return;
    setSaving(true);
    try {
      const payload = patterns.map((p) => ({
        patternId: p.id,
        imageIdsOrder: p.images.map((img) => img.imageId),
      }));

      const success = await changePatterns(pageId, payload);
      if (success) {
        await loadData();
      }
    } finally {
      setSaving(false);
    }
  };

  // Discard local changes
  const handleDiscardChanges = () => {
    try {
      if (initialSnapshot) {
        setPatterns(JSON.parse(initialSnapshot));
      }
    } catch {}
  };

  // Filtered images for picker
  const filteredPickerImages = useMemo(() => {
    return allImages.filter((img) => {
      if (pickerSearch.trim()) {
        const query = pickerSearch.toLowerCase();
        if (!img.name.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (pickerFilter === 'landscape') {
        return img.width >= img.height;
      }
      if (pickerFilter === 'portrait') {
        return img.height > img.width;
      }
      return true;
    });
  }, [allImages, pickerSearch, pickerFilter]);

  // Render Slot Helper
  const renderPatternSlot = (
    pattern: PatternDto,
    img: PatternImageDto,
    slotIdx: number
  ) => {
    const fullImg = imageMap.get(img.imageId);
    const width = img.width || fullImg?.width || 0;
    const height = img.height || fullImg?.height || 0;
    const isPortrait = height > width;
    const qualities = getAvailableQualities(width, height);
    const thumbUrl = getThumbnailUrl(img.imageId, width, height, 'sm');
    const fileName = fullImg?.name || 'Image';

    return (
      <div key={`${img.imageId}-${slotIdx}`} className="page-gallery-admin__slot-card">
        <div className="page-gallery-admin__slot-thumb-container">
          <img
            src={thumbUrl}
            alt={fileName}
            className="page-gallery-admin__slot-thumb"
            loading="lazy"
          />
          <span className="page-gallery-admin__slot-order-pill">#{slotIdx + 1}</span>
        </div>

        <div className="page-gallery-admin__slot-body">
          <div className="page-gallery-admin__slot-title" title={fileName}>
            {fileName}
          </div>
          <div className="page-gallery-admin__slot-tags">
            <span className="page-gallery-admin__dim-tag">
              {width} × {height}
            </span>
            <span
              className={`page-gallery-admin__orient-tag ${isPortrait ? 'page-gallery-admin__orient-tag--portrait' : ''}`}
            >
              {isPortrait ? 'Portrait' : 'Landscape'}
            </span>
            <div className="page-gallery-admin__quality-badges">
              {qualities.map((q) => (
                <span key={q} className="page-gallery-admin__quality-badge">
                  {q.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="page-gallery-admin__slot-footer">
          <div className="page-gallery-admin__slot-arrows">
            <button
              type="button"
              className="page-gallery-admin__mini-btn"
              disabled={slotIdx === 0}
              onClick={() => moveImageInPattern(pattern.id, slotIdx, 'left')}
              title="Move image earlier"
            >
              <ArrowLeftIcon />
            </button>
            <button
              type="button"
              className="page-gallery-admin__mini-btn"
              disabled={slotIdx === pattern.images.length - 1}
              onClick={() => moveImageInPattern(pattern.id, slotIdx, 'right')}
              title="Move image later"
            >
              <ArrowRightIcon />
            </button>
          </div>

          <div className="page-gallery-admin__slot-actions">
            <button
              type="button"
              className="page-gallery-admin__action-btn"
              onClick={() => openImagePicker(pattern.id, slotIdx, true)}
              title="Replace with another image"
            >
              <ReplaceIcon /> Replace
            </button>
            <button
              type="button"
              className="page-gallery-admin__action-btn page-gallery-admin__action-btn--delete"
              onClick={() => removeImageFromPattern(pattern.id, slotIdx)}
              title="Remove from this pattern"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-gallery-admin">
      {/* Gallery Header / Toolbar */}
      <div className="page-gallery-admin__header">
        <div className="page-gallery-admin__title-group">
          <h2 className="page-gallery-admin__title">Page Gallery</h2>
          <Badge size="md" color="blue">
            {patterns.length} {patterns.length === 1 ? 'row' : 'rows'}
          </Badge>
        </div>

        <div className="page-gallery-admin__actions">
          {/* Tab Switcher: Builder vs Live Preview */}
          <div className="page-gallery-admin__tabs">
            <button
              type="button"
              className={`page-gallery-admin__tab ${activeTab === 'builder' ? 'page-gallery-admin__tab--active' : ''}`}
              onClick={() => setActiveTab('builder')}
            >
              <EditIcon /> Builder
            </button>
            <button
              type="button"
              className={`page-gallery-admin__tab ${activeTab === 'preview' ? 'page-gallery-admin__tab--active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <EyeIcon /> Live Preview
            </button>
          </div>

          <Button
            variant="filled"
            color="blue"
            size="sm"
            leftSection={<PlusIcon />}
            onClick={() => setShowAddModal(true)}
          >
            Add Pattern Row
          </Button>
        </div>
      </div>

      {/* Validation warning banner */}
      {validationError && (
        <div className="page-gallery-admin__warning-banner">
          <span>{validationError}</span>
        </div>
      )}

      {/* Main View Area */}
      {loading ? (
        <div className="page-gallery-admin__loading">
          <div className="page-gallery-admin__spinner" />
          <p>Loading page gallery patterns...</p>
        </div>
      ) : activeTab === 'preview' ? (
        /* LIVE PREVIEW TAB */
        <div className="page-gallery-admin__preview-container">
          <div className="page-gallery-admin__preview-banner">
            <span>Live Preview</span>
          </div>
          {patterns.length === 0 ? (
            <div className="page-gallery-admin__empty">
              <p>No pattern rows added to this gallery yet.</p>
            </div>
          ) : (
            <PageGallery patterns={patterns} />
          )}
        </div>
      ) : (
        /* BUILDER TAB */
        <div className="page-gallery-admin__builder">
          {patterns.length === 0 ? (
            <div className="page-gallery-admin__empty">
              <h3 className="page-gallery-admin__empty-title">Gallery is empty</h3>
              <p className="page-gallery-admin__empty-desc">
                Add your first pattern row to start composing the page gallery.
              </p>
              <Button
                variant="filled"
                color="blue"
                size="sm"
                leftSection={<PlusIcon />}
                onClick={() => setShowAddModal(true)}
              >
                Add Pattern Row
              </Button>
            </div>
          ) : (
            <div className="page-gallery-admin__stack">
              {patterns.map((pattern, pIdx) => {
                const isColumn =
                  pattern.patternType === PatternType.COLUMN ||
                  pattern.patternType === 1 ||
                  pattern.patternType === 'COLUMN' ||
                  pattern.patternType === 'Column';

                return (
                  <div key={pattern.id} className="page-gallery-admin__row-card">
                    {/* Row Header */}
                    <div className="page-gallery-admin__row-header">
                      <div className="page-gallery-admin__row-meta">
                        <span className="page-gallery-admin__row-number">#{pIdx + 1}</span>
                        <Badge size="sm" color="blue">
                          {isColumn
                            ? 'Column Pattern (3 images)'
                            : 'Row Pattern (1–3 Images)'}
                        </Badge>
                        <span className="page-gallery-admin__row-count">
                          {pattern.images.length}{' '}
                          {pattern.images.length === 1 ? 'image' : 'images'}
                          {isColumn && pattern.images.length !== 3 && ' (3 required)'}
                        </span>
                      </div>

                      <div className="page-gallery-admin__row-controls">
                        {/* Move Up / Down */}
                        <button
                          type="button"
                          className="page-gallery-admin__ctrl-btn"
                          disabled={pIdx === 0}
                          onClick={() => movePatternRow(pIdx, 'up')}
                          title="Move row up"
                        >
                          <ArrowUpIcon />
                        </button>
                        <button
                          type="button"
                          className="page-gallery-admin__ctrl-btn"
                          disabled={pIdx === patterns.length - 1}
                          onClick={() => movePatternRow(pIdx, 'down')}
                          title="Move row down"
                        >
                          <ArrowDownIcon />
                        </button>
                        {/* Delete Row */}
                        <button
                          type="button"
                          className="page-gallery-admin__ctrl-btn page-gallery-admin__ctrl-btn--danger"
                          onClick={() => setPatternToDelete(pattern)}
                          title="Delete pattern row"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>

                    <div className="page-gallery-admin__slots-container">
                        <div className="page-gallery-admin__row-slots">
                          {pattern.images.map((img, imgIdx) =>
                            renderPatternSlot(pattern, img, imgIdx)
                          )}

                          {pattern.images.length < 3 && (
                            <button
                              type="button"
                              className="page-gallery-admin__empty-slot page-gallery-admin__empty-slot--add-row"
                              onClick={() =>
                                openImagePicker(pattern.id, pattern.images.length, false)
                              }
                            >
                              <PlusIcon />
                              <span>Add Image ({pattern.images.length + 1}/3)</span>
                            </button>
                          )}
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="page-gallery-admin__footer">
            <div className="page-gallery-admin__footer-left">
              {hasUnsavedChanges && (
                <span className="page-gallery-admin__unsaved-indicator">
                  ● Unsaved gallery changes
                </span>
              )}
            </div>

            <div className="page-gallery-admin__footer-actions">
              {hasUnsavedChanges && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDiscardChanges}
                  disabled={saving}
                >
                  Discard Changes
                </Button>
              )}

              <Button
                variant="filled"
                color="blue"
                size="sm"
                leftSection={<SaveIcon />}
                loading={saving}
                disabled={!hasUnsavedChanges || Boolean(validationError)}
                onClick={handleSaveChanges}
              >
                Save Gallery
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD PATTERN MODAL
         ======================================================== */}
      <Modal
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Pattern Row to Gallery"
        size="md"
      >
        <div className="page-gallery-admin__modal-content">
          <p className="page-gallery-admin__modal-desc">
            Select the layout pattern for this new row in the page gallery:
          </p>

          <div className="page-gallery-admin__pattern-choices">
            {/* Option 1: ROW */}
            <div
              className={`page-gallery-admin__choice-card ${selectedPatternType === PatternType.ROW ? 'page-gallery-admin__choice-card--selected' : ''}`}
              onClick={() => setSelectedPatternType(PatternType.ROW)}
            >
              <div className="page-gallery-admin__choice-preview page-gallery-admin__choice-preview--row">
                <div className="page-gallery-admin__preview-box" />
                <div className="page-gallery-admin__preview-box" />
                <div className="page-gallery-admin__preview-box" />
              </div>
              <div className="page-gallery-admin__choice-info">
                <div className="page-gallery-admin__choice-title">
                  <span>Row Pattern</span>
                  <Badge size="xs" color="blue">
                    1–3 Images
                  </Badge>
                </div>
                <div className="page-gallery-admin__choice-text">
                  Images placed side by side in a row. Automatically matches height while preserving natural aspect ratios.
                </div>
              </div>
            </div>

            {/* Option 2: COLUMN */}
            <div
              className={`page-gallery-admin__choice-card ${selectedPatternType === PatternType.COLUMN ? 'page-gallery-admin__choice-card--selected' : ''}`}
              onClick={() => setSelectedPatternType(PatternType.COLUMN)}
            >
              <div className="page-gallery-admin__choice-preview page-gallery-admin__choice-preview--column">
                <div className="page-gallery-admin__preview-box" />
                <div className="page-gallery-admin__preview-stacked">
                  <div className="page-gallery-admin__preview-box" />
                  <div className="page-gallery-admin__preview-box" />
                </div>
              </div>
              <div className="page-gallery-admin__choice-info">
                <div className="page-gallery-admin__choice-title">
                  <span>Column Pattern</span>
                  <Badge size="xs" color="blue">
                    3 Images Required
                  </Badge>
                </div>
                <div className="page-gallery-admin__choice-text">
                  One portrait-oriented image on one side, and two stacked landscape images on the other side.
                </div>
              </div>
            </div>
          </div>

          <div className="page-gallery-admin__modal-actions">
            <Button
              variant="default"
              onClick={() => setShowAddModal(false)}
              disabled={creatingPattern}
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="blue"
              loading={creatingPattern}
              onClick={handleAddPattern}
            >
              Add Row
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================
          DELETE PATTERN CONFIRMATION MODAL
         ======================================================== */}
      <Modal
        opened={Boolean(patternToDelete)}
        onClose={() => setPatternToDelete(null)}
        title="Delete Pattern Row"
        size="sm"
      >
        <div className="page-gallery-admin__modal-content">
          <p className="page-gallery-admin__modal-desc">
            Are you sure you want to delete this pattern row? Any images assigned to this row will be unlinked (the original files remain in your image library).
          </p>
          <div className="page-gallery-admin__modal-actions">
            <Button
              variant="default"
              onClick={() => setPatternToDelete(null)}
              disabled={deletingPattern}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              color="red"
              loading={deletingPattern}
              onClick={handleDeletePattern}
            >
              Delete Row
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================
          IMAGE PICKER MODAL
         ======================================================== */}
      <Modal
        opened={showPicker}
        onClose={() => setShowPicker(false)}
        title="Select Image from Library"
        size="xl"
      >
        <div className="page-gallery-admin__picker">
          {/* Picker Controls Bar */}
          <div className="page-gallery-admin__picker-bar">
            <Input
              placeholder="Search uploaded images by name..."
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              className="page-gallery-admin__picker-search"
            />

            <div className="page-gallery-admin__picker-filters">
              <button
                type="button"
                className={`page-gallery-admin__filter-btn ${pickerFilter === 'all' ? 'page-gallery-admin__filter-btn--active' : ''}`}
                onClick={() => setPickerFilter('all')}
              >
                All ({allImages.length})
              </button>
              <button
                type="button"
                className={`page-gallery-admin__filter-btn ${pickerFilter === 'landscape' ? 'page-gallery-admin__filter-btn--active' : ''}`}
                onClick={() => setPickerFilter('landscape')}
              >
                Landscape
              </button>
              <button
                type="button"
                className={`page-gallery-admin__filter-btn ${pickerFilter === 'portrait' ? 'page-gallery-admin__filter-btn--active' : ''}`}
                onClick={() => setPickerFilter('portrait')}
              >
                Portrait
              </button>
            </div>
          </div>

          {/* Image Grid */}
          <div className="page-gallery-admin__picker-grid">
            {filteredPickerImages.length === 0 ? (
              <div className="page-gallery-admin__picker-empty">
                <p>No matching images found.</p>
              </div>
            ) : (
              filteredPickerImages.map((img) => {
                const isPortrait = img.height > img.width;
                const qualities = getAvailableQualities(img.width, img.height);
                const thumb = getThumbnailUrl(img.id, img.width, img.height, 'sm');

                return (
                  <div
                    key={img.id}
                    className="page-gallery-admin__picker-card"
                    onClick={() => handleSelectImage(img)}
                    title={`Click to select: ${img.name}`}
                  >
                    <div className="page-gallery-admin__picker-thumb-wrapper">
                      <img
                        src={thumb}
                        alt={img.name}
                        className="page-gallery-admin__picker-thumb"
                        loading="lazy"
                      />
                      <span className="page-gallery-admin__picker-orient">
                        {isPortrait ? 'Portrait' : 'Landscape'}
                      </span>
                    </div>

                    <div className="page-gallery-admin__picker-info">
                      <span className="page-gallery-admin__picker-name" title={img.name}>
                        {img.name}
                      </span>
                      <div className="page-gallery-admin__picker-meta">
                        <span>
                          {img.width} × {img.height}
                        </span>
                        <div className="page-gallery-admin__quality-badges">
                          {qualities.map((q) => (
                            <span key={q} className="page-gallery-admin__quality-badge">
                              {q.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PageGalleryAdmin;
