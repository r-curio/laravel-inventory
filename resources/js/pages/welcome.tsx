import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6 text-gray-900 lg:justify-center lg:p-8 dark:from-gray-900 dark:to-gray-800 dark:text-white">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-block rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium leading-normal text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="inline-block rounded-lg border border-transparent px-5 py-2 text-sm font-medium leading-normal text-gray-700 hover:border-gray-300 dark:text-gray-200 dark:hover:border-gray-600"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="inline-block rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium leading-normal text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </header>
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <main className="flex w-full max-w-[335px] flex-col-reverse lg:max-w-6xl lg:flex-row lg:gap-12">
                        <div className="flex-1 rounded-br-lg rounded-bl-lg bg-white p-6 pb-12 text-[13px] leading-[20px] shadow-xl lg:rounded-tl-lg lg:rounded-br-none lg:p-12 dark:bg-gray-800 dark:text-gray-200">
                            <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Inventory Management System</h1>
                            <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">
                                Streamline your inventory operations with our comprehensive management solution.
                                Track items, manage stores, and monitor stock levels efficiently.
                            </p>
                            
                            <div className="mb-8 grid gap-4 md:grid-cols-2">
                                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Item Management</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Manage your product catalog with detailed item information, barcodes, and pricing.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Store Management</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Organize multiple store locations with comprehensive store profiles and settings.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Stock Tracking</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Monitor stock levels across all locations with real-time updates and alerts.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Reporting</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Generate comprehensive reports and export data for analysis and planning.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    >
                                        Go to Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                        >
                                            Get Started
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="inline-block rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                        >
                                            Create Account
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="relative -mb-px aspect-[335/376] w-full shrink-0 overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-500 to-indigo-600 lg:mb-0 lg:-ml-px lg:aspect-auto lg:w-[500px] lg:rounded-t-none lg:rounded-r-lg">
                            <div className="flex h-full items-center justify-center p-8">
                                <div className="text-center text-white">
                                    <div className="mb-6 text-6xl">📦</div>
                                    <h2 className="mb-4 text-2xl font-bold">Inventory Control</h2>
                                    <p className="text-blue-100">
                                        Efficient • Organized • Reliable
                                    </p>
                                </div>
                            </div>
                            <div className="absolute inset-0 rounded-t-lg shadow-[inset_0px_0px_0px_1px_rgba(0,0,0,0.1)] lg:rounded-t-none lg:rounded-r-lg" />
                        </div>
                    </main>
                </div>
                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
