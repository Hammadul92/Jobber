export function isDashboardPath(pathname) {
  return pathname === "/user" || pathname.startsWith("/user/");
}

export function isMagicQuoteLink(pathname, search) {
  return (
    /^\/user\/business\/quote\/sign\/[^/]+\/?$/.test(pathname) &&
    new URLSearchParams(search).has("token")
  );
}

export function getPublicRedirectUrl(publicSiteHomeUrl, currentUrl) {
  const current = new URL(currentUrl);
  const publicUrl = new URL(publicSiteHomeUrl, current.origin);

  if (publicUrl.origin !== current.origin) {
    publicUrl.pathname = current.pathname;
    publicUrl.search = current.search;
    publicUrl.hash = current.hash;
  }

  return publicUrl.toString();
}
