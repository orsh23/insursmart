// Contents of components/providers/DoctorsList.jsx moved here
// This is a consolidated version that replaces any duplicates

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/components/context/LanguageContext';
import { Doctor } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Stethoscope,
  ArrowUpDown,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/shared/DataTable';
import DoctorForm from './DoctorForm';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function DoctorsList({ providerId = null }) {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Fetch doctors, optionally filtered by provider if providerId is provided
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      let doctorsList = [];
      
      if (providerId) {
        // If this is being used in a provider context, fetch only doctors associated with this provider
        // This would require a special endpoint or filter parameter in a real application
        doctorsList = await Doctor.list(); // In a real app: Doctor.listByProvider(providerId)
        // For the mock, we'll just pretend to filter client-side:
        doctorsList = doctorsList.filter(doc => doc.providers?.includes(providerId));
      } else {
        // Fetch all doctors
        doctorsList = await Doctor.list();
      }
      
      setDoctors(doctorsList);
      applyFilters(doctorsList, searchQuery, selectedSpecialty);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        variant: "destructive",
        title: t('doctors.fetchError'),
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDoctors();
  }, [providerId]);
  
  // Apply filters when search query or specialty filter changes
  useEffect(() => {
    applyFilters(doctors, searchQuery, selectedSpecialty);
  }, [searchQuery, selectedSpecialty]);
  
  const applyFilters = (doctorsList, query, specialty) => {
    const filtered = doctorsList.filter(doctor => {
      const matchesSearch = !query || 
        doctor.first_name_en?.toLowerCase().includes(query.toLowerCase()) ||
        doctor.last_name_en?.toLowerCase().includes(query.toLowerCase()) ||
        doctor.first_name_he?.toLowerCase().includes(query.toLowerCase()) ||
        doctor.last_name_he?.toLowerCase().includes(query.toLowerCase()) ||
        doctor.license_number?.toLowerCase().includes(query.toLowerCase());
        
      const matchesSpecialty = specialty === 'all' || doctor.specialty === specialty;
      
      return matchesSearch && matchesSpecialty;
    });
    
    setFilteredDoctors(filtered);
  };
  
  const handleOpenDoctorForm = (doctor = null) => {
    setSelectedDoctor(doctor);
    setShowDoctorForm(true);
  };
  
  const handleCloseDoctorForm = () => {
    setShowDoctorForm(false);
    setSelectedDoctor(null);
  };
  
  const handleSaveDoctor = () => {
    fetchDoctors(); // Refresh the list
  };
  
  // Get unique list of specialties from doctors data
  const specialties = ['all', ...new Set(doctors.map(doc => doc.specialty).filter(Boolean))];
  
  const columns = [
    {
      accessorFn: row => `${row.first_name_en} ${row.last_name_en}`,
      header: ({ column }) => (
        <div className="flex items-center">
          {t('doctors.name')}
          <ArrowUpDown className="ml-2 h-4 w-4 cursor-pointer" 
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        </div>
      ),
      id: 'name',
      cell: ({ row }) => {
        const doctor = row.original;
        return (
          <div>
            <div className="font-medium">
              {doctor.first_name_en} {doctor.last_name_en}
            </div>
            <div className="text-sm text-gray-500" dir="rtl">
              {doctor.first_name_he} {doctor.last_name_he}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'specialty',
      header: t('doctors.specialty'),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.specialty || t('doctors.noSpecialty')}
        </Badge>
      )
    },
    {
      accessorKey: 'license_number',
      header: t('doctors.licenseNumber')
    },
    {
      header: t('doctors.contact'),
      id: 'contact',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          {row.original.phone && (
            <div className="flex items-center text-sm">
              <Phone className="mr-2 h-3 w-3 text-gray-500" />
              {row.original.phone}
            </div>
          )}
          {row.original.email && (
            <div className="flex items-center text-sm">
              <Mail className="mr-2 h-3 w-3 text-gray-500" />
              {row.original.email}
            </div>
          )}
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: t('doctors.status'),
      cell: ({ row }) => (
        <Badge className={
          row.original.status === 'active' 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }>
          {row.original.status === 'active' 
            ? t('doctors.statusOptions.active') 
            : t('doctors.statusOptions.inactive')}
        </Badge>
      )
    }
  ];
  
  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder={t('doctors.searchPlaceholder')}
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center border rounded-md px-3 py-1.5">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            <select 
              value={selectedSpecialty} 
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm"
            >
              <option value="all">{t('doctors.allSpecialties')}</option>
              {specialties.filter(s => s !== 'all').map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
          
          {!providerId && (
            <Button onClick={() => handleOpenDoctorForm()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('doctors.addDoctor')}
            </Button>
          )}
        </div>
      </div>
      
      {/* Doctors Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <LoadingSpinner />
        </div>
      ) : filteredDoctors.length > 0 ? (
        <DataTable
          data={filteredDoctors}
          columns={columns}
          onRowClick={row => handleOpenDoctorForm(row.original)}
        />
      ) : (
        <div className="text-center p-12 border rounded-lg bg-gray-50">
          <Stethoscope className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">
            {searchQuery || selectedSpecialty !== 'all'
              ? t('doctors.noSearchResults')
              : providerId
                ? t('doctors.noAssociatedDoctors')
                : t('doctors.noDoctors')
            }
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery || selectedSpecialty !== 'all'
              ? t('doctors.tryDifferentSearch')
              : providerId
                ? t('doctors.associateDoctors')
                : t('doctors.addYourFirstDoctor')
            }
          </p>
          {(!providerId || (providerId && searchQuery === '' && selectedSpecialty === 'all')) && (
            <Button
              className="mt-4"
              onClick={() => handleOpenDoctorForm()}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('doctors.addDoctor')}
            </Button>
          )}
        </div>
      )}
      
      {/* Doctor Form Dialog */}
      <DoctorForm
        doctor={selectedDoctor}
        isOpen={showDoctorForm}
        onClose={handleCloseDoctorForm}
        onSave={handleSaveDoctor}
      />
    </div>
  );
}