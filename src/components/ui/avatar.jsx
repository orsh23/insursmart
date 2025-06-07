import React from "react";
import { cn } from "../utils/cn";

const AvatarContext = React.createContext({ imageStatus: 'loading' });

const Avatar = React.forwardRef(({ className, ...props }, ref) => {
  const [imageStatus, setImageStatus] = React.useState('loading'); // 'loading', 'loaded', 'error'
  
  return (
    <AvatarContext.Provider value={{ imageStatus, setImageStatus }}>
      <span // Changed from div to span for inline-flex behavior by default
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full align-middle", // Added align-middle & items-center justify-center
          className
        )}
        {...props}
      />
    </AvatarContext.Provider>
  );
});
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef(({ className, src, alt, ...props }, ref) => {
  const { setImageStatus } = React.useContext(AvatarContext);

  React.useEffect(() => {
    if (!src) {
      setImageStatus('error'); // No src, treat as error for fallback
      return;
    }
    const img = new Image();
    img.src = src;
    img.onload = () => setImageStatus('loaded');
    img.onerror = () => setImageStatus('error');
  }, [src, setImageStatus]);

  const { imageStatus } = React.useContext(AvatarContext);

  if (imageStatus !== 'loaded') {
    return null; // Don't render img if not loaded, Fallback will show
  }

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef(({ className, children, ...props }, ref) => {
  const { imageStatus } = React.useContext(AvatarContext);

  if (imageStatus === 'loaded') {
    return null; // Don't render Fallback if image is loaded
  }

  return (
    <span // Changed from div to span
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };