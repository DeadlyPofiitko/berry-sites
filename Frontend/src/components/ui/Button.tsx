import React, { forwardRef } from 'react';
import './Button.css';

export type ButtonVariant = 'filled' | 'light' | 'outline' | 'subtle' | 'default' | 'danger';
export type ButtonColor = 'blue' | 'red' | 'green' | 'gray';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  radius?: ButtonRadius;
  loading?: boolean;
  fullWidth?: boolean;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'filled',
    color = 'blue',
    size = 'sm',
    radius = 'sm',
    loading = false,
    fullWidth = false,
    disabled = false,
    leftSection,
    rightSection,
    children,
    className = '',
    style,
    type = 'button',
    ...rest
  },
  ref
) {
  const classes = [
    'mantine-button',
    `mantine-button--variant-${variant}`,
    `mantine-button--color-${color}`,
    `mantine-button--size-${size}`,
    `mantine-button--radius-${radius}`,
    fullWidth ? 'mantine-button--full-width' : '',
    loading ? 'mantine-button--loading' : '',
    disabled ? 'mantine-button--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      style={style}
      {...rest}
    >
      <span className="mantine-button__inner" style={{ visibility: loading ? 'hidden' : 'visible' }}>
        {leftSection && <span className="mantine-button__section mantine-button__section--left">{leftSection}</span>}
        <span className="mantine-button__label">{children}</span>
        {rightSection && <span className="mantine-button__section mantine-button__section--right">{rightSection}</span>}
      </span>

      {loading && (
        <span className="mantine-button__loader">
          <svg
            className="mantine-button__spinner"
            width={size === 'xs' ? 14 : size === 'sm' ? 16 : 20}
            height={size === 'xs' ? 14 : size === 'sm' ? 16 : 20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
            <path d="M12 3a9 9 0 0 1 9 9" />
          </svg>
        </span>
      )}
    </button>
  );
});

export default Button;
