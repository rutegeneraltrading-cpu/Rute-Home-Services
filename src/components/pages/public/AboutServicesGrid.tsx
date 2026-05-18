'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGetCategories } from '@/lib/client/api';

const AboutServicesGrid = () => {
  const { data: categoriesData, isLoading } = useGetCategories();
  const router = useRouter();

  const categories = (categoriesData?.categories || [])
    .slice()
    .sort((a, b) => {
      if (
        typeof a.display_order === 'number' &&
        typeof b.display_order === 'number'
      ) {
        return a.display_order - b.display_order;
      }
      if (typeof a.display_order === 'number') return -1;
      if (typeof b.display_order === 'number') return 1;
      return 0;
    });

  return (
    <>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() =>
                router.push(
                  `/booking?category=${encodeURIComponent(cat.slug || cat.id)}`,
                )
              }
              className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-center cursor-pointer hover:border-green-400 hover:shadow-sm transition-all"
            >
              {cat.image_url ? (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                  <span className="text-lg font-bold text-green-600">
                    {cat.name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-slate-700">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      )}
      
    </>
  );
};

export default AboutServicesGrid;
