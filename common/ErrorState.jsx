import React from 'react';
import ErrorDisplay from './ErrorDisplay'; // Use the new component
import { AlertTriangle } from 'lucide-react'; // Default icon for error state

// This component can be used for general error states in UI sections
export default function ErrorState({ 
  title, 
  message, 
  details, // Can be error object or string
  errorsList,
  icon, 
  onRetry, // Renamed from retryAction for consistency
  retryButtonText, // Renamed from actionText for consistency
}) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <ErrorDisplay
        title={title}
        message={message}
        details={details}
        errorsList={errorsList}
        onRetry={onRetry}
        retryButtonText={retryButtonText}
        icon={icon || AlertTriangle} // Pass icon to ErrorDisplay
        variant="destructive" // Typically error states are destructive
        showDetailsToggle={!!details} // Show toggle if details exist
      />
    </div>
  );
}