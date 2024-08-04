import React, { useEffect, useRef } from 'react';
import './Print.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToWords } from 'to-words';

const Print = () => {
  const navigate = useNavigate();
  const toWords = new ToWords({
    localeCode: 'en-IN',
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      doNotAddOnly: false,
      currencyOptions: {
        // can be used to override defaults for the selected locale
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
  } = location.state;
  console.log(date);
  const pdfRef = useRef();

  useEffect(() => {
    const handleAfterPrint = () => {
      navigate('/admin/customers');
    };

    window.addEventListener('afterprint', handleAfterPrint);

    // Open print dialog
    window.print();

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [navigate]);

  return (
    <div ref={pdfRef}>
      <div className='Print'>
        <h2 className='bold'>TAX INVOICE</h2>
        <h3>{invoicefor}</h3>
        <div className='print-header'>
          <table className='table-1'>
            <tr>
              <td rowSpan={2} style={{ width: '60%' }}>
                <b style={{ fontSize: '22px', fontWeight: '800' }}>
                  HARI OM ENGINEERING WORKS
                </b>
                <p>PLOT NO. I-77, G.I.D.C ESTATE, V.U NAGAR</p>
                <p>ANAND-388121, GUJARAT,INDIA</p>
                <p>
                  <b>GSTIN:</b>24AMFPP7083F1ZX
                </p>
                <p>
                  <b>MSME:</b>UDYAM-GJ-03-0019325
                </p>

                <p>
                  <b>Mobile No.</b> 9714275013
                </p>
              </td>
              <td style={{ width: '20%' }}>
                <p>Invoice No.</p>
                <b>HEW{billNo}</b>
              </td>
              <td style={{ width: '20%' }}>
                <p>
                  <b>Date:</b>
                </p>
                <b>{date}</b>
                {/* <b>{date.toLocaleDateString()}</b> */}
              </td>
            </tr>
            <tr>
              <td>
                <p>Challan No.</p>
                <b>{challanNo ? challanNo : ''}</b>
              </td>
              <td>
                <p>Date</p>
                <b>{challanDate ? challanDate : ''}</b>
              </td>
            </tr>
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
                <b></b>
              </td>
              <td style={{ width: '20%' }}>
                <p>Dated</p>
                <b></b>
              </td>
            </tr>
            <tr>
              <td>
                <p>Dis. Doc. No-</p>
              </td>
              <td>
                <p>Delivery Date -</p>
              </td>
            </tr>
            <tr>
              <td>
                <p>Dispatched Through -</p>
              </td>
              <td>
                <p>Destination -</p>
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
              <th style={{ width: '10%' }}>Rate</th>
              <th style={{ width: '10%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td className='center'>{index + 1}</td>
                <td style={{ fontWeight: 'bold' }}>{product.name}</td>
                <td className='center'>{product.quantity}</td>
                <td className='center'>{product.uom}</td>
                <td className='center'>{product.rate}</td>
                <td className='center'>{product.quantity * product.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
            {/* <tr>
              <td>Advance Paid</td>
              <td>33000</td>
            </tr>
            <tr>
              <td>
                <b>Remaining Total</b>
              </td>
              <td>
                <b>96800</b>
              </td>
            </tr> */}
          </table>
        </div>
        <table className='table-3'>
          <tr>
            <td>
              <b>Bank Details</b>
            </td>
            <td
              rowSpan={2}
              style={{ paddingTop: '100px', textAlign: 'center' }}
            >
              Hari Om Engineering Works
            </td>
          </tr>
          <tr>
            <td>
              <p>Bank Name: Central Bank of India</p>
              <p>A/C No: 3243013874</p>
              <p>IFSC: CBIN0280532</p>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>Subject to anand jurisdiction</td>
          </tr>
        </table>
      </div>
      {/* <button onClick={generatePDF}>PDF</button> */}
    </div>
  );
};

export default Print;
