import { cn } from "../utils/cn" // Updated path

function Skeleton({
  className,
  ...props
}) {
  return (
    (<div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props} />)
  );
}

export { Skeleton }