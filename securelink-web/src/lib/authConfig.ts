import { Configuration, LogLevel } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "3bc2dfaa-e11a-4746-b361-809294173960",
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || "0054d8ee-239f-4606-97c3-151e0671b64f"}`,
    redirectUri: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    postLogoutRedirectUri: typeof window !== "undefined" ? window.location.origin + "/login" : "http://localhost:3000/login",
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
    },
  },
};
//6a93d122-bbf3-4597-ae31-fec5933e0dad
export const loginRequest = {
  scopes: [
    `api://${process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "3bc2dfaa-e11a-4746-b361-809294173960"}/access_as_user`
  ],
  prompt: "select_account",
};
