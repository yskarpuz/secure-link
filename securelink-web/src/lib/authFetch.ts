import { IPublicClientApplication } from "@azure/msal-browser";
import { loginRequest } from "./authConfig";

let msalInstance: IPublicClientApplication | null = null;

export function initAuthFetch(instance: IPublicClientApplication) {
  msalInstance = instance;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!msalInstance) {
    throw new Error("MSAL instance not initialized. Call initAuthFetch first.");
  }

  try {
    let account = msalInstance.getActiveAccount();
    const accounts = msalInstance.getAllAccounts();
    
    if (!account && accounts.length > 0) {
      account = accounts[0];
      msalInstance.setActiveAccount(account);
    }
    
    if (account) {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: account
      });
      return {
        "Authorization": `Bearer ${tokenResponse.accessToken}`,
        "Content-Type": "application/json"
      };
    }
  } catch (error) {
    console.error("Error getting auth token:", error);
  }
  
  return { 
    "Content-Type": "application/json"
  };
}

export async function authFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const headers = await getAuthHeaders();
  
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  if (options.body instanceof FormData) {
    delete (mergedOptions.headers as Record<string, string>)["Content-Type"];
  }

  return fetch(url, mergedOptions);
}

export async function authFetchJSON<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await authFetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}
