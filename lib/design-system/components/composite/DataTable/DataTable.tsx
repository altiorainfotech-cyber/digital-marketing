import React, { useState, useMemo, useCallback, memo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Checkbox } from '../../primitives/Checkbox';
import { Icon } from '../../primitives/Icon';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  className?: string;
  'data-testid'?: string;
}

// Memoized table row component for better performance
const TableRow = memo(function TableRow<T extends { id: string }>({
  row,
  index,
  columns,
  selectable,
  isSelected,
  onRowClick,
  onSelectRow,
}: {
  row: T;
  index: number;
  columns: Column<T>[];
  selectable: boolean;
  isSelected: boolean;
  onRowClick?: (row: T) => void;
  onSelectRow: (id: string, checked: boolean) => void;
}) {
  const handleRowClick = useCallback(() => {
    if (onRowClick) {
      onRowClick(row);
    }
  }, [onRowClick, row]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectRow(row.id, e.target.checked);
  }, [onSelectRow, row.id]);

  return (
    <tr
      className={`
        border-b border-neutral-200 dark:border-neutral-700
        ${index % 2 === 0 ? 'bg-white dark:bg-neutral-800' : 'bg-neutral-50 dark:bg-neutral-900'}
        ${onRowClick ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700' : ''}
        transition-colors duration-150
      `}
      onClick={handleRowClick}
    >
      {selectable && (
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onChange={handleCheckboxChange}
            aria-label={`Select row ${row.id}`}
          />
        </td>
      )}
      {columns.map((column) => (
        <td key={column.key} className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100">
          {column.render ? column.render(row) : (row as any)[column.key]}
        </td>
      ))}
    </tr>
  );
});

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onSort,
  onRowClick,
  selectable = false,
  onSelectionChange,
  className = '',
  'data-testid': testId,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const handleSort = useCallback((key: string) => {
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(newDirection);
    
    if (onSort) {
      onSort(key, newDirection);
    }
  }, [sortKey, sortDirection, onSort]);
  
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map(row => row.id));
      setSelectedIds(allIds);
      if (onSelectionChange) {
        onSelectionChange(Array.from(allIds));
      }
    } else {
      setSelectedIds(new Set());
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    }
  }, [data, onSelectionChange]);
  
  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSelectedIds = new Set(prev);
      if (checked) {
        newSelectedIds.add(id);
      } else {
        newSelectedIds.delete(id);
      }
      
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelectedIds));
      }
      
      return newSelectedIds;
    });
  }, [onSelectionChange]);
  
  const isAllSelected = useMemo(() => 
    data.length > 0 && selectedIds.size === data.length,
    [data.length, selectedIds.size]
  );
  
  const isSomeSelected = useMemo(() => 
    selectedIds.size > 0 && selectedIds.size < data.length,
    [selectedIds.size, data.length]
  );
  
  // Loading skeleton
  if (loading) {
    return (
      <div className={`overflow-x-auto ${className}`} data-testid={testId}>
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
            <tr>
              {selectable && <th className="w-12 px-4 py-3" />}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100"
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="border-b border-neutral-200 dark:border-neutral-700">
                {selectable && (
                  <td className="px-4 py-3">
                    <div className="w-4 h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-shimmer" />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-shimmer" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  // Empty state
  if (data.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-12 ${className}`}
        data-testid={testId}
      >
        <p className="text-neutral-600 dark:text-neutral-300">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className={`overflow-x-auto ${className}`} data-testid={testId}>
      {/* Desktop table view */}
      <table className="w-full hidden md:table">
        <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
          <tr>
            {selectable && (
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100
                  ${column.sortable ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800' : ''}
                `}
                style={{ width: column.width }}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && (
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {sortKey === column.key ? (
                        sortDirection === 'asc' ? (
                          <Icon size={16}>
                            <ChevronUp />
                          </Icon>
                        ) : (
                          <Icon size={16}>
                            <ChevronDown />
                          </Icon>
                        )
                      ) : (
                        <Icon size={16}>
                          <ChevronsUpDown />
                        </Icon>
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <TableRow
              key={row.id}
              row={row}
              index={index}
              columns={columns as Column<{ id: string }>[]}
              selectable={selectable}
              isSelected={selectedIds.has(row.id)}
              onRowClick={onRowClick as ((row: { id: string }) => void) | undefined}
              onSelectRow={handleSelectRow}
            />
          ))}
        </tbody>
      </table>
      
      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {data.map((row) => (
          <div
            key={row.id}
            className={`
              bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700
              rounded-lg p-4 space-y-3
              ${onRowClick ? 'cursor-pointer hover:shadow-md' : ''}
              transition-shadow duration-150
            `}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {selectable && (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(row.id)}
                  onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                  aria-label={`Select row ${row.id}`}
                />
              </div>
            )}
            {columns.map((column) => (
              <div key={column.key}>
                <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                  {column.header}
                </div>
                <div className="text-sm text-neutral-900 dark:text-neutral-100">
                  {column.render ? column.render(row) : (row as any)[column.key]}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
