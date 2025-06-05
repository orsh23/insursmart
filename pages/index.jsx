import React, { useEffect } from 'react';
import { User } from '@/api/entities';
import { createPageUrl } from '@/components/utils/url';

export default function IndexPage() {
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        await User.me(); 
        // Redirect to dashboard using logical page name
        window.location.href = createPageUrl('dashboard'); 
      } catch (error) {
        try {
          await User.login(); 
        } catch (loginError) {
          console.error("Login attempt failed:", loginError);
        }
      }
    };
    checkAuthAndRedirect();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-700">Loading InsureSmart...</h1>
        {/* You can add a spinner here */}
      </div>
    </div>
  );
}