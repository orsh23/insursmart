import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ImportDialog({
  open,
  onOpenChange,
  onImport,
  acceptedFileTypes = ".csv,.xlsx",
  maxFileSize = 5242880, // 5MB
  language = "en"
}) {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const isRTL = language === "he";

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      if (selectedFile.size > maxFileSize) {
        toast({
          variant: "destructive",
          title: isRTL ? "קובץ גדול מדי" : "File too large",
          description: isRTL 
            ? "גודל הקובץ המקסימלי הוא 5MB"
            : "Maximum file size is 5MB"
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    try {
      setLoading(true);
      await onImport(file);
      setFile(null);
    } catch (error) {
      console.error("Import error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isRTL ? "ייבוא נתונים" : "Import Data"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            {file ? (
              <div className="flex items-center justify-between">
                <span className="truncate">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <label className="cursor-pointer text-blue-600 hover:text-blue-700">
                  <span>
                    {isRTL ? "בחר קובץ" : "Choose a file"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept={acceptedFileTypes}
                    onChange={handleFileChange}
                  />
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  {isRTL
                    ? `או גרור קובץ לכאן (${acceptedFileTypes})`
                    : `or drag and drop here (${acceptedFileTypes})`
                  }
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {isRTL ? "ביטול" : "Cancel"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!file || loading}
            >
              {loading ? (
                <span>{isRTL ? "מייבא..." : "Importing..."}</span>
              ) : (
                <span>{isRTL ? "ייבא" : "Import"}</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}