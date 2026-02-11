import { UseFormReturn } from 'react-hook-form';
import type { Document } from '@contentful/rich-text-types';

export interface IConstantData {
  userName: string;
  title: string;
  image: string;
}

export interface StructuredContentType {
  blocks: Array<{
    type: string;
    level: string;
    text: string;
    src: string;
    alt: string;
    items: unknown;
    data: unknown;
  }>;
}

export interface ContentfulAsset {
  fields?: {
    file?: {
      url?: string;
    };
    title?: string;
  };
}

export interface IBlogs {
  id: string;
  slug: string;
  title: string;
  short_desc?: string;
  read_time?: string;
  category?: string;
  image?: ContentfulAsset;
  content?: Document | StructuredContentType;
  auther?: string;
  auther_role?: string;
  auther_image?: ContentfulAsset;
  createdAt?: string;
  updatedAt?: string;
}

export interface IBlogForm {
  title?: string;
  onSubmit?: () => void;
  methods?: UseFormReturn<Record<string, unknown>>;
  loading: boolean;
}

export interface HeaderProps {
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  formMethods: UseFormReturn<{ filter: string }>;
  suggestions: IBlogSearch[];
  onSearchClick: () => void;
}

export interface IBlogCategories {
  id: string;
  category: string;
}

export interface IBlogsFilter {
  category: string;
  setCategory: (category: string) => void;
}

export interface IBlogSearch {
  id: string;
  title: string;
}

export interface IHeaderProps {
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  formMethods: UseFormReturn<{ filter: string }>;
  data?: IBlogSearch[];
  suggestions: IBlogSearch[];
  onSearchClick: () => void;
}
