
import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../utils/cn"

export function Alert({
  className,
  variant = "default",
  children,
  ...props
}) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        "bg-background text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
