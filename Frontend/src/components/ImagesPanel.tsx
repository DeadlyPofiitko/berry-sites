// src/components/ImagesPanel.tsx
import React, { useState } from 'react';
import { Badge, Button } from './ui';
import { UploadImage } from './UploadImage';
import { ImagesGallery } from './ImagesGallery';
import './ImagesPanel.css';

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export const ImagesPanel: React.FC = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    setRefreshSignal((prev) => prev + 1);
  };

  return (
    <div className="images-panel">
      {/* Page Header */}
      <div className="images-panel__header">
        <div>
          <div className="images-panel__title-group">
            <h1 className="images-panel__title">Images</h1>
            <Badge variant="light" color="blue" size="md">
              PNG format
            </Badge>
          </div>
        </div>

        <Button
          variant="filled"
          color="blue"
          size="sm"
          leftSection={<PlusIcon />}
          onClick={() => setShowUploadModal(true)}
        >
          Upload Images
        </Button>
      </div>

      {/* Images Gallery with PhotoSwipe */}
      <ImagesGallery
        refreshSignal={refreshSignal}
        onUploadClick={() => setShowUploadModal(true)}
      />

      {/* Upload Image Modal Component */}
      <UploadImage
        opened={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default ImagesPanel;

