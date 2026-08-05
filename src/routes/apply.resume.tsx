import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Alias route for the emailed "Resume application" link.
 *
 * The backend email may point at /apply/resume?token=<jwt> (matching the API's
 * own body naming) instead of the canonical /apply?resumeToken=<jwt>, which
 * previously produced a hard 404. This route accepts either param name and
 * hands off to /apply, where the draft rehydration lives.
 */
export const Route = createFileRoute("/apply/resume")({
  validateSearch: (search: Record<string, unknown>): { token?: string; resumeToken?: string } => ({
    token: search.token as string | undefined,
    resumeToken: search.resumeToken as string | undefined,
  }),
  beforeLoad: ({ search }) => {
    const token = search.resumeToken ?? search.token;
    throw redirect({
      to: "/apply",
      search: token ? { resumeToken: token } : {},
      replace: true,
    });
  },
  component: () => null,
});
