'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui';
import type { Service } from '@/lib/types/admin/services';

const ServicesSection = () => {
  const { data: servicesData = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['public-services'],
    queryFn: async (): Promise<Service[]> => {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      return data?.services || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const featuredServices = useMemo(
    () => servicesData.slice(0, 6),
    [servicesData],
  );
  return (
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Featured Services
            </h2>
            <p className="text-slate-600">Popular services picked for you</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/services">View all</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(servicesLoading ? Array.from({ length: 6 }) : featuredServices).map(
            (service: any, index) => (
              <Card key={service?.id || index} className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {service?.name || 'Loading...'}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {service?.description || 'Fetching service details...'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {service?.category?.name || 'General'}
                  </Badge>
                  <span className="text-sm font-semibold text-green-700">
                    {service?.base_price
                      ? `From R${service.base_price}`
                      : 'Custom'}
                  </span>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
