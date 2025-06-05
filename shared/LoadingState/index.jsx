import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ text, textHe, language = "en" }) {
  const isRTL = language === "he";
  
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
      <p className="text-gray-500">
        {isRTL ? (textHe || 'טוען...') : (text || 'Loading...')}
      </p>
    </div>
  );
}