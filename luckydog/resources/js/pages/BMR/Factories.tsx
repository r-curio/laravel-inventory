import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Barcode } from '@/types/barcode';
import { Head, router } from '@inertiajs/react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ArrowRight, Printer } from 'lucide-react';
import { useMemo } from 'react';
import FactoryPDF from './components/FactoryPDF';

export default function Factories(props: { barcodes: Barcode[] }) {
    const { barcodes } = props;

    // Group barcodes by factory
    const groupedByFactory = useMemo(() => {
        const grouped = {
            m30: [] as Barcode[],
            apollo: [] as Barcode[],
            site3: [] as Barcode[],
        };

        barcodes.forEach((barcode) => {
            if (barcode.m30 > 0) {
                grouped.m30.push({ ...barcode, factory_value: barcode.m30, factory_name: 'M30' });
            }
            if (barcode.apollo > 0) {
                grouped.apollo.push({ ...barcode, factory_value: barcode.apollo, factory_name: 'APOLLO' });
            }
            if (barcode.site3 > 0) {
                grouped.site3.push({ ...barcode, factory_value: barcode.site3, factory_name: 'SITE 3' });
            }
        });

        return grouped;
    }, [barcodes]);

    // Calculate totals for each factory
    const factoryTotals = useMemo(() => {
        return {
            m30: groupedByFactory.m30.reduce((sum, item) => sum + (item.factory_value ?? 0), 0),
            apollo: groupedByFactory.apollo.reduce((sum, item) => sum + (item.factory_value ?? 0), 0),
            site3: groupedByFactory.site3.reduce((sum, item) => sum + (item.factory_value ?? 0), 0),
        };
    }, [groupedByFactory]);

    // Prepare data for PDF generation
    const getPDFData = (factoryKey: string) => {
        const factoryData = groupedByFactory[factoryKey as keyof typeof groupedByFactory];
        return factoryData.map((item) => ({
            productId: item.item_name || item.name,
            total: item.factory_value || 0,
        }));
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Batch PO', href: '/bmr/index' },
        { title: 'Factories', href: '/bmr/factories' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Factories - Barcode Management" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Barcode Release</h1>
                            <p className="mt-2 text-sm text-gray-600">Showing {barcodes.length} items assigned to factories</p>
                        </div>
                        <Button onClick={() => router.visit('/bmr/barcode')} className="flex items-center gap-2">
                            Next Step
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {/* M30 Factory */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="text-xl font-semibold text-blue-600">M30 Factory</span>
                                    <PDFDownloadLink
                                        document={<FactoryPDF factory="M30" products={getPDFData('m30')} />}
                                        fileName={`M30-Factory-${new Date().toISOString().split('T')[0]}.pdf`}
                                    >
                                        {({ blob, url, loading, error }) => (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={loading || groupedByFactory.m30.length === 0}
                                                className="flex items-center gap-2"
                                            >
                                                <Printer className="h-4 w-4" />
                                                {loading ? 'Generating...' : 'Print PDF'}
                                            </Button>
                                        )}
                                    </PDFDownloadLink>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {groupedByFactory.m30.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-200">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">
                                                        Item Name
                                                    </th>
                                                    <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                                                        Quantity
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupedByFactory.m30.map((item, index) => (
                                                    <tr key={`m30-${item.id}-${index}`} className="hover:bg-gray-50">
                                                        <td className="border border-gray-200 px-4 py-2">{item.item_name || item.name}</td>
                                                        <td className="border border-gray-200 px-4 py-2 text-center font-medium">
                                                            {item.factory_value}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="py-4 text-center text-gray-500">No items assigned to M30 factory</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* APOLLO Factory */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="text-xl font-semibold text-green-600">APOLLO Factory</span>
                                    <PDFDownloadLink
                                        document={<FactoryPDF factory="APOLLO" products={getPDFData('apollo')} />}
                                        fileName={`APOLLO-Factory-${new Date().toISOString().split('T')[0]}.pdf`}
                                    >
                                        {({ blob, url, loading, error }) => (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={loading || groupedByFactory.apollo.length === 0}
                                                className="flex items-center gap-2"
                                            >
                                                <Printer className="h-4 w-4" />
                                                {loading ? 'Generating...' : 'Print PDF'}
                                            </Button>
                                        )}
                                    </PDFDownloadLink>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {groupedByFactory.apollo.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-200">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">
                                                        Item Name
                                                    </th>
                                                    <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                                                        Quantity
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupedByFactory.apollo.map((item, index) => (
                                                    <tr key={`apollo-${item.id}-${index}`} className="hover:bg-gray-50">
                                                        <td className="border border-gray-200 px-4 py-2">{item.item_name || item.name}</td>
                                                        <td className="border border-gray-200 px-4 py-2 text-center font-medium">
                                                            {item.factory_value}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="py-4 text-center text-gray-500">No items assigned to APOLLO factory</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* SITE 3 Factory */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="text-xl font-semibold text-purple-600">SITE 3 Factory</span>
                                    <PDFDownloadLink
                                        document={<FactoryPDF factory="SITE 3" products={getPDFData('site3')} />}
                                        fileName={`SITE3-Factory-${new Date().toISOString().split('T')[0]}.pdf`}
                                    >
                                        {({ blob, url, loading, error }) => (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={loading || groupedByFactory.site3.length === 0}
                                                className="flex items-center gap-2"
                                            >
                                                <Printer className="h-4 w-4" />
                                                {loading ? 'Generating...' : 'Print PDF'}
                                            </Button>
                                        )}
                                    </PDFDownloadLink>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {groupedByFactory.site3.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-200">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">
                                                        Item Name
                                                    </th>
                                                    <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                                                        Quantity
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupedByFactory.site3.map((item, index) => (
                                                    <tr key={`site3-${item.id}-${index}`} className="hover:bg-gray-50">
                                                        <td className="border border-gray-200 px-4 py-2">{item.item_name || item.name}</td>
                                                        <td className="border border-gray-200 px-4 py-2 text-center font-medium">
                                                            {item.factory_value}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="py-4 text-center text-gray-500">No items assigned to SITE 3 factory</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
