export type Store = {
    id: number;
    name: string;
    co: string;
    dc: string;
    dr_stamped: string;
    area_size: string;
    overstock: string;
    ratbites: string;
    closed: string;
    no_diser: string;
    class: string;
    pullout_status: string;
    dgcage_status: string;
    tshirt_status: string;
    litter_box_status: string;
    pet_bed_status: string;
    gondola_dep: string;
    date_depo_refund: string;
    missing_deliveries: string;
    items_overstock: string;
    code: string;
    po_or_limit: string;
    items_not_allowed: string;
    items_order: string;
    others: string;
};

export type PendingUpdate = {
    id: number;
    changes: Record<string, string>;
};

export type DashboardProps = {
    stores: Store[];
};
