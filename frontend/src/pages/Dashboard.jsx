import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HiTrendingDown, HiTrendingUp } from 'react-icons/hi';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import AdminSidebar from '../components/AdminSidebar';
import { fetchAllPages } from '../services/fetchAllPages';
import { savedDocumentPdf } from '../services/savedDocumentPdf';
import {
  fetchFinancialYears,
  fetchFinancialYearAnalytics,
  setSelectedFy,
} from '../slices/analyticsSlice';
import {
  formatDocumentNumber,
  formatNumberWithCommas,
} from '../services/helper';
import { getErrorMessage } from '../services/apiError';

const apiUrl = process.env.REACT_APP_API_URL;

const EMPTY_TOTALS = {
  revenue: 0,
  receipts: 0,
  purchaseBills: 0,
  sellerPayments: 0,
  outstandingReceivables: 0,
  pendingPayables: 0,
  netCashFlow: 0,
};

const EMPTY_HIGHLIGHTS = {
  averageInvoiceValue: 0,
  collectionEfficiency: 0,
  bestMonth: null,
  busiestMonth: null,
};

const buildMonthDateRange = (monthKey) => {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const lastDay = new Date(year, month, 0).getDate();

  return {
    from: `${yearStr}-${monthStr}-01`,
    to: `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
  };
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const [downloadingMonth, setDownloadingMonth] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { years, loadingYears, fyData, loadingFy, selectedFy, error } = useSelector(
    (state) => state.analytics
  );

  useEffect(() => {
    document.title = 'Dashboard';
    dispatch(fetchFinancialYears());
  }, [dispatch]);

  useEffect(() => {
    if (selectedFy) {
      dispatch(fetchFinancialYearAnalytics(selectedFy));
    }
  }, [dispatch, selectedFy]);

  const handleDownloadMonthInvoices = async (monthData, invoicefor) => {
    if (!monthData.invoiceCount || downloadingMonth) {
      return;
    }

    setDownloadingMonth(monthData.monthKey);
    try {
      const { from, to } = buildMonthDateRange(monthData.monthKey);
      const monthInvoices = await fetchAllPages(`${apiUrl}/api/invoices`, 'invoices', { from, to });

      if (!monthInvoices.length) {
        toast.error('No invoices found for this month.');
        return;
      }

      const { generateMonthlyInvoicesPDF } = await import(
        '../services/pdfGeneratorService'
      );
      generateMonthlyInvoicesPDF({
        monthLabel: monthData.month,
        financialYearLabel: fyData?.financialYearLabel || selectedFy,
        invoicefor,
        companyName: user.companyDetails?.name || '',
        companyAddress: user.companyDetails?.address || '',
        companyGST: user.companyDetails?.gstin || '',
        companyPhone: user.companyDetails?.mobile || '',
        companyBank: user.bankDetails || {},
        userSignature: user.signature || null,
        invoices: [...monthInvoices]
          .sort((first, second) => {
            if ((first.invoiceNo || 0) !== (second.invoiceNo || 0)) {
              return (first.invoiceNo || 0) - (second.invoiceNo || 0);
            }
            return new Date(first.date) - new Date(second.date);
          })
          .map((invoice) => ({
            customer: invoice.customer,
            ...savedDocumentPdf(invoice, 'invoice'),
          })),
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error, 'Failed to download invoices for this month.')
      );
    } finally {
      setDownloadingMonth(null);
    }
  };

  const loading = loadingYears || loadingFy || (selectedFy && fyData?.financialYearLabel !== selectedFy && !error);

  if (error) {
    return (
      <div className='admin-container'>
        <AdminSidebar />
        <main className='dashboard'>
          <p role='alert'>{error}</p>
          <button type='button' onClick={() => {
            if (!years.length) dispatch(fetchFinancialYears());
            else dispatch(fetchFinancialYearAnalytics(selectedFy));
          }}>Retry</button>
        </main>
      </div>
    );
  }

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

  const totals = fyData?.totals || EMPTY_TOTALS;
  const highlights = fyData?.highlights || EMPTY_HIGHLIGHTS;
  const monthly = fyData?.monthly || [];
  const recentInvoices = fyData?.recentInvoices || [];

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='dashboard'>
        <div className='financial-year-selector dashboard-hero'>
          <div>
            <h2>{user?.companyDetails?.name || 'Dashboard'}</h2>
            <p>
              Financial-year operations, monthly exports, and commercial
              insights in one place.
            </p>
          </div>
          <div className='dashboard-pill-group'>
            <span className='dashboard-pill'>FY {selectedFy || '-'}</span>
            <span className='dashboard-pill'>
              Net Cash Flow Rs {formatNumberWithCommas(totals.netCashFlow)}
            </span>
          </div>
        </div>

        <div className='financial-year-selector'>
          <h2>Financial Year</h2>
          <select
            value={selectedFy || ''}
            onChange={(event) => dispatch(setSelectedFy(event.target.value))}
          >
            {years.map((year) => (
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
            detail={`${totals.invoiceCount || 0} invoices`}
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
              <h2>Monthly Breakdown for FY {selectedFy}</h2>
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
              {monthly.map((monthData) => (
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
                        disabled={
                          !monthData.invoiceCount ||
                          downloadingMonth === monthData.monthKey
                        }
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
                        disabled={
                          !monthData.invoiceCount ||
                          downloadingMonth === monthData.monthKey
                        }
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
                  <strong>{totals.invoiceCount || 0}</strong>
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
