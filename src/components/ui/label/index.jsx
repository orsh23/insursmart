import React, { forwardRef } from "react";

// Enhanced Label component with standardized styling
export const Label = forwardRef(({ className = "", children, required = false, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={`text-sm font-medium leading-none text-gray-700 dark:text-gray-300 mb-2 block ${className}`}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
});

Label.displayName = "Label";