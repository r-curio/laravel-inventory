import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Package, Store, User, BarChart3 } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Store Masterfile',
        href: '/store-masterfile',
        icon: Store,
        roles: ['admin'], // Only show for admin users
    },
    {
        title: 'Item Masterfile',
        href: '/item-masterfile',
        icon: Package,
        roles: ['admin'], // Only show for admin users
    },
    {
        title: 'Stock Level',
        href: '/stock-level',
        icon: BarChart3,
        roles: ['admin'], // Only show for admin users
    },
    {
        title: 'Diser Masterfile',
        href: '/diser-masterfile',
        icon: User,
        roles: ['admin'], // Only show for admin users
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    // Filter navigation items based on user role
    const filteredNavItems = mainNavItems.filter(item => {
        // If no roles specified, show to everyone
        if (!item.roles) {
            return true;
        }
        
        // If user is not logged in, don't show role-restricted items
        if (!user) {
            return false;
        }
        
        // Check if user has any of the required roles
        return item.roles.includes(user.role);
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
