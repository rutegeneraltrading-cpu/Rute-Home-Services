'use client';

import { useState, useMemo } from 'react';
import {
  flexRender,
  SortingState,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTableConfig } from '@/lib/types';

interface DataTableProps<T extends Record<string, any>> {
  config: DataTableConfig<T>;
  title?: string;
  description?: string;
}

export function DataTable<T extends Record<string, any>>({
  config,
  title,
  description,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(
    config.defaultSortBy
      ? [
          {
            id: config.defaultSortBy as string,
            desc: config.defaultSortOrder === 'desc',
          },
        ]
      : [],
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageSize, setPageSize] = useState(config.pageSize || 10);

  // Create column definitions from config
  const columns = useMemo(() => {
    return config.columns.map((col) => ({
      accessorKey: col.accessorKey || col.id,
      header: col.header,
      cell: (info: any) => {
        if (col.cell) {
          return col.cell(info.getValue(), info.row.original);
        }
        const value = info.getValue();
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      },
      enableSorting: col.sortable !== false,
      enableColumnFilter: col.filterable !== false,
      size: col.width ? undefined : 150,
    }));
  }, [config.columns]);

  // Initialize table instance
  const table = useReactTable({
    data: config.data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  });

  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || description) && (
        <div>
          {title && (
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      {/* Toolbar */}
      {(config.showSearch !== false || config.showFilters !== false) && (
        <div className="flex gap-2 items-center flex-wrap">
          {config.showSearch !== false && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8 h-9"
              />
              {globalFilter && (
                <button
                  onClick={() => setGlobalFilter('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Filter buttons */}
          {config.showFilters !== false &&
            config.filters &&
            config.filters.length > 0 && (
              <div className="flex gap-2">
                {config.filters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={
                      columnFilters.some(
                        (f) => f.id === filter.id && f.value === filter.value,
                      )
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    onClick={() => {
                      const existing = columnFilters.find(
                        (f) => f.id === filter.id,
                      );
                      if (existing && existing.value === filter.value) {
                        setColumnFilters(
                          columnFilters.filter((f) => f.id !== filter.id),
                        );
                      } else {
                        setColumnFilters([
                          ...columnFilters.filter((f) => f.id !== filter.id),
                          { id: filter.id, value: filter.value },
                        ]);
                      }
                    }}
                    className="gap-2"
                  >
                    {filter.icon && <filter.icon className="h-4 w-4" />}
                    {filter.label}
                  </Button>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none'
                        : ''
                    }
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getCanSort() && (
                        <span className="text-xs">
                          {header.column.getIsSorted() === 'desc'
                            ? ' ↓'
                            : header.column.getIsSorted() === 'asc'
                              ? ' ↑'
                              : ' ⇅'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
                {config.actions && config.actions.length > 0 && (
                  <TableHead className="w-20 text-right">Actions</TableHead>
                )}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {config.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={
                    table.getAllColumns().length + (config.actions ? 1 : 0)
                  }
                  className="text-center py-8"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    table.getAllColumns().length + (config.actions ? 1 : 0)
                  }
                  className="text-center py-8"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {config.emptyState?.icon && (
                      <config.emptyState.icon className="h-8 w-8 opacity-50" />
                    )}
                    <div>
                      <p className="font-semibold text-foreground">
                        {config.emptyState?.title || 'No data'}
                      </p>
                      {config.emptyState?.description && (
                        <p className="text-sm">
                          {config.emptyState.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => config.onRowClick?.(row.original)}
                  className={
                    config.onRowClick ? 'cursor-pointer hover:bg-accent' : ''
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}

                  {/* Actions column */}
                  {config.actions && config.actions.length > 0 && (
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {config.actions
                          .filter(
                            (action) =>
                              !action.showWhen || action.showWhen(row.original),
                          )
                          .map((action) => (
                            <Button
                              key={action.id}
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row.original);
                              }}
                              title={action.label}
                            >
                              {action.icon ? (
                                <action.icon className="h-4 w-4" />
                              ) : (
                                action.label
                              )}
                            </Button>
                          ))}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {config.showPagination !== false && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Showing{' '}
            {rows.length === 0
              ? 0
              : table.getState().pagination.pageIndex * pageSize + 1}{' '}
            to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * pageSize,
              config.data.length,
            )}{' '}
            of {config.data.length} entries
          </div>

          <div className="flex items-center gap-2">
            {/* Page size selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Rows per page:
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={(v) => setPageSize(Number(v))}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {pageCount || 1}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
