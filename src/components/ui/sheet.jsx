import React from "react";
import { cn } from "../utils/cn";
import { X } from "lucide-react";

const Sheet = React.forwardRef(({ open, onOpenChange, children }, ref) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-end" ref={ref}>
      <div className="bg-white h-full w-full max-w-md shadow-lg overflow-y-auto">
        {children}
      </div>
    </div>
  );
});

Sheet.displayName = "Sheet";

const SheetContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props}>
    {children}
  </div>
));

SheetContent.displayName = "SheetContent";

const SheetHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mb-4 border-b pb-4", className)}
    {...props}
  />
));

SheetHeader.displayName = "SheetHeader";

const SheetFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-6 pt-4 border-t flex justify-end space-x-2", className)}
    {...props}
  />
));

SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-xl font-bold", className)}
    {...props}
  />
));

SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-gray-500", className)}
    {...props}
  />
));

SheetDescription.displayName = "SheetDescription";

const SheetClose = React.forwardRef(({ className, onClick, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    className={cn(
      "absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </button>
));

SheetClose.displayName = "SheetClose";

export {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
};