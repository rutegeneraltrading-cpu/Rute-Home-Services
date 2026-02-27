'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '../../ui';
import { usePathname } from 'next/navigation';

const ServicesPage = () => {
  // Fetch services data
  type Service = {
    id: string;
    slug: string;
    name: string;
    base_price?: number;
    category_id: string;
    description?: string;
  };
  type Category = {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    image_url?: string | null;
    created_at?: string;
    charge_type?: string;
  };
  const { data: servicesData = [], isLoading: servicesLoading } = useQuery<
    Service[]
  >({
    queryKey: ['public-services'],
    queryFn: async () => {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      return data?.services || [];
    },
    staleTime: 10 * 60 * 1000,
  });
  const pathname = usePathname();
  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery<
    Category[]
  >({
    queryKey: ['public-service-categories'],
    queryFn: async () => {
      const response = await fetch('/api/services/categories');
      if (!response.ok) throw new Error('Failed to fetch service categories');
      const data = await response.json();
      return data?.categories || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Show all categories
  const allCategories = useMemo(() => {
    return (categoriesData || []).slice().sort((a, b) => {
      if (!a.created_at && !b.created_at) return 0;
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, [categoriesData]);

  return (
    <section
      className={`py-16 px-4 ${pathname === '/services' ? '' : 'bg-slate-50'}`}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Service Categories
            </h2>
            <p className="text-slate-600">
              Choose a category to start your booking
            </p>
          </div>
          {pathname !== '/services' && (
            <Button asChild variant="outline">
              <Link href="/services">View all</Link>
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <Card
                  key={index}
                  className="h-full transition-all duration-200 hover:shadow-md pt-0"
                >
                  <div className="h-40 bg-slate-200 rounded-t-lg animate-pulse" />
                  <CardHeader>
                    <CardTitle className="text-lg bg-slate-200 rounded w-1/2 h-6 mb-2 animate-pulse" />
                    <CardDescription>
                      <div className="bg-slate-100 rounded h-4 w-3/4 animate-pulse" />
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))
            : allCategories.map((category: Category, index: number) => {
                // Find services for this category
                const servicesForCategory = (servicesData as Service[]).filter(
                  (s) => s.category_id === category.id,
                );
                return (
                  <Card
                    key={category.id || index}
                    className="h-full transition-all duration-200 hover:shadow-md pt-0"
                  >
                    {category.image_url ? (
                      <div className="relative h-full w-full flex items-center justify-center p-4">
                        <Image
                          src={category.image_url}
                          alt={category.name || 'Service category'}
                          width={150}
                          height={150}
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-slate-200 rounded-t-lg" />
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {category.name || 'Loading...'}
                      </CardTitle>
                      <CardDescription>
                        {category.description ||
                          'Popular services in this category'}
                      </CardDescription>
                      {/* Services for this category */}
                      {servicesLoading ? (
                        <div className="text-xs text-slate-400 mt-2">
                          Loading services...
                        </div>
                      ) : servicesForCategory.length > 0 ? (
                        <div className="mt-2 flex flex-col gap-1">
                          {servicesForCategory.map((service) => (
                            <Link
                              key={service.id}
                              href={`/booking?service=${service.slug}`}
                              className="group"
                            >
                              <span
                                className="text-sm font-semibold text-slate-900 flex items-center gap-2 border border-green-200 rounded-full px-3 py-1 bg-white hover:bg-green-50 hover:border-green-400 cursor-pointer transition-all shadow-sm group-hover:shadow-md"
                                style={{ width: 'fit-content' }}
                              >
                                <span className="group-hover:text-green-700">
                                  {service.name}
                                </span>
                                <span className="text-xs text-slate-700">
                                  {' | '}
                                  {service.base_price != null
                                    ? `${service.base_price} ZAR`
                                    : 'Price on request'}
                                </span>
                                <span className="text-green-600 group-hover:text-green-800 text-xs font-medium">
                                  {category.charge_type}
                                </span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-2">
                          No services found for this category.
                        </div>
                      )}
                    </CardHeader>
                  </Card>
                );
              })}
        </div>
      </div>
    </section>
  );
};

export default ServicesPage;
