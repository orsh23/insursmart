
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequestForCommitment } from "@/api/entities";
import { Claim } from "@/api/entities";
import { Provider } from "@/api/entities";
import SearchFilterBar from "../common/SearchFilterBar";
import DataTable from "../common/DataTable";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import { format } from "date-fns";
import { translations } from "@/components/common/translations";

export default function ApprovalsTab({ language = "en" }) {
  const [requests, setRequests] = useState([]);
  const [claims, setClaims] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    provider: "all",
    type: "all",
    status: "all",
    dateRange: "all",
    search: ""
  });

  const isRTL = language === "he";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsData, claimsData, providersData] = await Promise.all([
        RequestForCommitment.list(),
        Claim.list(),
        Provider.list()
      ]);
      setRequests(requestsData || []);
      setClaims(claimsData || []);
      setProviders(providersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setRequests([]);
      setClaims([]);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const getProviderName = (providerName) => {
    if (!isRTL) return providerName;
    return translations.provider_names[providerName] || providerName;
  };
  
  const getPatientName = (patientName) => {
    if (!isRTL) return patientName;
    return translations.patient_names[patientName] || patientName;
  };
  
  const getStatusLabel = (status) => {
    if (!isRTL) return status;
    return translations.claim_statuses[status] || 
           translations.request_statuses[status] || status;
  };

  // Combine and format RFC and Claims data
  const approvals = [
    ...(requests || []).map(req => ({
      ...req,
      type: 'rfc',
      amount: req.approval_amount,
      approved_at: req.approved_at,
      reviewer_id: req.reviewer_id,
      provider_name: isRTL ? req.provider_name_he : req.provider_name_en,
      provider: isRTL ? req.provider_name_he : req.provider_name_en,
      insured: isRTL ? req.insured_name : req.insured_name,
      status: req.status
    })),
    ...(claims || []).map(claim => ({
      ...claim,
      type: 'claim',
      amount: claim.approved_amount,
      approved_at: claim.approved_at,
      reviewer_id: claim.reviewer_id,
      provider_name: isRTL ? claim.provider_name_he : claim.provider_name_en,
      provider: isRTL ? claim.provider_name_he : claim.provider_name_en,
      insured: isRTL ? claim.insured_name : claim.insured_name,
      status: claim.status
    }))
  ].sort((a, b) => {
    // Sort by approved_at date, most recent first
    const dateA = a.approved_at ? new Date(a.approved_at) : new Date(0);
    const dateB = b.approved_at ? new Date(b.approved_at) : new Date(0);
    return dateB - dateA;
  });

  const getStatusBadgeVariant = (status, type) => {
    if (type === 'rfc') {
      switch (status) {
        case "approved": return "success";
        case "rejected": return "destructive";
        case "reviewed": return "warning";
        default: return "secondary";
      }
    } else {
      switch (status) {
        case "approved": return "success";
        case "partially_approved": return "warning";
        case "rejected": return "destructive";
        default: return "secondary";
      }
    }
  };

  const getStatusDisplay = (status, type) => {
    if (type === 'rfc') {
      const statusMap = {
        approved: isRTL ? "אושר" : "Approved",
        rejected: isRTL ? "נדחה" : "Rejected",
        reviewed: isRTL ? "נבדק" : "Reviewed"
      };
      return statusMap[status] || status;
    } else {
      const statusMap = {
        approved: isRTL ? "אושר" : "Approved",
        partially_approved: isRTL ? "אושר חלקית" : "Partially Approved",
        rejected: isRTL ? "נדחה" : "Rejected"
      };
      return statusMap[status] || status;
    }
  };

  const columns = [
    {
      accessorKey: "type",
      header: isRTL ? "סוג" : "Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.type === 'rfc' 
            ? (isRTL ? "התחייבות" : "RFC")
            : (isRTL ? "תביעה" : "Claim")
          }
        </Badge>
      )
    },
    {
      accessorKey: "provider",
      header: isRTL ? "ספק" : "Provider",
      cell: ({ row }) => (
        <div className="font-medium">
          {getProviderName(row.original.provider)}
        </div>
      )
    },
    {
      accessorKey: "insured",
      header: isRTL ? "מבוטח" : "Insured",
      cell: ({ row }) => (
        <div>
          {getPatientName(row.original.insured) || "-"}
          <div className="text-sm text-gray-500">
            {row.original.policy_number || "-"}
          </div>
        </div>
      )
    },
    {
      accessorKey: "codes",
      header: isRTL ? "קודים" : "Codes",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.procedure_codes || []).map((code, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {code}
            </Badge>
          ))}
        </div>
      )
    },
    {
      accessorKey: "amount",
      header: isRTL ? "סכום מאושר" : "Approved Amount",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.amount 
            ? `${parseFloat(row.original.amount).toLocaleString()} ${row.original.currency}`
            : "-"
          }
        </div>
      )
    },
    {
      accessorKey: "approved_at",
      header: isRTL ? "תאריך אישור" : "Approved Date",
      cell: ({ row }) => (
        <div>
          {row.original.approved_at 
            ? format(new Date(row.original.approved_at), "dd/MM/yyyy")
            : "-"
          }
        </div>
      )
    },
    {
      accessorKey: "status",
      header: isRTL ? "סטטוס" : "Status",
      cell: ({ row }) => (
        <Badge variant={getStatusBadgeVariant(row.original.status, row.original.type)}>
          {getStatusDisplay(row.original.status, row.original.type)}
        </Badge>
      )
    }
  ];

  // Filter approvals based on current filters
  const filteredApprovals = approvals.filter(approval => {
    if (!approval) return false;

    if (filters.provider !== "all" && approval.provider_id !== filters.provider) {
      return false;
    }

    if (filters.type !== "all" && approval.type !== filters.type) {
      return false;
    }

    if (filters.status !== "all") {
      if (filters.status === "approved" && 
          !["approved", "partially_approved"].includes(approval.status)) {
        return false;
      }
      if (filters.status === "rejected" && approval.status !== "rejected") {
        return false;
      }
    }

    if (filters.dateRange !== "all" && approval.approved_at) {
      const approvalDate = new Date(approval.approved_at);
      const now = new Date();
      
      switch (filters.dateRange) {
        case "today":
          if (format(approvalDate, "yyyy-MM-dd") !== format(now, "yyyy-MM-dd")) {
            return false;
          }
          break;
        case "week":
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          if (approvalDate < weekAgo) {
            return false;
          }
          break;
        case "month":
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          if (approvalDate < monthAgo) {
            return false;
          }
          break;
      }
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        (approval.provider_name || "").toLowerCase().includes(searchLower) ||
        (approval.insured_name || "").toLowerCase().includes(searchLower) ||
        (approval.policy_number || "").toLowerCase().includes(searchLower) ||
        (approval.procedure_codes || []).some(code => 
          code.toLowerCase().includes(searchLower)
        )
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
          <option value="all">{isRTL ? "כל הספקים" : "All Providers"}</option>
          {providers.map(provider => (
            <option key={provider.id} value={provider.id}>
              {isRTL ? provider.provider_name_he : provider.provider_name_en}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {isRTL ? "סוג" : "Type"}
        </label>
        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({...prev, type: e.target.value}))}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">{isRTL ? "הכל" : "All"}</option>
          <option value="rfc">{isRTL ? "התחייבויות" : "RFCs"}</option>
          <option value="claim">{isRTL ? "תביעות" : "Claims"}</option>
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
          <option value="approved">{isRTL ? "אושר" : "Approved"}</option>
          <option value="rejected">{isRTL ? "נדחה" : "Rejected"}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {isRTL ? "טווח תאריכים" : "Date Range"}
        </label>
        <select
          value={filters.dateRange}
          onChange={(e) => setFilters(prev => ({...prev, dateRange: e.target.value}))}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">{isRTL ? "הכל" : "All Time"}</option>
          <option value="today">{isRTL ? "היום" : "Today"}</option>
          <option value="week">{isRTL ? "שבוע אחרון" : "Last Week"}</option>
          <option value="month">{isRTL ? "חודש אחרון" : "Last Month"}</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {isRTL ? "אישורים" : "Approvals"}
        </h2>
      </div>

      <SearchFilterBar
        onSearch={(query) => setFilters(prev => ({...prev, search: query}))}
        filterContent={filterContent}
        onReset={() => setFilters({
          provider: "all",
          type: "all",
          status: "all",
          dateRange: "all",
          search: ""
        })}
        searchPlaceholder={isRTL ? "חיפוש לפי ספק, מבוטח..." : "Search by provider, insured..."}
        language={language}
      />

      {loading ? (
        <LoadingSpinner />
      ) : filteredApprovals.length === 0 ? (
        <EmptyState
          title={isRTL ? "אין אישורים להצגה" : "No approvals to display"}
          description={isRTL 
            ? "לא נמצאו אישורים שתואמים את החיפוש" 
            : "No approvals match your search criteria"}
          icon="file"
          language={language}
        />
      ) : (
        <DataTable
          data={filteredApprovals}
          columns={columns}
          language={language}
        />
      )}
    </div>
  );
}
