import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useLanguageHook } from '@/components/useLanguageHook';

export default function SimpleSelect({
  label,
  value,
  onValueChange,
  options, // [{ value: 'val', label: 'Display Label' }, ...]
  placeholder,
  id,
  disabled = false,
  className = "",
  required = false,
  error
}) {
  const { t } = useLanguageHook();
  const defaultPlaceholder = placeholder || t('common.selectPlaceholder', { defaultValue: 'Select an option...' });

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <Label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id} className={error ? 'border-red-500 dark:border-red-500' : ''}>
          <SelectValue placeholder={defaultPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}