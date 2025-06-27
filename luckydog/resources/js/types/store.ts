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
    items_on_order: string;
    items_overstock: string;
    code: string;
    po_or_limit: string;
    items_not_allowed: string;
    items_order: string;
    others: string;
    others_2: string;
    others_3: string;
    date: string;
    dgcage_comment: string;
    tshirt_comment: string;
    litter_box_comment: string;
    pet_bed_comment: string;
    diser_fb_name: string;
    diser_company_sv: string;
    diser_hold_stop_allow: string;
};

export type PendingUpdate = {
    id: number;
    changes: Record<string, string>;
};

export type DashboardProps = {
    stores: Store[];
};
