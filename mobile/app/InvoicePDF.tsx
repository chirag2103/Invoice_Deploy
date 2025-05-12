import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../services/api';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ToWords } from 'to-words';

interface Product {
  name: string;
  quantity: number;
  uom: string;
  rate: number;
}

interface Customer {
  name: string;
  address: string;
  gstNo: string;
}

interface InvoiceDetails {
  customer: string;
  challanNo?: string;
  gst: number;
  invoicefor: string;
  invoiceNo: string;
  invoiceProducts: Product[];
  date: string;
  grandTotal: number;
  totalAmount: number;
  challanDate?: string;
}

const InvoicePDF = () => {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const toWords = new ToWords({
    localeCode: 'en-IN',
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      doNotAddOnly: false,
      currencyOptions: {
        name: 'Rupee',
        plural: 'Rupees',
        symbol: '₹',
        fractionalUnit: {
          name: 'Paisa',
          plural: 'Paise',
          symbol: '',
        },
      },
    },
  });

  useEffect(() => {
    if (!invoiceId) return;
    const fetchInvoice = async () => {
      try {
        const response = await api.get(`/invoice/${invoiceId}`);
        setInvoice(response.data.invoice);
        console.log(response.data.invoice);
        const res = await api.get(
          `/customer/${response.data.invoice.customer}`
        );
        setCustomer(res.data.customer);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch invoice details.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  const generatePDF = async () => {
    console.log('generatePDF called');
    console.log('Platform:', Platform.OS);
    console.log(invoice);
    if (!invoice) {
      Alert.alert('Error', 'Invoice data is missing.');
      return;
    }
    if (!customer) {
      Alert.alert('Error', 'Customer data is missing.');
      return;
    }
    // Create HTML content similar to Print.jsx but simplified for React Native PDF generation
    const htmlContent = `
      <h2 style="text-align:center;">TAX INVOICE</h2>
      <h3 style="text-align:center;">${invoice.invoicefor}</h3>
      <p><b>Invoice No:</b> HEW${invoice.invoiceNo}</p>
      <p><b>Date:</b> ${invoice.date}</p>
      <p><b>Challan No:</b> ${invoice.challanNo || ''}</p>
      <p><b>Customer Name:</b> ${customer.name}</p>
      <p><b>Customer Address:</b> ${customer.address}</p>
      <p><b>Customer GSTIN:</b> ${customer.gstNo}</p>
      <table border="1" style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Sr.No</th>
            <th>Particulars</th>
            <th>Quantity</th>
            <th>UOM</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.invoiceProducts
            .map(
              (p, i) => `
            <tr>
              <td style="text-align:center;">${i + 1}</td>
              <td>${p.name}</td>
              <td style="text-align:center;">${p.quantity}</td>
              <td style="text-align:center;">${p.uom}</td>
              <td style="text-align:center;">${p.rate}</td>
              <td style="text-align:center;">${p.quantity * p.rate}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <p><b>Subtotal:</b> ${invoice.totalAmount}</p>
      <p><b>CGST (${invoice.gst}%):</b> ${(
      invoice.totalAmount *
      (invoice.gst / 100)
    ).toFixed(2)}</p>
      <p><b>SGST (${invoice.gst}%):</b> ${(
      invoice.totalAmount *
      (invoice.gst / 100)
    ).toFixed(2)}</p>
      <p><b>Grand Total:</b> ${invoice.grandTotal}</p>
      <p><b>Rupees in Words:</b> ${toWords.convert(invoice.grandTotal, {
        currency: true,
      })}</p>
      <p><b>Bank Details:</b></p>
      <p>Bank Name: Central Bank of India</p>
      <p>A/C No: 3243013874</p>
      <p>IFSC: CBIN0280532</p>
      <p>Subject to Anand jurisdiction</p>
    `;

    try {
      const options = {
        html: htmlContent,
        fileName: `Invoice_HEW${invoice.invoiceNo}`,
        directory: 'Documents',
      };

      if (Platform.OS === 'android') {
        console.log(
          'Skipping explicit storage permission request on Android due to scoped storage'
        );
        // On Android 11+ scoped storage is enforced and WRITE_EXTERNAL_STORAGE permission is deprecated.
        // We rely on scoped storage and catch errors if permission is denied.
      }

      const file = await RNHTMLtoPDF.convert(options);

      Alert.alert('Success', `PDF saved to ${file.filePath}`, [
        {
          text: 'Open',
          onPress: () => {
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
              Sharing.shareAsync(file.filePath);
            }
          },
        },
        { text: 'OK' },
      ]);
      console.log(`Downloaded file saved at: ${file.filePath}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#0000ff' />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invoice not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Invoice HEW{invoice.invoiceNo}</Text>
      <Text style={styles.subHeader}>Date: {invoice.date}</Text>
      <Text style={styles.subHeader}>
        Customer: {customer ? customer.name : ''}
      </Text>
      <Text style={styles.subHeader}>
        GSTIN: {customer ? customer.gstNo : ''}
      </Text>
      <Text style={styles.subHeader}>
        Address: {customer ? customer.address : ''}
      </Text>

      <View style={styles.productsHeader}>
        <Text style={[styles.productCell, { flex: 0.5 }]}>Sr.No</Text>
        <Text style={[styles.productCell, { flex: 2 }]}>Particulars</Text>
        <Text style={[styles.productCell, { flex: 1 }]}>Qty</Text>
        <Text style={[styles.productCell, { flex: 1 }]}>UOM</Text>
        <Text style={[styles.productCell, { flex: 1 }]}>Rate</Text>
        <Text style={[styles.productCell, { flex: 1 }]}>Amount</Text>
      </View>
      {invoice.invoiceProducts.map((product, index) => (
        <View key={index} style={styles.productRow}>
          <Text style={[styles.productCell, { flex: 0.5 }]}>{index + 1}</Text>
          <Text style={[styles.productCell, { flex: 2, fontWeight: 'bold' }]}>
            {product.name}
          </Text>
          <Text style={[styles.productCell, { flex: 1 }]}>
            {product.quantity}
          </Text>
          <Text style={[styles.productCell, { flex: 1 }]}>{product.uom}</Text>
          <Text style={[styles.productCell, { flex: 1 }]}>{product.rate}</Text>
          <Text style={[styles.productCell, { flex: 1 }]}>
            {product.quantity * product.rate}
          </Text>
        </View>
      ))}

      <View style={styles.totals}>
        <Text>Subtotal: {invoice.totalAmount}</Text>
        <Text>
          CGST ({invoice.gst}%):{' '}
          {(invoice.totalAmount * (invoice.gst / 100)).toFixed(2)}
        </Text>
        <Text>
          SGST ({invoice.gst}%):{' '}
          {(invoice.totalAmount * (invoice.gst / 100)).toFixed(2)}
        </Text>
        <Text style={styles.grandTotal}>Grand Total: {invoice.grandTotal}</Text>
        <Text>
          Rupees in Words:{' '}
          {toWords.convert(invoice.grandTotal, { currency: true })}
        </Text>
      </View>

      <TouchableOpacity style={styles.downloadButton} onPress={generatePDF}>
        <Text style={styles.downloadButtonText}>Download PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    marginBottom: 4,
  },
  productsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 4,
    marginTop: 12,
  },
  productRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  productCell: {
    fontSize: 14,
    textAlign: 'center',
  },
  totals: {
    marginTop: 16,
  },
  grandTotal: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
  downloadButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InvoicePDF;
