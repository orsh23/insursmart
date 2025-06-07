import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Form({ className, onSubmit, children, ...props }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(event);
  };

  return (
    <form 
      className={cn("space-y-6", className)} 
      onSubmit={handleSubmit} 
      {...props}
    >
      {children}
    </form>
  );
}

export function FormField({ className, ...props }) {
  return (
    <div className={cn("space-y-2", className)} {...props} />
  );
}

export function FormItem({ className, ...props }) {
  return (
    <div className={cn("space-y-1", className)} {...props} />
  );
}

export function FormLabel({ className, children, required, ...props }) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-red-500">*</span>
      )}
    </label>
  );
}

export function FormControl({ className, ...props }) {
  return (
    <div className={cn("mt-2", className)} {...props} />
  );
}

export function FormDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  );
}

export function FormMessage({ className, children, ...props }) {
  return children ? (
    <p
      className={cn("text-sm font-medium text-red-600 dark:text-red-500", className)}
      {...props}
    >
      {children}
    </p>
  ) : null;
}