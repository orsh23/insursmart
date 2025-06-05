import React, { useState, useRef, useEffect } from 'react';
import { Command } from 'cmdk';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";

export default function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder,
  maxItems,
  disabled = false,
  className
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const handleUnselect = (item) => {
    onChange(selected.filter((i) => i !== item));
  };

  const handleSelect = (item) => {
    onChange([...selected, item]);
    setInputValue('');
  };

  const filteredOptions = options.filter((option) => {
    const matchesSearch = option.label.toLowerCase().includes(inputValue.toLowerCase());
    const isSelected = selected.includes(option.value);
    return matchesSearch && !isSelected;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            selected.length > 0 ? "h-full" : "h-10",
            className
          )}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length === 0 && placeholder}
            {selected.map((item) => {
              const option = options.find((o) => o.value === item);
              return (
                <Badge
                  key={item}
                  variant="secondary"
                  className="mr-1 mb-1"
                >
                  {option?.label}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(item);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => handleUnselect(item)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <div className="flex items-center border-b px-3">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search..."
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="max-h-[300px] overflow-auto">
            {filteredOptions.map((option) => (
              <div
                key={option.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => {
                  handleSelect(option.value);
                  if (maxItems && selected.length + 1 >= maxItems) {
                    setOpen(false);
                  }
                }}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  {
                    "bg-accent text-accent-foreground": selected.includes(option.value),
                  }
                )}
              >
                {option.label}
                {selected.includes(option.value) && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <p className="p-2 text-sm text-center text-muted-foreground">
                No results found
              </p>
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}