import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

export default function ExportOptionsDialog({
  open,
  onOpenChange,
  data = [],
  fileName = "export",
  language = "en"
}) {
  const [format, setFormat] = useState("csv");
  const isRTL = language === "he";

  const handleExport = () => {
    if (!data || data.length === 0) {
      return;
    }
    
    try {
      let content = "";
      let mimeType = "";
      let fileExtension = "";
      
      if (format === "csv") {
        // Generate CSV
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map(item => 
          Object.values(item).map(value => 
            typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value
          ).join(",")
        );
        
        content = [headers, ...rows].join("\n");
        mimeType = "text/csv";
        fileExtension = "csv";
      } else if (format === "json") {
        // Generate JSON
        content = JSON.stringify(data, null, 2);
        mimeType = "application/json";
        fileExtension = "json";
      }
      
      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>
            {isRTL ? "ייצוא נתונים" : "Export Data"}
          </DialogTitle>
          <DialogDescription>
            {isRTL
              ? "בחר את הפורמט הרצוי לייצוא הנתונים."
              : "Choose the format to export your data."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup
            value={format}
            onValueChange={setFormat}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv" className="flex items-center cursor-pointer">
                <FileSpreadsheet className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                CSV
              </Label>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json" className="flex items-center cursor-pointer">
                <FileText className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                JSON
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <DialogFooter className={isRTL ? "flex-row-reverse" : undefined}>
          <Button type="button" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            {isRTL ? "ייצא" : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}