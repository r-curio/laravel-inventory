import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Item } from '@/types/item';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

interface AddItemModalProps {
    onItemAdded: (item: Item) => void;
}

export function AddItemModal({ onItemAdded }: AddItemModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        barcode: '',
        m_no: '',
        sku: '',
        co: '',
        name: '',
        barcode_name: '',
        price: '',
        inactive: 'active',
        reorder_point: '',
        multiples: '',
        damaged: '',
        item_condition: '',
        category: '',
        others_1: '',
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
                toast.error('Item name is required');
                return;
            }

            const response = await axios.post('/items', {
                barcode: formData.barcode,
                m_no: formData.m_no,
                sku: formData.sku,
                co: formData.co,
                name: formData.name,
                barcode_name: formData.barcode_name,
                price: formData.price ? parseFloat(formData.price) : 0,
                inactive: formData.inactive === 'active' ? '' : formData.inactive,
                reorder_point: formData.reorder_point ? parseInt(formData.reorder_point) : 0,
                multiples: formData.multiples,
                damaged: formData.damaged,
                item_condition: formData.item_condition,
                category: formData.category,
                others_1: formData.others_1,
                others_2: formData.others_2,
                others_3: formData.others_3,
            });

            onItemAdded(response.data.item);
            toast.success('Item created successfully');
            handleClose();
        } catch (error: any) {
            console.error('Error creating item:', error);
            toast.error(error.response?.data?.message || 'Failed to create item');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setFormData({
            barcode: '',
            m_no: '',
            sku: '',
            co: '',
            name: '',
            barcode_name: '',
            price: '',
            inactive: 'active',
            reorder_point: '',
            multiples: '',
            damaged: '',
            item_condition: '',
            category: '',
            others_1: '',
            others_2: '',
            others_3: '',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setIsOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to create a new item in the masterfile.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" className="text-sm font-medium">
                                    Item Name *
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Enter item name"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="barcode" className="text-sm font-medium">
                                    Barcode
                                </Label>
                                <Input
                                    id="barcode"
                                    value={formData.barcode}
                                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                                    placeholder="Enter barcode"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="barcode_name" className="text-sm font-medium">
                                    Barcode Name
                                </Label>
                                <Input
                                    id="barcode_name"
                                    value={formData.barcode_name}
                                    onChange={(e) => handleInputChange('barcode_name', e.target.value)}
                                    placeholder="Enter barcode name"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="sku" className="text-sm font-medium">
                                    SKU
                                </Label>
                                <Input
                                    id="sku"
                                    value={formData.sku}
                                    onChange={(e) => handleInputChange('sku', e.target.value)}
                                    placeholder="Enter SKU"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="co" className="text-sm font-medium">
                                    CO
                                </Label>
                                <Input
                                    id="co"
                                    value={formData.co}
                                    onChange={(e) => handleInputChange('co', e.target.value)}
                                    placeholder="Enter CO"
                                    required
                                />
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="price" className="text-sm font-medium">
                                    Price
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => handleInputChange('price', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <Label htmlFor="reorder_point" className="text-sm font-medium">
                                    Reorder Point
                                </Label>
                                <Input
                                    id="reorder_point"
                                    type="number"
                                    min="0"
                                    value={formData.reorder_point}
                                    onChange={(e) => handleInputChange('reorder_point', e.target.value)}
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <Label htmlFor="category" className="text-sm font-medium">
                                    Category
                                </Label>
                                <Input
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => handleInputChange('category', e.target.value)}
                                    placeholder="Enter category"
                                />
                            </div>

                            <div>
                                <Label htmlFor="multiples" className="text-sm font-medium">
                                    Multiples
                                </Label>
                                <Input
                                    id="multiples"
                                    value={formData.multiples}
                                    onChange={(e) => handleInputChange('multiples', e.target.value)}
                                    placeholder="Enter multiples"
                                />
                            </div>

                            <div>
                                <Label htmlFor="item_condition" className="text-sm font-medium">
                                    Item Condition
                                </Label>
                                <Input
                                    id="item_condition"
                                    value={formData.item_condition}
                                    onChange={(e) => handleInputChange('item_condition', e.target.value)}
                                    placeholder="Enter item condition"
                                />
                            </div>

                            <div>
                                <Label htmlFor="inactive" className="text-sm font-medium">
                                    Status
                                </Label>
                                <Input
                                    id="inactive"
                                    value={formData.inactive}
                                    onChange={(e) => handleInputChange('inactive', e.target.value)}
                                    placeholder="Enter status"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="damaged" className="text-sm font-medium">
                                Damaged
                            </Label>
                            <Input
                                id="damaged"
                                value={formData.damaged}
                                onChange={(e) => handleInputChange('damaged', e.target.value)}
                                placeholder="Enter damaged info"
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

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Item'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 