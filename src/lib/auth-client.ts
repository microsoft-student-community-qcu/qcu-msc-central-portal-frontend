import { createAuthClient } from "better-auth/react";
import { getApiBaseURL } from "./api-config";

const getAuthBaseURL = (): string => {
  const apiUrl = getApiBaseURL();
  if (apiUrl && apiUrl.startsWith("http")) {
    try {
      return new URL(apiUrl).origin + "/api/auth";
    } catch {
      // Fall through to fallback
    }
  }

  // BetterAuth requires a fully-qualified absolute URL (e.g. http://localhost:8080/api/auth).
  // Passing a relative path like "/api/auth" causes a TypeError inside BetterAuth's URL constructor.
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/auth`;
  }

  return "http://localhost:5000/api/auth";
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
});

