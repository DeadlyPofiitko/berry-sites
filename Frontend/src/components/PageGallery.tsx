// src/components/PageGallery.tsx
import React, { useEffect, useRef, useId } from 'react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import {
  PatternType,
  getThumbnailUrl,
  getFullImageUrl,
  getImageSrcSet,
  type PatternDto,
  type PatternImageDto,
} from '../services/pattern';
import './PageGallery.css';

export interface PageGalleryProps {
  patterns: PatternDto[];
  className?: string;
}

export const PageGallery: React.FC<PageGalleryProps> = ({ patterns, className = '' }) => {
  const rawId = useId();
  const galleryId = `page-gallery-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null);

  useEffect(() => {
    if (!patterns || patterns.length === 0) return;

    const lightbox = new PhotoSwipeLightbox({
      gallery: `#${galleryId}`,
      children: 'a.page-gallery__item-link',
      pswpModule: () => import('photoswipe'),
      showHideAnimationType: 'zoom',
    });

    lightbox.init();
    lightboxRef.current = lightbox;

    return () => {
      lightbox.destroy();
      lightboxRef.current = null;
    };
  }, [patterns, galleryId]);

  if (!patterns || patterns.length === 0) {
    return null;
  }

  // Normalize pattern to standard format
  const normalizePattern = (p: PatternDto): PatternDto => {
    const rawType = p.patternType ?? (p as any).PatternType;
    let patternType: PatternType = PatternType.ROW;
    if (rawType === PatternType.COLUMN || rawType === 1 || rawType === 'COLUMN' || rawType === 'Column') {
      patternType = PatternType.COLUMN;
    }

    const rawImages = p.images || (p as any).Images || [];
    const images: PatternImageDto[] = rawImages.map((img: any) => ({
      order: img.order ?? img.Order ?? 0,
      imageId: img.imageId || img.ImageId,
      width: img.width ?? img.Width ?? 1200,
      height: img.height ?? img.Height ?? 800,
    })).sort((a: any, b: any) => a.order - b.order);

    return {
      id: p.id || (p as any).Id || String(Math.random()),
      order: p.order ?? (p as any).Order ?? 0,
      patternType,
      images,
    };
  };

  // Render a single image item
  const renderImageItem = (
    img: PatternImageDto,
    containerStyle: React.CSSProperties = {},
    itemClass: string = ''
  ) => {
    const width = img.width || 1200;
    const height = img.height || 800;
    const fullUrl = getFullImageUrl(img.imageId);
    const thumbUrl = getThumbnailUrl(img.imageId, width, height, 'md');
    const srcSet = getImageSrcSet(img.imageId, width, height);

    return (
      <div
        key={`${img.imageId}-${img.order}`}
        className={`page-gallery__item ${itemClass}`}
        style={{
          aspectRatio: `${width} / ${height}`,
          ...containerStyle,
        }}
      >
        <a
          href={fullUrl}
          data-pswp-width={width}
          data-pswp-height={height}
          target="_blank"
          rel="noreferrer"
          className="page-gallery__item-link"
          title="Click to zoom image"
        >
          <img
            src={thumbUrl}
            srcSet={srcSet || undefined}
            sizes="(max-width: 768px) 100vw, 50vw"
            alt=""
            loading="lazy"
            className="page-gallery__img"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== fullUrl) {
                target.src = fullUrl;
              }
            }}
          />
          <div className="page-gallery__item-hover">
            <svg
              className="page-gallery__zoom-icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
        </a>
      </div>
    );
  };

  // Render a ROW pattern (1, 2, or 3 images side by side)
  const renderRowPattern = (pattern: PatternDto) => {
    const normalized = normalizePattern(pattern);
    const images = normalized.images;
    if (images.length === 0) return null;

    return (
      <div key={normalized.id} className="page-gallery__row-pattern">
        {images.map((img) => {
          const width = img.width || 1200;
          const height = img.height || 800;
          const ratio = width / height;

          return renderImageItem(
            img,
            {
              flex: `${ratio} ${ratio} 0%`,
              minWidth: 0,
            },
            'page-gallery__item--row'
          );
        })}
      </div>
    );
  };

  // Render a COLUMN pattern (1 portrait on one side, 2 landscapes stacked on the other)
  const renderColumnPattern = (pattern: PatternDto) => {
    const normalized = normalizePattern(pattern);
    const images = normalized.images;
    if (images.length === 0) return null;

    // If less than 3 images, fallback to row rendering
    if (images.length < 3) {
      return renderRowPattern(pattern);
    }

    // Determine which image is the portrait image
    // Find index of image with smallest aspect ratio (most portrait-oriented)
    let portraitIdx = 0;
    let minRatio = Infinity;
    images.forEach((img, idx) => {
      const r = (img.width || 1) / (img.height || 1);
      if (r < minRatio) {
        minRatio = r;
        portraitIdx = idx;
      }
    });

    // If portrait is at the end (index 2), place portrait on the right; otherwise on the left
    const portraitOnRight = portraitIdx === 2;
    const portraitImg = images[portraitIdx];
    const landscapeImgs = images.filter((_, idx) => idx !== portraitIdx);

    const rp = (portraitImg.width || 1200) / (portraitImg.height || 1800);
    const r1 = (landscapeImgs[0]?.width || 1800) / (landscapeImgs[0]?.height || 1200);
    const r2 = (landscapeImgs[1]?.width || 1800) / (landscapeImgs[1]?.height || 1200);

    // K is the proportional width of the portrait column relative to the stacked landscape column
    // Stack height = W_L * (1/r1 + 1/r2). Portrait height = W_P / rp.
    // For heights to match: W_P / W_L = rp * (1/r1 + 1/r2).
    const K = rp * (1 / r1 + 1 / r2);
    const gridTemplate = portraitOnRight ? `1fr ${K}fr` : `${K}fr 1fr`;

    return (
      <div
        key={pattern.order}
        className={`page-gallery__column-pattern ${portraitOnRight ? 'page-gallery__column-pattern--right' : 'page-gallery__column-pattern--left'}`}
        style={{
          gridTemplateColumns: gridTemplate,
        }}
      >
        {!portraitOnRight ? (
          <>
            <div className="page-gallery__col-portrait">
              {renderImageItem(portraitImg, { width: '100%' }, 'page-gallery__item--portrait')}
            </div>
            <div className="page-gallery__col-stacked">
              {landscapeImgs.map((img) =>
                renderImageItem(img, { width: '100%' }, 'page-gallery__item--landscape')
              )}
            </div>
          </>
        ) : (
          <>
            <div className="page-gallery__col-stacked">
              {landscapeImgs.map((img) =>
                renderImageItem(img, { width: '100%' }, 'page-gallery__item--landscape')
              )}
            </div>
            <div className="page-gallery__col-portrait">
              {renderImageItem(portraitImg, { width: '100%' }, 'page-gallery__item--portrait')}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div id={galleryId} className={`page-gallery ${className}`.trim()}>
      {patterns.map((pattern) => {
        const isColumn =
          pattern.patternType === PatternType.COLUMN ||
          pattern.patternType === 1 ||
          pattern.patternType === 'COLUMN' ||
          pattern.patternType === 'Column';

        if (isColumn) {
          return renderColumnPattern(pattern);
        }
        return renderRowPattern(pattern);
      })}
    </div>
  );
};

export default PageGallery;
