export function getPublicSiteHomeUrl() {
  const configuredPublicSite = import.meta.env.VITE_PUBLIC_SITE_URL;
  if (configuredPublicSite) {
    return configuredPublicSite.replace(/\/$/, "") || "/";
  }

  const configuredApiBase = import.meta.env.VITE_API_BASE_URL;
  const apiBase =
    configuredApiBase ||
    (import.meta.env.PROD
      ? `${window.location.origin}/api`
      : "http://localhost:8000/api");

  return apiBase.replace(/\/api\/?$/, "");
}
