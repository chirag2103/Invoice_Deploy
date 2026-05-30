import { useEffect, useMemo, useState } from 'react';
import { HiTrendingDown, HiTrendingUp } from 'react-icons/hi';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import AdminSidebar from '../components/AdminSidebar';
import { fetchInvoices } from '../slices/invoiceSlice';
import { fetchPayments } from '../slices/paymentSlice';
import { fetchPurchaseInvoices } from '../slices/purchaseInvoiceSlice';
import { fetchPurchasePayments } from '../slices/purchasePaymentSlice';
import {
  formatDocumentNumber,
  formatNumberWithCommas,
  getFinancialYearFromDate,
} from '../services/helper';
import { generateMonthlyInvoicesPDF } from '../services/pdfGeneratorService';

const MONTHS = [
  { label: 'April', month: 3 },
  { label: 'May', month: 4 },
  { label: 'June', month: 5 },
  { label: 'July', month: 6 },
  { label: 'August', month: 7 },
  { label: 'September', month: 8 },
  { label: 'October', month: 9 },
  { label: 'November', month: 10 },
  { label: 'December', month: 11 },
  { label: 'January', month: 0 },
  { label: 'February', month: 1 },
  { label: 'March', month: 2 },
];

const Dashboard = () => {
  const dispatch = useDispatch();
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    document.title = 'Dashboard';
    setLoading(true);
    Promise.all([
      dispatch(fetchInvoices()),
      dispatch(fetchPayments()),
      dispatch(fetchPurchaseInvoices()),
      dispatch(fetchPurchasePayments()),
    ]).finally(() => setLoading(false));
  }, [dispatch]);

  const { invoices } = useSelector((state) => state.invoice);
  const { payments } = useSelector((state) => state.payment);
  const { purchaseInvoices } = useSelector((state) => state.purchaseInvoice);
  const { purchasePayments } = useSelector((state) => state.purchasePayment);

  const availableYears = useMemo(() => {
    const yearSet = new Set();

    invoices.forEach((invoice) => {
      yearSet.add(
        invoice.financialYearLabel || getFinancialYearFromDate(invoice.date)
      );
    });

    if (yearSet.size === 0) {
      yearSet.add(getFinancialYearFromDate(new Date()));
    }

    return Array.from(yearSet).sort((first, second) => {
      const firstYear = Number(`20${first.split('-')[0]}`);
      const secondYear = Number(`20${second.split('-')[0]}`);
      return secondYear - firstYear;
    });
  }, [invoices]);

  useEffect(() => {
    if (!selectedYear && availableYears.length > 0) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const financialYearData = useMemo(() => {
    if (!selectedYear) {
      return {
        monthlyData: [],
        totals: {
          revenue: 0,
          receipts: 0,
          purchaseBills: 0,
          sellerPayments: 0,
          outstandingReceivables: 0,
          pendingPayables: 0,
          netCashFlow: 0,
        },
        highlights: {
          averageInvoiceValue: 0,
          collectionEfficiency: 0,
          bestMonth: null,
          busiestMonth: null,
        },
        recentInvoices: [],
      };
    }

    const [startYY] = selectedYear.split('-');
    const startYear = Number(`20${startYY}`);

    const monthlyData = MONTHS.map((entry, index) => {
      const year = index < 9 ? startYear : startYear + 1;

      const monthInvoices = invoices.filter((invoice) => {
        const invoiceDate = new Date(invoice.date);
        return (
          invoiceDate.getFullYear() === year &&
          invoiceDate.getMonth() === entry.month
        );
      });

      const monthPayments = payments.filter((payment) => {
        const paymentDate = new Date(payment.date);
        return (
          paymentDate.getFullYear() === year &&
          paymentDate.getMonth() === entry.month
        );
      });

      const monthPurchaseInvoices = purchaseInvoices.filter((purchaseInvoice) => {
        const purchaseDate = new Date(purchaseInvoice.date);
        return (
          purchaseDate.getFullYear() === year &&
          purchaseDate.getMonth() === entry.month
        );
      });

      const monthPurchasePayments = purchasePayments.filter((purchasePayment) => {
        const purchasePaymentDate = new Date(purchasePayment.date);
        return (
          purchasePaymentDate.getFullYear() === year &&
          purchasePaymentDate.getMonth() === entry.month
        );
      });

      return {
        month: entry.label,
        monthKey: `${year}-${String(entry.month + 1).padStart(2, '0')}`,
        year,
        invoiceCount: monthInvoices.length,
        monthInvoices,
        totalInvoices: monthInvoices.reduce(
          (sum, invoice) => sum + (invoice.grandTotal || 0),
          0
        ),
        totalPayments: monthPayments.reduce(
          (sum, payment) => sum + (payment.amountPaid || 0),
          0
        ),
        totalSellerBills: monthPurchaseInvoices.reduce(
          (sum, purchaseInvoice) => sum + (purchaseInvoice.amount || 0),
          0
        ),
        totalSellerPayments: monthPurchasePayments.reduce(
          (sum, purchasePayment) => sum + (purchasePayment.amountPaid || 0),
          0
        ),
      };
    });

    const revenue = monthlyData.reduce((sum, month) => sum + month.totalInvoices, 0);
    const receipts = monthlyData.reduce((sum, month) => sum + month.totalPayments, 0);
    const purchaseBills = monthlyData.reduce(
      (sum, month) => sum + month.totalSellerBills,
      0
    );
    const sellerPaymentsTotal = monthlyData.reduce(
      (sum, month) => sum + month.totalSellerPayments,
      0
    );

    const outstandingReceivables = revenue - receipts;
    const pendingPayables = purchaseBills - sellerPaymentsTotal;
    const netCashFlow = receipts - sellerPaymentsTotal;

    const bestMonth = [...monthlyData].sort(
      (first, second) => second.totalInvoices - first.totalInvoices
    )[0];
    const busiestMonth = [...monthlyData].sort(
      (first, second) => second.invoiceCount - first.invoiceCount
    )[0];

    const yearInvoices = monthlyData.flatMap((month) => month.monthInvoices);
    const recentInvoices = [...yearInvoices]
      .sort((first, second) => new Date(second.date) - new Date(first.date))
      .slice(0, 5);

    return {
      monthlyData,
      totals: {
        revenue,
        receipts,
        purchaseBills,
        sellerPayments: sellerPaymentsTotal,
        outstandingReceivables,
        pendingPayables,
        netCashFlow,
      },
      highlights: {
        averageInvoiceValue: yearInvoices.length ? revenue / yearInvoices.length : 0,
        collectionEfficiency: revenue ? (receipts / revenue) * 100 : 0,
        bestMonth,
        busiestMonth,
      },
      recentInvoices,
    };
  }, [selectedYear, invoices, payments, purchaseInvoices, purchasePayments]);

  const handleDownloadMonthInvoices = (monthData, invoicefor) => {
    if (!monthData.monthInvoices.length) {
      return;
    }

    generateMonthlyInvoicesPDF({
      monthLabel: monthData.month,
      financialYearLabel: selectedYear,
      invoicefor,
      companyName: user.companyDetails?.name || '',
      companyAddress: user.companyDetails?.address || '',
      companyGST: user.companyDetails?.gstin || '',
      companyPhone: user.companyDetails?.mobile || '',
      companyBank: user.bankDetails || {},
      userSignature: user.signature || null,
      invoices: [...monthData.monthInvoices]
        .sort((first, second) => {
          if ((first.invoiceNo || 0) !== (second.invoiceNo || 0)) {
            return (first.invoiceNo || 0) - (second.invoiceNo || 0);
          }
          return new Date(first.date) - new Date(second.date);
        })
        .map((invoice) => ({
          billNo: formatDocumentNumber(
            invoice.invoiceNo,
            invoice.financialYearLabel
          ),
          date: invoice.date,
          challanNo: invoice.challanNo,
          challanDate: invoice.challanDate,
          orderNo: invoice.orderNo,
          orderDate: invoice.orderDate,
          disDocNo: invoice.disDocNo,
          deliveryDate: invoice.deliveryDate,
          dispatchedThrough: invoice.dispatchedThrough,
          destination: invoice.destination,
          customer: invoice.customer,
          shipTo: invoice.shipTo,
          products: invoice.invoiceProducts || [],
          totalAmount: invoice.invoiceTotal,
          termsAndConditions: invoice.termsAndConditions,
          gst: invoice.gst,
          grandTotal: invoice.grandTotal,
        })),
    });
  };

  if (loading) {
    return (
      <div className='admin-container'>
        <AdminSidebar />
        <main className='dashboard'>
          <div className='loading'>Loading financial data...</div>
        </main>
      </div>
    );
  }

  const { totals, highlights, monthlyData, recentInvoices } = financialYearData;

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='dashboard'>
        <div className='financial-year-selector dashboard-hero'>
          <div>
            <h2>{user?.companyDetails?.name || 'Dashboard'}</h2>
            <p>Financial-year operations, monthly exports, and commercial insights in one place.</p>
          </div>
          <div className='dashboard-pill-group'>
            <span className='dashboard-pill'>
              FY {selectedYear || getFinancialYearFromDate(new Date())}
            </span>
            <span className='dashboard-pill'>
              Net Cash Flow Rs {formatNumberWithCommas(totals.netCashFlow)}
            </span>
          </div>
        </div>

        <div className='financial-year-selector'>
          <h2>Financial Year</h2>
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                FY {year}
              </option>
            ))}
          </select>
        </div>

        <section className='widget-container'>
          <WidgetItem
            amount
            value={totals.revenue}
            heading='Total Revenue'
            detail={`${monthlyData.reduce(
              (sum, month) => sum + month.invoiceCount,
              0
            )} invoices`}
            color='rgb(0,115,255)'
          />
          <WidgetItem
            amount
            value={totals.receipts}
            heading='Payments Received'
            detail={`${highlights.collectionEfficiency.toFixed(1)}% collection efficiency`}
            color='rgb(0,198,202)'
          />
          <WidgetItem
            amount
            value={totals.outstandingReceivables}
            heading='Outstanding Receivables'
            detail='Revenue minus customer receipts'
            color='rgb(217,119,6)'
          />
          <WidgetItem
            amount
            value={totals.pendingPayables}
            heading='Pending Payables'
            detail='Purchase bills minus seller payments'
            color='rgb(127,29,29)'
          />
        </section>

        <section className='dashboard-insights'>
          <div className='dashboard-card'>
            <h3>FY Highlights</h3>
            <div className='insight-grid'>
              <div>
                <span>Best Revenue Month</span>
                <strong>{highlights.bestMonth?.month || '-'}</strong>
                <p>
                  Rs{' '}
                  {formatNumberWithCommas(
                    highlights.bestMonth?.totalInvoices || 0
                  )}
                </p>
              </div>
              <div>
                <span>Busiest Month</span>
                <strong>{highlights.busiestMonth?.month || '-'}</strong>
                <p>{highlights.busiestMonth?.invoiceCount || 0} invoices</p>
              </div>
              <div>
                <span>Average Invoice Value</span>
                <strong>
                  Rs {formatNumberWithCommas(highlights.averageInvoiceValue)}
                </strong>
                <p>Based on current FY invoices</p>
              </div>
              <div>
                <span>Net Cash Position</span>
                <strong>Rs {formatNumberWithCommas(totals.netCashFlow)}</strong>
                <p>Receipts minus seller payments</p>
              </div>
            </div>
          </div>

          <div className='dashboard-card'>
            <h3>Recent Invoices</h3>
            <div className='dashboard-activity'>
              {recentInvoices.length ? (
                recentInvoices.map((invoice) => (
                  <div className='activity-row' key={invoice._id}>
                    <div>
                      <strong>
                        {formatDocumentNumber(
                          invoice.invoiceNo,
                          invoice.financialYearLabel
                        )}
                      </strong>
                      <p>{invoice.customer?.name || 'Customer'}</p>
                    </div>
                    <div>
                      <strong>Rs {formatNumberWithCommas(invoice.grandTotal)}</strong>
                      <p>{new Date(invoice.date).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No invoice activity in this financial year.</p>
              )}
            </div>
          </div>
        </section>

        <section className='monthly-breakdown'>
          <div className='monthly-breakdown-header'>
            <div>
              <h2>Monthly Breakdown for FY {selectedYear}</h2>
              <p>Download all invoices for any month as one PDF in Original or Duplicate format.</p>
            </div>
            <div className='dashboard-pill-group'>
              <span className='dashboard-pill'>
                Seller Bills Rs {formatNumberWithCommas(totals.purchaseBills)}
              </span>
              <span className='dashboard-pill'>
                Seller Payments Rs {formatNumberWithCommas(totals.sellerPayments)}
              </span>
            </div>
          </div>

          <table className='breakdown-table'>
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Invoices</th>
                <th>Payments</th>
                <th>Invoice Count</th>
                <th>Seller Bills</th>
                <th>Seller Payments</th>
                <th>Downloads</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((monthData) => (
                <tr key={monthData.monthKey}>
                  <td>{monthData.month}</td>
                  <td>Rs {formatNumberWithCommas(monthData.totalInvoices)}</td>
                  <td>Rs {formatNumberWithCommas(monthData.totalPayments)}</td>
                  <td>{monthData.invoiceCount}</td>
                  <td>Rs {formatNumberWithCommas(monthData.totalSellerBills)}</td>
                  <td>
                    Rs {formatNumberWithCommas(monthData.totalSellerPayments)}
                  </td>
                  <td>
                    <div className='dashboard-actions'>
                      <button
                        type='button'
                        disabled={!monthData.invoiceCount}
                        onClick={() =>
                          handleDownloadMonthInvoices(
                            monthData,
                            'Original Copy'
                          )
                        }
                      >
                        <FiDownload />
                        Original
                      </button>
                      <button
                        type='button'
                        disabled={!monthData.invoiceCount}
                        onClick={() =>
                          handleDownloadMonthInvoices(
                            monthData,
                            'Duplicate Copy'
                          )
                        }
                      >
                        <FiFileText />
                        Duplicate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className='total-row'>
                <td>
                  <strong>Total</strong>
                </td>
                <td>
                  <strong>Rs {formatNumberWithCommas(totals.revenue)}</strong>
                </td>
                <td>
                  <strong>Rs {formatNumberWithCommas(totals.receipts)}</strong>
                </td>
                <td>
                  <strong>
                    {monthlyData.reduce((sum, month) => sum + month.invoiceCount, 0)}
                  </strong>
                </td>
                <td>
                  <strong>Rs {formatNumberWithCommas(totals.purchaseBills)}</strong>
                </td>
                <td>
                  <strong>
                    Rs {formatNumberWithCommas(totals.sellerPayments)}
                  </strong>
                </td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

const WidgetItem = ({ heading, value, color, amount = false, detail = '' }) => (
  <article className='widget'>
    <div className='widget-info'>
      <p>{heading}</p>
      <h4>{amount ? `Rs ${formatNumberWithCommas(value)}` : value}</h4>
      {detail ? <span>{detail}</span> : null}
    </div>
    <div
      className='widget-circle'
      style={{
        background: `conic-gradient(${color} 270deg, rgb(255, 255, 255) 0)`,
      }}
    >
      <span style={{ color }}>
        {value >= 0 ? <HiTrendingUp /> : <HiTrendingDown />}
      </span>
    </div>
  </article>
);

export default Dashboard;
