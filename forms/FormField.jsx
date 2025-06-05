
import React from 'react';
import { Label } from '@/components/ui/label';
import { useLanguageHook } from '@/components/useLanguageHook';

// A standardized form field component that handles label and error display consistently
export default function FormField({
  id,
  label,
  children,
  error,
  required = false,
  helpText,
  className = "",
  labelClassName = "",
  fieldClassName = "",
  errorClassName = "",
  helpClassName = ""
}) {
  const { t } = useLanguageHook();
  
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <Label 
          htmlFor={id} 
          className={labelClassName}
          required={required}
        >
          {label}
        </Label>
      )}
      
      <div className={fieldClassName}>
        {children}
      </div>
      
      {error && (
        <p className={`mt-1 text-sm text-red-500 dark:text-red-400 ${errorClassName}`}>
          {error}
        </p>
      )}
      
      {helpText && (
        <p className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${helpClassName}`}>
          {helpText}
        </p>
      )}
    </div>
  );
}
