import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { useLanguageHook } from '@/components/useLanguageHook'; // Corrected import

export default function SelectField({
  id,
  label,
  value,
  onValueChange,
  options, // Array of { value: string, label: string }
  placeholder,
  error,
  disabled = false,
  className = "",
  selectClassName = "",
  labelClassName = "",
  required = false,
}) {
  const { t, isRTL } = useLanguageHook();

  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {label && (
        <Label htmlFor={id} className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${labelClassName}`}>
          {label}
          {required && <span className="text-red-500 dark:text-red-400 ltr:ml-1 rtl:mr-1">*</span>}
        </Label>
      )}
      <Select
        value={value || ""} // Ensure value is not undefined for Select
        onValueChange={onValueChange}
        disabled={disabled}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <SelectTrigger
          id={id}
          className={`w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 ${selectClassName} ${error ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400' : 'focus:ring-blue-500 dark:focus:ring-blue-400'}`}
        >
          <SelectValue placeholder={placeholder || t('filters.selectOption', {defaultValue: 'Select an option'})} />
        </SelectTrigger>
        <SelectContent className="dark:bg-gray-700 dark:text-gray-200 max-h-60">
          {placeholder && <SelectItem value={null} disabled className="text-gray-400 dark:text-gray-500">{placeholder || t('filters.selectOption', {defaultValue: 'Select an option'})}</SelectItem>}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-red-500 dark:text-red-400 pt-1 flex items-center"><AlertCircle className="h-3.5 w-3.5 mr-1 rtl:ml-1" />{error}</p>}
    </div>
  );
}