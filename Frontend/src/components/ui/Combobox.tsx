import React, { useState, useRef, useEffect, useId } from 'react';
import './Combobox.css';

export interface ComboboxItem {
  value: string;
  label: string;
  description?: string;
  badge?: React.ReactNode;
}

export interface ComboboxProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  withAsterisk?: boolean;
  placeholder?: string;
  data: ComboboxItem[];
  value: string | null;
  onChange: (value: string) => void;
  searchable?: boolean;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  leftSection?: React.ReactNode;
  className?: string;
  id?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  label,
  description,
  error,
  required,
  withAsterisk,
  placeholder = 'Select option...',
  data,
  value,
  onChange,
  searchable = false,
  disabled = false,
  size = 'sm',
  leftSection,
  className = '',
  id: customId,
}) => {
  const autoId = useId();
  const comboboxId = customId || autoId;
  const isRequired = required || withAsterisk;

  const [opened, setOpened] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = data.find((item) => item.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    if (!opened) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpened(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpened(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [opened]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (opened && searchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [opened, searchable]);

  const filteredData = searchable && searchQuery.trim()
    ? data.filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : data;

  const handleSelect = (itemValue: string) => {
    onChange(itemValue);
    setOpened(false);
  };

  const toggleOpen = () => {
    if (disabled) return;
    setOpened((prev) => !prev);
  };

  return (
    <div ref={containerRef} className={`mantine-combobox ${className}`.trim()} id={comboboxId}>
      {label && (
        <label className="mantine-combobox__label">
          {label}
          {isRequired && <span className="mantine-combobox__required">*</span>}
        </label>
      )}

      {description && <p className="mantine-combobox__description">{description}</p>}

      <div
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={opened}
        aria-haspopup="listbox"
        className={[
          'mantine-combobox__target',
          `mantine-combobox__target--size-${size}`,
          opened ? 'mantine-combobox__target--opened' : '',
          disabled ? 'mantine-combobox__target--disabled' : '',
          error ? 'mantine-combobox__target--invalid' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={toggleOpen}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setOpened(true);
          }
        }}
      >
        {leftSection && <span style={{ marginRight: 6, display: 'flex' }}>{leftSection}</span>}

        <div className="mantine-combobox__target-content">
          {selectedItem ? (
            <>
              <span className="mantine-combobox__value-label">{selectedItem.label}</span>
              {selectedItem.badge}
            </>
          ) : (
            <span className="mantine-combobox__placeholder">{placeholder}</span>
          )}
        </div>

        <span className={`mantine-combobox__chevron ${opened ? 'mantine-combobox__chevron--opened' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      {error && <p className="mantine-combobox__error">{error}</p>}

      {opened && (
        <div className="mantine-combobox__dropdown">
          {searchable && (
            <div className="mantine-combobox__search-wrapper" onClick={(e) => e.stopPropagation()}>
              <input
                ref={searchInputRef}
                type="text"
                className="mantine-combobox__search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpened(false);
                  }
                }}
              />
            </div>
          )}

          <ul className="mantine-combobox__options" role="listbox">
            {filteredData.length === 0 ? (
              <li className="mantine-combobox__empty">No options found</li>
            ) : (
              filteredData.map((item) => {
                const isSelected = item.value === value;
                return (
                  <li
                    key={item.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`mantine-combobox__option ${isSelected ? 'mantine-combobox__option--selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(item.value);
                    }}
                  >
                    <div className="mantine-combobox__option-main">
                      <span className="mantine-combobox__option-label">{item.label}</span>
                      {item.description && (
                        <span className="mantine-combobox__option-desc">({item.description})</span>
                      )}
                    </div>
                    {item.badge}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Combobox;
