import React, { useState, useEffect } from "react";
import { ArrowLeftRight, Plus, Edit, Download, Upload, Trash } from "lucide-react";
import { CodeMapping } from "@/api/entities";
import { MedicalCode } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DataTable from "../common/DataTable";
import SearchFilterBar from "../common/SearchFilterBar";
import SmartFilter from "../common/SmartFilter";
import ActionMenu from "../common/ActionMenu";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import CodeMappingDialog from "./CodeMappingDialog";
import { useToast } from "@/components/ui/use-toast";

export default function CodeMappingsTab({ language = "en" }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [mappings, setMappings] = useState([]);
  const [codes, setCodes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    fromSystem: "all",
    toSystem: "all",
    mappingType: "all",
    matchAccuracy: "all"
  });
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState(null);

  const isRTL = language === "he";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mappingsData, codesData] = await Promise.all([
        CodeMapping.list(),
        MedicalCode.list()
      ]);
      setMappings(mappingsData || []);
      setCodes(codesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: isRTL ? "שגיאה בטעינת נתונים" : "Error loading data",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMappingClick = (mapping) => {
    setSelectedMapping(mapping);
    setShowDialog(true);
  };

  const handleAddMapping = () => {
    setSelectedMapping(null);
    setShowDialog(true);
  };

  const handleSaveMapping = async (data) => {
    try {
      if (selectedMapping) {
        await CodeMapping.update(selectedMapping.id, data);
        toast({
          title: isRTL ? "מיפוי עודכן" : "Mapping updated",
          description: isRTL ? "המיפוי עודכן בהצלחה" : "Mapping was successfully updated"
        });
      } else {
        await CodeMapping.create(data);
        toast({
          title: isRTL ? "מיפוי נוצר" : "Mapping created",
          description: isRTL ? "המיפוי נוצר בהצלחה" : "Mapping was successfully created"
        });
      }
      setShowDialog(false);
      fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: isRTL ? "שגיאה בשמירת מיפוי" : "Error saving mapping",
        description: error.message
      });
    }
  };

  const getCodeLabel = (codeId, system) => {
    const code = codes.find(c => c.id === codeId);
    if (!code) return codeId;
    return `${code.code} - ${isRTL ? code.description_he : code.description_en}`;
  };

  const getSystemLabel = (system) => {
    const systemLabels = {
      ICD9: "ICD-9",
      ICD10: "ICD-10",
      CPT: "CPT",
      HCPCS: "HCPCS",
      INTERNAL: isRTL ? "פנימי" : "Internal",
      DRG: "DRG"
    };
    return systemLabels[system] || system;
  };

  const getMappingTypeLabel = (type) => {
    const typeLabels = {
      single: isRTL ? "בודד" : "Single",
      alternative: isRTL ? "חלופי" : "Alternative",
      combination: isRTL ? "שילוב" : "Combination"
    };
    return typeLabels[type] || type;
  };

  const getAccuracyLabel = (accuracy) => {
    const accuracyLabels = {
      exact: isRTL ? "מדויק" : "Exact",
      approximate: isRTL ? "משוער" : "Approximate",
      partial: isRTL ? "חלקי" : "Partial"
    };
    return accuracyLabels[accuracy] || accuracy;
  };

  const getAccuracyBadgeVariant = (accuracy) => {
    const variants = {
      exact: "success",
      approximate: "warning",
      partial: "secondary"
    };
    return variants[accuracy] || "default";
  };

  const columns = [
    {
      accessorKey: "from",
      header: isRTL ? "מקור" : "From",
      cell: ({ row }) => (
        <div>
          <Badge variant="outline">{getSystemLabel(row.original.from_system)}</Badge>
          <div className="mt-1 text-sm">{getCodeLabel(row.original.from_code_id, row.original.from_system)}</div>
        </div>
      )
    },
    {
      accessorKey: "to",
      header: isRTL ? "יעד" : "To",
      cell: ({ row }) => (
        <div>
          <Badge variant="outline">{getSystemLabel(row.original.to_system)}</Badge>
          <div className="mt-1 text-sm">{getCodeLabel(row.original.to_code_id, row.original.to_system)}</div>
        </div>
      )
    },
    {
      accessorKey: "mapping_type",
      header: isRTL ? "סוג מיפוי" : "Mapping Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {getMappingTypeLabel(row.original.mapping_type)}
        </Badge>
      )
    },
    {
      accessorKey: "match_accuracy",
      header: isRTL ? "דיוק התאמה" : "Match Accuracy",
      cell: ({ row }) => (
        <Badge variant={getAccuracyBadgeVariant(row.original.match_accuracy)}>
          {getAccuracyLabel(row.original.match_accuracy)}
        </Badge>
      )
    },
    {
      accessorKey: "status",
      header: isRTL ? "סטטוס" : "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "success" : "secondary"}>
          {row.original.is_active 
            ? (isRTL ? "פעיל" : "Active")
            : (isRTL ? "לא פעיל" : "Inactive")
          }
        </Badge>
      )
    }
  ];

  // Filter content
  const filterContent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SmartFilter
        label="From System"
        labelHe="מערכת מקור"
        options={[
          { value: "ICD9", label: "ICD-9", labelHe: "ICD-9" },
          { value: "ICD10", label: "ICD-10", labelHe: "ICD-10" },
          { value: "CPT", label: "CPT", labelHe: "CPT" },
          { value: "HCPCS", label: "HCPCS", labelHe: "HCPCS" },
          { value: "INTERNAL", label: "Internal", labelHe: "פנימי" },
          { value: "DRG", label: "DRG", labelHe: "DRG" }
        ]}
        value={filters.fromSystem}
        onChange={(value) => setFilters({...filters, fromSystem: value})}
        language={language}
      />
      
      <SmartFilter
        label="To System"
        labelHe="מערכת יעד"
        options={[
          { value: "ICD9", label: "ICD-9", labelHe: "ICD-9" },
          { value: "ICD10", label: "ICD-10", labelHe: "ICD-10" },
          { value: "CPT", label: "CPT", labelHe: "CPT" },
          { value: "HCPCS", label: "HCPCS", labelHe: "HCPCS" },
          { value: "INTERNAL", label: "Internal", labelHe: "פנימי" },
          { value: "DRG", label: "DRG", labelHe: "DRG" }
        ]}
        value={filters.toSystem}
        onChange={(value) => setFilters({...filters, toSystem: value})}
        language={language}
      />
      
      <SmartFilter
        label="Mapping Type"
        labelHe="סוג מיפוי"
        options={[
          { value: "single", label: "Single", labelHe: "בודד" },
          { value: "alternative", label: "Alternative", labelHe: "חלופי" },
          { value: "combination", label: "Combination", labelHe: "שילוב" }
        ]}
        value={filters.mappingType}
        onChange={(value) => setFilters({...filters, mappingType: value})}
        language={language}
      />
      
      <SmartFilter
        label="Match Accuracy"
        labelHe="דיוק התאמה"
        options={[
          { value: "exact", label: "Exact", labelHe: "מדויק" },
          { value: "approximate", label: "Approximate", labelHe: "משוער" },
          { value: "partial", label: "Partial", labelHe: "חלקי" }
        ]}
        value={filters.matchAccuracy}
        onChange={(value) => setFilters({...filters, matchAccuracy: value})}
        language={language}
      />
    </div>
  );

  // Filter mappings
  const filteredMappings = mappings.filter(mapping => {
    // Search query filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const fromCode = getCodeLabel(mapping.from_code_id, mapping.from_system).toLowerCase();
      const toCode = getCodeLabel(mapping.to_code_id, mapping.to_system).toLowerCase();
      
      if (!fromCode.includes(searchLower) && !toCode.includes(searchLower)) {
        return false;
      }
    }
    
    // From system filter
    if (filters.fromSystem !== "all" && mapping.from_system !== filters.fromSystem) {
      return false;
    }
    
    // To system filter
    if (filters.toSystem !== "all" && mapping.to_system !== filters.toSystem) {
      return false;
    }
    
    // Mapping type filter
    if (filters.mappingType !== "all" && mapping.mapping_type !== filters.mappingType) {
      return false;
    }
    
    // Accuracy filter
    if (filters.matchAccuracy !== "all" && mapping.match_accuracy !== filters.matchAccuracy) {
      return false;
    }
    
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {isRTL ? "מיפויי קודים" : "Code Mappings"}
        </h2>
        
        <Button onClick={handleAddMapping}>
          <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {isRTL ? "הוסף מיפוי" : "Add Mapping"}
        </Button>
      </div>

      <SearchFilterBar
        onSearch={(query) => setSearchQuery(query)}
        filterContent={filterContent}
        onReset={() => {
          setSearchQuery("");
          setFilters({
            fromSystem: "all",
            toSystem: "all",
            mappingType: "all",
            matchAccuracy: "all"
          });
        }}
        searchPlaceholder={isRTL ? "חיפוש מיפויים..." : "Search mappings..."}
        language={language}
      />

      {loading ? (
        <Card className="flex justify-center items-center p-8">
          <LoadingSpinner size="large" />
        </Card>
      ) : mappings.length === 0 ? (
        <EmptyState
          title={isRTL ? "אין מיפויים" : "No Mappings"}
          description={isRTL 
            ? "לא נמצאו מיפויי קודים. ניתן להוסיף מיפוי חדש או לייבא מיפויים מקובץ."
            : "No code mappings found. You can add a new mapping or import mappings from a file."
          }
          icon={ArrowLeftRight}
          actions={
            <Button onClick={handleAddMapping}>
              <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {isRTL ? "הוסף מיפוי" : "Add Mapping"}
            </Button>
          }
        />
      ) : filteredMappings.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">
            {isRTL 
              ? "לא נמצאו מיפויים התואמים את הסינון. נסה לשנות את פרמטרי החיפוש."
              : "No mappings match your filters. Try changing your search parameters."
            }
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchQuery("");
              setFilters({
                fromSystem: "all",
                toSystem: "all",
                mappingType: "all",
                matchAccuracy: "all"
              });
            }}
          >
            {isRTL ? "נקה סינון" : "Clear Filters"}
          </Button>
        </Card>
      ) : (
        <DataTable
          data={filteredMappings}
          columns={columns}
          loading={loading}
          language={language}
          onRowClick={handleMappingClick}
        />
      )}

      {showDialog && (
        <CodeMappingDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          mapping={selectedMapping}
          onSave={handleSaveMapping}
          codes={codes}
          language={language}
        />
      )}
    </div>
  );
}