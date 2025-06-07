import React from "react";

export default function FilterTitle({ children, className = "" }) {
  return (
    <div className={`text-sm font-medium mb-1 ${className}`}>
      {children}
    </div>
  );
}