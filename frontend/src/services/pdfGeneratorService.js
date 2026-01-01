import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.vfs;

/* ================= COMMON DESIGN & HELPERS ================= */

const COLORS = {
  primary: '#000000',
  border: '#000000',
  text: '#000000',
};

const FONT = {
  normal: { fontSize: 9, color: COLORS.text },
  small: { fontSize: 8, color: COLORS.text },
  label: { fontSize: 9, bold: true, color: COLORS.text },
  title: { fontSize: 14, bold: true, color: COLORS.text },
};

// Helper function - add at top of pdfGeneratorService.js

function formatTextAsBulletPoints(text) {
  if (!text) return [];
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);

  if (lines.length === 0) return [];

  return lines.map((line) => ({
    text: line,
    ...FONT.small,
    margin: [0, 0, 0, 2],
  }));
}

function formatDate(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return date;
  }
}

function formatNumberWithCommas(num) {
  const n = Number(num || 0).toFixed(2);
  const parts = n.split('.');
  const numStr = parts[0];
  if (numStr.length <= 3) return numStr + '.' + parts[1];
  const last3 = numStr.slice(-3);
  const other = numStr.slice(0, -3);
  const otherWithCommas = other.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return otherWithCommas + ',' + last3 + '.' + parts[1];
}

function formatCurrency(amount) {
  return formatNumberWithCommas(amount);
}

function convertToWords(amount) {
  const num = Math.round(Number(amount || 0));
  if (num === 0) return 'Zero Rupees Only';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
  ];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  function convertGroupToWords(groupNum) {
    let result = '';
    const hundreds = Math.floor(groupNum / 100);
    if (hundreds > 0) result += ones[hundreds] + ' Hundred ';
    const remainder = groupNum % 100;
    if (remainder >= 10 && remainder < 20) {
      result += teens[remainder - 10];
    } else {
      const ten = Math.floor(remainder / 10);
      const one = remainder % 10;
      if (ten > 0) {
        result += tens[ten];
        if (one > 0) result += ' ' + ones[one];
      } else if (one > 0) {
        result += ones[one];
      }
    }
    return result.trim();
  }

  let words = '';
  let scaleIndex = 0;
  let n = num;

  while (n > 0) {
    let groupSize = 2;
    if (scaleIndex === 0) groupSize = 3;
    const divisor = Math.pow(10, groupSize);
    const group = n % divisor;
    n = Math.floor(n / divisor);

    if (group > 0) {
      const groupWords = convertGroupToWords(group);
      const scaleWord = scales[scaleIndex];
      words = groupWords + (scaleWord ? ' ' + scaleWord : '') + ' ' + words;
    }
    scaleIndex++;
  }

  return words.trim() + ' Rupees Only';
}

/* ================= INVOICE ================= */

export const generateInvoicePDF = (data) => {
  const {
    companyName,
    companyAddress,
    companyGST,
    companyPhone,
    billNo,
    date,
    challanNo,
    challanDate,
    orderNo,
    orderDate,
    disDocNo,
    deliveryDate,
    dispatchedThrough,
    destination,
    customer,
    shipTo,
    products = [],
    totalAmount,
    termsAndConditions,
    gst,
    grandTotal = 0,
    companyBank,
    invoicefor = 'Original Copy',
  } = data;

  const shipToData = shipTo || customer;

  const rows = products.map((p, i) => {
    const qty = Number(p.quantity || 0);
    const rate = Number(p.rate || 0);
    const amount = qty * rate;

    return [
      { text: String(i + 1), ...FONT.small, alignment: 'center' },
      { text: p.name || '', ...FONT.small },
      { text: p.hsn || '', ...FONT.small, alignment: 'center' },
      { text: String(qty), ...FONT.small, alignment: 'center' },
      { text: p.uom || '', ...FONT.small, alignment: 'center' },
      { text: formatCurrency(rate), ...FONT.small, alignment: 'center' },
      { text: formatCurrency(amount), ...FONT.small, alignment: 'center' },
    ];
  });

  const MIN_ROWS = 15;
  const fillerRows =
    rows.length < MIN_ROWS
      ? Array.from({ length: MIN_ROWS - rows.length }).map(() => [
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
        ])
      : [];

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 25],

    content: [
      {
        text: 'TAX INVOICE',
        ...FONT.title,
        alignment: 'center',
        margin: [0, 0, 0, 4],
      },
      {
        text: invoicefor,
        ...FONT.small,
        alignment: 'center',
        margin: [0, 0, 0, 8],
      },

      {
        table: {
          widths: ['60%', '20%', '20%'],
          body: [
            [
              {
                stack: [
                  {
                    text: companyName,
                    fontSize: 12,
                    bold: true,
                    color: COLORS.text,
                  },
                  { text: companyAddress, ...FONT.small, margin: [0, 2, 0, 0] },
                  {
                    text: `GSTIN: ${companyGST || '-'}`,
                    ...FONT.small,
                    margin: [0, 2, 0, 0],
                  },
                  {
                    text: `Mobile No. ${companyPhone || ''}`,
                    ...FONT.small,
                    margin: [0, 2, 0, 0],
                  },
                ],
                rowSpan: 4,
              },
              { text: 'Invoice No.', ...FONT.label },
              { text: billNo || '', ...FONT.normal },
            ],
            [
              {},
              { text: 'Invoice Date', ...FONT.label },
              { text: formatDate(date), ...FONT.normal },
            ],
            [
              {},
              { text: 'Challan No.', ...FONT.label },
              { text: challanNo || '', ...FONT.normal },
            ],
            [
              {},
              { text: 'Challan Date', ...FONT.label },
              { text: formatDate(challanDate), ...FONT.normal },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
        margin: [0, 0, 0, 8],
      },

      {
        columns: [
          {
            width: '50%',
            table: {
              widths: ['100%'],
              body: [
                [
                  {
                    stack: [
                      {
                        text: 'BUYER (BILL TO),',
                        ...FONT.label,
                        margin: [0, 0, 0, 2],
                      },
                      { text: customer?.name || '-', ...FONT.normal },
                      {
                        text: customer?.address || '-',
                        ...FONT.small,
                        margin: [0, 2, 0, 0],
                      },
                      {
                        text: `GSTIN: ${customer?.gstNo || 'NA'}`,
                        ...FONT.small,
                        margin: [0, 2, 0, 0],
                      },
                    ],
                    margin: [4, 4, 4, 4],
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => COLORS.border,
              vLineColor: () => COLORS.border,
            },
          },
          {
            width: '50%',
            table: {
              widths: ['100%'],
              body: [
                [
                  {
                    stack: [
                      {
                        text: 'CONSIGNEE (SHIP TO),',
                        ...FONT.label,
                        margin: [0, 0, 0, 2],
                      },
                      { text: shipToData?.name || '-', ...FONT.normal },
                      {
                        text: shipToData?.address || '-',
                        ...FONT.small,
                        margin: [0, 2, 0, 0],
                      },
                      {
                        text: `GSTIN: ${shipToData?.gstNo || 'NA'}`,
                        ...FONT.small,
                        margin: [0, 2, 0, 0],
                      },
                    ],
                    margin: [4, 4, 4, 4],
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => COLORS.border,
              vLineColor: () => COLORS.border,
            },
          },
        ],
        margin: [0, 4, 0, 6],
      },

      {
        table: {
          widths: ['16%', '17%', '16%', '17%', '17%', '17%'],
          body: [
            [
              { text: "Buyer's Order No.", ...FONT.small },
              { text: orderNo || '-', ...FONT.small },
              { text: 'Dated', ...FONT.small },
              { text: formatDate(orderDate), ...FONT.small },
              { text: 'Dis.Doc. No-', ...FONT.small },
              { text: disDocNo || '-', ...FONT.small },
            ],
            [
              { text: 'Delivery Date-', ...FONT.small },
              {
                text: deliveryDate ? formatDate(deliveryDate) : '-',
                ...FONT.small,
              },
              { text: 'Dispatched Through-', ...FONT.small },
              { text: dispatchedThrough || '-', ...FONT.small },
              { text: 'Destination-', ...FONT.small },
              { text: destination || '-', ...FONT.small },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
        margin: [0, 4, 0, 6],
      },

      {
        table: {
          headerRows: 1,
          widths: ['6%', '50%', '10%', '6%', '6%', '10%', '12%'],
          body: [
            [
              { text: 'Sr.No', ...FONT.label, alignment: 'center' },
              { text: 'Particulars', ...FONT.label, alignment: 'center' },
              { text: 'HSN', ...FONT.label, alignment: 'center' },
              { text: 'Qty', ...FONT.label, alignment: 'center' },
              { text: 'UOM', ...FONT.label, alignment: 'center' },
              { text: 'Rate', ...FONT.label, alignment: 'center' },
              { text: 'Amount', ...FONT.label, alignment: 'center' },
            ],
            ...rows,
            ...fillerRows,
          ],
        },
        layout: {
          hLineWidth: (i, node) =>
            i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
        margin: [0, 4, 0, 6],
      },

      {
        table: {
          widths: ['50%', '25%', '25%'],
          body: [
            [
              {
                text: [
                  { text: 'Rupees in Words:\n', bold: true },
                  convertToWords(grandTotal),
                ],
                rowSpan: 4,
                ...FONT.small,
              },
              { text: 'Subtotal', ...FONT.small },
              {
                text: formatCurrency(totalAmount),
                ...FONT.small,
                alignment: 'right',
              },
            ],
            [
              {},
              { text: `CGST (${gst}%)`, ...FONT.small },
              {
                text: formatCurrency(totalAmount * (gst / 100)),
                ...FONT.small,
                alignment: 'right',
              },
            ],
            [
              {},
              { text: `SGST (${gst}%)`, ...FONT.small },
              {
                text: formatCurrency(totalAmount * (gst / 100)),
                ...FONT.small,
                alignment: 'right',
              },
            ],
            [
              {},
              { text: 'Grand Total', ...FONT.label },
              {
                text: formatCurrency(grandTotal),
                ...FONT.label,
                alignment: 'right',
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
        margin: [0, 4, 0, 8],
      },

      {
        table: {
          widths: ['60%', '40%'],
          body: [
            [
              {
                stack: [
                  { text: 'Bank Details', ...FONT.label, margin: [0, 0, 0, 2] },
                  { text: companyName || '', ...FONT.small },
                  {
                    text: `Bank Name: ${companyBank?.name || ''}`,
                    ...FONT.small,
                    margin: [0, 1, 0, 0],
                  },
                  {
                    text: `A/C No: ${companyBank?.accountNumber || ''}`,
                    ...FONT.small,
                    margin: [0, 1, 0, 0],
                  },
                  {
                    text: `IFSC: ${companyBank?.ifscCode || ''}`,
                    ...FONT.small,
                    margin: [0, 1, 0, 0],
                  },
                ],
                margin: [4, 4, 4, 4],
              },
              {
                stack: [
                  {
                    text: `For ${companyName || ''}`,
                    ...FONT.label,
                    alignment: 'right',
                    margin: [0, 0, 0, 30],
                  },
                  {
                    text: 'Authorized Signatory',
                    ...FONT.small,
                    alignment: 'right',
                  },
                ],
                margin: [4, 4, 4, 4],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
        },
      },
      {
        columns: [{ text: 'Subject to Anand jurisdiction', ...FONT.small }],
      },
      // Payment Terms & Conditions section - UPDATED
      ...(termsAndConditions
        ? [
            {
              stack: [
                {
                  text: 'TERMS & CONDITIONS',
                  ...FONT.label,
                  fontSize: 10,
                  margin: [0, 8, 0, 4],
                },
                {
                  table: {
                    widths: ['100%'],
                    body: [
                      [
                        {
                          stack: [
                            ...(termsAndConditions
                              ? [
                                  {
                                    ul: formatTextAsBulletPoints(
                                      termsAndConditions
                                    ),
                                    margin: [0, 0, 0, 0],
                                  },
                                ]
                              : []),
                          ],
                          margin: [4, 4, 4, 4],
                        },
                      ],
                    ],
                  },
                  layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => COLORS.border,
                    vLineColor: () => COLORS.border,
                  },
                },
              ],
              margin: [0, 4, 0, 0],
            },
          ]
        : []),
    ],
  };

  pdfMake.createPdf(docDefinition).download(`Invoice-${billNo || ''}.pdf`);
};

/* ================= QUOTATION ================= */

export const generateQuotationPDF = (data) => {
  const {
    companyName,
    companyAddress,
    companyGST,
    companyPhone,
    quotationNo,
    date,
    customer,
    shipTo,
    products = [],
    totalAmount,
    gst,
    grandTotal = 0,
    companyBank,
    termsAndConditions,
    technicalSpecifications,
  } = data;

  const shipToData = shipTo || customer;

  const rows = products.map((p, i) => {
    const qty = Number(p.quantity || 0);
    const rate = Number(p.rate || 0);
    const amount = qty * rate;

    return [
      { text: String(i + 1), ...FONT.small, alignment: 'center' },
      { text: p.name || '', ...FONT.small },
      { text: p.hsn || '', ...FONT.small, alignment: 'center' },
      { text: String(qty), ...FONT.small, alignment: 'center' },
      { text: p.uom || '', ...FONT.small, alignment: 'center' },
      { text: formatCurrency(rate), ...FONT.small, alignment: 'center' },
      { text: formatCurrency(amount), ...FONT.small, alignment: 'center' },
    ];
  });

  const MIN_ROWS = 15;
  const fillerRows =
    rows.length < MIN_ROWS
      ? Array.from({ length: MIN_ROWS - rows.length }).map(() => [
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
        ])
      : [];

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 25],

    content: [
      {
        text: 'QUOTATION',
        ...FONT.title,
        alignment: 'center',
        margin: [0, 0, 0, 4],
      },

      {
        table: {
          widths: ['60%', '20%', '20%'],
          body: [
            [
              {
                stack: [
                  {
                    text: companyName,
                    fontSize: 12,
                    bold: true,
                    color: COLORS.text,
                  },
                  { text: companyAddress, ...FONT.small, margin: [0, 2, 0, 0] },
                  {
                    text: `GSTIN: ${companyGST || '-'}`,
                    ...FONT.small,
                    margin: [0, 2, 0, 0],
                  },
                  {
                    text: `Mobile No. ${companyPhone || ''}`,
                    ...FONT.small,
                    margin: [0, 2, 0, 0],
                  },
                ],
                rowSpan: 2,
              },
              { text: 'Quotation No.', ...FONT.label },
              { text: quotationNo || '', ...FONT.normal },
            ],
            [
              {},
              { text: 'Date', ...FONT.label },
              { text: formatDate(date), ...FONT.normal },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
        margin: [0, 0, 0, 8],
      },

      {
        columns: [
          {
            width: '100%',
            table: {
              widths: ['100%'],
              body: [
                [
                  {
                    stack: [
                      {
                        text: 'To,',
                        ...FONT.label,
                        margin: [0, 0, 0, 2],
                      },
                      { text: customer?.name || '-', ...FONT.normal },
                      {
                        text: customer?.address || '-',
                        ...FONT.small,
                        margin: [0, 2, 0, 0],
                      },
                      {
                        text: `GSTIN: ${customer?.gstNo || 'NA'}`,
                        ...FONT.small,
                        margin: [0, 2, 0, 0],
                      },
                    ],
                    margin: [4, 4, 4, 4],
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => COLORS.border,
              vLineColor: () => COLORS.border,
            },
          },
        ],
        margin: [0, 4, 0, 6],
      },

      {
        table: {
          headerRows: 1,
          widths: ['6%', '50%', '10%', '6%', '6%', '10%', '12%'],
          body: [
            [
              { text: 'Sr.No', ...FONT.label, alignment: 'center' },
              { text: 'Particulars', ...FONT.label, alignment: 'center' },
              { text: 'HSN', ...FONT.label, alignment: 'center' },
              { text: 'Qty', ...FONT.label, alignment: 'center' },
              { text: 'UOM', ...FONT.label, alignment: 'center' },
              { text: 'Rate', ...FONT.label, alignment: 'center' },
              { text: 'Amount', ...FONT.label, alignment: 'center' },
            ],
            ...rows,
            ...fillerRows,
          ],
        },
        layout: {
          hLineWidth: (i, node) =>
            i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
        margin: [0, 4, 0, 6],
      },

      {
        table: {
          widths: ['50%', '25%', '25%'],
          body: [
            [
              {
                text: [
                  { text: 'Rupees in Words:\n', bold: true },
                  convertToWords(grandTotal),
                ],
                rowSpan: 4,
                ...FONT.small,
              },
              { text: 'Subtotal', ...FONT.small },
              {
                text: formatCurrency(totalAmount),
                ...FONT.small,
                alignment: 'right',
              },
            ],
            [
              {},
              { text: `CGST (${gst}%)`, ...FONT.small },
              {
                text: formatCurrency(totalAmount * (gst / 100)),
                ...FONT.small,
                alignment: 'right',
              },
            ],
            [
              {},
              { text: `SGST (${gst}%)`, ...FONT.small },
              {
                text: formatCurrency(totalAmount * (gst / 100)),
                ...FONT.small,
                alignment: 'right',
              },
            ],
            [
              {},
              { text: 'Grand Total', ...FONT.label },
              {
                text: formatCurrency(grandTotal),
                ...FONT.label,
                alignment: 'right',
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
        margin: [0, 4, 0, 8],
      },

      {
        table: {
          widths: ['60%', '40%'],
          body: [
            [
              {
                stack: [
                  { text: 'Bank Details', ...FONT.label, margin: [0, 0, 0, 2] },
                  { text: companyName || '', ...FONT.small },
                  {
                    text: `Bank Name: ${companyBank?.name || ''}`,
                    ...FONT.small,
                    margin: [0, 1, 0, 0],
                  },
                  {
                    text: `A/C No: ${companyBank?.accountNumber || ''}`,
                    ...FONT.small,
                    margin: [0, 1, 0, 0],
                  },
                  {
                    text: `IFSC: ${companyBank?.ifscCode || ''}`,
                    ...FONT.small,
                    margin: [0, 1, 0, 0],
                  },
                ],
                margin: [4, 4, 4, 4],
              },
              {
                stack: [
                  {
                    text: `For ${companyName || ''}`,
                    ...FONT.label,
                    alignment: 'right',
                    margin: [0, 0, 0, 30],
                  },
                  {
                    text: 'Authorized Signatory',
                    ...FONT.small,
                    alignment: 'right',
                  },
                ],
                margin: [4, 4, 4, 4],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
        },
      },

      // Technical Specifications - UPDATED
      ...(technicalSpecifications
        ? [
            {
              stack: [
                {
                  text: 'TECHNICAL SPECIFICATIONS',
                  ...FONT.label,
                  fontSize: 10,
                  margin: [0, 8, 0, 4],
                },
                {
                  table: {
                    widths: ['100%'],
                    body: [
                      [
                        {
                          ul: formatTextAsBulletPoints(technicalSpecifications),
                          margin: [4, 4, 4, 4],
                        },
                      ],
                    ],
                  },
                  layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => COLORS.border,
                    vLineColor: () => COLORS.border,
                  },
                },
              ],
              margin: [0, 4, 0, 0],
            },
          ]
        : []),

      // Payment Terms & Conditions - UPDATED
      ...(termsAndConditions
        ? [
            {
              stack: [
                {
                  text: 'TERMS & CONDITIONS',
                  ...FONT.label,
                  fontSize: 10,
                  margin: [0, 8, 0, 4],
                },
                {
                  table: {
                    widths: ['100%'],
                    body: [
                      [
                        {
                          stack: [
                            ...(termsAndConditions
                              ? [
                                  {
                                    ul: formatTextAsBulletPoints(
                                      termsAndConditions
                                    ),
                                    margin: [0, 0, 0, 0],
                                  },
                                ]
                              : []),
                          ],
                          margin: [4, 4, 4, 4],
                        },
                      ],
                    ],
                  },
                  layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => COLORS.border,
                    vLineColor: () => COLORS.border,
                  },
                },
              ],
              margin: [0, 4, 0, 0],
            },
          ]
        : []),
    ],
  };

  pdfMake
    .createPdf(docDefinition)
    .download(`Quotation-${quotationNo || ''}.pdf`);
};

/* ================= CHALLAN ================= */

export const generateChallanPDF = (data) => {
  const {
    companyName,
    companyAddress,
    companyGST,
    companyPhone,
    challanNo,
    orderNo,
    orderDate,
    date,
    customer,
    shipTo,
    products = [],
  } = data;

  const shipToData = shipTo || customer;

  const rows = products.map((p, i) => {
    const qty = Number(p.quantity || 0);
    return [
      { text: String(i + 1), ...FONT.small, alignment: 'center' },
      { text: p.name || '', ...FONT.small },
      { text: p.hsn || '', ...FONT.small, alignment: 'center' },
      { text: String(qty), ...FONT.small, alignment: 'center' },
      { text: p.uom || '', ...FONT.small, alignment: 'center' },
    ];
  });

  const MIN_ROWS = 15;
  const fillerRows =
    rows.length < MIN_ROWS
      ? Array.from({ length: MIN_ROWS - rows.length }).map(() => [
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
          { text: ' ', ...FONT.small },
        ])
      : [];

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 25],

    content: [
      {
        text: 'DELIVERY CHALLAN',
        ...FONT.title,
        alignment: 'center',
        margin: [0, 0, 0, 4],
      },

      {
        table: {
          widths: ['60%', '20%', '20%'],
          body: [
            [
              {
                stack: [
                  {
                    text: companyName,
                    fontSize: 12,
                    bold: true,
                    color: COLORS.text,
                  },
                  { text: companyAddress, ...FONT.small, margin: [0, 2, 0, 0] },
                  {
                    text: `GSTIN: ${companyGST || '-'}`,
                    ...FONT.small,
                    margin: [0, 2, 0, 0],
                  },
                  {
                    text: `Mobile No. ${companyPhone || ''}`,
                    ...FONT.small,
                    margin: [0, 2, 0, 0],
                  },
                ],
                rowSpan: 4,
              },
              { text: 'Challan No.', ...FONT.label },
              { text: challanNo || '', ...FONT.normal },
            ],
            [
              {},
              { text: 'Date', ...FONT.label },
              { text: formatDate(date), ...FONT.normal },
            ],
            [
              {},
              { text: 'Order No.', ...FONT.label },
              { text: orderNo || '', ...FONT.normal },
            ],
            [
              {},
              { text: 'Order Date', ...FONT.label },
              { text: formatDate(orderDate), ...FONT.normal },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
        margin: [0, 0, 0, 8],
      },

      {
        columns: [
          {
            width: '50%',
            table: {
              widths: ['100%'],
              body: [
                [
                  {
                    stack: [
                      {
                        text: 'BUYER (BILL TO),',
                        ...FONT.label,
                        margin: [0, 0, 0, 2],
                      },
                      { text: customer?.name || '-', ...FONT.normal },
                      {
                        text: customer?.address || '-',
                        ...FONT.small,
                        margin: [0, 2, 0, 0],
                      },
                      {
                        text: `GSTIN: ${customer?.gstNo || 'NA'}`,
                        ...FONT.small,
                        margin: [0, 2, 0, 0],
                      },
                    ],
                    margin: [4, 4, 4, 4],
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => COLORS.border,
              vLineColor: () => COLORS.border,
            },
          },
          {
            width: '50%',
            table: {
              widths: ['100%'],
              body: [
                [
                  {
                    stack: [
                      {
                        text: 'CONSIGNEE (SHIP TO),',
                        ...FONT.label,
                        margin: [0, 0, 0, 2],
                      },
                      { text: shipToData?.name || '-', ...FONT.normal },
                      {
                        text: shipToData?.address || '-',
                        ...FONT.small,
                        margin: [0, 2, 0, 0],
                      },
                      {
                        text: `GSTIN: ${shipToData?.gstNo || 'NA'}`,
                        ...FONT.small,
                        margin: [0, 2, 0, 0],
                      },
                    ],
                    margin: [4, 4, 4, 4],
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => COLORS.border,
              vLineColor: () => COLORS.border,
            },
          },
        ],
        margin: [0, 4, 0, 6],
      },

      {
        table: {
          headerRows: 1,
          widths: ['8%', '54%', '12%', '13%', '13%'],
          body: [
            [
              { text: 'Sr.No', ...FONT.label, alignment: 'center' },
              { text: 'Particulars', ...FONT.label, alignment: 'center' },
              { text: 'HSN', ...FONT.label, alignment: 'center' },
              { text: 'Quantity', ...FONT.label, alignment: 'center' },
              { text: 'UOM', ...FONT.label, alignment: 'center' },
            ],
            ...rows,
            ...fillerRows,
          ],
        },
        layout: {
          hLineWidth: (i, node) =>
            i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
        margin: [0, 4, 0, 6],
      },

      {
        columns: [
          {
            width: '50%',
            stack: [
              {
                text: 'Receiver Signature',
                ...FONT.small,
                margin: [0, 0, 0, 20],
              },
              { text: '___________________________', ...FONT.small },
            ],
          },
          {
            width: '50%',
            stack: [
              {
                text: `For ${companyName || ''}`,
                ...FONT.label,
                alignment: 'right',
                margin: [0, 0, 0, 20],
              },
              {
                text: 'Authorized Signatory',
                ...FONT.small,
                alignment: 'right',
                margin: [0, 0, 0, 10],
              },
              {
                text: '___________________________',
                ...FONT.small,
                alignment: 'right',
              },
            ],
          },
        ],
        margin: [0, 8, 0, 4],
      },

      // {
      //   text: 'Goods once delivered will not be taken back.',
      //   ...FONT.small,
      //   alignment: 'center',
      //   margin: [0, 4, 0, 0],
      // },
    ],
  };

  pdfMake.createPdf(docDefinition).download(`Challan-${challanNo || ''}.pdf`);
};
