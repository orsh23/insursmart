
import React from 'react';
import { Label } from '@/components/ui/label';

export default function FormItem({ label, children, error, className = "" }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className={error ? 'text-red-600' : ''}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
