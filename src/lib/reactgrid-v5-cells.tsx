'use client';

import React from 'react';
import { useCellContext } from '@silevis/reactgrid';

// Text Cell Component
export interface TextCellProps {
  text: string;
  onTextChanged?: (newText: string) => void;
  nonEditable?: boolean;
  placeholder?: string;
  renderer?: (text: string) => React.ReactNode;
  rowIndex?: number;
}

export const TextCellComponent: React.FC<TextCellProps> = ({
  text,
  onTextChanged,
  nonEditable,
  placeholder,
  renderer,
  rowIndex
}) => {
  const { isFocused } = useCellContext();
  const [editValue, setEditValue] = React.useState(text);

  React.useEffect(() => {
    setEditValue(text);
  }, [text]);

  const handleBlur = () => {
    if (onTextChanged && editValue !== text) {
      onTextChanged(editValue);
    }
  };

  // Determine background color based on row type
  const getBackgroundColor = () => {
    if (rowIndex === 0) return undefined; // Header - handled by HeaderCellComponent
    if (rowIndex === 1) return '#ffffff'; // Filter row - white
    return '#fafafa'; // Data rows - slightly darker
  };

  const cellStyle: React.CSSProperties = {
    backgroundColor: getBackgroundColor(),
    color: !text && placeholder ? '#94a3b8' : undefined,
    fontStyle: !text && placeholder ? 'italic' : undefined,
  };

  if (renderer && !isFocused) {
    return <div className="rg-cell-content" style={{ backgroundColor: getBackgroundColor() }}>{renderer(text)}</div>;
  }

  if (nonEditable || !onTextChanged) {
    return <div className="rg-cell-content" style={{ backgroundColor: getBackgroundColor() }}>{text || ''}</div>;
  }

  if (isFocused) {
    return (
      <input
        className="rg-cell-input"
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        autoFocus
        style={{ backgroundColor: getBackgroundColor() }}
      />
    );
  }

  return (
    <div className="rg-cell-content" style={cellStyle}>
      {text || placeholder || ''}
    </div>
  );
};

// Number Cell Component
export interface NumberCellProps {
  value: number;
  onValueChanged?: (newValue: number) => void;
  nonEditable?: boolean;
  format?: Intl.NumberFormat;
  rowIndex?: number;
}

export const NumberCellComponent: React.FC<NumberCellProps> = ({
  value,
  onValueChanged,
  nonEditable,
  format,
  rowIndex
}) => {
  const { isFocused } = useCellContext();
  const [editValue, setEditValue] = React.useState(String(value));

  React.useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const handleBlur = () => {
    if (onValueChanged) {
      const numValue = parseFloat(editValue.replace(/,/g, '.').replace(/\s/g, ''));
      if (!isNaN(numValue) && numValue !== value) {
        onValueChanged(numValue);
      }
    }
  };

  const displayValue = format ? format.format(value) : String(value);

  // Determine background color based on row type
  const getBackgroundColor = () => {
    if (rowIndex === 0) return undefined; // Header
    if (rowIndex === 1) return '#ffffff'; // Filter row - white
    return '#fafafa'; // Data rows - slightly darker
  };

  if (nonEditable || !onValueChanged) {
    return <div className="rg-cell-content text-right" style={{ backgroundColor: getBackgroundColor() }}>{displayValue}</div>;
  }

  if (isFocused) {
    return (
      <input
        className="rg-cell-input text-right"
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        autoFocus
        style={{ backgroundColor: getBackgroundColor() }}
      />
    );
  }

  return <div className="rg-cell-content text-right" style={{ backgroundColor: getBackgroundColor() }}>{displayValue}</div>;
};

// Dropdown Cell Component
export interface DropdownCellProps {
  selectedValue?: string;
  values: Array<{ label: string; value: string }>;
  onValueChanged?: (newValue: string) => void;
  nonEditable?: boolean;
  placeholder?: string;
  rowIndex?: number;
}

export const DropdownCellComponent: React.FC<DropdownCellProps> = ({
  selectedValue,
  values,
  onValueChanged,
  nonEditable,
  placeholder,
  rowIndex
}) => {
  const { isFocused } = useCellContext();
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedOption = values.find(v => v.value === selectedValue);
  const displayText = selectedOption?.label || placeholder || '';

  // Determine background color based on row type
  const getBackgroundColor = () => {
    if (rowIndex === 0) return undefined; // Header
    if (rowIndex === 1) return '#ffffff'; // Filter row - white
    return '#fafafa'; // Data rows - slightly darker
  };

  if (nonEditable || !onValueChanged) {
    return <div className="rg-cell-content" style={{ backgroundColor: getBackgroundColor() }}>{displayText}</div>;
  }

  if (isFocused && isOpen) {
    return (
      <select
        className="rg-cell-input w-full"
        value={selectedValue || ''}
        onChange={(e) => {
          onValueChanged(e.target.value);
          setIsOpen(false);
        }}
        onBlur={() => setIsOpen(false)}
        autoFocus
        style={{ backgroundColor: getBackgroundColor() }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {values.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      className="rg-cell-content cursor-pointer"
      onClick={() => !nonEditable && setIsOpen(true)}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      {displayText}
    </div>
  );
};

// Date Cell Component
export interface DateCellProps {
  date?: Date;
  onDateChanged?: (newDate: Date | undefined) => void;
  nonEditable?: boolean;
  format?: Intl.DateTimeFormat;
  rowIndex?: number;
}

export const DateCellComponent: React.FC<DateCellProps> = ({
  date,
  onDateChanged,
  nonEditable,
  format,
  rowIndex
}) => {
  const { isFocused } = useCellContext();
  const [editValue, setEditValue] = React.useState(
    date ? date.toISOString().split('T')[0] : ''
  );

  React.useEffect(() => {
    setEditValue(date ? date.toISOString().split('T')[0] : '');
  }, [date]);

  const handleBlur = () => {
    if (onDateChanged) {
      const newDate = editValue ? new Date(editValue) : undefined;
      if (newDate?.getTime() !== date?.getTime()) {
        onDateChanged(newDate);
      }
    }
  };

  const displayValue = date
    ? (format ? format.format(date) : date.toLocaleDateString())
    : '';

  // Determine background color based on row type
  const getBackgroundColor = () => {
    if (rowIndex === 0) return undefined; // Header
    if (rowIndex === 1) return '#ffffff'; // Filter row - white
    return '#fafafa'; // Data rows - slightly darker
  };

  if (nonEditable || !onDateChanged) {
    return <div className="rg-cell-content" style={{ backgroundColor: getBackgroundColor() }}>{displayValue}</div>;
  }

  if (isFocused) {
    return (
      <input
        className="rg-cell-input"
        type="date"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        autoFocus
        style={{ backgroundColor: getBackgroundColor() }}
      />
    );
  }

  return <div className="rg-cell-content" style={{ backgroundColor: getBackgroundColor() }}>{displayValue}</div>;
};

// Checkbox Cell Component
export interface CheckboxCellProps {
  checked: boolean;
  onCheckedChanged?: (newChecked: boolean) => void;
  nonEditable?: boolean;
  rowIndex?: number;
}

export const CheckboxCellComponent: React.FC<CheckboxCellProps> = ({
  checked,
  onCheckedChanged,
  nonEditable,
  rowIndex
}) => {
  // Determine background color based on row type
  const getBackgroundColor = () => {
    if (rowIndex === 0) return undefined; // Header
    if (rowIndex === 1) return '#ffffff'; // Filter row - white
    return '#fafafa'; // Data rows - slightly darker
  };

  return (
    <div className="rg-cell-content flex items-center justify-center" style={{ backgroundColor: getBackgroundColor() }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !nonEditable && onCheckedChanged?.(e.target.checked)}
        disabled={nonEditable}
        className="cursor-pointer"
      />
    </div>
  );
};

// Header Cell Component
export interface HeaderCellProps {
  text: string;
  onClick?: () => void;
}

export const HeaderCellComponent: React.FC<HeaderCellProps> = ({ text, onClick }) => {
  return (
    <div
      className="rg-cell-content font-semibold cursor-pointer"
      onClick={onClick}
      style={{
        backgroundColor: '#f1f5f9',
        color: '#1e293b',
        fontWeight: '600',
      }}
    >
      {text}
    </div>
  );
};
