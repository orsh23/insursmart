import React, { useState, useEffect } from "react";
import { Tariff } from "@/api/entities";
import { Provider } from "@/api/entities";
import { InternalCode } from "@/api/entities";
import { CodeCategory } from "@/api/entities";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function PriceComparison({ language = "en" }) {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [codes, setCodes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  
  const { toast } = useToast();
  const isRTL = language === "he";

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tariffs, selectedProvider, selectedCategory, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all required data in parallel
      const [providerData, tariffData, codeData, categoryData] = await Promise.all([
        Provider.list(),
        Tariff.list(),
        InternalCode.list(),
        CodeCategory.list()
      ]);
      
      setProviders(providerData);
      setTariffs(tariffData);
      setCodes(codeData);
      setCategories(categoryData);
      
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

  const applyFilters = () => {
    let results = [];
    
    // Group tariffs by internal code
    const tariffsByCode = tariffs.reduce((acc, tariff) => {
      if (!acc[tariff.internal_code]) {
        acc[tariff.internal_code] = [];
      }
      acc[tariff.internal_code].push(tariff);
      return acc;
    }, {});
    
    // Apply filters
    for (const [codeId, codeTariffs] of Object.entries(tariffsByCode)) {
      const code = codes.find(c => c.id === codeId || c.code_number === codeId);
      
      if (!code) continue;
      
      // Filter by search term
      if (searchTerm && 
          !code.code_number.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !code.description_en.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !code.description_he.includes(searchTerm)) {
        continue;
      }
      
      // Filter by category
      if (selectedCategory && code.category_id !== selectedCategory && code.category_path?.indexOf(selectedCategory) === -1) {
        continue;
      }
      
      // Filter by provider
      let filteredTariffs = codeTariffs;
      if (selectedProvider) {
        filteredTariffs = codeTariffs.filter(tariff => 
          tariff.provider_id === selectedProvider
        );
        
        if (filteredTariffs.length === 0) continue;
      }
      
      // Add to results
      results.push({
        code: code,
        tariffs: filteredTariffs
      });
    }
    
    setFilteredResults(results);
  };

  const formatCurrency = (amount, currency = "ILS") => {
    if (amount === undefined || amount === null) return "-";
    return `${amount.toLocaleString()} ${currency}`;
  };

  const getProviderName = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return providerId;
    return isRTL ? provider.provider_name_he : provider.provider_name_en;
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return "-";
    return isRTL ? category.name_he : category.name_en;
  };

  const getCategoryPathDisplay = (path) => {
    if (!path) return "-";
    const pathParts = path.split("/");
    const displayParts = pathParts.map(part => {
      const category = categories.find(c => c.name_en === part);
      return isRTL && category ? category.name_he : part;
    });
    return displayParts.join(" › ");
  };

  const handleExport = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Code,Description,Category,Provider,Base Price,Currency\n";
    
    // Add data rows
    for (const result of filteredResults) {
      const code = result.code;
      const codeNumber = code.code_number;
      const description = isRTL ? code.description_he : code.description_en;
      const categoryPath = getCategoryPathDisplay(code.category_path);
      
      for (const tariff of result.tariffs) {
        const providerName = getProviderName(tariff.provider_id);
        const basePrice = tariff.base_price;
        const currency = tariff.currency || "ILS";
        
        csvContent += `"${codeNumber}","${description}","${categoryPath}","${providerName}",${basePrice},"${currency}"\n`;
      }
    }
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "price_comparison.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {isRTL ? "השוואת מחירים" : "Price Comparison"}
        </h2>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          {isRTL ? "ייצוא לקובץ CSV" : "Export to CSV"}
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="w-64">
          <label className="block text-sm font-medium mb-1">
            {isRTL ? "ספק" : "Provider"}
          </label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger>
              <SelectValue placeholder={isRTL ? "כל הספקים" : "All Providers"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>
                {isRTL ? "כל הספקים" : "All Providers"}
              </SelectItem>
              {providers.map(provider => (
                <SelectItem key={provider.id} value={provider.id}>
                  {isRTL ? provider.provider_name_he : provider.provider_name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-64">
          <label className="block text-sm font-medium mb-1">
            {isRTL ? "קטגוריה" : "Category"}
          </label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder={isRTL ? "כל הקטגוריות" : "All Categories"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>
                {isRTL ? "כל הקטגוריות" : "All Categories"}
              </SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {getCategoryPathDisplay(category.path || category.name_en)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-64">
          <label className="block text-sm font-medium mb-1">
            {isRTL ? "חיפוש" : "Search"}
          </label>
          <div className="relative">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRTL ? "חיפוש לפי קוד או תיאור" : "Search by code or description"}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* Results Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isRTL ? "קוד" : "Code"}</TableHead>
              <TableHead>{isRTL ? "תיאור" : "Description"}</TableHead>
              <TableHead>{isRTL ? "קטגוריה" : "Category"}</TableHead>
              <TableHead>{isRTL ? "ספק" : "Provider"}</TableHead>
              <TableHead>{isRTL ? "מחיר בסיס" : "Base Price"}</TableHead>
              <TableHead>{isRTL ? "פירוט מחיר" : "Price Details"}</TableHead>
              <TableHead>{isRTL ? "חוזה" : "Contract"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {isRTL ? "טוען נתונים..." : "Loading data..."}
                </TableCell>
              </TableRow>
            ) : filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {isRTL ? "לא נמצאו תוצאות" : "No results found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredResults.flatMap(result => {
                const { code, tariffs } = result;
                
                // If no tariffs, show code with dash for price
                if (tariffs.length === 0) {
                  return [(
                    <TableRow key={code.id}>
                      <TableCell className="font-mono">{code.code_number}</TableCell>
                      <TableCell>
                        {isRTL ? code.description_he : code.description_en}
                      </TableCell>
                      <TableCell>
                        {getCategoryPathDisplay(code.category_path)}
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  )];
                }
                
                // Otherwise, show one row per tariff
                return tariffs.map(tariff => (
                  <TableRow key={`${code.id}-${tariff.id}`}>
                    <TableCell className="font-mono">{code.code_number}</TableCell>
                    <TableCell>
                      {isRTL ? code.description_he : code.description_en}
                    </TableCell>
                    <TableCell>
                      {getCategoryPathDisplay(code.category_path)}
                    </TableCell>
                    <TableCell>
                      {getProviderName(tariff.provider_id)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(tariff.base_price, tariff.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {tariff.price_components?.facility_fee && (
                          <div className="text-xs">
                            {isRTL ? "מתקן" : "Facility"}: {formatCurrency(tariff.price_components.facility_fee, tariff.currency)}
                          </div>
                        )}
                        {tariff.price_components?.doctor_fee && (
                          <div className="text-xs">
                            {isRTL ? "רופא" : "Doctor"}: {formatCurrency(tariff.price_components.doctor_fee, tariff.currency)}
                          </div>
                        )}
                        {tariff.price_components?.implant_fee && (
                          <div className="text-xs">
                            {isRTL ? "שתל" : "Implant"}: {formatCurrency(tariff.price_components.implant_fee, tariff.currency)}
                          </div>
                        )}
                        {tariff.price_components?.consumables_fee && (
                          <div className="text-xs">
                            {isRTL ? "מתכלים" : "Consumables"}: {formatCurrency(tariff.price_components.consumables_fee, tariff.currency)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tariff.contract_id ? (
                        <Badge variant="outline">
                          {isRTL ? "חוזה" : "Contract"} #{tariff.contract_id.substring(0, 8)}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                  </TableRow>
                ));
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}