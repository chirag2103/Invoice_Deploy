import React, { useEffect, useRef, useState } from 'react';
import './Print.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToWords } from 'to-words';
import { useSelector } from 'react-redux';

const Print = () => {
  const user = useSelector((state) => state.user.user);
  // Update specific item

  // console.log(user);

  const navigate = useNavigate();
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
  const location = useLocation();
  const {
    challanNo,
    gst,
    invoicefor,
    billNo,
    products,
    customer,
    date,
    grandTotal,
    totalAmount,
    challanDate,
    orderNo,
    orderDate,
    specs,
    terms,
  } = location.state;
  // console.log(location.state);

  const isQuotation = invoicefor === 'Quotation';
  const isChallan = invoicefor === 'Challan';
  const rowsToRender = isQuotation
    ? products.length
    : products.length > 13
    ? products.length
    : 13;

  const prefix = user.companyDetails.name
    .split(' ')
    .map((word) => word[0].toUpperCase())
    .join('');

  const formatDate = (inputDate) => {
    if (!inputDate) return '';
    const [yyyy, mm, dd] = inputDate.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  const pdfRef = useRef();

  // useEffect(() => {
  //   const handleAfterPrint = () => {
  //     navigate('/invoices/all');
  //     console.log(isChallan);
  //   };
  //   return () => {
  //     window.removeEventListener('afterprint', handleAfterPrint);
  //   };
  // }, [navigate]);
  // useEffect(() => {
  //   const handleAfterPrint = () => {
  //     setTimeout(() => {
  //       navigate('/invoices/all');
  //     }, 1000);
  //   };

  //   window.addEventListener('afterprint', handleAfterPrint);
  //   const type = isQuotation ? 'Quotation' : isChallan ? 'Challan' : 'Invoice';
  //   const number = `${prefix}${billNo}`;
  //   document.title = `${type} - ${number}`;

  //   // Open print dialog
  //   const printTimeout = setTimeout(() => {
  //     // window.print();
  //   }, 500);

  //   return () => {
  //     clearTimeout(printTimeout);
  //     window.removeEventListener('afterprint', handleAfterPrint);
  //   };
  // }, [navigate]);
  useEffect(() => {
    const type = isQuotation ? 'Quotation' : isChallan ? 'Challan' : 'Invoice';
    const number = `${prefix}${billNo}`;
    document.title = `${type} - ${number}`;
  });

  return (
    <div ref={pdfRef}>
      <div className='Print'>
        <h2 className='bold'>
          {isQuotation ? 'QUOTATION' : isChallan ? 'CHALLAN' : 'TAX INVOICE'}
        </h2>
        <h3>{!isChallan && !isQuotation ? invoicefor : ''}</h3>
        <div className='print-header'>
          <table className='table-1'>
            <tr>
              <td rowSpan={2} style={{ width: '60%' }}>
                <b style={{ fontSize: '22px', fontWeight: 'bold' }}>
                  {user.companyDetails.name}
                </b>
                <p>{user.companyDetails.address}</p>
                {/* <p>ANAND-388121, GUJARAT,INDIA</p> */}
                <p>
                  <b>GSTIN:</b>
                  {user.companyDetails.gstin}
                </p>
                <p>
                  <b>Mobile No.</b>
                  {customer.name === 'CERACOATS' &&
                  user.email === 'parmarnikunj454@gmail.com'
                    ? '7567654590'
                    : user.companyDetails.mobile}
                </p>
              </td>
              <td style={{ width: '20%' }}>
                <p>
                  {isQuotation
                    ? 'Quotation No.'
                    : isChallan
                    ? 'Challan No.'
                    : 'Invoice No.'}
                </p>
                <b>
                  {prefix}
                  {billNo}
                </b>
              </td>
              <td style={{ width: '20%' }}>
                <p>
                  <b>Date:</b>
                </p>
                <b>{formatDate(date)}</b>
              </td>
            </tr>
            {!isQuotation && !isChallan && (
              <tr>
                <td>
                  <p>Challan No.</p>
                  <b>{challanNo ? challanNo : ''}</b>
                </td>
                <td>
                  <p>Date</p>
                  <b>{challanDate ? formatDate(challanDate) : ''}</b>
                </td>
              </tr>
            )}
          </table>
          <table className='table-2'>
            <tr>
              <td rowSpan={3} style={{ width: '60%' }}>
                <p>
                  <b>To,</b>
                </p>
                <b style={{ fontSize: '20px', fontWeight: '600' }}>
                  {customer.name}
                </b>
                <p>{customer.address}</p>
                <p>
                  <b>GSTIN:</b>
                  {customer.gstNo}
                </p>
              </td>
              <td style={{ width: '20%' }}>
                <p>Buyer's Order No.</p>
                <b>{orderNo}</b>
              </td>
              <td style={{ width: '20%' }}>
                <p>Dated</p>
                <b>{formatDate(orderDate)}</b>
              </td>
            </tr>
            <tr>
              <td>
                <p>Dis.Doc. No-</p>
              </td>
              <td>
                <p>Delivery Date-</p>
              </td>
            </tr>
            <tr>
              <td>
                <p>Dispatched Through-</p>
              </td>
              <td>
                <p>Destination-</p>
              </td>
            </tr>
          </table>
        </div>
        <div className='table-container'></div>
        <table className='table-3'>
          <thead>
            <tr>
              <th style={{ width: '5%' }}>Sr.No</th>
              <th style={{ width: '55%' }}>Particulars</th>
              <th style={{ width: '10%' }}>Quantity</th>
              <th style={{ width: '10%' }}>UOM</th>
              {!isChallan && (
                <>
                  <th style={{ width: '10%' }}>Rate</th>
                  <th style={{ width: '10%' }}>Amount</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {[...Array(rowsToRender)].map((_, index) => {
              const product = products[index];
              return (
                <tr key={index}>
                  <td className='center'>{product ? index + 1 : '\u00A0'}</td>
                  <td>{product?.name || ''}</td>
                  <td className='center'>{product?.quantity || ''}</td>
                  <td className='center'>{product?.uom || ''}</td>
                  {!isChallan && (
                    <>
                      <td className='center'>{product?.rate || ''}</td>
                      <td className='center'>
                        {product ? product.quantity * product.rate : ''}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isChallan && (
          <div className='calculation'>
            <table className='table-3 center'>
              <tr>
                <td rowSpan={4} style={{ width: '60%' }}>
                  Ruppes in Words :{' '}
                  <b>{toWords.convert(grandTotal, { currency: true })}</b>
                </td>
                <td style={{ width: '20%' }}>
                  <b className='bold'>Subtotal</b>
                </td>
                <td style={{ width: '20%' }}>
                  <b className='bold'>{totalAmount}</b>
                </td>
              </tr>
              <tr>
                <td>CGST ({gst}%)</td>
                <td>{(totalAmount * (gst / 100)).toFixed(2)}</td>
              </tr>
              <tr>
                <td>SGST ({gst}%)</td>
                <td>{(totalAmount * (gst / 100)).toFixed(2)}</td>
              </tr>
              <tr>
                <td>
                  <b className='bold'>Grand Total</b>
                </td>
                <td>
                  <b className='bold'>{grandTotal}</b>
                </td>
              </tr>
            </table>
          </div>
        )}
        <table className='table-4'>
          <tr>
            <td>
              <b>Bank Details</b>
            </td>
            <td rowSpan={2} style={{ paddingTop: '10px', textAlign: 'center' }}>
              <img src='data:image/png;base64,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' />
              <br />
              {user.companyDetails.name}
            </td>
          </tr>
          <tr>
            <td>
              <p>Bank Name: {user.bankDetails.name}</p>
              <p>A/C No: {user.bankDetails.accountNumber}</p>
              <p>IFSC: {user.bankDetails.ifscCode}</p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>Subject to anand jurisdiction</td>
          </tr>
        </table>
        {isQuotation && (specs || terms) && (
          <div className='quotation-extra'>
            <h4>{specs ? 'Technical Specifications:' : ''}</h4>
            {specs?.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                item
              </div>
            ))}

            <h4 style={{ marginTop: '1rem' }}>
              {terms ? 'Terms and Conditions:' : ''}
            </h4>
            {terms?.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Print;
