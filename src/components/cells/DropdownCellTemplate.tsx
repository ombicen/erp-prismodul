'use client';

import * as React from 'react';
import {
  Cell,
  CellTemplate,
  Compatible,
  Uncertain,
  UncertainCompatible,
  getCellProperty,
  isAlphaNumericKey,
  isNavigationKey,
  keyCodes,
} from '@silevis/reactgrid';
import { DROPDOWN_CELL_CONFIG } from '../../lib/reactgrid-constants';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface CustomDropdownCell extends Cell {
  type: 'customDropdown';
  selectedValue?: string;
  options: DropdownOption[];
  isDisabled?: boolean;
  placeholder?: string;
  text: string;
  value: number;
  isOpen?: boolean;
}

export class DropdownCellTemplate implements CellTemplate<CustomDropdownCell> {
  getCompatibleCell(uncertainCell: Uncertain<CustomDropdownCell>): Compatible<CustomDropdownCell> {
    const selectedValue = getCellProperty(uncertainCell, 'selectedValue', 'string');
    const options = getCellProperty(uncertainCell, 'options', 'object') as DropdownOption[];
    const isDisabled = getCellProperty(uncertainCell, 'isDisabled', 'boolean');
    const placeholder = getCellProperty(uncertainCell, 'placeholder', 'string');
    const isOpen = getCellProperty(uncertainCell, 'isOpen', 'boolean');
    const text = this.getDisplayText(selectedValue, options);

    const cell: Compatible<CustomDropdownCell> = {
      ...DROPDOWN_CELL_CONFIG,
      type: 'customDropdown',
      selectedValue,
      options: Array.isArray(options) ? options : [],
      isDisabled: isDisabled ?? false,
      placeholder: placeholder ?? '',
      isOpen: isOpen ?? false,
      text,
      value: parseFloat(selectedValue || '0'),
    };

    return cell;
  }

  private getDisplayText(selectedValue: string | undefined, options: DropdownOption[]): string {
    if (!selectedValue) return '';
    const option = options.find(opt => opt.value === selectedValue);
    return option ? option.label : selectedValue;
  }

  update(cell: Compatible<CustomDropdownCell>, cellToMerge: UncertainCompatible<CustomDropdownCell>): Compatible<CustomDropdownCell> {
    return this.getCompatibleCell({ ...cell, ...cellToMerge });
  }

  handleKeyDown(
    cell: Compatible<CustomDropdownCell>,
    keyCode: number,
    ctrl: boolean,
    shift: boolean,
    alt: boolean
  ): { cell: Compatible<CustomDropdownCell>; enableEditMode: boolean } {
    const char = String.fromCharCode(keyCode);

    // Allow navigation keys
    if (isNavigationKey(keyCode)) {
      return { cell, enableEditMode: false };
    }

    // Enter or Space to open dropdown
    if (keyCode === keyCodes.SPACE || keyCode === keyCodes.ENTER) {
      return { cell, enableEditMode: true };
    }

    // Arrow keys for quick selection
    if (keyCode === keyCodes.DOWN_ARROW || keyCode === keyCodes.UP_ARROW) {
      return { cell, enableEditMode: true };
    }

    // Alphanumeric keys to start search
    if (!ctrl && !alt && isAlphaNumericKey(keyCode)) {
      return { cell, enableEditMode: true };
    }

    return { cell, enableEditMode: false };
  }

  render(
    cell: Compatible<CustomDropdownCell>,
    isInEditMode: boolean,
    onCellChanged: (cell: Compatible<CustomDropdownCell>, commit: boolean) => void
  ): React.ReactNode {
    // Always render the same component, like react-select does
    return (
      <DropdownInput
        cell={cell}
        onCellChanged={onCellChanged}
      />
    );
  }
}

interface DropdownInputProps {
  cell: Compatible<CustomDropdownCell>;
  onCellChanged: (cell: Compatible<CustomDropdownCell>, commit: boolean) => void;
}

const DropdownInput: React.FC<DropdownInputProps> = ({ cell, onCellChanged }) => {
  const [selectedIndex, setSelectedIndex] = React.useState<number>(() => {
    const index = cell.options.findIndex(opt => opt.value === cell.selectedValue);
    return index >= 0 ? index : 0;
  });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside - only when open
  React.useEffect(() => {
    if (!cell.isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (listRef.current && !listRef.current.contains(e.target as Node)) {
          onCellChanged({ ...cell, isOpen: false }, true);
        }
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [cell.isOpen]);

  const handleSelect = (value: string) => {
    const selectedOption = cell.options.find(opt => opt.value === value);
    onCellChanged({
      ...cell,
      selectedValue: value,
      text: selectedOption?.label || value,
      value: parseFloat(value || '0'),
      isOpen: false,
    }, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();

    if (e.key === 'Escape') {
      e.preventDefault();
      onCellChanged({ ...cell, isOpen: false }, true);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onCellChanged({ ...cell, isOpen: false }, true);
    } else if (e.key === 'Enter' && cell.isOpen) {
      e.preventDefault();
      if (cell.options[selectedIndex]) {
        handleSelect(cell.options[selectedIndex].value);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!cell.isOpen) {
        onCellChanged({ ...cell, isOpen: true }, true);
      } else {
        setSelectedIndex(prev => Math.min(prev + 1, cell.options.length - 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!cell.isOpen) {
        onCellChanged({ ...cell, isOpen: true }, true);
      } else {
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => {
        e.stopPropagation(); // Always stop propagation like in the documentation
        if (!cell.isDisabled) {
          onCellChanged({ ...cell, isOpen: !cell.isOpen }, true); // Toggle dropdown state
        }
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="w-full h-full flex items-center justify-between relative bg-transparent text-[13px] outline-none border-none px-2"
      style={{
        color: cell.isDisabled ? '#94a3b8' : '#1e293b',
        cursor: cell.isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span>{cell.text || <span style={{ color: '#94a3b8' }}>{cell.placeholder || 'Select...'}</span>}</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        style={{ flexShrink: 0, marginLeft: '4px' }}
      >
        <path
          d="M3 4.5L6 7.5L9 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Dropdown list - render inside cell with absolute positioning */}
      {cell.isOpen && (
        <div
          ref={listRef}
          className="rg-dropdown-menu"
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 10000,
          }}
        >
          {cell.options.map((option, index) => (
            <div
              key={option.value}
              onPointerDown={(e) => {
                e.stopPropagation();
                handleSelect(option.value);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`rg-dropdown-option${index === selectedIndex ? ' focused' : ''}${cell.selectedValue === option.value ? ' selected' : ''}`}
              style={{
                padding: '8px 12px',
                backgroundColor:
                  index === selectedIndex ? '#eff6ff' :
                  cell.selectedValue === option.value ? '#dbeafe' :
                  'white',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
