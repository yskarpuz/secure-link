export interface BrandingConfig {
    appName: string;
    logoUrl?: string;
  }
  
  export const DEFAULT_BRANDING: BrandingConfig = {
    appName: "SecureShare",
    logoUrl: undefined,
  };