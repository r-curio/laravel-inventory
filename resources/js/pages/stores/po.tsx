import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Item, type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type CellContext,
    type Header,
    type HeaderGroup,
    type Row,
    type SortingState,
} from '@tanstack/react-table';
import axios from 'axios';
import { Search, Settings2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import ReportModal from './components/report-modal';

type Store = {
    id: number;
    name: string;
    co: string | null;
    dc: string | null;
    dr_stamped: string | null;
    area_size: string | null;
    overstock: string | null;
    ratbites: string | null;
    closed: string | null;
    no_diser: string | null;
    class: string | null;
    pullout_status: string | null;
    dgcage_status: string | null;
    tshirt_status: string | null;
    litter_box_status: string | null;
    pet_bed_status: string | null;
    gondola_dep: string | null;
    date_depo_refund: string | null;
    missing_deliveries: string | null;
    items_on_order: string | null;
    po_or_limit: string | null;
    items_not_allowed: string | null;
    items_order: string | null;
    others: string | null;
};

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

type StoreShowProps = {
    store: Store;
    items: any[];
    storeItems: StoreItem[];
};

export default function StoreShow({ store, items, storeItems: initialStoreItems }: StoreShowProps) {
    console.log('Initial Store Items:', initialStoreItems);

    const [data, setData] = useState<StoreItem[]>(initialStoreItems);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([
        {
            id: 'm_no',
            desc: false,
        },
    ]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 100,
    });
    const [columnVisibility, setColumnVisibility] = useState({
        m_no: false,
    });
    const columnHelper = createColumnHelper<StoreItem>();
    const pendingUpdatesRef = useRef<Map<string, any>>(new Map());
    const batchUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dataRef = useRef<StoreItem[]>(initialStoreItems);

    // Keep dataRef in sync with data state
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    const processBatchUpdate = useCallback(async () => {
        const updates = Array.from(pendingUpdatesRef.current.values());

        if (updates.length === 0) return;

        try {
            await axios.post(`/stores/${store.id}/items/batch-update`, { updates });
            // toast.success(`Successfully updated ${updates.length} changes`);
            pendingUpdatesRef.current.clear();
        } catch (error) {
            console.error('Batch update failed:', error);
            // toast.error('Failed to save changes');
            setData(initialStoreItems);
            pendingUpdatesRef.current.clear();
        }
    }, [store.id, initialStoreItems]);

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
                        if (['order', 'inventory', 'dr_6578', 'dr_958', 'pic_53'].includes(columnId)) {
                            const order = Number(updatedRow.order) || 0;
                            const inventory = Number(updatedRow.inventory) || 0;
                            const dr_6578 = Number(updatedRow.dr_6578) || 0;
                            const dr_958 = Number(updatedRow.dr_958) || 0;
                            const pic_53 = Number(updatedRow.pic_53) || 0;

                            const total = order + inventory + dr_6578 + dr_958 + pic_53;
                            updatedRow.total = total;

                            // Calculate s_divide_2 (total/2 rounded up)
                            updatedRow.s_divide_2 = Math.ceil(total / 2);

                            // Calculate s_order_2 (if total is odd, add 1, otherwise same as total)
                            updatedRow.s_order_2 = total % 2 === 0 ? total : total + 1;

                            // Calculate s_order_5 (next number divisible by 5)
                            updatedRow.s_order_5 = Math.ceil(total / 5) * 5;
                        }

                        return updatedRow;
                    }
                    return row;
                }),
            );

            // Get the store item from the current data state using ref
            const storeItem = dataRef.current[absoluteRowIndex];

            if (!storeItem) {
                console.error('No store item found at index:', absoluteRowIndex);
                return;
            }

            const key = `${storeItem.id}-${columnId}`;

            const existingUpdate = pendingUpdatesRef.current.get(key);
            if (existingUpdate) {
                existingUpdate.changes[columnId] = value;
            } else {
                const newUpdate = {
                    id: storeItem.id,
                    changes: { [columnId]: value },
                };
                pendingUpdatesRef.current.set(key, newUpdate);
            }

            // If we're updating one of the fields that affects total, also update the derived fields
            if (['order', 'inventory', 'dr_6578', 'dr_958', 'pic_53'].includes(columnId)) {
                const updatedRow = dataRef.current[absoluteRowIndex];
                const order = Number(updatedRow.order) || 0;
                const inventory = Number(updatedRow.inventory) || 0;
                const dr_6578 = Number(updatedRow.dr_6578) || 0;
                const dr_958 = Number(updatedRow.dr_958) || 0;
                const pic_53 = Number(updatedRow.pic_53) || 0;

                const total = order + inventory + dr_6578 + dr_958 + pic_53;
                const s_divide_2 = Math.ceil(total / 2);
                const s_order_2 = total % 2 === 0 ? total : total + 1;
                const s_order_5 = Math.ceil(total / 5) * 5;

                const totalKey = `${storeItem.id}-total`;
                const s_divide_2Key = `${storeItem.id}-s_divide_2`;
                const s_order_2Key = `${storeItem.id}-s_order_2`;
                const s_order_5Key = `${storeItem.id}-s_order_5`;

                // Update all derived fields
                pendingUpdatesRef.current.set(totalKey, {
                    id: storeItem.id,
                    changes: { total },
                });
                pendingUpdatesRef.current.set(s_divide_2Key, {
                    id: storeItem.id,
                    changes: { s_divide_2 },
                });
                pendingUpdatesRef.current.set(s_order_2Key, {
                    id: storeItem.id,
                    changes: { s_order_2 },
                });
                pendingUpdatesRef.current.set(s_order_5Key, {
                    id: storeItem.id,
                    changes: { s_order_5 },
                });
            }

            if (batchUpdateTimeoutRef.current) {
                clearTimeout(batchUpdateTimeoutRef.current);
            }

            batchUpdateTimeoutRef.current = setTimeout(processBatchUpdate, 3000);
        },
        [processBatchUpdate, pagination],
    );

    useEffect(() => {
        return () => {
            if (batchUpdateTimeoutRef.current) {
                clearTimeout(batchUpdateTimeoutRef.current);
            }
        };
    }, []);

    const handleDelete = async (rowIndex: number) => {
        const storeItem = data[rowIndex];
        try {
            await axios.delete(`/stores/${store.id}/items/${storeItem.id}`);
            setData((old) => old.filter((_, index) => index !== rowIndex));
            toast.success('Item removed from store successfully');
        } catch (error) {
            toast.error('Failed to remove item from store');
        }
    };

    const EditableCell = ({ getValue, row, column, table }: CellContext<StoreItem, number | null>) => {
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

    const columns = [
        columnHelper.accessor('m_no', {
            header: ({ column }) => (
                <div className="flex cursor-pointer items-center" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    M No
                    {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ''}
                </div>
            ),
            cell: (info) => info.getValue(),
            sortingFn: 'alphanumeric',
        }),
        columnHelper.accessor('item_name', {
            header: 'Item Name',
            cell: (info) => info.getValue(),
            meta: {
                className: 'sticky left-0 z-10 bg-white',
            },
        }),
        columnHelper.accessor('order', {
            header: 'ORDER',
            cell: EditableCell,
        }),
        columnHelper.accessor('inventory', {
            header: 'Inventory',
            cell: EditableCell,
        }),
        columnHelper.accessor('dr_6578', {
            header: 'DR 1',
            cell: EditableCell,
        }),
        columnHelper.accessor('dr_958', {
            header: 'DR 2',
            cell: EditableCell,
        }),
        columnHelper.accessor('pic_53', {
            header: 'PIC',
            cell: EditableCell,
        }),
        columnHelper.accessor('total', {
            header: 'TOTAL',
            cell: EditableCell,
        }),
        columnHelper.accessor('s_divide_2', {
            header: 'S/2',
            cell: EditableCell,
        }),
        columnHelper.accessor('s_order_2', {
            header: 'S ORDER 2',
            cell: EditableCell,
        }),
        columnHelper.accessor('s_order_5', {
            header: 'S ORDER 5',
            cell: EditableCell,
        }),
        columnHelper.accessor('final_order', {
            header: 'FINAL ORDER',
            cell: EditableCell,
        }),
        columnHelper.accessor('item_multiples', {
            header: 'MULTIPLES',
            cell: EditableCell,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: (props: { row: Row<StoreItem> }) => (
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
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
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
            sorting,
            pagination,
            columnVisibility,
        },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row: Row<StoreItem>, columnId: string, filterValue: string) => {
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
            title: store.name,
            href: `/stores/${store.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={store.name} />
            <div className="container mx-auto px-2 py-6">
                <div className="mb-2 rounded-lg bg-white p-2 shadow">
                    <h1 className="mb-2 text-2xl font-bold">{store.name}</h1>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {(() => {
                            const fieldMappings = {
                                dc: 'DC',
                                area_size: 'Area Size',
                                overstock: 'Overstock',
                                ratbites: 'Ratbites',
                                closed: 'Closed',
                                no_diser: 'No Diser',
                                class: 'Class',
                                pullout_status: 'Pullout Status',
                                dgcage_status: 'Dgcage Status',
                                tshirt_status: 'Tshirt Status',
                                litter_box_status: 'Litter Box Status',
                                missing_deliveries: 'Missing Delivery',
                                po_or_limit: 'PO or Limit',
                                items_not_allowed: 'Items Not Allowed',
                                items_order: 'Items Order'
                            };

                            return Object.entries(fieldMappings)
                                .filter(([field]) => {
                                    const value = store[field as keyof typeof store];
                                    return value && value.toString().trim() !== '';
                                })
                                .map(([field, displayName]) => (
                                    <div key={field}>
                                        <p className="text-sm font-medium text-gray-500">{displayName}</p>
                                        <p className="mt-1">{store[field as keyof typeof store]}</p>
                                    </div>
                                ));
                        })()}
                    </div>
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
                                <ReportModal data={data} storeName={store.name} storeLocation={store.dc} storeId={store.id} />
                            </div>
                        </div>
                        <div className="max-h-[700px] overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    {table.getHeaderGroups().map((headerGroup: HeaderGroup<StoreItem>) => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map((header: Header<StoreItem, unknown>) => (
                                                <th
                                                    key={header.id}
                                                    className={`border-b px-4 py-2 text-left font-medium whitespace-normal ${
                                                        header.column.id === 'name' ? 'sticky left-0 z-10 bg-white' : ''
                                                    }`}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map((row: Row<StoreItem>) => (
                                        <tr key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    className={`min-w-fit border-b px-4 py-2 whitespace-normal ${
                                                        cell.column.id === 'item_name' ? 'sticky left-0 z-10 bg-white' : ''
                                                    }`}
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
