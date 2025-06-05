import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function PolicyCoverageTab() {
  const { t } = useLanguageHook();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-6 w-6 text-blue-600 mr-2" />
            {t('insurance.coverage.title', { defaultValue: 'Policy Coverage Rules' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg min-h-[300px]">
            <Shield className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('common.comingSoon', { defaultValue: 'Coming Soon' })}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              {t('insurance.coverage.description', { defaultValue: 'This section will allow you to define detailed coverage rules, exclusions, and special conditions for insurance policies.' })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}