import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Désactivé en développement (Turbopack incompatible avec le SW)
  disable: process.env.NODE_ENV === "development",
  // Cache uniquement les assets statiques — les appels API restent NetworkOnly
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false,
  fallbacks: {
    document: "/offline",
  },
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ['primereact'],
};

export default withPWA(nextConfig);
