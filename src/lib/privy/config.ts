import type { PrivyClientConfig } from "@privy-io/react-auth";

export const privyConfig: PrivyClientConfig = {
  // Login methods
  loginMethods: ["wallet"],

  // Appearance
  appearance: {
    theme: "dark",
    accentColor: "#6366f1", // Indigo-500
    logo: "/logo.svg",
  },
};

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
