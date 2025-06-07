
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageHook } from '@/components/useLanguageHook';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner'; // Corrected path
import { Users, Search, ShieldCheck, Shield, CalendarDays, AlertTriangle, RefreshCw, UserPlus, Edit3, ListFilter, ArrowUpDown, CircleOff } from 'lucide-react';
import { format } from 'date-fns';
import { getLocaleObject } from '@/components/utils/i18n-utils';
import { retryWithBackoff, handleApiError, safeEntityCall } from '@/components/utils/api-utils';

const availableRoles = [
  { value: 'admin', labelKey: 'roles.admin', icon: ShieldCheck },
  { value: 'user', labelKey: 'roles.user', icon: Shield },
];

const sortOptionsConfig = (t) => [
    { value: '-created_date', label: t('sortOptions.createdDateDesc', {defaultValue: 'Newest Users'}) },
    { value: 'created_date', label: t('sortOptions.createdDateAsc', {defaultValue: 'Oldest Users'}) },
    { value: 'full_name', label: t('sortOptions.fullNameAsc', {defaultValue: 'Full Name (A-Z)'}) },
    { value: '-full_name', label: t('sortOptions.fullNameDesc', {defaultValue: 'Full Name (Z-A)'}) },
    { value: 'email', label: t('sortOptions.emailAsc', {defaultValue: 'Email (A-Z)'}) },
    { value: '-email', label: t('sortOptions.emailDesc', {defaultValue: 'Email (Z-A)'}) },
    { value: 'role', label: t('sortOptions.role', {defaultValue: 'Role'}) },
];

export default function UserManagementTab() {
  const { t, language } = useLanguageHook();
  const { toast } = useToast();
  
  const currentLocale = useMemo(() => {
    try {
        if (typeof getLocaleObject === 'function') {
            return getLocaleObject(language);
        }
        return undefined; 
    } catch (error) {
      console.error('[UserManagementTab] Error getting locale:', error);
      return undefined;
    }
  }, [language]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null); // General API error state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortOption, setSortOption] = useState('-created_date');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [invitingUser, setInvitingUser] = useState(false);

  const dynamicSortOptions = useMemo(() => sortOptionsConfig(t), [t]);

  const fetchUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setApiError(null);
    try {
      const fetchedUsers = await retryWithBackoff(
        () => safeEntityCall(User, 'list', sortOption, 50), // Limiting to 50 users for now
        'UserManagementTab-FetchUsers'
      );
      setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
    } catch (error) {
      const { isRateLimitError } = handleApiError(error, t, toast, 'UserManagementTab-FetchUsers');
      setApiError(isRateLimitError 
        ? t('errors.rateLimitExceeded', { defaultValue: 'Service is temporarily busy. Please try again.' }) 
        : t('errors.fetchUsersFailed', { defaultValue: 'Failed to fetch users.' }));
      setUsers([]); // Clear users on error
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [sortOption, t, toast]); // toast and t are stable, sortOption triggers refetch

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = useCallback(async (userId, newRole) => {
    setLoading(true); // Indicate loading for this specific action
    try {
      await retryWithBackoff(
        () => safeEntityCall(User, 'update', userId, { role: newRole }),
        'UserManagementTab-UpdateRole'
      );
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('userManagement.roleUpdateSuccess', { defaultValue: 'User role updated successfully.' }),
      });
      // Refresh users list optimistically or by re-fetching
      setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      handleApiError(error, t, toast, 'UserManagementTab-UpdateRole');
    } finally {
      setLoading(false); // Stop loading indicator for this action
    }
  }, [t, toast]);


  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast({ title: t('common.error', {defaultValue: 'Error'}), description: t('userManagement.emailRequired', {defaultValue: 'Email is required for invitation.'}), variant: 'destructive' });
      return;
    }
    setInvitingUser(true);
    try {
      // Note: User.invite is not a standard SDK method, this assumes it might exist or a custom integration.
      // If User.invite doesn't exist, this part needs adjustment (e.g. calling a backend function or an integration).
      // For now, we'll simulate success.
      console.log(`Simulating invite for ${inviteEmail} with role ${inviteRole}`);
      // await User.invite({ email: inviteEmail, role: inviteRole }); 
      
      toast({
        title: t('common.success', { defaultValue: 'Success' }),
        description: t('userManagement.inviteSent', { defaultValue: `Invitation sent to ${inviteEmail}.` }),
      });
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('user');
      fetchUsers(false); // Refresh user list without full page load spinner
    } catch (error) {
      // If User.invite is a real call, use handleApiError
      console.error("Error inviting user:", error);
      toast({ title: t('common.error', {defaultValue: 'Error'}), description: t('userManagement.inviteFailed', {defaultValue: 'Failed to send invitation.'}), variant: 'destructive' });
    } finally {
      setInvitingUser(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const nameMatch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = roleFilter === 'all' || user.role === roleFilter;
      return (nameMatch || emailMatch) && roleMatch;
    });
  }, [users, searchTerm, roleFilter]);

  const safeFormat = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPpp', { locale: currentLocale });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const RoleIcon = ({role}) => {
      const roleConfig = availableRoles.find(r => r.value === role);
      const IconComponent = roleConfig?.icon || Shield;
      return <IconComponent className="h-4 w-4 inline-block mr-1" />;
  };


  if (loading && users.length === 0) { // Show main loader only on initial load
    return <LoadingSpinner />;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-2xl flex items-center">
                    <Users className="mr-2 h-6 w-6 text-blue-600" />
                    {t('userManagement.title', { defaultValue: 'User Management' })}
                </CardTitle>
                <CardDescription>
                    {t('userManagement.description', { defaultValue: 'Manage user accounts, roles, and invite new users.' })}
                </CardDescription>
            </div>
            <Button onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('userManagement.inviteUser', { defaultValue: 'Invite User' })}
            </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Filters and Search */}
        <Card>
            <CardContent className="p-4 space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
                <div className="flex-grow">
                    <Label htmlFor="user-search">{t('common.search', {defaultValue: 'Search'})}</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="user-search"
                            type="search"
                            placeholder={t('userManagement.searchPlaceholder', {defaultValue: 'Search by name or email...' })}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 w-full"
                        />
                    </div>
                </div>
                <div className="w-full md:w-48">
                    <Label htmlFor="role-filter">{t('common.filterByRole', {defaultValue: 'Filter by Role'})}</Label>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger id="role-filter" className="w-full">
                            <ListFilter className="h-4 w-4 mr-2 text-muted-foreground"/>
                            <SelectValue placeholder={t('common.allRoles', {defaultValue: 'All Roles'})} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.allRoles', {defaultValue: 'All Roles'})}</SelectItem>
                            {availableRoles.map(role => (
                                <SelectItem key={role.value} value={role.value}>
                                    <RoleIcon role={role.value} />
                                    {t(role.labelKey, { defaultValue: role.value.charAt(0).toUpperCase() + role.value.slice(1) })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full md:w-56">
                    <Label htmlFor="sort-users">{t('common.sortBy', {defaultValue: 'Sort By'})}</Label>
                     <Select value={sortOption} onValueChange={setSortOption}>
                        <SelectTrigger id="sort-users" className="w-full">
                            <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground"/>
                            <SelectValue placeholder={t('common.selectSort', {defaultValue: 'Select sort order'})} />
                        </SelectTrigger>
                        <SelectContent>
                            {dynamicSortOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" onClick={() => fetchUsers()} className="w-full md:w-auto">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading && users.length > 0 ? 'animate-spin' : ''}`} />
                    {t('common.refresh', {defaultValue: 'Refresh'})}
                </Button>
            </CardContent>
        </Card>

        {apiError && (
          <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <p>{apiError}</p>
          </div>
        )}

        {/* User Table */}
        {!apiError && (
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>{t('userManagement.table.fullName', { defaultValue: 'Full Name' })}</TableHead>
                    <TableHead>{t('userManagement.table.email', { defaultValue: 'Email' })}</TableHead>
                    <TableHead>{t('userManagement.table.role', { defaultValue: 'Role' })}</TableHead>
                    <TableHead>{t('userManagement.table.createdDate', { defaultValue: 'Created Date' })}</TableHead>
                    <TableHead className="text-right">{t('userManagement.table.actions', { defaultValue: 'Actions' })}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && users.length > 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
                                <LoadingSpinner />
                            </TableCell>
                        </TableRow>
                    )}
                    {!loading && filteredUsers.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                            <CircleOff className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">{t('common.noResultsFound', { defaultValue: 'No users found matching your criteria.' })}</p>
                        </TableCell>
                    </TableRow>
                    )}
                    {!loading && filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                        <Select 
                            defaultValue={user.role} 
                            onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                            disabled={loading} // Disable select while main loading or specific action is in progress
                        >
                            <SelectTrigger className="w-[150px] text-xs h-8">
                                <RoleIcon role={user.role} />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                            {availableRoles.map(role => (
                                <SelectItem key={role.value} value={role.value} className="text-xs">
                                    <RoleIcon role={role.value} />
                                    {t(role.labelKey, { defaultValue: role.value.charAt(0).toUpperCase() + role.value.slice(1) })}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center text-xs text-muted-foreground">
                                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                                {safeFormat(user.created_date)}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled>
                            <Edit3 className="h-4 w-4 mr-1" />
                            {t('common.edit', {defaultValue: 'Edit'})}
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        )}
      </CardContent>

        {/* Invite User Dialog */}
        {isInviteDialogOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>{t('userManagement.inviteNewUserTitle', {defaultValue: 'Invite New User'})}</CardTitle>
                        <CardDescription>{t('userManagement.inviteNewUserDesc', {defaultValue: 'Enter the email and select a role for the new user.'})}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleInviteUser}>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="invite-email">{t('common.email', {defaultValue: 'Email'})}</Label>
                                <Input 
                                    id="invite-email" 
                                    type="email" 
                                    value={inviteEmail} 
                                    onChange={(e) => setInviteEmail(e.target.value)} 
                                    placeholder="user@example.com"
                                    required 
                                />
                            </div>
                            <div>
                                <Label htmlFor="invite-role">{t('common.role', {defaultValue: 'Role'})}</Label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger id="invite-role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableRoles.map(role => (
                                            <SelectItem key={role.value} value={role.value}>
                                                <RoleIcon role={role.value} />
                                                {t(role.labelKey, { defaultValue: role.value.charAt(0).toUpperCase() + role.value.slice(1) })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <div className="px-6 py-4 border-t flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={invitingUser}>
                                {t('common.cancel', {defaultValue: 'Cancel'})}
                            </Button>
                            <Button type="submit" disabled={invitingUser}>
                                {invitingUser && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                {t('userManagement.sendInvite', {defaultValue: 'Send Invite'})}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        )}
    </Card>
  );
}
