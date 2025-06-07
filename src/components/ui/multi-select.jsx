import React, { useState, useRef, useEffect } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { X, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/components/utils/cn';

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select options',
  emptyMessage = 'No options found.',
  buttonClassName = '',
  disabled = false
}) {
  const { t } = useLanguageHook();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);

  // close if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(e.target) && 
        open
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, buttonRef]);

  const handleSelect = (value) => {
    const isSelected = selected.includes(value);
    let newSelected;
    
    if (isSelected) {
      newSelected = selected.filter(item => item !== value);
    } else {
      newSelected = [...selected, value];
    }
    
    onChange(newSelected);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", buttonClassName)}
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1 py-1 max-w-full overflow-hidden">
              {selected.length <= 2 ? (
                selected.map(item => (
                  <Badge key={item} variant="secondary" className="mr-1">
                    {options.find(option => option.value === item)?.label || item}
                    <button 
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(item);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span>{selected.length} {t('common.selected', { defaultValue: 'selected' })}</span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={t('common.search', { defaultValue: 'Search...' })} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                    )}>
                      {isSelected ? <Check className="h-3 w-3" /> : null}
                    </div>
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const Badge = ({ className, children, ...props }) => {
  return (
    <span 
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default MultiSelect;