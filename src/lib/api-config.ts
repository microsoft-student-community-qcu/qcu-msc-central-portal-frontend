export const getApiBaseURL = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Development Stage
    if (
      host.includes("stsamscqcufrontenddev") ||
      host.includes("dev.msc-qcu.tech") ||
      host.includes("dev-admin.msc-qcu.tech") ||
      host.startsWith("dev-") ||
      host.startsWith("dev.")
    ) {
      return "https://func-msc-qcu-backend-dev.azurewebsites.net/api/v1";
    }
    // Release / Staging Stage
    if (
      host.includes("stsamscqcufrontendrel") ||
      host.includes("rel.msc-qcu.tech") ||
      host.includes("rel-admin.msc-qcu.tech") ||
      host.startsWith("rel-") ||
      host.startsWith("rel.")
    ) {
      return "https://func-msc-qcu-backend-rel.azurewebsites.net/api/v1";
    }
    // Production Stage
    if (
      host === "msc-qcu.tech" ||
      host === "admin.msc-qcu.tech" ||
      host.includes("stsamscqcufrontendprod")
    ) {
      return "https://func-msc-qcu-backend.azurewebsites.net/api/v1";
    }
  }
  return "";
};

export const getApiEndpoint = (path: string): string => {
  const baseUrl = getApiBaseURL();
  let cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  let cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!cleanBase) {
    if (cleanPath.startsWith("/api/v1")) return cleanPath;
    if (cleanPath.startsWith("/api")) return cleanPath;
    return `/api/v1${cleanPath}`;
  }

  if (cleanBase.endsWith("/api/v1")) {
    if (cleanPath.startsWith("/api/v1/")) {
      cleanPath = cleanPath.slice(7);
    } else if (cleanPath === "/api/v1") {
      cleanPath = "";
    } else if (cleanPath.startsWith("/api/")) {
      cleanPath = cleanPath.slice(4);
    }
  } else if (cleanBase.endsWith("/api")) {
    if (cleanPath.startsWith("/api/")) {
      cleanPath = cleanPath.slice(4);
    }
  } else {
    if (!cleanPath.startsWith("/api/") && cleanPath !== "/api") {
      cleanPath = `/api/v1${cleanPath}`;
    }
  }

  return `${cleanBase}${cleanPath}`;
};

