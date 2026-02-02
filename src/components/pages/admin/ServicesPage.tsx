'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useGetServices } from '@/lib/client/api/services/services.query';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function ServicesPage() {
  const { data: services, isLoading, error } = useGetServices();

  if (isLoading) {
    return (
      <div className="py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Services</h1>
            <p className="text-gray-600">Manage your service offerings</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">Failed to load services</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-gray-600">Manage your service offerings</p>
        </div>
        <Link href="/admin/services/new">
          <Button>+ New Category / Service</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services?.filter((s) => s.is_active).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R
              {(
                (services?.reduce((sum, s) => sum + s.base_price, 0) || 0) /
                (services?.length || 1)
              ).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Grid */}
      {!services || services.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No services yet</p>
              <Link href="/admin/services/new">
                <Button>Create First Service Category</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <CardDescription>
                  {service.category?.name || 'Unknown Category'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {service.description && (
                  <p className="text-sm text-gray-600">{service.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Base Price:</span>
                    <span className="font-medium">
                      R{service.base_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {service.duration_minutes}min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span
                      className={`font-medium text-sm ${service.is_active ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Link href={`/admin/services/${service.id}/options`}>
                    <Button variant="outline" className="w-full" size="sm">
                      Manage Options
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
