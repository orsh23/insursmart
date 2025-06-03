import React, { useState, useEffect } from "react";
import { Doctor } from "@/api/entities";
import { Provider } from "@/api/entities";
import { Search, Filter, RefreshCcw, X, Link as LinkIcon, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "../common/LoadingSpinner";
import SmartFilter from "../common/SmartFilter";
import EmptyState from "../common/EmptyState";

export default function DoctorProviderMatrixTab({ language = "en" }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [providers, setProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    specialty: "all",
    provider: "all"
  });
  const [linkMode, setLinkMode] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedProviderIds, setSelectedProviderIds] = useState([]);

  const isRTL = language === "he";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [doctorsData, providersData] = await Promise.all([
        Doctor.list(),
        Provider.list()
      ]);
      setDoctors(doctorsData || []);
      setProviders(providersData || []);
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

  const handleDoctorClick = (doctor) => {
    if (linkMode) {
      setSelectedDoctor(doctor);
      setSelectedProviderIds(doctor.affiliated_providers || []);
    }
  };

  const toggleProviderLink = (providerId) => {
    if (!selectedDoctor) return;
    
    if (selectedProviderIds.includes(providerId)) {
      setSelectedProviderIds(selectedProviderIds.filter(id => id !== providerId));
    } else {
      setSelectedProviderIds([...selectedProviderIds, providerId]);
    }
  };

  const saveLinks = async () => {
    if (!selectedDoctor) return;
    
    try {
      await Doctor.update(selectedDoctor.id, {
        ...selectedDoctor,
        affiliated_providers: selectedProviderIds
      });
      
      // Update local state
      setDoctors(doctors.map(doc => 
        doc.id === selectedDoctor.id 
          ? { ...doc, affiliated_providers: selectedProviderIds }
          : doc
      ));
      
      toast({
        title: isRTL ? "קישורים נשמרו בהצלחה" : "Links saved successfully"
      });
      
      // Exit link mode
      cancelLinkMode();
    } catch (error) {
      toast({
        variant: "destructive",
        title: isRTL ? "שגיאה בשמירת קישורים" : "Error saving links",
        description: error.message
      });
    }
  };

  const cancelLinkMode = () => {
    setLinkMode(false);
    setSelectedDoctor(null);
    setSelectedProviderIds([]);
  };

  // Get unique specialties for filtering
  const uniqueSpecialties = [...new Set(
    doctors.flatMap(d => d.specialties || []).filter(Boolean)
  )];

  // Filter doctors by search and filters
  const filteredDoctors = doctors.filter(doctor => {
    const matchesQuery = !searchQuery || 
      (doctor.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.license_number || "").includes(searchQuery);
    
    const matchesSpecialty = filters.specialty === "all" || 
      (doctor.specialties || []).includes(filters.specialty);
    
    const matchesProvider = filters.provider === "all" || 
      (doctor.affiliated_providers || []).includes(filters.provider);
    
    return matchesQuery && matchesSpecialty && matchesProvider;
  });

  // Filter providers by search
  const filteredProviders = providers.filter(provider => {
    if (!searchQuery) return true;
    
    return (
      (provider.provider_name_en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (provider.provider_name_he || "").includes(searchQuery) ||
      (provider.provider_type || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {isRTL ? "שיוך רופאים לספקים" : "Doctor-Provider Matrix"}
        </h2>
        
        <div className="flex items-center gap-2">
          {!linkMode ? (
            <Button onClick={() => setLinkMode(true)}>
              <LinkIcon className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {isRTL ? "מצב קישור" : "Link Mode"}
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={cancelLinkMode}
              >
                <X className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {isRTL ? "ביטול" : "Cancel"}
              </Button>
              
              <Button
                onClick={saveLinks}
                disabled={!selectedDoctor}
              >
                <LinkIcon className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {isRTL ? "שמור קישורים" : "Save Links"}
              </Button>
            </>
          )}
          
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search and filters */}
        <div className="lg:w-1/3 space-y-4">
          <div className="relative">
            <Input
              placeholder={isRTL ? "חיפוש רופאים וספקים..." : "Search doctors and providers..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 rtl:pl-4 rtl:pr-8"
            />
            <Search className="absolute left-2 rtl:left-auto rtl:right-2 top-2.5 h-4 w-4 text-gray-500" />
          </div>
          
          <Card className="p-4 space-y-4">
            <h3 className="font-medium">
              {isRTL ? "סינון" : "Filters"}
            </h3>
            
            <SmartFilter
              label="Specialty"
              labelHe="התמחות"
              options={uniqueSpecialties.map(specialty => ({
                value: specialty,
                label: specialty,
                labelHe: specialty
              }))}
              value={filters.specialty}
              onChange={(value) => setFilters({...filters, specialty: value})}
              language={language}
            />
            
            <SmartFilter
              label="Provider"
              labelHe="ספק"
              options={providers.map(provider => ({
                value: provider.id,
                label: isRTL ? provider.provider_name_he : provider.provider_name_en,
                labelHe: provider.provider_name_he
              }))}
              value={filters.provider}
              onChange={(value) => setFilters({...filters, provider: value})}
              language={language}
            />
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearchQuery("");
                setFilters({
                  specialty: "all",
                  provider: "all"
                });
              }}
            >
              {isRTL ? "נקה סינון" : "Clear Filters"}
            </Button>
          </Card>
          
          {linkMode && selectedDoctor && (
            <Card className="p-4">
              <h3 className="font-medium mb-2">
                {isRTL ? "רופא נבחר" : "Selected Doctor"}
              </h3>
              <div className="font-medium">{selectedDoctor.full_name}</div>
              <div className="text-sm text-gray-500 mb-2">{selectedDoctor.license_number}</div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {(selectedDoctor.specialties || []).map((specialty, index) => (
                  <Badge key={index} variant="outline">
                    {specialty}
                  </Badge>
                ))}
              </div>
              
              <div className="text-sm">
                {isRTL 
                  ? `${selectedProviderIds.length} ספקים מקושרים` 
                  : `${selectedProviderIds.length} linked providers`
                }
              </div>
            </Card>
          )}
        </div>
        
        {/* Main content area */}
        <div className="flex-1">
          {loading ? (
            <Card className="p-8 flex justify-center">
              <LoadingSpinner size="large" />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Doctors column */}
              <div>
                <h3 className="font-medium mb-2">
                  {isRTL ? "רופאים" : "Doctors"}
                  {filteredDoctors.length > 0 && 
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({filteredDoctors.length})
                    </span>
                  }
                </h3>
                
                {filteredDoctors.length === 0 ? (
                  <Card className="p-4 text-center text-gray-500 text-sm">
                    {isRTL 
                      ? "לא נמצאו רופאים התואמים את החיפוש"
                      : "No doctors match your search"
                    }
                  </Card>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    {filteredDoctors.map(doctor => (
                      <Card 
                        key={doctor.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          linkMode && selectedDoctor?.id === doctor.id
                            ? "border-blue-500 bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleDoctorClick(doctor)}
                      >
                        <div className="font-medium">{doctor.full_name}</div>
                        <div className="text-sm text-gray-500">{doctor.license_number}</div>
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(doctor.specialties || []).slice(0, 2).map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {(doctor.specialties || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(doctor.specialties || []).length - 2}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2">
                          {isRTL ? "מקושר ל: " : "Linked to: "}
                          {(doctor.affiliated_providers || []).length > 0 
                            ? providers
                                .filter(p => (doctor.affiliated_providers || []).includes(p.id))
                                .slice(0, 2)
                                .map(p => isRTL ? p.provider_name_he : p.provider_name_en)
                                .join(", ")
                            : isRTL ? "אין" : "None"
                          }
                          {(doctor.affiliated_providers || []).length > 2 && 
                            ` +${(doctor.affiliated_providers || []).length - 2}`
                          }
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Providers column */}
              <div>
                <h3 className="font-medium mb-2">
                  {isRTL ? "ספקים" : "Providers"}
                  {filteredProviders.length > 0 && 
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({filteredProviders.length})
                    </span>
                  }
                </h3>
                
                {!linkMode ? (
                  <Card className="p-8 text-center">
                    <EmptyState
                      title={isRTL ? "מצב צפייה בלבד" : "View-Only Mode"}
                      description={isRTL 
                        ? "עבור למצב קישור כדי לקשר רופאים לספקים" 
                        : "Switch to link mode to link doctors with providers"
                      }
                      icon={LinkIcon}
                      actions={
                        <Button onClick={() => setLinkMode(true)}>
                          {isRTL ? "עבור למצב קישור" : "Switch to Link Mode"}
                        </Button>
                      }
                    />
                  </Card>
                ) : !selectedDoctor ? (
                  <Card className="p-8 text-center">
                    <EmptyState
                      title={isRTL ? "בחר רופא" : "Select a Doctor"}
                      description={isRTL 
                        ? "בחר רופא מהרשימה כדי לקשר אותו לספקים" 
                        : "Select a doctor from the list to link them to providers"
                      }
                      icon={X}
                    />
                  </Card>
                ) : filteredProviders.length === 0 ? (
                  <Card className="p-4 text-center text-gray-500 text-sm">
                    {isRTL 
                      ? "לא נמצאו ספקים התואמים את החיפוש"
                      : "No providers match your search"
                    }
                  </Card>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    {filteredProviders.map(provider => {
                      const isLinked = selectedProviderIds.includes(provider.id);
                      
                      return (
                        <Card 
                          key={provider.id}
                          className={`p-3 cursor-pointer transition-colors ${
                            isLinked
                              ? "border-green-500 bg-green-50"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => toggleProviderLink(provider.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">
                                {isRTL ? provider.provider_name_he : provider.provider_name_en}
                              </div>
                              <div className="text-sm text-gray-500">
                                {provider.provider_type}
                              </div>
                            </div>
                            
                            {isLinked ? (
                              <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" />
                                {isRTL ? "מקושר" : "Linked"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500 flex items-center gap-1">
                                <Link2Off className="h-3 w-3" />
                                {isRTL ? "לא מקושר" : "Not Linked"}
                              </Badge>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}