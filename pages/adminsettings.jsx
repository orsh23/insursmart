
import React from 'react';
    import { useLanguageHook } from '@/components/useLanguageHook';
    import PageLayout from '@/components/common/PageLayout';
    import PageHeader from '@/components/common/PageHeader';
    // import ComingSoonCard from '@/components/common/ComingSoonCard'; // Replaced by AdminSettingsTabs
    import { Settings } from 'lucide-react';
    import AdminSettingsTabs from '@/components/admin/AdminSettingsTabs'; // Assuming this is the main content

    export default function AdminSettingsPage() {
      const { t } = useLanguageHook();
      return (
        <PageLayout>
          <PageHeader 
            title={t('pageTitles.adminSettings', {defaultValue: 'Admin Settings'})} 
            description={t('adminSettings.pageDescription', {defaultValue: 'Configure application settings, user roles, and system parameters.'})}
            icon={Settings} 
          />
          <AdminSettingsTabs />
        </PageLayout>
      );
    }
