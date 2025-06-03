
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import FormDialog from "@/components/ui/form-dialog";
import { useLanguageHook } from "@/components/useLanguageHook";
import { InsuranceCode } from "@/api/entities";

// This dialog is a placeholder and needs fields for default_composition and bom_template
// For now, it will handle the basic fields.
export default function InsuranceCodeDialog({ isOpen, onClose, onSave, code }) {
  const [formData, setFormData] = useState({
    code: '', name_en: '', name_he: '', category_path: '',
    requires_preauthorization: false, is_active: true,
    // default_composition: [], // Complex field - placeholder
    // bom_template: [], // Complex field - placeholder
    standard_hospitalization_days: 0,
  });
  const [formError, setFormError] = useState(null);

  const { t } = useLanguageHook();

  useEffect(() => {
    if (code) {
      setFormData({
        code: code.code || '',
        name_en: code.name_en || '',
        name_he: code.name_he || '',
        category_path: code.category_path || '',
        requires_preauthorization: typeof code.requires_preauthorization === 'boolean' ? code.requires_preauthorization : false,
        is_active: typeof code.is_active === 'boolean' ? code.is_active : true,
        standard_hospitalization_days: code.standard_hospitalization_days || 0,
      });
    } else {
      setFormData({
        code: '', name_en: '', name_he: '', category_path: '',
        requires_preauthorization: false, is_active: true,
        standard_hospitalization_days: 0,
      });
    }
    setFormError(null);
  }, [code, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.code || !formData.name_en || !formData.name_he) {
      setFormError(t("Code and names are required."));
      return;
    }
    // Here, you might want to process default_composition and bom_template if they were implemented
    onSave(formData);
  };

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title={code ? t('Edit Insurance Code') : t('Add Insurance Code')}
      onSubmit={handleSubmit}
      submitButtonText={code ? t('Update Code') : t('Create Code')}
      cancelButtonText={t('Cancel')}
    >
      {formError && <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded">{formError}</div>}
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="ins_code">{t('Code (Format: INS-XXXX-NAME)')}</Label>
          <Input id="ins_code" value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ins_name_en">{t('Name (English)')}</Label>
            <Input id="ins_name_en" value={formData.name_en} onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="ins_name_he">{t('Name (Hebrew)')}</Label>
            <Input id="ins_name_he" dir="rtl" value={formData.name_he} onChange={(e) => setFormData(prev => ({ ...prev, name_he: e.target.value }))} />
          </div>
        </div>
        <div>
          <Label htmlFor="ins_category_path">{t('Category Path')}</Label>
          <Input id="ins_category_path" value={formData.category_path} onChange={(e) => setFormData(prev => ({ ...prev, category_path: e.target.value }))} placeholder={t("e.g., Surgery/General/Knee Replacement")} />
        </div>
        <div>
          <Label htmlFor="ins_standard_hospitalization_days">{t('Standard Hospitalization Days')}</Label>
          <Input id="ins_standard_hospitalization_days" type="number" value={formData.standard_hospitalization_days} onChange={(e) => setFormData(prev => ({ ...prev, standard_hospitalization_days: parseInt(e.target.value,10) || 0 }))} />
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="ins_requires_preauthorization" checked={formData.requires_preauthorization} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_preauthorization: checked }))} />
          <Label htmlFor="ins_requires_preauthorization">{t('Requires Preauthorization')}</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="ins_is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} />
          <Label htmlFor="ins_is_active">{t('Is Active')}</Label>
        </div>
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
          {t('Note: Default Composition and BoM Template fields are complex and will be implemented later.')}
        </div>
      </div>
    </FormDialog>
  );
}
