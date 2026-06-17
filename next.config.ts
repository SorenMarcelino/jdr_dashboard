import type { NextConfig } from "next";

// La Content-Security-Policy est gérée par `src/middleware.ts` (stratégie par
// nonce). Les autres en-têtes de sécurité, statiques, restent ici.
const nextConfig: NextConfig = {
  // Build autonome pour une image Docker légère (next start sans node_modules complet)
  output: "standalone",
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
