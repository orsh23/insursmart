
import React, { useRef, useEffect, useContext } from "react";
import { cn } from "../utils/cn";
import { X } from "lucide-react";

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  
  return (
    <DialogPortal>
      <DialogOverlay onClick={() => onOpenChange && onOpenChange(false)} />
      {children}
    </DialogPortal>
  );
};

const DialogPortal = ({ children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {children}
    </div>
  );
};

const DialogOverlay = ({ className, onClick, ...props }) => (
  <div
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-100",
      className
    )}
    onClick={onClick}
    {...props}
  />
);

const DialogContent = React.forwardRef(
  ({ className, children, onClose, ...props }, ref) => {
    const contentRef = useRef(null);
    
    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === 'Escape' && onClose) {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);
    
    return (
      <div
        ref={contentRef}
        className={cn(
          "fixed z-50 w-full max-w-lg rounded-lg border bg-white p-6 shadow-lg mx-4",
          "left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
        {onClose && (
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    );
  }
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4",
      className
    )}
    {...props}
  />
);

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogContext = React.createContext({
  onOpenChange: () => {},
});

const DialogClose = React.forwardRef(({ className, onClick, asChild, ...props }, ref) => {
  const { onOpenChange } = useContext(DialogContext);
  const Comp = asChild ? React.Fragment : "button";
  
  return (
    <Comp
      ref={ref}
      className={cn(className)}
      onClick={(e) => {
        onClick?.(e);
        onOpenChange?.(false);
      }}
      {...props}
    />
  );
});
DialogClose.displayName = "DialogClose";

const DialogProvider = ({ open, onOpenChange, children }) => {
  return (
    <DialogContext.Provider value={{ onOpenChange }}>
      {open && (
        <DialogPortal>
          <DialogOverlay onClick={() => onOpenChange?.(false)} />
          {children}
        </DialogPortal>
      )}
    </DialogContext.Provider>
  );
};

export {
  DialogProvider as Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose
};
