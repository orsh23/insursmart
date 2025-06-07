import React from 'react';

// A very simple layout component
export default function Layout({ children, currentPageName }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ background: '#f0f0f0', padding: '1rem', textAlign: 'center' }}>
        <h1>InsureSmart App (Simplified Layout)</h1>
        {currentPageName && <p>Current Page: {currentPageName}</p>}
      </header>
      <main style={{ flexGrow: 1, padding: '1rem' }}>
        {children}
      </main>
      <footer style={{ background: '#f0f0f0', padding: '1rem', textAlign: 'center', marginTop: 'auto' }}>
        <p>&copy; {new Date().getFullYear()} InsureSmart</p>
      </footer>
    </div>
  );
}