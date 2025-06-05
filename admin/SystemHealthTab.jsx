import React from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ServerCrash, Activity, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function SystemHealthTab() {
  const { t } = useLanguageHook();

  // Mock data - replace with actual system health checks
  const systemComponents = [
    { name: t('adminSettings.systemHealth.databaseService', { defaultValue: 'Database Service' }), status: 'operational', statusKey: 'operational', icon: <Activity className="h-5 w-5 text-green-500" />, details: 'Last check: 1 min ago' },
    { name: t('adminSettings.systemHealth.apiGateway', { defaultValue: 'API Gateway' }), status: 'operational', statusKey: 'operational', icon: <Activity className="h-5 w-5 text-green-500" />, details: 'Avg response: 80ms' },
    { name: t('adminSettings.systemHealth.backgroundJobs', { defaultValue: 'Background Job Processor' }), status: 'degraded_performance', statusKey: 'degraded_performance', icon: <ServerCrash className="h-5 w-5 text-yellow-500" />, details: 'Queue length: 120' },
    { name: t('adminSettings.systemHealth.securityServices', { defaultValue: 'Security Services' }), status: 'operational', statusKey: 'operational', icon: <ShieldCheck className="h-5 w-5 text-green-500" />, details: 'Last audit: 2 hours ago' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('adminSettings.systemHealth.title', { defaultValue: 'System Health Dashboard' })}</CardTitle>
          <CardDescription>
            {t('adminSettings.systemHealth.pageDescription', { defaultValue: 'Overview of system component statuses and performance metrics.' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemComponents.map(comp => (
              <Card key={comp.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{comp.name}</CardTitle>
                  {comp.icon}
                </CardHeader>
                <CardContent>
                  <div className={`text-lg font-bold ${comp.statusKey === 'operational' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {t(`adminSettings.systemHealth.status.${comp.statusKey}`, {defaultValue: comp.status})}
                  </div>
                  <p className="text-xs text-muted-foreground">{comp.details}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-md">{t('adminSettings.systemHealth.systemLoad', { defaultValue: 'Overall System Load' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Progress value={65} className="w-[80%]" />
                <span className="text-sm text-muted-foreground">65%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('adminSettings.systemHealth.loadDescription', {defaultValue: 'Current CPU and memory utilization.'})}</p>
            </CardContent>
          </Card>
           <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-6">
            {t('common.featureComingSoonDetailed', {featureName: t('adminSettings.systemHealth.title', {defaultValue: 'System Health Monitoring'}), defaultValue: `Detailed ${t('adminSettings.systemHealth.title', {defaultValue: 'System Health Monitoring'})} and logs will be available soon.`})}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}