import { createAuthClient } from "better-auth/react";
import { getApiBaseURL } from "./api-config";

const getAuthBaseURL = () => {
  const apiUrl = getApiBaseURL();
  if (!apiUrl) {
    return "/api/auth";
  }
  try {
    if (apiUrl.startsWith("http")) {
      return new URL(apiUrl).origin + "/api/auth";
    }
    return `${apiUrl}/auth`;
  } catch {
    return "/api/auth";
  }
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
});

