/**
 * Common table filter type
 */
export interface TableFilter {
  id: string;
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Common table action type
 */
export interface TableAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  onClick: (item: any) => void | Promise<void>;
  showWhen?: (item: any) => boolean;
}

/**
 * Common table column configuration
 */
export interface TableColumn<T> {
  id: keyof T | string;
  header: string;
  accessorKey?: keyof T;
  cell?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  width?: string;
}

/**
 * Common table configuration
 */
export interface DataTableConfig<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction[];
  filters?: TableFilter[];
  searchableColumns?: (keyof T)[];
  defaultSortBy?: keyof T;
  defaultSortOrder?: 'asc' | 'desc';
  pageSize?: number;
  showPagination?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyState?: {
    title: string;
    description: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
}

/**
 * Parsed table data with sorting/filtering applied
 */
export interface ProcessedTableData<T> {
  items: T[];
  total: number;
  pageCount: number;
  currentPage: number;
}
