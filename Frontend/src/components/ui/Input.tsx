import React, { forwardRef, useId } from 'react';
import './Input.css';

export type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type InputRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  withAsterisk?: boolean;
  size?: InputSize;
  radius?: InputRadius;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  leftSectionPointerEvents?: 'none' | 'auto';
  rightSectionPointerEvents?: 'none' | 'auto';
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    description,
    error,
    withAsterisk = false,
    size = 'sm',
    radius = 'sm',
    leftSection,
    rightSection,
    leftSectionPointerEvents = 'none',
    rightSectionPointerEvents = 'auto',
    id: customId,
    required,
    disabled,
    className = '',
    wrapperClassName = '',
    style,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const inputId = customId || autoId;
  const isRequired = required || withAsterisk;

  const fieldClasses = [
    'mantine-input__field',
    `mantine-input__field--size-${size}`,
    `mantine-input__field--radius-${radius}`,
    leftSection ? 'mantine-input__field--with-left-section' : '',
    rightSection ? 'mantine-input__field--with-right-section' : '',
    error ? 'mantine-input__field--invalid' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`mantine-input-wrapper ${wrapperClassName}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="mantine-input__label">
          {label}
          {isRequired && <span className="mantine-input__required">*</span>}
        </label>
      )}

      {description && <p className="mantine-input__description">{description}</p>}

      <div className="mantine-input__input-box">
        {leftSection && (
          <span
            className={`mantine-input__section mantine-input__section--left mantine-input__section--size-${size}`}
            style={{ pointerEvents: leftSectionPointerEvents }}
          >
            {leftSection}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          required={isRequired}
          disabled={disabled}
          className={fieldClasses}
          style={style}
          {...rest}
        />

        {rightSection && (
          <span
            className={`mantine-input__section mantine-input__section--right mantine-input__section--size-${size}`}
            style={{ pointerEvents: rightSectionPointerEvents }}
          >
            {rightSection}
          </span>
        )}
      </div>

      {error && <p className="mantine-input__error">{error}</p>}
    </div>
  );
});

export default Input;
