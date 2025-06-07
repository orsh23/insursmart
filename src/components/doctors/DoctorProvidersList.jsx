import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, Building2, Trash2, Edit, Check, X } from "lucide-react";
import LoadingSpinner from "../common/LoadingSpinner";
import { format } from "date-fns";

export default function DoctorProvidersList({
  providerLinks = [],
  providers = [],
  doctorId,
  onLinkProvider,
  onUnlinkProvider,
  onUpdateLink,
  language = "en",
  loading = false
}) {
  const isRTL = language === "he";
  const [showAddForm, setShowAddForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    doctor_id: doctorId,
    provider_id: "",
    affiliation_type: "visiting",
    start_date: new Date(),
    end_date: null,
    notes: "",
    is_active: true
  });

  // Get available providers (exclude already linked ones)
  const availableProviders = providers.filter(
    provider => !providerLinks.some(link => link.provider_id === provider.id)
  );

  const affiliationTypes = [
    { value: "employed", label: "Employed", labelHe: "מועסק" },
    { value: "visiting", label: "Visiting", labelHe: "מבקר" },
    { value: "consultant", label: "Consultant", labelHe: "יועץ" },
    { value: "resident", label: "Resident", labelHe: "מתמחה" },
    { value: "independent", label: "Independent", labelHe: "עצמאי" }
  ];

  const getAffiliationTypeLabel = (type) => {
    const found = affiliationTypes.find(item => item.value === type);
    return found ? (isRTL ? found.labelHe : found.label) : type;
  };

  const getProviderName = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return "-";
    return isRTL ? provider.provider_name_he : provider.provider_name_en;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const linkData = {
      ...formData,
      doctor_id: doctorId,
      start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
      end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null
    };
    
    const success = await onLinkProvider(linkData);
    if (success) {
      setShowAddForm(false);
      setFormData({
        doctor_id: doctorId,
        provider_id: "",
        affiliation_type: "visiting",
        start_date: new Date(),
        end_date: null,
        notes: "",
        is_active: true
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    const linkData = {
      ...editing.data,
      start_date: editing.data.start_date ? format(new Date(editing.data.start_date), 'yyyy-MM-dd') : null,
      end_date: editing.data.end_date ? format(new Date(editing.data.end_date), 'yyyy-MM-dd') : null
    };
    
    const success = await onUpdateLink(editing.id, linkData);
    if (success) {
      setEditing(null);
    }
  };

  const handleUnlink = async (linkId) => {
    if (window.confirm(isRTL ? "האם אתה בטוח שברצונך להסיר קישור זה?" : "Are you sure you want to remove this link?")) {
      await onUnlinkProvider(linkId);
    }
  };

  const startEditing = (link) => {
    setEditing({
      id: link.id,
      data: {
        ...link,
        start_date: link.start_date ? new Date(link.start_date) : null,
        end_date: link.end_date ? new Date(link.end_date) : null
      }
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {isRTL ? "ספקים משויכים" : "Affiliated Providers"}
        </h3>
        
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? "outline" : "default"}
          size="sm"
        >
          {showAddForm ? (
            <>
              <X className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {isRTL ? "ביטול" : "Cancel"}
            </>
          ) : (
            <>
              <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {isRTL ? "הוסף שיוך" : "Add Affiliation"}
            </>
          )}
        </Button>
      </div>
      
      {showAddForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Select
                  value={formData.provider_id}
                  onValueChange={(value) => 
                    setFormData({ ...formData, provider_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? "בחר ספק" : "Select provider"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders.length === 0 ? (
                      <div className="p-2 text-center text-gray-500">
                        {isRTL ? "אין ספקים זמינים לקישור" : "No available providers to link"}
                      </div>
                    ) : (
                      availableProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {isRTL ? provider.provider_name_he : provider.provider_name_en}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select
                  value={formData.affiliation_type}
                  onValueChange={(value) => 
                    setFormData({ ...formData, affiliation_type: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={isRTL ? "סוג שיוך" : "Affiliation type"} 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {affiliationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {isRTL ? type.labelHe : type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    {isRTL ? "תאריך התחלה" : "Start Date"}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date
                          ? format(formData.start_date, "PPP")
                          : isRTL ? "בחר תאריך" : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) =>
                          setFormData({ ...formData, start_date: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    {isRTL ? "תאריך סיום" : "End Date"}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_date
                          ? format(formData.end_date, "PPP")
                          : isRTL ? "בחר תאריך (אופציונלי)" : "Select date (optional)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={(date) =>
                          setFormData({ ...formData, end_date: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium">
                  {isRTL ? "הערות" : "Notes"}
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder={
                    isRTL ? "הערות נוספות..." : "Additional notes..."
                  }
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  {isRTL ? "ביטול" : "Cancel"}
                </Button>
                <Button type="submit" disabled={!formData.provider_id}>
                  {isRTL ? "שמור" : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      <div className="space-y-3">
        {providerLinks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isRTL
              ? "אין ספקים משויכים לרופא זה. הוסף קישור ספק כדי להתחיל."
              : "No affiliated providers yet. Add a provider link to get started."}
          </div>
        ) : (
          providerLinks.map((link) => (
            <div
              key={link.id}
              className={`p-4 border rounded-md ${
                editing?.id === link.id ? "border-blue-400 bg-blue-50" : ""
              }`}
            >
              {editing?.id === link.id ? (
                <form onSubmit={handleEditSubmit} className="space-y-3">
                  <Select
                    value={editing.data.affiliation_type}
                    onValueChange={(value) =>
                      setEditing({
                        ...editing,
                        data: { ...editing.data, affiliation_type: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {isRTL ? type.labelHe : type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editing.data.start_date
                            ? format(editing.data.start_date, "PPP")
                            : isRTL ? "תאריך התחלה" : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editing.data.start_date}
                          onSelect={(date) =>
                            setEditing({
                              ...editing,
                              data: { ...editing.data, start_date: date },
                            })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editing.data.end_date
                            ? format(editing.data.end_date, "PPP")
                            : isRTL
                            ? "תאריך סיום (אופציונלי)"
                            : "End date (optional)"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editing.data.end_date}
                          onSelect={(date) =>
                            setEditing({
                              ...editing,
                              data: { ...editing.data, end_date: date },
                            })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Textarea
                    value={editing.data.notes || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        data: { ...editing.data, notes: e.target.value },
                      })
                    }
                    placeholder={isRTL ? "הערות..." : "Notes..."}
                  />

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editing.data.is_active}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            data: {
                              ...editing.data,
                              is_active: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        {isRTL ? "פעיל" : "Active"}
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(null)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      {isRTL ? "ביטול" : "Cancel"}
                    </Button>
                    <Button type="submit" size="sm">
                      <Check className="h-4 w-4 mr-1" />
                      {isRTL ? "שמור" : "Save"}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-gray-500" />
                      <span className="font-medium">
                        {getProviderName(link.provider_id)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(link)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleUnlink(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>
                      {getAffiliationTypeLabel(link.affiliation_type)}
                    </Badge>
                    {!link.is_active && (
                      <Badge variant="secondary">
                        {isRTL ? "לא פעיל" : "Inactive"}
                      </Badge>
                    )}
                    {link.start_date && (
                      <Badge variant="outline" className="gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {format(new Date(link.start_date), "MMM yyyy")}
                      </Badge>
                    )}
                  </div>

                  {link.notes && (
                    <p className="mt-2 text-sm text-gray-600">{link.notes}</p>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}