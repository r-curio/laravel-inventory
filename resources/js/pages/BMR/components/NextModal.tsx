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
    const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });

    const CHUNK_SIZE = 50; // Process 50 items at a time

    const processItemsInChunks = async () => {
        setIsProceeding(true);
        setProgress({ current: 0, total: 0, message: 'Preparing to process items...' });

        const totalChunks = Math.ceil(groupedItems.length / CHUNK_SIZE);
        setProgress({ current: 0, total: totalChunks, message: `Processing 0 of ${totalChunks} chunks...` });

        try {
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const startIndex = chunkIndex * CHUNK_SIZE;
                const endIndex = Math.min(startIndex + CHUNK_SIZE, groupedItems.length);
                const chunkItems = groupedItems.slice(startIndex, endIndex);

                setProgress({ 
                    current: chunkIndex + 1, 
                    total: totalChunks, 
                    message: `Processing chunk ${chunkIndex + 1} of ${totalChunks} (${chunkItems.length} items)...` 
                });

                const response = await fetch('/bmr/assign-factories', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        groupedItems: chunkItems,
                        chunk_index: chunkIndex,
                        total_chunks: totalChunks,
                        is_chunked: true,
                    }),
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message || 'Failed to process chunk');
                }

                // Add a small delay between chunks to prevent overwhelming the server
                if (chunkIndex < totalChunks - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            setProgress({ 
                current: totalChunks, 
                total: totalChunks, 
                message: 'All chunks processed successfully! Redirecting...' 
            });

            // Proceed to next step after all chunks are processed
            setTimeout(() => {
                onProceedToNextStep();
            }, 1000);

        } catch (error) {
            console.error('Error processing chunks:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Failed to process items: ${errorMessage}`);
            setIsProceeding(false);
            setProgress({ current: 0, total: 0, message: '' });
        }
    };

    const handleProceedToNextStep = () => {
        if (groupedItems.length > CHUNK_SIZE) {
            processItemsInChunks();
        } else {
            // For small datasets, use the original method
            setIsProceeding(true);
            onProceedToNextStep();
        }
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
                        <p>
                            Total Items: <span className="font-semibold">{groupedItems.length}</span>
                        </p>
                        {groupedItems.length > CHUNK_SIZE && (
                            <p className="text-blue-600">
                                Large dataset detected. Will process in chunks of {CHUNK_SIZE} items.
                            </p>
                        )}
                    </div>

                    {/* Progress indicator */}
                    {isProceeding && progress.total > 0 && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>{progress.message}</span>
                                <span>{progress.current}/{progress.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <PDFDownloadLink
                            document={<TotalPDF number={currentBarcodeNumber} groupedInventory={pdfData} date={currentDate} />}
                            fileName={`BMR-${currentBarcodeNumber}-${currentDate}.pdf`}
                        >
                            {({ blob, url, loading, error }) => (
                                <Button variant="outline" disabled={loading || isProceeding} className="w-full">
                                    {loading ? 'Generating PDF...' : 'Download Total PDF'}
                                </Button>
                            )}
                        </PDFDownloadLink>

                        <Button 
                            onClick={handleProceedToNextStep} 
                            disabled={isProceeding} 
                            className="w-full"
                        >
                            {isProceeding ? 'Processing...' : 'Proceed to Next Step'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
