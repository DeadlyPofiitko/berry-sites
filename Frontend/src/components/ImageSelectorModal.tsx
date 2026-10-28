// src/components/ImageSelectorModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Input } from './ui';
import { getAllImages, type BackendImage } from '../services/image';
import { getThumbnailUrl, getFullImageUrl } from '../services/pattern';
import { UploadImage } from './UploadImage';
import './ImageSelectorModal.css';

export interface ImageSelectorModalProps {
  opened: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, image: BackendImage) => void;
  title?: string;
}

function UploadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export const ImageSelectorModal: React.FC<ImageSelectorModalProps> = ({
  opened,
  onClose,
  onSelectImage,
  title = 'Select Image from Library',
}) => {
  const [images, setImages] = useState<BackendImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'landscape' | 'portrait'>('all');
  const [tab, setTab] = useState<'library' | 'upload'>('library');

  const loadImages = async () => {
    setLoading(true);
    try {
      const data = await getAllImages();
      setImages(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (opened) {
      loadImages();
      setTab('library');
      setSearch('');
    }
  }, [opened]);

  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        if (!img.name.toLowerCase().includes(query)) return false;
      }
      if (filter === 'landscape' && img.height >= img.width) return false;
      if (filter === 'portrait' && img.height <= img.width) return false;
      return true;
    });
  }, [images, search, filter]);

  const handleSelect = (img: BackendImage) => {
    const previewUrl = getThumbnailUrl(img.id, img.width, img.height, 'md');
    onSelectImage(previewUrl, img);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="lg">
      {tab === 'library' ? (
        <>
          <div className="image-selector__header">
            <div className="image-selector__controls">
              <div className="image-selector__search">
                <Input
                  placeholder="Search images by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                variant="light"
                color="blue"
                size="sm"
                leftSection={<UploadIcon />}
                onClick={() => setTab('upload')}
              >
                Upload
              </Button>
            </div>

            <div className="image-selector__filters">
              <button
                type="button"
                className={`image-selector__filter-btn ${filter === 'all' ? 'image-selector__filter-btn--active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({images.length})
              </button>
              <button
                type="button"
                className={`image-selector__filter-btn ${filter === 'landscape' ? 'image-selector__filter-btn--active' : ''}`}
                onClick={() => setFilter('landscape')}
              >
                Landscape
              </button>
              <button
                type="button"
                className={`image-selector__filter-btn ${filter === 'portrait' ? 'image-selector__filter-btn--active' : ''}`}
                onClick={() => setFilter('portrait')}
              >
                Portrait
              </button>
            </div>
          </div>

          <div className="image-selector__grid">
            {loading ? (
              <div className="image-selector__empty">Loading image library...</div>
            ) : filteredImages.length === 0 ? (
              <div className="image-selector__empty">
                <p>No matching images found.</p>
                <Button
                  variant="light"
                  color="blue"
                  size="xs"
                  leftSection={<UploadIcon />}
                  onClick={() => setTab('upload')}
                  style={{ marginTop: '10px' }}
                >
                  Upload New Image
                </Button>
              </div>
            ) : (
              filteredImages.map((img) => {
                const isPortrait = img.height > img.width;
                const thumb = getThumbnailUrl(img.id, img.width, img.height, 'sm');

                return (
                  <div
                    key={img.id}
                    className="image-selector__card"
                    onClick={() => handleSelect(img)}
                    title={`Click to select: ${img.name}`}
                  >
                    <div className="image-selector__thumb-wrapper">
                      <img
                        src={thumb}
                        alt={img.name}
                        className="image-selector__thumb"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const full = getFullImageUrl(img.id);
                          if (target.src !== full) target.src = full;
                        }}
                      />
                      <span className="image-selector__orient">
                        {isPortrait ? 'Portrait' : 'Landscape'}
                      </span>
                    </div>

                    <div className="image-selector__info">
                      <span className="image-selector__name" title={img.name}>
                        {img.name}
                      </span>
                      <div className="image-selector__meta">
                        <span>{img.width} × {img.height}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="image-selector__upload-container">
          <UploadImage
            embedded
            onSuccess={async () => {
              await loadImages();
              setTab('library');
            }}
            onCancel={() => setTab('library')}
          />
        </div>
      )}
    </Modal>
  );
};

export default ImageSelectorModal;
