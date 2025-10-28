'use client';

import { ReactGrid, Cell as RGCell } from '@silevis/reactgrid';
import { useMemo, useState, useCallback, ReactNode } from 'react';
import {
  TextCellComponent,
  NumberCellComponent,
  DropdownCellComponent,
  DateCellComponent,
  CheckboxCellComponent,
  HeaderCellComponent,
  type TextCellProps,
  type NumberCellProps,
  type DropdownCellProps,
  type DateCellProps,
  type CheckboxCellProps,
  type HeaderCellProps,
} from '../lib/reactgrid-v5-cells';

// Re-export for convenience
export type { DropdownOption } from './cells/DropdownCellTemplate';

interface SpreadsheetGridProps<T = any> {
  data: T[];
  columns: GridColumn[];
  onCellValueChanged?: (rowId: string, field: string, newValue: any) => void;
  onRowClicked?: (row: T) => void;
  onCellClicked?: (row: T, field: string) => void;
  onDeleteRows?: (rowIds: string[]) => void;
  onRowsReordered?: (targetRowId: string, rowIds: string[], dropPosition: 'before' | 'after') => void;
  height?: string;
  className?: string;
  showFilter?: boolean;
  sortable?: boolean;
  reorderable?: boolean;
}

export interface GridColumn {
  field: string;
  headerName: string;
  width?: number;
  editable?: boolean;
  isEditable?: (row: any) => boolean;
  type?: 'text' | 'number' | 'date';
  cellType?: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'time' | 'autocomplete' | 'customDropdown';
  valueGetter?: (row: any) => any;
  valueFormatter?: (value: any) => string;
  cellRenderer?: (value: any, row: any) => ReactNode | string;
  filterTextGetter?: (value: any, row: any) => string;
  fixed?: boolean;
  sortable?: boolean;
  dropdownOptions?: Array<{ label: string; value: string }> | ((row: any) => Array<{ label: string; value: string }>);
  dropdownPlaceholder?: string;
  numberFormat?: Intl.NumberFormat;
  dateFormat?: Intl.DateTimeFormat;
  checkboxLabels?: {
    checkedText?: string;
    uncheckedText?: string;
  };
  valueParser?: (value: any, row: any) => any;
}

export function SpreadsheetGrid<T = any>({
  data,
  columns,
  onCellValueChanged,
  onRowClicked,
  onCellClicked,
  onDeleteRows,
  onRowsReordered,
  height = '600px',
  className = '',
  showFilter = true,
  sortable = false,
  reorderable = false,
}: SpreadsheetGridProps<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = data;

    // Apply filters
    if (Object.keys(filters).length > 0 && Object.values(filters).some(v => v)) {
      result = data.filter((item: any) => {
        return Object.entries(filters).every(([field, filterValue]) => {
          if (!filterValue) return true;

          const column = columns.find(col => col.field === field);
          const value = column?.valueGetter ? column.valueGetter(item) : item[field];

          let displayValue: string;
          if (column?.filterTextGetter) {
            displayValue = column.filterTextGetter(value, item);
          } else if (column?.valueFormatter) {
            displayValue = column.valueFormatter(value);
          } else {
            displayValue = value != null ? String(value) : '';
          }

          return displayValue.toLowerCase().includes(filterValue.toLowerCase());
        });
      });
    }

    // Apply sorting
    if (sortConfig) {
      result = [...result].sort((a: any, b: any) => {
        const column = columns.find(col => col.field === sortConfig.field);
        const aValue = column?.valueGetter ? column.valueGetter(a) : a[sortConfig.field];
        const bValue = column?.valueGetter ? column.valueGetter(b) : b[sortConfig.field];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filters, columns, sortConfig]);

  // Handle header click for sorting
  const handleHeaderClick = useCallback((field: string) => {
    if (!sortable) return;

    const column = columns.find(col => col.field === field);
    if (column && column.sortable === false) return;

    setSortConfig(prev => {
      if (!prev || prev.field !== field) {
        return { field, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { field, direction: 'desc' };
      }
      return null;
    });
  }, [sortable, columns]);

  // Create cells array for ReactGrid 5
  const cells: RGCell[] = useMemo(() => {
    const cellsArray: RGCell[] = [];
    let rowIndex = 0;

    // Header row
    columns.forEach((col, colIndex) => {
      let headerText = col.headerName;
      if (sortable && col.sortable !== false && sortConfig?.field === col.field) {
        headerText += sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
      }

      cellsArray.push({
        rowIndex: 0,
        colIndex,
        Template: HeaderCellComponent,
        props: {
          text: headerText,
          onClick: () => handleHeaderClick(col.field),
        } as HeaderCellProps,
      });
    });
    rowIndex++;

    // Filter row
    if (showFilter) {
      columns.forEach((col, colIndex) => {
        cellsArray.push({
          rowIndex: 1,
          colIndex,
          Template: TextCellComponent,
          props: {
            text: filters[col.field] || '',
            placeholder: 'Filtrera...',
            onTextChanged: (newText: string) => {
              setFilters(prev => ({ ...prev, [col.field]: newText }));
            },
          } as TextCellProps,
        });
      });
      rowIndex++;
    }

    // Data rows
    filteredData.forEach((item: any, dataIdx) => {
      const currentRowIndex = rowIndex + dataIdx;

      columns.forEach((col, colIndex) => {
        const value = col.valueGetter ? col.valueGetter(item) : item[col.field];
        const baseEditable = col.editable !== false;
        const isEditable = baseEditable && (col.isEditable ? col.isEditable(item) : true);
        const cellType = col.cellType ?? col.type ?? 'text';
        const rowId = (item as any).id || `row-${dataIdx}`;

        let cellProps: any = {};

        if (col.cellRenderer) {
          const rendered = col.cellRenderer(value, item);
          cellProps = {
            text: typeof rendered === 'string' ? rendered : (value != null ? String(value) : ''),
            nonEditable: true,
            renderer: typeof rendered === 'string' ? undefined : () => rendered,
          };

          cellsArray.push({
            rowIndex: currentRowIndex,
            colIndex,
            Template: TextCellComponent,
            props: cellProps as TextCellProps,
          });
        } else if (cellType === 'number') {
          const numericValue =
            typeof value === 'number'
              ? value
              : value != null
                ? Number(String(value).replace(/\s/g, '').replace(',', '.'))
                : 0;

          cellProps = {
            value: Number.isFinite(numericValue) ? numericValue : 0,
            nonEditable: !isEditable,
            format: col.numberFormat,
            onValueChanged: isEditable
              ? (newValue: number) => onCellValueChanged?.(rowId, col.field, newValue)
              : undefined,
          };

          cellsArray.push({
            rowIndex: currentRowIndex,
            colIndex,
            Template: NumberCellComponent,
            props: cellProps as NumberCellProps,
          });
        } else if (cellType === 'date') {
          cellProps = {
            date: value ? new Date(value) : undefined,
            nonEditable: !isEditable,
            format: col.dateFormat,
            onDateChanged: isEditable
              ? (newDate: Date | undefined) => onCellValueChanged?.(rowId, col.field, newDate)
              : undefined,
          };

          cellsArray.push({
            rowIndex: currentRowIndex,
            colIndex,
            Template: DateCellComponent,
            props: cellProps as DateCellProps,
          });
        } else if (cellType === 'dropdown' || cellType === 'customDropdown') {
          const optionsSource = col.dropdownOptions;
          const options = (() => {
            if (!optionsSource) return [];
            if (typeof optionsSource === 'function') {
              return optionsSource(item) ?? [];
            }
            return optionsSource;
          })();

          cellProps = {
            selectedValue: value != null ? String(value) : undefined,
            values: options,
            nonEditable: !isEditable,
            placeholder: col.dropdownPlaceholder,
            onValueChanged: isEditable
              ? (newValue: string) => onCellValueChanged?.(rowId, col.field, newValue)
              : undefined,
          };

          cellsArray.push({
            rowIndex: currentRowIndex,
            colIndex,
            Template: DropdownCellComponent,
            props: cellProps as DropdownCellProps,
          });
        } else if (cellType === 'checkbox') {
          cellProps = {
            checked: Boolean(value),
            nonEditable: !isEditable,
            onCheckedChanged: isEditable
              ? (newChecked: boolean) => onCellValueChanged?.(rowId, col.field, newChecked)
              : undefined,
          };

          cellsArray.push({
            rowIndex: currentRowIndex,
            colIndex,
            Template: CheckboxCellComponent,
            props: cellProps as CheckboxCellProps,
          });
        } else {
          // Default to text
          const textValue = col.valueFormatter ? col.valueFormatter(value) : (value != null ? String(value) : '');

          cellProps = {
            text: textValue,
            nonEditable: !isEditable,
            onTextChanged: isEditable
              ? (newText: string) => onCellValueChanged?.(rowId, col.field, newText)
              : undefined,
          };

          cellsArray.push({
            rowIndex: currentRowIndex,
            colIndex,
            Template: TextCellComponent,
            props: cellProps as TextCellProps,
          });
        }
      });
    });

    return cellsArray;
  }, [columns, filteredData, filters, sortConfig, sortable, showFilter, handleHeaderClick, onCellValueChanged]);

  return (
    <div className={className} style={{ height, width: '100%' }}>
      <ReactGrid cells={cells} />
    </div>
  );
}
