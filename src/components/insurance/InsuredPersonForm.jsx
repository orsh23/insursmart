import React, { useState, useEffect } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // If notes are added to entity
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function InsuredPersonForm({ initialData, onSubmit, isSubmitting, viewOnly = false }) {
  const { t, isRTL } = useLanguageHook();

  const genderOptions = ["male", "female", "other"];
  const idTypeOptions = ["national_id", "insurance_number", "passport"];

  const defaultFormData = {
    full_name: "",
    date_of_birth: null, // Store as Date object or null
    gender: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    identification: { type: "", number: "" }
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name || "",
        date_of_birth: initialData.date_of_birth ? parseISO(initialData.date_of_birth) : null,
        gender: initialData.gender || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        address: initialData.address || "",
        city: initialData.city || "",
        identification: initialData.identification || { type: "", number: "" }
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("identification.")) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        identification: { ...prev.identification, [key]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name, value) => {
     if (name.startsWith("identification.")) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        identification: { ...prev.identification, [key]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date_of_birth: date }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation
    if (!formData.full_name || !formData.identification.type || !formData.identification.number) {
        alert(t('common.fillRequiredFields', {defaultValue: "Please fill all required fields (Full Name, ID Type, ID Number)."}));
        return;
    }
    
    const dataToSubmit = {
      ...formData,
      date_of_birth: formData.date_of_birth ? format(formData.date_of_birth, 'yyyy-MM-dd') : null
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form id="insuredPersonForm" onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* Personal Information */}
      <fieldset className="border p-4 rounded-md">
        <legend className="text-sm font-medium px-1">{t('insurance.insuredPersons.form.personalInfo', {defaultValue: 'Personal Information'})}</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="full_name">{t('insurance.insuredPersons.form.fullName', {defaultValue: 'Full Name'})} *</Label>
            <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required disabled={isSubmitting || viewOnly} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date_of_birth">{t('insurance.insuredPersons.form.dateOfBirth', {defaultValue: 'Date of Birth'})}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${!formData.date_of_birth && "text-muted-foreground"}`}
                  disabled={isSubmitting || viewOnly}
                >
                  <CalendarIcon className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {formData.date_of_birth ? format(formData.date_of_birth, "PPP") : <span>{t('common.pickADate', {defaultValue: 'Pick a date'})}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date_of_birth}
                  onSelect={handleDateChange}
                  initialFocus
                  disabled={isSubmitting || viewOnly}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <Label htmlFor="gender">{t('insurance.insuredPersons.form.gender', {defaultValue: 'Gender'})}</Label>
            <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)} disabled={isSubmitting || viewOnly}>
              <SelectTrigger>
                <SelectValue placeholder={t('insurance.insuredPersons.form.selectGender', {defaultValue: 'Select gender'})} />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{t(`genders.${opt}`, {defaultValue: opt.charAt(0).toUpperCase() + opt.slice(1)})}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      {/* Identification */}
      <fieldset className="border p-4 rounded-md">
        <legend className="text-sm font-medium px-1">{t('insurance.insuredPersons.form.identification', {defaultValue: 'Identification'})}</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="identification.type">{t('insurance.insuredPersons.form.idType', {defaultValue: 'ID Type'})} *</Label>
            <Select value={formData.identification.type} onValueChange={(value) => handleSelectChange('identification.type', value)} disabled={isSubmitting || viewOnly} required>
              <SelectTrigger>
                <SelectValue placeholder={t('insurance.insuredPersons.form.selectIdType', {defaultValue: 'Select ID type'})} />
              </SelectTrigger>
              <SelectContent>
                {idTypeOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{t(`identificationTypes.${opt}`, {defaultValue: opt.replace('_',' ').charAt(0).toUpperCase() + opt.replace('_',' ').slice(1)})}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="identification.number">{t('insurance.insuredPersons.form.idNumber', {defaultValue: 'ID Number'})} *</Label>
            <Input id="identification.number" name="identification.number" value={formData.identification.number} onChange={handleChange} required disabled={isSubmitting || viewOnly} />
          </div>
        </div>
      </fieldset>

      {/* Contact Information */}
      <fieldset className="border p-4 rounded-md">
        <legend className="text-sm font-medium px-1">{t('insurance.insuredPersons.form.contactInfo', {defaultValue: 'Contact Information'})}</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="phone">{t('insurance.insuredPersons.form.phone', {defaultValue: 'Phone'})}</Label>
            <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={isSubmitting || viewOnly} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">{t('insurance.insuredPersons.form.email', {defaultValue: 'Email'})}</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={isSubmitting || viewOnly} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-1">
                <Label htmlFor="address">{t('insurance.insuredPersons.form.address', {defaultValue: 'Address'})}</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleChange} disabled={isSubmitting || viewOnly} />
            </div>
            <div className="space-y-1">
                <Label htmlFor="city">{t('insurance.insuredPersons.form.city', {defaultValue: 'City'})}</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleChange} disabled={isSubmitting || viewOnly} />
            </div>
        </div>
      </fieldset>
    </form>
  );
}