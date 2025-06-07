import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

/**
 * Reusable form field component supporting multiple input types
 */
export default function FormField({
  id,
  label,
  labelHe,
  type = "text",
  value,
  onChange,
  placeholder,
  placeholderHe,
  options = [],
  error,
  errorHe,
  hint,
  hintHe,
  required = false,
  disabled = false,
  language = "en",
  min,
  max,
  rows = 3,
  className = "",
  dateFormat = "yyyy-MM-dd"
}) {
  const isRTL = language === "he";
  const displayLabel = isRTL ? labelHe || label : label;
  const displayPlaceholder = isRTL ? placeholderHe || placeholder : placeholder;
  const displayError = isRTL ? errorHe || error : error;
  const displayHint = isRTL ? hintHe || hint : hint;
  
  // Handle different field types
  const renderField = () => {
    switch (type) {
      case "text":
      case "email":
      case "password":
      case "number":
      case "tel":
      case "url":
        return (
          <Input
            id={id}
            type={type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={displayPlaceholder}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            className={className}
          />
        );
      
      case "textarea":
        return (
          <Textarea
            id={id}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={displayPlaceholder}
            disabled={disabled}
            required={required}
            rows={rows}
            className={className}
          />
        );
      
      case "select":
        return (
          <Select
            value={value?.toString() || ""}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger id={id} className={className}>
              <SelectValue placeholder={displayPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option, index) => (
                <SelectItem key={index} value={option.value?.toString() || ""}>
                  {isRTL ? option.labelHe || option.label : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={id}
              checked={value || false}
              onCheckedChange={onChange}
              disabled={disabled}
              className={className}
            />
            {displayLabel && (
              <label
                htmlFor={id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {displayLabel}
              </label>
            )}
          </div>
        );
      
      case "switch":
        return (
          <div className="flex items-center justify-between space-x-2">
            {displayLabel && (
              <label
                htmlFor={id}
                className="text-sm font-medium leading-none"
              >
                {displayLabel}
              </label>
            )}
            <Switch
              id={id}
              checked={value || false}
              onCheckedChange={onChange}
              disabled={disabled}
              className={className}
            />
          </div>
        );
      
      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id={id}
                variant="outline"
                className={`justify-start text-left font-normal ${!value ? 'text-muted-foreground' : ''} ${className}`}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), dateFormat) : displayPlaceholder}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={onChange}
                disabled={disabled}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      
      default:
        return (
          <Input
            id={id}
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={displayPlaceholder}
            disabled={disabled}
            required={required}
            className={className}
          />
        );
    }
  };

  // Don't render label for checkbox type (handled within the checkbox component)
  const shouldRenderLabel = type !== "checkbox" && type !== "switch";

  return (
    <div className="space-y-2">
      {shouldRenderLabel && displayLabel && (
        <div className="flex justify-between items-center">
          <Label htmlFor={id} className={required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}>
            {displayLabel}
          </Label>
        </div>
      )}
      
      {renderField()}
      
      {displayError && (
        <p className="text-sm text-red-500">{displayError}</p>
      )}
      
      {displayHint && !displayError && (
        <p className="text-sm text-gray-500">{displayHint}</p>
      )}
    </div>
  );
}