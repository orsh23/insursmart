import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { useLanguage } from '../context/LanguageContext';

/**
 * Standard component for page header action buttons
 * 
 * @param {object} props Component props
 * @param {Array<{icon: React.ComponentType, label: string, onClick: Function, variant: string, disabled: boolean}>} props.actions 
 *   Array of action configurations
 * @param {string} props.className Additional CSS classes
 * @param {React.ReactNode} props.children Optional additional content
 * @param {string} props.alignment Horizontal alignment ("start", "end", "between", "center")
 */
export default function HeaderActions({
  actions = [],
  className,
  children,
  alignment = "end"
}) {
  const { isRTL, t } = useLanguage();
  
  const alignmentClasses = {
    start: "justify-start",
    end: "justify-end",
    between: "justify-between",
    center: "justify-center"
  };

  const buttonMargin = isRTL ? "ml-2" : "mr-2";

  return (
    <div 
      className={cn(
        "flex flex-wrap gap-2", 
        alignmentClasses[alignment] || alignmentClasses.end,
        className
      )}
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        
        return (
          <Button
            key={index}
            variant={action.variant || "default"}
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.ariaLabel || action.label}
            title={action.title || action.label}
          >
            {Icon && <Icon className={`h-4 w-4 ${action.label ? buttonMargin : ""}`} />}
            {action.label && action.label}
          </Button>
        );
      })}
      {children}
    </div>
  );
}