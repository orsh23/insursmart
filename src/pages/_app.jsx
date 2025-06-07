import React from 'react';
import '../globals.css'; // Standard global CSS import

function MyApp({ Component, pageProps }) {
  // Add more detailed logging to help diagnose the issue
  console.log('_app.js - Component:', Component);
  console.log('_app.js - pageProps:', pageProps);
  console.log('_app.js - Component type:', typeof Component);
  console.log('_app.js - Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');

  // Check if the Component is valid.
  // This is a common cause for React error #130 if Component is undefined.
  if (!Component || typeof Component === 'undefined') {
    console.error("Error: Page component is undefined. This might be due to a routing or import issue.");
    console.error("Available props:", { Component, pageProps });
    
    // Render a fallback UI with more debugging info
    return (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>Application Error</h1>
        <p>The page component could not be loaded. Please check the console for more details.</p>
        <p>This often indicates a problem with routing or a missing/incorrectly exported page component.</p>
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', textAlign: 'left' }}>
          <h3>Debug Info:</h3>
          <p><strong>Component:</strong> {String(Component)}</p>
          <p><strong>Component Type:</strong> {typeof Component}</p>
          <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side rendering'}</p>
          <p><strong>PageProps:</strong> {JSON.stringify(pageProps, null, 2)}</p>
        </div>
      </div>
    );
  }

  console.log('_app.js - Rendering component successfully');
  
  // If Component is valid, render it.
  return <Component {...pageProps} />;
}

export default MyApp;