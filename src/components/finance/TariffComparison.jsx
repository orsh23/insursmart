import React, { useState } from 'react';
import { useLanguage } from '@/components/context/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/components/utils/format';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { FileText, TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function TariffComparison({ 
  open, 
  onOpenChange, 
  selectedTariffs = [], 
  loading = false 
}) {
  const { t } = useLanguage();

  const renderDiffIndicator = (diff) => {
    if (!diff) return <Minus className="h-4 w-4 text-gray-400" />;
    
    if (diff > 0) {
      return (
        <div className="flex items-center text-green-600">
          <ArrowUp className="h-4 w-4 mr-1" />
          {diff}%
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-red-600">
        <ArrowDown className="h-4 w-4 mr-1" />
        {Math.abs(diff)}%
      </div>
    );
  };

  const compareComponents = (components1, components2) => {
    if (!Array.isArray(components1) || !Array.isArray(components2)) {
      return [];
    }

    const allTypes = [...new Set([
      ...(components1 || []).map(c => c.component_type),
      ...(components2 || []).map(c => c.component_type)
    ])];

    return allTypes.map(type => {
      const comp1 = components1.find(c => c.component_type === type);
      const comp2 = components2.find(c => c.component_type === type);
      
      let diff = null;
      if (comp1?.amount && comp2?.amount) {
        diff = ((comp2.amount - comp1.amount) / comp1.amount * 100).toFixed(1);
      }

      return {
        type,
        first: comp1?.amount || 0,
        second: comp2?.amount || 0,
        diff
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('tariffs.comparison.title', { defaultValue: 'Tariff Comparison' })}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <LoadingSpinner />
        ) : selectedTariffs.length < 2 ? (
          <EmptyState
            icon={FileText}
            title={t('tariffs.comparison.selectTariffs', { defaultValue: 'Select Tariffs to Compare' })}
            description={t('tariffs.comparison.selectDescription', { 
              defaultValue: 'Select two or more tariffs to compare their components and pricing' 
            })}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTariffs.slice(0, 2).map((tariff, index) => (
                <Card key={tariff.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t('tariffs.comparison.tariff', { number: index + 1 })}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(tariff.base_price, tariff.currency)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <Badge variant="outline">
                          {tariff.contract_id}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        {tariff.insurance_code}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tariffs.comparison.component')}</TableHead>
                  <TableHead>{t('tariffs.comparison.firstTariff')}</TableHead>
                  <TableHead>{t('tariffs.comparison.secondTariff')}</TableHead>
                  <TableHead>{t('tariffs.comparison.difference')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compareComponents(
                  selectedTariffs[0]?.composition,
                  selectedTariffs[1]?.composition
                ).map(comparison => (
                  <TableRow key={comparison.type}>
                    <TableCell className="font-medium">
                      {t(`tariffs.componentTypes.${comparison.type}`, { 
                        defaultValue: comparison.type 
                      })}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(comparison.first, selectedTariffs[0]?.currency)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(comparison.second, selectedTariffs[1]?.currency)}
                    </TableCell>
                    <TableCell>
                      {renderDiffIndicator(comparison.diff)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>{t('tariffs.comparison.total')}</TableCell>
                  <TableCell>
                    {formatCurrency(selectedTariffs[0]?.base_price, selectedTariffs[0]?.currency)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(selectedTariffs[1]?.base_price, selectedTariffs[1]?.currency)}
                  </TableCell>
                  <TableCell>
                    {renderDiffIndicator(
                      ((selectedTariffs[1]?.base_price - selectedTariffs[0]?.base_price) / 
                      selectedTariffs[0]?.base_price * 100).toFixed(1)
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}