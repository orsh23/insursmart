// Content of components/hooks/useToastManager.js
import { useToast } from "@/components/ui/use-toast"; 
import { useLanguageHook } from "@/components/useLanguageHook"; 
import { useCallback } from "react";

/**
 * @typedef {'success' | 'error' | 'info' | 'warning' | 'default'} ToastVariant
 * @typedef {{ title?: string, description: string, variant?: ToastVariant, duration?: number, action?: React.ReactNode }} ToastOptions
 */

/**
 * A centralized hook for displaying toasts using the application's toast system.
 * Ensures consistent toast appearance and localization.
 *
 * @returns {{
 *  showToast: (options: ToastOptions) => void,
 *  showSuccessToast: (description: string, title?: string) => void,
 *  showErrorToast: (description: string, title?: string) => void,
 *  showInfoToast: (description: string, title?: string) => void,
 *  showWarningToast: (description: string, title?: string) => void
 * }}
 */
export function useToastManager() {
  const { toast } = useToast(); // This is the shadcn/ui toast hook
  const { t } = useLanguageHook();

  /**
   * Displays a toast with the given options.
   * @param {ToastOptions} options - Toast display options.
   */
  const showToast = useCallback((options) => {
    const {
      title,
      description,
      variant = 'default', // shadcn default variant
      duration = 5000, // Default duration
      action,
    } = options;

    let toastVariant = variant;
    // Map our conceptual variants to shadcn's if needed, though shadcn primarily uses 'default' and 'destructive'.
    // For custom styling, you'd adjust the Toast component itself or use classNames.
    if (variant === 'error') toastVariant = 'destructive';
    if (variant === 'success' && !title) { // Provide default success title if not given
        // Title might not be directly supported by default shadcn toast variant styling other than 'destructive'
        // Description is key.
    }
    
    toast({
      title: title, // Title is optional in shadcn toast but good for context
      description: description,
      variant: toastVariant,
      duration: duration,
      action: action,
    });
  }, [toast]);

  const showSuccessToast = useCallback((description, title) => {
    showToast({
      title: title || t('common.success', { defaultValue: 'Success!' }),
      description,
      variant: 'default', // Or a custom 'success' if styled
    });
  }, [showToast, t]);

  const showErrorToast = useCallback((description, title) => {
    showToast({
      title: title || t('common.error', { defaultValue: 'Error' }),
      description,
      variant: 'destructive',
    });
  }, [showToast, t]);

  const showInfoToast = useCallback((description, title) => {
    showToast({
      title: title || t('common.information', { defaultValue: 'Information' }), // Assuming translation key
      description,
      variant: 'default', // Or a custom 'info'
    });
  }, [showToast, t]);

  const showWarningToast = useCallback((description, title) => {
    showToast({
      title: title || t('common.warning', { defaultValue: 'Warning' }),
      description,
      variant: 'default', // Or a custom 'warning', 'destructive' could also be used if warning is severe
    });
  }, [showToast, t]);

  return {
    showToast,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast,
  };
}