import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Store } from '@/types/store';
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
import { FileDown, Plus, Search, Settings2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Store Masterfile',
        href: '/store-masterfile',
    },
];

type DashboardProps = {
    stores: Store[];
};

type PendingUpdate = {
    id: number;
    changes: Record<string, string>;
};

export default function Dashboard({ stores }: DashboardProps) {
    const [data, setData] = useState<Store[]>(stores);
    const [globalFilter, setGlobalFilter] = useState('');
    const columnHelper = createColumnHelper<Store>();
    const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
    const batchUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const processBatchUpdate = useCallback(async () => {
        const updates = Array.from(pendingUpdatesRef.current.values());
        if (updates.length === 0) return;

        try {
            await axios.post('/stores/batch-update', { updates });
            toast.success(`Successfully updated ${updates.length} changes`);
            pendingUpdatesRef.current.clear();
        } catch (error) {
            toast.error('Failed to save changes');
            // Revert all pending changes
            setData(stores);
            pendingUpdatesRef.current.clear();
        }
    }, [stores]);

    const handleCellChange = useCallback(
        (rowIndex: number, columnId: string, value: string) => {
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

            const store = data[rowIndex];
            const key = `${store.id}-${columnId}`;

            // Update or create pending update
            const existingUpdate = pendingUpdatesRef.current.get(key);
            if (existingUpdate) {
                existingUpdate.changes[columnId] = value;
            } else {
                pendingUpdatesRef.current.set(key, {
                    id: store.id,
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
        const store = data[rowIndex];
        try {
            await axios.delete(`/stores/${store.id}`);
            setData((old) => old.filter((_, index) => index !== rowIndex));
            toast.success('Store deleted successfully');
        } catch (error) {
            toast.error('Failed to delete store');
        }
    };

    const EditableCell = ({ getValue, row, column, table }: CellContext<Store, string>) => {
        const initialValue = getValue();
        const [value, setValue] = useState(initialValue);

        const onBlur = () => {
            handleCellChange(row.index, column.id, value);
        };

        return <Input value={value} onChange={(e) => setValue(e.target.value)} onBlur={onBlur} />;
    };

    const columns = [
        columnHelper.accessor('name', {
            header: 'Store Name',
            cell: EditableCell,
        }),
        columnHelper.accessor('co', {
            header: 'CO',
            cell: EditableCell,
        }),
        columnHelper.accessor('dc', {
            header: 'DC',
            cell: EditableCell,
        }),
        columnHelper.accessor('dr_stamped', {
            header: 'DR Stamped',
            cell: EditableCell,
        }),
        columnHelper.accessor('area_size', {
            header: 'Area Size',
            cell: EditableCell,
        }),
        columnHelper.accessor('overstock', {
            header: 'Overstock',
            cell: EditableCell,
        }),
        columnHelper.accessor('ratbites', {
            header: 'Rat Bites',
            cell: EditableCell,
        }),
        columnHelper.accessor('closed', {
            header: 'Closed',
            cell: EditableCell,
        }),
        columnHelper.accessor('no_diser', {
            header: 'No Diser',
            cell: EditableCell,
        }),
        columnHelper.accessor('class', {
            header: 'Class',
            cell: EditableCell,
        }),
        columnHelper.accessor('po_or_limit', {
            header: 'PO or Limit',
            cell: EditableCell,
        }),
        columnHelper.accessor('items_not_allowed', {
            header: 'Items Not Allowed',
            cell: EditableCell,
        }),
        columnHelper.accessor('items_order', {
            header: 'Items Order',
            cell: EditableCell,
        }),
        columnHelper.accessor('others', {
            header: 'Others',
            cell: EditableCell,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: (props: { row: Row<Store> }) => (
                <Button variant="destructive" size="sm" onClick={() => handleDelete(props.row.index)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            ),
        }),
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            pagination: {
                pageSize: 20,
            },
        },
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
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

    const addNewRow = async () => {
        try {
            const response = await axios.post('/stores', {
                name: '',
                co: '',
                dc: '',
                dr_stamped: '',
                area_size: '',
                overstock: '',
                ratbites: '',
                closed: '',
                no_diser: '',
                class: '',
                pullout_status: '',
                dgcage_status: '',
                tshirt_status: '',
                litter_box_status: '',
                pet_bed_status: '',
                gondola_dep: '',
                date_depo_refund: '',
                missing_deliveries: '',
                items_overstock: '',
                code: '',
                po_or_limit: '',
                items_not_allowed: '',
                items_order: '',
                others: '',
            });

            setData([...data, response.data.store]);
            toast.success('Store created successfully');
        } catch (error) {
            toast.error('Failed to create store');
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        // Add title
        doc.setFontSize(23);
        doc.text('Store Masterfile', 14, 15);

        // Add date
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

        // Get visible columns and their headers
        const visibleColumns = table.getAllColumns().filter((column) => column.getIsVisible() && column.id !== 'actions');

        const headers = visibleColumns.map((column) => column.id.charAt(0).toUpperCase() + column.id.slice(1).replace(/_/g, ' '));

        // Get filtered data
        const filteredData = table.getFilteredRowModel().rows.map((row) =>
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
        doc.save('store-masterfile.pdf');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Store Masterfile" />
            <div className="container mx-auto px-2 py-6">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Store Masterfile</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={exportToPDF}>
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
                        <Button onClick={addNewRow}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Store
                        </Button>
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
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    {table.getHeaderGroups().map((headerGroup: HeaderGroup<Store>) => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map((header: Header<Store, unknown>) => (
                                                <th key={header.id} className="border-b px-4 py-2 text-left font-medium whitespace-normal">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map((row: Row<Store>) => (
                                        <tr key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <td key={cell.id} className="min-w-fit border-b px-4 py-2 whitespace-normal">
                                                    <div className="flex min-h-[2.5rem] max-w-fit min-w-[150px] items-center">
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
                    <div className="flex items-center justify-between border-t p-4">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                                Previous
                            </Button>
                            <Button variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                                Next
                            </Button>
                        </div>
                        <div className="text-sm text-gray-500">
                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
