import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function CodeMappingDialog({ 
  open, 
  onOpenChange, 
  mapping, 
  onSave, 
  codes = [], 
  language = "en" 
}) {
  const isRTL = language === "he";
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from_code_id: "",
    from_system: "ICD10",
    to_code_id: "",
    to_system: "CPT",
    mapping_type: "single",
    match_accuracy: "exact",
    combination_codes: [],
    notes: "",
    is_active: true
  });

  // Filter codes by system
  const fromSystemCodes = codes.filter(code => code.code_system === formData.from_system);
  const toSystemCodes = codes.filter(code => code.code_system === formData.to_system);

  useEffect(() => {
    if (mapping) {
      setFormData({
        from_code_id: mapping.from_code_id || "",
        from_system: mapping.from_system || "ICD10",
        to_code_id: mapping.to_code_id || "",
        to_system: mapping.to_system || "CPT",
        mapping_type: mapping.mapping_type || "single",
        match_accuracy: mapping.match_accuracy || "exact",
        combination_codes: Array.isArray(mapping.combination_codes) ? mapping.combination_codes : [],
        notes: mapping.notes || "",
        is_active: mapping.is_active !== false
      });
    } else {
      setFormData({
        from_code_id: "",
        from_system: "ICD10",
        to_code_id: "",
        to_system: "CPT",
        mapping_type: "single",
        match_accuracy: "exact",
        combination_codes: [],
        notes: "",
        is_active: true
      });
    }
  }, [mapping]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting mapping:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCodeLabel = (code) => {
    return `${code.code} - ${isRTL ? code.description_he : code.description_en}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mapping 
              ? (isRTL ? "ערוך מיפוי קודים" : "Edit Code Mapping")
              : (isRTL ? "מיפוי קודים חדש" : "New Code Mapping")
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="font-semibold text-base mb-2 block">
                {isRTL ? "קוד מקור" : "Source Code"}
              </Label>
              
              <div className="space-y-2">
                <Label>{isRTL ? "מערכת מקור" : "Source System"}</Label>
                <Select
                  value={formData.from_system}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    from_system: value,
                    from_code_id: "" // Reset code when system changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ICD9">ICD-9</SelectItem>
                    <SelectItem value="ICD10">ICD-10</SelectItem>
                    <SelectItem value="CPT">CPT</SelectItem>
                    <SelectItem value="HCPCS">HCPCS</SelectItem>
                    <SelectItem value="INTERNAL">
                      {isRTL ? "פנימי" : "Internal"}
                    </SelectItem>
                    <SelectItem value="DRG">DRG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mt-4">
                <Label>{isRTL ? "קוד" : "Code"}</Label>
                <Select
                  value={formData.from_code_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, from_code_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {fromSystemCodes.map(code => (
                      <SelectItem key={code.id} value={code.id}>
                        {getCodeLabel(code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label className="font-semibold text-base mb-2 block">
                {isRTL ? "קוד יעד" : "Target Code"}
              </Label>
              
              <div className="space-y-2">
                <Label>{isRTL ? "מערכת יעד" : "Target System"}</Label>
                <Select
                  value={formData.to_system}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    to_system: value,
                    to_code_id: "" // Reset code when system changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ICD9">ICD-9</SelectItem>
                    <SelectItem value="ICD10">ICD-10</SelectItem>
                    <SelectItem value="CPT">CPT</SelectItem>
                    <SelectItem value="HCPCS">HCPCS</SelectItem>
                    <SelectItem value="INTERNAL">
                      {isRTL ? "פנימי" : "Internal"}
                    </SelectItem>
                    <SelectItem value="DRG">DRG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mt-4">
                <Label>{isRTL ? "קוד" : "Code"}</Label>
                <Select
                  value={formData.to_code_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, to_code_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {toSystemCodes.map(code => (
                      <SelectItem key={code.id} value={code.id}>
                        {getCodeLabel(code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>{isRTL ? "סוג מיפוי" : "Mapping Type"}</Label>
              <Select
                value={formData.mapping_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, mapping_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">
                    {isRTL ? "בודד" : "Single"}
                  </SelectItem>
                  <SelectItem value="alternative">
                    {isRTL ? "חלופי" : "Alternative"}
                  </SelectItem>
                  <SelectItem value="combination">
                    {isRTL ? "שילוב" : "Combination"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>{isRTL ? "דיוק התאמה" : "Match Accuracy"}</Label>
              <Select
                value={formData.match_accuracy}
                onValueChange={(value) => setFormData(prev => ({ ...prev, match_accuracy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">
                    {isRTL ? "מדויק" : "Exact"}
                  </SelectItem>
                  <SelectItem value="approximate">
                    {isRTL ? "משוער" : "Approximate"}
                  </SelectItem>
                  <SelectItem value="partial">
                    {isRTL ? "חלקי" : "Partial"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_active: checked }))
              }
            />
            <Label htmlFor="is_active">
              {isRTL ? "פעיל" : "Active"}
            </Label>
          </div>

          <div>
            <Label>{isRTL ? "הערות" : "Notes"}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={isRTL ? "הערות נוספות..." : "Additional notes..."}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {mapping 
                ? (isRTL ? "שמור שינויים" : "Save Changes")
                : (isRTL ? "צור מיפוי" : "Create Mapping")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}