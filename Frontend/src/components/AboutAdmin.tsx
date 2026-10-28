// src/components/AboutAdmin.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Button, Input, Badge } from './ui';
import {
  getOrCreateAboutSection,
  updateSectionContent,
  parseAboutJson,
  normalizeLanguage,
  type AboutSectionData,
  type AboutBlock,
  type AboutBlockType,
} from '../services/content';
import { notifyError, notifySuccess } from '../stores/notification';
import { RichTextEditor } from './RichTextEditor';
import { ImageSelectorModal } from './ImageSelectorModal';
import './AboutAdmin.css';

function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function TypeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

export const AboutAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Content IDs from backend SectionContent
  const [enContentId, setEnContentId] = useState<string | null>(null);
  const [csContentId, setCsContentId] = useState<string | null>(null);

  // Form State
  const [enData, setEnData] = useState<AboutSectionData>({ title: '', blocks: [] });
  const [csData, setCsData] = useState<AboutSectionData>({ title: '', blocks: [] });

  // Active language tab
  const [activeTab, setActiveTab] = useState<'EN' | 'CS'>('EN');

  // Track which image block is opening the ImageSelectorModal
  const [activeImageBlockId, setActiveImageBlockId] = useState<string | null>(null);

  // Initial snapshot to track unsaved changes
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAbout() {
      setLoading(true);
      try {
        const section = await getOrCreateAboutSection();
        if (!section || !isMounted) return;

        const enContent = section.contents?.find((c) => normalizeLanguage(c.language) === 'EN');
        const csContent = section.contents?.find((c) => normalizeLanguage(c.language) === 'CS');

        let loadedEn: AboutSectionData = { title: '', blocks: [] };
        let loadedCs: AboutSectionData = { title: '', blocks: [] };

        if (enContent) {
          setEnContentId(enContent.id);
          loadedEn = parseAboutJson(enContent.json);
          setEnData(loadedEn);
        }

        if (csContent) {
          setCsContentId(csContent.id);
          loadedCs = parseAboutJson(csContent.json);
          setCsData(loadedCs);
        }

        setInitialSnapshot(JSON.stringify({ en: loadedEn, cs: loadedCs }));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAbout();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute changes snapshot
  const currentSnapshot = useMemo(() => {
    return JSON.stringify({ en: enData, cs: csData });
  }, [enData, csData]);

  const hasChanges = initialSnapshot !== null && currentSnapshot !== initialSnapshot;

  const activeData = activeTab === 'EN' ? enData : csData;

  const setActiveData = (updater: (prev: AboutSectionData) => AboutSectionData) => {
    if (activeTab === 'EN') {
      setEnData(updater);
    } else {
      setCsData(updater);
    }
  };

  const updateTitle = (val: string) => {
    setActiveData((prev) => ({ ...prev, title: val }));
  };

  // Block management
  const addBlock = (type: AboutBlockType) => {
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 9);

    const newBlock: AboutBlock =
      type === 'content'
        ? { id: newId, type: 'content', content: '' }
        : { id: newId, type: 'image', image: '' };

    setActiveData((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
  };

  const removeBlock = (blockId: string) => {
    setActiveData((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== blockId),
    }));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setActiveData((prev) => {
      if (targetIndex < 0 || targetIndex >= prev.blocks.length) return prev;
      const updated = [...prev.blocks];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, blocks: updated };
    });
  };

  const updateBlock = (blockId: string, updates: Partial<AboutBlock>) => {
    setActiveData((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === blockId ? ({ ...b, ...updates } as AboutBlock) : b)),
    }));
  };

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
          content: JSON.stringify(enData),
        });
      }

      if (csContentId) {
        payloads.push({
          id: csContentId,
          content: JSON.stringify(csData),
        });
      }

      const success = await updateSectionContent(payloads);
      if (success) {
        setInitialSnapshot(currentSnapshot);
        notifySuccess('About section saved successfully');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="about-admin">
        <div className="about-admin__empty-image">Loading About section...</div>
      </div>
    );
  }

  return (
    <div className="about-admin">
      {/* Header */}
      <div className="about-admin__header">
        <div className="about-admin__title-group">
          <h1 className="about-admin__title">About Section</h1>
          {hasChanges && <Badge color="orange">Unsaved changes</Badge>}
        </div>

        <Button
          variant="filled"
          color="blue"
          leftSection={<SaveIcon />}
          loading={saving}
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </div>

      {/* Language Switcher */}
      <div className="about-admin__tabs">
        <button
          type="button"
          className={`about-admin__tab ${activeTab === 'EN' ? 'about-admin__tab--active' : ''}`}
          onClick={() => setActiveTab('EN')}
        >
          English {enData.title || enData.blocks.length > 0 ? '✓' : ''}
        </button>
        <button
          type="button"
          className={`about-admin__tab ${activeTab === 'CS' ? 'about-admin__tab--active' : ''}`}
          onClick={() => setActiveTab('CS')}
        >
          Czech {csData.title || csData.blocks.length > 0 ? '✓' : ''}
        </button>
      </div>

      {/* Title Field */}
      <div className="about-admin__field">
        <label className="about-admin__label">Title</label>
        <Input
          value={activeData.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="e.g. Karolína Stella Zímová"
        />
      </div>

      {/* Blocks Section Header */}
      <div className="about-admin__blocks-header">
        <div className="about-admin__blocks-title-group">
          <label className="about-admin__label" style={{ marginBottom: 0 }}>
            Content Blocks
          </label>
          <Badge variant="light" color="blue" size="sm">
            {activeData.blocks.length} {activeData.blocks.length === 1 ? 'block' : 'blocks'}
          </Badge>
        </div>

        <div className="about-admin__blocks-quick-actions">
          <Button
            variant="light"
            color="blue"
            size="xs"
            leftSection={<TypeIcon />}
            onClick={() => addBlock('content')}
          >
            Add Text
          </Button>
          <Button
            variant="light"
            color="blue"
            size="xs"
            leftSection={<ImageIcon />}
            onClick={() => addBlock('image')}
          >
            Add Image
          </Button>
        </div>
      </div>

      {/* Blocks List */}
      <div className="about-admin__blocks-list">
        {activeData.blocks.length === 0 ? (
          <div className="about-admin__empty-blocks">
            <p>No content blocks added yet for this language.</p>
            <div className="about-admin__empty-actions">
              <Button
                variant="light"
                color="blue"
                size="sm"
                leftSection={<TypeIcon />}
                onClick={() => addBlock('content')}
              >
                Add First Text Block
              </Button>
              <Button
                variant="light"
                color="blue"
                size="sm"
                leftSection={<ImageIcon />}
                onClick={() => addBlock('image')}
              >
                Add First Image Block
              </Button>
            </div>
          </div>
        ) : (
          activeData.blocks.map((block, index) => (
            <div key={block.id} className="about-admin__block-card">
              {/* Card Header with reordering and delete */}
              <div className="about-admin__block-header">
                <div className="about-admin__block-header-left">
                  {/* Reorder Buttons */}
                  <div className="about-admin__order-btns">
                    <button
                      type="button"
                      className="about-admin__icon-btn"
                      onClick={() => moveBlock(index, 'up')}
                      disabled={index === 0}
                      title="Move Up"
                    >
                      <ArrowUpIcon />
                    </button>
                    <button
                      type="button"
                      className="about-admin__icon-btn"
                      onClick={() => moveBlock(index, 'down')}
                      disabled={index === activeData.blocks.length - 1}
                      title="Move Down"
                    >
                      <ArrowDownIcon />
                    </button>
                  </div>

                  {/* Block Type Badge */}
                  <div className="about-admin__block-badge">
                    {block.type === 'content' ? (
                      <>
                        <TypeIcon />
                        <span>Text Block #{index + 1}</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon />
                        <span>Image Block #{index + 1}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Remove Block */}
                <button
                  type="button"
                  className="about-admin__delete-btn"
                  onClick={() => removeBlock(block.id)}
                  title="Delete Block"
                >
                  <TrashIcon />
                </button>
              </div>

              {/* Card Body */}
              <div className="about-admin__block-body">
                {block.type === 'content' ? (
                  <RichTextEditor
                    content={block.content}
                    onChange={(html) => updateBlock(block.id, { content: html })}
                  />
                ) : (
                  <div className="about-admin__image-card">
                    {block.image ? (
                      <>
                        <div className="about-admin__image-preview-wrapper">
                          <img
                            src={
                              block.image?.includes('/uploads/full/')
                                ? block.image.replace('/uploads/full/', '/uploads/thumbs/').replace('_full.webp', '_md.webp')
                                : block.image
                            }
                            alt="About image"
                            className="about-admin__image-preview"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src.includes('_md.webp')) {
                                target.src = target.src.replace('_md.webp', '_sm.webp');
                              }
                            }}
                          />
                        </div>
                        {/* <div className="about-admin__image-url">{block.image}</div> */}
                        <div className="about-admin__image-actions">
                          <Button
                            variant="light"
                            color="blue"
                            size="sm"
                            leftSection={<ImageIcon />}
                            onClick={() => setActiveImageBlockId(block.id)}
                          >
                            Change Image
                          </Button>
                          <Button
                            variant="light"
                            color="red"
                            size="sm"
                            leftSection={<TrashIcon />}
                            onClick={() => updateBlock(block.id, { image: '' })}
                          >
                            Remove
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="about-admin__empty-image">
                        <p style={{ margin: '0 0 12px 0' }}>No image selected</p>
                        <Button
                          variant="light"
                          color="blue"
                          size="sm"
                          leftSection={<ImageIcon />}
                          onClick={() => setActiveImageBlockId(block.id)}
                        >
                          Select from Image Gallery
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Add Bar */}
      {activeData.blocks.length > 0 && (
        <div className="about-admin__bottom-add">
          <Button
            variant="light"
            color="blue"
            size="sm"
            leftSection={<PlusIcon />}
            onClick={() => addBlock('content')}
          >
            Add Text Block
          </Button>
          <Button
            variant="light"
            color="blue"
            size="sm"
            leftSection={<PlusIcon />}
            onClick={() => addBlock('image')}
          >
            Add Image Block
          </Button>
        </div>
      )}

      {/* Image Selector Modal */}
      <ImageSelectorModal
        opened={activeImageBlockId !== null}
        onClose={() => setActiveImageBlockId(null)}
        onSelectImage={(url) => {
          if (activeImageBlockId) {
            updateBlock(activeImageBlockId, { image: url });
            setActiveImageBlockId(null);
          }
        }}
        title="Select About Image"
      />
    </div>
  );
};

export default AboutAdmin;
