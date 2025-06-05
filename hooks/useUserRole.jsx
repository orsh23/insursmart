import { useState, useEffect } from 'react';
import { User } from '@/api/entities';

export default function useUserRole() {
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    async function loadUserRole() {
      try {
        setIsLoading(true);
        const userData = await User.me();
        setUser(userData);
        setRole(userData.role || 'user');
      } catch (error) {
        console.error('Error loading user role:', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserRole();
  }, []);
  
  const isAdmin = role === 'admin';
  
  return { 
    role, 
    isAdmin, 
    isLoading, 
    error, 
    user 
  };
}