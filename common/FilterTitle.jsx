import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Filter } from 'lucide-react';

export default function FilterTitle({ children }) {
  const { isRTL } = useLanguageHook();
  
  return (
    <div className="flex items-center mb-4">
      <Filter className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-600`} />
      <h3 className="text-lg font-medium">{children}</h3>
    </div>
  );
}