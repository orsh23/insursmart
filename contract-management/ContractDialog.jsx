
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import FormDialog from "@/components/ui/form-dialog";
import { useLanguageHook } from "@/components/useLanguageHook";
import { Contract } from "@/api/entities"; // This import is added but not directly used in component logic, usually for type inference or validation outside this file.
import { format } from 'date-fns';

export default function ContractDialog({ isOpen, onClose, onSave, contract, providers }) {
  const [formData, setFormData] = useState({
    contract_number: '',
    name_en: '',
    name_he: '',
    provider_id: '',
    valid_from: '',
    valid_to: '',
    status: 'draft',
    scope_rules: [],
    payment_terms: {
      payment_days: 30,
      requires_invoice: true,
      payment_method: 'direct_deposit'
    },
    special_conditions: []
  });

  const { getLocalizedValue } = useLanguageHook();

  // Initialize form data with contract values if editing
  useEffect(() => {
    if (contract) {
      setFormData({
        ...formData, // Keep default structure
        ...contract, // Overlay with contract data
        valid_from: contract.valid_from || '',
        valid_to: contract.valid_to || '',
        provider_id: contract.provider_id || '',
        status: contract.status || 'draft'
      });
    }
  }, [contract]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date ? format(date, 'yyyy-MM-dd') : '' }));
  };

  const handleSubmit = () => {
    // FormDialog is expected to handle the form submission internally,
    // and this callback is triggered when the submit button is clicked.
    onSave(formData);
  };

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={contract ? 'Edit Contract' : 'Add New Contract'}
      onSubmit={handleSubmit}
      onCancel={onClose}
      submitButtonText="Save Contract"
      cancelButtonText="Cancel"
      // FormDialog typically manages its own content styling, e.g., max-width
      // If a specific class for the inner content is needed, it would be applied to the div below.
    >
      <div className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contract_number">Contract Number</Label>
            <Input
              id="contract_number"
              name="contract_number"
              value={formData.contract_number || ''}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider_id">Provider</Label>
            <Select
              value={formData.provider_id || ''}
              onValueChange={(value) => handleSelectChange('provider_id', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {getLocalizedValue(p.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name_en">Name (English)</Label>
          <Input
            id="name_en"
            name="name_en"
            value={formData.name_en || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name_he">Name (Hebrew)</Label>
          <Input
            id="name_he"
            name="name_he"
            value={formData.name_he || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Valid From</Label>
            <DatePicker
              date={formData.valid_from ? new Date(formData.valid_from) : undefined}
              onChange={(date) => handleDateChange('valid_from', date)}
            />
          </div>

          <div className="space-y-2">
            <Label>Valid To</Label>
            <DatePicker
              date={formData.valid_to ? new Date(formData.valid_to) : undefined}
              onChange={(date) => handleDateChange('valid_to', date)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status || 'draft'}
            onValueChange={(value) => handleSelectChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormDialog>
  );
}
