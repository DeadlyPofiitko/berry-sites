// src/components/ImagesGallery.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import { Button, Modal, Badge } from './ui';
import { getAllImages, deleteImage as deleteImageService, type BackendImage } from '../services/image';
import './ImagesGallery.css';

export interface ImagesGalleryProps {
  refreshSignal?: number;
  onImagesChange?: (images: BackendImage[]) => void;
  onUploadClick?: () => void;
  className?: string;
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

function ImageIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export const ImagesGallery: React.FC<ImagesGalleryProps> = ({
  refreshSignal = 0,
  onImagesChange,
  onUploadClick,
  className = '',
}) => {
  const [images, setImages] = useState<BackendImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageToDelete, setImageToDelete] = useState<BackendImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const galleryContainerId = 'photoswipe-images-gallery-grid';
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null);

  // Load all images from API
  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllImages();
      setImages(data);
      onImagesChange?.(data);
    } catch {
      // Handled in service with toast
    } finally {
      setLoading(false);
    }
  }, [onImagesChange]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages, refreshSignal]);

  // Initialize PhotoSwipe Lightbox
  useEffect(() => {
    if (images.length === 0) return;

    const lightbox = new PhotoSwipeLightbox({
      gallery: `#${galleryContainerId}`,
      children: 'a.images-gallery__card-link',
      pswpModule: () => import('photoswipe'),
      showHideAnimationType: 'zoom',
    });

    lightbox.init();
    lightboxRef.current = lightbox;

    return () => {
      lightbox.destroy();
      lightboxRef.current = null;
    };
  }, [images]);

  // Handle image deletion confirmation
  const handleConfirmDelete = async () => {
    if (!imageToDelete || deleting) return;

    setDeleting(true);
    try {
      const success = await deleteImageService(imageToDelete.id);
      if (success) {
        setImages((prev) => {
          const updated = prev.filter((img) => img.id !== imageToDelete.id);
          onImagesChange?.(updated);
          return updated;
        });
        setImageToDelete(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`images-gallery ${className}`.trim()}>
      {/* Gallery Toolbar / Info */}
      <div className="images-gallery__toolbar">
        <div className="images-gallery__toolbar-info">
          <span className="images-gallery__count">
            {loading ? 'Loading images...' : `${images.length} ${images.length === 1 ? 'image' : 'images'}`}
          </span>
        </div>

        <div className="images-gallery__toolbar-actions">
          <Button
            variant="default"
            size="xs"
            leftSection={<RefreshIcon />}
            onClick={fetchImages}
            disabled={loading}
            title="Refresh images list"
          >
            Refresh
          </Button>
          {/* {onUploadClick && (
            <Button
              variant="filled"
              color="blue"
              size="xs"
              leftSection={<PlusIcon />}
              onClick={onUploadClick}
            >
              Upload
            </Button>
          )} */}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loading ? (
        <div className="images-gallery__grid images-gallery__grid--loading">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="images-gallery__skeleton-card" />
          ))}
        </div>
      ) : images.length === 0 ? (
        /* Empty State */
        <div className="images-gallery__empty">
          <div className="images-gallery__empty-icon">
            <ImageIcon />
          </div>
          <h3 className="images-gallery__empty-title">No images uploaded yet</h3>
          <p className="images-gallery__empty-desc">
            Upload PNG images individually or in batches to view them here.
          </p>
          {onUploadClick && (
            <Button
              variant="filled"
              color="blue"
              size="sm"
              leftSection={<PlusIcon />}
              onClick={onUploadClick}
            >
              Upload Images
            </Button>
          )}
        </div>
      ) : (
        /* PhotoSwipe Grid */
        <div id={galleryContainerId} className="images-gallery__grid">
          {images.map((img) => (
            <div key={img.id} className="images-gallery__card">
              {/* PhotoSwipe Link with Full Image Target */}
              <a
                href={img.fullUrl}
                data-pswp-width={img.width > 0 ? img.width : 1920}
                data-pswp-height={img.height > 0 ? img.height : 1080}
                target="_blank"
                rel="noreferrer"
                className="images-gallery__card-link"
                title={`Click to preview full size: ${img.name}`}
              >
                <div className="images-gallery__thumb-wrapper">
                  <img
                    src={img.thumbnailUrl}
                    alt={img.name}
                    className="images-gallery__thumb"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to fullUrl if thumbnail not ready
                      const target = e.currentTarget;
                      if (target.src !== img.fullUrl) {
                        target.src = img.fullUrl;
                      }
                    }}
                  />
                </div>

                {/* Info Overlay on Hover */}
                <div className="images-gallery__overlay">
                  <div className="images-gallery__overlay-header">
                    <span className="images-gallery__image-name" title={img.name}>
                      {img.name}
                    </span>
                  </div>
                  <div className="images-gallery__overlay-meta">
                    {img.width > 0 && img.height > 0 && (
                      <span className="images-gallery__dim-badge">
                        {img.width} × {img.height}
                      </span>
                    )}
                  </div>
                </div>
              </a>

              {/* Delete Button in Right Bottom Corner */}
              <button
                type="button"
                className="images-gallery__delete-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImageToDelete(img);
                }}
                title={`Delete ${img.name}`}
                aria-label={`Delete ${img.name}`}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        opened={Boolean(imageToDelete)}
        onClose={() => !deleting && setImageToDelete(null)}
        title="Delete Image"
        size="sm"
      >
        {imageToDelete && (
          <div className="images-gallery__delete-modal">
            <div className="images-gallery__delete-preview">
              <img
                src={imageToDelete.thumbnailUrl}
                alt={imageToDelete.name}
                className="images-gallery__delete-preview-thumb"
              />
              <div className="images-gallery__delete-preview-info">
                <span className="images-gallery__delete-filename" title={imageToDelete.name}>
                  {imageToDelete.name}
                </span>
                {imageToDelete.width > 0 && imageToDelete.height > 0 && (
                  <span className="images-gallery__delete-sub">
                    {imageToDelete.width} × {imageToDelete.height} px
                  </span>
                )}
              </div>
            </div>

            <div className="images-gallery__delete-alert">
              <span className="images-gallery__delete-alert-icon">
                <AlertTriangleIcon />
              </span>
              <p className="images-gallery__delete-alert-text">
                Are you sure you want to delete this image? This action will permanently remove it from storage and cannot be undone.
              </p>
            </div>

            <div className="images-gallery__delete-actions">
              <Button
                variant="default"
                size="sm"
                disabled={deleting}
                onClick={() => setImageToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="filled"
                color="red"
                size="sm"
                loading={deleting}
                onClick={handleConfirmDelete}
              >
                Delete Image
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ImagesGallery;
