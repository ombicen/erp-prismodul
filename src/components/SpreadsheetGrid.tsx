'use client';

import {
  ReactGrid,
  Column,
  Row,
  CellChange,
  TextCell,
  NumberCell,
  DateCell,
  DropdownCell,
  CheckboxCell,
  OptionType,
  DefaultCellTypes,
  Id,
  DropPosition,
} from '@silevis/reactgrid';
import '@silevis/reactgrid/styles.css';
import { useMemo, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import {
  AutocompleteCell,
  AutocompleteCellTemplate,
  AutocompleteOption,
} from './cells/AutocompleteCellTemplate';
import {
  CustomDropdownCell,
  DropdownCellTemplate,
  type DropdownOption,
} from './cells/DropdownCellTemplate';

// Re-export for convenience
export type { DropdownOption };

interface SpreadsheetGridProps<T = any> {
  data: T[];
  columns: GridColumn[];
  onCellValueChanged?: (rowId: string, field: string, newValue: any) => void;
  onRowClicked?: (row: T) => void;
  onCellClicked?: (row: T, field: string) => void;
  onDeleteRows?: (rowIds: string[]) => void; // Called when Delete key is pressed with selected rows
  onRowsReordered?: (targetRowId: string, rowIds: string[], dropPosition: 'before' | 'after') => void; // Called when rows are reordered via drag & drop
  height?: string;
  className?: string;
  showFilter?: boolean; // Toggle filter row visibility
  sortable?: boolean; // Enable column sorting
  reorderable?: boolean; // Enable row reordering via drag & drop
}

export interface GridColumn {
  field: string;
  headerName: string;
  width?: number;
  editable?: boolean;
  isEditable?: (row: any) => boolean;
  type?: 'text' | 'number' | 'date'; // legacy
  cellType?: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'time' | 'autocomplete' | 'customDropdown';
  valueGetter?: (row: any) => any; // Extract value from row (useful for nested properties)
  valueFormatter?: (value: any) => string;
  // Can return string for plain rendering or ReactNode for custom UI (e.g., badges)
  cellRenderer?: (value: any, row: any) => ReactNode | string;
  // Optional text provider used for filtering when using a ReactNode renderer
  filterTextGetter?: (value: any, row: any) => string;
  // If true, column keeps fixed width and is excluded from proportional growth
  fixed?: boolean;
  sortable?: boolean; // If false, column won't be sortable even if grid sortable is true
  dropdownOptions?: OptionType[] | ((row: any) => OptionType[]);
  dropdownPlaceholder?: string;
  numberFormat?: Intl.NumberFormat;
  dateFormat?: Intl.DateTimeFormat;
  checkboxLabels?: {
    checkedText?: string;
    uncheckedText?: string;
  };
  valueParser?: (cell: DefaultCellTypes | AutocompleteCell, row: any) => any;
  autocompleteOptions?: AutocompleteOption[] | ((row: any) => AutocompleteOption[]);
  autocompletePlaceholder?: string;
  autocompleteCreateLabel?: string;
  onCreateAutocompleteOption?: (input: string, row: any) => Promise<AutocompleteOption | null>;
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
  showFilter = true, // Default to showing filter
  sortable = false, // Default to not sortable
  reorderable = false, // Default to not reorderable
}: SpreadsheetGridProps<T>) {

  // State to track filter values for each column
  const [filters, setFilters] = useState<Record<string, string>>({});

  // State to track dropdown isOpen state per row and field
  const [dropdownStates, setDropdownStates] = useState<Record<string, Record<string, boolean>>>({});

  // State to track sort configuration
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);

  // Track and persist column widths (resizable)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const c of columns) map[c.field] = c.width ?? 150;
    return map;
  });

  // Sync widths when columns change (add/remove)
  useEffect(() => {
    setColumnWidths(prev => {
      const next: Record<string, number> = { ...prev };
      for (const c of columns) {
        if (next[c.field] == null) next[c.field] = c.width ?? 150;
      }
      for (const key of Object.keys(next)) {
        if (!columns.find(c => c.field === key)) delete (next as any)[key];
      }
      return next;
    });
  }, [columns]);

  // Ensure grid fits container width by expanding the last column when needed
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const widthsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      // Subtract 1px to avoid oscillation due to borders
      setContainerWidth(el.clientWidth);
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Keep a ref with the latest column widths to avoid effect dependency loops
  useEffect(() => {
    widthsRef.current = columnWidths;
  }, [columnWidths]);

  useEffect(() => {
    if (!containerWidth || columns.length === 0) return;

    const current = widthsRef.current;
    const currentWidths = columns.map(c => ({
      field: c.field,
      width: (current[c.field] ?? c.width ?? 150),
      fixed: c.fixed === true || c.field === 'status' || c.field === 'sync_status',
    }));

    // Add a small tolerance so scrollbar appearance doesn't cause oscillation
    const targetWidth = Math.max(0, Math.floor(containerWidth) - 4);
    const total = currentWidths.reduce((sum, c) => sum + c.width, 0);
    const extra = Math.floor(targetWidth - total);
    if (extra <= 0) return;

    const flexCols = currentWidths.filter(c => !c.fixed);
    if (flexCols.length === 0) return;

    const flexTotal = flexCols.reduce((sum, c) => sum + c.width, 0) || 1;

    // Compute new widths without committing, to detect no-op and prevent loops
    let remaining = extra;
    const proposed: Record<string, number> = { ...current };
    flexCols.forEach((c, idx) => {
      const isLast = idx === flexCols.length - 1;
      const add = isLast ? remaining : Math.floor((extra * c.width) / flexTotal);
      remaining -= isLast ? remaining : add;
      proposed[c.field] = (proposed[c.field] ?? c.width) + Math.max(0, add);
    });

    // Only update if something actually changed
    const changed = columns.some(c => (proposed[c.field] ?? 0) !== (current[c.field] ?? c.width ?? 150));
    if (!changed) return;

    setColumnWidths(proposed);
  }, [containerWidth, columns]);

  // Convert column definitions to ReactGrid format
  const gridColumns: Column[] = useMemo(() => {
    return columns.map(col => ({
      columnId: col.field,
      width: columnWidths[col.field] ?? col.width ?? 150,
      resizable: true,
      reorderable: true,
    }));
  }, [columns, columnWidths]);

  // Handler for column header clicks (sorting)
  const handleHeaderClick = useCallback((columnId: string) => {
    if (!sortable) return;

    const column = columns.find(col => col.field === columnId);
    if (column && column.sortable === false) return;

    setSortConfig(prev => {
      if (!prev || prev.field !== columnId) {
        return { field: columnId, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { field: columnId, direction: 'desc' };
      }
      return null; // Remove sort
    });
  }, [sortable, columns]);

  // Create header row
  const headerRow: Row = useMemo(() => ({
    rowId: 'header',
    height: 48,
    cells: columns.map(col => {
      let headerText = col.headerName;

      // Add sort indicator if sortable
      if (sortable && col.sortable !== false && sortConfig?.field === col.field) {
        headerText += sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
      }

      return {
        type: 'header',
        text: headerText,
      };
    }),
  }), [columns, sortable, sortConfig]);

  // Create filter row
  const filterRow: Row = useMemo(() => ({
    rowId: 'filter',
    height: 42,
    cells: columns.map(col => ({
      type: 'text',
      text: filters[col.field] || '',
      placeholder: `Filtrera...`,
    } as TextCell)),
  }), [columns, filters]);

  // Filter and sort the data
const filteredData = useMemo(() => {
    // First, apply filters
    let result = data;

    if (Object.keys(filters).length > 0 && Object.values(filters).some(v => v)) {
      result = data.filter((item: any) => {
        return Object.entries(filters).every(([field, filterValue]) => {
          if (!filterValue) return true;

          const column = columns.find(col => col.field === field);
          const value = column?.valueGetter ? column.valueGetter(item) : item[field];

          // Get display text for filtering (prefer explicit filterTextGetter, then valueFormatter)
          let displayValue: string;
          if (column?.filterTextGetter) {
            displayValue = column.filterTextGetter(value, item);
          } else if (column?.valueFormatter) {
            displayValue = column.valueFormatter(value);
          } else {
            displayValue = value != null ? String(value) : '';
          }

          // Case-insensitive partial match
          return displayValue.toLowerCase().includes(filterValue.toLowerCase());
        });
      });
    }

    // Then, apply sorting if enabled
    if (sortConfig) {
      const column = columns.find(col => col.field === sortConfig.field);
      result = [...result].sort((a: any, b: any) => {
        const aValue = column?.valueGetter ? column.valueGetter(a) : a[sortConfig.field];
        const bValue = column?.valueGetter ? column.valueGetter(b) : b[sortConfig.field];

        // Handle null/undefined
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        // Compare values
        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
}, [data, filters, columns, sortConfig]);

// Convert data rows to ReactGrid format
const dataRows: Row[] = useMemo(() => {
    return filteredData.map((item: any, idx) => {
      const rowId = item.id || `row-${idx}`;

      const cells = columns.map(col => {
        // Use valueGetter if provided, otherwise get value from field
        const value = col.valueGetter ? col.valueGetter(item) : item[col.field];
        const baseEditable = col.editable !== false;
        const isEditable = baseEditable && (col.isEditable ? col.isEditable(item) : true);
        const cellType = col.cellType ?? col.type ?? 'text';

        if (col.cellRenderer) {
          const rendered = col.cellRenderer(value, item);

          if (typeof rendered === 'string') {
            return {
              type: 'text',
              text: rendered,
              nonEditable: true,
            } as TextCell;
          }

          const rawText = value != null ? String(value) : '';
          const formatted = col.valueFormatter ? col.valueFormatter(value) : rawText;

          return {
            type: 'text',
            text: formatted,
            renderer: (_text: string) => rendered as ReactNode,
            nonEditable: true,
          } as TextCell;
        }

        if (cellType === 'number') {
          const numericValue =
            typeof value === 'number'
              ? value
              : value != null
                ? Number(String(value).replace(/\s/g, '').replace(',', '.'))
                : 0;

          const numberCell: NumberCell = {
            type: 'number',
            value: Number.isFinite(numericValue) ? numericValue : 0,
            nonEditable: !isEditable,
          };

          if (col.numberFormat) {
            numberCell.format = col.numberFormat;
          }

          return numberCell;
        }

        if (cellType === 'date') {
          const dateCell: DateCell = {
            type: 'date',
            date: value ? new Date(value) : undefined,
            nonEditable: !isEditable,
          };

          if (col.dateFormat) {
            dateCell.format = col.dateFormat;
          }

          return dateCell;
        }

        if (cellType === 'dropdown') {
          const optionsSource = col.dropdownOptions;
          const options: OptionType[] = (() => {
            if (!optionsSource) return [];
            if (typeof optionsSource === 'function') {
              return optionsSource(item) ?? [];
            }
            return optionsSource;
          })();

          const selectedValue = value != null ? String(value) : undefined;

          // Check if this row has an isOpen state for this field from internal state
          const rowId = (item as any).id || `row-${idx}`;
          const isOpen = dropdownStates[rowId]?.[col.field] || false;

          const dropdownCell: DropdownCell = {
            type: 'dropdown',
            selectedValue: selectedValue,
            inputValue: selectedValue || '',
            isOpen: isOpen,
            values: options,
            isDisabled: false,
            nonEditable: !isEditable,
          };

          return dropdownCell;
        }

        if (cellType === 'checkbox') {
          const checkboxCell: CheckboxCell = {
            type: 'checkbox',
            checked: Boolean(value),
            nonEditable: !isEditable,
          };

          if (col.checkboxLabels) {
            checkboxCell.checkedText = col.checkboxLabels.checkedText;
            checkboxCell.uncheckedText = col.checkboxLabels.uncheckedText;
          }

          return checkboxCell;
        }

        if (cellType === 'autocomplete') {
          const optionsSource = col.autocompleteOptions;
          const options: AutocompleteOption[] = (() => {
            if (!optionsSource) return [];
            if (typeof optionsSource === 'function') {
              return optionsSource(item);
            }
            return optionsSource;
          })();

          const selectedValue = value != null ? String(value) : undefined;
          const displayOption = options.find(option => option.value === selectedValue);
          const textValue = displayOption?.label ?? (value != null ? String(value) : '');

          const autocompleteCell: AutocompleteCell = {
            type: 'autocomplete',
            text: textValue,
            value: 0,
            selectedValue,
            options,
            placeholder: col.autocompletePlaceholder,
            allowCreate: Boolean(col.onCreateAutocompleteOption && isEditable),
            createOptionLabel: col.autocompleteCreateLabel,
            onCreateOption: col.onCreateAutocompleteOption
              ? async (input: string) => (col.onCreateAutocompleteOption?.(input, item) ?? null)
              : undefined,
            isDisabled: !isEditable,
            nonEditable: !isEditable,
          };

          return autocompleteCell;
        }

        if (cellType === 'customDropdown') {
          const optionsSource = col.dropdownOptions;
          const options: DropdownOption[] = (() => {
            if (!optionsSource) return [];
            if (typeof optionsSource === 'function') {
              return optionsSource(item) ?? [];
            }
            return optionsSource as DropdownOption[];
          })();

          const selectedValue = value != null ? String(value) : undefined;

          // Find the display text for the selected value
          const selectedOption = options.find(opt => opt.value === selectedValue);
          const displayText = selectedOption ? selectedOption.label : (selectedValue || '');

          // Check for isOpen state
          const rowId = (item as any).id || `row-${idx}`;
          const isOpen = dropdownStates[rowId]?.[col.field] || false;

          const customDropdownCell: CustomDropdownCell = {
            type: 'customDropdown',
            selectedValue,
            options,
            isDisabled: !isEditable,
            placeholder: col.dropdownPlaceholder || '',
            text: displayText,
            value: parseFloat(selectedValue || '0'),
            isOpen,
          };

          return customDropdownCell;
        }

        const rawText = value != null ? String(value) : '';
        const formatted = col.valueFormatter ? col.valueFormatter(value) : rawText;

        const textCell: TextCell = {
          type: 'text',
          text: isEditable ? rawText : formatted,
          placeholder: isEditable && !rawText && formatted ? formatted : undefined,
          nonEditable: !isEditable,
        };

        return textCell;
      });

      return {
        rowId,
        height: 32,
        cells: cells as any, // Cast to any to allow custom cell types
      };
    });
  }, [filteredData, columns, dropdownStates]);

  // Combine all rows
  const rows: Row[] = useMemo(() => {
    return showFilter ? [headerRow, filterRow, ...dataRows] : [headerRow, ...dataRows];
  }, [headerRow, filterRow, dataRows, showFilter]);

  const autocompleteTemplate = useMemo(() => {
    const template = new AutocompleteCellTemplate();
    return template;
  }, []);

  const dropdownTemplate = useMemo(() => {
    const template = new DropdownCellTemplate();
    return template;
  }, []);

  // Handle cell changes
  const handleChanges = useCallback(
    (changes: CellChange[]) => {
      // First, detect if this is a row deletion operation
      // This happens when Delete key is pressed with row(s) selected
      // We'll see multiple cells from the same row being cleared
      const rowChanges = new Map<string, CellChange[]>();

      changes.forEach(change => {
        const rowId = change.rowId as string;
        if (rowId !== 'header' && rowId !== 'filter') {
          if (!rowChanges.has(rowId)) {
            rowChanges.set(rowId, []);
          }
          rowChanges.get(rowId)!.push(change);
        }
      });

      // Check if this looks like a row deletion (multiple cells cleared in same row)
      const potentialDeletionRows: string[] = [];

      rowChanges.forEach((rowChangesList, rowId) => {
        // For a true deletion, we expect changes to MOST editable columns in the row
        // A single cell edit will only have 1-2 changes
        // Get the number of editable columns
        const editableColumnsCount = columns.filter(col => col.editable !== false).length;

        console.log('Row deletion check:', {
          rowId,
          changesCount: rowChangesList.length,
          editableColumnsCount,
          threshold: Math.max(3, Math.floor(editableColumnsCount * 0.5)),
        });

        // If we have changes for at least 50% of editable columns, and they're all being cleared
        if (rowChangesList.length >= Math.max(3, Math.floor(editableColumnsCount * 0.5))) {
          const allCleared = rowChangesList.every(change => {
            const newCell = change.newCell as any;

            console.log('Checking cell:', {
              col: change.columnId,
              type: newCell.type,
              text: newCell.text,
              value: newCell.value,
              isDropdown: newCell.type === 'customDropdown' || newCell.type === 'dropdown'
            });

            // Ignore dropdown cells - they shouldn't prevent deletion
            if (newCell.type === 'customDropdown' || newCell.type === 'dropdown') {
              console.log('  -> Ignoring dropdown cell');
              return true; // Don't block deletion based on dropdown values
            }

            // Check if the new value is empty/null/undefined for other cell types
            if (newCell.type === 'text') {
              const text = (newCell as TextCell).text;
              const result = text === '' || text === null || text === undefined;
              console.log('  -> Text cell cleared?', result, 'text value:', text);
              return result;
            }
            if (newCell.type === 'number') {
              const num = (newCell as NumberCell).value;
              const result = num === 0 || num === null || num === undefined || Number.isNaN(num);
              console.log('  -> Number cell cleared?', result, 'num value:', num);
              return result;
            }

            // For unknown cell types, don't consider them as cleared
            console.log('  -> Unknown cell type, returning false');
            return false;
          });

          console.log('All cleared?', allCleared, rowChangesList.map(c => ({
            col: c.columnId,
            type: (c.newCell as any).type,
            value: (c.newCell as any).text || (c.newCell as any).value || (c.newCell as any).selectedValue
          })));

          if (allCleared) {
            potentialDeletionRows.push(rowId);
          }
        }
      });

      // If we detected potential row deletions and have the callback, trigger it
      if (potentialDeletionRows.length > 0 && onDeleteRows) {
        console.log('Triggering deletion for rows:', potentialDeletionRows);
        onDeleteRows(potentialDeletionRows);
        return; // Don't process individual cell changes
      }

      // Otherwise, process as normal cell updates
      changes.forEach(change => {
        const rowId = change.rowId as string;
        const columnId = change.columnId as string;
        const newCell = change.newCell as DefaultCellTypes;

        // Handle filter row changes
        if (rowId === 'filter') {
          if (newCell.type === 'text') {
            const filterValue = (newCell as TextCell).text;
            setFilters(prev => ({
              ...prev,
              [columnId]: filterValue,
            }));
          }
          return;
        }

        // Skip header row
        if (rowId === 'header') return;

        const column = columns.find(col => col.field === columnId);
        const rowData =
          filteredData.find((item: any, idx: number) => (item.id || `row-${idx}`) === rowId) ?? null;

        // Handle dropdown isOpen state changes
        if (newCell.type === 'dropdown') {
          const dropdownCell = newCell as DropdownCell;

          // Update the isOpen state in internal state
          setDropdownStates(prev => ({
            ...prev,
            [rowId]: {
              ...(prev[rowId] || {}),
              [columnId]: dropdownCell.isOpen ?? false,
            },
          }));

          // Only trigger onCellValueChanged if the value actually changed
          if (onCellValueChanged) {
            const oldValue = rowData ? (rowData as any)[columnId] : null;
            const newValue = dropdownCell.inputValue ?? dropdownCell.selectedValue ?? null;

            if (oldValue !== newValue) {
              onCellValueChanged(rowId, columnId, newValue);
            }
          }
          return;
        }

        if (!onCellValueChanged) return;

        let newValue: any;

        // Handle custom cell types first (use type assertion to check)
        const cellType = (newCell as any).type;

        if (cellType === 'autocomplete') {
          const autoCell = newCell as unknown as AutocompleteCell;
          newValue = autoCell.selectedValue ?? autoCell.text ?? null;
        } else if (cellType === 'customDropdown') {
          const dropdownCell = newCell as unknown as CustomDropdownCell;

          // Update the isOpen state
          setDropdownStates(prev => ({
            ...prev,
            [rowId]: {
              ...prev[rowId],
              [columnId]: dropdownCell.isOpen ?? false,
            },
          }));

          // Only trigger onCellValueChanged if the value actually changed
          if (onCellValueChanged) {
            const oldValue = rowData ? (rowData as any)[columnId] : null;
            const newDropdownValue = dropdownCell.selectedValue ?? null;

            if (oldValue !== newDropdownValue) {
              newValue = newDropdownValue;
              onCellValueChanged(rowId, columnId, newValue);
            }
          }
          return;
        } else {
          // Handle standard ReactGrid cell types
          switch (newCell.type) {
            case 'text':
              newValue = (newCell as TextCell).text;
              break;
            case 'number':
              newValue = (newCell as NumberCell).value;
              break;
            case 'date': {
              const dateValue = (newCell as DateCell).date;
              newValue = dateValue ? dateValue.toISOString() : null;
              break;
            }
            case 'checkbox':
              newValue = (newCell as CheckboxCell).checked;
              break;
            default:
              newValue = (newCell as any).text ?? null;
          }
        }

        if (column?.valueParser) {
          try {
            newValue = column.valueParser(newCell, rowData);
          } catch (error) {
            console.error('SpreadsheetGrid: valueParser threw an error', error);
          }
        }

        onCellValueChanged(rowId, columnId, newValue);
      });
    },
    [columns, filteredData, onCellValueChanged, onDeleteRows],
  );

  // Handle row reordering
  const handleRowsReorder = useCallback(
    (targetRowId: Id, rowIds: Id[], dropPosition: DropPosition) => {
      if (!onRowsReordered) return;
      // Convert Id to string and DropPosition to 'before' | 'after'
      const targetId = String(targetRowId);
      const ids = rowIds.map(id => String(id));
      const position = dropPosition === 'before' || dropPosition === 'after' ? dropPosition : 'after';
      onRowsReordered(targetId, ids, position);
    },
    [onRowsReordered]
  );

  // Handle row/cell clicks
  useEffect(() => {
    if (!onRowClicked && !onCellClicked) {
      console.log('SpreadsheetGrid: No click handlers provided');
      return;
    }

    console.log('SpreadsheetGrid: Setting up click handler');

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      console.log('SpreadsheetGrid: Click detected', target);

      // ReactGrid uses absolutely positioned cells, not row elements
      const cell = target.closest('.rg-cell');
      if (!cell) {
        console.log('SpreadsheetGrid: Not a cell click');
        return;
      }

      // Get the row and column indices from the cell's data attributes
      const rowIdx = cell.getAttribute('data-cell-rowidx');
      const colIdx = cell.getAttribute('data-cell-colidx');

      if (!rowIdx) {
        console.log('SpreadsheetGrid: No row index found');
        return;
      }

      const rowIndex = parseInt(rowIdx, 10);
      const colIndex = colIdx ? parseInt(colIdx, 10) : -1;
      console.log('SpreadsheetGrid: Row index:', rowIndex, 'Col index:', colIndex);

      // Check if this is a header row click for sorting
      if (rowIndex === 0 && sortable && colIndex >= 0 && colIndex < columns.length) {
        console.log('SpreadsheetGrid: Header click for sorting');
        handleHeaderClick(columns[colIndex].field);
        return;
      }

      // Skip header row (and filter row if present)
      const headerRowCount = showFilter ? 2 : 1;
      if (rowIndex < headerRowCount) {
        console.log('SpreadsheetGrid: Header or filter row, skipping');
        return;
      }

      // Calculate data index (subtract header rows)
      const dataIndex = rowIndex - headerRowCount;
      console.log('SpreadsheetGrid: Data index:', dataIndex, 'Total rows:', filteredData.length);

      if (dataIndex >= 0 && dataIndex < filteredData.length) {
        const rowData = filteredData[dataIndex];

        // If onCellClicked is provided and we have a valid column index, call it
        if (onCellClicked && colIndex >= 0 && colIndex < columns.length) {
          const fieldName = columns[colIndex].field;
          const columnDef = columns[colIndex];
          const cellType = columnDef.cellType ?? columnDef.type;
          if (cellType === 'dropdown' || cellType === 'autocomplete') {
            console.log('SpreadsheetGrid: Dropdown/autocomplete cell click intercepted');
            return;
          }
          console.log('SpreadsheetGrid: Calling onCellClicked with field:', fieldName);
          onCellClicked(rowData, fieldName);
        } else if (onRowClicked) {
          // Otherwise fall back to onRowClicked
          console.log('SpreadsheetGrid: Calling onRowClicked with:', rowData);
          onRowClicked(rowData);
        }
      }
    };

    const container = containerRef.current;
    console.log('SpreadsheetGrid: Container found:', !!container);
    if (container) {
      container.addEventListener('click', handleClick as EventListener);
      return () => container.removeEventListener('click', handleClick as EventListener);
    }
  }, [onRowClicked, onCellClicked, filteredData, columns, showFilter, sortable, handleHeaderClick]);

  return (
    <div ref={containerRef} className={className} style={{ height, width: '100%'}}>
      <ReactGrid
        rows={rows}
        columns={gridColumns}
        customCellTemplates={{
          autocomplete: autocompleteTemplate,
          customDropdown: dropdownTemplate
        }}
        onCellsChanged={handleChanges}
        onColumnResized={(columnId, width) => {
          const id = String(columnId);
          setColumnWidths(prev => ({ ...prev, [id]: width }));
        }}
        onRowsReordered={reorderable ? handleRowsReorder : undefined}
        minColumnWidth={60}
        enableRangeSelection
        enableFillHandle
        enableRowSelection
        enableColumnSelection
        stickyTopRows={showFilter ? 2 : 1}
        stickyLeftColumns={0}
      />
    </div>
  );
}
