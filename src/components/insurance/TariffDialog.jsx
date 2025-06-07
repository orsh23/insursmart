import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Contract } from "@/api/entities";
import { InsuranceCode } from "@/api/entities";
import { Doctor } from "@/api/entities";

export default function TariffDialog({
  open,
  onOpenChange,
  tariff = null,
  onSubmit,
  language = "en"
}) {
  const isRTL = language === "he";
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [insuranceCodes, setInsuranceCodes] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    contract_id: "",
    insurance_code: "",
    doctor_id: "",
    base_price: 0,
    currency: "ILS",
    finalization_type: "RFC",
    composition: [],
    validation_rules: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (open && tariff) {
      setFormData({
        contract_id: tariff.contract_id || "",
        insurance_code: tariff.insurance_code || "",
        doctor_id: tariff.doctor_id || "",
        base_price: tariff.base_price || 0,
        currency: tariff.currency || "ILS",
        finalization_type: tariff.finalization_type || "RFC",
        composition: tariff.composition || [],
        validation_rules: tariff.validation_rules || []
      });
    } else if (open) {
      // Reset form for new tariff
      setFormData({
        contract_id: "",
        insurance_code: "",
        doctor_id: "",
        base_price: 0,
        currency: "ILS",
        finalization_type: "RFC",
        composition: [],
        validation_rules: []
      });
    }
  }, [open, tariff]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractsData, codesData, doctorsData] = await Promise.all([
        Contract.list(),
        InsuranceCode.list(),
        Doctor.list()
      ]);
      setContracts(contractsData || []);
      setInsuranceCodes(codesData || []);
      setDoctors(doctorsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAddComposition = () => {
    setFormData({
      ...formData,
      composition: [
        ...formData.composition,
        {
          component_type: "Base",
          pricing_model: "Fixed",
          recipient_type: "Provider",
          amount: 0,
          finalized_at: "RFC",
          copay_applies: true
        }
      ]
    });
  };

  const handleAddValidationRule = () => {
    setFormData({
      ...formData,
      validation_rules: [
        ...formData.validation_rules,
        {
          rule_type: "age_limit",
          rule_value: ""
        }
      ]
    });
  };

  const handleUpdateComposition = (index, field, value) => {
    const newComposition = [...formData.composition];
    newComposition[index] = {
      ...newComposition[index],
      [field]: value
    };
    setFormData({
      ...formData,
      composition: newComposition
    });
  };

  const handleRemoveComposition = (index) => {
    setFormData({
      ...formData,
      composition: formData.composition.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {tariff ? 
              (isRTL ? "עריכת תעריף" : "Edit Tariff") :
              (isRTL ? "תעריף חדש" : "New Tariff")
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="basic">
                {isRTL ? "פרטים בסיסיים" : "Basic Details"}
              </TabsTrigger>
              <TabsTrigger value="composition">
                {isRTL ? "הרכב מחיר" : "Price Composition"}
              </TabsTrigger>
              <TabsTrigger value="validation">
                {isRTL ? "חוקי תיקוף" : "Validation Rules"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label>
                  {isRTL ? "חוזה" : "Contract"}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.contract_id}
                  onValueChange={(value) => setFormData({ ...formData, contract_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? "בחר חוזה" : "Select contract"} />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.contract_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  {isRTL ? "קוד ביטוח" : "Insurance Code"}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.insurance_code}
                  onValueChange={(value) => setFormData({ ...formData, insurance_code: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? "בחר קוד" : "Select code"} />
                  </SelectTrigger>
                  <SelectContent>
                    {insuranceCodes.map((code) => (
                      <SelectItem key={code.id} value={code.code}>
                        {code.code} - {isRTL ? code.name_he : code.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{isRTL ? "רופא ספציפי" : "Specific Doctor"}</Label>
                <Select
                  value={formData.doctor_id}
                  onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? "בחר רופא" : "Select doctor"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>
                      {isRTL ? "- כל הרופאים -" : "- All Doctors -"}
                    </SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {isRTL ? 
                          `${doctor.first_name_he} ${doctor.last_name_he}` :
                          `${doctor.first_name_en} ${doctor.last_name_en}`
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    {isRTL ? "מחיר בסיס" : "Base Price"}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label>{isRTL ? "מטבע" : "Currency"}</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ILS">₪ ILS</SelectItem>
                      <SelectItem value="USD">$ USD</SelectItem>
                      <SelectItem value="EUR">€ EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>{isRTL ? "סוג סגירת מחיר" : "Price Finalization Type"}</Label>
                <RadioGroup
                  value={formData.finalization_type}
                  onValueChange={(value) => setFormData({ ...formData, finalization_type: value })}
                  className="flex space-x-4 rtl:space-x-reverse"
                >
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="RFC" id="r1" />
                    <Label htmlFor="r1">{isRTL ? "בהתחייבות" : "RFC"}</Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="Claim" id="r2" />
                    <Label htmlFor="r2">{isRTL ? "בתביעה" : "Claim"}</Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="Hybrid" id="r3" />
                    <Label htmlFor="r3">{isRTL ? "היברידי" : "Hybrid"}</Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>

            <TabsContent value="composition" className="space-y-4">
              {formData.composition.map((comp, index) => (
                <div key={index} className="border p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isRTL ? "סוג רכיב" : "Component Type"}</Label>
                      <Select
                        value={comp.component_type}
                        onValueChange={(value) => handleUpdateComposition(index, "component_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Base">{isRTL ? "בסיס" : "Base"}</SelectItem>
                          <SelectItem value="DoctorFee">{isRTL ? "שכר רופא" : "Doctor Fee"}</SelectItem>
                          <SelectItem value="Implantables">{isRTL ? "שתלים" : "Implantables"}</SelectItem>
                          <SelectItem value="Hospitalization">{isRTL ? "אשפוז" : "Hospitalization"}</SelectItem>
                          <SelectItem value="Drugs">{isRTL ? "תרופות" : "Drugs"}</SelectItem>
                          <SelectItem value="Other">{isRTL ? "אחר" : "Other"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{isRTL ? "מודל תמחור" : "Pricing Model"}</Label>
                      <Select
                        value={comp.pricing_model}
                        onValueChange={(value) => handleUpdateComposition(index, "pricing_model", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fixed">{isRTL ? "קבוע" : "Fixed"}</SelectItem>
                          <SelectItem value="BoMActual">{isRTL ? "עלות בפועל" : "BoM Actual"}</SelectItem>
                          <SelectItem value="PerDay">{isRTL ? "ליום" : "Per Day"}</SelectItem>
                          <SelectItem value="Capped">{isRTL ? "מוגבל" : "Capped"}</SelectItem>
                          <SelectItem value="PerUnit">{isRTL ? "ליחידה" : "Per Unit"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{isRTL ? "סוג מקבל" : "Recipient Type"}</Label>
                      <Select
                        value={comp.recipient_type}
                        onValueChange={(value) => handleUpdateComposition(index, "recipient_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Provider">{isRTL ? "ספק" : "Provider"}</SelectItem>
                          <SelectItem value="Doctor">{isRTL ? "רופא" : "Doctor"}</SelectItem>
                          <SelectItem value="Supplier">{isRTL ? "ספק משני" : "Supplier"}</SelectItem>
                          <SelectItem value="Patient">{isRTL ? "מטופל" : "Patient"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{isRTL ? "סכום" : "Amount"}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={comp.amount}
                        onChange={(e) => handleUpdateComposition(index, "amount", parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Switch
                        checked={comp.copay_applies}
                        onCheckedChange={(checked) => handleUpdateComposition(index, "copay_applies", checked)}
                      />
                      <Label>{isRTL ? "כולל השתתפות עצמית" : "Includes Copay"}</Label>
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleRemoveComposition(index)}
                    >
                      {isRTL ? "הסר" : "Remove"}
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddComposition}
              >
                {isRTL ? "הוסף רכיב" : "Add Component"}
              </Button>
            </TabsContent>

            <TabsContent value="validation" className="space-y-4">
              {/* Validation rules content */}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isRTL ? "ביטול" : "Cancel"}
            </Button>
            <Button type="submit">
              {isRTL ? "שמור" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}