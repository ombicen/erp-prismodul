'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { SyntheticEvent, KeyboardEvent } from 'react';
import type {
  Cell,
  CellTemplate,
  Compatible,
  Uncertain,
  UncertainCompatible,
} from '@silevis/reactgrid';
import { DROPDOWN_CELL_CONFIG } from '../../lib/reactgrid-constants';

export interface AutocompleteOption {
  label: string;
  value: string;
  isDisabled?: boolean;
}

export interface AutocompleteCell extends Cell {
  type: 'autocomplete';
  text: string;
  value: number;
  selectedValue?: string;
  options: AutocompleteOption[];
  placeholder?: string;
  allowCreate?: boolean;
  createOptionLabel?: string;
  onCreateOption?: (input: string) => Promise<AutocompleteOption | null>;
  isDisabled?: boolean;
  nonEditable?: boolean;
}

const isAutocompleteCell = (cell: Cell): cell is AutocompleteCell =>
  (cell as AutocompleteCell).type === 'autocomplete';

export class AutocompleteCellTemplate implements CellTemplate<AutocompleteCell> {
  readonly cellType = 'autocomplete';

  getType(): string {
    return this.cellType;
  }

  getCompatibleCell(uncertainCell: Uncertain<AutocompleteCell>): Compatible<AutocompleteCell> {
    const text = typeof uncertainCell.text === 'string' ? uncertainCell.text : '';
    const selectedValue =
      typeof uncertainCell.selectedValue === 'string' ? uncertainCell.selectedValue : undefined;
    const options = Array.isArray(uncertainCell.options) ? uncertainCell.options : [];
    const type = 'autocomplete';
    return {
      ...DROPDOWN_CELL_CONFIG,
      type,
      text,
      value: 0,
      selectedValue,
      options,
      placeholder: uncertainCell.placeholder,
      createOptionLabel: uncertainCell.createOptionLabel,
      onCreateOption: uncertainCell.onCreateOption,
      allowCreate: Boolean(uncertainCell.allowCreate),
      isDisabled: Boolean(uncertainCell.isDisabled),
      nonEditable: Boolean(uncertainCell.nonEditable),
    };
  }

  handleKeyDown(
    cell: Compatible<AutocompleteCell>,
    keyCode: number,
    ctrl: boolean,
    shift: boolean,
    alt: boolean,
    key: string,
  ) {
    if (cell.isDisabled) {
      return { cell, enableEditMode: false };
    }

    if (keyCode === 113 || keyCode === 32 || keyCode === 13) {
      // F2, Space or Enter -> open edit mode
      return { cell, enableEditMode: true };
    }

    if (!ctrl && !alt && key.length === 1) {
      // typing character opens edit mode and starts filtering
      return {
        cell: {
          ...cell,
          text: key,
        },
        enableEditMode: true,
      };
    }

    return { cell, enableEditMode: false };
  }

  update(
    cell: Compatible<AutocompleteCell>,
    cellToMerge: UncertainCompatible<AutocompleteCell>,
  ): Compatible<AutocompleteCell> {
    return this.getCompatibleCell({
      ...cell,
      ...cellToMerge,
    });
  }

  getClassName(cell: Compatible<AutocompleteCell>, isInEditMode: boolean) {
    const classes = ['rg-autocomplete-cell'];
    if (cell.isDisabled) {
      classes.push('rg-autocomplete-cell--disabled');
    }
    if (isInEditMode) {
      classes.push('rg-autocomplete-cell--editing');
    }
    return classes.join(' ');
  }

  render(
    cell: Compatible<AutocompleteCell>,
    isInEditMode: boolean,
    onCellChanged: (cell: Compatible<AutocompleteCell>, commit: boolean) => void,
  ) {
    return (
      <AutocompleteCellEditor
        cell={cell}
        inEditMode={isInEditMode}
        onChange={onCellChanged}
      />
    );
  }
}

interface AutocompleteCellEditorProps {
  cell: Compatible<AutocompleteCell>;
  inEditMode: boolean;
  onChange: (cell: Compatible<AutocompleteCell>, commit: boolean) => void;
}

function AutocompleteCellEditor({ cell, inEditMode, onChange }: AutocompleteCellEditorProps) {
  const [inputValue, setInputValue] = useState(cell.text ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [localOptions, setLocalOptions] = useState<AutocompleteOption[]>(cell.options ?? []);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(cell.text ?? '');
    setLocalOptions(cell.options ?? []);
  }, [cell.text, cell.options]);

  useEffect(() => {
    if (inEditMode && !cell.isDisabled) {
      setIsFocused(true);
      setIsOpen(true);
      const id = requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [inEditMode, cell.isDisabled]);

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handlePointer);
      return () => document.removeEventListener('mousedown', handlePointer);
    }
    return undefined;
  }, [isOpen]);

  // Memoize only when open for performance
  const filteredOptions = useMemo(() => {
    if (!isOpen) return localOptions;
    if (!inputValue) return localOptions;
    const lowered = inputValue.toLowerCase();
    return localOptions.filter(option => option.label.toLowerCase().includes(lowered));
  }, [localOptions, inputValue, isOpen]);

  // Ensure unique option values for React keys
  const uniqueOptions = useMemo(() => {
    const seen = new Set<string>();
    return filteredOptions.filter(opt => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [filteredOptions]);

  const handleSelectOption = useCallback(
    (option: AutocompleteOption) => {
      if (option.isDisabled) return;
      const updated: Compatible<AutocompleteCell> = {
        ...cell,
        selectedValue: option.value,
        text: option.label,
      };
      setInputValue(option.label);
      setIsOpen(false);
      setHighlightedIndex(-1);
      onChange(updated, true);
    },
    [cell, onChange],
  );

  const handleCreateOption = useCallback(async () => {
    if (!cell.onCreateOption || !cell.allowCreate) return;
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const maybeExisting = localOptions.find(
      option => option.label.toLowerCase() === trimmed.toLowerCase(),
    );
    if (maybeExisting) {
      handleSelectOption(maybeExisting);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const creation = await cell.onCreateOption(trimmed);
      if (creation) {
        setLocalOptions(prev => [...prev, creation]);
        handleSelectOption(creation);
      }
    } catch (err) {
      setError('Kunde inte skapa alternativ. Försök igen.');
      console.error('Autocomplete cell: failed to create option', err);
    } finally {
      setLoading(false);
    }
  }, [cell, handleSelectOption, inputValue, localOptions]);

  const showCreateOption =
    cell.allowCreate &&
    cell.onCreateOption &&
    inputValue.trim().length > 0 &&
    !localOptions.some(
      option => option.label.toLowerCase() === inputValue.trim().toLowerCase(),
    );

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(prev => Math.min(prev + 1, uniqueOptions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < uniqueOptions.length) {
        handleSelectOption(uniqueOptions[highlightedIndex]);
      } else if (showCreateOption) {
        handleCreateOption();
      } else if (uniqueOptions.length === 1) {
        handleSelectOption(uniqueOptions[0]);
      } else if (uniqueOptions.length === 0 && inputValue.trim()) {
        onChange({ ...cell, text: inputValue }, true);
        setIsOpen(false);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      if (inputValue !== cell.text) {
        onChange({ ...cell, text: inputValue }, true);
      }
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }, [highlightedIndex, uniqueOptions, showCreateOption, handleSelectOption, handleCreateOption, inputValue, cell, onChange]);

  const handleMenuPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
  }, []);

  const handleCreateOptionClick = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    handleCreateOption();
  }, [handleCreateOption]);

  const handleOptionClick = useCallback((option: AutocompleteOption) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    handleSelectOption(option);
  }, [handleSelectOption]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-between relative bg-transparent text-[13px] outline-none border-none px-2"
      style={{
        color: cell.isDisabled ? '#94a3b8' : '#1e293b',
        cursor: cell.isDisabled ? 'not-allowed' : 'text',
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (!cell.isDisabled) {
          setIsOpen(true);
          setIsFocused(true);
          requestAnimationFrame(() => {
            inputRef.current?.focus();
          });
        }
      }}
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-owns="autocomplete-listbox"
      aria-controls="autocomplete-listbox"
    >
      <input
        ref={inputRef}
        type="text"
        disabled={cell.isDisabled}
        value={inputValue}
        placeholder={cell.placeholder}
        className="w-full h-full bg-transparent text-[13px] outline-none border-none"
        style={{
          padding: 0,
          color: cell.isDisabled ? '#94a3b8' : '#1e293b',
        }}
        onChange={useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
          const text = event.target.value;
          setInputValue(text);
          if (!isOpen) setIsOpen(true);
        }, [isOpen])}
        onFocus={useCallback(() => {
          if (!cell.isDisabled) {
            setIsFocused(true);
            setIsOpen(true);
          }
        }, [cell.isDisabled])}
        onBlur={useCallback(() => {
          setIsFocused(false);
        }, [])}
        onKeyDown={handleKeyDown}
  onPointerDown={useCallback((e: React.PointerEvent<HTMLInputElement>) => e.stopPropagation(), [])}
        aria-autocomplete="list"
        aria-controls="autocomplete-listbox"
        aria-activedescendant={highlightedIndex >= 0 ? `autocomplete-option-${highlightedIndex}` : undefined}
      />

      {/* Dropdown list - render inside cell with absolute positioning */}
      {isOpen && (
        <div
          id="autocomplete-listbox"
          role="listbox"
          className="rg-autocomplete-menu"
          onPointerDown={handleMenuPointerDown}
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
          {uniqueOptions.length > 0 ? (
            uniqueOptions.map((option, idx) => (
              <div
                key={option.value}
                id={`autocomplete-option-${idx}`}
                role="option"
                aria-selected={highlightedIndex === idx}
                onPointerDown={handleOptionClick(option)}
                className={`rg-autocomplete-option${highlightedIndex === idx ? ' rg-autocomplete-option--highlighted' : ''}`}
                style={{
                  padding: '8px 12px',
                  backgroundColor: highlightedIndex === idx ? '#dbeafe' : 'white',
                  cursor: option.isDisabled ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  color: option.isDisabled ? '#94a3b8' : '#1e293b',
                }}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                color: '#64748b',
              }}
            >
              No matches
            </div>
          )}

          {showCreateOption && (
            <div
              onPointerDown={handleCreateOptionClick}
              className="rg-autocomplete-create"
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#2563eb',
                cursor: 'pointer',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: 'white',
              }}
            >
              {loading ? 'Skapar...' : cell.createOptionLabel
                ? cell.createOptionLabel.replace('{input}', inputValue.trim())
                : `Create "${inputValue.trim()}"`}
            </div>
          )}
          {error && (
            <div style={{ color: '#dc2626', padding: '8px 12px', fontSize: '13px' }}>{error}</div>
          )}
        </div>
      )}
    </div>
  );
}

function stopEvent(event: SyntheticEvent | Event) {
  event.stopPropagation();
}
