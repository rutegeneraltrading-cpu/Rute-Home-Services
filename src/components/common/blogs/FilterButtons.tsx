'use client';

import { FC } from 'react';
import clsx from 'clsx';

import { IBlogCategories, IBlogsFilter } from '@/lib/types';

const categories: IBlogCategories[] = [
  { id: '1', category: 'All' },
  { id: '2', category: 'services' },
  { id: '3', category: 'products' },
  { id: '4', category: 'ai' },
  { id: '4', category: 'others' },
];

const FilterButtons: FC<IBlogsFilter> = ({ category, setCategory }) => {
  const handleClick = (value: string) => {
    setCategory(value);
  };

  return (
    <div className="pb-8 flex flex-col gap-4">
      <h2 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
        Top Best Solutions!
      </h2>
      <div className="flex md:gap-4 gap-1 flex-wrap">
        {categories.map((item) => (
          <strong
            key={item.id}
            className={clsx(
              'md:text-sm text-xs md:px-4 px-2 py-1 font-normal cursor-pointer',
              'border border-slate-200 md:rounded-full rounded-lg',
              item.category === category
                ? 'bg-slate-200 text-slate-500'
                : 'text-slate-400 hover:bg-slate-200 hover:text-slate-500',
            )}
            onClick={() => handleClick(item.category)}
          >
            {item.category}
          </strong>
        ))}
      </div>
    </div>
  );
};

export default FilterButtons;
