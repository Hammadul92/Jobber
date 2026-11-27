export function createDashboardClient(
  fetchRequest = (...args) => fetch(...args),
) {
  let csrf = "";
  return async function api(path, options = {}) {
    const response = await fetchRequest(`/api/super-admin/${path}`, {
      credentials: "same-origin",
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        "X-CSRFToken": csrf,
        ...options.headers,
      },
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Dashboard service is unavailable. Please retry.");
    }
    if (!response.ok) {
      const error = new Error(data.detail || "Request failed");
      error.status = response.status;
      error.errors = data.errors;
      throw error;
    }
    if (data.csrf) csrf = data.csrf;
    return data;
  };
}

export const api = createDashboardClient();
