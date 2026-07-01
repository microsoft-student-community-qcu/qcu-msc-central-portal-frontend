// Frontend-only "portal auth" helper. Persists a fake user in localStorage so
// the demo can show role-based portals without a backend. NOT secure — for
// UX prototyping only.

import { useEffect, useState } from "react";

export type PortalRole = "applicant" | "member" | "restricted";

export type PortalUser = {
  email: string;
  fullName: string;
  studentNumber: string;
  role: PortalRole;
};

const KEY = "qcumsc.portalUser";
const EVT = "qcumsc:portalUser-changed";

// Demo accounts. Any password works in this prototype.
export const DEMO_ACCOUNTS: PortalUser[] = [
  {
    email: "applicant@qcu.edu.ph",
    fullName: "Alex P. Cruz",
    studentNumber: "24-1042",
    role: "applicant",
  },
  {
    email: "member@qcu.edu.ph",
    fullName: "Maya R. Salonga",
    studentNumber: "23-8812",
    role: "member",
  },
  {
    email: "restricted@qcu.edu.ph",
    fullName: "Jordan T. Rivera",
    studentNumber: "22-4477",
    role: "restricted",
  },
];

export function getPortalUser(): PortalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PortalUser) : null;
  } catch {
    return null;
  }
}

export function setPortalUser(user: PortalUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) localStorage.setItem(KEY, JSON.stringify(user));
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVT));
  } catch {
    /* ignore */
  }
}

export function usePortalUser(): PortalUser | null {
  const [user, setUser] = useState<PortalUser | null>(() => getPortalUser());
  useEffect(() => {
    const sync = () => setUser(getPortalUser());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return user;
}

export function routeForRole(role: PortalRole): "/portal/tracking" | "/portal/dashboard" | "/portal/restricted" {
  if (role === "member") return "/portal/dashboard";
  if (role === "restricted") return "/portal/restricted";
  return "/portal/tracking";
}
