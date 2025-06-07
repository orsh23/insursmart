import React from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from './ErrorDisplay'; // Use the new component
import { useLanguageHook } from '@/components/useLanguageHook';

// This component wraps API calls to handle loading and error states gracefully
export default function ApiErrorHandler({
  error,
  loading,
  data, // Data from the API call (optional, can be used to determine if empty state needed)
  children, // What to render on success
  onRetry,
  loadingMessage,
  errorMessageTitle,
  customErrorMessage, // Specific message to display
  renderError, // Custom error rendering function: (error, onRetry) => JSX
  renderLoading, // Custom loading rendering function: () => JSX
  renderEmpty, // Custom empty state when data is empty/null after loading (optional)
  checkIsEmpty, // Function (data) => boolean to check if data is empty
}) {
  const { t } = useLanguageHook();

  if (loading) {
    if (renderLoading) return renderLoading();
    return <LoadingSpinner message={loadingMessage || t('messages.loadingDataSimple', { defaultValue: 'Loading...' })} />;
  }

  if (error) {
    if (renderError) return renderError(error, onRetry);
    return (
      <ErrorDisplay
        title={errorMessageTitle || t('errors.apiErrorTitle', { defaultValue: 'API Error' })}
        message={customErrorMessage} // If provided, use this as the primary message
        details={error} // Pass the error object for details
        onRetry={onRetry}
        showDetailsToggle={true}
      />
    );
  }

  if (checkIsEmpty && checkIsEmpty(data)) {
    if (renderEmpty) return renderEmpty();
    // Optionally, render a default empty state or nothing
    // For now, if renderEmpty is not provided, it will fall through to children or null
  }
  
  // If data is explicitly null or undefined (and not handled by checkIsEmpty/renderEmpty),
  // it might mean no data to render children with.
  // However, children might not depend on data, so render them by default.
  // Add specific check if children should only render if data exists.
  // For example: if (data === null || data === undefined && !renderEmpty) return null;
  
  return children;
}