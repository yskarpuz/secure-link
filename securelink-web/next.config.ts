import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // API proxying is handled by Azure Static Web Apps linked backend.
  // See staticwebapp.config.json and the infra/modules/swa.bicep linkedBackends configuration.
};

export default nextConfig;
