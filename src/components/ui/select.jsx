import React from "react";

export function Select({ children, value, onValueChange, className, ...props }) {
  const handleChange = (event) => {
    if (onValueChange) {
      onValueChange(event.target.value);
    }
  };

  return (
    <select
      value={value || ""} // Ensure value is not undefined
      onChange={handleChange}
      className={`border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, className, ...props }) {
  // In a simple select, the trigger is part of the select itself.
  // This component can be a passthrough or a div wrapper if specific styling is needed for the "trigger" appearance.
  // For now, let's assume it's not strictly needed for the basic select functionality.
  // If it's meant to be the visual part before dropdown opens, it's handled by the native select.
  // For custom select, this would be different.
  // For this simple version, we'll just render children, assuming it's the select itself or placeholder text.
  return <div className={className} {...props}>{children}</div>; // This might need adjustment based on usage
}

export function SelectValue({ placeholder, children }) {
  // This is tricky with a native select. The selected value is displayed by the select itself.
  // If children are provided, they might be the options.
  // If a placeholder is needed and no value is selected, often the first <option> is disabled and selected.
  // For this simplified component, we don't render a separate SelectValue for native select.
  // However, if this component is used outside a SelectContent, it implies a custom structure.
  // For now, we'll return null as the native select handles its own value display.
  // If used for custom select, it would display the selected option's label.
  if (placeholder && !children) return <option value="" disabled>{placeholder}</option>;
  return null; 
}


export function SelectContent({ children, className, ...props }) {
  // For a native select, SelectContent is not a distinct visual element. Options are direct children.
  // This component primarily serves semantic grouping or for custom select dropdowns.
  // We'll return children directly.
  return <>{children}</>;
}

export function SelectItem({ children, value, className, ...props }) {
  return (
    <option value={value} className={className} {...props}>
      {children}
    </option>
  );
}