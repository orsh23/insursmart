import React, { useState, useEffect } from "react";
import { Link, Grid, Plus, Edit, Trash } from "lucide-react";
import { Doctor } from "@/api/entities";
import { Provider } from "@/api/entities";
import { DoctorProviderLink } from "@/api/entities/DoctorProviderLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function DoctorProviderMatrix({ language = "en" }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [providers, setProviders] = useState([]);
  const [links, setLinks] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    doctor_id: "",
    provider_id: "",
    affiliation_type: "visiting",
    start_date: "",
    end_date: "",
    notes: ""
  });

  const isRTL = language === "he";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [doctorsData, providersData, linksData] = await Promise.all([
        Doctor.list(),
        Provider.list(),
        DoctorProviderLink.list()
      ]);
      setDoctors(doctorsData || []);
      setProviders(providersData || []);
      setLinks(linksData || []);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedLink) {
        await DoctorProviderLink.update(selectedLink.id, formData);
        toast({
          title: isRTL ? "קישור עודכן" : "Link updated",
          description: isRTL ? "הקישור עודכן בהצלחה" : "Link was successfully updated"
        });
      } else {
        await DoctorProviderLink.create(formData);
        toast({
          title: isRTL ? "קישור נוצר" : "Link created",
          description: isRTL ? "הקישור נוצר בהצלחה" : "Link was successfully created"
        });
      }
      setShowDialog(false);
      fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: isRTL ? "שגיאה בשמירת קישור" : "Error saving link",
        description: error.message
      });
    }
  };

  const columns = [
    {
      accessorKey: "doctor",
      header: isRTL ? "רופא" : "Doctor",
      cell: ({ row }) => {
        const doctor = doctors.find(d => d.id === row.original.doctor_id);
        return doctor?.full_name || row.original.doctor_id;
      }
    },
    {
      accessorKey: "provider",
      header: isRTL ? "ספק" : "Provider",
      cell: ({ row }) => {
        const provider = providers.find(p => p.id === row.original.provider_id);
        return isRTL ? provider?.name_he : provider?.name_en || row.original.provider_id;
      }
    },
    {
      accessorKey: "affiliation_type",
      header: isRTL ? "סוג שיוך" : "Affiliation Type",
      cell: ({ row }) => (
        <Badge>
          {isRTL 
            ? getAffiliationTypeHe(row.original.affiliation_type)
            : getAffiliationType(row.original.affiliation_type)
          }
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

  const getAffiliationType = (type) => {
    const types = {
      employed: "Employed",
      visiting: "Visiting",
      consulting: "Consulting",
      independent: "Independent"
    };
    return types[type] || type;
  };

  const getAffiliationTypeHe = (type) => {
    const types = {
      employed: "מועסק",
      visiting: "מבקר",
      consulting: "יועץ",
      independent: "עצמאי"
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {isRTL ? "שיוך רופאים לספקים" : "Doctor-Provider Affiliations"}
        </h2>
        <Button onClick={() => {
          setSelectedLink(null);
          setShowDialog(true);
        }}>
          <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {isRTL ? "הוסף שיוך" : "Add Affiliation"}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={links}
        loading={loading}
        language={language}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedLink 
                ? (isRTL ? "ערוך שיוך" : "Edit Affiliation")
                : (isRTL ? "שיוך חדש" : "New Affiliation")
              }
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "רופא" : "Doctor"}
                </label>
                <Select
                  value={formData.doctor_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, doctor_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "ספק" : "Provider"}
                </label>
                <Select
                  value={formData.provider_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, provider_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {isRTL ? provider.name_he : provider.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "סוג שיוך" : "Affiliation Type"}
                </label>
                <Select
                  value={formData.affiliation_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, affiliation_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">
                      {isRTL ? "מועסק" : "Employed"}
                    </SelectItem>
                    <SelectItem value="visiting">
                      {isRTL ? "מבקר" : "Visiting"}
                    </SelectItem>
                    <SelectItem value="consulting">
                      {isRTL ? "יועץ" : "Consulting"}
                    </SelectItem>
                    <SelectItem value="independent">
                      {isRTL ? "עצמאי" : "Independent"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "תאריך התחלה" : "Start Date"}
                </label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "תאריך סיום" : "End Date"}
                </label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? "הערות" : "Notes"}
                </label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">
                {selectedLink 
                  ? (isRTL ? "עדכן" : "Update")
                  : (isRTL ? "צור" : "Create")
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}