import { FaRegBell } from 'react-icons/fa';
import AdminSidebar from '../components/AdminSidebar';
import userImg from '../assets/userpic.png';
import { BsSearch } from 'react-icons/bs';
import { HiTrendingDown, HiTrendingUp } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { fetchInvoices } from '../slices/invoiceSlice';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../slices/userSlice';
import { useNavigate } from 'react-router-dom';
import { fetchPayments } from '../slices/paymentSlice';
import { fetchPurchaseInvoices } from '../slices/purchaseInvoiceSlice';
import { fetchPurchasePayments } from '../slices/purchasePaymentSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Dashboard';
    setLoading(true);
    Promise.all([
      dispatch(fetchInvoices()),
      dispatch(fetchPayments()),
      dispatch(fetchPurchaseInvoices()),
      dispatch(fetchPurchasePayments()),
    ]).finally(() => {
      setLoading(false);
    });
  }, [dispatch]);

  const { invoices } = useSelector((state) => state.invoice);
  const { payments } = useSelector((state) => state.payment);
  const { purchaseInvoices } = useSelector((state) => state.purchaseInvoice);
  const { purchasePayments } = useSelector((state) => state.purchasePayment);

  // Calculate available financial years from data
  useEffect(() => {
    if (invoices && invoices.length > 0) {
      const years = new Set();
      invoices.forEach((invoice) => {
        if (invoice.date) {
          const date = new Date(invoice.date);
          // Financial year: April to March (e.g., 2023-04-01 to 2024-03-31 is FY 2023-24)
          const year =
            date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
          const financialYear = `${year}-${year + 1}`;
          years.add(financialYear);
        }
      });

      const yearsArray = Array.from(years).sort().reverse();
      setAvailableYears(yearsArray);

      // Set current financial year if not already set
      if (yearsArray.length > 0 && !selectedYear) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // 0-11 (Jan-Dec)
        const currentFY =
          currentMonth >= 3
            ? `${currentYear}-${currentYear + 1}`
            : `${currentYear - 1}-${currentYear}`;

        // Use current financial year if available, otherwise use the most recent one
        setSelectedYear(
          yearsArray.includes(currentFY) ? currentFY : yearsArray[0]
        );
      }
    }
  }, [invoices, selectedYear]);

  // Calculate financial year data when year selection or data changes
  useEffect(() => {
    if (selectedYear && invoices && invoices.length > 0) {
      calculateFinancialYearData();
    }
  }, [selectedYear, invoices, payments, purchaseInvoices, purchasePayments]);

  const calculateFinancialYearData = () => {
    if (!selectedYear || typeof selectedYear !== 'string') return;

    const [startYearStr] = selectedYear.split('-');
    const startYear = parseInt(startYearStr, 10);
    const startDate = new Date(startYear, 3, 1); // April 1 of start year
    const endDate = new Date(startYear + 1, 2, 31); // March 31 of next year

    console.log('Filtering data for financial year:', selectedYear);
    console.log('Start date:', startDate, 'End date:', endDate);

    // Filter data for selected financial year with null checks
    const yearInvoices = invoices.filter((invoice) => {
      if (!invoice.date) return false;
      const invoiceDate = new Date(invoice.date);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });

    const yearPayments =
      payments && payments.length > 0
        ? payments.filter((payment) => {
            if (!payment.date) return false;
            const paymentDate = new Date(payment.date);
            return paymentDate >= startDate && paymentDate <= endDate;
          })
        : [];

    const yearPurchaseInvoices =
      purchaseInvoices && purchaseInvoices.length > 0
        ? purchaseInvoices.filter((pInvoice) => {
            if (!pInvoice.date) return false;
            const pInvoiceDate = new Date(pInvoice.date);
            return pInvoiceDate >= startDate && pInvoiceDate <= endDate;
          })
        : [];

    const yearPurchasePayments =
      purchasePayments && purchasePayments.length > 0
        ? purchasePayments.filter((pPayment) => {
            if (!pPayment.date) return false;
            const pPaymentDate = new Date(pPayment.date);
            return pPaymentDate >= startDate && pPaymentDate <= endDate;
          })
        : [];

    console.log('Year invoices:', yearInvoices);
    console.log('Year payments:', yearPayments);
    console.log('Year purchase invoices:', yearPurchaseInvoices);
    console.log('Year purchase payments:', yearPurchasePayments);

    // Calculate monthly breakdown
    const months = [
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
      'January',
      'February',
      'March',
    ];

    const monthlyBreakdown = months.map((month, index) => {
      // Calculate month number (April = 4, May = 5, ..., March = 3)
      const monthNumber = index < 9 ? index + 4 : index - 8;
      const year = index < 9 ? startYear : startYear + 1;

      // Filter data for this month
      const monthInvoices = yearInvoices.filter((invoice) => {
        if (!invoice.date) return false;
        const invoiceDate = new Date(invoice.date);
        return (
          invoiceDate.getMonth() + 1 === monthNumber &&
          invoiceDate.getFullYear() === year
        );
      });

      const monthPayments = yearPayments.filter((payment) => {
        if (!payment.date) return false;
        const paymentDate = new Date(payment.date);
        return (
          paymentDate.getMonth() + 1 === monthNumber &&
          paymentDate.getFullYear() === year
        );
      });

      const monthPurchaseInvoices = yearPurchaseInvoices.filter((pInvoice) => {
        if (!pInvoice.date) return false;
        const pInvoiceDate = new Date(pInvoice.date);
        return (
          pInvoiceDate.getMonth() + 1 === monthNumber &&
          pInvoiceDate.getFullYear() === year
        );
      });

      const monthPurchasePayments = yearPurchasePayments.filter((pPayment) => {
        if (!pPayment.date) return false;
        const pPaymentDate = new Date(pPayment.date);
        return (
          pPaymentDate.getMonth() + 1 === monthNumber &&
          pPaymentDate.getFullYear() === year
        );
      });

      // Calculate totals
      const totalInvoices = monthInvoices.reduce(
        (sum, invoice) => sum + (invoice.grandTotal || 0),
        0
      );
      const totalPayments = monthPayments.reduce(
        (sum, payment) => sum + (payment.amountPaid || 0),
        0
      );
      const totalSellerBills = monthPurchaseInvoices.reduce(
        (sum, pInvoice) => sum + (pInvoice.amount || 0),
        0
      );
      const totalSellerPayments = monthPurchasePayments.reduce(
        (sum, pPayment) => sum + (pPayment.amountPaid || 0),
        0
      );

      return {
        month,
        totalInvoices,
        totalPayments,
        totalSellerBills,
        totalSellerPayments,
        totalTransactions: monthInvoices.length,
      };
    });

    console.log('Monthly breakdown:', monthlyBreakdown);
    setMonthlyData(monthlyBreakdown);
  };

  const getFinancialYearTotal = () => {
    return monthlyData.reduce((sum, month) => sum + month.totalInvoices, 0);
  };

  const getTotalPayments = () => {
    return monthlyData.reduce((sum, month) => sum + month.totalPayments, 0);
  };

  const getTotalSellerBills = () => {
    return monthlyData.reduce((sum, month) => sum + month.totalSellerBills, 0);
  };

  const getTotalSellerPayments = () => {
    return monthlyData.reduce(
      (sum, month) => sum + month.totalSellerPayments,
      0
    );
  };

  const getTotalTransactions = () => {
    return monthlyData.reduce((sum, month) => sum + month.totalTransactions, 0);
  };

  const SignOut = () => {
    dispatch(logout());
    navigate('/');
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

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='dashboard'>
        <div className='bar'>
          <BsSearch />
          <input type='text' placeholder='Search for data,users,docs' />
          <FaRegBell />
          <img src={userImg} alt='User' onClick={SignOut} />
        </div>

        {/* Financial Year Selector */}
        <div className='financial-year-selector'>
          <h2>Financial Year: </h2>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <section className='widget-container'>
          <WidgetItem
            percent={0}
            amount={true}
            value={getFinancialYearTotal()}
            heading='Total Revenue'
            color='rgb(0,115,255)'
          />
          <WidgetItem
            percent={0}
            amount={true}
            value={getTotalPayments()}
            heading='Payments Received'
            color='rgb(0,198,202)'
          />
          <WidgetItem
            percent={0}
            amount={true}
            value={getTotalSellerBills()}
            heading='Seller Bills'
            color='rgb(255 196 0)'
          />
          <WidgetItem
            percent={0}
            amount={true}
            value={getTotalSellerPayments()}
            heading='Seller Payments'
            color='rgb(76 0 255)'
          />
        </section>

        {/* Monthly Breakdown Table */}
        <section className='monthly-breakdown'>
          <h2>Monthly Breakdown for FY {selectedYear}</h2>
          <table className='breakdown-table'>
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Invoices</th>
                <th>Total Payments</th>
                <th>Transactions</th>
                <th>Seller Bills</th>
                <th>Seller Payments</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((monthData, index) => (
                <tr key={index}>
                  <td>{monthData.month}</td>
                  <td>₹{monthData.totalInvoices.toLocaleString('en-IN')}</td>
                  <td>₹{monthData.totalPayments.toLocaleString('en-IN')}</td>
                  <td>{monthData.totalTransactions}</td>
                  <td>₹{monthData.totalSellerBills.toLocaleString('en-IN')}</td>
                  <td>
                    ₹{monthData.totalSellerPayments.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className='total-row'>
                <td>
                  <strong>Total</strong>
                </td>
                <td>
                  <strong>
                    ₹{getFinancialYearTotal().toLocaleString('en-IN')}
                  </strong>
                </td>
                <td>
                  <strong>₹{getTotalPayments().toLocaleString('en-IN')}</strong>
                </td>
                <td>
                  <strong>{getTotalTransactions()}</strong>
                </td>
                <td>
                  <strong>
                    ₹{getTotalSellerBills().toLocaleString('en-IN')}
                  </strong>
                </td>
                <td>
                  <strong>
                    ₹{getTotalSellerPayments().toLocaleString('en-IN')}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

const WidgetItem = ({ heading, value, percent, color, amount = false }) => (
  <article className='widget'>
    <div className='widget-info'>
      <p>{heading}</p>
      <h4>{amount ? `₹${value.toLocaleString('en-IN')}` : value}</h4>
      {percent > 0 ? (
        <span className='green'>
          <HiTrendingUp />+{percent}%{' '}
        </span>
      ) : percent < 0 ? (
        <span className='red'>
          <HiTrendingDown /> {percent}%{' '}
        </span>
      ) : null}
    </div>
    <div
      className='widget-circle'
      style={{
        background: `conic-gradient(
        ${color} ${(Math.abs(percent) / 100) * 360}deg,
        rgb(255, 255, 255) 0
      )`,
      }}
    >
      <span style={{ color }}>{percent}%</span>
    </div>
  </article>
);

export default Dashboard;
