import React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  // ToastAction, // Uncomment if you plan to use it
} from "@/components/ui/toast" 
import { useToast } from "@/components/ui/use-toast" 

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}> {/* Ensure props like 'open' and 'onOpenChange' from useToast are passed */}
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action} {/* This is where a ToastAction component would render if passed */}
            {/* ToastClose is now part of the Toast component's internal structure for this simplified version */}
            {/* If you want an explicit close button managed by Toaster, you'd add <ToastClose /> here and adjust Toast */}
          </Toast>
        )
      })}
      <ToastViewport /> {/* This now uses the actual Viewport component */}
    </ToastProvider>
  );
}