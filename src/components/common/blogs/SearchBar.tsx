'use client';

import { FC, useMemo } from 'react';
import { FormProvider } from 'react-hook-form';
import Link from 'next/link';
import { Search, TrendingUp, FileText } from 'lucide-react';

import { IHeaderProps, IBlogs, IBlogSearch } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SearchBarProps extends IHeaderProps {
  allData?: IBlogs[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

const SearchBar: FC<SearchBarProps> = ({
  formMethods,
  suggestions = [],
  onSearchClick,
  handleKeyPress,
  allData = [],
  selectedCategory = 'All',
  onCategoryChange,
}) => {
  const { setValue } = formMethods;

  // Get unique categories from blogs data
  const topCategories = useMemo(() => {
    if (!allData || allData.length === 0) return ['All'];

    // Count occurrences of each category
    const categoryCount: Record<string, number> = {};
    allData.forEach((blog) => {
      if (blog.category) {
        categoryCount[blog.category] = (categoryCount[blog.category] || 0) + 1;
      }
    });

    // Sort by count and get top 4
    const sortedCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category]) => category);

    // Add 'All' at the beginning
    return ['All', ...sortedCategories];
  }, [allData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('filter', e.target.value);
  };

  const handleSearchClick = () => {
    window.scrollBy({ top: 550, left: 0, behavior: 'smooth' });
    onSearchClick();
  };

  const handleCategoryClick = (category: string) => {
    if (onCategoryChange) {
      onCategoryChange(category);
    }
    // Clear search filter when switching category
    setValue('filter', '');
  };

  return (
    <div className="relative bg-linear-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Badge variant="secondary" className="mb-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              Knowledge Base
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Find latest home service tips
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Search insights, guides, and product updates from Rute
            </p>
          </div>

          {/* Search Form */}
          <FormProvider {...formMethods}>
            <form className="relative">
              <div className="relative group">
                <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative flex items-center gap-2 bg-white border-2 border-slate-200 rounded-2xl p-2 shadow-lg focus-within:border-slate-400 focus-within:shadow-xl transition-all">
                  <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                  <Input
                    name="filter"
                    placeholder="Search for topics, guides, or tips..."
                    autoComplete="off"
                    onKeyDown={handleKeyPress}
                    onChange={handleInputChange}
                    className="border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-slate-400"
                  />
                  <Button
                    type="button"
                    onClick={handleSearchClick}
                    className="shrink-0 px-6"
                    size="lg"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>

                {/* Search Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-50">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                        <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                          Search Results
                        </p>
                      </div>
                      <ul className="max-h-80 overflow-y-auto">
                        {suggestions
                          ?.slice(0, 6)
                          ?.map((blog: IBlogSearch, index: number) => (
                            <li key={blog.id}>
                              <Link
                                href={`/blogs/${blog.id}`}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group/item"
                              >
                                <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0 group-hover/item:text-slate-600" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-700 group-hover/item:text-slate-900 line-clamp-2">
                                    {blog.title}
                                  </p>
                                </div>
                              </Link>
                              {index < suggestions.length - 1 && (
                                <div className="mx-4 border-b border-slate-100" />
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </FormProvider>

          {/* Popular Categories */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <span className="text-sm text-slate-500">Filter by:</span>
            {topCategories.map((topic) => (
              <Badge
                key={topic}
                variant={selectedCategory === topic ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors ${
                  selectedCategory === topic
                    ? 'bg-slate-900 text-white'
                    : 'hover:bg-slate-200'
                }`}
                onClick={() => handleCategoryClick(topic)}
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
