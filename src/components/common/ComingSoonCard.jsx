import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart2 as LucideBarChart2, AlertCircle } from 'lucide-react';
import { useLanguageHook } from '@/components/useLanguageHook';

export default function ComingSoonCard({
  title,
  message,
  icon: Icon = LucideBarChart2
}) {
  const { isRTL } = useLanguageHook(); // Keep only isRTL

  return (
    <Card className="bg-gray-50 border border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg font-medium text-gray-700">
          <Icon className="h-5 w-5 mr-2 text-gray-500" />
          {title}
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-normal">
            Coming Soon
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-4">
          <AlertCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
          <div>
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}