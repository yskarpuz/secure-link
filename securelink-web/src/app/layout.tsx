import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { BrandingProvider } from "@/components/BrandingProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SecureShare - Encrypted File Sharing",
  description: "Secure file sharing with burn-after-download and expiry",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';
  
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.VERSION = '${appVersion}';
              window.VERSION_API = '${appVersion}';
              fetch('/api/config/version')
                .then(res => res.json())
                .then(data => {
                  window.VERSION_API = data.version || data.api || '${appVersion}';
                  console.log('FileShare Version:', window.VERSION, '| API:', window.VERSION_API);
                })
                .catch(() => console.warn('Could not fetch API version'));
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <BrandingProvider>
          <AuthProvider>{children}</AuthProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}