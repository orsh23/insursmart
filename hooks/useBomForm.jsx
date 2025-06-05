import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { BillOfMaterial } from '@/api/entities';

export default function useBomForm(initialData = null) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialData || {
    procedure_code_type: "CPT",
    procedure_code_number: "",
    material_id: "",
    quantity: 1,
    is_optional: false,
    notes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.procedure_code_number) {
      newErrors.procedure_code_number = "Procedure code is required";
    }
    
    if (!formData.material_id) {
      newErrors.material_id = "Material is required";
    }
    
    if (formData.quantity < 1) {
      newErrors.quantity = "Quantity must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      
      if (initialData?.id) {
        await BillOfMaterial.update(initialData.id, formData);
        toast({
          title: "BoM Updated",
          description: "Bill of Materials was updated successfully",
        });
      } else {
        await BillOfMaterial.create(formData);
        toast({
          title: "BoM Created",
          description: "Bill of Materials was created successfully",
        });
      }

      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error?.message || "An unknown error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = useCallback(() => {
    setFormData(initialData || {
      procedure_code_type: "CPT",
      procedure_code_number: "",
      material_id: "",
      quantity: 1,
      is_optional: false,
      notes: ""
    });
    setErrors({});
  }, [initialData]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for the changed field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    reset,
    errors,
    isSubmitting
  };
}