import React from "react";

export default function PageLayout({ children, className = "" }) {
  return (
    <div className={`p-4 sm:p-6 space-y-6 ${className}`}>
      {children}
    </div>
  );
}