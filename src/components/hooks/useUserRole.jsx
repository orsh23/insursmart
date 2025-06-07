// Content of components/hooks/useUserRole.js
import { useState, useEffect } from 'react';
import { User } from '@/api/entities'; // Assuming User SDK is here

/**
 * Hook to fetch and provide the current user's role and user object.
 * @returns {{
 *  user: Object | null,
 *  role: string | null, // 'admin', 'user', or null if not logged in/error
 *  isLoading: boolean,
 *  error: Error | null,
 *  refetchUser: () => Promise<void>
 * }}
 */
export default function useUserRole() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserRole = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setRole(currentUser?.role || null); // Assuming 'role' is a field on the user object
    } catch (err) {
      // console.warn('Failed to fetch user role (likely not logged in):', err.message);
      setError(err);
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  return { user, role, isLoading, error, refetchUser: fetchUserRole };
}