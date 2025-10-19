import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  editable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T, index: number) => void;
  selectedIndex?: number;
  onCellEdit?: (rowIndex: number, columnKey: string, value: any) => void;
  filterRow?: boolean;
  keyExtractor: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  selectedIndex,
  onCellEdit,
  filterRow = true,
  keyExtractor,
}: DataTableProps<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleSort = (columnKey: string) => {
    const column = columns.find(c => c.key === columnKey);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (!current || current.key !== columnKey) {
        return { key: columnKey, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key: columnKey, direction: 'desc' };
      }
      return null;
    });
  };

  const handleCellDoubleClick = (rowIndex: number, columnKey: string, currentValue: any) => {
    const column = columns.find(c => c.key === columnKey);
    if (!column?.editable) return;

    setEditingCell({ row: rowIndex, col: columnKey });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellSave = () => {
    if (editingCell && onCellEdit) {
      onCellEdit(editingCell.row, editingCell.col, editValue);
    }
    setEditingCell(null);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const filteredData = data.filter(row => {
    return Object.entries(filters).every(([key, filterValue]) => {
      if (!filterValue) return true;
      const cellValue = (row as any)[key];
      return cellValue?.toString().toLowerCase().includes(filterValue.toLowerCase());
    });
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;

    const aVal = (a as any)[sortConfig.key];
    const bVal = (b as any)[sortConfig.key];

    if (aVal === bVal) return 0;

    const comparison = aVal < bVal ? -1 : 1;
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="overflow-auto flex-1">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-100 border-b-2 border-slate-300">
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`px-3 py-2 text-xs font-semibold text-slate-700 border-r border-slate-200 last:border-r-0 ${
                    column.sortable ? 'cursor-pointer hover:bg-slate-200' : ''
                  }`}
                  style={{ width: column.width, textAlign: column.align || 'left' }}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.label}</span>
                    {sortConfig?.key === column.key && (
                      <span className="text-[10px]">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
            {filterRow && (
              <tr className="bg-slate-50 border-b border-slate-200">
                {columns.map(column => (
                  <th key={column.key} className="px-1 py-1 border-r border-slate-200 last:border-r-0">
                    {column.filterable !== false && (
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filter..."
                          className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          value={filters[column.key] || ''}
                          onChange={e => setFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
                        />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                className={`border-b border-slate-200 hover:bg-blue-50 cursor-pointer transition-colors ${
                  selectedIndex === rowIndex ? 'bg-blue-100' : ''
                }`}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {columns.map(column => {
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === column.key;
                  const cellValue = (row as any)[column.key];

                  return (
                    <td
                      key={column.key}
                      className={`px-3 py-2 text-sm border-r border-slate-100 last:border-r-0 ${
                        column.editable ? 'hover:bg-yellow-50' : ''
                      }`}
                      style={{ textAlign: column.align || 'left' }}
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, column.key, cellValue)}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={handleCellKeyDown}
                          className="w-full px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="truncate">
                          {column.render ? column.render(cellValue, row, rowIndex) : cellValue}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-200 px-4 py-2 bg-slate-50 text-xs text-slate-600">
        {sortedData.length} {sortedData.length === 1 ? 'rad' : 'rader'}
        {filteredData.length !== data.length && ` (filtrerat från ${data.length})`}
      </div>
    </div>
  );
}
