"use client"

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { AdminNotificationBell } from "@/components/admin-notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { DataPrefetcher } from "@/components/data-prefetcher";
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Megaphone,
    ClipboardList,
    MessageSquare,
    Package,
    Bell,
    Menu,
    X,
    FileText,
    Bed,
    Shield,
    AlertTriangle,
    Send,
    Building,
    Banknote,
    ChefHat,
    Dumbbell,
    CalendarClock,
    ShieldCheck,
    ClipboardCheck,
    ChevronDown,
    ActivitySquare
} from "lucide-react";

type NavItem = {
    name: string;
    href?: string; // omitted for group headers whose children carry the links
    icon: React.ElementType;
    children?: NavItem[];
};

const navSections: { title: string; items: NavItem[] }[] = [
    {
        title: "Overview",
        items: [
            { name: 'Dashboard', href: '/', icon: LayoutDashboard },
            { name: 'Users', href: '/users', icon: Users },
            { name: 'Requests / Tasks', href: '/requests', icon: ClipboardList },
            { name: 'Facilities', href: '/facilities', icon: Dumbbell },
            { name: 'Reports', href: '/reports', icon: MessageSquare },
            { name: 'Preventive Maintenance', href: '/maintenance/preventive', icon: ClipboardCheck },
        ],
    },
    {
        title: "Commerce",
        items: [
            { name: 'Orders', href: '/orders', icon: ShoppingCart },
            { name: 'Products', href: '/products', icon: Package },
            {
                name: 'Room Service', icon: ShoppingCart,
                children: [
                    { name: 'Orders', href: '/room-service', icon: ShoppingCart },
                    { name: 'Menus', href: '/menus', icon: FileText },
                ],
            },
        ],
    },
    {
        title: "Camp Operations",
        items: [
            { name: 'Occupancy', href: '/occupancy', icon: Bed },
            { name: 'Room Management', href: '/room-management', icon: Building },
            { name: 'Access Control', href: '/access-control', icon: ShieldCheck },
            { name: 'RnR / Leave', href: '/rnr', icon: CalendarClock },
            { name: 'Login Logs', href: '/login-logs', icon: ActivitySquare },
        ],
    },
    {
        title: "Safety",
        items: [
            { name: 'Safety Dashboard', href: '/safety', icon: Shield },
            { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
            { name: 'Emergency', href: '/emergency', icon: Send },
        ],
    },
    {
        title: "Content",
        items: [
            { name: 'Updates', href: '/announcements', icon: Megaphone },
            { name: 'Activities', href: '/activities', icon: Bell },
        ],
    },
];

export function AdminLayout({ children, session }: { children: React.ReactNode, session: any }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const userRole = session?.role || "camp_supervisor";
    const sidebarNavRef = useRef<HTMLDivElement>(null);

    const filteredNavSections = navSections.map(section => ({
        ...section,
        items: section.items.filter(item => {
            if (userRole === "camp_manager") return true;
            
            // Restrictions for camp_supervisor
            const restricted = ["/users", "/access-control", "/login-logs"];
            return !item.href || !restricted.includes(item.href);
        })
    })).filter(section => section.items.length > 0);

    const initialOpenSections = filteredNavSections.reduce((acc, section) => {
        acc[section.title] = true;
        return acc;
    }, {} as Record<string, boolean>);
    const [openSections, setOpenSections] = useState(initialOpenSections);

    useEffect(() => {
        setOpenSections((current) => {
            const next = { ...current };
            filteredNavSections.forEach((section) => {
                const matchesItem = (item: NavItem): boolean =>
                    (!!item.href && (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)))) ||
                    (item.children?.some(matchesItem) ?? false);
                if (section.items.some(matchesItem)) {
                    next[section.title] = true;
                }
            });
            return next;
        });
    }, [pathname]);

    useEffect(() => {
        // Scroll to active item after component mounts and sections are updated
        const timeoutId = setTimeout(() => {
            if (sidebarNavRef.current) {
                const activeElement = sidebarNavRef.current.querySelector('a.bg-primary');
                if (activeElement) {
                    activeElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }
        }, 100); // Small delay to ensure DOM is updated

        return () => clearTimeout(timeoutId);
    }, [pathname, openSections]);

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="flex min-h-screen bg-background">
            {/* Warm all tab data on login so navigation is instant */}
            <DataPrefetcher />
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass-panel border-b flex items-center justify-between px-4 z-30">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl tile-3d-primary text-primary-foreground font-extrabold text-sm">
                        CN
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-[10px] font-black uppercase tracking-widest text-primary leading-tight">
                            CAMPNAV
                        </h1>
                        <h2 className="text-sm font-bold tracking-tight">
                            {userRole === "camp_manager" ? "Super Admin" : "Manager Portal"}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <AdminNotificationBell userId={session?.userId} />
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        {mobileMenuOpen ? <X size={24} className="text-foreground" /> : <Menu size={24} className="text-foreground" />}
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-foreground/25 backdrop-blur-md z-40"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 glass-panel border-r shadow-card flex flex-col p-6 z-50 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0 md:z-20`}>
                <div className="mb-10 flex items-center justify-between px-2 mt-16 md:mt-0">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl tile-3d-primary text-primary-foreground font-extrabold shrink-0">
                            CN
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-[11px] font-black uppercase tracking-widest text-primary leading-tight">
                                CAMPNAV
                            </h1>
                            <h2 className="text-lg font-bold tracking-tight hidden md:block">
                                {userRole === "camp_manager" ? "Super Admin" : "Manager"}
                            </h2>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <AdminNotificationBell userId={session?.userId} />
                    </div>
                </div>

                <nav ref={sidebarNavRef} className="flex-1 space-y-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted">
                    {filteredNavSections.map((section) => (
                        <div key={section.title} className="space-y-1">
                            <button
                                type="button"
                                onClick={() => setOpenSections((current) => ({ ...current, [section.title]: !current[section.title] }))}
                                className="flex w-full items-center justify-between px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
                            >
                                <span>{section.title}</span>
                                <ChevronDown
                                    size={14}
                                    className={`transition-transform ${openSections[section.title] ? "rotate-180" : ""}`}
                                />
                            </button>
                            {openSections[section.title] && section.items.map((item) => (
                                <div key={item.name}>
                                    {item.href ? (
                                        <a
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive(item.href)
                                                ? 'bg-primary text-primary-foreground shadow-primary-glow'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted hover:translate-x-0.5'
                                                }`}
                                        >
                                            <item.icon size={18} className="group-hover:scale-110 transition-transform" />
                                            <span>{item.name}</span>
                                        </a>
                                    ) : (
                                        <div className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground">
                                            <item.icon size={18} />
                                            <span>{item.name}</span>
                                        </div>
                                    )}
                                    {item.children && (
                                        <div className="ml-6 mt-1 space-y-1 border-l pl-3">
                                            {item.children.map((child) => (
                                                <a
                                                    key={child.name}
                                                    href={child.href}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${child.href && isActive(child.href)
                                                        ? 'bg-primary text-primary-foreground shadow-primary-glow'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted hover:translate-x-0.5'
                                                        }`}
                                                >
                                                    <child.icon size={16} className="group-hover:scale-110 transition-transform" />
                                                    <span>{child.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}

                    <div className="pt-4 mt-4 border-t">
                        <LogoutButton />
                    </div>
                </nav>

                <div className="mt-auto pt-6 border-t flex items-stretch gap-2">
                    <div className="p-4 rounded-2xl tile-3d flex-1 min-w-0">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">System Status</div>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_oklch(0.696_0.17_162.48)]" />
                            <span className="text-xs font-medium truncate">Deployment Active</span>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center">
                        <ThemeToggle className="h-full" />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-0 md:ml-64 min-h-screen pt-16 md:pt-0 dot-grid">
                <div className="max-w-7xl mx-auto py-4 md:py-8 px-4 md:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
