
import React, { useState, useEffect } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import FormDialog from "@/components/ui/form-dialog";
import { Button } from '@/components/ui/button'; // Button is still useful for other things if needed, or potentially for custom footer content in FormDialog
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from "@/components/ui/select"; 
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox"; // Added as per outline
import { AdminSetting } from '@/api/entities';
import { AlertCircle } from 'lucide-react';

export default function AdminSettingDialog({
  isOpen,
  onClose,
  currentItem,
  onSave,
  viewOnly = false
}) {
  const { t, isRTL } = useLanguageHook(); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const initialFormData = {
    setting_key: "",
    setting_value: "",
    setting_type: "system",
    display_name_en: "",
    display_name_he: "",
    description_en: "",
    description_he: "",
    is_visible: true,
    value_options: [] // Stored as array, displayed as comma-separated string
  };

  const [formData, setFormData] = useState(initialFormData);
  const [valueOptionsString, setValueOptionsString] = useState(""); // For editing value_options

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setError(null);
      if (currentItem) {
        setFormData({ ...initialFormData, ...currentItem });
        setValueOptionsString(Array.isArray(currentItem.value_options) ? currentItem.value_options.join(', ') : "");
      } else {
        setFormData(initialFormData);
        setValueOptionsString("");
      }
    }
  }, [isOpen, currentItem]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleValueOptionsChange = (e) => {
    setValueOptionsString(e.target.value);
  };

  const handleSubmit = async () => { // Modified to be directly callable by FormDialog
    setError(null);
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.setting_key.trim()) {
      setError('Setting Key is required.');
      setIsSubmitting(false);
      return;
    }
    if (!formData.setting_value.trim()) {
      setError('Setting Value is required.');
      setIsSubmitting(false);
      return;
    }

    const dataToSave = {
      ...formData,
      value_options: valueOptionsString.split(',').map(s => s.trim()).filter(s => s !== "")
    };

    try {
      let savedItem;
      if (currentItem && currentItem.id) {
        savedItem = await AdminSetting.update(currentItem.id, dataToSave);
      } else {
        savedItem = await AdminSetting.create(dataToSave);
      }
      onSave(savedItem);
    } catch (err) {
      console.error("Error saving admin setting:", err);
      setError(err.message || 'Failed to save setting.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const settingTypes = [
    { value: "system", label: "System" },
    { value: "user", label: "User" },
    { value: "feature", label: "Feature" },
    { value: "integration", label: "Integration" }
  ];

  const dialogTitle = viewOnly 
    ? 'View Setting'
    : (currentItem 
        ? 'Edit Setting' 
        : 'Add New Setting');

  const dialogDescription = !viewOnly ? 'Manage the details of the application setting.' : '';

  const confirmButtonText = isSubmitting 
    ? 'Saving...' 
    : (currentItem ? 'Update' : 'Save');

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={dialogTitle}
      description={dialogDescription}
      confirmButtonText={confirmButtonText}
      cancelButtonText={'Cancel'}
      isSubmitting={isSubmitting}
      viewOnly={viewOnly}
      dir={isRTL ? 'rtl' : 'ltr'}
      className="sm:max-w-lg max-h-[90vh] flex flex-col"
    >
      <div className="flex-grow overflow-y-auto p-1 -m-1 space-y-4">
        <div className="p-4 space-y-4">
          <div>
            <Label htmlFor="setting_key">{'Setting Key'} <span className="text-red-500">*</span></Label>
            <Input 
              id="setting_key" 
              name="setting_key" 
              value={formData.setting_key} 
              onChange={handleInputChange} 
              disabled={viewOnly || (currentItem && currentItem.id)} // Key is often immutable after creation
              required 
              className={viewOnly ? "bg-gray-100 dark:bg-gray-700" : ""}
            />
            {currentItem && currentItem.id && <p className="text-xs text-gray-500 mt-1">{'Key cannot be changed after creation.'}</p>}
          </div>

          <div>
            <Label htmlFor="setting_value">{'Setting Value'} <span className="text-red-500">*</span></Label>
            <Textarea 
              id="setting_value" 
              name="setting_value" 
              value={formData.setting_value} 
              onChange={handleInputChange} 
              disabled={viewOnly}
              required 
              rows={3}
              className={viewOnly ? "bg-gray-100 dark:bg-gray-700" : ""}
            />
          </div>

          <div>
            <Label htmlFor="setting_type">{'Setting Type'}</Label>
            <Select 
              name="setting_type" 
              value={formData.setting_type} 
              onChange={(e) => handleSelectChange('setting_type', e.target.value)}
              disabled={viewOnly}
              id="setting_type"
              className={viewOnly ? "bg-gray-100 dark:bg-gray-700" : ""}
            >
              {settingTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="display_name_en">{'Display Name (English)'}</Label>
            <Input 
              id="display_name_en" 
              name="display_name_en" 
              value={formData.display_name_en} 
              onChange={handleInputChange} 
              disabled={viewOnly}
              className={viewOnly ? "bg-gray-100 dark:bg-gray-700" : ""}
            />
          </div>
          <div>
            <Label htmlFor="display_name_he">{'Display Name (Hebrew)'}</Label>
            <Input 
              id="display_name_he" 
              name="display_name_he" 
              value={formData.display_name_he} 
              onChange={handleInputChange} 
              disabled={viewOnly}
              className={viewOnly ? "bg-gray-100 dark:bg-gray-700" : ""}
            />
          </div>

          <div>
            <Label htmlFor="description_en">{'Description (English)'}</Label>
            <Textarea 
              id="description_en" 
              name="description_en" 
              value={formData.description_en} 
              onChange={handleInputChange} 
              disabled={viewOnly} 
              rows={2}
              className={viewOnly ? "bg-gray-100 dark:bg-gray-700" : ""}
            />
          </div>
           <div>
            <Label htmlFor="description_he">{'Description (Hebrew)'}</Label>
            <Textarea 
              id="description_he" 
              name="description_he" 
              value={formData.description_he} 
              onChange={handleInputChange} 
              disabled={viewOnly} 
              rows={2}
              className={viewOnly ? "bg-gray-100 dark:bg-gray-700" : ""}
            />
          </div>

          <div>
            <Label htmlFor="value_options">{'Value Options (comma-separated)'}</Label>
            <Input 
              id="value_options" 
              name="value_options" 
              value={valueOptionsString} 
              onChange={handleValueOptionsChange} 
              disabled={viewOnly}
              placeholder={'e.g., option1,option2,option3'}
              className={viewOnly ? "bg-gray-100 dark:bg-gray-700" : ""}
            />
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch 
              id="is_visible" 
              name="is_visible"
              checked={formData.is_visible} 
              onCheckedChange={(checked) => handleSwitchChange('is_visible', checked)} 
              disabled={viewOnly}
            />
            <Label htmlFor="is_visible">{'Visible in UI (if applicable)'}</Label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-500 dark:border-red-700 rounded-md text-red-700 dark:text-red-300 flex items-start">
              <AlertCircle className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} flex-shrink-0`} />
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </FormDialog>
  );
}
