'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui';
import {
  StatsCards,
  DataTable,
  productColumns,
  orderColumns,
  type Product,
  type Order,
} from '@/components/admin';

// Sample data
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Smart Home Hub',
    price: 299.99,
    category: 'Electronics',
    stock: 45,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Plumbing Services',
    price: 149.99,
    category: 'Services',
    stock: 120,
    createdAt: '2024-01-20',
  },
  {
    id: '3',
    name: 'Electrical Wiring Kit',
    price: 89.99,
    category: 'Tools',
    stock: 5,
    createdAt: '2024-02-01',
  },
  {
    id: '4',
    name: 'Water Heater Installation',
    price: 499.99,
    category: 'Services',
    stock: 8,
    createdAt: '2024-02-05',
  },
];

const sampleOrders: Order[] = [
  {
    id: 'ORD-001',
    customer: 'John Doe',
    total: 299.99,
    status: 'completed',
    date: '2024-01-15',
  },
  {
    id: 'ORD-002',
    customer: 'Jane Smith',
    total: 149.99,
    status: 'processing',
    date: '2024-01-20',
  },
  {
    id: 'ORD-003',
    customer: 'Ahmed Khan',
    total: 589.98,
    status: 'pending',
    date: '2024-02-01',
  },
  {
    id: 'ORD-004',
    customer: 'Sarah Wilson',
    total: 89.99,
    status: 'cancelled',
    date: '2024-02-05',
  },
];

interface DashboardPageProps {
  basePath?: string;
  baseLabel?: string;
  pageTitle?: string;
  pageDescription?: string;
}

export default function DashboardPage({
  basePath = '/admin',
  baseLabel = 'Admin',
  pageTitle = 'Dashboard',
  pageDescription = 'Welcome back! Here&apos;s your business overview.',
}: DashboardPageProps) {
  return (
    <div className="space-y-6 py-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={basePath}>{baseLabel}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-muted-foreground">{pageDescription}</p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Tables Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Products Table */}
        <div className="rounded-lg border p-4">
          <DataTable
            columns={productColumns}
            data={sampleProducts.slice(0, 3)}
            title="Recent Products"
          />
        </div>

        {/* Orders Table */}
        <div className="rounded-lg border p-4">
          <DataTable
            columns={orderColumns}
            data={sampleOrders.slice(0, 3)}
            title="Recent Orders"
          />
        </div>
      </div>
    </div>
  );
}
