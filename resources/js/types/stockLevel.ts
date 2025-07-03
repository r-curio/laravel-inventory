export interface StockLevel {
    id: number;
    store_name: string;
    name: string;
    co: string;
    class: string;
    order: string;
    created_at?: string;
    updated_at?: string;
}

export interface StockLevelCombination {
    store_name: string;
    class: string;
    co: string;
} 