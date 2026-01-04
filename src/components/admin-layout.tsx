"use client"

import { useState } from "react";
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
    Bell,
    Menu,
    X
} from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Orders', href: '/orders', icon: ShoppingCart },
        { name: 'Products', href: '/products', icon: Package },
        { name: 'Updates', href: '/announcements', icon: Megaphone },
        { name: 'Activities', href: '/activities', icon: Bell },
        { name: 'Assignments', href: '/housekeeping', icon: ClipboardList },
        { name: 'Requests', href: '/requests', icon: Bell },
        { name: 'Reports', href: '/reports', icon: MessageSquare },
        { name: 'Rooms', href: '/rooms', icon: Home },
    ];

    return (
        <div className="flex min-h-screen bg-transparent">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass-card border-b border-white/10 flex items-center justify-between px-4 z-30">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <LayoutDashboard size={18} className="text-white" />
                    </div>
                    <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-indigo-100">
                        CAMPNAV Admin
                    </h1>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                    {mobileMenuOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 glass-card rounded-none border-y-0 border-l-0 border-r-white/10 flex flex-col p-6 z-50 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0 md:z-20`}>
                <div className="mb-10 flex items-center space-x-3 px-2 mt-16 md:mt-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 hidden md:flex">
                        <LayoutDashboard size={18} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-indigo-100 hidden md:block">
                        CAMPNAV Admin
                    </h1>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
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
            <main className="flex-1 ml-0 md:ml-64 min-h-screen overflow-y-auto pt-16 md:pt-0">
                <div className="max-w-7xl mx-auto py-4 md:py-8 px-4">
                    {children}
                </div>
            </main>
        </div>
    );
}
