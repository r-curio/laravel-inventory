import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Store } from '@/types/store';
import { Head } from '@inertiajs/react';
import React from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
    type CellContext,
    type Header,
    type HeaderGroup,
    type Row,
    getSortedRowModel,
    type SortingState,
} from '@tanstack/react-table';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, Search, Settings2, Trash2, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STORE_VIEWS as PREDEFINED_VIEWS } from '@/lib/previews';
import { AddStoreModal } from '@/components/add-store-modal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    changes: Record<string, string | null>;
};

type ViewKey = keyof typeof PREDEFINED_VIEWS;

export default function Dashboard({ stores }: DashboardProps) {
    const [data, setData] = useState<Store[]>(stores);
    const [globalFilter, setGlobalFilter] = useState('');
    const [debouncedFilter, setDebouncedFilter] = useState('');
    const [selectedView, setSelectedView] = useState<ViewKey>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const columnHelper = createColumnHelper<Store>();
    const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
    const batchUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Initialize sorting state with name column sorted ascending
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'name', desc: false }
    ]);
    
    // Add columnVisibility state
    const [columnVisibility, setColumnVisibility] = useState(() =>
        Object.fromEntries(PREDEFINED_VIEWS[selectedView].hiddenColumns.map((col) => [col, false]))
    );
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
            await axios.post('/stores/batch-update', { updates });
            toast.success(`Successfully updated ${updates.length} changes`);
            pendingUpdatesRef.current.clear();
        } catch (error) {
            const errorMessage = 'Failed to save changes';
            toast.error(errorMessage);
            setError(errorMessage);
            // Revert all pending changes
            setData(stores);
            pendingUpdatesRef.current.clear();
        } finally {
            setIsLoading(false);
        }
    }, [stores]);

    const handleCellChange = useCallback(
        (rowIndex: number, columnId: string, value: string) => {
            // Convert empty string to null for database storage
            const dbValue = value.trim() === '' ? null : value;
            
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

            const store = data[rowIndex];
            const key = `${store.id}-${columnId}`;

            // Update or create pending update
            const existingUpdate = pendingUpdatesRef.current.get(key);
            if (existingUpdate) {
                existingUpdate.changes[columnId] = dbValue;
            } else {
                pendingUpdatesRef.current.set(key, {
                    id: store.id,
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

    // Update columnVisibility when selectedView changes
    useEffect(() => {
        setColumnVisibility(
            Object.fromEntries(PREDEFINED_VIEWS[selectedView].hiddenColumns.map((col) => [col, false]))
        );
    }, [selectedView]);

    const requestDelete = (rowIndex: number) => {
        setPendingDeleteIndex(rowIndex);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (pendingDeleteIndex === null) return;
        const store = data[pendingDeleteIndex];
        try {
            await axios.delete(`/stores/${store.id}`);
            setData((old) => old.filter((_, index) => index !== pendingDeleteIndex));
            toast.success('Store deleted successfully');
        } catch (error) {
            toast.error('Failed to delete store');
        } finally {
            setConfirmOpen(false);
            setPendingDeleteIndex(null);
        }
    };

    const EditableCell = useCallback(({ getValue, row, column, table }: CellContext<Store, string | null>) => {
        const initialValue = getValue();
        const [value, setValue] = useState(initialValue || '');

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
                <div 
                    className="flex cursor-pointer items-center gap-1 select-none" 
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    <span>STORE NAME</span>
                    <div className="flex flex-col">
                        {column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <div className="h-4 w-4 opacity-50">
                                <ChevronUp className="h-3 w-3" />
                                <ChevronDown className="h-3 w-3 -mt-1" />
                            </div>
                        )}
                    </div>
                </div>
            ),
            cell: (info) => info.getValue(),
            enableSorting: true,
            sortingFn: 'alphanumeric',
            meta: {
                className: 'sticky left-0 z-10 bg-white',
            },
        }),
        columnHelper.accessor('diser_fb_name', {
            header: 'FB NAME',
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
            header: 'DR STAMPED',
            cell: EditableCell,
        }),
        columnHelper.accessor('area_size', {
            header: 'AREA SIZE',
            cell: EditableCell,
        }),
        columnHelper.accessor('overstock', {
            header: 'OVERSTOCK',
            cell: EditableCell,
        }),
        columnHelper.accessor('ratbites', {
            header: 'RATBITES',
            cell: EditableCell,
        }),
        columnHelper.accessor('closed', {
            header: 'CLOSED',
            cell: EditableCell,
        }),
        columnHelper.accessor('no_diser', {
            header: 'LAST DLVR DATE',
            cell: EditableCell,
        }),
        columnHelper.accessor('class', {
            header: 'CLASS',
            cell: EditableCell,
        }),
        columnHelper.accessor('pullout_status', {
            header: 'PULLOUT STATUS',
            cell: EditableCell,
        }),
        columnHelper.accessor('dgcage_status', {
            header: 'DGCAGE STATUS',
            cell: EditableCell,
        }),
        columnHelper.accessor('dgcage_comment', {
            header: 'DGCAGE COMMENT',
            cell: EditableCell,
        }),
        columnHelper.accessor('tshirt_status', {
            header: 'TSHIRT STATUS',
            cell: EditableCell,
        }),
        columnHelper.accessor('tshirt_comment', {
            header: 'TSHIRT COMMENT',
            cell: EditableCell,
        }),
        columnHelper.accessor('litter_box_status', {
            header: 'LITTER BOX STATUS',
            cell: EditableCell,
        }),
        columnHelper.accessor('litter_box_comment', {
            header: 'LITTER BOX COMMENT',
            cell: EditableCell,
        }),
        columnHelper.accessor('pet_bed_status', {
            header: 'PET BED STATUS',
            cell: EditableCell,
        }),
        columnHelper.accessor('pet_bed_comment', {
            header: 'PET BED COMMENT',
            cell: EditableCell,
        }),
        columnHelper.accessor('gondola_dep', {
            header: 'GONDOLA DEP',
            cell: EditableCell,
        }),
        columnHelper.accessor('date_depo_refund', {
            header: 'DATE DEPO REFUND',
            cell: EditableCell,
        }),
        columnHelper.accessor('missing_deliveries', {
            header: 'TEMP STOP',
            cell: EditableCell,
        }),
        columnHelper.accessor('items_overstock', {
            header: 'ITEMS OVERSTOCK',
            cell: EditableCell,
        }),
        columnHelper.accessor('po_or_limit', {
            header: 'PO OR LIMIT',
            cell: EditableCell,
        }),
        columnHelper.accessor('items_not_allowed', {
            header: 'ITEMS NOT ALLOWED',
            cell: EditableCell,
        }),
        columnHelper.accessor('items_order', {
            header: 'ITEMS ORDER',
            cell: EditableCell,
        }),
        columnHelper.accessor('others', {
            header: 'OTHERS-1',
            cell: EditableCell,
        }),
        columnHelper.accessor('others_2', {
            header: 'OTHERS-2',
            cell: EditableCell,
        }),
        columnHelper.accessor('others_3', {
            header: 'OTHERS-3',
            cell: EditableCell,
        }),
        columnHelper.accessor('date', {
            header: 'DATE',
            cell: EditableCell,
        }),
        columnHelper.accessor('diser_company_sv', {
            header: 'SV-CON',
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('diser_hold_stop_allow', {
            header: 'HOLD STOP ALLOW-CON',
            cell: (info) => info.getValue(),
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: (props: { row: Row<Store> }) => (
                <Button variant="destructive" size="sm" onClick={() => requestDelete(props.row.index)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            ),
        }),
    ], [columnHelper, EditableCell]);

    const table = useReactTable({
        data, // Use original data, not sortedData
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            columnVisibility: Object.fromEntries(PREDEFINED_VIEWS[selectedView].hiddenColumns.map((col) => [col, false])),
            sorting: [{ id: 'name', desc: false }], // Set initial sorting here too
        },
        state: {
            globalFilter: debouncedFilter,
            columnVisibility,
            sorting,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setDebouncedFilter,
        onColumnVisibilityChange: setColumnVisibility,
        // Enable sorting
        enableSorting: true,
        // Custom sorting functions can be defined here if needed
        sortingFns: {
            // Example: custom sorting for name field that handles null values
            nameSort: (rowA, rowB, columnId) => {
                const a = rowA.getValue(columnId) as string;
                const b = rowB.getValue(columnId) as string;
                
                // Handle null/undefined values
                if (!a && !b) return 0;
                if (!a) return 1;
                if (!b) return -1;
                
                return a.localeCompare(b);
            },
        },
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

    const handleViewChange = (viewKey: string) => {
        setSelectedView(viewKey as ViewKey);
    };

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
                cellPadding: 0.5,
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: 20,
                fontSize: 9,
                fontStyle: 'bold',
                lineWidth: 0.1,
            },
            margin: { top: 30, left: 0.5, right: 0.5, bottom: 10 },
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

    // Show loading or error states
    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Store Masterfile" />
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
            <Head title="Store Masterfile" />
            <div className="container mx-auto px-2 py-6">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Store Masterfile</h1>
                    <div className="flex gap-2">
                        {isLoading && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                Saving...
                            </div>
                        )}
                        <Select value={selectedView} onValueChange={handleViewChange}>
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
                                {(() => {
                                    const headerGroup = table.getHeaderGroups()[0];
                                    return table
                                        .getAllColumns()
                                        .filter((column) => column.id !== 'actions')
                                        .map((column) => {
                                            let headerText = column.id.charAt(0).toUpperCase() + column.id.slice(1).replace(/_/g, ' ');
                                            
                                            if (headerGroup) {
                                                const headerObj = headerGroup.headers.find(h => h.column.id === column.id);
                                                if (headerObj) {
                                                    const rendered = flexRender(column.columnDef.header, headerObj.getContext());
                                                    if (typeof rendered === 'string') {
                                                        headerText = rendered;
                                                    } else if (React.isValidElement(rendered)) {
                                                        // Extract text content from React elements
                                                        const extractText = (element: React.ReactElement): string => {
                                                            const props = element.props as { children?: React.ReactNode };
                                                            if (typeof props.children === 'string') {
                                                                return props.children;
                                                            } else if (Array.isArray(props.children)) {
                                                                return props.children
                                                                    .map((child: any) => {
                                                                        if (typeof child === 'string') return child;
                                                                        if (React.isValidElement(child)) return extractText(child);
                                                                        return '';
                                                                    })
                                                                    .join(' ')
                                                                    .trim();
                                                            }
                                                            return '';
                                                        };
                                                        headerText = extractText(rendered) || headerText;
                                                    }
                                                }
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
                                        });
                                })()}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AddStoreModal onStoreAdded={handleStoreAdded} />
                    </div>
                </div>

                <div className="rounded-md border ">
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
                                    {table.getHeaderGroups().map((headerGroup: HeaderGroup<Store>) => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map((header: Header<Store, unknown>, index: number) => (
                                                <th
                                                    key={header.id}
                                                    className={`border-b px-4 py-2 text-left font-medium whitespace-normal ${
                                                            header.column.id === 'name' ? 'sticky left-0 z-50 bg-white min-w-[200px]' : 'min-w-[200px]'
                                                    } sticky top-0 z-40 bg-white`}
                                                    style={{
                                                        minWidth: header.column.id === 'name' ? '200px' : '200px',
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
                        <DialogTitle>Delete store?</DialogTitle>
                        <DialogDescription>
                            {pendingDeleteIndex !== null ? `Are you sure you want to delete "${data[pendingDeleteIndex]?.name}"?` : ''}
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