
import React, { useState, useEffect } from "react";
import FormDialog from "@/components/ui/form-dialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useLanguageHook } from "@/components/useLanguageHook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MaterialVariantDialog({
  open,
  onOpenChange,
  variant,
  onSave,
  materialId,
  suppliers = [],
  manufacturers = [],
}) {
  const { t, isRTL } = useLanguageHook();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    material_id: materialId,
    variant_label: "",
    variant_code: "",
    supplier_id: "",
    manufacturer_id: "",
    price_per_unit: "",
    currency: "ILS",
    reimbursable_flag: true,
    usage_probability: 100,
    is_active: true,
    stock_keeping_unit: "",
    notes: ""
  });

  useEffect(() => {
    if (variant) {
      setFormData({
        material_id: materialId,
        variant_label: variant.variant_label || "",
        variant_code: variant.variant_code || "",
        supplier_id: variant.supplier_id || "",
        manufacturer_id: variant.manufacturer_id || "",
        price_per_unit: variant.price_per_unit || "",
        currency: variant.currency || "ILS",
        reimbursable_flag: variant.reimbursable_flag !== false,
        usage_probability: variant.usage_probability || 100,
        is_active: variant.is_active !== false,
        stock_keeping_unit: variant.stock_keeping_unit || "",
        notes: variant.notes || ""
      });
    } else {
      setFormData({
        material_id: materialId,
        variant_label: "",
        variant_code: "",
        supplier_id: "",
        manufacturer_id: "",
        price_per_unit: "",
        currency: "ILS",
        reimbursable_flag: true,
        usage_probability: 100,
        is_active: true,
        stock_keeping_unit: "",
        notes: ""
      });
    }
  }, [variant, materialId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting variant:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={variant ? t("editVariant") : t("newVariant")}
      formId="material-variant-form"
      onSubmit={handleSubmit}
      loading={loading}
      confirmButtonText={variant ? t("saveChanges") : t("createVariant")}
    >
      <form id="material-variant-form" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>
              {t("variantLabel")}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.variant_label}
              onChange={(e) => setFormData(prev => ({ ...prev, variant_label: e.target.value }))}
              placeholder={t("variantLabelExample")}
              required
            />
          </div>

          <div>
            <Label>
              {t("variantCode")}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.variant_code}
              onChange={(e) => setFormData(prev => ({ ...prev, variant_code: e.target.value }))}
              placeholder={t("variantCodeExample")}
              required
            />
          </div>

          <div>
            <Label>
              {t("sku")}
            </Label>
            <Input
              value={formData.stock_keeping_unit}
              onChange={(e) => setFormData(prev => ({ ...prev, stock_keeping_unit: e.target.value }))}
            />
          </div>

          <div>
            <Label>
              {t("pricePerUnit")}
            </Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.price_per_unit}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  price_per_unit: e.target.value ? parseFloat(e.target.value) : ""
                }))}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                {formData.currency}
              </div>
            </div>
          </div>

          <div>
            <Label>
              {t("supplier")}
            </Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectSupplier")} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              {t("manufacturer")}
            </Label>
            <Select
              value={formData.manufacturer_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, manufacturer_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectManufacturer")} />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map(manufacturer => (
                  <SelectItem key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              {t("currency")}
            </Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ILS">
                  ILS (₪)
                </SelectItem>
                <SelectItem value="USD">
                  USD ($)
                </SelectItem>
                <SelectItem value="EUR">
                  EUR (€)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              {t("usageProbability")}
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.usage_probability}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                usage_probability: parseInt(e.target.value) || 0
              }))}
            />
          </div>

          <div className="flex items-center space-x-2 md:col-span-2">
            <Checkbox
              id="reimbursable_flag"
              checked={formData.reimbursable_flag}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, reimbursable_flag: checked === true }))
              }
            />
            <Label htmlFor="reimbursable_flag">
              {t("reimbursable")}
            </Label>
          </div>

          <div className="flex items-center space-x-2 md:col-span-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, is_active: checked === true }))
              }
            />
            <Label htmlFor="is_active">
              {t("active")}
            </Label>
          </div>

          <div className="md:col-span-2">
            <Label>
              {t("notes")}
            </Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={t("additionalNotes")}
            />
          </div>
        </div>
      </form>
    </FormDialog>
  );
}
