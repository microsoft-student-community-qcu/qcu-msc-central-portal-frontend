export interface OfficeOption {
  label: string;
  value: string;
}

export const OFFICES = [
  { label: "Secretariat Office", value: "SECRETARIAT_OFFICE" },
  { label: "Relations Office", value: "RELATIONS_OFFICE" },
  { label: "Finance Office", value: "FINANCE_OFFICE" },
  { label: "Logistics Office", value: "LOGISTICS_OFFICE" },
  { label: "Creatives Office", value: "CREATIVES_OFFICE" },
  { label: "Management & Development Office", value: "MANAGEMENT_AND_DEVELOPMENT_OFFICE" },
  { label: "Startup Developers Office", value: "STARTUP_DEVELOPERS_OFFICE" },
] as const;

export type OfficeValue = (typeof OFFICES)[number]["value"];
