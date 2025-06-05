import React, { useState, useEffect } from "react";
import { Provider } from "@/api/entities";
import { Button } from "@/components/ui/button";
import FormField from "../forms/FormField";

export default function ContractForm({ 
  contract = null, 
  onSubmit,
  onCancel,
  language = "en" 
}) {
  const isRTL = language === "he";
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    provider_id: "",
    provider_name: "",
    reference_number: "",
    description: "",
    status: "draft",
    start_date: "",
    end_date: "",
    auto_renew: false,
    notes: ""
  });

  useEffect(() => {
    fetchProviders();

    if (contract) {
      setFormData({
        provider_id: contract.provider_id || "",
        provider_name: contract.provider_name || "",
        reference_number: contract.reference_number || "",
        description: contract.description || "",
        status: contract.status || "draft",
        start_date: contract.start_date || "",
        end_date: contract.end_date || "",
        auto_renew: contract.auto_renew || false,
        notes: contract.notes || ""
      });
    }
  }, [contract]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const data = await Provider.list();
      setProviders(data);
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (providerId) => {
    const selectedProvider = providers.find(p => p.id === providerId);
    setFormData({
      ...formData,
      provider_id: providerId,
      provider_name: selectedProvider ? 
        (isRTL ? selectedProvider.provider_name_he : selectedProvider.provider_name_en) : ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          id="provider_id"
          type="select"
          label="Provider"
          labelHe="ספק"
          value={formData.provider_id}
          onChange={handleProviderChange}
          options={providers.map(p => ({
            value: p.id,
            label: isRTL ? p.provider_name_he : p.provider_name_en
          }))}
          language={language}
          required
        />

        <FormField
          id="reference_number"
          type="text"
          label="Reference Number"
          labelHe="מספר סימוכין"
          value={formData.reference_number}
          onChange={(value) => setFormData({...formData, reference_number: value})}
          language={language}
          required
        />

        <FormField
          id="status"
          type="select"
          label="Status"
          labelHe="סטטוס"
          value={formData.status}
          onChange={(value) => setFormData({...formData, status: value})}
          options={[
            { value: "draft", label: isRTL ? "טיוטה" : "Draft" },
            { value: "active", label: isRTL ? "פעיל" : "Active" },
            { value: "expired", label: isRTL ? "פג תוקף" : "Expired" },
            { value: "terminated", label: isRTL ? "הופסק" : "Terminated" },
            { value: "pending_renewal", label: isRTL ? "בחידוש" : "Pending Renewal" }
          ]}
          language={language}
          required
        />

        <FormField
          id="description"
          type="text"
          label="Description"
          labelHe="תיאור"
          value={formData.description}
          onChange={(value) => setFormData({...formData, description: value})}
          language={language}
        />

        <FormField
          id="start_date"
          type="date"
          label="Start Date"
          labelHe="תאריך התחלה"
          value={formData.start_date}
          onChange={(value) => setFormData({...formData, start_date: value})}
          language={language}
          required
        />

        <FormField
          id="end_date"
          type="date"
          label="End Date"
          labelHe="תאריך סיום"
          value={formData.end_date}
          onChange={(value) => setFormData({...formData, end_date: value})}
          language={language}
          required
        />

        <FormField
          id="auto_renew"
          type="switch"
          label="Auto Renew"
          labelHe="חידוש אוטומטי"
          value={formData.auto_renew}
          onChange={(value) => setFormData({...formData, auto_renew: value})}
          language={language}
        />
      </div>

      <FormField
        id="notes"
        type="textarea"
        label="Notes"
        labelHe="הערות"
        value={formData.notes}
        onChange={(value) => setFormData({...formData, notes: value})}
        language={language}
      />

      <div className="flex justify-end space-x-2 rtl:space-x-reverse">
        <Button type="button" variant="outline" onClick={onCancel}>
          {isRTL ? "ביטול" : "Cancel"}
        </Button>
        <Button type="submit">
          {isRTL ? "שמור" : "Save"}
        </Button>
      </div>
    </form>
  );
}