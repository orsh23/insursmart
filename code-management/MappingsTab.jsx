import React, { useState, useEffect } from "react";
import { Plus, Edit, X, ArrowRight, ArrowLeft } from "lucide-react";
import { Crosswalk } from "@/api/entities";
import { MedicalCode } from "@/api/entities";
import { InternalCode } from "@/api/entities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataTable from "../common/DataTable";
import SearchFilterBar from "../common/SearchFilterBar";
import SmartFilter from "../common/SmartFilter";
import ActionMenu from "../common/ActionMenu";
import LoadingSpinner from "../common/LoadingSpinner";
import { useToast } from "@/components/ui/use-toast";

export default function MappingsTab({ language = "en" }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [mappings, setMappings] = useState([]);
  const [medicalCodes, setMedicalCodes] = useState([]);
  const [internalCodes, setInternalCodes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    sourceType: "all",
    targetType: "all",
    direction: "all",
    accuracy: "all"
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedMappings, setSelectedMappings] = useState([]);

  const isRTL = language === "he";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mappingsData, medicalCodesData, internalCodesData] = await Promise.all([
        Crosswalk.list(),
        MedicalCode.list(),
        InternalCode.list()
      ]);
      setMappings(mappingsData);
      setMedicalCodes(medicalCodesData);
      setInternalCodes(internalCodesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  // Helper to get code description by type and number
  const getCodeDescription = (codeType, codeNumber) => {
    if (codeType === "Internal") {
      const code = internalCodes.find(c => c.code_number === codeNumber);
      if (code) return isRTL ? code.description_he : code.description_en;
    } else {
      const code = medicalCodes.find(c => c.code_number === codeNumber && c.code_type === codeType);
      if (code) return isRTL ? code.description_he : code.description_en;
    }
    return null;
  };

  const columns = [
    {
      accessorKey: "source",
      header: isRTL ? "מקור" : "Source",
      cell: ({ row }) => (
        <div>
          <div className="flex items-center">
            <Badge className="mr-2">{row.original.anchor_type}</Badge>
            <span className="font-mono">{row.original.anchor_code}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
            {getCodeDescription(row.original.anchor_type, row.original.anchor_code) || ""}
          </div>
        </div>
      )
    },
    {
      accessorKey: "direction",
      header: isRTL ? "כיוון" : "Direction",
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.direction === "Forward" && (
            <ArrowRight className="text-gray-600" />
          )}
          {row.original.direction === "Reverse" && (
            <ArrowLeft className="text-gray-600" />
          )}
          {row.original.direction === "Bidirectional" && (
            <div className="flex">
              <ArrowLeft className="text-gray-600" />
              <ArrowRight className="text-gray-600" />
            </div>
          )}
        </div>
      )
    },
    {
      accessorKey: "target",
      header: isRTL ? "יעד" : "Target",
      cell: ({ row }) => (
        <div>
          <div className="flex items-center">
            <Badge className="mr-2">{row.original.target_code_type}</Badge>
            <span className="font-mono">{row.original.dynamic_code_1}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
            {getCodeDescription(row.original.target_code_type, row.original.dynamic_code_1) || ""}
          </div>
        </div>
      )
    },
    {
      accessorKey: "mapping_type",
      header: isRTL ? "סוג מיפוי" : "Mapping Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.mapping_type === "Single" && (isRTL ? "יחיד" : "Single")}
          {row.original.mapping_type === "Alternative" && (isRTL ? "חלופי" : "Alternative")}
          {row.original.mapping_type === "Combination" && (isRTL ? "שילוב" : "Combination")}
          {row.original.mapping_type === "No Map" && (isRTL ? "ללא מיפוי" : "No Map")}
        </Badge>
      )
    },
    {
      accessorKey: "match_accuracy",
      header: isRTL ? "דיוק התאמה" : "Match Accuracy",
      cell: ({ row }) => {
        let color;
        if (row.original.match_accuracy === "Exact") {
          color = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        } else if (row.original.match_accuracy === "Approximate") {
          color = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
        } else {
          color = "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        }
        
        return (
          <Badge className={color} variant="outline">
            {row.original.match_accuracy === "Exact" && (isRTL ? "מדויק" : "Exact")}
            {row.original.match_accuracy === "Approximate" && (isRTL ? "משוער" : "Approximate")}
            {row.original.match_accuracy === "NoPCS" && (isRTL ? "ללא PCS" : "No PCS")}
          </Badge>
        );
      }
    }
  ];

  const handleAddMapping = () => {
    toast({
      title: isRTL ? "הוספת מיפוי" : "Add Mapping",
      description: isRTL 
        ? "הוספת מיפויים זמינה דרך דיאלוג מותאם" 
        : "Adding mappings is available through a custom dialog"
    });
  };

  const handleDeleteSelected = async () => {
    toast({
      title: isRTL ? "מחיקת מיפויים" : "Delete Mappings",
      description: isRTL 
        ? `${selectedMappings.length} מיפויים יימחקו בקרוב` 
        : `${selectedMappings.length} mappings will be deleted soon`
    });
  };
  
  // Filter content
  const filterContent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <SmartFilter
        label="Source Type"
        labelHe="סוג מקור"
        options={[
          { value: "ICD9", label: "ICD-9", labelHe: "ICD-9" },
          { value: "ICD10", label: "ICD-10", labelHe: "ICD-10" },
          { value: "CPT", label: "CPT", labelHe: "CPT" },
          { value: "Internal", label: "Internal", labelHe: "פנימי" }
        ]}
        value={filters.sourceType}
        onChange={(value) => setFilters({...filters, sourceType: value})}
        language={language}
      />
      
      <SmartFilter
        label="Target Type"
        labelHe="סוג יעד"
        options={[
          { value: "ICD9", label: "ICD-9", labelHe: "ICD-9" },
          { value: "ICD10", label: "ICD-10", labelHe: "ICD-10" },
          { value: "CPT", label: "CPT", labelHe: "CPT" },
          { value: "Internal", label: "Internal", labelHe: "פנימי" }
        ]}
        value={filters.targetType}
        onChange={(value) => setFilters({...filters, targetType: value})}
        language={language}
      />
      
      <SmartFilter
        label="Direction"
        labelHe="כיוון"
        options={[
          { value: "Forward", label: "Forward", labelHe: "קדימה" },
          { value: "Reverse", label: "Reverse", labelHe: "אחורה" },
          { value: "Bidirectional", label: "Bidirectional", labelHe: "דו-כיווני" }
        ]}
        value={filters.direction}
        onChange={(value) => setFilters({...filters, direction: value})}
        language={language}
      />
      
      <SmartFilter
        label="Accuracy"
        labelHe="דיוק"
        options={[
          { value: "Exact", label: "Exact", labelHe: "מדויק" },
          { value: "Approximate", label: "Approximate", labelHe: "משוער" },
          { value: "NoPCS", label: "No PCS", labelHe: "ללא PCS" }
        ]}
        value={filters.accuracy}
        onChange={(value) => setFilters({...filters, accuracy: value})}
        language={language}
      />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {isRTL ? "מיפויי קודים" : "Code Mappings"}
        </h2>
        
        <div className="flex items-center gap-2">
          {!editMode ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setEditMode(true)}
              >
                <Edit className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {isRTL ? "מצב עריכה" : "Edit Mode"}
              </Button>
              
              <Button onClick={handleAddMapping}>
                <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {isRTL ? "הוסף מיפוי" : "Add Mapping"}
              </Button>
              
              <ActionMenu
                onImport={() => console.log("Import")}
                onExport={() => console.log("Export")}
                onSchema={() => console.log("Schema")}
                language={language}
              />
            </>
          ) : (
            <>
              <span className="text-sm mr-2">
                {selectedMappings.length} {isRTL ? "נבחרו" : "selected"}
              </span>
              
              {selectedMappings.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteSelected}
                >
                  <X className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {isRTL ? "מחק" : "Delete"}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditMode(false);
                  setSelectedMappings([]);
                }}
              >
                <X className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {isRTL ? "ביטול" : "Cancel"}
              </Button>
            </>
          )}
        </div>
      </div>

      <SearchFilterBar
        onSearch={(query) => setSearchQuery(query)}
        filterContent={filterContent}
        onReset={() => {
          setSearchQuery("");
          setFilters({
            sourceType: "all",
            targetType: "all",
            direction: "all",
            accuracy: "all"
          });
        }}
        searchPlaceholder={isRTL ? "חיפוש מיפויים..." : "Search mappings..."}
        language={language}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <DataTable
          data={mappings}
          columns={columns}
          loading={loading}
          language={language}
          editMode={editMode}
          selectable={editMode}
          selectedIds={selectedMappings}
          onSelectionChange={setSelectedMappings}
        />
      )}
    </div>
  );
}