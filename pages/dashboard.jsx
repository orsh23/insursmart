
import React, { useState, useEffect } from "react";
import PageLayout from "@/components/common/PageLayout";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LayoutDashboard, Calendar, AlertTriangle } from "lucide-react";
import { format, parseISO, isValid } from 'date-fns';
import { useLanguageHook } from '@/components/useLanguageHook';
import LoadingSpinner from "@/components/ui/loading-spinner";

// Mockup for what an activity item might look like
// In a real app, this would come from an entity or API call
const fetchRecentActivities = async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { id: 1, title: "User John Doe registered.", date: "2023-10-26T10:00:00Z", type: "user_registration" },
    { id: 2, title: "Policy #12345 updated.", date: "2023-10-25T14:30:00Z", type: "policy_update" },
    { id: 3, title: "Claim #C789 submitted.", date: null, type: "claim_submission" }, // Item with null date
    { id: 4, title: "Provider 'General Hospital' added.", type: "provider_added" }, // Item with missing date
    null, // Potentially a null item in the list
    { id: 5, title: "System maintenance scheduled.", date: "invalid-date-string", type: "system_event" }, // Item with invalid date string
  ];
};

export default function DashboardPage() {
  const { t } = useLanguageHook();
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activityError, setActivityError] = useState(null);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoadingActivities(true);
        const activities = await fetchRecentActivities();
        setRecentActivities(activities);
        setActivityError(null);
      } catch (error) {
        console.error("Error fetching recent activities:", error);
        setActivityError(t('dashboard.errors.loadActivities', { defaultValue: "Could not load recent activities." }));
      } finally {
        setLoadingActivities(false);
      }
    };
    loadActivities();
  }, [t]);

  const safeFormatDate = (dateValue) => {
    if (!dateValue) return t('common.unknownDate', { defaultValue: 'Unknown Date' });
    try {
      const date = parseISO(dateValue);
      if (!isValid(date)) return t('common.invalidDate', { defaultValue: 'Invalid Date' });
      return format(date, 'PPp');
    } catch (error) {
      console.warn('Error formatting date:', dateValue, error);
      return t('common.invalidDate', { defaultValue: 'Invalid Date' });
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title={t('dashboard.title', { defaultValue: "Dashboard" })}
        description={t('dashboard.welcome', { defaultValue: "Welcome to InsureSmart" })}
        icon={LayoutDashboard}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.overview.title', { defaultValue: "Overview" })}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('dashboard.overview.message', { defaultValue: "Key metrics and summaries will appear here." })}</p>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity.title', { defaultValue: "Recent Activity" })}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivities && <LoadingSpinner message={t('dashboard.loadingActivities', { defaultValue: "Loading activities..."})}/>}
            {activityError && (
              <div className="text-red-600 flex items-center">
                <AlertTriangle size={18} className="mr-2" />
                {activityError}
              </div>
            )}
            {!loadingActivities && !activityError && recentActivities && recentActivities.length > 0 && (
              <ul className="space-y-3">
                {recentActivities.map((activity, index) => {
                  // Ensure activity item itself is not null
                  if (!activity) {
                    return (
                      <li key={`activity-null-${index}`} className="text-sm text-gray-500 italic">
                        {t('dashboard.activity.invalidItem', { defaultValue: "Invalid activity item." })}
                      </li>
                    );
                  }

                  const displayDate = safeFormatDate(activity.date);
                  
                  return (
                    <li key={activity.id || `activity-${index}`} className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <p className="font-medium text-gray-800 dark:text-gray-100">{activity.title || t('dashboard.activity.untitled', { defaultValue: "Untitled Activity" })}</p>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <Calendar size={14} className="mr-1.5" />
                        <span>{displayDate}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {!loadingActivities && !activityError && (!recentActivities || recentActivities.filter(a => a).length === 0) && (
              <p className="text-gray-500">{t('dashboard.recentActivity.none', { defaultValue: "No recent activity to display." })}</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickLinks.title', { defaultValue: "Quick Links" })}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li><a href="/tasks" className="text-blue-600 hover:underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">{t('navigation.tasks', { defaultValue: "Tasks"})}</a></li>
              <li><a href="/providers" className="text-blue-600 hover:underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">{t('navigation.providers', { defaultValue: "Providers"})}</a></li>
              <li><a href="/requestmanagement" className="text-blue-600 hover:underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">{t('navigation.requestManagement', { defaultValue: "Request Management"})}</a></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
