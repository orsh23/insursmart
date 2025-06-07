import React, { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "../utils/cn";

const Checkbox = React.forwardRef(
  ({ className, checked: controlledChecked, onCheckedChange, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = useState(controlledChecked || false);

    const isControlled = controlledChecked !== undefined;
    const isChecked = isControlled ? controlledChecked : internalChecked;

    const handleChange = (event) => {
      if (!isControlled) {
        setInternalChecked(event.target.checked);
      }
      onCheckedChange?.(event.target.checked);
    };

    return (
      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            type="checkbox"
            ref={ref}
            checked={isChecked}
            onChange={handleChange}
            className="peer absolute h-4 w-4 opacity-0"
            {...props}
          />
          <div
            className={cn(
              "h-4 w-4 rounded border border-primary flex items-center justify-center",
              isChecked ? "bg-primary" : "bg-transparent",
              className
            )}
          >
            {isChecked && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
        </div>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };