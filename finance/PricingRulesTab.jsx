
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { TariffProfile } from "@/api/entities";
import { Provider } from "@/api/entities";
import SearchFilterBar from "../common/SearchFilterBar";
import DataTable from "../common/DataTable";
import PricingRuleDialog from "./PricingRuleDialog";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import { translations } from "@/components/common/translations";

export default function PricingRulesTab({ language = "en" }) {
  const [profiles, setProfiles] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [filters, setFilters] = useState({
    provider: "all",
    status: "all",
    search: ""
  });

  const isRTL = language === "he";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profilesData, providersData] = await Promise.all([
        TariffProfile.list(),
        Provider.list()
      ]);
      setProfiles(profilesData || []);
      setProviders(providersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setProfiles([]);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = () => {
    setSelectedProfile(null);
    setDialogOpen(true);
  };

  const handleEditProfile = (profile) => {
    setSelectedProfile(profile);
    setDialogOpen(true);
  };

  const handleSubmit = async (profileData) => {
    try {
      if (selectedProfile) {
        await TariffProfile.update(selectedProfile.id, profileData);
        setProfiles(prevProfiles => 
          prevProfiles.map(profile => 
            profile.id === selectedProfile.id ? { ...profile, ...profileData } : profile
          )
        );
      } else {
        const newProfile = await TariffProfile.create(profileData);
        setProfiles(prevProfiles => [...prevProfiles, newProfile]);
      }
      setDialogOpen(false);
      setSelectedProfile(null);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const getDescriptionLabel = (description) => {
    if (!isRTL) return description;
    return translations.price_rule_descriptions[description] || description;
  };

  const columns = [
    {
      accessorKey: "name",
      header: isRTL ? "שם" : "Name",
      cell: ({ row }) => row.original.name
    },
    {
      accessorKey: "description",
      header: isRTL ? "תיאור" : "Description",
      cell: ({ row }) => getDescriptionLabel(row.original.description)
    },
    {
      accessorKey: "provider",
      header: isRTL ? "ספק" : "Provider",
      cell: ({ row }) => {
        const provider = providers.find(p => p.id === row.original.provider_id);
        return (
          <div>
            {row.original.is_global ? (
              <Badge variant="secondary">
                {isRTL ? "גלובלי" : "Global"}
              </Badge>
            ) : (
              provider ? (
                isRTL ? provider.provider_name_he : provider.provider_name_en
              ) : "-"
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "coverage",
      header: isRTL ? "כיסוי" : "Coverage",
      cell: ({ row }) => {
        const coverageItems = [];
        if (row.original.includes_doctor_fee) coverageItems.push(isRTL ? "רופא" : "Doctor");
        if (row.original.includes_hospitalization) coverageItems.push(isRTL ? "אשפוז" : "Hospital");
        if (row.original.includes_drugs) coverageItems.push(isRTL ? "תרופות" : "Drugs");
        if (row.original.includes_implantables) coverageItems.push(isRTL ? "שתלים" : "Implants");
        
        return (
          <div className="flex flex-wrap gap-1">
            {coverageItems.map((item, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        );
      }
    },
    {
      accessorKey: "discount",
      header: isRTL ? "הנחה" : "Discount",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.discount_percentage}%
        </div>
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

  const filteredProfiles = profiles.filter(profile => {
    if (!profile) return false;

    if (filters.provider !== "all") {
      if (filters.provider === "global" && !profile.is_global) return false;
      if (filters.provider !== "global" && profile.provider_id !== filters.provider) return false;
    }

    if (filters.status !== "all") {
      if (filters.status === "active" && !profile.is_active) return false;
      if (filters.status === "inactive" && profile.is_active) return false;
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        profile.name.toLowerCase().includes(searchLower) ||
        (profile.description || "").toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const filterContent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          {isRTL ? "ספק" : "Provider"}
        </label>
        <select
          value={filters.provider}
          onChange={(e) => setFilters(prev => ({...prev, provider: e.target.value}))}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">{isRTL ? "הכל" : "All"}</option>
          <option value="global">{isRTL ? "גלובלי" : "Global"}</option>
          {providers.map(provider => (
            <option key={provider.id} value={provider.id}>
              {isRTL ? provider.provider_name_he : provider.provider_name_en}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {isRTL ? "סטטוס" : "Status"}
        </label>
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">{isRTL ? "הכל" : "All"}</option>
          <option value="active">{isRTL ? "פעיל" : "Active"}</option>
          <option value="inactive">{isRTL ? "לא פעיל" : "Inactive"}</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {isRTL ? "כללי תמחור" : "Pricing Rules"}
        </h2>
        <Button onClick={handleCreateProfile}>
          <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {isRTL ? "כלל חדש" : "New Rule"}
        </Button>
      </div>

      <SearchFilterBar
        onSearch={(query) => setFilters(prev => ({...prev, search: query}))}
        filterContent={filterContent}
        onReset={() => setFilters({
          provider: "all",
          status: "all",
          search: ""
        })}
        searchPlaceholder={isRTL ? "חיפוש לפי שם, תיאור..." : "Search by name, description..."}
        language={language}
      />

      {loading ? (
        <LoadingSpinner />
      ) : filteredProfiles.length === 0 ? (
        <EmptyState
          title={isRTL ? "אין כללי תמחור" : "No pricing rules"}
          description={isRTL 
            ? "לא נמצאו כללי תמחור שתואמים את החיפוש" 
            : "No pricing rules match your search"}
          icon="file"
          language={language}
          action={handleCreateProfile}
          actionText={isRTL ? "צור כלל חדש" : "Create New Rule"}
        />
      ) : (
        <DataTable
          data={filteredProfiles}
          columns={columns}
          onRowClick={handleEditProfile}
          language={language}
        />
      )}

      {dialogOpen && (
        <PricingRuleDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          profile={selectedProfile}
          providers={providers}
          onSubmit={handleSubmit}
          language={language}
        />
      )}
    </div>
  );
}
