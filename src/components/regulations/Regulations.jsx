import React, { useState, useEffect, useCallback } from 'react';
import { Regulation } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import RegulationsToolbar from './RegulationsToolbar';
import RegulationsGrid from './RegulationsGrid';
import RegulationDialog from './RegulationDialog';

export default function Regulations() {
  const { t } = useLanguageHook();
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRegulation, setCurrentRegulation] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  const fetchRegulations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedRegulations = await Regulation.list();
      setRegulations(Array.isArray(fetchedRegulations) ? fetchedRegulations : []);
    } catch (err) {
      console.error("Error fetching regulations:", err);
      setError(t('errors.fetchFailed', { item: t('regulations.titlePlural') }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRegulations();
  }, [fetchRegulations]);

  const handleAdd = () => {
    setCurrentRegulation(null);
    setViewMode(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (regulation) => {
    setCurrentRegulation(regulation);
    setViewMode(false);
    setIsDialogOpen(true);
  };

  const handleView = (regulation) => {
    setCurrentRegulation(regulation);
    setViewMode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (regulationId) => {
    if (window.confirm(t('common.confirmDelete', { item: t('regulations.titleSingular') }))) {
      try {
        await Regulation.delete(regulationId);
        await fetchRegulations();
      } catch (err) {
        console.error("Error deleting regulation:", err);
        setError(t('errors.deleteFailed', { item: t('regulations.titleSingular') }));
      }
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md">
          {error}
        </div>
      )}

      <RegulationsToolbar onAdd={handleAdd} />

      <RegulationsGrid 
        regulations={regulations}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <RegulationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        currentItem={currentRegulation}
        viewOnly={viewMode}
        onSave={fetchRegulations}
      />
    </div>
  );
}