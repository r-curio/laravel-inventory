import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StockLevelCombination } from '@/types/stockLevel';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

interface AddStockLevelCombinationModalProps {
    onCombinationAdded: (combination: StockLevelCombination) => void;
}

export function AddStockLevelCombinationModal({ onCombinationAdded }: AddStockLevelCombinationModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        store_name: '',
        class: '',
        co: '',
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
            const response = await axios.post('/stock-level/combination', formData);
            const newCombination = response.data;
            
            onCombinationAdded(newCombination);
            toast.success('New stock level combination created successfully');
            handleClose();
        } catch (error: any) {
            console.error('Error creating stock level combination:', error);
            toast.error(error.response?.data?.message || 'Failed to create stock level combination');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setFormData({
            store_name: '',
            class: '',
            co: '',
        });
    };

    const coOptions = [
        { value: 'TV', label: 'TV' },
        { value: 'RSC', label: 'RSC' },
        { value: 'SM', label: 'SM' },
        { value: 'HMN', label: 'HMN' },
        { value: 'GAI', label: 'GAI' },
        { value: 'PET', label: 'PET' },
        { value: 'HX', label: 'HX' },
        { value: 'WM', label: 'WM' },
        { value: 'LM', label: 'LM' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setIsOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Combination
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Stock Level Combination</DialogTitle>
                    <DialogDescription>
                        Create a new store name and class combination for stock level management.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="store_name" className="text-sm font-medium">
                            Store Name *
                        </Label>
                        <Input
                            id="store_name"
                            value={formData.store_name}
                            onChange={(e) => handleInputChange('store_name', e.target.value)}
                            placeholder="Enter store name"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="class" className="text-sm font-medium">
                            Class *
                        </Label>
                        <Input
                            id="class"
                            value={formData.class}
                            onChange={(e) => handleInputChange('class', e.target.value)}
                            placeholder="Enter class (e.g., A, B, C, etc.)"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="co" className="text-sm font-medium">
                            Company *
                        </Label>
                        <Input
                            id="co"
                            value={formData.co}
                            onChange={(e) => handleInputChange('co', e.target.value)}
                            placeholder="Enter company"
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Combination'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 