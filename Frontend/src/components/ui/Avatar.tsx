import React, { useState } from 'react';
import './Avatar.css';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  size?: AvatarSize;
  radius?: AvatarRadius;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  fallback,
  size = 'md',
  radius = 'full',
  className = '',
  style,
  ...rest
}) => {
  const [imageError, setImageError] = useState(false);

  const classes = [
    'mantine-avatar',
    `mantine-avatar--size-${size}`,
    `mantine-avatar--radius-${radius}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const showImage = Boolean(src) && !imageError;

  return (
    <div className={classes} style={style} {...rest}>
      {showImage ? (
        <img
          src={src as string}
          alt={alt}
          className="mantine-avatar__image"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="mantine-avatar__fallback">
          {fallback || (alt ? alt[0]?.toUpperCase() : '?')}
        </span>
      )}
    </div>
  );
};

export default Avatar;
