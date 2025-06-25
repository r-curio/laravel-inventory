import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface GenerateReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GenerateReportModal({ isOpen, onClose }: GenerateReportModalProps) {
    const [boxCapacity, setBoxCapacity] = useState(255);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Report</DialogTitle>
                    <DialogDescription>Enter the box capacity for the report generation.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="py-4">
                        <Input
                            type="number"
                            value={boxCapacity}
                            onChange={(e) => setBoxCapacity(Number(e.target.value))}
                            min={1}
                            placeholder="Enter box capacity"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Generate</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
