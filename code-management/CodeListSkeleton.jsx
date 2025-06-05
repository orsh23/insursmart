import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CodeListSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-1">
      {/* Table header */}
      <div className="grid grid-cols-6 gap-4 py-3 px-4 bg-muted/50 rounded-t-md">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      
      {/* Table rows */}
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="grid grid-cols-6 gap-4 py-3 px-4 bg-card border-b">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full max-w-[180px]" />
          <Skeleton className="h-4 w-full max-w-[180px]" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}