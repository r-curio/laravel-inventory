import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PDFDownloadLink } from '@react-pdf/renderer';
import axios from 'axios';
import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import InventoryPDF from '../inventoryPDF';

type StoreItem = {
    id: number;
    store_id: number;
    item_id: number;
    order: number;
    inventory: number | null;
    dr_6578: number | null;
    dr_958: number | null;
    pic_53: number | null;
    total: number | null;
    s_divide_2: number | null;
    s_order_2: number | null;
    s_order_5: number | null;
    final_order: number | null;
    item_name: string;
    item_multiples: number | null;
    m_no: string;
    created_at: string;
    updated_at: string;
};

export default function ReportModal({
    data,
    storeName,
    storeLocation,
    storeId,
}: {
    data: StoreItem[];
    storeName: string;
    storeLocation: string | null;
    storeId: number;
}) {
    const [boxCapacity, setBoxCapacity] = useState<number>(255);
    const [relevant_data, setRelevantData] = useState<StoreItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [orderCreated, setOrderCreated] = useState<boolean>(false);
    const [poNumber, setPoNumber] = useState<string>('');
    const [boxNumber, setBoxNumber] = useState<number>(0);

    useEffect(() => {
        setRelevantData(data.filter((item) => item.final_order !== null && item.final_order > 0));
    }, [data]);

    const handleButtonClick = async () => {
        const calculatedTotalOrder = Number(relevant_data.reduce((acc, item) => acc + (item.final_order || 0), 0));
        const calculatedBoxNumber = Math.ceil(calculatedTotalOrder / boxCapacity);

        setIsLoading(true);

        try {
            const response = await axios.post('/orders', {
                store_id: storeId,
                store_name: storeName,
                box_number: calculatedBoxNumber,
                store_items: relevant_data.map((item) => ({
                    id: item.id,
                    name: item.item_name,
                    final_order: item.final_order,
                })),
            });

            setPoNumber(response.data.po_number || 'N/A');
            setBoxNumber(calculatedBoxNumber);
            setOrderCreated(true);
            toast.success('Order created successfully!');
            console.log('Order created:', response.data);
        } catch (error) {
            console.error('Failed to create order:', error);
            toast.error('Failed to create order. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger>
                <Button>
                    <Printer className="mr-2 h-4 w-4" />
                    Generate Report
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Report</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                        <p>Box Capacity</p>
                        <Input type="number" value={boxCapacity} onChange={(e) => setBoxCapacity(Number(e.target.value))} />
                    </div>
                    <Button onClick={handleButtonClick} disabled={isLoading}>
                        {isLoading ? 'Creating Order...' : 'Generate Report'}
                    </Button>

                    {orderCreated && (
                        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                            <p className="mb-2 font-medium text-green-800">Order Created Successfully!</p>
                            <p className="mb-3 text-sm text-green-700">PO Number: {poNumber}</p>
                            <PDFDownloadLink
                                document={
                                    <InventoryPDF
                                        storeName={storeName}
                                        poNumber={poNumber}
                                        boxNumber={boxNumber}
                                        storeLocation={storeLocation}
                                        storeItems={relevant_data.map((item) => ({
                                            id: item.id,
                                            item_name: item.item_name,
                                            final_order: item.final_order || 0,
                                        }))}
                                    />
                                }
                                fileName={`${storeName}_PO_${poNumber}.pdf`}
                            >
                                {({ blob, url, loading, error }) => (
                                    <Button variant="outline" disabled={loading}>
                                        {loading ? 'Generating PDF...' : 'Download PDF'}
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
