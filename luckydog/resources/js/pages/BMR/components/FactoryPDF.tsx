import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

interface FactoryPDFProps {
    factory: string;
    products: Array<{
        productId: string;
        total: number;
    }>;
}

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 12,
    },
    header: {
        marginBottom: 20,
        textAlign: 'center',
    },
    title: {
        fontSize: 20,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 10,
        color: '#666',
    },
    table: {
        width: '100%',
        border: '1pt solid black',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid black',
        minHeight: 24,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
    },
    productCell: {
        width: '70%',
        padding: 8,
        borderRight: '1pt solid black',
    },
    totalCell: {
        width: '30%',
        padding: 8,
        textAlign: 'right',
    },
    totalRow: {
        backgroundColor: '#f8f8f8',
        fontWeight: 'bold',
    },
    signatureSection: {
        marginTop: 50,
        width: '100%',
    },
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    signatureField: {
        width: '30%',
    },
    signatureLine: {
        borderBottom: '1pt solid black',
        marginBottom: 5,
        paddingBottom: 5,
    },
    signatureLabel: {
        fontSize: 10,
        textAlign: 'center',
    },
});

const ROWS_PER_PAGE = 20;

const FactoryPDF: React.FC<FactoryPDFProps> = ({ factory, products }) => {
    const totalSum = products.reduce((sum, product) => sum + Number(product.total), 0);

    // Calculate total number of pages needed
    const totalPages = Math.ceil(products.length / ROWS_PER_PAGE);

    // Create array of page contents
    const pages = Array.from({ length: totalPages }, (_, pageIndex) => {
        const startIdx = pageIndex * ROWS_PER_PAGE;
        const pageProducts = products.slice(startIdx, startIdx + ROWS_PER_PAGE);
        const isLastPage = pageIndex === totalPages - 1;

        return (
            <Page key={pageIndex} size="LETTER" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>BARCODE RELEASE ({factory})</Text>
                    <Text style={styles.date}>
                        {new Date().toLocaleDateString()} - Page {pageIndex + 1} of {totalPages}
                    </Text>
                </View>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={styles.productCell}>Product ID</Text>
                        <Text style={styles.totalCell}>Total</Text>
                    </View>
                    {pageProducts.map((product, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.productCell}>{product.productId}</Text>
                            <Text style={styles.totalCell}>{product.total}</Text>
                        </View>
                    ))}
                    {isLastPage && (
                        <View style={[styles.tableRow, styles.totalRow]}>
                            <Text style={styles.productCell}>Total</Text>
                            <Text style={styles.totalCell}>{totalSum}</Text>
                        </View>
                    )}
                </View>

                {isLastPage && (
                    <View style={styles.signatureSection}>
                        <View style={styles.signatureRow}>
                            <View style={styles.signatureField}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureLabel}>Released By</Text>
                            </View>
                            <View style={styles.signatureField}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureLabel}>Received By</Text>
                            </View>
                            <View style={styles.signatureField}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureLabel}>Assembled By</Text>
                            </View>
                        </View>
                    </View>
                )}
            </Page>
        );
    });

    return <Document>{pages}</Document>;
};

export default FactoryPDF;
