/**
 * Get the base API URL based on the environment
 * In production, it uses the current origin (domain)
 * In development, it defaults to localhost:8000
 * You can override using VITE_API_BASE_URL environment variable
 */
export const getBaseUrl = () => {
    // Check if there's an environment variable set
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    
    // In production, use the same origin as the frontend
    if (import.meta.env.PROD) {
        return `${window.location.origin}/api`;
    }
    
    // In development, use localhost
    return 'http://localhost:8000/api';
};
