import { StoreItem } from './storeItem';

export type GroupedItem = {
    item_id: string;
    item_name: string;
    total_final_order: number;
    stores: string[];
    storeItems: StoreItem[];
    assigned_factory?: string;
};
