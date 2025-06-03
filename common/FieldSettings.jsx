import React, { useState } from "react";
import { Settings, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { FieldConfig } from "@/api/entities";

export default function FieldSettings({
  entityName,
  fields = [],
  isOpen,
  onClose,
  language = "en"
}) {
  const { toast } = useToast();
  const isRTL = language === "he";
  const [fieldSettings, setFieldSettings] = useState(
    fields.map(field => ({
      ...field,
      isVisible: true,
      isMandatory: field.key === "created_date" || field.key === "id" || false
    }))
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleVisibilityToggle = (fieldKey, newValue) => {
    setFieldSettings(prev => prev.map(field => 
      field.key === fieldKey ? { ...field, isVisible: newValue } : field
    ));
  };

  const handleMandatoryToggle = (fieldKey, newValue) => {
    setFieldSettings(prev => prev.map(field => 
      field.key === fieldKey ? { ...field, isMandatory: newValue } : field
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save field configurations
      for (const field of fieldSettings) {
        await FieldConfig.create({
          entity_name: entityName,
          field_name: field.key,
          is_visible: field.isVisible,
          is_mandatory: field.isMandatory
        });
      }
      
      toast({
        title: isRTL ? "הגדרות שדות נשמרו" : "Field settings saved",
        description: isRTL 
          ? "השינויים יכנסו לתוקף בפעם הבאה שהדף ייטען" 
          : "Changes will take effect next time the page loads",
      });
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: isRTL ? "שגיאה בשמירת הגדרות" : "Error saving settings",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              {isRTL ? "הגדרות שדות" : "Field Settings"}
            </div>
          </DialogTitle>
          <DialogDescription>
            {isRTL 
              ? "התאם אילו שדות יופיעו בממשק ואילו יהיו חובה."
              : "Customize which fields appear in the interface and which are mandatory."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 max-h-[60vh] overflow-y-auto pr-1">
          {fieldSettings.map((field) => (
            <div key={field.key} className="flex items-center justify-between py-2">
              <span className="flex flex-col">
                <span className="font-medium">
                  {isRTL ? field.labelHe || field.label : field.label}
                </span>
                <span className="text-xs text-gray-500">{field.key}</span>
              </span>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs">
                    {isRTL ? "נראה" : "Visible"}
                  </span>
                  <Switch
                    checked={field.isVisible}
                    onCheckedChange={(newValue) => handleVisibilityToggle(field.key, newValue)}
                    disabled={field.key === "id" || field.key === "created_date"}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">
                    {isRTL ? "חובה" : "Required"}
                  </span>
                  <Switch
                    checked={field.isMandatory}
                    onCheckedChange={(newValue) => handleMandatoryToggle(field.key, newValue)}
                    disabled={field.key === "id" || field.key === "created_date" || !field.isVisible}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className={isRTL ? "sm:justify-start" : "sm:justify-end"}>
          <Button variant="outline" onClick={onClose}>
            {isRTL ? "ביטול" : "Cancel"}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {isRTL ? "שומר..." : "Saving..."}
              </>
            ) : (
              isRTL ? "שמור" : "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}