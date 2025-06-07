// Content of components/hooks/usePagination.js
import { useState, useCallback, useMemo, useEffect } from 'react'; // Added useEffect

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SIBLING_COUNT = 1; // Number of page numbers to show on each side of the current page

export const DOTS = '...';

const range = (start, end) => {
  let length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

/**
 * Hook to manage pagination state and generate pagination range.
 * @param {{
 *  totalCount: number,
 *  pageSize?: number,
 *  siblingCount?: number,
 *  currentPage?: number,
 *  onPageChange?: (page: number) => void, (Optional: if page state is managed externally)
 *  onPageSizeChange?: (size: number) => void (Optional: if page size state is managed externally)
 * }} params
 * @returns {{
 *  currentPage: number,
 *  pageSize: number,
 *  totalPages: number,
 *  paginationRange: Array<number | string>,
 *  setCurrentPage: (page: number) => void,
 *  setPageSize: (size: number) => void,
 *  nextPage: () => void,
 *  prevPage: () => void,
 *  goToPage: (page: number) => void
 * }}
 */
export default function usePagination({
  totalCount = 0,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  siblingCount = DEFAULT_SIBLING_COUNT,
  currentPage: initialCurrentPage = 1,
  onPageChange: externalOnPageChange,
  onPageSizeChange: externalOnPageSizeChange,
}) {
  const [internalCurrentPage, setInternalCurrentPage] = useState(initialCurrentPage);
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize);

  const currentPage = externalOnPageChange ? initialCurrentPage : internalCurrentPage;
  const pageSize = externalOnPageSizeChange ? initialPageSize : internalPageSize;
  
  const totalPageCount = Math.ceil(totalCount / pageSize);

  const paginationRange = useMemo(() => {
    // Pages count is determined as siblingCount + firstPage + lastPage + currentPage + 2*DOTS
    const totalPageNumbers = siblingCount + 5;

    /*
      Case 1:
      If the number of pages is less than the page numbers we want to show in our
      paginationComponent, we return the range [1..totalPageCount]
    */
    if (totalPageNumbers >= totalPageCount) {
      return range(1, totalPageCount);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPageCount);

    /*
      We do not want to show dots if there is only one position left 
      after/before the left/right page count as that would lead to a change if our Pagination
      component size which we do not want
    */
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPageCount;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount;
      let leftRange = range(1, leftItemCount);
      return [...leftRange, DOTS, totalPageCount];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount;
      let rightRange = range(totalPageCount - rightItemCount + 1, totalPageCount);
      return [firstPageIndex, DOTS, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }
    return []; // Should not happen if logic is correct
  }, [totalCount, pageSize, siblingCount, currentPage, totalPageCount]);


  const setCurrentPage = useCallback((page) => {
    const newPage = Math.max(1, Math.min(page, totalPageCount || 1));
    if (externalOnPageChange) {
      externalOnPageChange(newPage);
    } else {
      setInternalCurrentPage(newPage);
    }
  }, [totalPageCount, externalOnPageChange]);

  const setPageSize = useCallback((size) => {
    const newSize = Math.max(1, size);
    if (externalOnPageSizeChange) {
      externalOnPageSizeChange(newSize);
    } else {
      setInternalPageSize(newSize);
      // Reset to first page when page size changes, if current page becomes invalid
      if(currentPage > Math.ceil(totalCount / newSize) && totalCount > 0) {
         setCurrentPage(1);
      } else if (currentPage === 0 && totalCount > 0) { // Edge case if current page was 0
         setCurrentPage(1);
      }
    }
  }, [externalOnPageSizeChange, currentPage, totalCount, setCurrentPage]);

  const nextPage = useCallback(() => {
    setCurrentPage(currentPage + 1);
  }, [currentPage, setCurrentPage]);

  const prevPage = useCallback(() => {
    setCurrentPage(currentPage - 1);
  }, [currentPage, setCurrentPage]);

  const goToPage = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, [setCurrentPage]);
  
  // Effect to reset to page 1 if totalPages changes and current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPageCount && totalPageCount > 0) {
      setCurrentPage(totalPageCount);
    } else if (currentPage === 0 && totalPageCount > 0) { // Ensure current page is at least 1 if there are pages
      setCurrentPage(1);
    }
  }, [totalPageCount, currentPage, setCurrentPage]);


  return {
    currentPage,
    pageSize,
    totalPages: totalPageCount,
    paginationRange,
    setCurrentPage: goToPage, // Alias for clarity
    setPageSize,
    nextPage,
    prevPage,
    goToPage,
    totalCount, // Expose totalCount as well
  };
}