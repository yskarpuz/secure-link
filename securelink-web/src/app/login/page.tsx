"use client";

import { useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { loginRequest } from "@/lib/authConfig";
import { useBranding } from "@/components/BrandingProvider";
import { ShieldIcon } from "lucide-react";

export default function LoginPage() {
  const { instance, accounts } = useMsal();
  const router = useRouter();
  const branding = useBranding();

  useEffect(() => {
    if (accounts.length > 0) {
      router.push("/");
    }
  }, [accounts, router]);

  const handleLogin = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            {branding.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt={branding.appName} 
                className="w-20 h-20 mx-auto mb-4 rounded-xl object-contain"
              />
            ) : (
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <ShieldIcon size={40} className="text-white" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {branding.appName}
            </h1>
            <p className="text-gray-600">
              Secure File Sharing Platform
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 text-center text-sm">
              Sign in with your Microsoft account to access your secure vault
            </p>

            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              Sign in with Microsoft
            </button>

            <div className="text-center mt-6">
              <p className="text-gray-500 text-xs">
                Secured with Microsoft Entra ID
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            © 2024 {branding.appName}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
