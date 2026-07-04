import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { isAuthenticated, getSession } from "@/lib/auth";
import { AdminLayout } from "@/components/admin-layout"
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nexa = localFont({
  src: [
    { path: "../../public/nexa/Nexa-ExtraLight.ttf", weight: "100 300", style: "normal" },
    { path: "../../public/nexa/Nexa-Heavy.ttf", weight: "400 900", style: "normal" },
  ],
  variable: "--font-nexa",
  display: "swap",
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
  themeColor: "#f7f6f2",
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
  const session = await getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("campnav-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${nexa.variable} antialiased selection:bg-primary/25`}>
        <Toaster position="top-right" richColors closeButton />
        <ConvexClientProvider>
          {isAuth ? (
            <AdminLayout session={session}>
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
