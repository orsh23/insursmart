import React from "react";
import { cn } from "../utils/cn";

const Tabs = React.forwardRef(({ className, defaultValue, value, onValueChange, ...props }, ref) => {
  const [selectedValue, setSelectedValue] = React.useState(value || defaultValue);

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <div
      ref={ref}
      className={cn(className)} // Simplified className usage
      {...props}
    >
      {React.Children.map(props.children, child => {
        if (!React.isValidElement(child)) return child;
        
        // Pass selectedValue and handleValueChange to direct children (TabsList and TabsContent)
        // TabsList will then need to pass these to its children (TabsTrigger)
        return React.cloneElement(child, {
          selectedValue: selectedValue, // Explicitly pass current selectedValue
          // Pass the handler function to allow children (like TabsTrigger via TabsList) to change the value
          // Note: TabsContent also receives onValueChange but doesn't use it, which is fine.
          // TabsList will receive onValueChange to pass to TabsTriggers
          handleTabChange: handleValueChange, // Renamed for clarity for TabsList
          // For TabsContent, selectedValue is the primary prop it needs
        });
      })}
    </div>
  );
});
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef(({ className, selectedValue, handleTabChange, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  >
    {/* TabsList now needs to iterate its children (TabsTrigger) and pass props */}
    {React.Children.map(props.children, child => {
      if (!React.isValidElement(child)) return child;
      return React.cloneElement(child, {
        selectedValue: selectedValue,
        onValueChange: handleTabChange, // Pass the callback to TabsTrigger
      });
    })}
  </div>
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(({ className, value, selectedValue, onValueChange, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      selectedValue === value
        ? "bg-background text-foreground shadow-sm"
        : "hover:bg-muted/50", // Adjusted styling for non-active
      className
    )}
    onClick={() => onValueChange?.(value)}
    data-state={selectedValue === value ? "active" : "inactive"}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(({ className, value, selectedValue, handleTabChange, ...props }, ref) => {
  // handleTabChange is passed but not used by TabsContent, which is fine.
  if (value !== selectedValue) return null;
  
  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };