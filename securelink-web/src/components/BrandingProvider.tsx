"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_BRANDING, BrandingConfig } from "@/lib/brandingConfig";

const BrandingContext = createContext<BrandingConfig>(DEFAULT_BRANDING);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);

  useEffect(() => {
    fetch("/api/config/branding")
      .then((res) => res.json())
      .then((data) => {
        setBranding({
          appName: data.appName || DEFAULT_BRANDING.appName,
          logoUrl: data.logoUrl,
        });
      })
      .catch(() => {
        console.warn("Failed to load branding config, using defaults");
      });
  }, []);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);