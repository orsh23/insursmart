import React from 'react';
import { X } from 'lucide-react';

// Main Toast component (can be default or named export)
export function Toast({
  id,
  title,
  description,
  variant = 'default', // default, success, error, warning
  open,
  onOpenChange, // For Radix-like behavior if needed
  children, // For custom actions
  ...props
}) {
  if (!open) return null;

  const types = {
    default: 'bg-background text-foreground',
    success: 'bg-green-500 border-green-600 text-white',
    error: 'bg-red-500 border-red-600 text-white',
    warning: 'bg-yellow-500 border-yellow-600 text-white',
    destructive: 'bg-destructive text-destructive-foreground', // Common shadcn variant
  };

  const titleColors = { // Example, may need adjustment based on actual variant styles
    default: 'text-foreground',
    success: 'text-white',
    error: 'text-white',
    warning: 'text-white',
    destructive: 'text-destructive-foreground',
  };

  const descriptionColors = { // Example
    default: 'text-muted-foreground',
    success: 'text-green-100',
    error: 'text-red-100',
    warning: 'text-yellow-100',
    destructive: 'text-destructive-foreground',
  };

  return (
    <div
      className={`rounded-md border p-4 shadow-lg data-[swipe=move]:transition-none group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] ${types[variant] || types.default}`}
      {...props}
    >
      <div className="grid gap-1 w-full">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {children} {/* For ToastAction */}
      <ToastClose onClick={() => onOpenChange?.(false)} />
    </div>
  );
}

// Provider - simply renders children for now
export function ToastProvider({ children }) {
  return <>{children}</>;
}

// Viewport - placeholder for positioning toasts
export function ToastViewport({ className, ...props }) {
  return (
    <ol
      tabIndex={-1}
      className={`fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] ${className || ''}`}
      {...props}
    />
  );
}

// Title
export function ToastTitle({ className, children, ...props }) {
  return <div className={`text-sm font-semibold ${className || ''}`} {...props}>{children}</div>;
}

// Description
export function ToastDescription({ className, children, ...props }) {
  return <div className={`text-sm opacity-90 ${className || ''}`} {...props}>{children}</div>;
}

// Close button
export function ToastClose({ className, onClick, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 ${
        className || ''
      }`}
      aria-label="Close"
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  );
}

// Action button (optional, if you use ToastAction)
export function ToastAction({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
}

// export { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose, ToastAction };
// No need for the above line if using `export function ...` for each.