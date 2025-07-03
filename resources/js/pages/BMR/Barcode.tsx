import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type Barcode } from '@/types/barcode';
import { Head } from '@inertiajs/react';
import { PDFDownloadLink } from '@react-pdf/renderer';
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
import { Save, Search, Settings2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { BarcodePDF } from './components/BarcodePDF';

type ColumnMeta = {
    className?: string;
};

type BarcodeShowProps = {
    barcodes: Barcode[];
};

export default function BarcodeShow({ barcodes: initialBarcodes }: BarcodeShowProps) {
    console.log('Initial Barcodes:', initialBarcodes);

    const [data, setData] = useState<Barcode[]>(initialBarcodes);
    const [globalFilter, setGlobalFilter] = useState('');
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 100,
    });
    const [columnVisibility, setColumnVisibility] = useState({});
    const columnHelper = createColumnHelper<Barcode>();
    const pendingUpdatesRef = useRef<Map<string, any>>(new Map());
    const dataRef = useRef<Barcode[]>(initialBarcodes);
    const [isSaving, setIsSaving] = useState(false);
    const [showPDF, setShowPDF] = useState(false);
    const [pdfData, setPdfData] = useState<Barcode[]>([]);
    const [pdfDate, setPdfDate] = useState('');

    // Keep dataRef in sync with data state
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    const handleSave = useCallback(async () => {
        const updates = Array.from(pendingUpdatesRef.current.values());

        if (updates.length === 0) {
            toast.info('No changes to save');
            return;
        }

        setIsSaving(true);
        try {
            await axios.post('/bmr/barcode/batch-update', { updates });
            toast.success(`Successfully saved ${updates.length} changes`);
            pendingUpdatesRef.current.clear();

            // Prepare PDF data after successful save
            const currentDate = new Date().toLocaleDateString();
            const filteredData = data.filter((item) => item.f_request > 0); // Only include items with final request > 0

            if (filteredData.length > 0) {
                setPdfData(filteredData);
                setPdfDate(currentDate);
                setShowPDF(true);
                toast.success('PDF ready for download');
            }
        } catch (error) {
            console.error('Batch update failed:', error);
            toast.error('Failed to save changes');
            setData(initialBarcodes);
            pendingUpdatesRef.current.clear();
        } finally {
            setIsSaving(false);
        }
    }, [initialBarcodes, data]);

    const handleCellChange = useCallback(
        (rowIndex: number, columnId: string, value: string) => {
            // Calculate the absolute row index based on current page
            const absoluteRowIndex = rowIndex + pagination.pageIndex * pagination.pageSize;

            setData((old) =>
                old.map((row, index) => {
                    if (index === absoluteRowIndex) {
                        const updatedRow = {
                            ...row,
                            [columnId]: value,
                        };

                        // Calculate total if one of the relevant fields changed
                        if (['begbal', 'm30', 'apollo', 'site3'].includes(columnId)) {
                            const begbal = Number(updatedRow.begbal) || 0;
                            const m30 = Number(updatedRow.m30) || 0;
                            const apollo = Number(updatedRow.apollo) || 0;
                            const site3 = Number(updatedRow.site3) || 0;

                            const total = begbal - (m30 + apollo + site3);
                            updatedRow.total = total;
                        }

                        // Calculate endbal if one of the relevant fields changed
                        if (['actual', 'purchase', 'returns', 'damaged'].includes(columnId)) {
                            const actual = Number(updatedRow.actual) || 0;
                            const purchase = Number(updatedRow.purchase) || 0;
                            const returns = Number(updatedRow.returns) || 0;
                            const damaged = Number(updatedRow.damaged) || 0;

                            const endbal = actual + purchase + returns + damaged;
                            updatedRow.endbal = endbal;
                        }

                        // Calculate final_total when endbal changes
                        if (['endbal'].includes(columnId)) {
                            const endbal = Number(updatedRow.endbal) || 0;
                            const reorder_point = Number(updatedRow.reorder_point) || 0;
                            const final_total = reorder_point - endbal;
                            updatedRow.final_total = final_total;
                        }

                        // Calculate s_request when final_total changes
                        if (['final_total'].includes(columnId)) {
                            const final_total = Number(updatedRow.final_total) || 0;
                            const s_request = Math.ceil(final_total / 10) * 10;
                            updatedRow.s_request = s_request;
                        }

                        // Calculate s_request when endbal changes (since it affects final_total)
                        if (['actual', 'purchase', 'returns', 'damaged'].includes(columnId)) {
                            const actual = Number(updatedRow.actual) || 0;
                            const purchase = Number(updatedRow.purchase) || 0;
                            const returns = Number(updatedRow.returns) || 0;
                            const damaged = Number(updatedRow.damaged) || 0;
                            const reorder_point = Number(updatedRow.reorder_point) || 0;

                            const endbal = actual + purchase + returns + damaged;
                            const final_total = reorder_point - endbal;
                            const s_request = Math.ceil(final_total / 10) * 10;

                            updatedRow.endbal = endbal;
                            updatedRow.final_total = final_total;
                            updatedRow.s_request = s_request;
                        }

                        return updatedRow;
                    }
                    return row;
                }),
            );

            // Get the barcode from the current data state using ref
            const barcode = dataRef.current[absoluteRowIndex];

            if (!barcode) {
                console.error('No barcode found at index:', absoluteRowIndex);
                return;
            }

            const key = `${barcode.id}-${columnId}`;

            const existingUpdate = pendingUpdatesRef.current.get(key);
            if (existingUpdate) {
                existingUpdate.changes[columnId] = value;
            } else {
                const newUpdate = {
                    id: barcode.id,
                    changes: { [columnId]: value },
                };
                pendingUpdatesRef.current.set(key, newUpdate);
            }

            // If we're updating one of the fields that affects total, also update the derived fields
            if (['begbal', 'm30', 'apollo', 'site3'].includes(columnId)) {
                const updatedRow = dataRef.current[absoluteRowIndex];
                const begbal = Number(updatedRow.begbal) || 0;
                const m30 = Number(updatedRow.m30) || 0;
                const apollo = Number(updatedRow.apollo) || 0;
                const site3 = Number(updatedRow.site3) || 0;

                const total = begbal + m30 + apollo + site3;

                const totalKey = `${barcode.id}-total`;

                // Update total field
                pendingUpdatesRef.current.set(totalKey, {
                    id: barcode.id,
                    changes: { total },
                });
            }

            // If we're updating one of the fields that affects endbal, also update final_total
            if (['actual', 'purchase', 'returns', 'damaged'].includes(columnId)) {
                const updatedRow = dataRef.current[absoluteRowIndex];
                const actual = Number(updatedRow.actual) || 0;
                const purchase = Number(updatedRow.purchase) || 0;
                const returns = Number(updatedRow.returns) || 0;
                const damaged = Number(updatedRow.damaged) || 0;

                const endbal = actual + purchase + returns + damaged;
                const reorder_point = Number(updatedRow.reorder_point) || 0;
                const final_total = reorder_point - endbal;
                const s_request = Math.ceil(final_total / 10) * 10;

                const endbalKey = `${barcode.id}-endbal`;
                const finalTotalKey = `${barcode.id}-final_total`;
                const sRequestKey = `${barcode.id}-s_request`;

                // Update endbal, final_total, and s_request fields
                pendingUpdatesRef.current.set(endbalKey, {
                    id: barcode.id,
                    changes: { endbal },
                });
                pendingUpdatesRef.current.set(finalTotalKey, {
                    id: barcode.id,
                    changes: { final_total },
                });
                pendingUpdatesRef.current.set(sRequestKey, {
                    id: barcode.id,
                    changes: { s_request },
                });
            }
        },
        [pagination],
    );

    const handleDelete = async (rowIndex: number) => {
        const barcode = data[rowIndex];
        try {
            await axios.delete(`/bmr/barcode/${barcode.id}`);
            setData((old) => old.filter((_, index) => index !== rowIndex));
            toast.success('Barcode removed successfully');
        } catch (error) {
            toast.error('Failed to remove barcode');
        }
    };

    const EditableCell = ({ getValue, row, column, table }: CellContext<Barcode, number | null | undefined>) => {
        const initialValue = getValue();
        const [value, setValue] = useState(initialValue?.toString() ?? '');
        const inputRef = useRef<HTMLInputElement>(null);

        const onBlur = () => {
            const numValue = value === '' ? null : Number(value);
            handleCellChange(row.index, column.id, numValue?.toString() ?? '');
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            if (newValue === '' || newValue === '-' || /^-?\d*\.?\d*$/.test(newValue)) {
                setValue(newValue);
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const currentCell = e.currentTarget;
                const currentRow = currentCell.closest('tr');
                const currentCellIndex = Array.from(currentRow?.querySelectorAll('td') || []).indexOf(currentCell.closest('td')!);
                const allRows = Array.from(table.getRowModel().rows);
                const currentRowIndex = allRows.indexOf(row);

                if (e.shiftKey) {
                    // Handle Shift+Tab (move backward)
                    if (currentCellIndex > 0) {
                        // Move to previous cell in same row
                        const prevCell = currentRow?.querySelectorAll('td')[currentCellIndex - 1];
                        const prevInput = prevCell?.querySelector('input');
                        prevInput?.focus();
                    } else if (currentRowIndex > 0) {
                        // Move to last cell of previous row
                        const prevRow = allRows[currentRowIndex - 1];
                        const prevRowCells = prevRow.getVisibleCells();
                        const lastCell = prevRowCells[prevRowCells.length - 1];
                        const lastInput = lastCell.column.columnDef.cell === EditableCell ? (lastCell.getValue() as HTMLInputElement) : null;
                        lastInput?.focus();
                    }
                } else {
                    // Handle Tab (move forward)
                    if (currentCellIndex < (currentRow?.querySelectorAll('td').length || 0) - 1) {
                        // Move to next cell in same row
                        const nextCell = currentRow?.querySelectorAll('td')[currentCellIndex + 1];
                        const nextInput = nextCell?.querySelector('input');
                        nextInput?.focus();
                    } else if (currentRowIndex < allRows.length - 1) {
                        // Move to first cell of next row
                        const nextRow = allRows[currentRowIndex + 1];
                        const nextRowCells = nextRow.getVisibleCells();
                        const firstCell = nextRowCells[0];
                        const firstInput = firstCell.column.columnDef.cell === EditableCell ? (firstCell.getValue() as HTMLInputElement) : null;
                        firstInput?.focus();
                    }
                }
            }
        };

        return (
            <Input ref={inputRef} type="text" value={value} onChange={handleChange} onBlur={onBlur} onKeyDown={handleKeyDown} className="w-full" />
        );
    };

    const TextCell = ({ getValue, row, column }: CellContext<Barcode, string>) => {
        const [value, setValue] = useState(getValue() ?? '');
        const inputRef = useRef<HTMLInputElement>(null);

        const onBlur = () => {
            handleCellChange(row.index, column.id, value);
        };

        return <Input ref={inputRef} type="text" value={value} onChange={(e) => setValue(e.target.value)} onBlur={onBlur} className="w-full" />;
    };

    const columns = [
        columnHelper.accessor('name', {
            header: 'NAME',
            cell: (info) => info.getValue(),
            meta: {
                className: 'sticky left-0 bg-white z-10 border-r',
            } as ColumnMeta,
        }),
        columnHelper.accessor('begbal', {
            header: 'BEG BAL',
            cell: EditableCell,
        }),
        columnHelper.accessor('m30', {
            header: 'M30',
            cell: EditableCell,
        }),
        columnHelper.accessor('apollo', {
            header: 'APOLLO',
            cell: EditableCell,
        }),
        columnHelper.accessor('site3', {
            header: 'SITE3',
            cell: EditableCell,
        }),
        columnHelper.accessor('total', {
            header: 'TOTAL',
            cell: (info) => info.getValue()?.toString() ?? '-',
        }),
        columnHelper.accessor('actual', {
            header: 'ACTUAL',
            cell: EditableCell,
        }),
        columnHelper.accessor('purchase', {
            header: 'PURCHASE',
            cell: EditableCell,
        }),
        columnHelper.accessor('returns', {
            header: 'RETURNS',
            cell: EditableCell,
        }),
        columnHelper.accessor('damaged', {
            header: 'DAMAGED',
            cell: EditableCell,
        }),
        columnHelper.accessor('endbal', {
            header: 'END BAL',
            cell: (info) => info.getValue()?.toString() ?? '-',
        }),
        columnHelper.accessor('reorder_point', {
            header: 'REORDER POINT',
            cell: (info) => info.getValue()?.toString() ?? '-',
        }),
        columnHelper.accessor('final_total', {
            header: 'FINAL TOTAL',
            cell: (info) => info.getValue()?.toString() ?? '-',
        }),
        columnHelper.accessor('s_request', {
            header: 'S REQUEST',
            cell: (info) => info.getValue()?.toString() ?? '-',
        }),
        columnHelper.accessor('f_request', {
            header: 'F REQUEST',
            cell: EditableCell,
        }),
        columnHelper.accessor('notes', {
            header: 'NOTES',
            cell: TextCell,
        }),
        columnHelper.accessor('condition', {
            header: 'CONDITION',
            cell: TextCell,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'ACTIONS',
            cell: (props: { row: Row<Barcode> }) => (
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
        onPaginationChange: setPagination,
        onColumnVisibilityChange: (updater) => {
            if (typeof updater === 'function') {
                setColumnVisibility((prev) => ({ ...prev, ...updater(prev) }));
            } else {
                setColumnVisibility((prev) => ({ ...prev, ...updater }));
            }
        },
        state: {
            globalFilter,
            pagination,
            columnVisibility,
        },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row: Row<Barcode>, columnId: string, filterValue: string) => {
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

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'BMR',
            href: '/bmr/index',
        },
        {
            title: 'Barcode',
            href: '/bmr/barcode',
        },
    ];

    const pendingChangesCount = pendingUpdatesRef.current.size;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Barcode Management" />
            <div className="container mx-auto px-2 py-6">
                <div className="mb-2 rounded-lg bg-white p-2 shadow">
                    <h1 className="mb-2 text-2xl font-bold">Barcode Monitoring Request</h1>
                    <p className="text-gray-600">Manage barcode data and inventory information</p>
                </div>

                <div className="rounded-md border">
                    <div className="p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="relative max-w-sm flex-1">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search all columns..."
                                    value={globalFilter ?? ''}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="pl-8"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleSave} disabled={isSaving || pendingChangesCount === 0} className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    {isSaving ? 'Saving...' : 'Generate Barcodes'}
                                </Button>

                                {showPDF && (
                                    <PDFDownloadLink
                                        document={<BarcodePDF data={pdfData} date={pdfDate} />}
                                        fileName={`barcode-release-${pdfDate}.pdf`}
                                        className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                                    >
                                        {({ loading }) => (
                                            <>
                                                <Save className="h-4 w-4" />
                                                {loading ? 'Generating PDF...' : 'Download PDF'}
                                            </>
                                        )}
                                    </PDFDownloadLink>
                                )}

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
                            </div>
                        </div>
                        <div className="max-h-[500px] overflow-x-auto">
                            <table className="w-full overflow-y-auto">
                                <thead>
                                    {table.getHeaderGroups().map((headerGroup: HeaderGroup<Barcode>) => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map((header: Header<Barcode, unknown>) => (
                                                <th
                                                    key={header.id}
                                                    className={`border-b px-4 py-2 text-left font-medium whitespace-normal ${(header.column.columnDef.meta as ColumnMeta)?.className || ''}`}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map((row: Row<Barcode>) => (
                                        <tr key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    className={`min-w-fit border-b px-4 py-2 whitespace-normal ${(cell.column.columnDef.meta as ColumnMeta)?.className || ''}`}
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
