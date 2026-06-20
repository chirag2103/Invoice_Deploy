import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import api from '../axiosSetup.js';
import './CustomerStatement.scss';
import {
  formatDate,
  formatNumberWithCommas,
  getFinancialYearStartDate,
  getTodayDate,
} from '../services/helper';
import { generateStatementPDF } from '../services/pdfGeneratorService.js';

const CustomerStatement = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { customerId } = useParams();

  const [statementData, setStatementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState(getFinancialYearStartDate());
  const [toDate, setToDate] = useState(getTodayDate());
  const [appliedRange, setAppliedRange] = useState({
    fromDate: getFinancialYearStartDate(),
    toDate: getTodayDate(),
  });

  useEffect(() => {
    const fetchCustomerStatement = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`${apiUrl}/api/statement/${customerId}`, {
          params: {
            from: appliedRange.fromDate,
            to: appliedRange.toDate,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.error) {
          setError(response.data.error);
          return;
        }

        setStatementData(response.data);
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerStatement();
  }, [apiUrl, customerId, token, appliedRange]);

  const handleApplyFilters = () => {
    setAppliedRange({ fromDate, toDate });
  };

  const handleDownloadPdf = () => {
    if (!statementData) {
      return;
    }

    generateStatementPDF({
      companyName: user.companyDetails?.name,
      companyAddress: user.companyDetails?.address,
      companyGST: user.companyDetails?.gstin,
      companyPhone: user.companyDetails?.mobile,
      companyBank: user.bankDetails || {},
      userSignature: user.signature || null,
      title: 'ACCOUNT STATEMENT',
      partyLabel: 'Customer',
      partyName: statementData.customerName,
      partyAddress: statementData.customerAddress,
      gstNo: statementData.gstNo,
      fromDate: appliedRange.fromDate,
      toDate: appliedRange.toDate,
      entries: statementData.statement,
      debitLabel: 'Debit',
      creditLabel: 'Credit',
      closingBalance: statementData.remainingAmount,
      filePrefix: 'Customer-Statement',
    });
  };

  const openingDebit = statementData?.openingBalance > 0
    ? statementData.openingBalance
    : 0;
  const openingCredit = statementData?.openingBalance < 0
    ? Math.abs(statementData.openingBalance)
    : 0;

  return (
    <div className='admin-container'>
      <AdminSidebar />
      <main className='customer-statement-shell'>
        <div className='customer-statement-container'>
          <div className='statement-header'>
            <div>
              <p className='statement-eyebrow'>Customer Ledger</p>
              <h2>{statementData ? statementData.customerName : 'Statement'}</h2>
              <p>
                GST No: {statementData?.gstNo || '-'}
              </p>
              <p>
                {statementData?.customerAddress || '-'}
              </p>
            </div>
            <button
              type='button'
              className='statement-download-btn'
              onClick={handleDownloadPdf}
              disabled={!statementData || loading}
            >
              Download PDF
            </button>
          </div>

          <div className='statement-toolbar'>
            <label>
              <span>From</span>
              <input
                type='date'
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </label>
            <label>
              <span>To</span>
              <input
                type='date'
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </label>
            <button type='button' className='statement-apply-btn' onClick={handleApplyFilters}>
              Apply
            </button>
          </div>

          {loading ? <p>Loading...</p> : null}
          {error ? <p>{error}</p> : null}

          {statementData && !loading && !error ? (
            <>
              <div className='statement-summary-grid'>
                <div className='statement-summary-card'>
                  <span>Opening Balance</span>
                  <strong>{formatNumberWithCommas(statementData.openingBalance)}</strong>
                </div>
                <div className='statement-summary-card'>
                  <span>Total Debit</span>
                  <strong>{formatNumberWithCommas(statementData.totalInvoice)}</strong>
                </div>
                <div className='statement-summary-card'>
                  <span>Total Credit</span>
                  <strong>{formatNumberWithCommas(statementData.totalPaid)}</strong>
                </div>
                <div className='statement-summary-card'>
                  <span>Closing Balance</span>
                  <strong>{formatNumberWithCommas(statementData.remainingAmount)}</strong>
                </div>
              </div>

              <div className='table-wrapper'>
                <table className='responsive-table'>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Debit</th>
                      <th>Credit</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementData.statement.map((entry, index) => (
                      <tr key={`${entry.type}-${index}`}>
                        <td data-label='Date'>{formatDate(entry.date)}</td>
                        <td data-label='Description'>{entry.detail || '-'}</td>
                        <td data-label='Debit'>
                          {entry.invoiceAmount
                            ? `Rs ${formatNumberWithCommas(entry.invoiceAmount)}`
                            : '-'}
                        </td>
                        <td data-label='Credit'>
                          {entry.paymentAmount
                            ? `Rs ${formatNumberWithCommas(entry.paymentAmount)}`
                            : '-'}
                        </td>
                        <td data-label='Balance'>
                          Rs {formatNumberWithCommas(entry.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan='2'>Total</td>
                      <td>
                        Rs{' '}
                        {formatNumberWithCommas(statementData.totalInvoice + openingDebit)}
                      </td>
                      <td>
                        Rs{' '}
                        {formatNumberWithCommas(statementData.totalPaid + openingCredit)}
                      </td>
                      <td>Rs {formatNumberWithCommas(statementData.remainingAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default CustomerStatement;
