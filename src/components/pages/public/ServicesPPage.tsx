'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '../../ui';
import { usePathname, useRouter } from 'next/navigation';

const ServicesPage = () => {
  const router = useRouter();
  type Category = {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    image_url?: string | null;
    created_at?: string;
    charge_type?: string;
  };
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
            : allCategories.map((category: Category, index: number) => (
                <Card
                  key={category.id || index}
                  className="h-full transition-all duration-200 hover:shadow-md pt-0 cursor-pointer"
                  onClick={() =>
                    router.push(`/booking?category=${category.slug}`)
                  }
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
                      {category.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesPage;
