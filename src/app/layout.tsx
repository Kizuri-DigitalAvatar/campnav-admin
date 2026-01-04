import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { isAuthenticated } from "@/lib/auth";
import { AdminLayout } from "@/components/admin-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CAMPNAV Admin",
  description: "Administrative Dashboard for CAMPNAV",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CAMPNAV Admin",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuth = await isAuthenticated();

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-indigo-500/30`}>
        <ConvexClientProvider>
          {isAuth ? (
            <AdminLayout>
              {children}
            </AdminLayout>
          ) : (
            <main className="min-h-screen">
              {children}
            </main>
          )}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
