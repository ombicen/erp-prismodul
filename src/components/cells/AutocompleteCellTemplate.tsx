'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { SyntheticEvent } from 'react';
import type {
  Cell,
  CellTemplate,
  Compatible,
  DropdownCell,
  Uncertain,
  UncertainCompatible,
} from '@silevis/reactgrid';

export interface AutocompleteOption {
  label: string;
  value: string;
  isDisabled?: boolean;
}

export interface AutocompleteCell extends Cell {
  type: 'autocomplete';
  text: string;
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

  readonly cellType = 'autocomplete';

  getCompatibleCell(uncertainCell: Uncertain<AutocompleteCell>): Compatible<AutocompleteCell> {
    const text = typeof uncertainCell.text === 'string' ? uncertainCell.text : '';
    const selectedValue =
      typeof uncertainCell.selectedValue === 'string' ? uncertainCell.selectedValue : undefined;
    const options = Array.isArray(uncertainCell.options) ? uncertainCell.options : [];
    const type = 'autocomplete';
    return {
      type,
      text,
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
  const [localOptions, setLocalOptions] = useState<AutocompleteOption[]>(cell.options ?? []);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(cell.text ?? '');
    setLocalOptions(cell.options ?? []);
  }, [cell.text, cell.options]);

  useEffect(() => {
    if (inEditMode && !cell.isDisabled) {
      setIsOpen(true);
      const id = requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      return () => cancelAnimationFrame(id);
    }
    setIsOpen(false);
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

  const filteredOptions = useMemo(() => {
    if (!inputValue) return localOptions;
    const lowered = inputValue.toLowerCase();
    return localOptions.filter(option => option.label.toLowerCase().includes(lowered));
  }, [localOptions, inputValue]);

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
    try {
      const creation = await cell.onCreateOption(trimmed);
      if (creation) {
        setLocalOptions(prev => [...prev, creation]);
        handleSelectOption(creation);
      }
    } catch (error) {
      console.error('Autocomplete cell: failed to create option', error);
    }
  }, [cell, handleSelectOption, inputValue, localOptions]);

  const showCreateOption =
    cell.allowCreate &&
    cell.onCreateOption &&
    inputValue.trim().length > 0 &&
    !localOptions.some(
      option => option.label.toLowerCase() === inputValue.trim().toLowerCase(),
    );

  // Show plain text when not in edit mode
  if (!inEditMode) {
    return (
      <div className="w-full h-full px-2 flex items-center text-sm">
        {cell.text || <span className="text-slate-400">{cell.placeholder}</span>}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onPointerDownCapture={stopEvent}
      onKeyDownCapture={stopEvent}
    >
      <input
        ref={inputRef}
        type="text"
        disabled={cell.isDisabled}
        value={inputValue}
        placeholder={cell.placeholder}
        className="w-full h-full px-2 text-sm border border-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
        onChange={(event) => {
          const text = event.target.value;
          setInputValue(text);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => !cell.isDisabled && setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            if (filteredOptions.length === 1) {
              handleSelectOption(filteredOptions[0]);
            } else if (showCreateOption) {
              handleCreateOption();
            }
          } else if (event.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      />

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <button
                key={option.value}
                type="button"
                disabled={option.isDisabled}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  option.isDisabled
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'hover:bg-blue-50'
                } ${
                  option.value === cell.selectedValue ? 'bg-blue-100 text-blue-700 font-medium' : ''
                }`}
                onMouseDown={stopEvent}
                onClick={(event) => {
                  event.preventDefault();
                  handleSelectOption(option);
                }}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">
              No matches
            </div>
          )}

          {showCreateOption && (
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              onMouseDown={stopEvent}
              onClick={(event) => {
                event.preventDefault();
                handleCreateOption();
              }}
            >
              {cell.createOptionLabel
                ? cell.createOptionLabel.replace('{input}', inputValue.trim())
                : `Create "${inputValue.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function stopEvent(event: SyntheticEvent | Event) {
  event.stopPropagation();
}
