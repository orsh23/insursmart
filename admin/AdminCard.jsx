import React from 'react';
import { cn } from '../utils/cn'; // Fixed import path

export default function AdminCard({
  title,
  icon: Icon,
  children,
  className,
  headerClassName,
  contentClassName,
  actions
}) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm border mb-6", className)}>
      <div className={cn(
        "flex items-center justify-between px-6 py-4 border-b",
        headerClassName
      )}>
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="rounded-full bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      
      <div className={cn("p-6", contentClassName)}>
        {children}
      </div>
    </div>
  );
}