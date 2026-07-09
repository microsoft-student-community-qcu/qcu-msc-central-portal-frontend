import { createAuthClient } from "better-auth/react";

const getAuthBaseURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  try {
    return new URL(apiUrl).origin;
  } catch {
    return "/";
  }
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
});
