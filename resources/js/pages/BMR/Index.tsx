import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { GroupedItem } from '@/types/groupedItems';
import { StoreItem } from '@/types/storeItem';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import NextModal from './components/NextModal';

const FACTORY_OPTIONS = [
    { value: 'm30', label: 'M30' },
    { value: 'apollo', label: 'APOLLO' },
    { value: 'site3', label: 'SITE 3' },
];

export default function BMRIndex(props: { storeItems: StoreItem[]; currentBarcodeNumber: number }) {
    const { storeItems, currentBarcodeNumber } = props;
    const [groupedItems, setGroupedItems] = useState<GroupedItem[]>([]);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Batch PO', href: '/bmr/index' },
    ];

    // Initialize groupedItems from props
    useMemo(() => {
        const grouped = storeItems.reduce(
            (acc, item) => {
                const key = item.item_id;

                if (!acc[key]) {
                    acc[key] = {
                        item_id: item.item_id,
                        item_name: item.item_name,
                        total_final_order: 0,
                        stores: [],
                        storeItems: [],
                        assigned_factory: item.assigned_factory,
                    };
                }

                acc[key].total_final_order += item.final_order;
                if (!acc[key].stores.includes(item.store_name)) {
                    acc[key].stores.push(item.store_name);
                }
                acc[key].storeItems.push(item);

                return acc;
            },
            {} as Record<string, GroupedItem>,
        );

        const sortedItems = Object.values(grouped).sort((a, b) => a.item_name.localeCompare(b.item_name));
        setGroupedItems(sortedItems);
    }, [storeItems]);

    const handleFactoryChange = (itemId: string, factory: string) => {
        setGroupedItems((prev) => prev.map((item) => (item.item_id === itemId ? { ...item, assigned_factory: factory } : item)));
    };

    const handleProceedToNextStep = () => {
        router.post(
            '/bmr/assign-factories',
            {
                groupedItems: groupedItems,
            },
            {
                onSuccess: (page) => {
                    console.log('Success:', page);
                    router.visit('/bmr/factories');
                },
                onError: (errors) => {
                    console.error('Validation errors:', errors);
                    alert('Failed to save factory assignments. Please check your inputs.');
                },
                onFinish: () => {
                    // This will be called regardless of success or error
                },
            },
        );
    };

    const allItemsAssigned = useMemo(() => {
        return groupedItems.every((item) => {
            return item.assigned_factory && item.assigned_factory !== '';
        });
    }, [groupedItems]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="BMR - Bulk Material Request" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Total Batch PO</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Current Barcode Number: <span className="font-semibold text-blue-600">{currentBarcodeNumber}</span>
                            </p>
                        </div>
                        <NextModal
                            allItemsAssigned={allItemsAssigned}
                            groupedItems={groupedItems}
                            currentBarcodeNumber={currentBarcodeNumber}
                            onProceedToNextStep={handleProceedToNextStep}
                        />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {groupedItems.map((item) => (
                            <Card key={item.item_id} className="transition-shadow hover:shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="text-lg font-semibold">{item.item_name}</span>
                                        <Badge variant="secondary" className="text-sm">
                                            Total: {item.total_final_order}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Assign Factory:</label>
                                            <Select
                                                value={item.assigned_factory || ''}
                                                onValueChange={(value) => handleFactoryChange(item.item_id, value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select factory" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {FACTORY_OPTIONS.map((factory) => (
                                                        <SelectItem key={factory.value} value={factory.value}>
                                                            {factory.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="font-medium text-gray-700">Store Orders:</h4>
                                            {item.storeItems.map((storeItem, index) => (
                                                <div key={index} className="flex items-center justify-between rounded bg-gray-50 p-2">
                                                    <span className="text-sm font-medium">{storeItem.store_name}</span>
                                                    <Badge variant="outline">{storeItem.final_order}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
