'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, ChevronDown } from 'lucide-react';
import { Button, Input } from '../ui';
import {
  useGetCategories,
  useGetServices,
  useGetProducts,
} from '@/lib/client/api';
import { Loading } from './Loading';

const HeroSection = () => {
  const [filter, setFilter] = useState<'Services' | 'Products'>('Services');
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const {
    data: categoriesData = { categories: [] },
    isLoading: categoriesLoading,
  } = useGetCategories();
  const { data: servicesData = [], isLoading: servicesLoading } =
    useGetServices();
  const { data: productsData = [] } = useGetProducts();

  const categories: Array<{
    id: string;
    name: string;
    image_url?: string | null;
    created_at?: string;
    charge_type?: string;
  }> = (categoriesData.categories || []).slice().sort((a, b) => {
    if (!a.created_at || !b.created_at) return 0;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    () => {
      return categories && categories.length > 0 ? categories[0].id : null;
    },
  );

  useEffect(() => {
    if (categories.length === 0) return;
    if (
      !selectedCategory ||
      !categories.some((c) => c.id === selectedCategory)
    ) {
      setSelectedCategory(categories[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  type Service = {
    id: string;
    slug: string;
    name: string;
    description?: string;
    category_id: string;
    image_url?: string;
    base_price?: number;
  };
  type Category = {
    id: string;
    name: string;
    image_url?: string | null;
    created_at?: string;
    charge_type?: string;
  };
  type Product = { id: string; name: string; description?: string };
  const router = useRouter();

  const suggestions = useMemo(() => {
    if (!search) return [];
    if (filter === 'Services') {
      return (
        (servicesData as Service[]).filter((s) =>
          s.name?.toLowerCase().includes(search.toLowerCase()),
        ) || []
      );
    } else {
      return (
        (productsData as Product[]).filter((p) =>
          p.name?.toLowerCase().includes(search.toLowerCase()),
        ) || []
      );
    }
  }, [search, filter, servicesData, productsData]);

  const servicesForCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return (
      (servicesData as Service[]).filter(
        (s) => s.category_id === selectedCategory,
      ) || []
    );
  }, [selectedCategory, servicesData]);

  if (categoriesLoading || servicesLoading)
    return <Loading fullScreen className="bg-white" />;
  return (
    <>
      <section className="bg-linear-to-b from-green-50 to-white py-10">
        <div className="container mx-auto py-16 flex flex-col items-center gap-10 lg:px-0 px-4">
          {/* Header (Badge, Title, Description) */}
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium mb-2">
              <Search className="w-3 h-3 mr-1" />{' '}
              {`${filter === 'Services' ? 'Home Services' : 'Products'}`}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Book reliable <br />
              home services in minutes
            </h1>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Search and book trusted services or shop products for your home
            </p>
          </div>
          {/* Search Bar */}
          <div className="w-full max-w-2xl mx-auto relative">
            <div className="relative flex items-center gap-2 bg-white border-2 border-slate-200 rounded-2xl p-2 shadow-lg">
              <Input
                className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-slate-400"
                placeholder={`Search ${filter.toLowerCase()}...`}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {/* Filter Dropdown (right of input, next to search button) */}
              <div className="relative" ref={filterDropdownRef}>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 px-4 py-2 text-base"
                  onClick={() => setFilterDropdownOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={filterDropdownOpen}
                >
                  <span>{filter}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                {filterDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 min-w-35">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                      <button
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-100 ${filter === 'Services' ? 'bg-slate-50 font-semibold' : ''}`}
                        onClick={() => {
                          setFilter('Services');
                          setFilterDropdownOpen(false);
                        }}
                        type="button"
                      >
                        Services
                      </button>
                      <button
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-100 ${filter === 'Products' ? 'bg-slate-50 font-semibold' : ''}`}
                        onClick={() => {
                          setFilter('Products');
                          setFilterDropdownOpen(false);
                        }}
                        type="button"
                      >
                        Products
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50">
                <div className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                  <ul>
                    {suggestions.map((item: Service | Product, idx: number) => (
                      <li
                        key={item.id || idx}
                        className="px-4 py-3 hover:bg-slate-100 cursor-pointer transition-colors"
                        onMouseDown={() => {
                          setSearch(item.name);
                          setShowSuggestions(false);
                          if (filter === 'Services' && 'slug' in item) {
                            router.push(`/booking?service=${item.slug}`);
                          } else if (filter === 'Products' && 'id' in item) {
                            // Assuming product slug is item.id or add slug property if available
                            router.push(`/shop/${item.id}`);
                          }
                        }}
                      >
                        <span className="font-medium text-slate-700">
                          {item.name}
                        </span>
                        {'description' in item && item.description && (
                          <div className="text-xs text-slate-500 line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <div className="container mx-auto flex flex-col gap-4 pb-4 lg:px-0 px-4">
        {/* Categories Row */}
        <div className="w-full overflow-x-auto border-b border-slate-200">
          <div className="flex items-center text-center gap-4 pb-2">
            {categories.map((cat: Category) => (
              <div
                key={cat.id}
                className={`flex flex-col items-center min-w-30 cursor-pointer px-2 py-4 rounded-lg transition-all border-b-2 border-l-2 ${selectedCategory === cat.id ? 'border-green-500 shadow-md' : 'border-transparent hover:border-slate-200'}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.image_url && typeof cat.image_url === 'string' && (
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    width={60}
                    height={60}
                    className="rounded-full mb-2 object-cover"
                  />
                )}
                <span className={`text-sm font-medium `}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Services List for Selected Category */}
        <div className="w-full overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {servicesForCategory.length === 0 && (
              <div className="text-slate-500 text-center w-full">
                No services found for this category.
              </div>
            )}
            {servicesForCategory.map((service: Service) => {
              const category = categories.find(
                (c) => c.id === service.category_id,
              );
              const chargeType = category?.charge_type || '';
              return (
                <a
                  key={service.id}
                  href={`/booking?service=${service.slug}`}
                  className="border-2 border-green-500 rounded-full bg-white hover:bg-green-50 hover:border-green-200 px-4 py-2 flex items-center cursor-pointer transition-colors"
                  style={{ minWidth: 'fit-content', width: 'fit-content' }}
                >
                  <span
                    className="text-base font-semibold text-slate-900 whitespace-nowrap"
                    style={{ width: 'fit-content' }}
                  >
                    {service.name} {' | '}
                    {service.base_price != null
                      ? `${service.base_price} ZAR`
                      : 'Price on request'}
                    {chargeType && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full border border-green-200 ml-2">
                        {`per ${chargeType}`}
                      </span>
                    )}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
