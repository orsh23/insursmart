import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Contract } from '@/api/entities';
import { useLanguageHook } from '@/components/useLanguageHook';
import { useToast } from '@/components/ui/use-toast';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function ContractDialog({ contract, isOpen, onClose, providers }) {
  const { t, language, isRTL } = useLanguageHook();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validFromDate, setValidFromDate] = useState(null);
  const [validToDate, setValidToDate] = useState(null);

  const [formData, setFormData] = useState({
    provider_id: '',
    contract_number: '',
    name_en: '',
    name_he: '',
    status: 'draft',
    payment_terms: {
      payment_days: 30,
      requires_invoice: true,
      payment_method: 'direct_deposit'
    },
    special_conditions: []
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        provider_id: contract.provider_id || '',
        contract_number: contract.contract_number || '',
        name_en: contract.name_en || '',
        name_he: contract.name_he || '',
        status: contract.status || 'draft',
        payment_terms: contract.payment_terms || {
          payment_days: 30,
          requires_invoice: true,
          payment_method: 'direct_deposit'
        },
        special_conditions: contract.special_conditions || []
      });
      setValidFromDate(contract.valid_from ? parseISO(contract.valid_from) : null);
      setValidToDate(contract.valid_to ? parseISO(contract.valid_to) : null);
    } else {
      setFormData({
        provider_id: '',
        contract_number: '',
        name_en: '',
        name_he: '',
        status: 'draft',
        payment_terms: {
          payment_days: 30,
          requires_invoice: true,
          payment_method: 'direct_deposit'
        },
        special_conditions: []
      });
      setValidFromDate(null);
      setValidToDate(null);
    }
  }, [contract]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentTermsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      payment_terms: {
        ...prev.payment_terms,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const contractData = {
        ...formData,
        valid_from: validFromDate ? format(validFromDate, 'yyyy-MM-dd') : null,
        valid_to: validToDate ? format(validToDate, 'yyyy-MM-dd') : null
      };

      if (contract) {
        await Contract.update(contract.id, contractData);
      } else {
        await Contract.create(contractData);
      }

      onClose(true); // Indicate refresh needed
    } catch (error) {
      console.error('Error saving contract:', error);
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('contracts.saveError', { defaultValue: 'Failed to save contract. Please try again.' }),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'draft', labelKey: 'status.draft', defaultValue: 'Draft' },
    { value: 'active', labelKey: 'status.active', defaultValue: 'Active' },
    { value: 'expired', labelKey: 'status.expired', defaultValue: 'Expired' },
    { value: 'terminated', labelKey: 'status.terminated', defaultValue: 'Terminated' },
  ];

  const paymentMethodOptions = [
    { value: 'direct_deposit', labelKey: 'paymentMethods.directDeposit', defaultValue: 'Direct Deposit' },
    { value: 'check', labelKey: 'paymentMethods.check', defaultValue: 'Check' },
    { value: 'credit', labelKey: 'paymentMethods.credit', defaultValue: 'Credit' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contract 
              ? t('contracts.editContract', { defaultValue: 'Edit Contract' })
              : t('contracts.addContract', { defaultValue: 'Add Contract' })
            }
          </DialogTitle>
          <DialogDescription>
            {contract 
              ? t('contracts.editDescription', { defaultValue: 'Update contract information and settings.' })
              : t('contracts.addDescription', { defaultValue: 'Create a new contract with provider details.' })
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider_id">{t('contracts.provider', { defaultValue: 'Provider' })}</Label>
              <Select value={formData.provider_id} onValueChange={(value) => handleInputChange('provider_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('contracts.selectProvider', { defaultValue: 'Select Provider' })} />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {language === 'he' ? (provider.name?.he || provider.name?.en) : (provider.name?.en || provider.name?.he)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_number">{t('contracts.contractNumber', { defaultValue: 'Contract Number' })}</Label>
              <Input
                id="contract_number"
                value={formData.contract_number}
                onChange={(e) => handleInputChange('contract_number', e.target.value)}
                placeholder={t('contracts.contractNumberPlaceholder', { defaultValue: 'Enter contract number' })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_en">{t('contracts.nameEn', { defaultValue: 'Name (English)' })}</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => handleInputChange('name_en', e.target.value)}
                placeholder={t('contracts.nameEnPlaceholder', { defaultValue: 'Enter contract name in English' })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_he">{t('contracts.nameHe', { defaultValue: 'Name (Hebrew)' })}</Label>
              <Input
                id="name_he"
                value={formData.name_he}
                onChange={(e) => handleInputChange('name_he', e.target.value)}
                placeholder={t('contracts.nameHePlaceholder', { defaultValue: 'Enter contract name in Hebrew' })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('contracts.validFrom', { defaultValue: 'Valid From' })}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className={`mr-2 h-4 w-4 ${isRTL ? 'ml-2 mr-0' : ''}`} />
                    {validFromDate ? format(validFromDate, 'PPP') : t('contracts.selectDate', { defaultValue: 'Select date' })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={validFromDate}
                    onSelect={setValidFromDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t('contracts.validTo', { defaultValue: 'Valid To' })}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className={`mr-2 h-4 w-4 ${isRTL ? 'ml-2 mr-0' : ''}`} />
                    {validToDate ? format(validToDate, 'PPP') : t('contracts.selectDate', { defaultValue: 'Select date' })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={validToDate}
                    onSelect={setValidToDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t('contracts.status', { defaultValue: 'Status' })}</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey, { defaultValue: option.defaultValue })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('contracts.paymentTerms', { defaultValue: 'Payment Terms' })}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_days">{t('contracts.paymentDays', { defaultValue: 'Payment Days' })}</Label>
                <Input
                  id="payment_days"
                  type="number"
                  value={formData.payment_terms.payment_days}
                  onChange={(e) => handlePaymentTermsChange('payment_days', parseInt(e.target.value))}
                  placeholder="30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">{t('contracts.paymentMethod', { defaultValue: 'Payment Method' })}</Label>
                <Select 
                  value={formData.payment_terms.payment_method} 
                  onValueChange={(value) => handlePaymentTermsChange('payment_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey, { defaultValue: option.defaultValue })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.payment_terms.requires_invoice}
                    onChange={(e) => handlePaymentTermsChange('requires_invoice', e.target.checked)}
                    className="rounded"
                  />
                  <span>{t('contracts.requiresInvoice', { defaultValue: 'Requires Invoice' })}</span>
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={loading}>
              {t('buttons.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className={`mr-2 h-4 w-4 animate-spin ${isRTL ? 'ml-2 mr-0' : ''}`} />}
              {contract 
                ? t('buttons.updateContract', { defaultValue: 'Update Contract' })
                : t('buttons.createContract', { defaultValue: 'Create Contract' })
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}