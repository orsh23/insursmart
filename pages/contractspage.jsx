
import React from 'react';
    import { ScrollText } from 'lucide-react';
    import PageLayout from '@/components/common/PageLayout';
    import PageHeader from '@/components/common/PageHeader';
    import ContractManagementTabs from '@/components/contract-management/ContractManagementTabs';
    import { useLanguageHook } from '@/components/useLanguageHook';

    export default function ContractsPage() {
      const { t } = useLanguageHook();
      return (
        <PageLayout>
          <PageHeader
            title={t('pageTitles.contracts', { defaultValue: 'Contracts Management' })}
            description={t('contracts.pageDescription', { defaultValue: 'Manage contracts, agreements, and terms.'})}
            icon={ScrollText}
          />
          <ContractManagementTabs />
        </PageLayout>
      );
    }
