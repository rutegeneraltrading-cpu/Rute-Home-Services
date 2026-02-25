'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '../../ui';
import { usePathname } from 'next/navigation';

const ServicesSection = () => {
  const pathname = usePathname();
  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['public-service-categories'],
    queryFn: async (): Promise<
      Array<{
        id: string;
        name: string;
        slug: string;
        description?: string | null;
        image_url?: string | null;
      }>
    > => {
      const response = await fetch('/api/services/categories');
      if (!response.ok) throw new Error('Failed to fetch service categories');
      const data = await response.json();
      return data?.categories || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Show all categories
  const allCategories = useMemo(() => categoriesData, [categoriesData]);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(categoriesLoading ? Array.from({ length: 8 }) : allCategories).map(
            (category: any, index) => (
              <Link
                key={category?.id || index}
                href={`/booking?category=${category?.slug || ''}`}
              >
                <Card className="h-full cursor-pointer transition-all duration-200 hover:shadow-md pt-0">
                  {category?.image_url ? (
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
                      {category?.name || 'Loading...'}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {category?.description ||
                        'Popular services in this category'}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
