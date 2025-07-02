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
    getPaginationRowModel,
    useReactTable,
    type CellContext,
    type Header,
    type HeaderGroup,
    type Row,
} from '@tanstack/react-table';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, Search, Settings2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { AddItemModal } from '@/components/add-item-modal';

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
    changes: Record<string, string | number>;
};

export default function Dashboard({ items }: DashboardProps) {
    const [data, setData] = useState<Item[]>(items);
    const [globalFilter, setGlobalFilter] = useState('');
    const [debouncedFilter, setDebouncedFilter] = useState('');
    const [pageSize, setPageSize] = useState(50);
    const [columnVisibility, setColumnVisibility] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const columnHelper = createColumnHelper<Item>();
    const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
    const batchUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
            setData((old) =>
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

            const item = data[rowIndex];
            const key = `${item.id}-${columnId}`;

            // Update or create pending update
            const existingUpdate = pendingUpdatesRef.current.get(key);
            if (existingUpdate) {
                existingUpdate.changes[columnId] = value;
            } else {
                pendingUpdatesRef.current.set(key, {
                    id: item.id,
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

    const handleDelete = async (rowIndex: number) => {
        const item = data[rowIndex];
        try {
            await axios.delete(`/items/${item.id}`);
            setData((old) => old.filter((_, index) => index !== rowIndex));
            toast.success('Item deleted successfully');
        } catch (error) {
            toast.error('Failed to delete item');
        }
    };

    const EditableCell = useCallback(({ getValue, row, column, table }: CellContext<Item, string | number>) => {
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
            meta: {
                className: 'sticky left-0 z-10 bg-white',
            },
        }),
        columnHelper.accessor('barcode', {
            header: 'Barcode',
            cell: EditableCell,
        }),
        columnHelper.accessor('sku', {
            header: 'SKU',
            cell: EditableCell,
        }),
        columnHelper.accessor('m_no', {
            header: 'M No',
            cell: EditableCell,
        }),
        columnHelper.accessor('co', {
            header: 'CO',
            cell: EditableCell,
        }),
        columnHelper.accessor('barcode_name', {
            header: 'Barcode Name',
            cell: EditableCell,
        }),
        columnHelper.accessor('price', {
            header: 'Price',
            cell: EditableCell,
        }),
        columnHelper.accessor('inactive', {
            header: 'Inactive',
            cell: EditableCell,
        }),
        columnHelper.accessor('reorder_point', {
            header: 'Reorder Point',
            cell: EditableCell,
        }),
        columnHelper.accessor('multiples', {
            header: 'Multiples',
            cell: EditableCell,
        }),
        columnHelper.accessor('damaged', {
            header: 'Damaged',
            cell: EditableCell,
        }),
        columnHelper.accessor('item_condition', {
            header: 'Item Condition',
            cell: EditableCell,
        }),
        columnHelper.accessor('category', {
            header: 'Category',
            cell: EditableCell,
        }),
        columnHelper.accessor('others_1', {
            header: 'Others 1',
            cell: EditableCell,
        }),
        columnHelper.accessor('others_2', {
            header: 'Others 2',
            cell: EditableCell,
        }),
        columnHelper.accessor('others_3', {
            header: 'Others 3',
            cell: EditableCell,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: (props: { row: Row<Item> }) => (
                <Button variant="destructive" size="sm" onClick={() => handleDelete(props.row.index)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            ),
        }),
    ], [columnHelper, EditableCell, handleDelete]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            pagination: {
                pageSize: pageSize,
            },
            columnVisibility: {
                // Hide less important columns by default for better performance
                others_1: false,
                others_2: false,
                others_3: false,
                damaged: false,
                item_condition: false,
            },
        },
        state: {
            globalFilter: debouncedFilter,
            pagination: {
                pageIndex: 0,
                pageSize: pageSize,
            },
            columnVisibility,
        },
        onGlobalFilterChange: setDebouncedFilter,
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const newState = updater({ pageIndex: 0, pageSize });
                setPageSize(newState.pageSize);
            }
        },
        onColumnVisibilityChange: setColumnVisibility,
        globalFilterFn: (row, columnId, filterValue) => {
            const searchTerm = String(filterValue).toLowerCase().trim();
            if (!searchTerm) return true;

            // Get all visible columns for the row
            const visibleColumns = row.getAllCells().map((cell) => cell.column.id);

            // Check if any of the visible columns contain the search term
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

        const headers = visibleColumns.map((column) => column.id.charAt(0).toUpperCase() + column.id.slice(1).replace(/_/g, ' '));

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
                fillColor: [41, 128, 185],
                textColor: 255,
                fontSize: 9,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
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
                            <DropdownMenuContent align="end">
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.id !== 'actions')
                                    .map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {column.id.charAt(0).toUpperCase() + column.id.slice(1).replace(/_/g, ' ')}
                                        </DropdownMenuCheckboxItem>
                                    ))}
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
                            <div className="min-w-full">
                                {/* Fixed Header */}
                                <div className="sticky top-0 z-40 bg-white border-b">
                                    <div className="flex">
                                        {table.getHeaderGroups().map((headerGroup: HeaderGroup<Item>) => (
                                            <div key={headerGroup.id} className="flex">
                                                {headerGroup.headers.map((header: Header<Item, unknown>) => (
                                                    <div
                                                        key={header.id}
                                                        className={`border-b px-4 py-2 text-left font-medium whitespace-normal flex-shrink-0 ${
                                                            header.column.id === 'name' ? 'sticky left-0 z-50 bg-white min-w-[200px]' : 'min-w-[150px] max-w-[250px]'
                                                        }`}
                                                        style={{
                                                            width: header.column.id === 'name' ? '200px' : 'auto',
                                                            minWidth: header.column.id === 'name' ? '200px' : '150px',
                                                            maxWidth: header.column.id === 'name' ? '200px' : '250px'
                                                        }}
                                                    >
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Table Body */}
                                <div>
                                    {table.getRowModel().rows.map((row) => (
                                        <div
                                            key={row.id}
                                            className="flex border-b"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <div
                                                    key={cell.id}
                                                    className={`px-4 py-2 whitespace-normal flex-shrink-0 ${
                                                        cell.column.id === 'name' ? 'sticky left-0 z-30 bg-white min-w-[200px]' : 'min-w-[150px] max-w-[150px]'
                                                    }`}
                                                    style={{
                                                        width: cell.column.id === 'name' ? '200px' : 'auto',
                                                        minWidth: cell.column.id === 'name' ? '200px' : '150px',
                                                        maxWidth: cell.column.id === 'name' ? '200px' : '150px'
                                                    }}
                                                >
                                                    <div className="flex min-h-[2.5rem] items-center">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}