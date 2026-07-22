export const getApiBaseURL = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("stsamscqcufrontendrel")) {
      return "https://func-msc-qcu-backend-rel.azurewebsites.net/api/v1";
    }
    if (host.includes("stsamscqcufrontenddev")) {
      return "https://func-msc-qcu-backend-dev.azurewebsites.net/api/v1";
    }
  }
  return "";
};

export const getApiEndpoint = (path: string): string => {
  const baseUrl = getApiBaseURL();
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!cleanBase) {
    if (cleanPath.startsWith("/api/v1")) return cleanPath;
    if (cleanPath.startsWith("/api")) return cleanPath;
    return `/api/v1${cleanPath}`;
  }

  return `${cleanBase}${cleanPath}`;
};

