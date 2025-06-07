import React from "react";

export function Badge({ 
  children, 
  variant = "default", // default, secondary, destructive, outline
  className = "",
  ...props 
}) {
  let baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  let variantClasses = "";
  switch(variant) {
    case "secondary":
      variantClasses = "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80";
      break;
    case "destructive":
      variantClasses = "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80";
      break;
    case "outline":
      variantClasses = "text-foreground";
      break;
    default: // "default"
      variantClasses = "border-transparent bg-primary text-primary-foreground hover:bg-primary/80";
      break;
  }

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}

// Also export as default for compatibility
export default Badge;