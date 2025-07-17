import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Diser } from '@/types/diser';
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
import { Eye, FileDown, Filter, Search, Settings2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DISER_VIEWS as PREDEFINED_VIEWS } from '@/lib/previews';
import { AddDiserModal } from '@/components/add-diser-modal';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Diser Masterfile',
        href: '/diser-masterfile',
    },
];



type ViewKey = keyof typeof PREDEFINED_VIEWS;

type DiserMasterfileProps = {
    disers: Diser[];
};

type PendingUpdate = {
    id: number;
    changes: Record<string, string>;
};

export default function DiserMasterfile({ disers }: DiserMasterfileProps) {
    const [data, setData] = useState<Diser[]>(disers);
    const [globalFilter, setGlobalFilter] = useState('');
    const [debouncedFilter, setDebouncedFilter] = useState('');
    const [selectedView, setSelectedView] = useState<ViewKey>('all');
    const [hideZeroSales, setHideZeroSales] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'name', desc: false },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const columnHelper = createColumnHelper<Diser>();
    const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
    const batchUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Add columnVisibility state
    const [columnVisibility, setColumnVisibility] = useState(() =>
        Object.fromEntries(PREDEFINED_VIEWS[selectedView].hiddenColumns.map((col) => [col, false]))
    );

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
            await axios.post('/disers/batch-update', { updates });
            toast.success(`Successfully updated ${updates.length} changes`);
            pendingUpdatesRef.current.clear();
        } catch (error) {
            const errorMessage = 'Failed to save changes';
            toast.error(errorMessage);
            setError(errorMessage);
            // Revert all pending changes
            setData(disers);
            pendingUpdatesRef.current.clear();
        } finally {
            setIsLoading(false);
        }
    }, [disers]);

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
            const diser = data[rowIndex];
            const key = `${diser.id}-${columnId}`;
            // Update or create pending update
            const existingUpdate = pendingUpdatesRef.current.get(key);
            if (existingUpdate) {
                existingUpdate.changes[columnId] = value;
            } else {
                pendingUpdatesRef.current.set(key, {
                    id: diser.id,
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
        const diser = data[rowIndex];
        try {
            await axios.delete(`/disers/${diser.id}`);
            setData((old) => old.filter((_, index) => index !== rowIndex));
            toast.success('Diser deleted successfully');
        } catch (error) {
            toast.error('Failed to delete diser');
        }
    };

    // Memoized ReadOnlyCell
    const ReadOnlyCell = useCallback(({ getValue }: CellContext<Diser, string>) => {
        const value = getValue();
        return <div className="px-2 py-1">{value}</div>;
    }, []);

    // Memoized NumberCell
    const NumberCell = useCallback(({ getValue, row, column, table }: CellContext<Diser, number>) => {
        const initialValue = getValue();
        const [value, setValue] = useState(initialValue?.toString() || '');
        const onBlur = useCallback(() => {
            // Only allow numbers and decimal points
            const numericValue = value.replace(/[^0-9.]/g, '');
            const numValue = parseFloat(numericValue) || 0;
            handleCellChange(row.index, column.id, numValue.toString());
        }, [row.index, column.id, value]);
        const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            // Allow typing numbers, decimal points, and backspace
            if (inputValue === '' || /^[0-9]*\.?[0-9]*$/.test(inputValue)) {
                setValue(inputValue);
            }
        }, []);
        return <Input type="number" step="0.01" min="0" value={value} onChange={handleChange} onBlur={onBlur} className="text-right" />;
    }, [handleCellChange]);

    // Memoized ComputedTotalCell
    const ComputedTotalCell = useCallback(({ row }: { row: Row<Diser> }) => {
        const currentFbName = row.getValue('fb_name') as string;
        // Calculate total for all rows with the same fb_name
        const total = data
            .filter((item) => item.fb_name === currentFbName)
            .reduce((sum, item) => {
                const rate = typeof item.rate === 'number' ? item.rate : parseFloat(item.rate) || 0;
                const sales = typeof item.sales === 'number' ? item.sales : parseFloat(item.sales) || 0;
                return sum + rate * sales;
            }, 0);
        return <div className="px-2 py-1 text-right font-medium">{total.toFixed(2)}</div>;
    }, [data]);

    // Memoized EditableCell
    const EditableCell = useCallback(({ getValue, row, column, table }: CellContext<Diser, string>) => {
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

    // Memoized RateCell for percentage display
    const RateCell = useCallback(({ getValue, row, column }: CellContext<Diser, number>) => {
        // Convert decimal to percentage for display
        const initialValue = getValue();
        const [value, setValue] = useState(
            initialValue !== undefined && initialValue !== null
                ? (parseFloat(initialValue.toString()) * 100).toString()
                : ''
        );

        const onBlur = useCallback(() => {
            // Convert back to decimal before saving
            const numericValue = value.replace(/[^0-9.]/g, '');
            const decimalValue = numericValue === '' ? 0 : parseFloat(numericValue) / 100;
            handleCellChange(row.index, column.id, decimalValue.toString());
        }, [row.index, column.id, value]);

        const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            // Allow typing numbers, decimal points, and backspace
            if (inputValue === '' || /^[0-9]*\.?[0-9]*$/.test(inputValue)) {
                setValue(inputValue);
            }
        }, []);

        return (
            <div className="flex items-center">
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={value}
                    onChange={handleChange}
                    onBlur={onBlur}
                    className="text-right"
                />
                <span className="ml-1">%</span>
            </div>
        );
    }, [handleCellChange]);

    // Memoized columns
    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: ({ column }) => (
                <div className="flex cursor-pointer items-center" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    NAME
                    {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
                </div>
            ),
            cell: ReadOnlyCell,
            enableSorting: true,
            sortingFn: 'alphanumeric',
        }),
        columnHelper.accessor('rsc_re', {
            header: 'RSC RE',
            cell: EditableCell,
        }),
        columnHelper.accessor('fb_name', {
            header: 'FB NAME',
            cell: EditableCell,
        }),
        columnHelper.accessor('rate', {
            header: 'RATE',
            cell: RateCell,
        }),
        columnHelper.accessor('sales', {
            header: 'SALES',
            cell: NumberCell,
        }),
        columnHelper.display({
            id: 'total',
            header: 'TOTAL',
            cell: ComputedTotalCell,
        }),
        columnHelper.accessor('others_1', {
            header: 'OTHERS-4',
            cell: EditableCell,
        }),
        columnHelper.accessor('hold_stop_allow', {
            header: 'HOLD STOP ALLOW-CON',
            cell: EditableCell,
        }),
        columnHelper.accessor('gcash_number', {
            header: 'GCASH NUMBER',
            cell: EditableCell,
        }),
        columnHelper.accessor('gcash_name', {
            header: 'GCASH NAME',
            cell: EditableCell,
        }),
        columnHelper.accessor('sv_only', {
            header: 'OTHERS-5',
            cell: EditableCell,
        }),
        columnHelper.accessor('company_sv', {
            header: 'SV-CON',
            cell: EditableCell,
        }),
        columnHelper.accessor('others_2', {
            header: 'OTHERS-6',
            cell: EditableCell,
        }),
        columnHelper.accessor('others_3', {
            header: 'OTHERS-7',
            cell: EditableCell,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: (props: { row: Row<Diser> }) => (
                <Button variant="destructive" size="sm" onClick={() => handleDelete(props.row.index)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            ),
        }),
    ], [columnHelper, EditableCell, handleDelete, ReadOnlyCell, NumberCell, ComputedTotalCell, RateCell]);

    // Apply zero sales filter using a custom filter function
    const filteredData = useMemo(() => {
        if (!hideZeroSales) return data;
        return data.filter((item) => {
            const sales = typeof item.sales === 'number' ? item.sales : parseFloat(String(item.sales)) || 0;
            return sales > 0;
        });
    }, [data, hideZeroSales]);

    // Update table data when filter changes
    useEffect(() => {
        setData(disers);
    }, [disers]);

    const handleViewChange = (viewKey: string) => {
        setSelectedView(viewKey as ViewKey);
    };

    const handleDiserAdded = (newDiser: Diser) => {
        setData([...data, newDiser]);
    };

    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            columnVisibility: Object.fromEntries(PREDEFINED_VIEWS[selectedView].hiddenColumns.map((col) => [col, false])),
            sorting: [
                { id: 'name', desc: false },
            ],
        },
        state: {
            globalFilter: debouncedFilter,
            columnVisibility,
            sorting,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setDebouncedFilter,
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

    const exportToPDF = () => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        // Add title
        doc.setFontSize(23);
        doc.text('Diser Masterfile', 14, 15);

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
        const filteredData = table.getFilteredRowModel().rows.map((row) =>
            visibleColumns.map((column) => {
                if (column.id === 'total') {
                    // Compute total as in ComputedTotalCell
                    const currentFbName = row.getValue('fb_name');
                    const total = data
                        .filter((item) => item.fb_name === currentFbName)
                        .reduce((sum, item) => {
                            const rate = typeof item.rate === 'number' ? item.rate : parseFloat(item.rate) || 0;
                            const sales = typeof item.sales === 'number' ? item.sales : parseFloat(item.sales) || 0;
                            return sum + rate * sales;
                        }, 0);
                    return total.toFixed(2);
                }
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
        doc.save('diser-masterfile.pdf');
    };


    // Show loading or error states
    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Diser Masterfile" />
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
            <Head title="Diser Masterfile" />
            <div className="container mx-auto px-2 py-6">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Diser Masterfile</h1>
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
                        <div className="flex items-center space-x-2 rounded-md border px-3 py-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hide-zero-sales"
                                    checked={hideZeroSales}
                                    onCheckedChange={(checked) => setHideZeroSales(checked as boolean)}
                                />
                                <Label htmlFor="hide-zero-sales" className="text-sm">
                                    Hide Zero Sales
                                </Label>
                            </div>
                        </div>
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
                        <AddDiserModal onDiserAdded={handleDiserAdded} />
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
                                    {table.getHeaderGroups().map((headerGroup: HeaderGroup<Diser>) => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map((header: Header<Diser, unknown>, index: number) => (
                                                <th
                                                    key={header.id}
                                                    className={`border-b px-4 py-2 text-left font-medium whitespace-normal bg-white sticky top-0 z-20 ${
                                                        index === 0 ? 'sticky left-0 z-30 bg-white shadow-sm' : ''
                                                    }`}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map((row: Row<Diser>) => (
                                        <tr key={row.id}>
                                            {row.getVisibleCells().map((cell, index: number) => (
                                                <td
                                                    key={cell.id}
                                                    className={`min-w-fit border-b px-4 py-2 whitespace-normal ${
                                                        index === 0 ? 'sticky left-0 z-10 bg-white shadow-sm' : ''
                                                    }`}
                                                >
                                                    <div className="flex min-h-[2.5rem] max-w-fit min-w-[200px] items-center">
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
