'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
  blogsRef?: React.RefObject<HTMLDivElement | null>;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  blogsRef,
}: PaginationProps) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handleChange = (page: number) => {
    onPageChange(page);
    if (blogsRef?.current) {
      blogsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          className={`h-8 w-8 rounded-full text-sm transition ${
            page === currentPage
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          onClick={() => handleChange(page)}
        >
          {page}
        </button>
      ))}
    </div>
  );
};

export default Pagination;
