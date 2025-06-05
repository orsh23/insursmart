import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// A reusable select component for filter bars
const FilterSelect = ({ 
  id,
  name,
  label,
  labelKey, // Translation key for label
  value,
  onChange,
  options,
  defaultValueLabel,
  icon: Icon,
  className = ""
}) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium block mb-1 flex items-center">
        {Icon && <Icon className="h-3.5 w-3.5 mr-1.5 text-gray-500" />}
        {label}
      </label>
      <Select name={name} value={value} onValueChange={(value) => onChange({ target: { name, value } })} className="w-full">
        <SelectTrigger id={id}>
          <SelectValue placeholder={defaultValueLabel} />
        </SelectTrigger>
        <SelectContent>
          {defaultValueLabel && <SelectItem value="all">{defaultValueLabel}</SelectItem>}
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FilterSelect;