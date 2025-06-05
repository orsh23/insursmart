import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/components/context/LanguageContext';
import { Contract } from '@/api/entities';
import { formatDateTime, matchesDateRange } from '@/components/utils/date-utils';
import { DatePicker } from '@/components/ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Calendar, RefreshCcw } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { extendContractWithHistory } from '../mock/contract-history';

// Extend the Contract entity with mock history methods
extendContractWithHistory(Contract);

export default function HistoryTab() {
  const { t, isRTL } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the getHistory method (which is provided by our mock)
        const historyData = await Contract.getHistory();
        setHistory(historyData);
      } catch (err) {
        console.error("Error fetching contract history:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, []);
  
  // Filter history items based on search query and date range
  const filteredHistory = history.filter(item => {
    // Filter by search query
    const matchesQuery = !searchQuery || 
      item.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contract_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by date range using our utility function
    const matchesDate = matchesDateRange(item.timestamp, dateRange);
    
    return matchesQuery && matchesDate;
  });
  
  const handleResetFilters = () => {
    setSearchQuery('');
    setDateRange({ from: null, to: null });
  };
  
  // Helper to get color for action type
  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'added_scope': return 'bg-purple-100 text-purple-800';
      case 'tariff_changed': return 'bg-amber-100 text-amber-800';
      case 'bonus_added': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper to localize action type
  const getActionLabel = (actionType) => {
    return t(`contracts.history.actions.${actionType}`, { defaultValue: actionType });
  };

  return (
    <div>
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('contracts.history.filters', { defaultValue: 'Filters' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                placeholder={t('contracts.history.searchPlaceholder', { defaultValue: 'Search by contract or user...' })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              <DatePicker
                placeholder={t('contracts.history.startDate', { defaultValue: 'Start date' })}
                date={dateRange.from}
                onDateChange={(date) => setDateRange(prev => ({ ...prev, from: date }))}
              />
            </div>
            
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              <DatePicker
                placeholder={t('contracts.history.endDate', { defaultValue: 'End date' })}
                date={dateRange.to}
                onDateChange={(date) => setDateRange(prev => ({ ...prev, to: date }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={handleResetFilters}
              disabled={!searchQuery && !dateRange.from && !dateRange.to}
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              {t('common.resetFilters', { defaultValue: 'Reset Filters' })}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {t('contracts.history.error', { defaultValue: 'Error loading contract history' })}: {error.message}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {searchQuery || dateRange.from || dateRange.to ? 
            t('contracts.history.noMatchingEvents', { defaultValue: 'No matching history events found' }) : 
            t('contracts.history.noEvents', { defaultValue: 'No contract history events yet' })}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('contracts.history.date', { defaultValue: 'Date & Time' })}</TableHead>
              <TableHead>{t('contracts.history.contract', { defaultValue: 'Contract' })}</TableHead>
              <TableHead>{t('contracts.history.action', { defaultValue: 'Action' })}</TableHead>
              <TableHead>{t('contracts.history.user', { defaultValue: 'User' })}</TableHead>
              <TableHead>{t('contracts.history.details', { defaultValue: 'Details' })}</TableHead>
              <TableHead>{t('contracts.history.version', { defaultValue: 'Version' })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(item.timestamp)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {item.contract_id}
                </TableCell>
                <TableCell>
                  <Badge className={getActionColor(item.action_type)}>
                    {getActionLabel(item.action_type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.user?.name}
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {item.details}
                </TableCell>
                <TableCell className="text-center">
                  {item.version}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}