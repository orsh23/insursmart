import * as React from "react"
import { useState } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "../utils/cn"

const ShadcnTooltip = TooltipPrimitive.Root;
const TooltipContent = TooltipPrimitive.Content;
const TooltipProvider = TooltipPrimitive.Provider;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipPortal = TooltipPrimitive.Portal;

export default function Tooltip({ 
  children, 
  content, 
  side = "top", 
  align = "center",
  language = "en",
  delayDuration = 300
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const isRTL = Boolean(language === "he");

  const getTooltipSide = () => {
    if (isRTL) {
      if (side === "left") return "right";
      if (side === "right") return "left";
    }
    return side;
  };

  return (
    <TooltipProvider>
      <ShadcnTooltip open={isOpen} onOpenChange={setIsOpen} delayDuration={delayDuration}>
        <TooltipTrigger asChild
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }}
        >
          {children}
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent 
            side={getTooltipSide()} 
            align={align} 
            className={cn(
              "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
              isRTL ? 'rtl text-right' : 'ltr text-left'
            )}
            sideOffset={5}
          >
            {content}
          </TooltipContent>
        </TooltipPortal>
      </ShadcnTooltip>
    </TooltipProvider>
  );
}
