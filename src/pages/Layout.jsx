
import React from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { AppStoreProvider } from '@/components/store/useAppStore';
import { Toaster } from '@/components/ui/toaster'; 
import { LanguageProvider } from '@/components/i18n/LanguageProvider';
import { createPageUrl } from '@/components/utils/url';
import {
  LayoutDashboard,
  ListChecks,
  FileCode2,
  Package,
  ScrollText,
  Coins,
  FileText as RequestManagementIcon,
  Shield, 
  ListOrdered,
  Settings,
  Menu,
  LogOut,
  Network,
  MapPin,
  X 
} from 'lucide-react';

function LayoutContent({ children }) { 
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) { /* User might not be logged in */ }
    };
    fetchUser();
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.href = createPageUrl('index');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : createPageUrl('dashboard');

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: createPageUrl('dashboard') },
    { name: 'Tasks', icon: ListChecks, path: createPageUrl('tasks') },
    { name: 'Network Management', icon: Network, path: createPageUrl('networkmanagement') },
    { name: 'Code Management', icon: FileCode2, path: createPageUrl('codemanagement') },
    { name: 'Materials Management', icon: Package, path: createPageUrl('materialsmanagement') },
    { name: 'Contracts', icon: ScrollText, path: createPageUrl('contractspage') }, 
    { name: 'Tariff Management', icon: Coins, path: createPageUrl('tariffmanagement') },
    { name: 'Request Management', icon: RequestManagementIcon, path: createPageUrl('requestmanagement') },
    { name: 'Insurance', icon: Shield, path: createPageUrl('insurance') }, 
    { name: 'Regulations', icon: ListChecks, path: createPageUrl('regulations') },
    { name: 'Import History', icon: ListOrdered, path: createPageUrl('importhistory') },
    { name: 'Address Management', icon: MapPin, path: createPageUrl('addressmanagement') },
    { name: 'Admin Settings', icon: Settings, path: createPageUrl('adminsettings') }
  ];
  
  const currentMenuItem = menuItems.find(item => {
    const normalizedItemPath = item.path.startsWith('/') ? item.path : `/${item.path}`;
    const normalizedCurrentPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;

    if (normalizedItemPath === '/' || normalizedItemPath === createPageUrl('index')) { 
        return normalizedCurrentPath === '/' || normalizedCurrentPath === createPageUrl('index');
    }
    return normalizedCurrentPath === normalizedItemPath || (normalizedItemPath !== '/' && normalizedCurrentPath.startsWith(normalizedItemPath + '/')) || normalizedCurrentPath.startsWith(normalizedItemPath + '?');
  });
  const headerTitle = currentMenuItem ? currentMenuItem.name : 'InsureSmart';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <a href={createPageUrl('dashboard')} className="text-xl font-bold text-gray-800 dark:text-white">
            InsureSmart
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 dark:text-gray-400"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <nav className="mt-4 px-2 space-y-1 flex-grow flex flex-col">
          <div className="flex-grow">
            {menuItems.map((item) => {
              const normalizedItemPath = item.path.startsWith('/') ? item.path : `/${item.path}`;
              const normalizedCurrentPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;

              let isActive = false;
              if (normalizedItemPath === '/' || normalizedItemPath === createPageUrl('index')) {
                  isActive = normalizedCurrentPath === '/' || normalizedCurrentPath === createPageUrl('index');
              } else {
                  isActive = normalizedCurrentPath === normalizedItemPath || 
                             (normalizedCurrentPath.startsWith(normalizedItemPath + '/') || normalizedCurrentPath.startsWith(normalizedItemPath + '?'));
              }
              
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.path}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out ${
                    isActive
                      ? 'text-white bg-blue-600 dark:bg-blue-500'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={(e) => { 
                    if (window.innerWidth < 1024) {
                       setSidebarOpen(false);
                    }
                  }}
                >
                  <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                  {item.name}
                </a>
              );
            })}
          </div>
          
          {currentUser && (
            <div className="p-2 mt-auto border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="ghost" 
                className="w-full flex items-center justify-start text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" />
                Logout
              </Button>
            </div>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 dark:text-gray-400" 
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white ml-2">
                {headerTitle}
              </h2>
            </div>
            {currentUser && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
                  {currentUser.full_name || currentUser.email}
                </span>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <LanguageProvider defaultLanguage="en">
      <AppStoreProvider>
        <LayoutContent>
          {children}
        </LayoutContent>
        <Toaster />
      </AppStoreProvider>
    </LanguageProvider>
  );
}
