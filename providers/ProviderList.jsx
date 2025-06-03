import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function ProviderList({
  providers = [],
  doctors = [],
  loading = false,
  editMode = false,
  selectedItems = [],
  onSelectionChange,
  onSelectAll,
  onDeselectAll,
  onEdit,
  onDelete,
  getDoctorsByProvider,
  language = "en"
}) {
  const [expandedRows, setExpandedRows] = React.useState([]);
  const isRTL = language === "he";

  const handleToggleRow = (id) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };
  
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      onSelectAll(providers);
    } else {
      onDeselectAll();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {isRTL ? "לא נמצאו ספקים" : "No providers found"}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-100 dark:bg-gray-800">
          <TableRow>
            {editMode && (
              <TableHead style={{ width: "40px" }}>
                <Checkbox
                  checked={providers.length > 0 && selectedItems.length === providers.length}
                  onCheckedChange={handleSelectAllClick}
                />
              </TableHead>
            )}
            <TableHead style={{ width: editMode ? "40px" : "0px" }}></TableHead>
            <TableHead>{isRTL ? "שם ספק" : "Provider Name"}</TableHead>
            <TableHead>{isRTL ? "סוג" : "Type"}</TableHead>
            <TableHead>{isRTL ? "עיר" : "City"}</TableHead>
            <TableHead>{isRTL ? "איש קשר" : "Contact Person"}</TableHead>
            <TableHead>{isRTL ? "טלפון" : "Phone"}</TableHead>
            <TableHead>{isRTL ? "סטטוס" : "Status"}</TableHead>
            {!editMode && <TableHead></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => {
            const isExpanded = expandedRows.includes(provider.id);
            const providerDoctors = getDoctorsByProvider(provider.id);
            const hasAssociatedDoctors = providerDoctors.length > 0;
            
            return (
              <React.Fragment key={provider.id}>
                <TableRow className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${isExpanded ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  {editMode && (
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(provider.id)}
                        onCheckedChange={(checked) => 
                          onSelectionChange(provider.id, checked)
                        }
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    {hasAssociatedDoctors && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-6 w-6"
                        onClick={() => handleToggleRow(provider.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {isRTL ? provider.provider_name_he : provider.provider_name_en}
                  </TableCell>
                  <TableCell>
                    {isRTL ? getHebrewProviderType(provider.provider_type) : provider.provider_type}
                  </TableCell>
                  <TableCell>
                    {isRTL && provider.city_he ? provider.city_he : provider.city}
                  </TableCell>
                  <TableCell>{provider.contact_person}</TableCell>
                  <TableCell>{provider.phone}</TableCell>
                  <TableCell>
                    <Badge variant={provider.is_active ? "success" : "secondary"}>
                      {provider.is_active 
                        ? (isRTL ? "פעיל" : "Active") 
                        : (isRTL ? "לא פעיל" : "Inactive")
                      }
                    </Badge>
                  </TableCell>
                  {!editMode && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {isRTL ? "פעולות" : "Actions"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "end" : "start"}>
                          <DropdownMenuItem onClick={() => onEdit(provider)}>
                            <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {isRTL ? "ערוך" : "Edit"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(provider)}>
                            <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {isRTL ? "מחק" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
                
                {/* Expandable row for associated doctors */}
                {isExpanded && (
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableCell colSpan={editMode ? 9 : 8}>
                      <div className="p-4">
                        <h4 className="font-medium mb-2">
                          {isRTL ? "רופאים מקושרים" : "Associated Doctors"}
                        </h4>
                        <div className="border rounded-md overflow-hidden bg-white dark:bg-gray-900">
                          <Table>
                            <TableHeader className="bg-gray-100 dark:bg-gray-800">
                              <TableRow>
                                <TableHead>{isRTL ? "שם רופא" : "Doctor Name"}</TableHead>
                                <TableHead>{isRTL ? "מס' רישיון" : "License #"}</TableHead>
                                <TableHead>{isRTL ? "התמחויות" : "Specialties"}</TableHead>
                                <TableHead>{isRTL ? "אימייל" : "Email"}</TableHead>
                                <TableHead>{isRTL ? "טלפון" : "Phone"}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {providerDoctors.map(doctor => (
                                <TableRow key={doctor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <TableCell className="font-medium">
                                    {isRTL ? doctor.doctor_name_he : doctor.doctor_name_en}
                                  </TableCell>
                                  <TableCell>
                                    {doctor.license_number}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {(doctor.specialties || []).slice(0, 2).map((specialty, index) => (
                                        <Badge key={index} variant="outline">
                                          {specialty}
                                        </Badge>
                                      ))}
                                      {(doctor.specialties || []).length > 2 && (
                                        <Badge variant="outline">
                                          +{doctor.specialties.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>{doctor.email}</TableCell>
                                  <TableCell>{doctor.contact_phone}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function getHebrewProviderType(type) {
  const typeMap = {
    "Hospital": "בית חולים",
    "Clinic": "מרפאה",
    "Laboratory": "מעבדה",
    "Imaging": "מכון הדמיה",
    "Other": "אחר"
  };
  return typeMap[type] || type;
}