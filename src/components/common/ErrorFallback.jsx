import React from 'react';
import ErrorDisplay from './ErrorDisplay'; // Use the new component
import { useLanguageHook } from '@/components/useLanguageHook';

// This component is used by ErrorBoundary
export default function ErrorFallback({ error, resetErrorBoundary }) {
  const { t } = useLanguageHook();

  // Log the error to the console for developers
  console.error("Error Fallback Caught:", error);

  return (
    <div role="alert" className="p-4">
      <ErrorDisplay
        title={t('errors.genericPageErrorTitle', { defaultValue: 'Something went wrong' })}
        message={t('errors.genericPageErrorBody', { defaultValue: 'We encountered an unexpected problem. Please try refreshing the page or click the retry button.' })}
        details={error} // Pass the full error object for details toggle
        onRetry={resetErrorBoundary}
        retryButtonText={t('buttons.retryPage', { defaultValue: 'Try Again' })}
        showDetailsToggle={true} // Good to show details for unexpected errors
      />
    </div>
  );
}