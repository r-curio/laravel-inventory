import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

interface InventoryPDFProps {
    storeName: string;
    poNumber: string;
    boxNumber: number;
    storeItems: Array<{
        id: number;
        item_name: string;
        final_order: number;
    }>;
    storeLocation?: string | null;
}

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 16,
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottom: 1,
        paddingBottom: 10,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    table: {
        width: '100%',
        marginTop: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        padding: 8,
        fontSize: 16,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        minHeight: 30,
        alignItems: 'center',
        marginBottom: 1,
    },
    productColumn: {
        maxWidth: '45%',
        minWidth: '45%',
        paddingRight: 8,
        textAlign: 'left',
    },
    quantityColumn: {
        maxWidth: '15%',
        minWidth: '15%',
        textAlign: 'left',
    },
    checkColumn: {
        maxWidth: '10%',
        minWidth: '10%',
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex',
    },
    notesColumn: {
        maxWidth: '45%',
        minWidth: '45%',
    },
    circle: {
        width: 30,
        height: 30,
        borderRadius: 50,
        border: '1px solid black',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoText: {
        fontSize: 16,
        color: '#666',
    },
    pageNumber: {
        position: 'absolute',
        fontSize: 12,
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'grey',
    },
    signatureSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 40,
        paddingTop: 20,
        width: '100%',
    },
    signatureBlock: {
        width: '45%',
    },
    signatureLine: {
        borderTop: '1px solid black',
        marginTop: 30,
    },
    signatureLabel: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 5,
    },
});

const ITEMS_PER_PAGE = 16;

const InventoryPDF = ({ storeName, poNumber, boxNumber, storeItems, storeLocation }: InventoryPDFProps) => {
    // Create products object for the PDF
    const products = storeItems.reduce(
        (acc, item) => {
            acc[item.id.toString()] = {
                name: item.item_name,
                quantity: item.final_order || 0,
            };
            return acc;
        },
        {} as { [key: string]: { name: string; quantity: number } },
    );

    // Split products into pages
    const productEntries = Object.entries(products);
    const productPages = [];

    for (let i = 0; i < productEntries.length; i += ITEMS_PER_PAGE) {
        productPages.push(productEntries.slice(i, i + ITEMS_PER_PAGE));
    }

    // If no products, create at least one empty page
    if (productPages.length === 0) {
        productPages.push([]);
    }

    const currentDate = new Date().toLocaleDateString();

    return (
        <Document>
            {productPages.map((pageProducts, pageIndex) => (
                <Page key={pageIndex} size="LETTER" style={styles.page} wrap>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerText}>{storeName}</Text>
                            <Text style={styles.infoText}>{currentDate}</Text>
                            <Text style={styles.infoText}>{storeLocation || 'N/A'}</Text>
                        </View>
                        <View>
                            <Text style={styles.infoText}>P.O. Number: {poNumber}</Text>
                            <Text style={styles.infoText}>No. of Box: {boxNumber}</Text>
                        </View>
                    </View>

                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.productColumn}>Product Name</Text>
                            <Text style={styles.quantityColumn}>Quantity</Text>
                            <Text style={styles.checkColumn}></Text>
                            <Text style={styles.notesColumn}>Notes</Text>
                        </View>

                        {pageProducts.map(([id, data]: [string, { name: string; quantity: number }]) => (
                            <View key={id} style={styles.row}>
                                <Text style={styles.productColumn}>{data.name}</Text>
                                <Text style={styles.quantityColumn}>{data.quantity}</Text>
                                <Text style={styles.notesColumn}>_________________________</Text>
                            </View>
                        ))}
                    </View>

                    {/* Only show signature section on the last page */}
                    {pageIndex === productPages.length - 1 && (
                        <View style={styles.signatureSection}>
                            <View style={styles.signatureBlock}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureLabel}>Encoded by</Text>
                            </View>
                            <View style={styles.signatureBlock}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureLabel}>Reviewed by</Text>
                            </View>
                        </View>
                    )}

                    <Text style={styles.pageNumber}>
                        Page {pageIndex + 1} of {productPages.length}
                    </Text>
                </Page>
            ))}
        </Document>
    );
};

export default InventoryPDF;
