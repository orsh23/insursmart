import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { cn } from "../utils/cn";

const DropdownMenuContext = createContext({
  open: false,
  setOpen: () => {},
  dir: "ltr",
});

const useDropdownMenuContext = () => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("useDropdownMenuContext must be used within a DropdownMenu");
  }
  return context;
};

const DropdownMenu = React.forwardRef(({ children, dir = "ltr", ...props }, ref) => {
  const [open, setOpen] = useState(false);
  // Ensure contextValue only updates when open or dir changes
  const contextValue = React.useMemo(() => ({ open, setOpen, dir }), [open, dir]);
  
  return (
    <DropdownMenuContext.Provider value={contextValue}>
      <div ref={ref} className="relative inline-block text-left" {...props}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
});
DropdownMenu.displayName = "DropdownMenu";

const DropdownMenuTrigger = React.forwardRef(({ children, asChild = false, className, ...props }, ref) => {
  const { open, setOpen } = useDropdownMenuContext();
  
  const handleClick = (e) => {
    if(props.onClick) {
      props.onClick(e); // Call original onClick if present
    }
    if (!e.defaultPrevented) { // Allow original onClick to prevent default behavior
        setOpen(!open);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref,
      onClick: handleClick,
      "aria-expanded": open,
      "aria-haspopup": "menu", // Corrected aria attribute
      ...children.props,
      className: cn(children.props.className, className),
    });
  }

  return (
    <button
      type="button"
      ref={ref}
      className={cn("inline-flex justify-center items-center", className)}
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="menu" // Corrected aria attribute
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef(
  ({ children, align = "start", sideOffset = 4, className, style, ...props }, ref) => {
    const { open, setOpen, dir } = useDropdownMenuContext();
    const menuRef = useRef(null);
    
    useEffect(() => {
      const handleOutsideClick = (event) => {
        const { target } = event;
        if (menuRef.current && !menuRef.current.contains(target)) {
          // Check if click was on the trigger itself
          const triggerElement = menuRef.current.closest('.relative')?.querySelector('[aria-haspopup="menu"]');
          if (triggerElement && triggerElement.contains(target)) {
            return; // Click was on the trigger, let trigger handle open/close.
          }
          setOpen(false);
        }
      };
      
      if (open) {
        document.addEventListener("mousedown", handleOutsideClick);
      }
      
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
      };
    }, [open, setOpen]);

    if (!open) return null;

    const alignmentClasses = dir === "rtl" 
      ? (align === "end" ? "left-0" : "right-0") 
      : (align === "end" ? "right-0" : "left-0");
    
    const transformOriginClass = dir === "rtl"
      ? (align === "end" ? "origin-top-left" : "origin-top-right")
      : (align === "end" ? "origin-top-right" : "origin-top-left");

    return (
      <div
        ref={node => {
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
          menuRef.current = node;
        }}
        style={{ position: 'absolute', top: `${sideOffset}px`, ...style }}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-white dark:bg-gray-800 p-1 text-gray-900 dark:text-gray-50 shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          transformOriginClass,
          alignmentClasses, 
          className
        )}
        // data-state for CSS animations (if you add them)
        data-state={open ? "open" : "closed"} 
        {...props}
      >
        {/* Adding a div for focus management if needed, or manage focus on items */}
        <div role="menu">
            {children}
        </div>
      </div>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef(
  ({ className, children, disabled, inset, onClick, ...props }, ref) => {
    const { setOpen } = useDropdownMenuContext();
    
    const handleClick = (e) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      if (onClick) {
        onClick(e); // Call the passed onClick handler
      }
      if (!e.defaultPrevented) { // Allow onClick to prevent closing
         setOpen(false); // Close dropdown after click if not prevented
      }
    };

    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className={cn(
          "relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
          "focus:bg-gray-100 focus:text-gray-900 dark:focus:bg-gray-700 dark:focus:text-gray-50",
          inset && (props.dir === "rtl" ? "pr-8" : "pl-8"), // Adjust for RTL
          disabled ? "pointer-events-none opacity-50" : "cursor-pointer",
          className
        )}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e);}}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-gray-900 dark:text-gray-50",
      inset && (props.dir === "rtl" ? "pr-8" : "pl-8"), // Adjust for RTL
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    aria-orientation="horizontal"
    className={cn("-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};