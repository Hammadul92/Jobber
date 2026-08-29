const PUBLIC_SESSION_COOKIE = "contractorz_public_session";

const cookieOptions = (maxAge) => {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  return `Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
};

export function syncPublicSession(user) {
  if (!user) return;

  const session = {
    name: user.name || "Account",
    email: user.email || "",
    role: user.role || "",
  };
  document.cookie = `${PUBLIC_SESSION_COOKIE}=${encodeURIComponent(
    JSON.stringify(session),
  )}; ${cookieOptions(60 * 60 * 24 * 7)}`;
}

export function clearPublicSession() {
  document.cookie = `${PUBLIC_SESSION_COOKIE}=; ${cookieOptions(0)}`;
}
