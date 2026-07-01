export type EventStatus = "upcoming" | "past";

export type FullEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  tag: string;
  blurb: string;
  accent: string;
  status: EventStatus;
  attendees?: number;
  image?: string;
  priorityStartDate?: string;
  generalStartDate?: string;
};

export const EVENTS: FullEvent[] = [
  {
    id: "ai-launchpad",
    title: "AI Launchpad: Build with Copilot",
    date: "Jul 12, 2026",
    time: "9:00 AM – 6:00 PM",
    location: "QCU Innovation Hub",
    tag: "Hackathon",
    blurb:
      "A full-day build sprint powered by GitHub Copilot and Azure AI — ship a working prototype before sundown.",
    accent: "var(--brand-orange)",
    status: "upcoming",
    priorityStartDate: "Jun 28",
    generalStartDate: "Jul 1",
  },
  {
    id: "cloud-clinic",
    title: "Cloud Clinic: Azure Fundamentals",
    date: "Jul 26, 2026",
    time: "1:00 PM – 5:00 PM",
    location: "Room 504, Main Building",
    tag: "Workshop",
    blurb:
      "Hands-on lab covering identity, storage, and serverless — leave with a deployable starter and AZ-900 prep notes.",
    accent: "var(--brand-green)",
    status: "upcoming",
    priorityStartDate: "Jul 12",
    generalStartDate: "Jul 15",
  },
  {
    id: "design-jam",
    title: "Design Jam: Inclusive Interfaces",
    date: "Aug 9, 2026",
    time: "10:00 AM – 4:00 PM",
    location: "QCU Creative Studio",
    tag: "Community",
    blurb:
      "Pair up with designers and devs to reimagine campus tools through an accessibility-first lens.",
    accent: "var(--brand-blue)",
    status: "upcoming",
  },
  {
    id: "github-universe-watch",
    title: "GitHub Universe Watch Party",
    date: "Aug 23, 2026",
    time: "7:00 PM – 10:00 PM",
    location: "Online · Discord",
    tag: "Community",
    blurb:
      "Tune in together for keynote highlights, then huddle in breakouts to swap takeaways and ship-it ideas.",
    accent: "var(--brand-yellow)",
    status: "upcoming",
  },
  {
    id: "msc-onboarding-2026",
    title: "MSC Onboarding 2026",
    date: "Jun 14, 2026",
    time: "9:00 AM – 12:00 PM",
    location: "QCU Auditorium",
    tag: "Community",
    blurb:
      "Welcomed the new cohort with track intros, leadership panels, and a tour of this year's roadmap.",
    accent: "var(--brand-blue)",
    status: "past",
    attendees: 220,
  },
  {
    id: "hack-the-odds-2026",
    title: "Hack the Odds 2026",
    date: "May 17, 2026",
    time: "24-hour sprint",
    location: "QCU Innovation Hub",
    tag: "Hackathon",
    blurb:
      "Our flagship overnight hackathon — 38 teams, 14 mentors, and one very dramatic demo night.",
    accent: "var(--brand-orange)",
    status: "past",
    attendees: 180,
  },
  {
    id: "azure-bootcamp",
    title: "Azure Bootcamp: From Zero to Deploy",
    date: "Apr 6, 2026",
    time: "9:00 AM – 4:00 PM",
    location: "Room 504, Main Building",
    tag: "Workshop",
    blurb:
      "A weekend deep-dive into resource groups, App Service, and CI/CD with GitHub Actions.",
    accent: "var(--brand-green)",
    status: "past",
    attendees: 95,
  },
  {
    id: "women-in-tech-panel",
    title: "Women in Tech: Defying the Odds",
    date: "Mar 8, 2026",
    time: "2:00 PM – 5:00 PM",
    location: "QCU Auditorium",
    tag: "Talk",
    blurb:
      "A panel of engineers, founders, and PMs on building careers that don't fit the mold.",
    accent: "var(--brand-yellow)",
    status: "past",
    attendees: 140,
  },
  {
    id: "copilot-study-jam",
    title: "Copilot Study Jam",
    date: "Feb 22, 2026",
    time: "1:00 PM – 4:00 PM",
    location: "Online · Teams",
    tag: "Workshop",
    blurb:
      "Walked through prompt patterns, code reviews, and pair-programming flows with GitHub Copilot.",
    accent: "var(--brand-blue)",
    status: "past",
    attendees: 110,
  },
];

export function findEvent(id: string): FullEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}
