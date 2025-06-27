import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User | null;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    roles?: string[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Store {
    id: number;
    name: string;
    co: string;
    dc: string;
    is_processed: boolean;
    [key: string]: unknown;
}

export interface Item {
    id: number;
    name: string;
    sku: string;
    barcode: string;
    price: number;
    [key: string]: unknown;
}

export interface StoreItem {
    id: number;
    store_id: number;
    item_id: number;
    order: number;
    inventory: number;
    dr_6578: number;
    dr_958: number;
    pic_53: number;
    total: number;
    s_divide_2: number;
    s_order_2: number;
    s_order_5: number;
    final_order: number;
    store: Store;
    item: Item;
    [key: string]: unknown;
}
