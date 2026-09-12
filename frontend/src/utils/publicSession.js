const PUBLIC_SESSION_COOKIE = "contractorz_public_session";

const cookieOptions = (maxAge) => {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  return `Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
};

const getPublicPhotoPath = (user) => {
  const photoUrl = user?.photoUrl || user?.photo;
  if (!photoUrl) return "";

  try {
    const parsedUrl = new URL(photoUrl, window.location.origin);
    if (!parsedUrl.pathname.startsWith("/media/")) return "";
    return `${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return "";
  }
};

export function syncPublicSession(user) {
  if (!user) return;

  const session = {
    name: user.name || "Account",
    email: user.email || "",
    role: user.role || "",
    photoUrl: getPublicPhotoPath(user),
  };
  document.cookie = `${PUBLIC_SESSION_COOKIE}=${encodeURIComponent(
    JSON.stringify(session),
  )}; ${cookieOptions(60 * 60 * 24 * 7)}`;
}

export function clearPublicSession() {
  document.cookie = `${PUBLIC_SESSION_COOKIE}=; ${cookieOptions(0)}`;
}
