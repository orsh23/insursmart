import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';

export default function FormField({
  type = 'text',
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  options = [], // For select fields
  rows = 3, // For textarea
  className = '',
  inputClassName = '',
  ...props
}) {
  const { t, isRTL } = useLanguageHook();

  const fieldId = `field-${name}`;
  const hasError = !!error;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`${inputClassName} ${hasError ? 'border-red-500' : ''}`}
            {...props}
          />
        );

      case 'select':
        return (
          <Select 
            value={value || ''} 
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger 
              id={fieldId}
              className={`${inputClassName} ${hasError ? 'border-red-500' : ''}`}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              name={name}
              checked={!!value}
              onCheckedChange={onChange}
              disabled={disabled}
              className={hasError ? 'border-red-500' : ''}
            />
            {label && (
              <Label htmlFor={fieldId} className="text-sm font-normal">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
          </div>
        );

      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={fieldId}
              name={name}
              checked={!!value}
              onCheckedChange={onChange}
              disabled={disabled}
            />
            {label && (
              <Label htmlFor={fieldId} className="text-sm font-normal">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
          </div>
        );

      default:
        return (
          <Input
            id={fieldId}
            name={name}
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`${inputClassName} ${hasError ? 'border-red-500' : ''}`}
            {...props}
          />
        );
    }
  };

  if (type === 'checkbox' || type === 'switch') {
    return (
      <div className={`space-y-2 ${className}`}>
        {renderInput()}
        {hasError && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {renderInput()}
      {hasError && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}