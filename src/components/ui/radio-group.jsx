import React from "react";
import { cn } from "../utils/cn"; // Assuming cn utility is in utils
import { Circle } from "lucide-react"; // For the indicator

const RadioGroupContext = React.createContext(null);

const RadioGroup = React.forwardRef(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange }}>
        <div
          ref={ref}
          className={cn("grid gap-2", className)}
          role="radiogroup"
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef(
  ({ className, value: itemValue, children, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);

    if (!context) {
      console.error("RadioGroupItem must be used within a RadioGroup provider.");
      // Potentially throw an error or return a fallback UI
      // For now, log an error and render basic button
      return (
        <button 
          ref={ref}
          type="button"
          role="radio"
          aria-checked="false"
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
           {/* Fallback visual if context is missing */}
        </button>
      );
    }
    
    const isChecked = context.value === itemValue;

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isChecked}
        data-state={isChecked ? "checked" : "unchecked"}
        onClick={() => context.onValueChange(itemValue)}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          isChecked ? "bg-primary text-primary-foreground" : "",
          className
        )}
        {...props}
      >
        {isChecked && (
          <div className="flex items-center justify-center h-full w-full">
            <Circle className="h-2.5 w-2.5 fill-current text-current" />
          </div>
        )}
        {/* If children are provided (e.g. for custom styling or labels next to the radio button), render them */}
        {/* For a simple radio, children might not be used directly inside RadioGroupItem if Label is separate */}
        {/* children */} 
      </button>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };