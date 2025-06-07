import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "680e05c84309e8df079a492e", 
  requiresAuth: true // Ensure authentication is required for all operations
});
