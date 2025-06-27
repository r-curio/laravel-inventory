import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Diser } from '@/types/diser';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

interface AddDiserModalProps {
    onDiserAdded: (diser: Diser) => void;
}

export function AddDiserModal({ onDiserAdded }: AddDiserModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        rsc_re: '',
        fb_name: '',
        rate: '',
        sales: '',
        others_1: '',
        hold_stop_allow: '',
        gcash_number: '',
        gcash_name: '',
        sv_only: '',
        company_sv: '',
        others_2: '',
        others_3: '',
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
                toast.error('Diser name is required');
                return;
            }

            const response = await axios.post('/disers', {
                name: formData.name,
                rsc_re: formData.rsc_re,
                fb_name: formData.fb_name,
                rate: formData.rate ? parseFloat(formData.rate) : 0,
                sales: formData.sales ? parseFloat(formData.sales) : 0,
                others_1: formData.others_1,
                hold_stop_allow: formData.hold_stop_allow,
                gcash_number: formData.gcash_number,
                gcash_name: formData.gcash_name,
                sv_only: formData.sv_only,
                company_sv: formData.company_sv,
                others_2: formData.others_2,
                others_3: formData.others_3,
            });

            onDiserAdded(response.data.diser);
            toast.success('Diser created successfully');
            handleClose();
        } catch (error: any) {
            console.error('Error creating diser:', error);
            toast.error(error.response?.data?.message || 'Failed to create diser');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setFormData({
            name: '',
            rsc_re: '',
            fb_name: '',
            rate: '',
            sales: '',
            others_1: '',
            hold_stop_allow: '',
            gcash_number: '',
            gcash_name: '',
            sv_only: '',
            company_sv: '',
            others_2: '',
            others_3: '',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setIsOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Diser
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Diser</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to create a new diser in the masterfile.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" className="text-sm font-medium">
                                    Diser Name *
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Enter diser name"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="rsc_re" className="text-sm font-medium">
                                    RSC RE
                                </Label>
                                <Input
                                    id="rsc_re"
                                    value={formData.rsc_re}
                                    onChange={(e) => handleInputChange('rsc_re', e.target.value)}
                                    placeholder="Enter RSC RE"
                                />
                            </div>

                            <div>
                                <Label htmlFor="fb_name" className="text-sm font-medium">
                                    FB Name
                                </Label>
                                <Input
                                    id="fb_name"
                                    value={formData.fb_name}
                                    onChange={(e) => handleInputChange('fb_name', e.target.value)}
                                    placeholder="Enter FB name"
                                />
                            </div>

                            <div>
                                <Label htmlFor="rate" className="text-sm font-medium">
                                    Rate
                                </Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.rate}
                                    onChange={(e) => handleInputChange('rate', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <Label htmlFor="sales" className="text-sm font-medium">
                                    Sales
                                </Label>
                                <Input
                                    id="sales"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.sales}
                                    onChange={(e) => handleInputChange('sales', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <Label htmlFor="gcash_number" className="text-sm font-medium">
                                    GCash Number
                                </Label>
                                <Input
                                    id="gcash_number"
                                    value={formData.gcash_number}
                                    onChange={(e) => handleInputChange('gcash_number', e.target.value)}
                                    placeholder="Enter GCash number"
                                />
                            </div>

                            <div>
                                <Label htmlFor="gcash_name" className="text-sm font-medium">
                                    GCash Name
                                </Label>
                                <Input
                                    id="gcash_name"
                                    value={formData.gcash_name}
                                    onChange={(e) => handleInputChange('gcash_name', e.target.value)}
                                    placeholder="Enter GCash name"
                                />
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="hold_stop_allow" className="text-sm font-medium">
                                    Hold Stop Allow
                                </Label>
                                <Input
                                    id="hold_stop_allow"
                                    value={formData.hold_stop_allow}
                                    onChange={(e) => handleInputChange('hold_stop_allow', e.target.value)}
                                    placeholder="Enter hold stop allow"
                                />
                            </div>

                            <div>
                                <Label htmlFor="sv_only" className="text-sm font-medium">
                                    SV Only
                                </Label>
                                <Input
                                    id="sv_only"
                                    value={formData.sv_only}
                                    onChange={(e) => handleInputChange('sv_only', e.target.value)}
                                    placeholder="Enter SV only"
                                />
                            </div>

                            <div>
                                <Label htmlFor="company_sv" className="text-sm font-medium">
                                    Company SV
                                </Label>
                                <Input
                                    id="company_sv"
                                    value={formData.company_sv}
                                    onChange={(e) => handleInputChange('company_sv', e.target.value)}
                                    placeholder="Enter company SV"
                                />
                            </div>

                            <div>
                                <Label htmlFor="others_1" className="text-sm font-medium">
                                    Others 1
                                </Label>
                                <Input
                                    id="others_1"
                                    value={formData.others_1}
                                    onChange={(e) => handleInputChange('others_1', e.target.value)}
                                    placeholder="Enter additional info"
                                />
                            </div>

                            <div>
                                <Label htmlFor="others_2" className="text-sm font-medium">
                                    Others 2
                                </Label>
                                <Input
                                    id="others_2"
                                    value={formData.others_2}
                                    onChange={(e) => handleInputChange('others_2', e.target.value)}
                                    placeholder="Enter additional info"
                                />
                            </div>

                            <div>
                                <Label htmlFor="others_3" className="text-sm font-medium">
                                    Others 3
                                </Label>
                                <Input
                                    id="others_3"
                                    value={formData.others_3}
                                    onChange={(e) => handleInputChange('others_3', e.target.value)}
                                    placeholder="Enter additional info"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Diser'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 