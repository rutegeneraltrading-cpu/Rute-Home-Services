'use client';

import { FC, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock } from 'lucide-react';

import { Loading } from '@/components/common';
import { dateFormat } from '@/lib/client';
import { IBlogs } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';

interface BlogCardProps {
  data: IBlogs[];
  loading?: boolean;
  col?: string;
}

const truncateText = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

const BlogCard: FC<BlogCardProps> = ({ data, loading, col }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = col ? 4 : 9;
  const blogsRef = useRef<HTMLDivElement>(null);

  if (loading) return <Loading fullScreen={false} />;
  if (!data || data.length === 0)
    return <p className="text-center text-slate-500 py-8">No blogs found!</p>;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const currentData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    if (blogsRef.current) {
      blogsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>,
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <>
      <div
        ref={blogsRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {currentData?.map((item) => (
          <Link href={`/blogs/${item.slug}`} key={item.id} className="group">
            <Card className="h-full overflow-hidden transition-all hover:shadow-lg border-slate-200 hover:border-slate-300">
              <div className="relative w-full aspect-video overflow-hidden">
                <Image
                  src={
                    item?.image?.fields?.file?.url
                      ? `https:${item.image.fields.file.url}`
                      : 'https://images.ctfassets.net/f5mq357xxj80/5ZBxFnsbUIfhDA1ABqryHU/a607b9906774c3986a5a006282d73346/HomePageImage.webp'
                  }
                  alt={item?.image?.fields?.title || 'Blog Image'}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {item.category && (
                  <div className="absolute top-3 left-3">
                    <Badge
                      variant="secondary"
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      {item.category}
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200">
                    <Image
                      src={
                        item?.auther_image?.fields?.file?.url
                          ? `https:${item.auther_image.fields.file.url}`
                          : 'https://images.ctfassets.net/f5mq357xxj80/5ZBxFnsbUIfhDA1ABqryHU/a607b9906774c3986a5a006282d73346/HomePageImage.webp'
                      }
                      alt={item.auther || 'Author'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.auther || 'Anonymous'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.auther_role || 'Author'}
                    </p>
                  </div>
                </div>

                <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>

                {item.short_desc && (
                  <CardDescription className="line-clamp-2">
                    {item.short_desc}
                  </CardDescription>
                )}
              </CardHeader>

              <CardFooter className="flex items-center justify-between text-xs text-slate-500 pt-0">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.read_time || '5 min read'}</span>
                </div>
                {item.updatedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{dateFormat(item.updatedAt)}</span>
                  </div>
                )}
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-disabled={currentPage === 1}
                  className={
                    currentPage === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>

              {renderPaginationItems()}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-disabled={currentPage === totalPages}
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
};

export default BlogCard;
