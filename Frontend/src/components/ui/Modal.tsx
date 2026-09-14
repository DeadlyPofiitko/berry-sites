import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ModalRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  opened: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: ModalSize;
  radius?: ModalRadius;
  centered?: boolean;
  withCloseButton?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  bodyClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  opened,
  onClose,
  title,
  children,
  size = 'md',
  radius = 'md',
  centered = true,
  withCloseButton = true,
  closeOnClickOutside = true,
  closeOnEscape = true,
  className = '',
  bodyClassName = '',
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!opened) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [opened, closeOnEscape, onClose]);

  if (!opened) return null;
  if (typeof document === 'undefined') return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnClickOutside && e.target === overlayRef.current) {
      onClose();
    }
  };

  const modalContent = (
    <div
      ref={overlayRef}
      className={`mantine-modal__root ${centered ? 'mantine-modal__root--centered' : 'mantine-modal__root--top'}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'mantine-modal-title' : undefined}
    >
      <div className="mantine-modal__overlay" />
      <div className="mantine-modal__container">
        <div
          className={`mantine-modal__content mantine-modal__content--size-${size} mantine-modal__content--radius-${radius} ${className}`.trim()}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || withCloseButton) && (
            <div className="mantine-modal__header">
              {title ? (
                <h3 id="mantine-modal-title" className="mantine-modal__title">
                  {title}
                </h3>
              ) : (
                <div />
              )}
              {withCloseButton && (
                <button
                  type="button"
                  className="mantine-modal__close"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          )}

          <div className={`mantine-modal__body ${bodyClassName}`.trim()}>{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
