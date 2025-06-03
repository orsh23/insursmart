import React from 'react';
import ErrorFallback from './ErrorFallback'; // ErrorFallback now uses ErrorDisplay

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // It's good practice to capture errorInfo as well if your logging service supports it.
    this.setState({ errorInfo }); 
    // If you have a global error logging function:
    // logErrorToMyService(error, errorInfo, this.props.context);
  }

  resetBoundary = () => {
    // This attempts to re-render the children.
    // If the error is persistent, it might re-throw.
    // Consider adding a counter to prevent infinite loops if reset is too aggressive.
    this.setState({ hasError: false, error: null, errorInfo: null });
    // If a specific onReset prop is passed, call it
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <ErrorFallback
          error={this.state.error} // Pass the error object
          resetErrorBoundary={this.resetBoundary}
        />
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;