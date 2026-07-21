export const getApiEndpoint = (path: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || "";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!cleanBase) {
    if (cleanPath.startsWith("/api/v1")) return cleanPath;
    if (cleanPath.startsWith("/api")) return cleanPath;
    return `/api/v1${cleanPath}`;
  }

  return `${cleanBase}${cleanPath}`;
};
