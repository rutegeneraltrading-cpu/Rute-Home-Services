'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useCallback } from 'react';
import { filterValues, getData } from '@/lib/client';
import { IBlogSearch } from '@/lib/types';

interface Sortable {
  updatedAt?: string;
}

interface Filterable {
  id?: string;
  title?: string;
  short_desc?: string;
  category?: string;
}

interface UseGetProps {
  path: string;
  slug?: string;
}

export const useGet = <T extends Sortable & Filterable>({
  path,
  slug,
}: UseGetProps) => {
  const [data, setData] = useState<T[]>([]);
  const [originalData, setOriginalData] = useState<T[]>([]);
  const [suggestions, setSuggestions] = useState<IBlogSearch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('All');

  const formMethods = useForm<{ filter: string }>({
    defaultValues: { filter: '' },
  });

  const filterWatched = formMethods.watch('filter');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filter = category === 'All' ? '' : category;
      const response = await getData({ filter, path, slug, category });
      const sortedData = response?.data?.sort((a: T, b: T) => {
        const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        return bDate - aDate;
      });
      setData(sortedData || []);
      setOriginalData(sortedData || []);
    } finally {
      setLoading(false);
    }
  }, [category, path, slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (filterWatched) {
      const filteredData = filterValues<T>(originalData, filterWatched);
      const mappedSuggestions: IBlogSearch[] = filteredData
        .slice(0, 6)
        .map((item) => ({
          id: item.id || '',
          title: item.title || '',
        }));
      setSuggestions(mappedSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [filterWatched, originalData]);

  const handleSearchClick = () => {
    const filteredData = filterValues<T>(originalData, filterWatched);
    setData(filteredData);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchClick();
    }
  };

  return {
    formMethods,
    data,
    originalData,
    suggestions,
    loading,
    handleKeyPress,
    handleSearchClick,
    setCategory,
    category,
  };
};
