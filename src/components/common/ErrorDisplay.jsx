import React, { useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguageHook } from '@/components/useLanguageHook';

export default function ErrorDisplay({
  title,
  message,
  details, // Can be a string or an Error object
  errorsList, // Array of strings or { message: string, key?: string|number }
  onRetry,
  retryButtonText,
  variant = 'destructive', // 'destructive', 'warning', 'default'
  icon: CustomIcon, // Custom icon to override default
  showDetailsToggle = true, // Whether to show a toggle for technical details if `details` is an Error object or long string
  defaultDetailsOpen = false,
}) {
  const { t } = useLanguageHook();
  const [detailsOpen, setDetailsOpen] = useState(defaultDetailsOpen);

  const actualTitle = title || t('common.errorEncountered', { defaultValue: 'An Error Occurred' });
  const actualRetryText = retryButtonText || t('buttons.retry', { defaultValue: 'Retry' });

  let displayDetails = '';
  let technicalDetails = '';

  if (details) {
    if (typeof details === 'string') {
      displayDetails = details;
    } else if (details instanceof Error) {
      displayDetails = details.message;
      technicalDetails = details.stack || '';
    } else if (typeof details.message === 'string') { // For error-like objects
        displayDetails = details.message;
        if(details.stack) technicalDetails = details.stack;
    }
  }
  
  // If message prop is provided, it takes precedence for the main display message
  const mainMessage = message || displayDetails || t('errors.unknownError', { defaultValue: 'An unknown error occurred.' });

  const IconToUse = CustomIcon || AlertTriangle;

  return (
    <Alert variant={variant} className="shadow-md">
      <div className="flex items-start">
        <IconToUse className={`h-5 w-5 ${variant === 'destructive' ? 'text-destructive' : variant === 'warning' ? 'text-yellow-500' : 'text-foreground'} mr-3 mt-0.5 flex-shrink-0`} />
        <div className="flex-grow">
          <AlertTitle className="font-semibold">{actualTitle}</AlertTitle>
          <AlertDescription>
            <p>{mainMessage}</p>
            {errorsList && errorsList.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                {errorsList.map((err, index) => (
                  <li key={typeof err === 'object' ? err.key || index : index}>
                    {typeof err === 'object' ? err.message : err}
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>

          {technicalDetails && showDetailsToggle && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="text-xs"
              >
                {detailsOpen ? t('common.hideDetails', { defaultValue: 'Hide Details' }) : t('common.showDetails', { defaultValue: 'Show Details' })}
                {detailsOpen ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
              {detailsOpen && (
                <pre className="mt-2 p-2 bg-muted dark:bg-gray-700 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all">
                  {technicalDetails}
                </pre>
              )}
            </div>
          )}
          {!technicalDetails && typeof details === 'string' && details !== mainMessage && showDetailsToggle && (
             // Case where 'details' is a string and different from mainMessage (potentially long)
             <div className="mt-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailsOpen(!detailsOpen)}
                    className="text-xs"
                >
                    {detailsOpen ? t('common.hideDetails', { defaultValue: 'Hide Details' }) : t('common.showDetails', { defaultValue: 'Show Details' })}
                    {detailsOpen ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
                {detailsOpen && (
                    <p className="mt-2 p-2 bg-muted dark:bg-gray-700 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all">
                    {details}
                    </p>
                )}
            </div>
          )}


          {onRetry && (
            <div className="mt-4">
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                {actualRetryText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}