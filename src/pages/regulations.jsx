import React from 'react';
    import { ListChecks } from 'lucide-react'; // Icon for regulations/rules
    import PageLayout from '@/components/common/PageLayout';
    import PageHeader from '@/components/common/PageHeader';
    import RegulationsTab from '@/components/regulations/RegulationsTab'; // Removed .jsx extension
    import { useLanguageHook } from '@/components/useLanguageHook';

    export default function RegulationsPage() {
      const { t } = useLanguageHook();
      return (
        <PageLayout>
          <PageHeader
            title={t('pageTitles.regulations', { defaultValue: 'Regulations Management' })}
            description={t('regulations.pageDescription', { defaultValue: 'Track and manage healthcare regulations and compliance rules.'})}
            icon={ListChecks}
          />
          <RegulationsTab />
        </PageLayout>
      );
    }