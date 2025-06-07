
import React from 'react';
import { cn } from '../utils/cn';

const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative overflow-auto", className)}
    {...props}
  >
    {children}
  </div>
));
ScrollArea.displayName = "ScrollArea";

const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex touch-none select-none bg-gray-100 rounded transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
      orientation === "vertical" ? 
        "h-full w-2 top-0 right-0 border-l" : 
        "h-2 w-full bottom-0 left-0 border-t",
      className
    )}
    {...props}
  />
));
ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
