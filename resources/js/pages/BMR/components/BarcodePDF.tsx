import { Barcode } from '@/types/barcode';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 5,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#999',
        paddingVertical: 3,
    },
    cell: {
        flex: 1,
        paddingHorizontal: 2,
    },
    title: {
        fontSize: 16,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 10,
        marginBottom: 20,
    },
});

interface BarcodePDFProps {
    data: Barcode[];
    date: string;
}

export const BarcodePDF: React.FC<BarcodePDFProps> = ({ data, date }) => (
    <Document>
        <Page size="LETTER" style={styles.page}>
            <Text style={styles.title}>BARCODE RELEASE</Text>
            <Text style={styles.date}>{date}</Text>

            <View style={styles.header}>
                <Text style={styles.cell}>Product ID</Text>
                <Text style={styles.cell}>Beg Bal</Text>
                <Text style={styles.cell}>Actual</Text>
                <Text style={styles.cell}>Final Request</Text>
            </View>

            {data.map((item, index) => (
                <View key={index} style={styles.row}>
                    <Text style={styles.cell}>{item.item_name}</Text>
                    <Text style={styles.cell}>{item.begbal}</Text>
                    <Text style={styles.cell}>{item.endbal}</Text>
                    <Text style={styles.cell}>{item.f_request}</Text>
                </View>
            ))}
        </Page>
    </Document>
);
