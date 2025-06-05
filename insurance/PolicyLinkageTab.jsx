import React, { useState, useEffect, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { InsuredPolicy } from '@/api/entities';
import { InsuredPerson } from '@/api/entities';
import { InsurancePolicy } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, FileText, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';

// Simple tab component without complex hooks for now
export default function PolicyLinkageTab({ globalActionsConfig, currentView }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  // Simple data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const policyLinks = await InsuredPolicy.list();
        setItems(Array.isArray(policyLinks) ? policyLinks : []);
      } catch (err) {
        console.error('Error fetching policy linkages:', err);
        setError(err.message || 'Failed to load policy linkages');
        toast({
          title: 'Error',
          description: 'Failed to load policy linkages',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Simple handlers
  const handleAddNew = () => {
    toast({
      title: 'Coming Soon',
      description: 'Add new policy linkage functionality will be available soon.',
    });
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const policyLinks = await InsuredPolicy.list();
      setItems(Array.isArray(policyLinks) ? policyLinks : []);
      toast({
        title: 'Success',
        description: 'Policy linkages refreshed successfully',
      });
    } catch (err) {
      console.error('Error refreshing policy linkages:', err);
      toast({
        title: 'Error',
        description: 'Failed to refresh policy linkages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner message={t('common.loading', { defaultValue: 'Loading...' })} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('common.error', { defaultValue: 'Error' })}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            {t('buttons.retry', { defaultValue: 'Try Again' })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {t('policyLinkage.title', { defaultValue: 'Policy Linkages' })}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('policyLinkage.description', { defaultValue: 'Manage connections between insured persons and policies' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('buttons.addNew', { defaultValue: 'Add New' })}
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            {t('buttons.refresh', { defaultValue: 'Refresh' })}
          </Button>
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <EmptyState
          title={t('policyLinkage.noItems', { defaultValue: 'No Policy Linkages' })}
          description={t('policyLinkage.noItemsDesc', { defaultValue: 'Start by creating a new policy linkage.' })}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Card key={item.id || index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Policy Linkage #{item.id}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Policy ID:</span> {item.policy_id || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Insured ID:</span> {item.insured_id || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={item.active_flag ? 'text-green-600' : 'text-red-600'}>
                      {item.active_flag ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}