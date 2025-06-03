import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plug, Settings2, ExternalLink, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';

export default function IntegrationsTab() {
  const { t } = useLanguageHook();

  // Mock data - replace with actual integration statuses and configurations
  const integrations = [
    { 
      id: 'emailService', 
      nameKey: 'adminSettings.integrations.emailService.name', 
      defaultName: 'Transactional Email Service', 
      descriptionKey: 'adminSettings.integrations.emailService.desc',
      defaultDesc: 'For sending system notifications and alerts.',
      status: 'active', 
      statusKey: 'active',
      configurable: true 
    },
    { 
      id: 'paymentGateway', 
      nameKey: 'adminSettings.integrations.paymentGateway.name', 
      defaultName: 'Payment Gateway', 
      descriptionKey: 'adminSettings.integrations.paymentGateway.desc',
      defaultDesc: 'To process payments for premium features.',
      status: 'inactive', 
      statusKey: 'inactive',
      configurable: true 
    },
    { 
      id: 'externalAnalytics', 
      nameKey: 'adminSettings.integrations.analytics.name', 
      defaultName: 'External Analytics Platform', 
      descriptionKey: 'adminSettings.integrations.analytics.desc',
      defaultDesc: 'Sync data with your preferred analytics tool.',
      status: 'pending', 
      statusKey: 'pending_configuration',
      configurable: true 
    },
     { 
      id: 'reportingApi', 
      nameKey: 'adminSettings.integrations.reportingApi.name', 
      defaultName: 'External Reporting API', 
      descriptionKey: 'adminSettings.integrations.reportingApi.desc',
      defaultDesc: 'Connect to external reporting systems.',
      status: 'error', 
      statusKey: 'error',
      configurable: true 
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('adminSettings.integrations.title', { defaultValue: 'Manage Integrations' })}</CardTitle>
          <CardDescription>
            {t('adminSettings.integrations.pageDescription', { defaultValue: 'Connect and configure third-party services and APIs.' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map(integration => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-md flex items-center">
                    <Plug className="mr-2 h-5 w-5 text-blue-600" />
                    {t(integration.nameKey, { defaultValue: integration.defaultName })}
                  </CardTitle>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    integration.statusKey === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200' :
                    integration.statusKey === 'inactive' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                    integration.statusKey === 'pending_configuration' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-200' :
                    integration.statusKey === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200' : ''
                  }`}>
                    {t(`integrationStatus.${integration.statusKey}`, {defaultValue: integration.status})}
                  </span>
                </div>
                <CardDescription className="pt-1 text-sm">
                  {t(integration.descriptionKey, {defaultValue: integration.defaultDesc})}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end items-center space-x-2">
                {integration.statusKey === 'error' && 
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50">
                        <AlertTriangle className="mr-1 h-4 w-4" /> {t('buttons.viewError', {defaultValue: 'View Error'})}
                    </Button>
                }
                {integration.status === 'active' ? (
                  <Button variant="outline" size="sm">
                    {t('buttons.disable', {defaultValue: 'Disable'})} <ToggleRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : integration.status === 'inactive' && integration.configurable ? (
                  <Button variant="outline" size="sm">
                    {t('buttons.enable', {defaultValue: 'Enable'})} <ToggleLeft className="ml-2 h-4 w-4" />
                  </Button>
                ) : null}
                {integration.configurable && (
                  <Button variant="default" size="sm">
                    <Settings2 className="mr-2 h-4 w-4" /> {t('buttons.configure', {defaultValue: 'Configure'})}
                  </Button>
                )}
                <Button variant="link" size="sm" className="text-xs">
                  {t('buttons.learnMore', {defaultValue: 'Learn More'})} <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
           <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-6">
            {t('common.featureComingSoonDetailed', {featureName: t('adminSettings.integrations.title', {defaultValue: 'Integrations Management'}), defaultValue: `Full ${t('adminSettings.integrations.title', {defaultValue: 'Integrations Management'})} capabilities will be available soon.`})}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}