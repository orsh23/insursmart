import React, { useState } from "react";
import { Plus, Calendar, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import LoadingSpinner from "../common/LoadingSpinner";
import DataTable from "../common/DataTable";
import SearchFilterBar from "../common/SearchFilterBar";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function ProviderDoctorsList({
  doctorLinks = [],
  doctors = [],
  providerId,
  onLinkDoctor,
  onUnlinkDoctor,
  onUpdateLink,
  language = "en",
  loading = false
}) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [affiliation, setAffiliation] = useState("visiting");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [editingLinkId, setEditingLinkId] = useState(null);
  
  const isRTL = language === "he";

  // Filtered doctors not already linked
  const availableDoctors = doctors.filter(
    doctor => !doctorLinks.some(link => link.doctor_id === doctor.id)
  );

  // Filter doctor links based on search
  const filteredLinks = doctorLinks.filter(link => {
    if (!searchQuery) return true;
    
    const doctor = doctors.find(d => d.id === link.doctor_id);
    if (!doctor) return false;
    
    const fullNameEn = `${doctor.first_name_en} ${doctor.last_name_en}`.toLowerCase();
    const fullNameHe = `${doctor.first_name_he} ${doctor.last_name_he}`;
    
    return fullNameEn.includes(searchQuery.toLowerCase()) || 
           fullNameHe.includes(searchQuery) ||
           doctor.license_number?.includes(searchQuery) ||
           doctor.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDoctorId) {
      toast({
        variant: "destructive",
        title: isRTL ? "שגיאה" : "Error",
        description: isRTL ? "יש לבחור רופא" : "Please select a doctor"
      });
      return;
    }
    
    const linkData = {
      doctor_id: selectedDoctorId,
      provider_id: providerId,
      affiliation_type: affiliation,
      start_date: startDate ? format(startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      is_active: isActive,
      notes: notes
    };
    
    try {
      let success;
      
      if (editingLinkId) {
        success = await onUpdateLink(editingLinkId, linkData);
      } else {
        success = await onLinkDoctor(linkData);
      }
      
      if (success) {
        // Reset form
        setSelectedDoctorId("");
        setAffiliation("visiting");
        setStartDate(new Date());
        setEndDate(null);
        setIsActive(true);
        setNotes("");
        setShowLinkForm(false);
        setEditingLinkId(null);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: isRTL ? "שגיאה" : "Error",
        description: error.message
      });
    }
  };

  const handleEdit = (link) => {
    const doctor = doctors.find(d => d.id === link.doctor_id);
    
    setEditingLinkId(link.id);
    setSelectedDoctorId(link.doctor_id);
    setAffiliation(link.affiliation_type);
    setStartDate(new Date(link.start_date));
    setEndDate(link.end_date ? new Date(link.end_date) : null);
    setIsActive(link.is_active);
    setNotes(link.notes || "");
    setShowLinkForm(true);
  };

  const handleUnlink = async (linkId) => {
    try {
      await onUnlinkDoctor(linkId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: isRTL ? "שגיאה" : "Error",
        description: error.message
      });
    }
  };

  const cancelForm = () => {
    setShowLinkForm(false);
    setEditingLinkId(null);
    setSelectedDoctorId("");
    setAffiliation("visiting");
    setStartDate(new Date());
    setEndDate(null);
    setIsActive(true);
    setNotes("");
  };

  const affiliationTypes = [
    { value: "employed", label: "Employed", labelHe: "מועסק" },
    { value: "visiting", label: "Visiting", labelHe: "מבקר" },
    { value: "consultant", label: "Consultant", labelHe: "יועץ" },
    { value: "resident", label: "Resident", labelHe: "מתמחה" },
    { value: "independent", label: "Independent", labelHe: "עצמאי" }
  ];

  const getAffiliationLabel = (type) => {
    const affiliation = affiliationTypes.find(a => a.value === type);
    return affiliation ? (isRTL ? affiliation.labelHe : affiliation.label) : type;
  };

  const columns = [
    {
      accessorKey: "doctor",
      header: isRTL ? "רופא" : "Doctor",
      cell: ({ row }) => {
        const link = row.original;
        const doctor = doctors.find(d => d.id === link.doctor_id);
        if (!doctor) return "-";
        
        return (
          <div>
            <div className="font-medium">
              {isRTL 
                ? `${doctor.first_name_he} ${doctor.last_name_he}`
                : `${doctor.first_name_en} ${doctor.last_name_en}`
              }
            </div>
            <div className="text-sm text-gray-500">
              {doctor.license_number}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "specialty",
      header: isRTL ? "התמחות" : "Specialty",
      cell: ({ row }) => {
        const link = row.original;
        const doctor = doctors.find(d => d.id === link.doctor_id);
        return doctor?.specialty || "-";
      }
    },
    {
      accessorKey: "affiliation_type",
      header: isRTL ? "סוג שיוך" : "Affiliation Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {getAffiliationLabel(row.original.affiliation_type)}
        </Badge>
      )
    },
    {
      accessorKey: "dates",
      header: isRTL ? "תאריכים" : "Dates",
      cell: ({ row }) => {
        const link = row.original;
        return (
          <div className="text-sm">
            {link.start_date && (
              <div>
                {isRTL ? "התחלה:" : "From:"} {new Date(link.start_date).toLocaleDateString()}
              </div>
            )}
            {link.end_date && (
              <div>
                {isRTL ? "סיום:" : "To:"} {new Date(link.end_date).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      }
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
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row.original);
            }}
          >
            {isRTL ? "ערוך" : "Edit"}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              handleUnlink(row.original.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {isRTL ? "רופאים משויכים" : "Affiliated Doctors"}
        </h3>
        
        {!showLinkForm && (
          <Button onClick={() => setShowLinkForm(true)}>
            <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {isRTL ? "קשר רופא" : "Link Doctor"}
          </Button>
        )}
      </div>
      
      {showLinkForm && (
        <div className="bg-gray-50 p-4 rounded-lg border mb-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "רופא" : "Doctor"}*
                </label>
                
                {editingLinkId ? (
                  // In edit mode, show selected doctor
                  (() => {
                    const doctor = doctors.find(d => d.id === selectedDoctorId);
                    if (!doctor) return "-";
                    
                    return (
                      <div className="p-2 border rounded-md bg-gray-100">
                        <div className="font-medium">
                          {isRTL 
                            ? `${doctor.first_name_he} ${doctor.last_name_he}`
                            : `${doctor.first_name_en} ${doctor.last_name_en}`
                          }
                        </div>
                        <div className="text-sm text-gray-500">
                          {doctor.license_number}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  // In create mode, show dropdown
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    <option value="">
                      {isRTL ? "-- בחר רופא --" : "-- Select Doctor --"}
                    </option>
                    
                    {availableDoctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {isRTL 
                          ? `${doctor.first_name_he} ${doctor.last_name_he}`
                          : `${doctor.first_name_en} ${doctor.last_name_en}`
                        } ({doctor.license_number})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "סוג שיוך" : "Affiliation Type"}*
                </label>
                <select
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  className="w-full border rounded-md p-2"
                  required
                >
                  {affiliationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {isRTL ? type.labelHe : type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "תאריך התחלה" : "Start Date"}*
                </label>
                <Input
                  type="date"
                  value={startDate ? format(new Date(startDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "תאריך סיום" : "End Date"} ({isRTL ? "אופציונלי" : "optional"})
                </label>
                <Input
                  type="date"
                  value={endDate ? format(new Date(endDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "הערות" : "Notes"} ({isRTL ? "אופציונלי" : "optional"})
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isRTL ? "הערות נוספות" : "Additional notes"}
                />
              </div>
              
              <div className="flex items-center mt-4">
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <label htmlFor="is-active" className="ml-2 text-sm cursor-pointer">
                  {isRTL ? "שיוך פעיל" : "Affiliation is active"}
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={cancelForm}>
                {isRTL ? "בטל" : "Cancel"}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <LoadingSpinner size="small" />
                ) : editingLinkId ? (
                  isRTL ? "עדכן" : "Update"
                ) : (
                  isRTL ? "קשר" : "Link"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
      
      <SearchFilterBar
        onSearch={setSearchQuery}
        searchPlaceholder={isRTL ? "חיפוש לפי שם, התמחות..." : "Search by name, specialty..."}
        language={language}
      />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <DataTable
          data={filteredLinks}
          columns={columns}
          language={language}
        />
      )}
    </div>
  );
}