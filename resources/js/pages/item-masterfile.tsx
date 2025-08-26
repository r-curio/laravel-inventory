import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Item } from '@/types/item';
import { Head } from '@inertiajs/react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
    getSortedRowModel,
    type CellContext,
    type Header,
    type HeaderGroup,
    type Row,
    type SortingState,
} from '@tanstack/react-table';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, Search, Settings2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { AddItemModal } from '@/components/add-item-modal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Item Masterfile',
        href: '/item-masterfile',
    },
];

type DashboardProps = {
    items: Item[];
};

type PendingUpdate = {
    id: number;
    changes: Record<string, string | number | null>;
};

export default function Dashboard({ items }: DashboardProps) {
    const [data, setData] = useState<Item[]>(items);
    const [globalFilter, setGlobalFilter] = useState('');
    const [debouncedFilter, setDebouncedFilter] = useState('');
    const [columnVisibility, setColumnVisibility] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const columnHelper = createColumnHelper<Item>();
    const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
    const batchUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'co', desc: false },
        { id: 'm_no', desc: false },
        { id: 'name', desc: false },
    ]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);

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
            await axios.post('/items/batch-update', { updates });
            toast.success(`Successfully updated ${updates.length} changes`);
            pendingUpdatesRef.current.clear();
        } catch (error) {
            const errorMessage = 'Failed to save changes';
            toast.error(errorMessage);
            setError(errorMessage);
            // Revert all pending changes
            setData(items);
            pendingUpdatesRef.current.clear();
        } finally {
            setIsLoading(false);
        }
    }, [items]);

    const handleCellChange = useCallback(
        (rowIndex: number, columnId: string, value: string | number) => {
            // Convert empty string to null for database storage
            const dbValue = value === '' ? null : value;
            
            setData((old) =>
                old.map((row, index) => {
                    if (index === rowIndex) {
                        return {
                            ...row,
                            [columnId]: dbValue,
                        };
                    }
                    return row;
                }),
            );

            const item = data[rowIndex];
            const key = `${item.id}-${columnId}`;

            // Update or create pending update
            const existingUpdate = pendingUpdatesRef.current.get(key);
            if (existingUpdate) {
                existingUpdate.changes[columnId] = dbValue;
            } else {
                pendingUpdatesRef.current.set(key, {
                    id: item.id,
                    changes: { [columnId]: dbValue },
                });
            }

            // Clear existing timeout
            if (batchUpdateTimeoutRef.current) {
                clearTimeout(batchUpdateTimeoutRef.current);
            }

            // Set new timeout
            batchUpdateTimeoutRef.current = setTimeout(processBatchUpdate, 3000);
        },
        [data, processBatchUpdate],
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (batchUpdateTimeoutRef.current) {
                clearTimeout(batchUpdateTimeoutRef.current);
            }
        };
    }, []);

    const requestDelete = (rowIndex: number) => {
        setPendingDeleteIndex(rowIndex);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (pendingDeleteIndex === null) return;
        const item = data[pendingDeleteIndex];
        try {
            await axios.delete(`/items/${item.id}`);
            setData((old) => old.filter((_, index) => index !== pendingDeleteIndex));
            toast.success('Item deleted successfully');
        } catch (error) {
            toast.error('Failed to delete item');
        } finally {
            setConfirmOpen(false);
            setPendingDeleteIndex(null);
        }
    };

    const EditableCell = useCallback(({ getValue, row, column, table }: CellContext<Item, string | number>) => {
        const initialValue = getValue();
        const [value, setValue] = useState(initialValue?.toString() || '');

        const onBlur = useCallback(() => {
            handleCellChange(row.index, column.id, value);
        }, [row.index, column.id, value]);

        const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            setValue(e.target.value);
        }, []);

        return <Input value={value || ''} onChange={onChange} onBlur={onBlur} />;
    }, [handleCellChange]);

    // Memoized columns to prevent unnecessary re-renders
    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: ({ column }) => (
                <div className="flex cursor-pointer items-center" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    NAME
                    {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
                </div>
            ),
            cell: (info) => info.getValue(),
            enableSorting: true,
            sortingFn: 'alphanumeric',
        }),
        columnHelper.accessor('barcode', {
            header: 'BARCODE',
            cell: EditableCell,
        }),
        columnHelper.accessor('sku', {
            header: 'SKU',
            cell: EditableCell,
        }),
        columnHelper.accessor('co', {
            header: 'CO',
            cell: EditableCell,
            enableSorting: true,
            sortingFn: (rowA, rowB, columnId) => {
                const a = String(rowA.getValue(columnId)).toLowerCase();
                const b = String(rowB.getValue(columnId)).toLowerCase();
                if (a !== b) return a.localeCompare(b);
                // If co is the same, sort by m_no
                const mNoA = Number(rowA.getValue('m_no'));
                const mNoB = Number(rowB.getValue('m_no'));
                if (!isNaN(mNoA) && !isNaN(mNoB)) {
                    if (mNoA !== mNoB) return mNoA - mNoB;
                } else {
                    const strA = String(rowA.getValue('m_no'));
                    const strB = String(rowB.getValue('m_no'));
                    if (strA !== strB) return strA.localeCompare(strB);
                }
                // If m_no is also the same, sort by name
                const nameA = String(rowA.getValue('name')).toLowerCase();
                const nameB = String(rowB.getValue('name')).toLowerCase();
                return nameA.localeCompare(nameB);
            },
        }),
        columnHelper.accessor('barcode_name', {
            header: 'BARCODE NAME',
            cell: EditableCell,
        }),
        columnHelper.accessor('price', {
            header: 'PRICE',
            cell: EditableCell,
        }),
        columnHelper.accessor('inactive', {
            header: 'INACTIVE',
            cell: EditableCell,
        }),
        columnHelper.accessor('reorder_point', {
            header: 'REORDER POINT',
            cell: EditableCell,
        }),
        columnHelper.accessor('multiples', {
            header: 'MULTIPLES',
            cell: EditableCell,
        }),
        columnHelper.accessor('damaged', {
            header: 'DAMAGED',
            cell: EditableCell,
        }),
        columnHelper.accessor('item_condition', {
            header: 'ITEM CONDITION',
            cell: EditableCell,
        }),
        columnHelper.accessor('category', {
            header: 'CATEGORY',
            cell: EditableCell,
        }),
        columnHelper.accessor('others_1', {
            header: 'OTHERS 1',
            cell: EditableCell,
        }),
        columnHelper.accessor('others_2', {
            header: 'OTHERS 2',
            cell: EditableCell,
        }),
        columnHelper.accessor('others_3', {
            header: 'OTHERS 3',
            cell: EditableCell,
        }),
        columnHelper.accessor('m_no', {
            header: ({ column }) => (
                <div className="flex cursor-pointer items-center" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    M NO
                    {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
                </div>
            ),
            cell: EditableCell,
            enableSorting: true,
            sortingFn: (rowA, rowB, columnId) => {
                // Sort as numbers if possible
                const a = Number(rowA.getValue(columnId));
                const b = Number(rowB.getValue(columnId));
                if (!isNaN(a) && !isNaN(b)) {
                    if (a !== b) return a - b;
                    // If m_no is the same, sort by name
                    const nameA = String(rowA.getValue('name')).toLowerCase();
                    const nameB = String(rowB.getValue('name')).toLowerCase();
                    return nameA.localeCompare(nameB);
                }
                // Fallback to string comparison
                const strA = String(rowA.getValue(columnId));
                const strB = String(rowB.getValue(columnId));
                if (strA !== strB) return strA.localeCompare(strB);
                // If m_no is the same, sort by name
                const nameA = String(rowA.getValue('name')).toLowerCase();
                const nameB = String(rowB.getValue('name')).toLowerCase();
                return nameA.localeCompare(nameB);
            },
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: (props: { row: Row<Item> }) => (
                <Button variant="destructive" size="sm" onClick={() => requestDelete(props.row.index)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            ),
        }),
    ], [columnHelper, EditableCell]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            columnVisibility: {
                others_1: false,
                others_2: false,
                others_3: false,
                damaged: false,
                item_condition: false,
            },
            sorting: [
                { id: 'co', desc: false },
                { id: 'm_no', desc: false },
                { id: 'name', desc: false },
            ],
        },
        state: {
            globalFilter: debouncedFilter,
            columnVisibility,
            sorting,
        },
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        globalFilterFn: (row, columnId, filterValue) => {
            const searchTerm = String(filterValue).toLowerCase().trim();
            if (!searchTerm) return true;
            const visibleColumns = row.getAllCells().map((cell) => cell.column.id);
            return visibleColumns.some((columnId) => {
                const value = row.getValue(columnId);
                if (value == null) return false;
                const searchValue = String(value).toLowerCase();
                return searchValue.includes(searchTerm);
            });
        },
    });

    const handleItemAdded = (newItem: Item) => {
        setData([...data, newItem]);
    };

    const exportToPDF = () => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        // Add title
        doc.setFontSize(23);
        doc.text('Item Masterfile', 14, 15);

        // Add date
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

        // Get visible columns and their headers
        const visibleColumns = table.getAllColumns().filter((column) => column.getIsVisible() && column.id !== 'actions');
        const headerGroup = table.getHeaderGroups()[0];
        const headers = visibleColumns.map((column) => {
            const headerObj = headerGroup.headers.find(h => h.column.id === column.id);
            if (headerObj) {
                const rendered = flexRender(column.columnDef.header, headerObj.getContext());
                return typeof rendered === 'string' ? rendered : column.id;
            }
            return typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
        }).filter(header => header !== undefined) as string[];

        // Get filtered data
        const filteredData = table.getRowModel().rows.map((row) =>
            visibleColumns.map((column) => {
                const value = row.getValue(column.id);
                return value ? String(value) : '';
            }),
        );

        // Generate table
        autoTable(doc, {
            head: [headers],
            body: filteredData,
            startY: 30,
            styles: {
                fontSize: 8,
                cellPadding: 1,
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: 20,
                fontSize: 9,
                fontStyle: 'bold',
                lineWidth: 0.1,
            },
            margin: { top: 30, left: 1, right: 1, bottom: 10 },
            theme: 'grid',
            didDrawPage: function (data) {
                // Add page numbers
                doc.setFontSize(8);
                doc.text(`Page ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            },
        });

        // Save the PDF
        doc.save('item-masterfile.pdf');
    };

    // Show loading or error states
    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Item Masterfile" />
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
            <Head title="Item Masterfile" />
            <div className="container mx-auto px-2 py-6">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Item Masterfile</h1>
                    <div className="flex gap-2">
                        {isLoading && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                Saving...
                            </div>
                        )}
                        <Button variant="outline" size="sm" onClick={exportToPDF} disabled={isLoading}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Settings2 className="mr-2 h-4 w-4" />
                                    Columns
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.id !== 'actions')
                                    .map((column) => {
                                        const headerGroup = table.getHeaderGroups()[0];
                                        const headerObj = headerGroup.headers.find(h => h.column.id === column.id);
                                        let headerText = column.id;
                                        
                                        if (headerObj) {
                                            const rendered = flexRender(column.columnDef.header, headerObj.getContext());
                                            headerText = typeof rendered === 'string' ? rendered : column.id;
                                        } else if (typeof column.columnDef.header === 'string') {
                                            headerText = column.columnDef.header;
                                        }
                                        
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                            >
                                                {headerText}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AddItemModal onItemAdded={handleItemAdded} />
                    </div>
                </div>

                <div className="rounded-md border">
                    <div className="p-4">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="relative max-w-sm flex-1">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search all columns..."
                                    value={globalFilter ?? ''}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
                            <table className="min-w-full">
                                <thead>
                                    {table.getHeaderGroups().map((headerGroup: HeaderGroup<Item>) => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map((header: Header<Item, unknown>, index: number) => (
                                                <th
                                                    key={header.id}
                                                    className={`border-b px-4 py-2 text-left font-medium whitespace-normal ${
                                                        header.column.id === 'name' ? 'sticky left-0 z-50 bg-white min-w-[200px]' : 'min-w-[150px]'
                                                    } sticky top-0 z-40 bg-white`}
                                                    style={{
                                                        width: header.column.id === 'name' ? '200px' : 'auto',
                                                        minWidth: header.column.id === 'name' ? '200px' : '150px',
                                                        maxWidth: header.column.id === 'name' ? '200px' : '250px',
                                                    }}
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
                                                <td
                                                    key={cell.id}
                                                    className={`px-4 py-2 whitespace-normal ${
                                                        cell.column.id === 'name' ? 'sticky left-0 z-30 bg-white min-w-[200px]' : 'min-w-[200px]'
                                                    }`}
                                                    style={{
                                                        minWidth: cell.column.id === 'name' ? '200px' : '200px',
                                                    }}
                                                >
                                                    <div className="flex min-h-[2.5rem] items-center">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete item?</DialogTitle>
                        <DialogDescription>
                            {pendingDeleteIndex !== null ? `Are you sure you want to delete "${data[pendingDeleteIndex]?.name}"? This will also remove related stock levels and barcodes.` : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}