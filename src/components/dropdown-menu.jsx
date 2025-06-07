import React, { useState } from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (child.type.displayName === "DropdownMenuTrigger") {
          return React.cloneElement(child, { onClick: () => setOpen(!open) });
        }
        if (child.type.displayName === "DropdownMenuContent") {
          return open && React.cloneElement(child, { onClose: () => setOpen(false) });
        }
        return child;
      })}
    </div>
  );
}

export function DropdownMenuTrigger({ children, onClick }) {
  return <div onClick={onClick}>{children}</div>;
}
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export function DropdownMenuContent({ children, align = "end", className, onClose, ...props }) {
  const alignmentClasses = {
    start: "left-0",
    end: "right-0",
  };

  return (
    <div 
      className={cn(
        "absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-md",
        alignmentClasses[align],
        className
      )}
      {...props}
    >
      {React.Children.map(children, child => {
        if (child) {
          return React.cloneElement(child, { onClose });
        }
        return null;
      })}
    </div>
  );
}
DropdownMenuContent.displayName = "DropdownMenuContent";

export function DropdownMenuItem({ children, className, onClick, onClose, ...props }) {
  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (onClose) onClose();
  };
  
  return (
    <button
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
DropdownMenuItem.displayName = "DropdownMenuItem";

export function DropdownMenuSeparator({ className, ...props }) {
  return (
    <div
      className={cn("h-px my-1 bg-gray-200", className)}
      {...props}
    />
  );
}
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";