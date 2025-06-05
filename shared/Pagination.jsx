// components/shared/Pagination.jsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  className = "",
  isRTL = false,
}) {
  const label = `Page ${currentPage} of ${totalPages}`;
  const prevDisabled = currentPage === 1;
  const nextDisabled = currentPage === totalPages;

  return (
    <div className={`flex items-center justify-between mt-4 gap-4 ${className}`}>      
      <button
        className="flex items-center gap-1 text-sm disabled:opacity-50"
        onClick={onPrevious}
        disabled={prevDisabled}
        aria-label="Previous Page"
        title="Previous Page"
      >
        {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        {isRTL ? "הקודם" : "Previous"}
      </button>

      <p className="text-sm text-muted-foreground">{label}</p>

      <button
        className="flex items-center gap-1 text-sm disabled:opacity-50"
        onClick={onNext}
        disabled={nextDisabled}
        aria-label="Next Page"
        title="Next Page"
      >
        {isRTL ? "הבא" : "Next"}
        {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </div>
  );
}