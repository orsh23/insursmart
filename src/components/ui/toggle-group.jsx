
import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { cva } from "class-variance-authority"
import { cn } from "../utils/cn" // Updated path
import { toggleVariants } from "./toggle" // Assuming toggleVariants is in toggle.jsx in same folder
import { useState, createContext, useContext } from 'react';

const ToggleGroupContext = createContext({
  value: undefined,
  onValueChange: () => {},
  type: "single",
  disabled: false,
});

export function ToggleGroup({
  type = "single",
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  className,
  children,
  ...props
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  const currentValue = value !== undefined ? value : internalValue;
  
  const handleValueChange = (itemValue) => {
    if (disabled) return;
    
    let newValue;
    
    if (type === "single") {
      newValue = itemValue;
    } else if (type === "multiple") {
      newValue = Array.isArray(currentValue) ? [...currentValue] : [];
      const index = newValue.indexOf(itemValue);
      
      if (index >= 0) {
        // If item already in the array, remove it
        newValue.splice(index, 1);
      } else {
        // Otherwise add it
        newValue.push(itemValue);
      }
    }
    
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <ToggleGroupContext.Provider 
      value={{ value: currentValue, onValueChange: handleValueChange, type, disabled }}
    >
      <div 
        className={cn(
          "inline-flex items-center justify-center gap-1 bg-gray-100 rounded-md p-1",
          className
        )} 
        {...props}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

export function ToggleGroupItem({
  value,
  disabled = false,
  className,
  children,
  ...props
}) {
  const context = useContext(ToggleGroupContext);
  const isDisabled = disabled || context.disabled;
  
  const isActive = context.type === "multiple" 
    ? Array.isArray(context.value) && context.value.includes(value)
    : context.value === value;

  const handleClick = () => {
    if (!isDisabled) {
      context.onValueChange(value);
    }
  };

  return (
    <button
      type="button"
      role="radio"
      aria-pressed={isActive}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-white text-foreground shadow-sm" 
          : "hover:bg-muted hover:text-muted-foreground",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
