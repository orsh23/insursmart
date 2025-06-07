import React from 'react';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { cn } from '@/components/utils/cn';

/**
 * A generic, reusable form field component for react-hook-form.
 * It encapsulates the Controller, Label, and error message display.
 * This component uses a "render prop" pattern via its children.
 *
 * @param {object} props - The component props.
 * @param {object} props.control - The control object from react-hook-form.
 * @param {string} props.name - The name of the field (must match form's defaultValues).
 * @param {string} [props.label] - The display label for the field.
 * @param {object} [props.rules] - Validation rules for react-hook-form.
 * @param {string} [props.className] - Optional container class name.
 * @param {function({field, fieldState})} props.children - A render prop function that receives `field` and `fieldState`.
 */
const FormField = ({
  control,
  name,
  label,
  rules,
  className,
  children,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-1.5', className)}>
          {label && <Label htmlFor={name}>{label}</Label>}
          {/* Ensure children is a function before calling it */}
          {typeof children === 'function'
            ? children({ field, fieldState })
            : <p className="text-sm text-red-600">Error: FormField children must be a function.</p>
          }
          {fieldState.error && (
            <p className="text-sm font-medium text-destructive">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
};

export default FormField;