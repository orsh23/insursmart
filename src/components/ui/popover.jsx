import * as React from "react";
import { cn } from "../utils/cn";

export function Popover({ children, open, onOpenChange }) {
  const [isOpen, setIsOpen] = React.useState(open || false);
  const popoverRef = React.useRef(null);
  
  // Sync state with props
  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);
  
  // Handle outside clicks
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
        if (onOpenChange) onOpenChange(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onOpenChange]);
  
  // Default context value
  const contextValue = React.useMemo(() => ({
    open: isOpen,
    onOpenChange: (value) => {
      setIsOpen(value);
      if (onOpenChange) onOpenChange(value);
    }
  }), [isOpen, onOpenChange]);
  
  return (
    <PopoverContext.Provider value={contextValue}>
      <div ref={popoverRef} className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

// Context for sharing state between components
const PopoverContext = React.createContext({
  open: false,
  onOpenChange: () => {}
});

export function PopoverTrigger({ children, asChild = false }) {
  const { open, onOpenChange } = React.useContext(PopoverContext);
  
  const handleClick = React.useCallback(() => {
    onOpenChange(!open);
  }, [open, onOpenChange]);
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick
    });
  }
  
  return (
    <button type="button" onClick={handleClick}>
      {children}
    </button>
  );
}

export function PopoverContent({ children, className, align = "center" }) {
  const { open } = React.useContext(PopoverContext);
  
  if (!open) {
    return null;
  }
  
  const alignClasses = {
    start: "left-0",
    center: "left-1/2 transform -translate-x-1/2",
    end: "right-0"
  };
  
  return (
    <div className={cn(
      "absolute z-50 bg-white border rounded-md shadow-md mt-2",
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
}