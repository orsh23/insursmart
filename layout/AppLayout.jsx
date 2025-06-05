import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, ListChecks, Users, Building2, FileCode2, Package, ScrollText, Coins,
  GitCompareArrows, ListOrdered, Settings, FileText, LogOut, Menu, ChevronLeft, ChevronRight,
  ShieldAlert, // Added for menu item
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppStore } from '@/components/store/useAppStore';
import { useLanguageHook } from '@/components/useLanguageHook';
import { createPageUrl, capitalizeFirstLetter } from '@/components/utils/index.js';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';

const menuItemsConfig = [
  { nameKey: 'menu.dashboard', icon: LayoutDashboard, pageName: 'dashboard', requiredRole: null },
  { nameKey: 'menu.tasks', icon: ListChecks, pageName: 'tasks', requiredRole: null },
  { nameKey: 'menu.doctors', icon: Users, pageName: 'doctors', requiredRole: null },
  { nameKey: 'menu.providers', icon: Building2, pageName: 'providers', requiredRole: null },
  { nameKey: 'menu.codemanagement', icon: FileCode2, pageName: 'codemanagement', requiredRole: 'admin' },
  { nameKey: 'menu.materialsmanagement', icon: Package, pageName: 'materialsmanagement', requiredRole: 'admin' },
  { nameKey: 'menu.contracts', icon: ScrollText, pageName: 'contractmanagement', requiredRole: null }, // Corrected pageName
  { nameKey: 'menu.tariffmanagement', icon: Coins, pageName: 'tariffmanagement', requiredRole: 'admin' },
  { nameKey: 'menu.requests', icon: ShieldAlert, pageName: 'requestmanagement', requiredRole: null },
  { nameKey: 'menu.insurance', icon: ListOrdered, pageName: 'insurance', requiredRole: 'admin'},
  { nameKey: 'menu.providerdoctorlinkage', icon: GitCompareArrows, pageName: 'providerdoctorlinkage', requiredRole: 'admin' },
  { nameKey: 'menu.regulations', icon: FileText, pageName: 'regulations', requiredRole: 'admin' },
  { nameKey: 'menu.importhistory', icon: FileText, pageName: 'importhistory', requiredRole: 'admin' }, // Changed icon in previous step, kept it
  { nameKey: 'menu.adminsettings', icon: Settings, pageName: 'adminsettings', requiredRole: 'admin' },
];


export default function AppLayoutInternal({ children, currentPageName }) {
  const { t, isRTL } = useLanguageHook();
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');

  const fetchUserCallback = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      setUserRole(user?.role || 'user');
    } catch (error) {
      console.error('Error fetching user data:', error);
      setCurrentUser(null);
      setUserRole('user');
    }
  }, []);

  useEffect(() => {
    fetchUserCallback();
  }, [fetchUserCallback]);

  const setSidebarOpenStable = useCallback(setSidebarOpen, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        if (!sidebarOpen && typeof setSidebarOpenStable === 'function') {
            setSidebarOpenStable(true);
        }
      } else {
        if (sidebarOpen && typeof setSidebarOpenStable === 'function') {
            setSidebarOpenStable(false);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen, setSidebarOpenStable]);

  const handleMenuItemClick = useCallback(() => {
    if (window.innerWidth < 1024 && typeof toggleSidebar === 'function') {
      toggleSidebar();
    }
  }, [toggleSidebar]);

  const handleLogout = useCallback(async () => {
    try {
      await User.logout();
      setCurrentUser(null);
      // Platform handles redirect
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts[0].charAt(0).toUpperCase() + (parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '');
  };
  
  const filteredMenuItems = React.useMemo(() => menuItemsConfig.filter(item => {
    if (!item.requiredRole) return true;
    return userRole === 'admin' || userRole === item.requiredRole;
  }), [userRole]);

  const pageTitle = currentPageName 
    ? capitalizeFirstLetter(t(`menu.${currentPageName.toLowerCase()}`, {defaultValue: capitalizeFirstLetter(currentPageName)})) 
    : t('menu.dashboard', {defaultValue: 'Dashboard'});

  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} z-30 flex flex-col bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out 
                   ${sidebarOpen ? 'translate-x-0 w-72 lg:w-64' : (isRTL ? 'translate-x-full w-0' : '-translate-x-full w-0')} 
                   lg:translate-x-0 dark:border-gray-700 shadow-lg lg:shadow-none`}
      >
        <div className={`flex items-center ${sidebarOpen ? 'justify-between px-4' : 'justify-center'} h-16 border-b dark:border-gray-700 shrink-0`}>
          <Link to={createPageUrl('dashboard')} className={`text-2xl font-bold text-blue-600 dark:text-blue-400 ${!sidebarOpen && 'hidden'} lg:inline`}>
            InsureSmart
          </Link>
          {sidebarOpen && typeof toggleSidebar === 'function' && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
              {isRTL ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          )}
        </div>
        {sidebarOpen && (
          <nav className="flex-grow overflow-y-auto p-2 space-y-1">
            {filteredMenuItems.map((item) => {
              const pageUrl = createPageUrl(item.pageName);
              const isActive = location.pathname === pageUrl || (location.pathname === '/' && item.pageName === 'dashboard');
              const MenuItemIcon = item.icon;
              return (
                <Link
                  key={item.nameKey}
                  to={pageUrl}
                  title={t(item.nameKey, {defaultValue: item.nameKey.split('.').pop()})}
                  onClick={handleMenuItemClick}
                  className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out
                              ${isActive 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-white' 
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'}
                              ${!sidebarOpen && 'justify-center lg:justify-start'}`}
                >
                  {MenuItemIcon && <MenuItemIcon className={`h-5 w-5 ${sidebarOpen ? (isRTL ? 'ml-3' : 'mr-3') : 'mx-auto'}`} />}
                  <span className={`${!sidebarOpen && 'hidden'} lg:inline`}>{t(item.nameKey, {defaultValue: item.nameKey.split('.').pop()})}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </aside>

      {/* Main content area */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? (isRTL ? 'lg:mr-64' : 'lg:ml-64') : (isRTL ? 'lg:mr-0' : 'lg:ml-0')}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 bg-white border-b dark:bg-gray-800 dark:border-gray-700 shrink-0">
          <div className="flex items-center">
            {typeof toggleSidebar === 'function' && (
                 <Button variant="ghost" size="icon" onClick={toggleSidebar} className={`${sidebarOpen ? 'hidden' : ''} lg:hidden`}>
                    <Menu className="w-6 h-6" />
                 </Button>
            )}
            <h1 className="text-lg font-semibold ml-2 hidden sm:block">
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
            {currentUser ? (
              <DropdownMenu dir={isRTL ? "rtl" : "ltr"}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      {currentUser.profile_picture_url ? (
                        <AvatarImage src={currentUser.profile_picture_url} alt={currentUser.full_name} />
                      ) : (
                         // Fallback to a default pattern or initials if no profile_picture_url
                        <AvatarImage src={`https://avatar.vercel.sh/${currentUser.email || getInitials(currentUser.full_name)}.png?size=40`} alt={currentUser.full_name} />
                      )}
                      <AvatarFallback>{getInitials(currentUser.full_name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align={isRTL ? "start" : "end"} forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 focus:bg-red-100 dark:focus:bg-red-700/50 focus:text-red-700 dark:focus:text-red-300 cursor-pointer">
                    <LogOut className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('common.logout', { defaultValue: 'Log out' })}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => User.login()}>{t('common.login', {defaultValue: "Login"})}</Button>
            )}
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}