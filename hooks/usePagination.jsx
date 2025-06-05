// hooks/usePagination.js
import { useState, useMemo } from 'react';

/**
 * Hook to manage paginated data display logic
 * @param {number} totalItems - Total number of items
 * @param {number} itemsPerPage - Items per page
 * @param {number} initialPage - Starting page (default 1)
 * @returns {object} - Pagination state and controls
 */
export default function usePagination(totalItems, itemsPerPage = 10, initialPage = 1) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);

  const goToPage = (page) => {
    const newPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(newPage);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    setCurrentPage: goToPage,
    nextPage,
    prevPage,
  };
}