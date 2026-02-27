import { FC } from 'react';

import { HeaderProps, IBlogs } from '@/lib/types';
import SearchBar from './SearchBar';

interface BlogsHeaderProps extends HeaderProps {
  allData?: IBlogs[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

const BlogsHeader: FC<BlogsHeaderProps> = ({
  handleKeyPress,
  formMethods,
  onSearchClick,
  suggestions,
  allData,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <SearchBar
      handleKeyPress={handleKeyPress}
      formMethods={formMethods}
      suggestions={suggestions}
      onSearchClick={onSearchClick}
      allData={allData}
      selectedCategory={selectedCategory}
      onCategoryChange={onCategoryChange}
    />
  );
};

export default BlogsHeader;
