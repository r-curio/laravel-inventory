import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { StockLevel, StockLevelCombination } from '@/types/stockLevel';
import { Head } from '@inertiajs/react';
import { AddStockLevelCombinationModal } from '@/components/add-stock-level-combination-modal';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
    type CellContext,
} from '@tanstack/react-table';
import axios from 'axios';
import { ArrowLeft, Search, Settings2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stock Level',
        href: '/stock-level',
    },
];

type StockLevelProps = {
    uniqueCombinations: StockLevelCombination[];
};

type PendingUpdate = {
    id: number;
    changes: Record<string, string>;
};

export default function StockLevelPage({ uniqueCombinations }: StockLevelProps) {
    const [selectedCombination, setSelectedCombination] = useState<StockLevelCombination | null>(null);
    const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [debouncedFilter, setDebouncedFilter] = useState('');
    const columnHelper = createColumnHelper<StockLevel>();
    const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
    const batchUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [newStockLevel, setNewStockLevel] = useState({ name: '', order: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [combinations, setCombinations] = useState<StockLevelCombination[]>(uniqueCombinations);

    // Debounced search effect
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedFilter(globalFilter);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [globalFilter]);

    const processBatchUpdate = useCallback(async () => {
        const updates = Array.from(pendingUpdatesRef.current.values());
        if (updates.length === 0) return;

        setIsLoading(true);
        setError(null);

        try {
            await axios.post('/stock-level/batch-update', { updates });
            toast.success(`Successfully updated ${updates.length} changes`);
            pendingUpdatesRef.current.clear();
        } catch (error) {
            const errorMessage = 'Failed to save changes';
            toast.error(errorMessage);
            setError(errorMessage);
            // Revert all pending changes
            if (selectedCombination) {
                loadStockLevels(selectedCombination);
            }
            pendingUpdatesRef.current.clear();
        } finally {
            setIsLoading(false);
        }
    }, [selectedCombination]);

    const handleCellChange = useCallback(
        (rowIndex: number, columnId: string, value: string) => {
            setStockLevels((old) =>
                old.map((row, index) => {
                    if (index === rowIndex) {
                        return {
                            ...row,
                            [columnId]: value,
                        };
                    }
                    return row;
                }),
            );

            const stockLevel = stockLevels[rowIndex];
            const key = `${stockLevel.id}-${columnId}`;

            // Update or create pending update
            const existingUpdate = pendingUpdatesRef.current.get(key);
            if (existingUpdate) {
                existingUpdate.changes[columnId] = value;
            } else {
                pendingUpdatesRef.current.set(key, {
                    id: stockLevel.id,
                    changes: { [columnId]: value },
                });
            }

            // Clear existing timeout
            if (batchUpdateTimeoutRef.current) {
                clearTimeout(batchUpdateTimeoutRef.current);
            }

            // Set new timeout
            batchUpdateTimeoutRef.current = setTimeout(processBatchUpdate, 3000);
        },
        [stockLevels, processBatchUpdate],
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (batchUpdateTimeoutRef.current) {
                clearTimeout(batchUpdateTimeoutRef.current);
            }
        };
    }, []);

    const loadStockLevels = async (combination: StockLevelCombination) => {
        setIsLoadingData(true);
        setError(null);
        
        try {
            const response = await axios.get('/stock-level/data', {
                params: {
                    store_name: combination.store_name,
                    class: combination.class,
                    co: combination.co
                }
            });
            setStockLevels(response.data);
        } catch (error) {
            const errorMessage = 'Failed to load stock levels';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleCardClick = (combination: StockLevelCombination) => {
        setSelectedCombination(combination);
        loadStockLevels(combination);
    };

    const handleBackClick = () => {
        setSelectedCombination(null);
        setStockLevels([]);
        setGlobalFilter('');
        setDebouncedFilter('');
        setError(null);
    };

    const handleCombinationAdded = (newCombination: StockLevelCombination) => {
        setCombinations(prev => [...prev, newCombination]);
    };

    const handleCombinationDeleted = async (combination: StockLevelCombination) => {
        try {
            await axios.delete('/stock-level/combination', {
                data: {
                    store_name: combination.store_name,
                    class: combination.class,
                    co: combination.co
                }
            });
            
            setCombinations(prev => prev.filter(c => 
                !(c.store_name === combination.store_name && 
                  c.class === combination.class && 
                  c.co === combination.co)
            ));
            
            toast.success('Combination deleted successfully');
        } catch (error: any) {
            console.error('Error deleting combination:', error);
            toast.error(error.response?.data?.message || 'Failed to delete combination');
        }
    };

    const EditableCell = useCallback(({ getValue, row, column, table }: CellContext<StockLevel, string>) => {
        const initialValue = getValue();
        const [value, setValue] = useState(initialValue);

        const onBlur = useCallback(() => {
            handleCellChange(row.index, column.id, value);
        }, [row.index, column.id, value]);

        const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            setValue(e.target.value);
        }, []);

        return <Input value={value} onChange={onChange} onBlur={onBlur} />;
    }, [handleCellChange]);

    // Memoized columns to prevent unnecessary re-renders
    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: 'Name',
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('order', {
            header: 'Order',
            cell: EditableCell,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: (info) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-100 hover:text-red-700"
                    onClick={() => {
                        if (confirm('Are you sure you want to delete this stock level item?')) {
                            handleDeleteStockLevel(info.row.original.id);
                        }
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            ),
        }),
    ], [columnHelper, EditableCell]);

    const table = useReactTable({
        data: stockLevels,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter: debouncedFilter,
        },
        onGlobalFilterChange: setDebouncedFilter,
        globalFilterFn: (row, columnId, filterValue) => {
            const searchTerm = String(filterValue).toLowerCase().trim();
            if (!searchTerm) return true;

            const value = row.getValue(columnId);
            if (value == null) return false;

            const searchValue = String(value).toLowerCase();
            return searchValue.includes(searchTerm);
        },
    });

    const handleAddStockLevel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCombination) return;
        setIsAdding(true);
        setError(null);
        try {
            const response = await axios.post('/stock-level', {
                store_name: selectedCombination.store_name,
                class: selectedCombination.class,
                co: (selectedCombination.co || ''),
                name: newStockLevel.name,
                order: newStockLevel.order,
            });
            setStockLevels((prev) => [...prev, response.data]);
            setNewStockLevel({ name: '', order: '' });
            toast.success('Stock level added');
        } catch (error) {
            setError('Failed to add stock level');
            toast.error('Failed to add stock level');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteStockLevel = async (stockLevelId: number) => {
        try {
            await axios.delete(`/stock-level/${stockLevelId}`);
            setStockLevels((prev) => prev.filter(item => item.id !== stockLevelId));
            toast.success('Stock level deleted successfully');
        } catch (error: any) {
            console.error('Error deleting stock level:', error);
            toast.error(error.response?.data?.message || 'Failed to delete stock level');
        }
    };

    // Show loading or error states
    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Stock Level" />
                <div className="container mx-auto px-2 py-6">
                    <div className="rounded-md border border-red-200 bg-red-50 p-4">
                        <p className="text-red-800">Error: {error}</p>
                        <Button 
                            onClick={() => setError(null)} 
                            className="mt-2"
                            variant="outline"
                        >
                            Dismiss
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Level" />
            <div className="container mx-auto px-2 py-6">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Stock Level</h1>
                    {selectedCombination && (
                        <Button variant="outline" onClick={handleBackClick}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Combinations
                        </Button>
                    )}
                </div>

                {!selectedCombination ? (
                    <>
                        {/* Show cards for unique combinations */}
                        <div className="mb-4 flex justify-end">
                            <AddStockLevelCombinationModal onCombinationAdded={handleCombinationAdded} />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {combinations.map((combination, index) => (
                                <Card 
                                    key={`${combination.store_name}-${combination.class}`}
                                    className="group relative cursor-pointer transition-all hover:shadow-lg"
                                    onClick={() => handleCardClick(combination)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{combination.store_name}</CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Are you sure you want to delete this combination? This will remove all associated stock level items.')) {
                                                        handleCombinationDeleted(combination);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">Class:</span>
                                                <span className="text-sm">{combination.class}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">CO:</span>
                                            <span className="text-sm">{combination.co}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                ) : (
                    // Show editable table for selected combination
                    <div>
                        <div className="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                {selectedCombination.store_name} - Class: {selectedCombination.class}
                            </h2>
                        </div>

                        {/* Add Stock Level Form */}
                        <form onSubmit={handleAddStockLevel} className="mb-4 flex gap-2 items-end">
                            <div>
                                <label className="block text-sm font-medium">Name</label>
                                <Input
                                    value={newStockLevel.name}
                                    onChange={e => setNewStockLevel(s => ({ ...s, name: e.target.value }))}
                                    placeholder="Item name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Order</label>
                                <Input
                                    value={newStockLevel.order}
                                    onChange={e => setNewStockLevel(s => ({ ...s, order: e.target.value }))}
                                    placeholder="Order"
                                    required
                                    type="number"
                                />
                            </div>
                            <Button type="submit" disabled={isAdding || !newStockLevel.name || !newStockLevel.order}>
                                {isAdding ? 'Adding...' : 'Add Stock Level'}
                            </Button>
                        </form>

                        <div className="mb-4 flex items-center gap-2">
                            <div className="relative max-w-sm flex-1">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search items..."
                                    value={globalFilter ?? ''}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            {isLoading && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                    Saving...
                                </div>
                            )}
                        </div>

                        <div className="rounded-md border">
                            <div className="p-4">
                                {isLoadingData ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                        <span className="ml-2">Loading...</span>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead>
                                                {table.getHeaderGroups().map((headerGroup) => (
                                                    <tr key={headerGroup.id}>
                                                        {headerGroup.headers.map((header) => (
                                                            <th
                                                                key={header.id}
                                                                className="border-b px-4 py-2 text-left font-medium"
                                                            >
                                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </thead>
                                            <tbody>
                                                {table.getRowModel().rows.map((row) => (
                                                    <tr key={row.id} className="border-b">
                                                        {row.getVisibleCells().map((cell) => (
                                                            <td key={cell.id} className="px-4 py-2">
                                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
