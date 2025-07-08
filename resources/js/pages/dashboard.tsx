import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle, Clock, Store } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

type Store = {
    id: number;
    name: string;
    co: string;
    is_processed: boolean;
};

type DashboardProps = {
    stores: Store[];
};

function groupStoresByCo(stores: Store[]): Record<string, Store[]> {
    return stores.reduce((groups, store) => {
        const prefix = store.co || 'Other';
        if (!groups[prefix]) groups[prefix] = [];
        groups[prefix].push(store);
        return groups;
    }, {} as Record<string, Store[]>);
}

function sortStoresAlphabetically(stores: Store[]): Store[] {
    return stores.sort((a, b) => a.name.localeCompare(b.name));
}

export default function Dashboard({ stores }: DashboardProps) {
    const [search, setSearch] = useState('');
    // Filter stores by search term (case-insensitive)
    const filteredStores = stores.filter((store) => store.name.toLowerCase().includes(search.toLowerCase()));
    const grouped = groupStoresByCo(filteredStores);

    // Sort prefixes alphabetically
    const sortedPrefixes = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    // Sort stores alphabetically within each group
    sortedPrefixes.forEach(prefix => {
        grouped[prefix] = sortStoresAlphabetically(grouped[prefix]);
    });

    // Calculate statistics
    const totalStores = stores.length;
    const processedStores = stores.filter((store) => store.is_processed).length;
    const pendingStores = totalStores - processedStores;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mb-6">
                    <h2 className="mb-4 text-2xl font-bold text-gray-900">Store Inventory Dashboard</h2>

                    {/* Statistics Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Store className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Stores</p>
                                    <p className="text-2xl font-bold text-gray-900">{totalStores}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Processed</p>
                                    <p className="text-2xl font-bold text-green-600">{processedStores}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Clock className="h-8 w-8 text-orange-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Pending</p>
                                    <p className="text-2xl font-bold text-orange-600">{pendingStores}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-4 flex w-full justify-between pr-4">
                    <input
                        type="text"
                        placeholder="Search stores..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    />
                    <Link href="/bmr/index" className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800">
                        Generate BMR
                    </Link>
                </div>

                {sortedPrefixes.map(prefix => (
                    <div key={prefix} className="mb-8">
                        <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-800">{prefix}</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {grouped[prefix].map((store) => (
                                <Link
                                    key={store.id}
                                    href={`/stores/${store.id}`}
                                    className={`group block rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                                        store.is_processed
                                            ? 'border-green-200 bg-green-50 hover:bg-green-100'
                                            : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                                    }`}
                                >
                                    <div className="p-4">
                                        <div className="mb-3 flex items-start justify-between">
                                            <h4 className="font-semibold text-gray-900 group-hover:text-gray-700">{store.name}</h4>
                                            <div
                                                className={`flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                    store.is_processed ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                                }`}
                                            >
                                                {store.is_processed ? (
                                                    <>
                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                        Processed
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        Pending
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center text-sm text-gray-600">
                                            {store.is_processed ? (
                                                <span className="flex items-center text-green-700">
                                                    <CheckCircle className="mr-1 h-4 w-4" />
                                                    Inventory completed
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-orange-700">
                                                    <Clock className="mr-1 h-4 w-4" />
                                                    Awaiting processing
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredStores.length === 0 && (
                    <div className="mt-8 text-center">
                        <div className="text-lg text-gray-500">No stores found.</div>
                        <div className="mt-2 text-sm text-gray-400">Try adjusting your search terms.</div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
