import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store } from '@/types/store';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

interface AddStoreModalProps {
    onStoreAdded: (store: Store) => void;
}

export function AddStoreModal({ onStoreAdded }: AddStoreModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        co: '',
        dc: '',
        dr_stamped: '',
        area_size: '',
        overstock: '',
        ratbites: '',
        closed: '',
        no_diser: '',
        class: '',
        pullout_status: '',
        dgcage_status: '',
        tshirt_status: '',
        litter_box_status: '',
        pet_bed_status: '',
        gondola_dep: '',
        date_depo_refund: '',
        missing_deliveries: '',
        items_on_order: '',
        items_overstock: '',
        code: '',
        po_or_limit: '',
        items_not_allowed: '',
        items_order: '',
        others: '',
        others_2: '',
        others_3: '',
        date: '',
        dgcage_comment: '',
        tshirt_comment: '',
        litter_box_comment: '',
        pet_bed_comment: '',
        diser_fb_name: '',
        diser_company_sv: '',
        diser_hold_stop_allow: '',
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validate required fields
            if (!formData.name.trim()) {
                toast.error('Store name is required');
                return;
            }

            const response = await axios.post('/stores', {
                name: formData.name,
                co: formData.co,
                dc: formData.dc,
                dr_stamped: formData.dr_stamped,
                area_size: formData.area_size,
                overstock: formData.overstock,
                ratbites: formData.ratbites,
                closed: formData.closed,
                no_diser: formData.no_diser,
                class: formData.class,
                pullout_status: formData.pullout_status,
                dgcage_status: formData.dgcage_status,
                tshirt_status: formData.tshirt_status,
                litter_box_status: formData.litter_box_status,
                pet_bed_status: formData.pet_bed_status,
                gondola_dep: formData.gondola_dep,
                date_depo_refund: formData.date_depo_refund,
                missing_deliveries: formData.missing_deliveries,
                items_on_order: formData.items_on_order,
                items_overstock: formData.items_overstock,
                code: formData.code,
                po_or_limit: formData.po_or_limit,
                items_not_allowed: formData.items_not_allowed,
                items_order: formData.items_order,
                others: formData.others,
                others_2: formData.others_2,
                others_3: formData.others_3,
                date: formData.date,
                dgcage_comment: formData.dgcage_comment,
                tshirt_comment: formData.tshirt_comment,
                litter_box_comment: formData.litter_box_comment,
                pet_bed_comment: formData.pet_bed_comment,
                diser_fb_name: formData.diser_fb_name,
                diser_company_sv: formData.diser_company_sv,
                diser_hold_stop_allow: formData.diser_hold_stop_allow,
            });

            onStoreAdded(response.data.store);
            toast.success('Store created successfully');
            handleClose();
        } catch (error: any) {
            console.error('Error creating store:', error);
            toast.error(error.response?.data?.message || 'Failed to create store');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setFormData({
            name: '',
            co: '',
            dc: '',
            dr_stamped: '',
            area_size: '',
            overstock: '',
            ratbites: '',
            closed: '',
            no_diser: '',
            class: '',
            pullout_status: '',
            dgcage_status: '',
            tshirt_status: '',
            litter_box_status: '',
            pet_bed_status: '',
            gondola_dep: '',
            date_depo_refund: '',
            missing_deliveries: '',
            items_on_order: '',
            items_overstock: '',
            code: '',
            po_or_limit: '',
            items_not_allowed: '',
            items_order: '',
            others: '',
            others_2: '',
            others_3: '',
            date: '',
            dgcage_comment: '',
            tshirt_comment: '',
            litter_box_comment: '',
            pet_bed_comment: '',
            diser_fb_name: '',
            diser_company_sv: '',
            diser_hold_stop_allow: '',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setIsOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Store
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Store</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to create a new store in the masterfile.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" className="text-sm font-medium">
                                    Store Name *
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Enter store name"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="co" className="text-sm font-medium">
                                    CO *
                                </Label>
                                <Input
                                    id="co"
                                    value={formData.co}
                                    onChange={(e) => handleInputChange('co', e.target.value)}
                                    placeholder="Enter CO"
                                    required
                                />
                            </div>

                            <div>   
                                <Label htmlFor="dc" className="text-sm font-medium">
                                    DC
                                </Label>
                                <Input
                                    id="dc"
                                    value={formData.dc}
                                    onChange={(e) => handleInputChange('dc', e.target.value)}
                                    placeholder="Enter DC"
                                />
                            </div>

                            <div>
                                <Label htmlFor="dr_stamped" className="text-sm font-medium">
                                    DR Stamped
                                </Label>
                                <Input
                                    id="dr_stamped"
                                    value={formData.dr_stamped}
                                    onChange={(e) => handleInputChange('dr_stamped', e.target.value)}
                                    placeholder="Enter DR Stamped"
                                />
                            </div>

                            <div>
                                <Label htmlFor="area_size" className="text-sm font-medium">
                                    Area Size
                                </Label>
                                <Input
                                    id="area_size"
                                    value={formData.area_size}
                                    onChange={(e) => handleInputChange('area_size', e.target.value)}
                                    placeholder="Enter area size"
                                />
                            </div>

                            <div>
                                <Label htmlFor="overstock" className="text-sm font-medium">
                                    Overstock
                                </Label>
                                <Input
                                    id="overstock"
                                    value={formData.overstock}
                                    onChange={(e) => handleInputChange('overstock', e.target.value)}
                                    placeholder="Enter overstock"
                                />
                            </div>

                            <div>
                                <Label htmlFor="ratbites" className="text-sm font-medium">
                                    Ratbites
                                </Label>
                                <Input
                                    id="ratbites"
                                    value={formData.ratbites}
                                    onChange={(e) => handleInputChange('ratbites', e.target.value)}
                                    placeholder="Enter ratbites"
                                />
                            </div>

                            <div>
                                <Label htmlFor="closed" className="text-sm font-medium">
                                    Closed
                                </Label>
                                <Input
                                    id="closed"
                                    value={formData.closed}
                                    onChange={(e) => handleInputChange('closed', e.target.value)}
                                    placeholder="Enter closed status"
                                />
                            </div>

                            <div>
                                <Label htmlFor="no_diser" className="text-sm font-medium">
                                    No Diser
                                </Label>
                                <Input
                                    id="no_diser"
                                    value={formData.no_diser}
                                    onChange={(e) => handleInputChange('no_diser', e.target.value)}
                                    placeholder="Enter no diser"
                                />
                            </div>

                            <div>
                                <Label htmlFor="class" className="text-sm font-medium">
                                    Class
                                </Label>
                                <Input
                                    id="class"
                                    value={formData.class}
                                    onChange={(e) => handleInputChange('class', e.target.value)}
                                    placeholder="Enter class"
                                />
                            </div>
                        </div>

                        {/* Status Information */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="pullout_status" className="text-sm font-medium">
                                    Pullout Status
                                </Label>
                                <Input
                                    id="pullout_status"
                                    value={formData.pullout_status}
                                    onChange={(e) => handleInputChange('pullout_status', e.target.value)}
                                    placeholder="Enter pullout status"
                                />
                            </div>

                            <div>
                                <Label htmlFor="dgcage_status" className="text-sm font-medium">
                                    Dgcage Status
                                </Label>
                                <Input
                                    id="dgcage_status"
                                    value={formData.dgcage_status}
                                    onChange={(e) => handleInputChange('dgcage_status', e.target.value)}
                                    placeholder="Enter dgcage status"
                                />
                            </div>

                            <div>
                                <Label htmlFor="tshirt_status" className="text-sm font-medium">
                                    Tshirt Status
                                </Label>
                                <Input
                                    id="tshirt_status"
                                    value={formData.tshirt_status}
                                    onChange={(e) => handleInputChange('tshirt_status', e.target.value)}
                                    placeholder="Enter tshirt status"
                                />
                            </div>

                            <div>
                                <Label htmlFor="litter_box_status" className="text-sm font-medium">
                                    Litter Box Status
                                </Label>
                                <Input
                                    id="litter_box_status"
                                    value={formData.litter_box_status}
                                    onChange={(e) => handleInputChange('litter_box_status', e.target.value)}
                                    placeholder="Enter litter box status"
                                />
                            </div>

                            <div>
                                <Label htmlFor="pet_bed_status" className="text-sm font-medium">
                                    Pet Bed Status
                                </Label>
                                <Input
                                    id="pet_bed_status"
                                    value={formData.pet_bed_status}
                                    onChange={(e) => handleInputChange('pet_bed_status', e.target.value)}
                                    placeholder="Enter pet bed status"
                                />
                            </div>

                            <div>
                                <Label htmlFor="gondola_dep" className="text-sm font-medium">
                                    Gondola Dep
                                </Label>
                                <Input
                                    id="gondola_dep"
                                    value={formData.gondola_dep}
                                    onChange={(e) => handleInputChange('gondola_dep', e.target.value)}
                                    placeholder="Enter gondola dep"
                                />
                            </div>

                            <div>
                                <Label htmlFor="date_depo_refund" className="text-sm font-medium">
                                    Date Depo Refund
                                </Label>
                                <Input
                                    id="date_depo_refund"
                                    type="date"
                                    value={formData.date_depo_refund}
                                    onChange={(e) => handleInputChange('date_depo_refund', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="missing_deliveries" className="text-sm font-medium">
                                    Missing Deliveries
                                </Label>
                                <Input
                                    id="missing_deliveries"
                                    value={formData.missing_deliveries}
                                    onChange={(e) => handleInputChange('missing_deliveries', e.target.value)}
                                    placeholder="Enter missing deliveries"
                                />
                            </div>

                            <div>
                                <Label htmlFor="items_on_order" className="text-sm font-medium">
                                    Items On Order
                                </Label>
                                <Input
                                    id="items_on_order"
                                    value={formData.items_on_order}
                                    onChange={(e) => handleInputChange('items_on_order', e.target.value)}
                                    placeholder="Enter items on order"
                                />
                            </div>

                            <div>
                                <Label htmlFor="items_overstock" className="text-sm font-medium">
                                    Items Overstock
                                </Label>
                                <Input
                                    id="items_overstock"
                                    value={formData.items_overstock}
                                    onChange={(e) => handleInputChange('items_overstock', e.target.value)}
                                    placeholder="Enter items overstock"
                                />
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="code" className="text-sm font-medium">
                                    Code
                                </Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => handleInputChange('code', e.target.value)}
                                    placeholder="Enter code"
                                />
                            </div>

                            <div>
                                <Label htmlFor="po_or_limit" className="text-sm font-medium">
                                    PO or Limit
                                </Label>
                                <Input
                                    id="po_or_limit"
                                    value={formData.po_or_limit}
                                    onChange={(e) => handleInputChange('po_or_limit', e.target.value)}
                                    placeholder="Enter PO or limit"
                                />
                            </div>

                            <div>
                                <Label htmlFor="items_not_allowed" className="text-sm font-medium">
                                    Items Not Allowed
                                </Label>
                                <Input
                                    id="items_not_allowed"
                                    value={formData.items_not_allowed}
                                    onChange={(e) => handleInputChange('items_not_allowed', e.target.value)}
                                    placeholder="Enter items not allowed"
                                />
                            </div>

                            <div>
                                <Label htmlFor="items_order" className="text-sm font-medium">
                                    Items Order
                                </Label>
                                <Input
                                    id="items_order"
                                    value={formData.items_order}
                                    onChange={(e) => handleInputChange('items_order', e.target.value)}
                                    placeholder="Enter items order"
                                />
                            </div>

                            <div>
                                <Label htmlFor="diser_fb_name" className="text-sm font-medium">
                                    Diser FB Name
                                </Label>
                                <Input
                                    id="diser_fb_name"
                                    value={formData.diser_fb_name}
                                    onChange={(e) => handleInputChange('diser_fb_name', e.target.value)}
                                    placeholder="Enter diser FB name"
                                />
                            </div>

                            <div>
                                <Label htmlFor="diser_company_sv" className="text-sm font-medium">
                                    Diser Company SV
                                </Label>
                                <Input
                                    id="diser_company_sv"
                                    value={formData.diser_company_sv}
                                    onChange={(e) => handleInputChange('diser_company_sv', e.target.value)}
                                    placeholder="Enter diser company SV"
                                />
                            </div>

                            <div>
                                <Label htmlFor="diser_hold_stop_allow" className="text-sm font-medium">
                                    Diser Hold Stop Allow
                                </Label>
                                <Input
                                    id="diser_hold_stop_allow"
                                    value={formData.diser_hold_stop_allow}
                                    onChange={(e) => handleInputChange('diser_hold_stop_allow', e.target.value)}
                                    placeholder="Enter diser hold stop allow"
                                />
                            </div>

                            <div>
                                <Label htmlFor="date" className="text-sm font-medium">
                                    Date
                                </Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => handleInputChange('date', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="dgcage_comment" className="text-sm font-medium">
                                Dgcage Comment
                            </Label>
                            <Input
                                id="dgcage_comment"
                                value={formData.dgcage_comment}
                                onChange={(e) => handleInputChange('dgcage_comment', e.target.value)}
                                placeholder="Enter dgcage comment"
                            />
                        </div>

                        <div>
                            <Label htmlFor="tshirt_comment" className="text-sm font-medium">
                                Tshirt Comment
                            </Label>
                            <Input
                                id="tshirt_comment"
                                value={formData.tshirt_comment}
                                onChange={(e) => handleInputChange('tshirt_comment', e.target.value)}
                                placeholder="Enter tshirt comment"
                            />
                        </div>

                        <div>
                            <Label htmlFor="litter_box_comment" className="text-sm font-medium">
                                Litter Box Comment
                            </Label>
                            <Input
                                id="litter_box_comment"
                                value={formData.litter_box_comment}
                                onChange={(e) => handleInputChange('litter_box_comment', e.target.value)}
                                placeholder="Enter litter box comment"
                            />
                        </div>

                        <div>
                            <Label htmlFor="pet_bed_comment" className="text-sm font-medium">
                                Pet Bed Comment
                            </Label>
                            <Input
                                id="pet_bed_comment"
                                value={formData.pet_bed_comment}
                                onChange={(e) => handleInputChange('pet_bed_comment', e.target.value)}
                                placeholder="Enter pet bed comment"
                            />
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="others" className="text-sm font-medium">
                                Notes 1
                            </Label>
                            <Input
                                id="others"
                                value={formData.others}
                                onChange={(e) => handleInputChange('others', e.target.value)}
                                placeholder="Enter notes"
                            />
                        </div>

                        <div>
                            <Label htmlFor="others_2" className="text-sm font-medium">
                                Notes 2
                            </Label>
                            <Input
                                id="others_2"
                                value={formData.others_2}
                                onChange={(e) => handleInputChange('others_2', e.target.value)}
                                placeholder="Enter notes"
                            />
                        </div>

                        <div>
                            <Label htmlFor="others_3" className="text-sm font-medium">
                                Notes 3
                            </Label>
                            <Input
                                id="others_3"
                                value={formData.others_3}
                                onChange={(e) => handleInputChange('others_3', e.target.value)}
                                placeholder="Enter notes"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Store'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 