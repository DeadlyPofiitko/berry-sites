// src/components/UploadImage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Modal } from './ui';
import { uploadImages as uploadImagesService } from '../services/image';
import './UploadImage.css';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_BATCH_COUNT = 20;

export interface UploadImageProps {
  opened?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export interface BatchUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  customName: string;
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const UploadImage: React.FC<UploadImageProps> = ({
  opened: controlledOpened,
  onClose: controlledOnClose,
  onSuccess,
  trigger,
}) => {
  const [internalOpened, setInternalOpened] = useState(false);
  const isControlled = typeof controlledOpened === 'boolean';
  const isModalOpen = isControlled ? controlledOpened : internalOpened;

  const [items, setItems] = useState<BatchUploadItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<BatchUploadItem[]>([]);
  itemsRef.current = items;

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const closeModal = () => {
    if (uploading) return;
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setInternalOpened(false);
    }
    resetForm();
  };

  const resetForm = () => {
    items.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setItems([]);
    setErrorMessage(null);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const incomingFiles = Array.from(fileList);
    if (incomingFiles.length === 0) return;

    const availableSlots = MAX_BATCH_COUNT - items.length;
    if (availableSlots <= 0) {
      setErrorMessage(`Maximum limit of ${MAX_BATCH_COUNT} images reached. Remove some images or upload current batch.`);
      return;
    }

    const filesToProcess = incomingFiles.slice(0, availableSlots);
    const errors: string[] = [];

    if (incomingFiles.length > availableSlots) {
      errors.push(`Maximum batch size is ${MAX_BATCH_COUNT} images. ${incomingFiles.length - availableSlots} file(s) were omitted.`);
    }

    const newItems: BatchUploadItem[] = [];

    for (const file of filesToProcess) {
      const isPng =
        file.type === 'image/png' ||
        file.name.toLowerCase().endsWith('.png');

      if (!isPng) {
        errors.push(`"${file.name}" is not a PNG file.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}" exceeds 25 MB limit (${formatFileSize(file.size)}).`);
        continue;
      }

      newItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        customName: '',
      });
    }

    if (errors.length > 0) {
      setErrorMessage(errors.join(' '));
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!uploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveItem = (id: string) => {
    if (uploading) return;
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleClearAll = () => {
    if (uploading) return;
    resetForm();
  };

  const handleNameChange = (id: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, customName: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;

    if (items.length === 0) {
      setErrorMessage('Please select at least one PNG image to upload.');
      return;
    }

    setErrorMessage(null);
    setUploading(true);

    try {
      const payload = items.map((item) => ({
        file: item.file,
        name: item.customName.trim() ? item.customName.trim() : null,
      }));

      const success = await uploadImagesService(payload);
      if (success) {
        resetForm();
        if (isControlled) {
          controlledOnClose?.();
        } else {
          setInternalOpened(false);
        }
        onSuccess?.();
      }
    } catch {
      setErrorMessage('An unexpected error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const totalBytes = items.reduce((acc, item) => acc + item.file.size, 0);

  return (
    <>
      {!isControlled && (
        trigger ? (
          <span onClick={() => setInternalOpened(true)}>{trigger}</span>
        ) : (
          <Button
            variant="filled"
            color="blue"
            size="sm"
            leftSection={<PlusIcon />}
            onClick={() => setInternalOpened(true)}
          >
            Upload Images
          </Button>
        )
      )}

      <Modal
        opened={isModalOpen}
        onClose={closeModal}
        title={items.length > 0 ? `Upload Images (${items.length})` : 'Upload Images'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="upload-image-modal__content">
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,image/png"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
            disabled={uploading}
          />

          {/* Full Dropzone when empty */}
          {items.length === 0 ? (
            <div
              className={`upload-image__dropzone ${isDragOver ? 'upload-image__dropzone--active' : ''} ${uploading ? 'upload-image__dropzone--disabled' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="upload-image__dropzone-icon">
                <UploadIcon />
              </div>
              <div className="upload-image__dropzone-text">
                Click or drag & drop PNG files here
              </div>
              <p className="upload-image__dropzone-subtext">
                Batch upload up to 20 PNG images at once
              </p>
              <div className="upload-image__dropzone-constraints">
                <span className="upload-image__badge-hint">Format: PNG</span>
                <span className="upload-image__badge-hint">Max size: 25 MB each</span>
                <span className="upload-image__badge-hint">Max batch: 20 files</span>
              </div>
            </div>
          ) : (
            <div className="upload-image__batch-container">
              {/* Batch Summary and Quick Actions */}
              <div className="upload-image__batch-header">
                <div className="upload-image__batch-stats">
                  <span className="upload-image__batch-count">
                    <strong>{items.length}</strong> of {MAX_BATCH_COUNT} images selected
                  </span>
                  <span className="upload-image__batch-divider">•</span>
                  <span className="upload-image__batch-totalsize">
                    {formatFileSize(totalBytes)} total
                  </span>
                </div>

                <div className="upload-image__batch-actions">
                  {items.length < MAX_BATCH_COUNT && (
                    <Button
                      type="button"
                      variant="light"
                      color="blue"
                      size="xs"
                      leftSection={<PlusIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      Add More
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="subtle"
                    color="red"
                    size="xs"
                    onClick={handleClearAll}
                    disabled={uploading}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Compact Drop Area for adding more files */}
              {items.length < MAX_BATCH_COUNT && (
                <div
                  className={`upload-image__compact-dropzone ${isDragOver ? 'upload-image__compact-dropzone--active' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  role="button"
                  tabIndex={0}
                >
                  <UploadIcon />
                  <span>Drop more PNG files here or click to browse</span>
                </div>
              )}

              {/* Scrollable Items List */}
              <div className="upload-image__items-list">
                {items.map((item, index) => {
                  const defaultBaseName = item.file.name.replace(/\.png$/i, '');
                  return (
                    <div className="upload-image__item-row" key={item.id}>
                      <div className="upload-image__item-index">#{index + 1}</div>

                      <div className="upload-image__item-thumb-wrapper">
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="upload-image__item-thumb"
                        />
                      </div>

                      <div className="upload-image__item-body">
                        <div className="upload-image__item-meta">
                          <span className="upload-image__item-filename" title={item.file.name}>
                            {item.file.name}
                          </span>
                          <div className="upload-image__item-tags">
                            <span className="upload-image__preview-tag">PNG</span>
                            <span className="upload-image__item-size">{formatFileSize(item.file.size)}</span>
                          </div>
                        </div>

                        <div className="upload-image__item-input-row">
                          <Input
                            size="xs"
                            placeholder={`Custom name (default: ${defaultBaseName})`}
                            value={item.customName}
                            onChange={(e) => handleNameChange(item.id, e.target.value)}
                            disabled={uploading}
                            wrapperClassName="upload-image__item-input-wrapper"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="upload-image__item-remove-btn"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={uploading}
                        title="Remove image"
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="upload-image__alert">
              <span className="upload-image__alert-icon">
                <AlertTriangleIcon />
              </span>
              <p className="upload-image__alert-content">{errorMessage}</p>
            </div>
          )}

          {/* Modal Actions */}
          <div className="upload-image__modal-footer">
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={uploading}
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="blue"
              size="sm"
              type="submit"
              loading={uploading}
              disabled={items.length === 0}
            >
              {uploading
                ? 'Uploading...'
                : items.length > 0
                ? `Upload ${items.length} ${items.length === 1 ? 'Image' : 'Images'}`
                : 'Upload Images'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

// Aliased export to support lowerCase convention `uploadImage`
export const uploadImage = UploadImage;
export default UploadImage;
