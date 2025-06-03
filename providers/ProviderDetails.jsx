import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FormDialog from "../forms/FormDialog";
import BilingualInput from "../forms/BilingualInput";
import FormField from "../forms/FormField";
import BreadcrumbTrail from "../common/BreadcrumbTrail";
import DeleteConfirmDialog from "../common/DeleteConfirmDialog";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  User as UserIcon, 
  Calendar, 
  FileText, 
  Edit, 
  Trash2,
  Heart,
  Stethoscope
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ProviderDetails({ providerId, language, userRole, onBack, providerList }) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const { toast } = useToast();
  const isRTL = language === "he";

  // Get provider details
  useEffect(() => {
    const fetchProvider = async () => {
      try {
        setLoading(true);
        
        // Since we're using a static list for demo purposes, find the provider in the list
        const foundProvider = providerList.find(p => p.id === providerId);
        if (foundProvider) {
          setProvider(foundProvider);
          
          // Initialize form data for editing
          setFormData({
            provider_name_en: foundProvider.provider_name_en || "",
            provider_name_he: foundProvider.provider_name_he || "",
            provider_type: foundProvider.provider_type || "",
            address: foundProvider.address || "",
            city: foundProvider.city || "",
            city_he: foundProvider.city_he || "",
            phone: foundProvider.phone || "",
            email: foundProvider.email || "",
            website: foundProvider.website || "",
            contact_person: foundProvider.contact_person || "",
            contact_person_en: foundProvider.contact_person_en || "",
            contract_start_date: foundProvider.contract_start_date || "",
            contract_end_date: foundProvider.contract_end_date || "",
            is_active: foundProvider.is_active !== undefined ? foundProvider.is_active : true,
            notes: foundProvider.notes || ""
          });
        } else {
          toast({
            title: isRTL ? "שגיאה" : "Error",
            description: isRTL 
              ? `ספק עם מזהה ${providerId} לא נמצא` 
              : `Provider with ID ${providerId} not found`,
            variant: "destructive"
          });
          if (onBack) onBack();
        }
      } catch (error) {
        console.error("Error fetching provider:", error);
        toast({
          title: isRTL ? "שגיאה" : "Error",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProvider();
  }, [providerId, providerList, isRTL, toast, onBack]);

  const handleSave = async () => {
    try {
      // In a real app, this would call an API to update the provider
      toast({
        title: isRTL ? "נשמר בהצלחה" : "Saved Successfully",
        description: isRTL 
          ? "פרטי הספק עודכנו בהצלחה" 
          : "Provider details updated successfully",
      });
      
      setFormDialogOpen(false);
      
      // Update the provider in the state
      setProvider({
        ...provider,
        ...formData
      });
    } catch (error) {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    try {
      // In a real app, this would call an API to delete the provider
      toast({
        title: isRTL ? "נמחק בהצלחה" : "Deleted Successfully",
        description: isRTL 
          ? "הספק נמחק בהצלחה" 
          : "Provider deleted successfully",
      });
      
      setDeleteDialogOpen(false);
      if (onBack) onBack();
    } catch (error) {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="w-full max-w-md">
          <div className="space-y-2 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500">{isRTL ? "טוען נתונים..." : "Loading data..."}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">
          {isRTL ? "ספק לא נמצא" : "Provider not found"}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isRTL ? "חזרה לרשימה" : "Back to List"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <BreadcrumbTrail
            items={[
              { label: isRTL ? "ספקים" : "Providers", onClick: onBack },
              { label: isRTL ? provider.provider_name_he : provider.provider_name_en }
            ]}
            language={language}
          />
          <div className="flex items-center mt-2">
            <Building2 className="h-5 w-5 text-gray-400 mr-2" />
            <h1 className="text-2xl font-bold">
              {isRTL ? provider.provider_name_he : provider.provider_name_en}
            </h1>
          </div>
        </div>
        
        {userRole !== "viewer" && (
          <div className="flex space-x-2 rtl:space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setFormDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isRTL ? "ערוך" : "Edit"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isRTL ? "מחק" : "Delete"}
            </Button>
          </div>
        )}
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="details">
            {isRTL ? "פרטי ספק" : "Provider Details"}
          </TabsTrigger>
          <TabsTrigger value="doctors">
            {isRTL ? "רופאים" : "Doctors"}
          </TabsTrigger>
          <TabsTrigger value="contracts">
            {isRTL ? "חוזים" : "Contracts"}
          </TabsTrigger>
          <TabsTrigger value="procedures">
            {isRTL ? "פרוצדורות" : "Procedures"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isRTL ? "מידע בסיסי" : "Basic Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {isRTL ? "שם ספק" : "Provider Name"}
                  </div>
                  <div className="mt-1">
                    <div>{isRTL ? provider.provider_name_he : provider.provider_name_en}</div>
                    <div className="text-sm text-gray-500">
                      {isRTL ? provider.provider_name_en : provider.provider_name_he}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {isRTL ? "סוג ספק" : "Provider Type"}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {isRTL ? provider.provider_type_he : provider.provider_type}
                  </Badge>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {isRTL ? "סטטוס" : "Status"}
                  </div>
                  <Badge 
                    variant={provider.is_active ? "success" : "secondary"}
                    className="mt-1"
                  >
                    {provider.is_active 
                      ? (isRTL ? "פעיל" : "Active")
                      : (isRTL ? "לא פעיל" : "Inactive")}
                  </Badge>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {isRTL ? "הערות" : "Notes"}
                  </div>
                  <div className="mt-1 text-sm">
                    {provider.notes || (isRTL ? "אין הערות" : "No notes")}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {isRTL ? "פרטי קשר" : "Contact Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {isRTL ? "כתובת" : "Address"}
                  </div>
                  <div className="mt-1 flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <div>{provider.address}</div>
                      <div className="text-sm">
                        {isRTL ? provider.city_he : provider.city}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {isRTL ? "טלפון" : "Phone"}
                  </div>
                  <div className="mt-1 flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <a href={`tel:${provider.phone}`} className="hover:underline">
                      {provider.phone}
                    </a>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {isRTL ? "דוא״ל" : "Email"}
                  </div>
                  <div className="mt-1 flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <a href={`mailto:${provider.email}`} className="hover:underline">
                      {provider.email}
                    </a>
                  </div>
                </div>

                {provider.website && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      {isRTL ? "אתר אינטרנט" : "Website"}
                    </div>
                    <div className="mt-1 flex items-center">
                      <Globe className="h-4 w-4 text-gray-400 mr-2" />
                      <a 
                        href={provider.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {provider.website}
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {isRTL ? "איש קשר" : "Contact Person"}
                  </div>
                  <div className="mt-1 flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div>{isRTL ? provider.contact_person : provider.contact_person_en}</div>
                      {(provider.contact_person && provider.contact_person_en) && (
                        <div className="text-sm text-gray-500">
                          {isRTL ? provider.contact_person_en : provider.contact_person}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {isRTL ? "פרטי חוזה" : "Contract Details"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {isRTL ? "תאריך התחלה" : "Start Date"}
                  </div>
                  <div className="mt-1 flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    {provider.contract_start_date ? (
                      new Date(provider.contract_start_date).toLocaleDateString(
                        isRTL ? "he-IL" : "en-US"
                      )
                    ) : (
                      <span className="text-gray-500">
                        {isRTL ? "לא הוגדר" : "Not set"}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {isRTL ? "תאריך סיום" : "End Date"}
                  </div>
                  <div className="mt-1 flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    {provider.contract_end_date ? (
                      new Date(provider.contract_end_date).toLocaleDateString(
                        isRTL ? "he-IL" : "en-US"
                      )
                    ) : (
                      <span className="text-gray-500">
                        {isRTL ? "לא הוגדר" : "Not set"}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {isRTL ? "מסמכים" : "Documents"}
                  </div>
                  <div className="mt-1">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      {isRTL ? "צפה בחוזה" : "View Contract"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {isRTL ? "סטטיסטיקה" : "Statistics"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Stethoscope className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                    <div className="text-2xl font-bold">15</div>
                    <div className="text-sm text-gray-500">
                      {isRTL ? "רופאים" : "Doctors"}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Heart className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                    <div className="text-2xl font-bold">124</div>
                    <div className="text-sm text-gray-500">
                      {isRTL ? "פרוצדורות" : "Procedures"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="doctors">
          <Card>
            <CardHeader>
              <CardTitle>
                {isRTL ? "רופאים מקושרים" : "Associated Doctors"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-4">
                {isRTL 
                  ? "אין רופאים מקושרים לספק זה כרגע" 
                  : "No doctors associated with this provider yet"}
              </p>
              {userRole !== "viewer" && (
                <div className="flex justify-center mt-4">
                  <Button>
                    <Stethoscope className="h-4 w-4 mr-2" />
                    {isRTL ? "קשר רופא לספק" : "Associate Doctor"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>
                {isRTL ? "חוזים" : "Contracts"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-4">
                {isRTL 
                  ? "אין חוזים לספק זה כרגע" 
                  : "No contracts for this provider yet"}
              </p>
              {userRole !== "viewer" && (
                <div className="flex justify-center mt-4">
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    {isRTL ? "הוסף חוזה חדש" : "Add New Contract"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="procedures">
          <Card>
            <CardHeader>
              <CardTitle>
                {isRTL ? "פרוצדורות" : "Procedures"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-4">
                {isRTL 
                  ? "אין פרוצדורות לספק זה כרגע" 
                  : "No procedures for this provider yet"}
              </p>
              {userRole !== "viewer" && (
                <div className="flex justify-center mt-4">
                  <Button>
                    <Heart className="h-4 w-4 mr-2" />
                    {isRTL ? "הוסף פרוצדורה חדשה" : "Add New Procedure"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        title={isRTL ? "ערוך ספק" : "Edit Provider"}
        onSubmit={handleSave}
        language={language}
      >
        <div className="space-y-4">
          <BilingualInput
            labelEn="Provider Name"
            labelHe="שם ספק"
            valueEn={formData.provider_name_en}
            valueHe={formData.provider_name_he}
            onChangeEn={(e) => setFormData({ ...formData, provider_name_en: e.target.value })}
            onChangeHe={(e) => setFormData({ ...formData, provider_name_he: e.target.value })}
            required={true}
            language={language}
          />
          
          <FormField
            id="provider_type"
            label="Provider Type"
            labelHe="סוג ספק"
            type="select"
            value={formData.provider_type}
            onChange={(value) => setFormData({ ...formData, provider_type: value })}
            options={[
              { value: "Hospital", label: "Hospital", labelHe: "בית חולים" },
              { value: "Clinic", label: "Clinic", labelHe: "מרפאה" },
              { value: "Laboratory", label: "Laboratory", labelHe: "מעבדה" },
              { value: "Imaging", label: "Imaging Center", labelHe: "מכון הדמיה" },
              { value: "Other", label: "Other", labelHe: "אחר" }
            ]}
            required={true}
            language={language}
          />
          
          <FormField
            id="address"
            label="Address"
            labelHe="כתובת"
            type="text"
            value={formData.address}
            onChange={(value) => setFormData({ ...formData, address: value })}
            language={language}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="city"
              label="City"
              labelHe="עיר"
              type="text"
              value={formData.city}
              onChange={(value) => setFormData({ ...formData, city: value })}
              language={language}
            />
            
            <FormField
              id="city_he"
              label="City (Hebrew)"
              labelHe="עיר (בעברית)"
              type="text"
              value={formData.city_he}
              onChange={(value) => setFormData({ ...formData, city_he: value })}
              language={language}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="phone"
              label="Phone"
              labelHe="טלפון"
              type="text"
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              language={language}
            />
            
            <FormField
              id="email"
              label="Email"
              labelHe="דוא״ל"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              language={language}
            />
          </div>
          
          <FormField
            id="website"
            label="Website"
            labelHe="אתר אינטרנט"
            type="text"
            value={formData.website}
            onChange={(value) => setFormData({ ...formData, website: value })}
            language={language}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="contact_person"
              label="Contact Person (Hebrew)"
              labelHe="איש קשר (בעברית)"
              type="text"
              value={formData.contact_person}
              onChange={(value) => setFormData({ ...formData, contact_person: value })}
              language={language}
            />
            
            <FormField
              id="contact_person_en"
              label="Contact Person (English)"
              labelHe="איש קשר (באנגלית)"
              type="text"
              value={formData.contact_person_en}
              onChange={(value) => setFormData({ ...formData, contact_person_en: value })}
              language={language}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="contract_start_date"
              label="Contract Start Date"
              labelHe="תאריך התחלת חוזה"
              type="date"
              value={formData.contract_start_date}
              onChange={(value) => setFormData({ ...formData, contract_start_date: value })}
              language={language}
            />
            
            <FormField
              id="contract_end_date"
              label="Contract End Date"
              labelHe="תאריך סיום חוזה"
              type="date"
              value={formData.contract_end_date}
              onChange={(value) => setFormData({ ...formData, contract_end_date: value })}
              language={language}
            />
          </div>
          
          <FormField
            id="is_active"
            label="Active"
            labelHe="פעיל"
            type="switch"
            value={formData.is_active}
            onChange={(value) => setFormData({ ...formData, is_active: value })}
            language={language}
          />
          
          <FormField
            id="notes"
            label="Notes"
            labelHe="הערות"
            type="textarea"
            value={formData.notes}
            onChange={(value) => setFormData({ ...formData, notes: value })}
            language={language}
          />
        </div>
      </FormDialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title={isRTL ? "מחיקת ספק" : "Delete Provider"}
        description={
          isRTL
            ? `האם אתה בטוח שברצונך למחוק את הספק "${provider.provider_name_he}"?`
            : `Are you sure you want to delete the provider "${provider.provider_name_en}"?`
        }
        language={language}
      />
    </div>
  );
}