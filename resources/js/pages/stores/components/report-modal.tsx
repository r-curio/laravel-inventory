import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PDFDownloadLink } from '@react-pdf/renderer';
import axios from 'axios';
import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
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
    const { auth } = usePage<SharedData>().props;
    const isAdmin = auth.user?.role === 'admin';
    
    const [boxCapacity, setBoxCapacity] = useState<number>(290);
    const [relevant_data, setRelevantData] = useState<StoreItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [orderCreated, setOrderCreated] = useState<boolean>(false);
    const [poNumber, setPoNumber] = useState<string>('');
    const [boxNumber, setBoxNumber] = useState<number>(0);
    const [notes1, setNotes1] = useState<string>('');
    const [notes2, setNotes2] = useState<string>('');

    useEffect(() => {
        const fetchNotes = async () => {
            const response = await axios.get(`/orders/${storeId}`);
            setNotes1(response.data.notes1);
            setNotes2(response.data.notes2);
        };
        fetchNotes();
        setRelevantData(data.filter((item) => item.final_order !== null && item.final_order > 0));
    }, [data]);

    const handleButtonClick = async () => {

        console.log('All items with final_order > 0:');
        relevant_data.forEach((item, index) => {
            console.log(`Item ${index + 1}: ${item.item_name} - final_order: ${item.final_order}`);
        });

        const calculatedTotalOrder = relevant_data.reduce((acc, item, index) => {
            const currentValue = parseInt(String(item.final_order || 0), 10);
            const newAcc = acc + currentValue;
            console.log(`Step ${index + 1}: ${acc} + ${currentValue} = ${newAcc}`);
            return newAcc;
        }, 0);
        
        const calculatedBoxNumber = Math.ceil(calculatedTotalOrder / boxCapacity);
        console.log(calculatedBoxNumber);

        setIsLoading(true);

        try {
            const response = await axios.post('/orders', {
                store_id: storeId,
                store_name: storeName,
                box_number: calculatedBoxNumber,
                notes1: notes1,
                notes2: notes2,
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
                        <Input 
                            type="number" 
                            value={boxCapacity} 
                            onChange={(e) => setBoxCapacity(Number(e.target.value))} 
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <p>Notes 1</p>
                        <textarea 
                            value={notes1} 
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes1(e.target.value)} 
                            placeholder="Enter first set of notes..."
                            rows={3}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <p>Notes 2</p>
                        <textarea 
                            value={notes2} 
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes2(e.target.value)} 
                            placeholder="Enter second set of notes..."
                            rows={3}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
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
                                        notes1={notes1}
                                        notes2={notes2}
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
