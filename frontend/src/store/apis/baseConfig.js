import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { clearPublicSession } from "../../utils/publicSession";

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
  return "http://localhost:8000/api";
};

// Shared base query for every API slice: sends the auth token and, when the
// server rejects it (401), signs the user out and returns them to sign-in.
export const createBaseQuery = (path) => {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: `${getBaseUrl()}${path}`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Token ${token}`);
      }
      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    if (result?.error?.status === 401) {
      localStorage.removeItem("token");
      clearPublicSession();
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/sign-in?next=${encodeURIComponent(currentPath)}`;
    }
    return result;
  };
};
