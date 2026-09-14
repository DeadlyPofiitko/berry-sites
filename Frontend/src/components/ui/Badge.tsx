import React from 'react';
import './Badge.css';

export type BadgeVariant = 'light' | 'filled' | 'outline';
export type BadgeColor = 'blue' | 'green' | 'red' | 'gray';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'light',
  color = 'blue',
  size = 'sm',
  children,
  className = '',
  style,
  ...rest
}) => {
  const classes = [
    'mantine-badge',
    `mantine-badge--variant-${variant}`,
    `mantine-badge--color-${color}`,
    `mantine-badge--size-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} style={style} {...rest}>
      {children}
    </span>
  );
};

export default Badge;
