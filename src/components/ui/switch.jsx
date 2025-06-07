
import React from "react";
import { cn } from "../utils/cn";

const Switch = React.forwardRef(({ 
  className, 
  checked, 
  onCheckedChange, 
  disabled, 
  ...props 
}, ref) => (
  <button
    ref={ref}
    type="button"
    role="switch"
    aria-checked={checked}
    data-state={checked ? "checked" : "unchecked"}
    disabled={disabled}
    className={cn(
      "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
      "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-blue-600" : "bg-gray-200",
      className
    )}
    onClick={() => onCheckedChange && onCheckedChange(!checked)}
    {...props}
  >
    <span 
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
        checked ? "translate-x-5" : "translate-x-0"
      )}
      data-state={checked ? "checked" : "unchecked"}
    />
  </button>
));
Switch.displayName = "Switch";

export { Switch };
