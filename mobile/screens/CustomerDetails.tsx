import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';

interface RouteParams {
  params: {
    customerId: string;
  };
}

interface Customer {
  _id: string;
  name: string;
  gstNo: string;
  address: string;
}

interface Invoice {
  _id: string;
  invoiceNo?: string;
  date?: string;
  grandTotal: number;
}

interface Payment {
  _id: string;
  amountPaid: number;
  date?: string;
}

const CustomerDetails = ({route}: {route: RouteParams}) => {
  const {customerId} = route.params;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const customerRes = await api.get(`/customers`);
        const foundCustomer = customerRes.data.customers.find(
          (c: Customer) => c._id === customerId,
        );
        setCustomer(foundCustomer);

        const invoicesRes = await api.get(`/customer/${customerId}/invoices`);
        setInvoices(invoicesRes.data.invoices || []);

        const paymentsRes = await api.get(`/customer/${customerId}/payments`);
        setPayments(paymentsRes.data.payments || []);
      } catch (error) {
        console.error('Error fetching customer details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerDetails();
  }, [customerId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Customer not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{customer.name}</Text>
      <Text style={styles.subHeader}>GST No: {customer.gstNo}</Text>
      <Text style={styles.subHeader}>Address: {customer.address}</Text>

      <Text style={styles.sectionHeader}>Invoices</Text>
      {invoices.length === 0 ? (
        <Text>No invoices found.</Text>
      ) : (
        invoices.map(invoice => (
          <View key={invoice._id} style={styles.item}>
            <Text>Invoice No: {invoice.invoiceNo || invoice._id}</Text>
            <Text>
              Date:{' '}
              {invoice.date
                ? new Date(invoice.date).toLocaleDateString()
                : 'N/A'}
            </Text>
            <Text>Grand Total: {invoice.grandTotal}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionHeader}>Payments</Text>
      {payments.length === 0 ? (
        <Text>No payments found.</Text>
      ) : (
        payments.map(payment => (
          <View key={payment._id} style={styles.item}>
            <Text>Amount Paid: {payment.amountPaid}</Text>
            <Text>
              Date:{' '}
              {payment.date
                ? new Date(payment.date).toLocaleDateString()
                : 'N/A'}
            </Text>
          </View>
        ))
      )}
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  item: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
});

export default CustomerDetails;
