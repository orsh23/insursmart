import React, { useState, useEffect } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook'; // Keep for isRTL
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { 
  LayoutDashboard, Users, Building2, Link2, FileCode2, 
  Package, ScrollText, Coins, FileText, ListChecks
} from 'lucide-react';
import { Task } from '@/api/entities';
import { Doctor } from '@/api/entities';
import { Provider } from '@/api/entities';
import { DoctorProviderAffiliation } from '@/api/entities';
import { MedicalCode } from '@/api/entities';
import { InternalCode } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function DashboardStats() {
  const { isRTL } = useLanguageHook(); // Keep only isRTL
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tasks: { total: 0, completed: 0, pending: 0 },
    doctors: { total: 0, active: 0 },
    providers: { total: 0, active: 0 },
    affiliations: { total: 0, active: 0 },
    medicalCodes: { total: 0, active: 0 },
    internalCodes: { total: 0, active: 0 }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch data for stats
        const [tasks, doctors, providers, affiliations, medicalCodes, internalCodes] = await Promise.all([
          Task.list(),
          Doctor.list(),
          Provider.list(),
          DoctorProviderAffiliation.list(),
          MedicalCode.list(),
          InternalCode.list()
        ]);
        
        // Process and set stats
        setStats({
          tasks: {
            total: tasks?.length || 0,
            completed: tasks?.filter(t => t.status === 'done')?.length || 0,
            pending: tasks?.filter(t => t.status !== 'done')?.length || 0
          },
          doctors: {
            total: doctors?.length || 0,
            active: doctors?.filter(d => d.status === 'active')?.length || 0
          },
          providers: {
            total: providers?.length || 0,
            active: providers?.filter(p => p.status === 'active')?.length || 0
          },
          affiliations: {
            total: affiliations?.length || 0,
            active: affiliations?.filter(a => a.affiliation_status === 'active')?.length || 0
          },
          medicalCodes: {
            total: medicalCodes?.length || 0,
            active: medicalCodes?.filter(c => c.status === 'active')?.length || 0
          },
          internalCodes: {
            total: internalCodes?.length || 0,
            active: internalCodes?.filter(c => c.is_active)?.length || 0
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Tasks',
      icon: ListChecks,
      color: 'bg-blue-50 text-blue-700',
      primaryStat: stats.tasks.total,
      secondaryStat: `${stats.tasks.completed} completed`,
      linkTo: 'tasks'
    },
    {
      title: 'Doctors',
      icon: Users,
      color: 'bg-purple-50 text-purple-700',
      primaryStat: stats.doctors.total,
      secondaryStat: `${stats.doctors.active} active`,
      linkTo: 'doctors'
    },
    {
      title: 'Providers',
      icon: Building2,
      color: 'bg-indigo-50 text-indigo-700',
      primaryStat: stats.providers.total,
      secondaryStat: `${stats.providers.active} active`,
      linkTo: 'providers'
    },
    {
      title: 'Affiliations',
      icon: Link2,
      color: 'bg-green-50 text-green-700',
      primaryStat: stats.affiliations.total,
      secondaryStat: `${stats.affiliations.active} active`,
      linkTo: 'providerdoctorlinkage'
    },
    {
      title: 'Medical Codes',
      icon: FileCode2,
      color: 'bg-red-50 text-red-700',
      primaryStat: stats.medicalCodes.total,
      secondaryStat: `${stats.medicalCodes.active} active`,
      linkTo: 'codemanagement'
    },
    {
      title: 'Internal Codes',
      icon: FileText,
      color: 'bg-amber-50 text-amber-700',
      primaryStat: stats.internalCodes.total,
      secondaryStat: `${stats.internalCodes.active} active`,
      linkTo: 'codemanagement'
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <LayoutDashboard className="mr-2 h-5 w-5 text-gray-500" />
        System Overview
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          // Loading skeleton
          Array(6).fill(0).map((_, index) => (
            <Card key={index} className="opacity-50">
              <CardHeader className="pb-2">
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Actual stat cards
          statCards.map((card, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <card.icon className={`h-5 w-5 mr-2 ${card.color}`} />
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.primaryStat}</div>
                <p className="text-sm text-gray-500">{card.secondaryStat}</p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" asChild>
                  <a href={createPageUrl(card.linkTo)}>
                    View
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}