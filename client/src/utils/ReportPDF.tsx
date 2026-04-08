import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register font for Vietnamese characters
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Roboto',
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#1F2937',
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 10,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#F3F4F6',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 10,
    fontWeight: 700,
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
  },
  footer: {
    marginTop: 50,
    textAlign: 'right',
  },
  total: {
    fontSize: 16,
    fontWeight: 700,
    marginTop: 20,
  }
});

interface ReportPDFProps {
  data: any[];
  title: string;
  summary: any;
}

// Create Document Component
const ReportPDF = ({ data, title, summary }: ReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.header}>
        <View>
          <Text>Khách sạn: Luxury Hotel QLKS</Text>
          <Text>Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</Text>
        </View>
        <View>
          <Text>Tổng doanh thu: {new Intl.NumberFormat('vi-VN').format(summary.totalRevenue)}đ</Text>
          <Text>Tổng đơn đặt: {summary.totalBookings}</Text>
        </View>
      </View>

      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Tháng</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Doanh thu</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Số đơn</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Trung bình/đơn</Text></View>
        </View>

        {/* Table Rows */}
        {data.map((row, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{row.name}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{new Intl.NumberFormat('vi-VN').format(row.revenue)}đ</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{row.bookings}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>
              {row.bookings > 0 ? new Intl.NumberFormat('vi-VN').format(row.revenue / row.bookings) : 0}đ
            </Text></View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={{marginTop: 10, fontSize: 10, fontStyle: 'italic'}}>Ký tên xác nhận</Text>
      </View>
    </Page>
  </Document>
);

export default ReportPDF;
