import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";

export default function DoctorProviderMatrix({
  providerId,
  doctors = [],
  matrix = [],
  onUpdate,
  language = "en"
}) {
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const isRTL = language === "he";

  const handleAddDoctorRelation = () => {
    if (!selectedDoctor) return;
    
    const newMatrix = [...matrix, {
      doctor_id: selectedDoctor,
      relationship_type: "independent",
      fee_handling: "separate"
    }];
    
    onUpdate(newMatrix);
    setSelectedDoctor("");
  };

  const handleUpdateRelation = (index, field, value) => {
    const newMatrix = [...matrix];
    newMatrix[index] = {
      ...newMatrix[index],
      [field]: value
    };
    onUpdate(newMatrix);
  };

  const handleRemoveRelation = (index) => {
    const newMatrix = [...matrix];
    newMatrix.splice(index, 1);
    onUpdate(newMatrix);
  };

  const getAvailableDoctors = () => {
    const assignedDoctorIds = matrix.map(m => m.doctor_id);
    return doctors.filter(d => !assignedDoctorIds.includes(d.id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isRTL ? "מטריצת רופאים-ספק" : "Doctor-Provider Matrix"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add new doctor relation */}
          <div className="flex gap-2">
            <Select
              value={selectedDoctor}
              onValueChange={setSelectedDoctor}
            >
              <SelectTrigger className="w-full">
                <SelectValue 
                  placeholder={isRTL ? "בחר רופא..." : "Select doctor..."}
                />
              </SelectTrigger>
              <SelectContent>
                {getAvailableDoctors().map(doctor => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {isRTL ? doctor.doctor_name_he : doctor.doctor_name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddDoctorRelation}
              disabled={!selectedDoctor}
            >
              <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {isRTL ? "הוסף" : "Add"}
            </Button>
          </div>

          {/* Matrix table */}
          {matrix.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left rtl:text-right">
                      {isRTL ? "רופא" : "Doctor"}
                    </th>
                    <th className="px-4 py-2 text-left rtl:text-right">
                      {isRTL ? "סוג קשר" : "Relationship"}
                    </th>
                    <th className="px-4 py-2 text-left rtl:text-right">
                      {isRTL ? "טיפול בשכר" : "Fee Handling"}
                    </th>
                    <th className="px-4 py-2 text-center">
                      {isRTL ? "פעולות" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((relation, index) => {
                    const doctor = doctors.find(d => d.id === relation.doctor_id);
                    return (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">
                          {doctor ? (
                            isRTL ? doctor.doctor_name_he : doctor.doctor_name_en
                          ) : relation.doctor_id}
                        </td>
                        <td className="px-4 py-2">
                          <Select
                            value={relation.relationship_type}
                            onValueChange={(value) => 
                              handleUpdateRelation(index, "relationship_type", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employed">
                                {isRTL ? "מועסק" : "Employed"}
                              </SelectItem>
                              <SelectItem value="independent">
                                {isRTL ? "עצמאי" : "Independent"}
                              </SelectItem>
                              <SelectItem value="both">
                                {isRTL ? "שניהם" : "Both"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2">
                          <Select
                            value={relation.fee_handling}
                            onValueChange={(value) => 
                              handleUpdateRelation(index, "fee_handling", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="included">
                                {isRTL ? "כלול" : "Included"}
                              </SelectItem>
                              <SelectItem value="separate">
                                {isRTL ? "נפרד" : "Separate"}
                              </SelectItem>
                              <SelectItem value="conditional">
                                {isRTL ? "מותנה" : "Conditional"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveRelation(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-gray-500">
                {isRTL 
                  ? "לא הוגדרו יחסי רופא-ספק. הוסף יחס חדש באמצעות הטופס למעלה."
                  : "No doctor-provider relationships defined. Add a new relationship using the form above."
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}