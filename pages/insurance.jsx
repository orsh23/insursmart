import React from 'react';
import { Shield } from 'lucide-react';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import InsuranceManagementTabs from '@/components/insurance/InsuranceManagementTabs'; // Removed .jsx extension
import { useLanguageHook } from '@/components/useLanguageHook';

export default function InsurancePage() {
  const { t } = useLanguageHook();
  return (
    <PageLayout>
      <PageHeader
        title={t('pageTitles.insuranceManagement', { defaultValue: "Insurance Management"})}
        icon={Shield}
        description={t('insurance.pageDescription', { defaultValue: "Manage insured persons, policies, and coverage configurations"})}
      />
      <InsuranceManagementTabs />
    </PageLayout>
  );
}