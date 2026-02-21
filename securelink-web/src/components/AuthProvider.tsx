"use client";

import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "@/lib/authConfig";
import { ReactNode } from "react";

const msalInstance = new PublicClientApplication(msalConfig);

export function AuthProvider({ children }: { children: ReactNode }) {
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
