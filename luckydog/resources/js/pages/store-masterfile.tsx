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
import { FileDown, Search, Settings2, Trash2, Eye } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STORE_VIEWS as PREDEFINED_VIEWS } from '@/lib/previews';
import { AddStoreModal } from '@/components/add-store-modal';

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

type ViewKey = keyof typeof PREDEFINED_VIEWS;

export default function Dashboard({ stores }: DashboardProps) {
    const [data, setData] = useState<Store[]>(stores);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedView, setSelectedView] = useState<ViewKey>('all');
    const columnHelper = createColumnHelper<Store>();
    const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
    const batchUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Add columnVisibility state
    const [columnVisibility, setColumnVisibility] = useState(() =>
        Object.fromEntries(PREDEFINED_VIEWS[selectedView].hiddenColumns.map((col) => [col, false]))
    );

    console.log(data);

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

    // Update columnVisibility when selectedView changes
    useEffect(() => {
        setColumnVisibility(
            Object.fromEntries(PREDEFINED_VIEWS[selectedView].hiddenColumns.map((col) => [col, false]))
        );
    }, [selectedView]);

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
            cell: (info) => info.getValue(),
            meta: {
                className: 'sticky left-0 z-10 bg-white',
            },
        }),
        columnHelper.accessor('diser_fb_name', {
            header: 'FB Name',
            cell: (info) => info.getValue(),
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
            header: 'Ratbites',
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
        columnHelper.accessor('pullout_status', {
            header: 'Pullout Status',
            cell: EditableCell,
        }),
        columnHelper.accessor('dgcage_status', {
            header: 'Dgcage Status',
            cell: EditableCell,
        }),
        columnHelper.accessor('dgcage_comment', {
            header: 'Dgcage Comment',
            cell: EditableCell,
        }),
        columnHelper.accessor('tshirt_status', {
            header: 'Tshirt Status',
            cell: EditableCell,
        }),
        columnHelper.accessor('tshirt_comment', {
            header: 'Tshirt Comment',
            cell: EditableCell,
        }),
        columnHelper.accessor('litter_box_status', {
            header: 'Litter Box Status',
            cell: EditableCell,
        }),
        columnHelper.accessor('litter_box_comment', {
            header: 'Litter Box Comment',
            cell: EditableCell,
        }),
        columnHelper.accessor('pet_bed_status', {
            header: 'Pet Bed Status',
            cell: EditableCell,
        }),
        columnHelper.accessor('pet_bed_comment', {
            header: 'Pet Bed Comment',
            cell: EditableCell,
        }),
        columnHelper.accessor('gondola_dep', {
            header: 'Gondola Dep',
            cell: EditableCell,
        }),
        columnHelper.accessor('date_depo_refund', {
            header: 'Date Depo Refund',
            cell: EditableCell,
        }),
        columnHelper.accessor('missing_deliveries', {
            header: 'Missing Delivery',
            cell: EditableCell,
        }),
        columnHelper.accessor('items_on_order', {
            header: 'Items On Order',
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
            header: 'Notes',
            cell: EditableCell,
        }),
        columnHelper.accessor('others_2', {
            header: 'Notes',
            cell: EditableCell,
        }),
        columnHelper.accessor('others_3', {
            header: 'Notes',
            cell: EditableCell,
        }),
        columnHelper.accessor('date', {
            header: 'Date',
            cell: EditableCell,
        }),
        columnHelper.accessor('diser_company_sv', {
            header: 'SV Only',
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('diser_hold_stop_allow', {
            header: 'Hold Stop Allow',
            cell: (info) => info.getValue(),
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
                pageSize: data.length,
            },
            columnVisibility: Object.fromEntries(PREDEFINED_VIEWS[selectedView].hiddenColumns.map((col) => [col, false])),
        },
        state: {
            globalFilter,
            columnVisibility,
        },
        onGlobalFilterChange: setGlobalFilter,
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

    const handleStoreAdded = (newStore: Store) => {
        setData([...data, newStore]);
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
                        <Select value={selectedView} onValueChange={(v) => setSelectedView(v as ViewKey)}>
                            <SelectTrigger className="w-[180px]">
                                <Eye className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Select view" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(PREDEFINED_VIEWS).map(([key, view]) => (
                                    <SelectItem key={key} value={key}>
                                        <div>
                                            <div className="font-medium">{view.name}</div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                        <AddStoreModal onStoreAdded={handleStoreAdded} />
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
                            <table className="w-full">
                                <thead>
                                    {table.getHeaderGroups().map((headerGroup: HeaderGroup<Store>) => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map((header: Header<Store, unknown>) => (
                                                <th
                                                    key={header.id}
                                                    className={`border-b px-4 py-2 text-left font-medium whitespace-normal ${(header.column.columnDef.meta as any)?.className || ''}`}
                                                >
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
                                                <td
                                                    key={cell.id}
                                                    className={`min-w-fit border-b px-4 py-2 whitespace-normal ${(cell.column.columnDef.meta as any)?.className || ''}`}
                                                >
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
                </div>
            </div>
        </AppLayout>
    );
}
