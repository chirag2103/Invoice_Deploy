import React, { useEffect, useRef } from 'react';
import './Print.css';
import { Navigate, useLocation } from 'react-router-dom';
import { ToWords } from 'to-words';
import { useSelector } from 'react-redux';

const Print = () => {
  const user = useSelector((state) => state.user.user);
  // Update specific item

  // console.log(user);

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
  } = location.state || {};
  // console.log(location.state);

  // This preview is only reachable with navigation state (from a list row).
  // On a hard refresh / direct visit there is nothing to render.
  const hasValidState =
    Boolean(location.state) && Array.isArray(products) && Boolean(user);

  const isQuotation = invoicefor === 'Quotation';
  const isChallan = invoicefor === 'Challan';
  const rowsToRender = isQuotation
    ? products?.length || 0
    : (products?.length || 0) > 13
      ? products.length
      : 13;

  const prefix = (user?.companyDetails?.name || '')
    .split(' ')
    .filter(Boolean)
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

  if (!hasValidState) {
    return <Navigate to='/invoices/all' replace />;
  }

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
              {user.signature?.dataUrl ? (
                <img
                  src={user.signature.dataUrl}
                  alt='Authorized signature'
                />
              ) : null}
              <br />
              {user.companyDetails.name}
            </td>
          </tr>
          <tr>
            <td>
              <p>Bank Name: {user.bankDetails.bankName}</p>
              <p>A/C No: {user.bankDetails.accountNumber}</p>
              <p>IFSC: {user.bankDetails.ifsc}</p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>Subject to anand jurisdiction</td>
          </tr>
        </table>
        {isQuotation && (specs?.length > 0 || terms?.length > 0) && (
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
