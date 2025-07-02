import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GroupedItem } from '@/types/groupedItems';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useState } from 'react';
import { TotalPDF } from './TotalPDF';

interface NextModalProps {
    allItemsAssigned: boolean;
    groupedItems: GroupedItem[];
    currentBarcodeNumber: number;
    onProceedToNextStep: () => void;
}

export default function NextModal({ allItemsAssigned, groupedItems, currentBarcodeNumber, onProceedToNextStep }: NextModalProps) {
    const [isProceeding, setIsProceeding] = useState(false);

    const handleProceedToNextStep = () => {
        setIsProceeding(true);
        onProceedToNextStep();
    };

    // Prepare data for PDF
    const pdfData = groupedItems.map((item) => ({
        productId: item.item_name,
        stores: item.storeItems.map((storeItem) => ({
            storeName: storeItem.store_name,
            finalOrder: storeItem.final_order,
        })),
        totalOrder: item.total_final_order,
        factory: item.assigned_factory,
    }));

    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button disabled={!allItemsAssigned} className="flex items-center gap-2">
                    Next Process
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Next Process</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                        <p>
                            Current Barcode Number: <span className="font-semibold">{currentBarcodeNumber}</span>
                        </p>
                        <p>
                            Date: <span className="font-semibold">{currentDate}</span>
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <PDFDownloadLink
                            document={<TotalPDF number={currentBarcodeNumber} groupedInventory={pdfData} date={currentDate} />}
                            fileName={`BMR-${currentBarcodeNumber}-${currentDate}.pdf`}
                        >
                            {({ blob, url, loading, error }) => (
                                <Button variant="outline" disabled={loading} className="w-full">
                                    {loading ? 'Generating PDF...' : 'Download Total PDF'}
                                </Button>
                            )}
                        </PDFDownloadLink>

                        <Button onClick={handleProceedToNextStep} disabled={isProceeding} className="w-full">
                            {isProceeding ? 'Processing...' : 'Proceed to Next Step'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
