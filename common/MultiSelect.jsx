import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function MultiSelect({ 
  placeholder, 
  options, 
  value, 
  onChange, 
  disabled, 
  className,
  language = "en"
}) {
  const isRTL = language === "he";
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => options.filter(option => value?.includes(option.value)),
    [options, value]
  );

  const handleUnselect = (item) => {
    onChange(value?.filter(selectedItem => selectedItem !== item.value));
  };

  const handleSelect = (selectedValue) => {
    onChange([...new Set([...(value || []), selectedValue])]);
  };

  const determineLabel = (option) => {
    return isRTL && option.labelHe ? option.labelHe : option.label;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          tabIndex={0}
          className={cn(
            "flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          onClick={() => !disabled && setOpen(!open)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(!open);
            }
          }}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length === 0 && (
              <span className="text-muted-foreground">{placeholder || "Select..."}</span>
            )}
            {selected.map((selectedItem) => (
              <Badge
                key={selectedItem.value}
                variant="secondary"
                className={cn(
                  "mr-1 mb-1"
                )}
              >
                {determineLabel(selectedItem)}
                {!disabled && (
                  <button
                    className={`ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUnselect(selectedItem);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 max-h-[300px] overflow-auto" align="start">
        <Command>
          <CommandGroup>
            {options.map((option) => {
              const isSelected = value?.includes(option.value);
              return (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    isSelected ? handleUnselect(option) : handleSelect(option.value);
                  }}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={isSelected ? "opacity-100" : "opacity-0"}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span>{determineLabel(option)}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export const MultiSelectItem = ({ children, value }) => {
  return null;
};

export const MultiSelectContent = React.forwardRef((props, ref) => {
  return null;
});

export const MultiSelectTrigger = React.forwardRef((props, ref) => {
  return null;
});

export const MultiSelectValue = React.forwardRef((props, ref) => {
  return null;
});