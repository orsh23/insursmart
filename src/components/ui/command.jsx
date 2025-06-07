
import React from "react";
import { cn } from "../utils/cn"; // Updated path
import { Button } from "./button";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";

const Command = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-gray-950",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
Command.displayName = "Command";

const CommandInput = React.forwardRef(({ className, value, onValueChange, ...props }, ref) => (
  <div className="flex items-center border-b px-3">
    <Input
      ref={ref}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn(
        "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  >
    {children}
  </div>
));
CommandList.displayName = "CommandList";

const CommandEmpty = React.forwardRef((props, ref) => (
  <div ref={ref} className="py-6 text-center text-sm" {...props} />
));
CommandEmpty.displayName = "CommandEmpty";

const CommandGroup = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-gray-950",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
CommandGroup.displayName = "CommandGroup";

const CommandSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 h-px bg-gray-200", className)}
    {...props}
  />
));
CommandSeparator.displayName = "CommandSeparator";

const CommandItem = React.forwardRef(({ className, onSelect, children, ...props }, ref) => (
  <Button
    ref={ref}
    variant="ghost"
    onClick={() => onSelect?.()}
    className={cn(
      "w-full justify-start text-left px-2 py-1.5 text-sm rounded-md hover:bg-gray-100",
      className
    )}
    {...props}
  >
    {children}
  </Button>
));
CommandItem.displayName = "CommandItem";

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator
};
