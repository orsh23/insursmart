import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '@/components/ui/cn';

/**
 * Standard loading state component with spinner and optional message
 *
 * @param {object} props Component props
 * @param {string} props.message Custom message to display
 * @param {string} props.messageKey Translation key for message
 * @param {string} props.className Additional CSS classes
 * @param {string} props.size Size of the spinner ('sm', 'md', 'lg')
 * @param {boolean} props.centered Whether to center in parent container
 * @param {string} props.spinnerClassName Additional CSS for spinner
 */
export default function LoadingState({
  message,
  messageKey,
  className = '',
  size = 'md',
  centered = true,
  spinnerClassName = ''
}) {
  const { t } = useLanguage();
  
  // Prepare the message text
  const displayMessage = messageKey ? t(messageKey) : message || t('common.loading');
  
  // Size classes for the spinner
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  // Container classes for centering
  const containerClasses = cn(
    'flex items-center',
    centered && 'justify-center min-h-[200px]',
    className
  );
  
  const spinnerClasses = cn(
    'text-primary animate-spin',
    sizeClasses[size] || sizeClasses.md,
    spinnerClassName
  );

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div className="flex flex-col items-center">
        <Loader2 className={spinnerClasses} />
        <span className="mt-2 text-muted-foreground">{displayMessage}</span>
      </div>
    </div>
  );
}