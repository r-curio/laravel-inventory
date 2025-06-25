import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

interface FactoryPDFProps {
    number: number;
    groupedInventory: {
        productId: string;
        stores: {
            storeName: string;
            finalOrder: number;
        }[];
        totalOrder: number;
        factory?: string;
    }[];
    date: string;
}

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        padding: 40,
        fontSize: 12,
    },
    pageHeader: {
        marginBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    table: {
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        paddingVertical: 4,
        marginBottom: 4,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    productIDCol: {
        width: '70%',
        fontSize: 16,
        textAlign: 'center',
    },
    factoryCol: {
        width: '30%',
        textAlign: 'center',
    },
    nameCol: {
        width: '55%',
        paddingLeft: 4,
    },
    dateCol: {
        width: '15%',
        textAlign: 'center',
    },
    quantityCol: {
        width: '15%',
        textAlign: 'center',
        paddingRight: 4,
    },
    statusCol: {
        width: '15%',
        textAlign: 'center',
    },
    totalCol: {
        width: '70%',
        textAlign: 'right',
        fontWeight: 'bold',
    },
    totalValueCol: {
        width: '30%',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    totalRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingVertical: 4,
        fontWeight: 'bold',
    },
    productGroup: {
        flexDirection: 'column',
        marginBottom: 20,
    },
});

export const TotalPDF: React.FC<FactoryPDFProps> = ({ number, groupedInventory, date }) => {
    console.log('Rendering PDF with data:', { groupedInventory, date });

    try {
        const [formattedDate, formattedTime] = date.split(' ');

        return (
            <Document>
                <Page size="LETTER" style={styles.page} wrap>
                    {/* Header with date, store_number, time, and barcode number */}
                    <View style={styles.pageHeader}>
                        <View style={styles.headerRow}>
                            <Text>{formattedDate}</Text>
                            <Text>Barcode Release Number: {number}</Text>
                        </View>
                    </View>

                    {/* Table Section */}
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={styles.nameCol}>Name</Text>
                            <Text style={styles.dateCol}>Date</Text>
                            <Text style={styles.quantityCol}>Quantity</Text>
                            <Text style={styles.statusCol}>Status</Text>
                        </View>

                        {/* Table Body */}
                        {groupedInventory.map((item) => {
                            console.log('Processing item:', item);
                            return (
                                <View key={item.productId} style={styles.productGroup}>
                                    {/* Product Row */}
                                    <View style={styles.tableRow}>
                                        <Text style={styles.productIDCol}>{item.productId}</Text>
                                        <Text style={styles.factoryCol}>{item.factory}</Text>
                                    </View>

                                    {/* Store Rows */}
                                    {item.stores.map((store) => (
                                        <View key={store.storeName} style={styles.tableRow}>
                                            <Text style={styles.nameCol}>{store.storeName}</Text>
                                            <Text style={styles.dateCol}>{formattedDate}</Text>
                                            <Text style={styles.quantityCol}>{store.finalOrder}</Text>
                                            <Text style={styles.statusCol}>Order</Text>
                                        </View>
                                    ))}

                                    {/* Total Row */}
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalCol}>TOTAL</Text>
                                        <Text style={styles.totalValueCol}>{item.totalOrder}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </Page>
            </Document>
        );
    } catch (error) {
        console.error('Error rendering PDF:', error);
        return (
            <Document>
                <Page size="LETTER">
                    <View>
                        <Text>Error generating PDF</Text>
                    </View>
                </Page>
            </Document>
        );
    }
};
