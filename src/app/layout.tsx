import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { isAuthenticated } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Megaphone,
  ClipboardList,
  MessageSquare,
  Home,
  Package,
  Bell
} from "lucide-react";

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
            <div className="flex min-h-screen bg-transparent">
              {/* Sidebar */}
              <aside className="fixed inset-y-0 left-0 w-64 glass-card rounded-none border-y-0 border-l-0 border-r-white/10 flex flex-col p-6 z-20">
                <div className="mb-10 flex items-center space-x-3 px-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <LayoutDashboard size={18} className="text-white" />
                  </div>
                  <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-indigo-100">
                    CAMPNAV Admin
                  </h1>
                </div>

                <nav className="flex-1 space-y-1">
                  {[
                    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
                    { name: 'Users', href: '/users', icon: Users },
                    { name: 'Orders', href: '/orders', icon: ShoppingCart },
                    { name: 'Products', href: '/products', icon: Package },
                    { name: 'Updates', href: '/announcements', icon: Megaphone },
                    { name: 'Assignments', href: '/housekeeping', icon: ClipboardList },
                    { name: 'Requests', href: '/requests', icon: Bell },
                    { name: 'Reports', href: '/reports', icon: MessageSquare },
                    { name: 'Rooms', href: '/rooms', icon: Home },
                  ].map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-blue-200/60 hover:text-white hover:bg-white/10 transition-all group"
                    >
                      <item.icon size={18} className="group-hover:scale-110 transition-transform" />
                      <span>{item.name}</span>
                    </a>
                  ))}

                  <LogoutButton />
                </nav>

                <div className="mt-auto pt-6 border-t border-white/10">
                  <div className="glass-card p-4 rounded-xl bg-indigo-500/5">
                    <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1">System Status</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-white/60">Deployment Active</span>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
                <div className="max-w-7xl mx-auto py-8 px-4">
                  {children}
                </div>
              </main>
            </div>
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
