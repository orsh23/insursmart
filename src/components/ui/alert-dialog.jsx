import * as React from "react";
import { cn } from "../utils/cn"; // Fixed import path
import { Button } from "./button";

const AlertDialog = React.forwardRef(({ open, onOpenChange, children }, ref) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" ref={ref}>
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        {children}
      </div>
    </div>
  );
});

AlertDialog.displayName = "AlertDialog";

const AlertDialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("overflow-hidden", className)} {...props}>
    {children}
  </div>
));

AlertDialogContent.displayName = "AlertDialogContent";

const AlertDialogHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mb-4", className)}
    {...props}
  />
));

AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-6 flex justify-end space-x-2", className)}
    {...props}
  />
));

AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-xl font-bold", className)}
    {...props}
  />
));

AlertDialogTitle.displayName = "AlertDialogTitle";

const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-gray-500", className)}
    {...props}
  />
));

AlertDialogDescription.displayName = "AlertDialogDescription";

const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    className={cn(className)}
    {...props}
  />
));

AlertDialogAction.displayName = "AlertDialogAction";

const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    variant="outline"
    className={cn(className)}
    {...props}
  />
));

AlertDialogCancel.displayName = "AlertDialogCancel";

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
};