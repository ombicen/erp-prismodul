'use client';

import { ReactGrid, Column, Row, CellChange, TextCell, NumberCell, DateCell } from '@silevis/reactgrid';
import '@silevis/reactgrid/styles.css';
import { useMemo, useState, useCallback, ReactNode, useEffect, useRef } from 'react';

interface SpreadsheetGridProps<T = any> {
  data: T[];
  columns: GridColumn[];
  onCellValueChanged?: (rowId: string, field: string, newValue: any) => void;
  onRowClicked?: (row: T) => void;
  onCellClicked?: (row: T, field: string) => void;
  height?: string;
  className?: string;
  showFilter?: boolean; // Toggle filter row visibility
}

export interface GridColumn {
  field: string;
  headerName: string;
  width?: number;
  editable?: boolean;
  type?: 'text' | 'number' | 'date';
  valueFormatter?: (value: any) => string;
  // Can return string for plain rendering or ReactNode for custom UI (e.g., badges)
  cellRenderer?: (value: any, row: any) => ReactNode | string;
  // Optional text provider used for filtering when using a ReactNode renderer
  filterTextGetter?: (value: any, row: any) => string;
  // If true, column keeps fixed width and is excluded from proportional growth
  fixed?: boolean;
}

export function SpreadsheetGrid<T = any>({
  data,
  columns,
  onCellValueChanged,
  onRowClicked,
  onCellClicked,
  height = '600px',
  className = '',
  showFilter = true, // Default to showing filter
}: SpreadsheetGridProps<T>) {

  // State to track filter values for each column
  const [filters, setFilters] = useState<Record<string, string>>({});

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

  // Create header row
  const headerRow: Row = useMemo(() => ({
    rowId: 'header',
    height: 48,
    cells: columns.map(col => ({
      type: 'header',
      text: col.headerName,
    })),
  }), [columns]);

  // Create filter row
  const filterRow: Row = useMemo(() => ({
    rowId: 'filter',
    height: 42,
    cells: columns.map(col => ({
      type: 'text',
      text: filters[col.field] || '',
      placeholder: `Filter...`,
    } as TextCell)),
  }), [columns, filters]);

  // Filter the data based on filter values
  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0 || Object.values(filters).every(v => !v)) {
      return data;
    }

    return data.filter((item: any) => {
      return Object.entries(filters).every(([field, filterValue]) => {
        if (!filterValue) return true;

        const column = columns.find(col => col.field === field);
        const value = item[field];

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
  }, [data, filters, columns]);

  // Convert data rows to ReactGrid format
  const dataRows: Row[] = useMemo(() => {
    return filteredData.map((item: any, idx) => ({
      rowId: item.id || `row-${idx}`,
      height: 42,
      cells: columns.map(col => {
        const value = item[col.field];
        const isEditable = col.editable !== false;

        // Handle custom cell renderer
        if (col.cellRenderer) {
          const rendered = col.cellRenderer(value, item);
          if (typeof rendered === 'string') {
            return {
              type: 'text',
              text: rendered,
              nonEditable: true,
            } as TextCell;
          }

          const fallbackText = col.valueFormatter
            ? col.valueFormatter(value)
            : value != null
              ? String(value)
              : '';

          return {
            type: 'text',
            text: fallbackText,
            renderer: (_text: string) => rendered as ReactNode,
            nonEditable: true,
          } as TextCell;
        }

        // Handle value formatter
        const displayValue = col.valueFormatter ? col.valueFormatter(value) : value;

        // Determine cell type
        const cellType = col.type || 'text';

        if (cellType === 'number') {
          return {
            type: 'number',
            value: value != null ? Number(value) : 0,
            nonEditable: !isEditable,
          } as NumberCell;
        }

        if (cellType === 'date') {
          return {
            type: 'date',
            date: value ? new Date(value) : undefined,
            nonEditable: !isEditable,
          } as DateCell;
        }

        // Default to text cell
        return {
          type: 'text',
          text: displayValue != null ? String(displayValue) : '',
          nonEditable: !isEditable,
        } as TextCell;
      }),
    }));
  }, [filteredData, columns]);

  // Combine all rows
  const rows: Row[] = useMemo(() => {
    return showFilter ? [headerRow, filterRow, ...dataRows] : [headerRow, ...dataRows];
  }, [headerRow, filterRow, dataRows, showFilter]);

  // Handle cell changes
  const handleChanges = useCallback((changes: CellChange[]) => {
    changes.forEach(change => {
      const rowId = change.rowId as string;
      const columnId = change.columnId as string;
      const newCell = change.newCell;

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

      // Handle data cell changes
      if (onCellValueChanged) {
        let newValue: any;
        if (newCell.type === 'text') {
          newValue = (newCell as TextCell).text;
        } else if (newCell.type === 'number') {
          newValue = (newCell as NumberCell).value;
        } else if (newCell.type === 'date') {
          newValue = (newCell as DateCell).date;
        }

        onCellValueChanged(rowId, columnId, newValue);
      }
    });
  }, [onCellValueChanged]);

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
  }, [onRowClicked, onCellClicked, filteredData, columns, showFilter]);

  return (
    <div ref={containerRef} className={className} style={{ height, width: '100%', overflow: 'auto' }}>
      <ReactGrid
        rows={rows}
        columns={gridColumns}
        onCellsChanged={handleChanges}
        onColumnResized={(columnId, width) => {
          const id = String(columnId);
          setColumnWidths(prev => ({ ...prev, [id]: width }));
        }}
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
