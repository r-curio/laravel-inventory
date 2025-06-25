export type Barcode = {
    id: number;
    item_id: number;
    name: string;
    begbal: number;
    m30: number;
    apollo: number;
    site3: number;
    total: number;
    actual: number;
    purchase: number;
    returns: number;
    damaged: number;
    endbal: number;
    final_total: number;
    s_request: number;
    f_request: number;
    notes: string;
    condition: string;
    // Additional properties from the backend join
    item_name?: string;
    // Additional properties for factory grouping
    factory_value?: number;
    factory_name?: string;
    reorder_point?: number;
};
