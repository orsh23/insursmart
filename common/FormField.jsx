import React from 'react';
import { cn } from '../utils/cn';
import { Label } from '../ui/label';

/**
 * A standard form field container with label, required indicator, and error message
 * 
 * @param {object} props Component props
 * @param {string} props.id Form field ID
 * @param {string|React.ReactNode} props.label Label text or node
 * @param {string|React.ReactNode} props.error Error message or node
 * @param {boolean} props.required Whether the field is required
 * @param {React.ReactNode} props.children Form field content
 * @param {string} props.className Additional CSS classes for the container
 * @param {string} props.labelClassName Additional CSS classes for the label
 * @param {string} props.errorClassName Additional CSS classes for the error message
 * @param {string} props.childrenWrapperClassName Additional CSS classes for the children wrapper
 */
const FormField = ({
  id,
  label,
  error,
  required = false,
  children,
  className,
  labelClassName,
  errorClassName,
  childrenWrapperClassName
}) => {
  const fieldId = id || Math.random().toString(36).substring(2, 9);
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label 
          htmlFor={fieldId}
          className={cn(
            "flex items-center text-sm font-medium",
            labelClassName
          )}
        >
          {label}
          {required && (
            <span className="ml-1 text-destructive">*</span>
          )}
        </Label>
      )}
      
      <div className={cn("", childrenWrapperClassName)}>
        {children}
      </div>
      
      {error && (
        <div 
          className={cn(
            "text-sm text-destructive",
            errorClassName
          )}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;