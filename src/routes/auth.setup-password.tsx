import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/setup-password")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: search.token as string | undefined,
    };
  },
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/apply/account",
      search: {
        token: search.token,
      },
    });
  },
});
