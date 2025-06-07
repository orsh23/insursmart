
import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva } from "class-variance-authority"
import { cn } from "../utils/cn" // Updated path

export function Toggle({
  className,
  variant = "default",
  size = "default",
  pressed,
  onPressedChange,
  children,
  ...props
}) {
  const variantStyles = {
    default: pressed 
      ? "bg-gray-200 text-gray-900 hover:bg-gray-200/80 dark:bg-gray-800 dark:text-gray-50"
      : "bg-transparent hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50",
    outline: cn(
      "border border-gray-200 bg-transparent hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-50",
      pressed && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
    ),
    success: pressed
      ? "bg-green-500/90 text-white hover:bg-green-500/80"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300",
  };

  const sizeStyles = {
    default: "h-10 px-3",
    sm: "h-9 px-2.5",
    lg: "h-11 px-5",
  };

  return (
    <button
      type="button"
      aria-pressed={pressed}
      data-state={pressed ? "on" : "off"}
      onClick={() => onPressedChange && onPressedChange(!pressed)}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-gray-300",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
