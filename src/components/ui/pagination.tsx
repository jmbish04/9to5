import * as React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange, 
  className = '' 
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Don't show pagination if there's only one page or no items
  if (totalPages <= 1) return null;
  
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];
    
    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }
    
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }
    
    rangeWithDots.push(...range);
    
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }
    
    return rangeWithDots;
  };
  
  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="text-xs text-neutral-500">
        Showing {startItem}-{endItem} of {totalItems} items
      </div>
      
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1 text-sm rounded border hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Go to previous page"
        >
          Previous
        </button>
        
        <div className="flex gap-1">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-1 text-sm text-neutral-400">...</span>
              ) : (
                <button
                  onClick={() => typeof page === 'number' && onPageChange(page)}
                  className={`px-3 py-1 text-sm rounded ${
                    page === currentPage
                      ? 'bg-blue-500 text-white'
                      : 'border hover:bg-neutral-50'
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 text-sm rounded border hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Go to next page"
        >
          Next
        </button>
      </nav>
    </div>
  );
}