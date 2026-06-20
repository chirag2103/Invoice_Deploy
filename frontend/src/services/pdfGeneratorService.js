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
  normal: { fontSize: 10, color: COLORS.text, lineHeight: 1.15 },
  small: { fontSize: 9, color: COLORS.text, lineHeight: 1.15 },
  label: { fontSize: 10, bold: true, color: COLORS.text, lineHeight: 1.1 },
  title: { fontSize: 16, bold: true, color: COLORS.text, lineHeight: 1.1 },
};
const TERMS_HEADING = { ...FONT.label, fontSize: 9.5, margin: [0, 6, 0, 3] };

const MIN_ROWS = 11;
const INVOICE_FIRST_PAGE_MIN_ROWS = 1;
const INVOICE_FIRST_PAGE_MAX_ROWS = 18;
const INVOICE_CONTINUATION_PAGE_MAX_ROWS = 18;

const simpleBorderLayout = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => COLORS.border,
  vLineColor: () => COLORS.border,
};

const paddedBorderLayout = {
  ...simpleBorderLayout,
  paddingLeft: () => 4,
  paddingRight: () => 4,
  paddingTop: () => 3,
  paddingBottom: () => 3,
};

const compactBorderLayout = {
  ...simpleBorderLayout,
  paddingLeft: () => 3,
  paddingRight: () => 3,
  paddingTop: () => 2,
  paddingBottom: () => 2,
};

const invoiceTableLayout = {
  hLineWidth: (i, node) =>
    i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0,
  vLineWidth: () => 0.5,
  hLineColor: () => COLORS.border,
  vLineColor: () => COLORS.border,
  paddingLeft: () => 3,
  paddingRight: () => 3,
  paddingTop: () => 2,
  paddingBottom: () => 2,
};

function getBankName(companyBank = {}) {
  return companyBank?.bankName || companyBank?.name || '';
}

function getBankIfsc(companyBank = {}) {
  return companyBank?.ifsc || companyBank?.ifscCode || '';
}

// Helper function - add at top of pdfGeneratorService.js

function formatTextAsBulletPoints(text) {
  if (typeof text !== 'string') return [];
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

function formatProductName(text) {
  if (!text) return { text: '', ...FONT.small };
  const lines = text.split('\n').filter((line) => line.trimEnd() !== '');
  if (lines.length <= 1) return { text: text || '', ...FONT.small };

  return {
    stack: lines.map((line, idx) => {
      const isIndented = line.startsWith('    ') || line.startsWith('\t');
      return {
        text: line.trimStart(),
        ...FONT.small,
        ...(idx === 0 ? { bold: true } : {}),
        margin: isIndented ? [10, 0, 0, 1] : [0, 0, 0, 1],
      };
    }),
  };
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

const DEFAULT_SIGNATURE_IMAGE =
  'data:image/png;base64,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';

const getSignatureImage = (userSignature) =>
  userSignature?.dataUrl || DEFAULT_SIGNATURE_IMAGE;

/* ================= INVOICE ================= */

const createInvoiceFillerRows = (count) =>
  Array.from({ length: Math.max(count, 0) }).map(() => [
    { text: ' ', ...FONT.small },
    { text: ' ', ...FONT.small },
    { text: ' ', ...FONT.small },
    { text: ' ', ...FONT.small },
    { text: ' ', ...FONT.small },
    { text: ' ', ...FONT.small },
    { text: ' ', ...FONT.small },
    { text: ' ', ...FONT.small },
  ]);

const getInvoiceRows = (products = [], hasDiscount = false) =>
  products.map((p, i) => {
    const qty = Number(p.quantity || 0);
    const rate = Number(p.rate || 0);
    const disc = Number(p.discount || 0);
    const amount = qty * rate * (1 - disc / 100);

    const row = [
      { text: String(i + 1), ...FONT.small, alignment: 'center' },
      formatProductName(p.name),
      { text: p.hsn || '', ...FONT.small, alignment: 'center' },
      { text: String(qty), ...FONT.small, alignment: 'center' },
      { text: p.uom || '', ...FONT.small, alignment: 'center' },
      { text: formatCurrency(rate), ...FONT.small, alignment: 'center' },
    ];
    if (hasDiscount) row.push({ text: disc > 0 ? `${disc}%` : '-', ...FONT.small, alignment: 'center' });
    row.push({ text: formatCurrency(amount), ...FONT.small, alignment: 'center' });
    return row;
  });

const getInvoiceRowChunks = (rows) => {
  if (rows.length <= INVOICE_FIRST_PAGE_MAX_ROWS) {
    return [
      {
        rows,
        fillerRowCount: Math.max(INVOICE_FIRST_PAGE_MIN_ROWS - rows.length, 0),
      },
    ];
  }

  const chunks = [
    {
      rows: rows.slice(0, INVOICE_FIRST_PAGE_MAX_ROWS),
      fillerRowCount: 0,
    },
  ];

  for (
    let index = INVOICE_FIRST_PAGE_MAX_ROWS;
    index < rows.length;
    index += INVOICE_CONTINUATION_PAGE_MAX_ROWS
  ) {
    chunks.push({
      rows: rows.slice(index, index + INVOICE_CONTINUATION_PAGE_MAX_ROWS),
      fillerRowCount: 0,
    });
  }

  return chunks;
};

const buildInvoiceHeaderSection = ({
  companyName,
  companyAddress,
  companyGST,
  companyPhone,
  billNo,
  date,
  challanNo,
  challanDate,
  invoicefor,
  pageIndex,
}) => [
  {
    text: 'TAX INVOICE',
    ...FONT.title,
    alignment: 'center',
    margin: [0, 0, 0, 4],
  },
  {
    text: pageIndex === 0 ? invoicefor : `${invoicefor} (Continued)`,
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
                fontSize: 14,
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
          {
            text: `${companyName
              ?.split(' ')
              .map((word) => word[0].toUpperCase())
              .join('')}/${billNo || ''}`,
            ...FONT.normal,
          },
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
    layout: paddedBorderLayout,
    margin: [0, 0, 0, 4],
  },
];

const buildInvoicePartySection = ({ customer, shipToData }) => ({
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
      layout: simpleBorderLayout,
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
      layout: simpleBorderLayout,
    },
  ],
  margin: [0, 4, 0, 6],
});

const buildInvoiceMetaSection = ({
  orderNo,
  orderDate,
  disDocNo,
  deliveryDate,
  dispatchedThrough,
  destination,
}) => ({
  table: {
    widths: ['16%', '15%', '20%', '17%', '16%', '16%'],
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
  layout: compactBorderLayout,
  margin: [0, 4, 0, 6],
});

const buildInvoiceProductsSection = (rows, fillerRowCount = 0, hasDiscount = false) => ({
  table: {
    headerRows: 1,
    widths: hasDiscount
      ? ['6%', '43%', '9%', '6%', '6%', '9%', '9%', '12%']
      : ['6%', '50%', '10%', '6%', '6%', '10%', '12%'],
    body: [
      [
        { text: 'Sr.No', ...FONT.label, alignment: 'center' },
        { text: 'Particulars', ...FONT.label, alignment: 'center' },
        { text: 'HSN', ...FONT.label, alignment: 'center' },
        { text: 'Qty', ...FONT.label, alignment: 'center' },
        { text: 'UOM', ...FONT.label, alignment: 'center' },
        { text: 'Rate', ...FONT.label, alignment: 'center' },
        ...(hasDiscount ? [{ text: 'Disc%', ...FONT.label, alignment: 'center' }] : []),
        { text: 'Amount', ...FONT.label, alignment: 'center' },
      ],
      ...rows,
      ...createInvoiceFillerRows(fillerRowCount),
    ],
  },
  layout: invoiceTableLayout,
  margin: [0, 4, 0, 6],
});

const buildInvoiceFooterSections = ({
  companyName,
  companyBank,
  totalAmount,
  invoiceDiscount = 0,
  gst,
  gstType = 'intraState',
  grandTotal,
  termsAndConditions,
  userSignature,
}) => {
  const isIGST = gstType === 'interState';
  const taxable = Math.max(Number(totalAmount || 0) - Number(invoiceDiscount || 0), 0);
  const igstRate = gst * 2;
  const igstAmount = taxable * (igstRate / 100);
  const cgstSgstAmount = taxable * (gst / 100);

  const discountRow = invoiceDiscount > 0
    ? [[
        {},
        { text: 'Discount', ...FONT.small },
        { text: `- ${formatCurrency(invoiceDiscount)}`, ...FONT.small, alignment: 'right' },
      ]]
    : [];

  const taxRows = isIGST
    ? [
        [
          {},
          { text: `IGST (${igstRate}%)`, ...FONT.small },
          {
            text: formatCurrency(igstAmount),
            ...FONT.small,
            alignment: 'right',
          },
        ],
      ]
    : [
        [
          {},
          { text: `CGST (${gst}%)`, ...FONT.small },
          {
            text: formatCurrency(cgstSgstAmount),
            ...FONT.small,
            alignment: 'right',
          },
        ],
        [
          {},
          { text: `SGST (${gst}%)`, ...FONT.small },
          {
            text: formatCurrency(cgstSgstAmount),
            ...FONT.small,
            alignment: 'right',
          },
        ],
      ];

  const totalRows = discountRow.length + taxRows.length + 2; // subtotal + discount + tax rows + grand total

  return [
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
            rowSpan: totalRows,
            ...FONT.small,
          },
          { text: 'Subtotal', ...FONT.small },
          {
            text: formatCurrency(totalAmount),
            ...FONT.small,
            alignment: 'right',
          },
        ],
        ...discountRow,
        ...taxRows,
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
    layout: compactBorderLayout,
    margin: [0, 4, 0, 4],
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
                text: `Bank Name: ${getBankName(companyBank)}`,
                ...FONT.small,
                margin: [0, 1, 0, 0],
              },
              {
                text: `A/C No: ${companyBank?.accountNumber || ''}`,
                ...FONT.small,
                margin: [0, 1, 0, 0],
              },
              {
                text: `IFSC: ${getBankIfsc(companyBank)}`,
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
                margin: [0, 0, 0, 4],
              },
              {
                image: getSignatureImage(userSignature),
                fit: [120, 40],
                alignment: 'right',
                margin: [0, 0, 0, 0],
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
    layout: simpleBorderLayout,
  },
  {
    columns: [{ text: 'Subject to Anand jurisdiction', ...FONT.small }],
  },
  ...(termsAndConditions
    ? [
        {
          stack: [
            {
              text: 'TERMS & CONDITIONS',
              ...TERMS_HEADING,
            },
            {
              table: {
                widths: ['100%'],
                body: [
                  [
                    {
                      stack: [
                        {
                          ul: formatTextAsBulletPoints(termsAndConditions),
                          margin: [0, 0, 0, 0],
                        },
                      ],
                      margin: [4, 4, 4, 4],
                    },
                  ],
                ],
              },
              layout: simpleBorderLayout,
            },
          ],
          margin: [0, 4, 0, 0],
        },
      ]
    : []),
  {
    text: 'This document is computer generated and does not require signature.',
    ...FONT.small,
    alignment: 'center',
    margin: [0, 8, 0, 0],
    italics: true,
  },
]};

/* =====================================================
   SHARED TEMPLATE HELPERS  (Modern + Minimal)
   Used by Invoice, Quotation, Purchase Order, Challan
   ===================================================== */

const MODERN_COLORS = {
  blue: '#1e3a5f',
  accent: '#1a56db',
  light: '#eff6ff',
  rowAlt: '#f9fafb',
  card: '#f8fafc',
  border: '#e2e8f0',
  blueBorder: '#bfdbfe',
  textDark: '#374151',
  textMid: '#6b7280',
  white: '#ffffff',
};

const MINIMAL_COLORS = {
  dark: '#111827',
  gray: '#6b7280',
  line: '#e5e7eb',
};

// ---- Modern: company header bar ----
const buildModernHeader = ({ companyName, companyAddress, companyGST, companyPhone, companyLogo, docType }) => {
  const logoNode = companyLogo?.dataUrl ? { image: companyLogo.dataUrl, fit: [70, 35], width: 80, margin: [0, 4, 12, 4] } : null;
  return [
    {
      table: {
        widths: ['*'],
        body: [[{
          columns: [
            ...(logoNode ? [logoNode] : []),
            {
              stack: [
                { text: companyName || '', fontSize: 18, bold: true, color: MODERN_COLORS.white },
                { text: companyAddress || '', fontSize: 8.5, color: '#cbd5e1', margin: [0, 2, 0, 0] },
                { text: `GSTIN: ${companyGST || '-'}  |  Ph: ${companyPhone || ''}`, fontSize: 8.5, color: '#94a3b8', margin: [0, 2, 0, 0] },
              ],
            },
          ],
          fillColor: MODERN_COLORS.blue,
          margin: [12, 10, 12, 10],
        }]],
      },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
    },
    {
      columns: [
        { text: docType, fontSize: 13, bold: true, color: MODERN_COLORS.white, fillColor: MODERN_COLORS.accent, margin: [8, 5, 8, 5] },
        { text: '', width: '*' },
      ],
      margin: [0, 0, 0, 8],
    },
  ];
};

// ---- Modern: meta card row ----
const buildModernMetaCard = (fields) => ({
  table: {
    widths: ['*'],
    body: [[{
      stack: fields.map(([label, value]) => ({
        text: [{ text: `${label}: `, bold: true, fontSize: 9, color: MODERN_COLORS.accent }, { text: value || '-', fontSize: 9, color: MODERN_COLORS.textDark }],
        margin: [0, 1, 0, 0],
      })),
      fillColor: MODERN_COLORS.light,
      margin: [8, 8, 8, 8],
    }]],
  },
  layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => MODERN_COLORS.blueBorder, vLineColor: () => MODERN_COLORS.blueBorder },
});

// ---- Modern: 2-column party section ----
const buildModernPartySection = ({ leftLabel, leftParty, rightLabel, rightParty }) => ({
  columns: [
    {
      width: '50%',
      table: {
        widths: ['100%'],
        body: [[{
          stack: [
            { text: leftLabel, fontSize: 8, bold: true, color: MODERN_COLORS.accent, margin: [0, 0, 0, 3] },
            { text: leftParty?.name || '-', fontSize: 11, bold: true, color: MODERN_COLORS.blue },
            { text: leftParty?.address || '-', fontSize: 8.5, color: MODERN_COLORS.textDark, margin: [0, 2, 0, 0] },
            { text: `GSTIN: ${leftParty?.gstNo || 'NA'}`, fontSize: 8.5, color: MODERN_COLORS.textMid, margin: [0, 2, 0, 0] },
          ],
          fillColor: MODERN_COLORS.card, margin: [8, 8, 8, 8],
        }]],
      },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => MODERN_COLORS.border, vLineColor: () => MODERN_COLORS.border },
    },
    {
      width: '50%',
      table: {
        widths: ['100%'],
        body: [[{
          stack: [
            { text: rightLabel, fontSize: 8, bold: true, color: MODERN_COLORS.accent, margin: [0, 0, 0, 3] },
            { text: rightParty?.name || '-', fontSize: 11, bold: true, color: MODERN_COLORS.blue },
            { text: rightParty?.address || '-', fontSize: 8.5, color: MODERN_COLORS.textDark, margin: [0, 2, 0, 0] },
            { text: `GSTIN: ${rightParty?.gstNo || 'NA'}`, fontSize: 8.5, color: MODERN_COLORS.textMid, margin: [0, 2, 0, 0] },
          ],
          fillColor: MODERN_COLORS.card, margin: [8, 8, 8, 8],
        }]],
      },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => MODERN_COLORS.border, vLineColor: () => MODERN_COLORS.border },
    },
  ],
  margin: [0, 0, 0, 8],
});

// ---- Modern: products table (alternating rows, dark blue header, no vertical lines) ----
const buildModernProductsTable = (rows, colWidths, headerLabels, fillerCount = 0) => {
  const fillerCells = headerLabels.map(() => ({ text: ' ', fontSize: 9 }));
  const fillerRows = Array.from({ length: fillerCount }).map(() => fillerCells);

  const modernRows = rows.map((row, i) =>
    row.map((cell) => ({ ...cell, fillColor: i % 2 === 1 ? MODERN_COLORS.rowAlt : null }))
  );
  const modernFillerRows = fillerRows.map((row, i) =>
    row.map((cell) => ({ ...cell, fillColor: (rows.length + i) % 2 === 1 ? MODERN_COLORS.rowAlt : null }))
  );

  return {
    table: {
      headerRows: 1,
      widths: colWidths,
      body: [
        headerLabels.map((label, idx) => ({
          text: label,
          bold: true,
          fontSize: 9,
          color: MODERN_COLORS.white,
          fillColor: MODERN_COLORS.blue,
          alignment: idx === headerLabels.length - 1 ? 'right' : 'center',
        })),
        ...modernRows,
        ...modernFillerRows,
      ],
    },
    layout: {
      hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0.3),
      vLineWidth: () => 0,
      hLineColor: () => MODERN_COLORS.border,
      paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3,
    },
    margin: [0, 0, 0, 8],
  };
};

// ---- Modern: totals + footer ----
const buildModernTotalsFooter = ({ companyName, companyBank, totalAmount, invoiceDiscount = 0, gst, gstType, grandTotal, termsAndConditions, userSignature }) => {
  const isIGST = gstType === 'interState';
  const taxable = Math.max(Number(totalAmount || 0) - Number(invoiceDiscount || 0), 0);
  const taxAmount = taxable * (gst / 100);
  const igstAmount = taxable * ((gst * 2) / 100);
  const taxRows = isIGST
    ? [[{ text: `IGST (${gst * 2}%)`, fontSize: 9, color: MODERN_COLORS.textDark }, { text: formatCurrency(igstAmount), fontSize: 9, alignment: 'right', color: MODERN_COLORS.textDark }]]
    : [
        [{ text: `CGST (${gst}%)`, fontSize: 9, color: MODERN_COLORS.textDark }, { text: formatCurrency(taxAmount), fontSize: 9, alignment: 'right', color: MODERN_COLORS.textDark }],
        [{ text: `SGST (${gst}%)`, fontSize: 9, color: MODERN_COLORS.textDark }, { text: formatCurrency(taxAmount), fontSize: 9, alignment: 'right', color: MODERN_COLORS.textDark }],
      ];
  const discountRows = invoiceDiscount > 0
    ? [[{ text: 'Discount', fontSize: 9, color: MODERN_COLORS.textDark }, { text: `- ${formatCurrency(invoiceDiscount)}`, fontSize: 9, alignment: 'right', color: MODERN_COLORS.textDark }]]
    : [];

  return [
    {
      columns: [
        {
          width: '55%',
          table: {
            widths: ['*'],
            body: [[{ text: `Amount in Words:\n${convertToWords(grandTotal)}`, fontSize: 9, italic: true, color: MODERN_COLORS.blue, margin: [8, 6, 8, 6] }]],
          },
          layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => MODERN_COLORS.blueBorder, vLineColor: () => MODERN_COLORS.blueBorder },
        },
        { width: '5%', text: '' },
        {
          width: '40%',
          table: {
            widths: ['*', 'auto'],
            body: [
              [{ text: 'Subtotal', fontSize: 9, color: MODERN_COLORS.textDark }, { text: formatCurrency(totalAmount), fontSize: 9, alignment: 'right', color: MODERN_COLORS.textDark }],
              ...discountRows,
              ...taxRows,
              [
                { text: 'GRAND TOTAL', bold: true, fontSize: 10, color: MODERN_COLORS.blue, fillColor: MODERN_COLORS.light },
                { text: formatCurrency(grandTotal), bold: true, fontSize: 10, alignment: 'right', color: MODERN_COLORS.blue, fillColor: MODERN_COLORS.light },
              ],
            ],
          },
          layout: {
            hLineWidth: (i, node) => (i === node.table.body.length - 1 ? 1 : 0.3),
            vLineWidth: () => 0,
            hLineColor: () => MODERN_COLORS.accent,
            paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3,
          },
        },
      ],
      margin: [0, 0, 0, 10],
    },
    {
      columns: [
        {
          width: '55%',
          stack: [
            { text: 'Bank Details', bold: true, fontSize: 9.5, color: MODERN_COLORS.accent, margin: [0, 0, 0, 3] },
            { text: companyName || '', fontSize: 9, color: MODERN_COLORS.textDark },
            { text: `Bank: ${getBankName(companyBank)}`, fontSize: 9, color: MODERN_COLORS.textDark, margin: [0, 1, 0, 0] },
            { text: `A/C: ${companyBank?.accountNumber || ''}`, fontSize: 9, color: MODERN_COLORS.textDark, margin: [0, 1, 0, 0] },
            { text: `IFSC: ${getBankIfsc(companyBank)}`, fontSize: 9, color: MODERN_COLORS.textDark, margin: [0, 1, 0, 0] },
          ],
        },
        {
          width: '45%',
          stack: [
            { text: `For ${companyName || ''}`, bold: true, fontSize: 9.5, color: MODERN_COLORS.blue, alignment: 'right', margin: [0, 0, 0, 6] },
            { image: getSignatureImage(userSignature), fit: [120, 40], alignment: 'right', margin: [0, 0, 0, 4] },
            { text: 'Authorized Signatory', fontSize: 8.5, color: MODERN_COLORS.textMid, alignment: 'right' },
          ],
        },
      ],
      margin: [0, 0, 0, 8],
    },
    ...(termsAndConditions
      ? [{ stack: [{ text: 'Terms & Conditions', bold: true, fontSize: 9.5, color: MODERN_COLORS.accent, margin: [0, 0, 0, 3] }, { ul: formatTextAsBulletPoints(termsAndConditions) }], margin: [0, 4, 0, 0] }]
      : []),
    { text: 'This document is computer generated and does not require signature.', fontSize: 8.5, italic: true, alignment: 'center', color: '#9ca3af', margin: [0, 8, 0, 0] },
  ];
};

// ---- Minimal: company header ----
const buildMinimalHeader = ({ companyName, companyAddress, companyGST, companyPhone, companyLogo, docType, docMeta }) => {
  const LINE_COLOR = MINIMAL_COLORS.line;
  const DARK = MINIMAL_COLORS.dark;
  const GRAY = MINIMAL_COLORS.gray;
  const logoNode = companyLogo?.dataUrl ? { image: companyLogo.dataUrl, fit: [80, 40], width: 80, alignment: 'right' } : null;

  return [
    {
      columns: [
        {
          stack: [
            { text: companyName || '', fontSize: 18, bold: true, color: DARK },
            { text: companyAddress || '', fontSize: 8.5, color: GRAY, margin: [0, 3, 0, 0] },
            { text: `GSTIN: ${companyGST || '-'}  |  Ph: ${companyPhone || ''}`, fontSize: 8.5, color: GRAY, margin: [0, 1, 0, 0] },
          ],
        },
        ...(logoNode ? [logoNode] : []),
      ],
      margin: [0, 0, 0, 6],
    },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LINE_COLOR }], margin: [0, 0, 0, 8] },
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: docType, fontSize: 13, bold: true, color: DARK, margin: [0, 0, 0, 6] },
            ...docMeta.map(([label, value]) => ({
              text: [{ text: `${label}: `, color: GRAY, fontSize: 9 }, { text: value || '-', fontSize: 9, color: DARK }],
              margin: [0, 1, 0, 0],
            })),
          ],
        },
      ],
      margin: [0, 0, 0, 10],
    },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LINE_COLOR }], margin: [0, 0, 0, 8] },
  ];
};

// ---- Minimal: party block (accent left-bar) ----
const buildMinimalParty = ({ label, party }) => {
  const LINE_COLOR = MINIMAL_COLORS.line;
  const DARK = MINIMAL_COLORS.dark;
  const GRAY = MINIMAL_COLORS.gray;
  return [
    { text: label, fontSize: 8, bold: true, color: GRAY, margin: [0, 0, 0, 3] },
    {
      columns: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 0, y2: 45, lineWidth: 2, lineColor: LINE_COLOR }], width: 8 },
        {
          stack: [
            { text: party?.name || '-', fontSize: 11, bold: true, color: DARK },
            { text: party?.address || '-', fontSize: 8.5, color: GRAY, margin: [0, 2, 0, 0] },
            { text: `GSTIN: ${party?.gstNo || 'NA'}`, fontSize: 8.5, color: GRAY, margin: [0, 1, 0, 0] },
          ],
        },
      ],
      margin: [0, 0, 0, 8],
    },
  ];
};

// ---- Minimal: products table (borderless except top+header+bottom) ----
const buildMinimalProductsTable = (rows, colWidths, headerLabels, fillerCount = 0) => {
  const LINE_COLOR = MINIMAL_COLORS.line;
  const GRAY = MINIMAL_COLORS.gray;
  const fillerRows = Array.from({ length: fillerCount }).map(() => headerLabels.map(() => ({ text: ' ', fontSize: 9 })));

  return {
    table: {
      headerRows: 1,
      widths: colWidths,
      body: [
        headerLabels.map((label, idx) => ({
          text: label,
          fontSize: 8,
          bold: true,
          color: GRAY,
          alignment: idx === headerLabels.length - 1 ? 'right' : (idx === 1 ? 'left' : 'center'),
        })),
        ...rows,
        ...fillerRows,
      ],
    },
    layout: {
      hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0),
      vLineWidth: () => 0,
      hLineColor: () => LINE_COLOR,
      paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 4, paddingBottom: () => 4,
    },
    margin: [0, 0, 0, 8],
  };
};

// ---- Minimal: totals + footer ----
const buildMinimalTotalsFooter = ({ companyName, companyBank, totalAmount, invoiceDiscount = 0, gst, gstType, grandTotal, termsAndConditions, userSignature }) => {
  const LINE_COLOR = MINIMAL_COLORS.line;
  const DARK = MINIMAL_COLORS.dark;
  const GRAY = MINIMAL_COLORS.gray;
  const isIGST = gstType === 'interState';
  const taxable = Math.max(Number(totalAmount || 0) - Number(invoiceDiscount || 0), 0);
  const taxAmount = taxable * (gst / 100);
  const igstAmount = taxable * ((gst * 2) / 100);

  const discountLine = invoiceDiscount > 0
    ? [{ columns: [{ text: 'Discount', fontSize: 9, color: GRAY }, { text: `- ${formatCurrency(invoiceDiscount)}`, fontSize: 9, alignment: 'right', color: DARK }], margin: [0, 2, 0, 0] }]
    : [];

  const taxLines = isIGST
    ? [{ columns: [{ text: `IGST (${gst * 2}%)`, fontSize: 9, color: GRAY }, { text: formatCurrency(igstAmount), fontSize: 9, alignment: 'right', color: DARK }], margin: [0, 2, 0, 0] }]
    : [
        { columns: [{ text: `CGST (${gst}%)`, fontSize: 9, color: GRAY }, { text: formatCurrency(taxAmount), fontSize: 9, alignment: 'right', color: DARK }], margin: [0, 2, 0, 0] },
        { columns: [{ text: `SGST (${gst}%)`, fontSize: 9, color: GRAY }, { text: formatCurrency(taxAmount), fontSize: 9, alignment: 'right', color: DARK }], margin: [0, 2, 0, 0] },
      ];

  return [
    {
      columns: [
        { width: '*', text: '' },
        {
          width: '45%',
          stack: [
            { columns: [{ text: 'Subtotal', fontSize: 9, color: GRAY }, { text: formatCurrency(totalAmount), fontSize: 9, alignment: 'right', color: DARK }] },
            ...discountLine,
            ...taxLines,
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 220, y2: 0, lineWidth: 0.5, lineColor: LINE_COLOR }], margin: [0, 4, 0, 4] },
            { columns: [{ text: 'Grand Total', fontSize: 11, bold: true, color: DARK }, { text: formatCurrency(grandTotal), fontSize: 11, bold: true, alignment: 'right', color: DARK }] },
            { text: `(${convertToWords(grandTotal)})`, fontSize: 8, italic: true, color: GRAY, margin: [0, 2, 0, 0] },
          ],
        },
      ],
      margin: [0, 0, 0, 16],
    },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LINE_COLOR }], margin: [0, 0, 0, 10] },
    {
      columns: [
        {
          width: '55%',
          stack: [
            { text: 'Bank Details', fontSize: 9, bold: true, color: DARK, margin: [0, 0, 0, 3] },
            { text: `${getBankName(companyBank)}  |  A/C: ${companyBank?.accountNumber || ''}`, fontSize: 8.5, color: GRAY },
            { text: `IFSC: ${getBankIfsc(companyBank)}`, fontSize: 8.5, color: GRAY, margin: [0, 1, 0, 0] },
          ],
        },
        {
          width: '45%',
          stack: [
            { text: `For ${companyName || ''}`, fontSize: 9, bold: true, color: DARK, alignment: 'right', margin: [0, 0, 0, 8] },
            { image: getSignatureImage(userSignature), fit: [120, 40], alignment: 'right' },
            { text: 'Authorized Signatory', fontSize: 8.5, color: GRAY, alignment: 'right', margin: [0, 2, 0, 0] },
          ],
        },
      ],
      margin: [0, 0, 0, 8],
    },
    ...(termsAndConditions
      ? [
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LINE_COLOR }], margin: [0, 4, 0, 6] },
          { text: 'Terms & Conditions', fontSize: 9, bold: true, color: GRAY, margin: [0, 0, 0, 4] },
          { stack: formatTextAsBulletPoints(termsAndConditions) },
        ]
      : []),
    { text: 'This document is computer generated and does not require signature.', fontSize: 8.5, italic: true, alignment: 'center', color: '#9ca3af', margin: [0, 8, 0, 0] },
  ];
};

/* =====================================================
   END SHARED TEMPLATE HELPERS
   ===================================================== */

const buildInvoiceDocDefinition = (data, options = {}) => {
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
    invoiceDiscount = 0,
    termsAndConditions,
    gst,
    gstType = 'intraState',
    grandTotal = 0,
    companyBank,
    invoicefor = 'Original Copy',
    userSignature,
    companyLogo,
    template = 'classic',
  } = data;
  const { download = true, fileName } = options;

  const shipToData = shipTo || customer;
  const hasDiscount = products.some(p => Number(p.discount) > 0);
  const rows = getInvoiceRows(products, hasDiscount);
  const chunks = getInvoiceRowChunks(rows);

  const COL_WIDTHS = hasDiscount
    ? ['6%', '43%', '9%', '6%', '6%', '9%', '9%', '12%']
    : ['6%', '50%', '10%', '6%', '6%', '10%', '12%'];
  const COL_LABELS = hasDiscount
    ? ['SR.', 'PARTICULARS', 'HSN', 'QTY', 'UOM', 'RATE', 'DISC%', 'AMOUNT']
    : ['SR.', 'PARTICULARS', 'HSN', 'QTY', 'UOM', 'RATE', 'AMOUNT'];

  let content;

  if (template === 'modern') {
    // --- MODERN INVOICE ---
    const headerSections = buildModernHeader({ companyName, companyAddress, companyGST, companyPhone, companyLogo, docType: `TAX INVOICE â€” ${invoicefor}` });
    const metaCard = buildModernMetaCard([
      ['Invoice No', `${companyName?.split(' ').map(w => w[0].toUpperCase()).join('')}/${billNo || ''}`],
      ['Date', formatDate(date)],
      ['Challan No', challanNo || '-'],
      ['Challan Date', formatDate(challanDate)],
    ]);
    const orderCard = buildModernMetaCard([
      ['Order No', orderNo || '-'],
      ['Order Date', formatDate(orderDate)],
    ]);
    const partySection = buildModernPartySection({ leftLabel: 'BILL TO', leftParty: customer, rightLabel: 'SHIP TO', rightParty: shipToData });
    const modernRows = rows.map((row, i) => row.map(cell => ({ ...cell, fillColor: i % 2 === 1 ? MODERN_COLORS.rowAlt : null })));
    const productsTable = {
      table: {
        headerRows: 1, widths: COL_WIDTHS,
        body: [
          COL_LABELS.map((label, idx) => ({ text: label, bold: true, fontSize: 9, color: MODERN_COLORS.white, fillColor: MODERN_COLORS.blue, alignment: idx === COL_LABELS.length - 1 ? 'right' : 'center' })),
          ...modernRows,
        ],
      },
      layout: { hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0.3), vLineWidth: () => 0, hLineColor: () => MODERN_COLORS.border, paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3 },
      margin: [0, 0, 0, 8],
    };
    const footerSections = buildModernTotalsFooter({ companyName, companyBank, totalAmount, invoiceDiscount, gst, gstType, grandTotal, termsAndConditions, userSignature });

    content = [
      ...headerSections,
      { columns: [{ width: '55%', ...metaCard }, { width: '5%', text: '' }, { width: '40%', ...orderCard }], margin: [0, 0, 0, 8] },
      partySection,
      productsTable,
      ...footerSections,
    ];

  } else if (template === 'minimal') {
    // --- MINIMAL INVOICE ---
    const headerSections = buildMinimalHeader({
      companyName, companyAddress, companyGST, companyPhone, companyLogo,
      docType: 'TAX INVOICE',
      docMeta: [
        ['No', `${companyName?.split(' ').map(w => w[0].toUpperCase()).join('')}/${billNo || ''}`],
        ['Date', formatDate(date)],
        ['Challan No', challanNo || '-'],
        ['Order No', orderNo || '-'],
      ],
    });
    const partyBlocks = [
      ...buildMinimalParty({ label: 'BILL TO', party: customer }),
      ...buildMinimalParty({ label: 'SHIP TO', party: shipToData }),
    ];
    const productsTable = buildMinimalProductsTable(rows, COL_WIDTHS, COL_LABELS);
    const footerSections = buildMinimalTotalsFooter({ companyName, companyBank, totalAmount, invoiceDiscount, gst, gstType, grandTotal, termsAndConditions, userSignature });

    content = [
      ...headerSections,
      ...partyBlocks,
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: MINIMAL_COLORS.line }], margin: [0, 4, 0, 8] },
      productsTable,
      ...footerSections,
    ];

  } else {
    // --- CLASSIC INVOICE (original multi-page logic) ---
    content = chunks.flatMap((chunk, pageIndex) => {
      const pageContent = [
        ...buildInvoiceHeaderSection({ companyName, companyAddress, companyGST, companyPhone, billNo, date, challanNo, challanDate, invoicefor, pageIndex }),
        buildInvoicePartySection({ customer, shipToData }),
        buildInvoiceMetaSection({ orderNo, orderDate, disDocNo, deliveryDate, dispatchedThrough, destination }),
        buildInvoiceProductsSection(chunk.rows, chunk.fillerRowCount, hasDiscount),
      ];

      if (pageIndex === chunks.length - 1) {
        pageContent.push(...buildInvoiceFooterSections({ companyName, companyBank, totalAmount, invoiceDiscount, gst, gstType, grandTotal, termsAndConditions, userSignature }));
      } else {
        pageContent.push({ text: '', pageBreak: 'after' });
      }
      return pageContent;
    });
  }

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 25],
    defaultStyle: { font: 'Roboto', fontSize: 10.5, color: COLORS.text, lineHeight: 1 },
    content,
  };

  if (download) {
    pdfMake.createPdf(docDefinition).download(
      fileName || `Invoice-${companyName?.split(' ').map(w => w[0].toUpperCase()).join('')}-${billNo || ''}.pdf`,
    );
  }

  return docDefinition;
};

export const generateInvoicePDF = (data) => buildInvoiceDocDefinition(data);


export const generateMonthlyInvoicesPDF = ({
  invoices = [],
  invoicefor = 'Original Copy',
  monthLabel = '',
  financialYearLabel = '',
  companyName = '',
  companyAddress = '',
  companyGST = '',
  companyPhone = '',
  companyBank = {},
  userSignature,
}) => {
  if (!invoices.length) {
    return;
  }

  const companyCode = companyName
    ?.split(' ')
    .map((word) => word[0]?.toUpperCase())
    .join('');

  const combinedContent = invoices.flatMap((invoice, index) => {
    const invoiceDoc = buildInvoiceDocDefinition(
      {
        companyName,
        companyAddress,
        companyGST,
        companyPhone,
        companyBank,
        billNo: invoice.billNo,
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
        products: invoice.products,
        totalAmount: invoice.totalAmount,
        termsAndConditions: invoice.termsAndConditions,
        gst: invoice.gst,
        grandTotal: invoice.grandTotal,
        invoicefor,
        userSignature,
      },
      { download: false },
    );

    const content = [...invoiceDoc.content];
    if (index < invoices.length - 1) {
      content.push({ text: '', pageBreak: 'after' });
    }
    return content;
  });

  pdfMake
    .createPdf({
      pageSize: 'A4',
      pageMargins: [20, 20, 20, 25],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10.5,
        color: COLORS.text,
        lineHeight: 1,
      },
      content: combinedContent,
    })
    .download(
      `Invoices-${companyCode || 'COMPANY'}-${financialYearLabel || 'FY'}-${
        monthLabel || 'Month'
      }-${invoicefor === 'Duplicate Copy' ? 'Duplicate' : 'Original'}.pdf`,
    );
};

export const generateStatementPDF = ({
  companyName = '',
  companyAddress = '',
  companyGST = '',
  companyPhone = '',
  companyBank = {},
  userSignature,
  title = 'ACCOUNT STATEMENT',
  partyLabel = 'Party',
  partyName = '',
  partyAddress = '',
  gstNo = '',
  fromDate = '',
  toDate = '',
  entries = [],
  debitLabel = 'Debit',
  creditLabel = 'Credit',
  closingBalance = 0,
  filePrefix = 'Statement',
}) => {
  const debitTotal = entries.reduce(
    (sum, entry) =>
      sum +
      Number(entry.invoiceAmount ?? entry.purchaseAmount ?? 0),
    0
  );
  const creditTotal = entries.reduce(
    (sum, entry) => sum + Number(entry.paymentAmount ?? 0),
    0
  );

  const tableBody = [
    [
      { text: 'Date', ...FONT.label, alignment: 'center' },
      { text: 'Description', ...FONT.label, alignment: 'center' },
      { text: debitLabel, ...FONT.label, alignment: 'right' },
      { text: creditLabel, ...FONT.label, alignment: 'right' },
      { text: 'Running Balance', ...FONT.label, alignment: 'right' },
    ],
    ...entries.map((entry) => ({
      date: formatDate(entry.date),
      description: entry.detail || entry.type || '-',
      debit: Number(entry.invoiceAmount ?? entry.purchaseAmount ?? 0),
      credit: Number(entry.paymentAmount ?? 0),
      balance: Number(entry.balance || 0),
    })).map((entry) => ([
      { text: entry.date, ...FONT.small },
      { text: entry.description, ...FONT.small },
      {
        text: entry.debit ? formatCurrency(entry.debit) : '-',
        ...FONT.small,
        alignment: 'right',
      },
      {
        text: entry.credit ? formatCurrency(entry.credit) : '-',
        ...FONT.small,
        alignment: 'right',
      },
      {
        text: formatCurrency(entry.balance),
        ...FONT.small,
        alignment: 'right',
      },
    ])),
    [
      { text: 'Total', ...FONT.label, colSpan: 2 },
      {},
      { text: formatCurrency(debitTotal), ...FONT.label, alignment: 'right' },
      { text: formatCurrency(creditTotal), ...FONT.label, alignment: 'right' },
      {
        text: formatCurrency(closingBalance),
        ...FONT.label,
        alignment: 'right',
      },
    ],
  ];

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 25],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10.5,
      color: COLORS.text,
      lineHeight: 1,
    },
    content: [
      {
        columns: [
          {
            width: '65%',
            stack: [
              { text: companyName || '', fontSize: 16, bold: true, color: COLORS.text },
              { text: companyAddress || '', ...FONT.small, margin: [0, 3, 0, 0] },
              {
                text: `GSTIN: ${companyGST || '-'}  |  Ph: ${companyPhone || ''}`,
                ...FONT.small,
                margin: [0, 1, 0, 0],
              },
            ],
          },
          {
            width: '35%',
            text: title,
            ...FONT.title,
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          widths: ['60%', '40%'],
          body: [
            [
              {
                stack: [
                  { text: partyLabel, ...FONT.label, margin: [0, 0, 0, 3] },
                  { text: partyName || '-', fontSize: 11, bold: true, color: COLORS.text },
                  { text: partyAddress || '-', ...FONT.small, margin: [0, 2, 0, 0] },
                  { text: `GSTIN: ${gstNo || 'NA'}`, ...FONT.small, margin: [0, 2, 0, 0] },
                ],
                margin: [4, 4, 4, 4],
              },
              {
                stack: [
                  { text: 'Statement Period', ...FONT.label, margin: [0, 0, 0, 3] },
                  {
                    text: `${formatDate(fromDate) || '-'} to ${formatDate(toDate) || '-'}`,
                    ...FONT.small,
                  },
                ],
                margin: [4, 4, 4, 4],
              },
            ],
          ],
        },
        layout: simpleBorderLayout,
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['14%', '38%', '16%', '16%', '16%'],
          body: tableBody,
        },
        layout: invoiceTableLayout,
        margin: [0, 0, 0, 12],
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
                    text: `Bank Name: ${getBankName(companyBank)}`,
                    ...FONT.small,
                    margin: [0, 1, 0, 0],
                  },
                  {
                    text: `A/C No: ${companyBank?.accountNumber || ''}`,
                    ...FONT.small,
                    margin: [0, 1, 0, 0],
                  },
                  {
                    text: `IFSC: ${getBankIfsc(companyBank)}`,
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
                    margin: [0, 0, 0, 4],
                  },
                  {
                    image: getSignatureImage(userSignature),
                    fit: [120, 40],
                    alignment: 'right',
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
        layout: simpleBorderLayout,
      },
    ],
  };

  pdfMake.createPdf(docDefinition).download(
    `${filePrefix}-${partyName || 'Account'}-${fromDate || 'From'}-${toDate || 'To'}.pdf`
  );
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
    products = [],
    totalAmount,
    gst,
    gstType = 'intraState',
    grandTotal = 0,
    companyBank,
    termsAndConditions,
    technicalSpecifications,
    userSignature,
    companyLogo,
    template = 'classic',
  } = data;

  const invoiceDiscount = Number(data.invoiceDiscount || 0);
  const hasDiscount = products.some(p => Number(p.discount) > 0);
  const isIGST = gstType === 'interState';
  const taxable = Math.max(Number(totalAmount || 0) - invoiceDiscount, 0);
  const igstRate = gst * 2;
  const igstAmount = taxable * (igstRate / 100);
  const cgstSgstAmount = taxable * (gst / 100);

  const rows = products.map((p, i) => {
    const qty = Number(p.quantity || 0);
    const rate = Number(p.rate || 0);
    const disc = Number(p.discount || 0);
    const amount = qty * rate * (1 - disc / 100);
    const row = [
      { text: String(i + 1), ...FONT.small, alignment: 'center' },
      formatProductName(p.name),
      { text: p.hsn || '', ...FONT.small, alignment: 'center' },
      { text: String(qty), ...FONT.small, alignment: 'center' },
      { text: p.uom || '', ...FONT.small, alignment: 'center' },
      { text: formatCurrency(rate), ...FONT.small, alignment: 'center' },
    ];
    if (hasDiscount) row.push({ text: disc > 0 ? `${disc}%` : '-', ...FONT.small, alignment: 'center' });
    row.push({ text: formatCurrency(amount), ...FONT.small, alignment: 'center' });
    return row;
  });

  const numCols = hasDiscount ? 8 : 7;
  const fillerRows = rows.length < MIN_ROWS
    ? Array.from({ length: MIN_ROWS - rows.length }).map(() => Array(numCols).fill({ text: ' ', ...FONT.small }))
    : [];

  const COL_WIDTHS = hasDiscount
    ? ['6%', '43%', '9%', '6%', '6%', '9%', '9%', '12%']
    : ['6%', '50%', '10%', '6%', '6%', '10%', '12%'];
  const COL_LABELS = hasDiscount
    ? ['SR.', 'PARTICULARS', 'HSN', 'QTY', 'UOM', 'RATE', 'DISC%', 'AMOUNT']
    : ['SR.', 'PARTICULARS', 'HSN', 'QTY', 'UOM', 'RATE', 'AMOUNT'];

  // Extra sections (tech specs + T&C) â€” same across all templates
  const extraSections = [
    ...(technicalSpecifications
      ? [{
          stack: [
            { text: 'TECHNICAL SPECIFICATIONS', bold: true, fontSize: 10, margin: [0, 8, 0, 4] },
            { table: { widths: ['100%'], body: [[{ ul: formatTextAsBulletPoints(technicalSpecifications), margin: [4, 4, 4, 4] }]] }, layout: simpleBorderLayout },
          ], margin: [0, 4, 0, 0],
        }]
      : []),
  ];

  let content;

  if (template === 'modern') {
    const partyCard = buildModernMetaCard([
      ['To', customer?.name || '-'],
      ['Address', customer?.address || '-'],
      ['GSTIN', customer?.gstNo || 'NA'],
    ]);
    content = [
      ...buildModernHeader({ companyName, companyAddress, companyGST, companyPhone, companyLogo, docType: 'QUOTATION' }),
      { columns: [{ width: '55%', ...buildModernMetaCard([['Quotation No', quotationNo || '-'], ['Date', formatDate(date)]]) }, { width: '5%', text: '' }, { width: '40%', ...partyCard }], margin: [0, 0, 0, 8] },
      buildModernProductsTable(rows, COL_WIDTHS, COL_LABELS, Math.max(MIN_ROWS - rows.length, 0)),
      ...buildModernTotalsFooter({ companyName, companyBank, totalAmount, invoiceDiscount, gst, gstType, grandTotal, termsAndConditions, userSignature }),
      ...extraSections,
    ];

  } else if (template === 'minimal') {
    content = [
      ...buildMinimalHeader({ companyName, companyAddress, companyGST, companyPhone, companyLogo, docType: 'QUOTATION', docMeta: [['No', quotationNo || '-'], ['Date', formatDate(date)]] }),
      ...buildMinimalParty({ label: 'TO', party: customer }),
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: MINIMAL_COLORS.line }], margin: [0, 4, 0, 8] },
      buildMinimalProductsTable(rows, COL_WIDTHS, COL_LABELS, Math.max(MIN_ROWS - rows.length, 0)),
      ...buildMinimalTotalsFooter({ companyName, companyBank, totalAmount, invoiceDiscount, gst, gstType, grandTotal, termsAndConditions, userSignature }),
      ...extraSections,
    ];

  } else {
    const discountRows = invoiceDiscount > 0
      ? [[{}, { text: 'Discount', ...FONT.small }, { text: `- ${formatCurrency(invoiceDiscount)}`, ...FONT.small, alignment: 'right' }]]
      : [];
    const quotationTaxRows = isIGST
      ? [[{}, { text: `IGST (${igstRate}%)`, ...FONT.small }, { text: formatCurrency(igstAmount), ...FONT.small, alignment: 'right' }]]
      : [
          [{}, { text: `CGST (${gst}%)`, ...FONT.small }, { text: formatCurrency(cgstSgstAmount), ...FONT.small, alignment: 'right' }],
          [{}, { text: `SGST (${gst}%)`, ...FONT.small }, { text: formatCurrency(cgstSgstAmount), ...FONT.small, alignment: 'right' }],
        ];
    const totalRowCount = discountRows.length + quotationTaxRows.length + 2;

    content = [
      { text: 'QUOTATION', ...FONT.title, alignment: 'center', margin: [0, 0, 0, 4] },
      {
        table: {
          widths: ['60%', '20%', '20%'],
          body: [
            [{ stack: [{ text: companyName, fontSize: 14, bold: true, color: COLORS.text }, { text: companyAddress, ...FONT.small, margin: [0, 2, 0, 0] }, { text: `GSTIN: ${companyGST || '-'}`, ...FONT.small, margin: [0, 2, 0, 0] }, { text: `Mobile No. ${companyPhone || ''}`, ...FONT.small, margin: [0, 2, 0, 0] }], rowSpan: 2 }, { text: 'Quotation No.', ...FONT.label }, { text: quotationNo || '', ...FONT.normal }],
            [{}, { text: 'Date', ...FONT.label }, { text: formatDate(date), ...FONT.normal }],
          ],
        },
        layout: paddedBorderLayout,
        margin: [0, 0, 0, 8],
      },
      {
        columns: [{
          width: '100%',
          table: { widths: ['100%'], body: [[{ stack: [{ text: 'To,', ...FONT.label, margin: [0, 0, 0, 2] }, { text: customer?.name || '-', ...FONT.normal }, { text: customer?.address || '-', ...FONT.small, margin: [0, 2, 0, 0] }, { text: `GSTIN: ${customer?.gstNo || 'NA'}`, ...FONT.small, margin: [0, 2, 0, 0] }], margin: [4, 4, 4, 4] }]] },
          layout: simpleBorderLayout,
        }],
        margin: [0, 4, 0, 6],
      },
      {
        table: {
          headerRows: 1, widths: COL_WIDTHS,
          body: [COL_LABELS.map(label => ({ text: label, ...FONT.label, alignment: 'center' })), ...rows, ...fillerRows],
        },
        layout: invoiceTableLayout, margin: [0, 4, 0, 6],
      },
      {
        table: {
          widths: ['50%', '25%', '25%'],
          body: [
            [{ text: [{ text: 'Rupees in Words:\n', bold: true }, convertToWords(grandTotal)], rowSpan: totalRowCount, ...FONT.small }, { text: 'Subtotal', ...FONT.small }, { text: formatCurrency(totalAmount), ...FONT.small, alignment: 'right' }],
            ...discountRows,
            ...quotationTaxRows,
            [{}, { text: 'Grand Total', ...FONT.label }, { text: formatCurrency(grandTotal), ...FONT.label, alignment: 'right' }],
          ],
        },
        layout: compactBorderLayout, margin: [0, 4, 0, 8],
      },
      {
        table: {
          widths: ['60%', '40%'],
          body: [[
            { stack: [{ text: 'Bank Details', ...FONT.label, margin: [0, 0, 0, 2] }, { text: companyName || '', ...FONT.small }, { text: `Bank Name: ${getBankName(companyBank)}`, ...FONT.small, margin: [0, 1, 0, 0] }, { text: `A/C No: ${companyBank?.accountNumber || ''}`, ...FONT.small, margin: [0, 1, 0, 0] }, { text: `IFSC: ${getBankIfsc(companyBank)}`, ...FONT.small, margin: [0, 1, 0, 0] }], margin: [4, 4, 4, 4] },
            { stack: [{ text: `For ${companyName || ''}`, ...FONT.label, alignment: 'right', margin: [0, 0, 0, 4] }, { image: getSignatureImage(userSignature), fit: [120, 40], alignment: 'right' }, { text: 'Authorized Signatory', ...FONT.small, alignment: 'right' }], margin: [4, 4, 4, 4] },
          ]],
        },
        layout: simpleBorderLayout,
      },
      ...extraSections,
      ...(termsAndConditions
        ? [{ stack: [{ text: 'TERMS & CONDITIONS', ...TERMS_HEADING }, { table: { widths: ['100%'], body: [[{ ul: formatTextAsBulletPoints(termsAndConditions), margin: [4, 4, 4, 4] }]] }, layout: simpleBorderLayout }], margin: [0, 4, 0, 0] }]
        : []),
      { text: 'This document is computer generated and does not require signature.', ...FONT.small, alignment: 'center', margin: [0, 8, 0, 0], italics: true },
    ];
  }

  pdfMake.createPdf({
    pageSize: 'A4', pageMargins: [20, 20, 20, 25],
    defaultStyle: { font: 'Roboto', fontSize: 10.5, color: COLORS.text, lineHeight: 1 },
    content,
  }).download(`Quotation-${companyName?.split(' ').map(w => w[0].toUpperCase()).join('')}-${quotationNo || ''}.pdf`);
};

/* ================= PURCHASE ORDER ================= */

export const generatePurchaseOrderPDF = (data) => {
  const {
    companyName,
    companyAddress,
    companyGST,
    companyPhone,
    seller,
    poNo,
    date,
    products = [],
    gst,
    gstType = 'intraState',
    totalAmount,
    grandTotal,
    companyBank,
    technicalSpecifications,
    termsAndConditions,
    userSignature,
    companyLogo,
    template = 'classic',
  } = data;

  const invoiceDiscount = Number(data.invoiceDiscount || 0);
  const hasDiscount = products.some(p => Number(p.discount) > 0);

  const rows = products.map((p, i) => {
    const qty = Number(p.quantity || 0);
    const rate = Number(p.rate || 0);
    const disc = Number(p.discount || 0);
    const amount = qty * rate * (1 - disc / 100);
    const row = [
      { text: String(i + 1), ...FONT.small, alignment: 'center' },
      formatProductName(p.name),
      { text: p.hsn || '', ...FONT.small, alignment: 'center' },
      { text: String(qty), ...FONT.small, alignment: 'center' },
      { text: p.uom || '', ...FONT.small, alignment: 'center' },
      { text: formatCurrency(rate), ...FONT.small, alignment: 'center' },
    ];
    if (hasDiscount) row.push({ text: disc > 0 ? `${disc}%` : '-', ...FONT.small, alignment: 'center' });
    row.push({ text: formatCurrency(amount), ...FONT.small, alignment: 'center' });
    return row;
  });

  const numCols = hasDiscount ? 8 : 7;
  const fillerCount = Math.max(MIN_ROWS - rows.length, 0);
  const COL_WIDTHS = hasDiscount
    ? ['6%', '43%', '9%', '6%', '6%', '9%', '9%', '12%']
    : ['6%', '50%', '10%', '6%', '6%', '10%', '12%'];
  const COL_LABELS = hasDiscount
    ? ['SR.', 'PARTICULARS', 'HSN', 'QTY', 'UOM', 'RATE', 'DISC%', 'AMOUNT']
    : ['SR.', 'PARTICULARS', 'HSN', 'QTY', 'UOM', 'RATE', 'AMOUNT'];

  const extraSections = [
    ...(technicalSpecifications
      ? [{ stack: [{ text: 'TECHNICAL SPECIFICATIONS', bold: true, fontSize: 10, margin: [0, 8, 0, 4] }, { table: { widths: ['100%'], body: [[{ ul: formatTextAsBulletPoints(technicalSpecifications), margin: [4, 4, 4, 4] }]] }, layout: simpleBorderLayout }], margin: [0, 4, 0, 0] }]
      : []),
  ];

  let content;

  if (template === 'modern') {
    const sellerCard = buildModernMetaCard([
      ['To', seller?.name || '-'],
      ['Address', seller?.address || '-'],
      ['GSTIN', seller?.gstNo || 'NA'],
    ]);
    content = [
      ...buildModernHeader({ companyName, companyAddress, companyGST, companyPhone, companyLogo, docType: 'PURCHASE ORDER' }),
      { columns: [{ width: '55%', ...buildModernMetaCard([['PO No', poNo || '-'], ['Date', formatDate(date)]]) }, { width: '5%', text: '' }, { width: '40%', ...sellerCard }], margin: [0, 0, 0, 8] },
      buildModernProductsTable(rows, COL_WIDTHS, COL_LABELS, fillerCount),
      ...buildModernTotalsFooter({ companyName, companyBank, totalAmount, invoiceDiscount, gst, gstType, grandTotal, termsAndConditions, userSignature }),
      ...extraSections,
    ];

  } else if (template === 'minimal') {
    content = [
      ...buildMinimalHeader({ companyName, companyAddress, companyGST, companyPhone, companyLogo, docType: 'PURCHASE ORDER', docMeta: [['PO No', poNo || '-'], ['Date', formatDate(date)]] }),
      ...buildMinimalParty({ label: 'TO (SELLER)', party: seller }),
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: MINIMAL_COLORS.line }], margin: [0, 4, 0, 8] },
      buildMinimalProductsTable(rows, COL_WIDTHS, COL_LABELS, fillerCount),
      ...buildMinimalTotalsFooter({ companyName, companyBank, totalAmount, invoiceDiscount, gst, gstType, grandTotal, termsAndConditions, userSignature }),
      ...extraSections,
    ];

  } else {
    // Classic
    const taxable = Math.max(Number(totalAmount || 0) - invoiceDiscount, 0);
    const taxLabel = gstType === 'interState' ? `IGST (${gst * 2}%)` : `CGST (${gst}%)`;
    const secondTaxLabel = gstType === 'interState' ? null : `SGST (${gst}%)`;
    const taxAmount = taxable * (gst / 100);
    const totalTaxAmount = gstType === 'interState' ? taxable * ((gst * 2) / 100) : taxAmount;
    const fillerRows = Array.from({ length: fillerCount }).map(() => Array(numCols).fill({ text: ' ', ...FONT.small }));
    const discountRow = invoiceDiscount > 0 ? [[{}, { text: 'Discount', ...FONT.small }, { text: `- ${formatCurrency(invoiceDiscount)}`, ...FONT.small, alignment: 'right' }]] : [];
    const totalRowCount = (discountRow.length) + (secondTaxLabel ? 2 : 1) + 2;

    content = [
      { text: 'PURCHASE ORDER', ...FONT.title, alignment: 'center', margin: [0, 0, 0, 4] },
      {
        table: {
          widths: ['60%', '20%', '20%'],
          body: [
            [{ stack: [{ text: companyName, fontSize: 14, bold: true, color: COLORS.text }, { text: companyAddress, ...FONT.small, margin: [0, 2, 0, 0] }, { text: `GSTIN: ${companyGST || '-'}`, ...FONT.small, margin: [0, 2, 0, 0] }, { text: `Mobile No. ${companyPhone || ''}`, ...FONT.small, margin: [0, 2, 0, 0] }], rowSpan: 2 }, { text: 'PO No.', ...FONT.label }, { text: poNo || '', ...FONT.normal }],
            [{}, { text: 'Date', ...FONT.label }, { text: formatDate(date), ...FONT.normal }],
          ],
        },
        layout: paddedBorderLayout, margin: [0, 0, 0, 8],
      },
      {
        columns: [{ width: '100%', table: { widths: ['100%'], body: [[{ stack: [{ text: 'To,', ...FONT.label, margin: [0, 0, 0, 2] }, { text: seller?.name || '-', ...FONT.normal }, { text: seller?.address || '-', ...FONT.small, margin: [0, 2, 0, 0] }, { text: `GSTIN: ${seller?.gstNo || 'NA'}`, ...FONT.small, margin: [0, 2, 0, 0] }], margin: [4, 4, 4, 4] }]] }, layout: simpleBorderLayout }],
        margin: [0, 4, 0, 6],
      },
      { table: { headerRows: 1, widths: COL_WIDTHS, body: [COL_LABELS.map((lbl) => ({ text: lbl, ...FONT.label, alignment: 'center' })), ...rows, ...fillerRows] }, layout: invoiceTableLayout, margin: [0, 4, 0, 6] },
      {
        table: {
          widths: ['50%', '25%', '25%'],
          body: [
            [{ text: [{ text: 'Rupees in Words:\n', bold: true }, convertToWords(grandTotal)], rowSpan: totalRowCount, ...FONT.small }, { text: 'Subtotal', ...FONT.small }, { text: formatCurrency(totalAmount), ...FONT.small, alignment: 'right' }],
            ...discountRow,
            [{}, { text: taxLabel, ...FONT.small }, { text: formatCurrency(totalTaxAmount), ...FONT.small, alignment: 'right' }],
            ...(secondTaxLabel ? [[{}, { text: secondTaxLabel, ...FONT.small }, { text: formatCurrency(taxAmount), ...FONT.small, alignment: 'right' }]] : []),
            [{}, { text: 'Grand Total', ...FONT.label }, { text: formatCurrency(grandTotal), ...FONT.label, alignment: 'right' }],
          ],
        },
        layout: compactBorderLayout, margin: [0, 4, 0, 8],
      },
      {
        table: {
          widths: ['60%', '40%'],
          body: [[
            { stack: [{ text: 'Bank Details', ...FONT.label, margin: [0, 0, 0, 2] }, { text: companyName || '', ...FONT.small }, { text: `Bank Name: ${getBankName(companyBank)}`, ...FONT.small, margin: [0, 1, 0, 0] }, { text: `A/C No: ${companyBank?.accountNumber || ''}`, ...FONT.small, margin: [0, 1, 0, 0] }, { text: `IFSC: ${getBankIfsc(companyBank)}`, ...FONT.small, margin: [0, 1, 0, 0] }], margin: [4, 4, 4, 4] },
            { stack: [{ text: `For ${companyName || ''}`, ...FONT.label, alignment: 'right', margin: [0, 0, 0, 4] }, { image: getSignatureImage(userSignature), fit: [120, 40], alignment: 'right' }, { text: 'Authorized Signatory', ...FONT.small, alignment: 'right' }], margin: [4, 4, 4, 4] },
          ]],
        },
        layout: simpleBorderLayout,
      },
      ...extraSections,
      ...(termsAndConditions ? [{ stack: [{ text: 'TERMS & CONDITIONS', ...TERMS_HEADING }, { table: { widths: ['100%'], body: [[{ ul: formatTextAsBulletPoints(termsAndConditions), margin: [4, 4, 4, 4] }]] }, layout: simpleBorderLayout }], margin: [0, 4, 0, 0] }] : []),
      { text: 'This document is computer generated and does not require signature.', ...FONT.small, alignment: 'center', margin: [0, 8, 0, 0], italics: true },
    ];
  }

  pdfMake.createPdf({
    pageSize: 'A4', pageMargins: [20, 20, 20, 25],
    defaultStyle: { font: 'Roboto', fontSize: 10.5, color: COLORS.text, lineHeight: 1 },
    content,
  }).download(`Purchase-Order-${companyName?.split(' ').map(w => w[0].toUpperCase()).join('')}-${poNo || ''}.pdf`);
};

/* ================= CHALLAN ================= */

export const generateChallanPDF = (data, shipTo) => {
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
    products = [],
    userSignature,
    companyLogo,
    template = 'classic',
  } = data;

  const shipToData = shipTo || customer;

  // Challan rows have 5 columns (no rate/amount)
  const rows = products.map((p, i) => {
    const qty = Number(p.quantity || 0);
    return [
      { text: String(i + 1), ...FONT.small, alignment: 'center' },
      formatProductName(p.name),
      { text: p.hsn || '', ...FONT.small, alignment: 'center' },
      { text: String(qty), ...FONT.small, alignment: 'center' },
      { text: p.uom || '', ...FONT.small, alignment: 'center' },
    ];
  });

  const fillerCount = Math.max(MIN_ROWS - rows.length, 0);
  const COL_WIDTHS = ['8%', '54%', '12%', '13%', '13%'];
  const COL_LABELS = ['SR.', 'PARTICULARS', 'HSN', 'QTY', 'UOM'];

  // Footer signature block (same across all templates for Challan)
  const signatureBlock = {
    columns: [
      {
        width: '50%',
        stack: [
          { text: 'Receiver Signature', ...FONT.small, margin: [0, 0, 0, 20] },
          { text: '___________________________', ...FONT.small },
        ],
      },
      {
        width: '50%',
        stack: [
          { text: `For ${companyName || ''}`, ...FONT.label, alignment: 'right', margin: [0, 0, 0, 20] },
          { text: 'Authorized Signatory', ...FONT.small, alignment: 'right', margin: [0, 0, 0, 10] },
          { image: getSignatureImage(userSignature), fit: [120, 40], alignment: 'right' },
          { text: '___________________________', ...FONT.small, alignment: 'right' },
        ],
      },
    ],
    margin: [0, 8, 0, 4],
  };

  const computerGenerated = { text: 'This document is computer generated and does not require signature.', ...FONT.small, alignment: 'center', margin: [0, 8, 0, 0], italics: true };

  let content;

  if (template === 'modern') {
    content = [
      ...buildModernHeader({ companyName, companyAddress, companyGST, companyPhone, companyLogo, docType: 'DELIVERY CHALLAN' }),
      {
        columns: [
          { width: '55%', ...buildModernMetaCard([['Challan No', challanNo || '-'], ['Date', formatDate(date)], ['Order No', orderNo || '-'], ['Order Date', formatDate(orderDate)]]) },
          { width: '5%', text: '' },
          { width: '40%', ...buildModernMetaCard([['Bill To', customer?.name || '-'], ['GSTIN', customer?.gstNo || 'NA']]) },
        ],
        margin: [0, 0, 0, 8],
      },
      buildModernPartySection({ leftLabel: 'BILL TO', leftParty: customer, rightLabel: 'SHIP TO', rightParty: shipToData }),
      buildModernProductsTable(rows, COL_WIDTHS, COL_LABELS, fillerCount),
      signatureBlock,
      computerGenerated,
    ];

  } else if (template === 'minimal') {
    content = [
      ...buildMinimalHeader({
        companyName, companyAddress, companyGST, companyPhone, companyLogo,
        docType: 'DELIVERY CHALLAN',
        docMeta: [['Challan No', challanNo || '-'], ['Date', formatDate(date)], ['Order No', orderNo || '-']],
      }),
      ...buildMinimalParty({ label: 'BILL TO', party: customer }),
      ...buildMinimalParty({ label: 'SHIP TO', party: shipToData }),
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: MINIMAL_COLORS.line }], margin: [0, 4, 0, 8] },
      buildMinimalProductsTable(rows, COL_WIDTHS, COL_LABELS, fillerCount),
      signatureBlock,
      computerGenerated,
    ];

  } else {
    // Classic
    const fillerRows = Array.from({ length: fillerCount }).map(() => COL_WIDTHS.map(() => ({ text: ' ', ...FONT.small })));
    content = [
      { text: 'DELIVERY CHALLAN', ...FONT.title, alignment: 'center', margin: [0, 0, 0, 4] },
      {
        table: {
          widths: ['60%', '20%', '20%'],
          body: [
            [{ stack: [{ text: companyName, fontSize: 14, bold: true, color: COLORS.text }, { text: companyAddress, ...FONT.small, margin: [0, 2, 0, 0] }, { text: `GSTIN: ${companyGST || '-'}`, ...FONT.small, margin: [0, 2, 0, 0] }, { text: `Mobile No. ${companyPhone || ''}`, ...FONT.small, margin: [0, 2, 0, 0] }], rowSpan: 4 }, { text: 'Challan No.', ...FONT.label }, { text: challanNo || '', ...FONT.normal }],
            [{}, { text: 'Date', ...FONT.label }, { text: formatDate(date), ...FONT.normal }],
            [{}, { text: 'Order No.', ...FONT.label }, { text: orderNo || '', ...FONT.normal }],
            [{}, { text: 'Order Date', ...FONT.label }, { text: formatDate(orderDate), ...FONT.normal }],
          ],
        },
        layout: paddedBorderLayout, margin: [0, 0, 0, 8],
      },
      {
        columns: [
          { width: '50%', table: { widths: ['100%'], body: [[{ stack: [{ text: 'BUYER (BILL TO)', ...FONT.label, margin: [0, 0, 0, 2] }, { text: customer?.name || '-', ...FONT.normal }, { text: customer?.address || '-', ...FONT.small, margin: [0, 2, 0, 0] }, { text: `GSTIN: ${customer?.gstNo || 'NA'}`, ...FONT.small, margin: [0, 2, 0, 0] }], margin: [4, 4, 4, 4] }]] }, layout: simpleBorderLayout },
          { width: '50%', table: { widths: ['100%'], body: [[{ stack: [{ text: 'CONSIGNEE (SHIP TO)', ...FONT.label, margin: [0, 0, 0, 2] }, { text: shipToData?.name || '-', ...FONT.normal }, { text: shipToData?.address || '-', ...FONT.small, margin: [0, 2, 0, 0] }, { text: `GSTIN: ${shipToData?.gstNo || 'NA'}`, ...FONT.small, margin: [0, 2, 0, 0] }], margin: [4, 4, 4, 4] }]] }, layout: simpleBorderLayout },
        ],
        margin: [0, 4, 0, 6],
      },
      { table: { headerRows: 1, widths: COL_WIDTHS, body: [COL_LABELS.map(l => ({ text: l, ...FONT.label, alignment: 'center' })), ...rows, ...fillerRows] }, layout: invoiceTableLayout, margin: [0, 4, 0, 6] },
      signatureBlock,
      computerGenerated,
    ];
  }

  pdfMake.createPdf({
    pageSize: 'A4', pageMargins: [20, 20, 20, 25],
    defaultStyle: { font: 'Roboto', fontSize: 10.5, color: COLORS.text, lineHeight: 1 },
    content,
  }).download(`Challan-${companyName?.split(' ').map(w => w[0].toUpperCase()).join('')}-${challanNo || ''}.pdf`);
};

/* ================= PROFORMA INVOICE ================= */

export const generateProformaInvoicePDF = (data) => {
  const {
    companyName,
    companyAddress,
    companyGST,
    companyPhone,
    customer,
    shipTo,
    billNo,
    date,
    validUntil,
    products = [],
    gst,
    gstType = 'intraState',
    totalAmount,
    grandTotal,
    companyBank,
    challanNo,
    challanDate, // eslint-disable-line no-unused-vars
    orderNo,
    orderDate,
    termsAndConditions,
    userSignature,
    companyLogo,
    template = 'classic',
  } = data;

  const invoiceDiscount = Number(data.invoiceDiscount || 0);
  const hasDiscount = products.some(p => Number(p.discount) > 0);

  const rows = products.map((p, i) => {
    const qty = Number(p.quantity || 0);
    const rate = Number(p.rate || 0);
    const disc = Number(p.discount || 0);
    const amount = qty * rate * (1 - disc / 100);
    const row = [
      { text: String(i + 1), ...FONT.small, alignment: 'center' },
      formatProductName(p.name),
      { text: p.hsn || '', ...FONT.small, alignment: 'center' },
      { text: String(qty), ...FONT.small, alignment: 'center' },
      { text: p.uom || 'NOS', ...FONT.small, alignment: 'center' },
      { text: formatCurrency(rate), ...FONT.small, alignment: 'right' },
    ];
    if (hasDiscount) row.push({ text: disc > 0 ? `${disc}%` : '-', ...FONT.small, alignment: 'center' });
    row.push({ text: formatCurrency(amount), ...FONT.small, alignment: 'right' });
    return row;
  });

  const taxable = Math.max(Number(totalAmount || 0) - invoiceDiscount, 0);
  const taxLabel = gstType === 'interState' ? `IGST (${gst * 2}%)` : `CGST (${gst}%)`;
  const secondTaxLabel = gstType === 'interState' ? null : `SGST (${gst}%)`;
  const taxAmount = taxable * (gst / 100);
  const totalTaxAmount = gstType === 'interState' ? taxable * ((gst * 2) / 100) : taxAmount;

  const shipToData = shipTo || customer;

  // ---- Logo node helper ----
  const logoNode = companyLogo?.dataUrl
    ? { image: companyLogo.dataUrl, fit: [80, 40] }
    : null;

  // ============================
  // TEMPLATE: CLASSIC
  // ============================
  const buildClassicContent = () => {
    const fillerRows =
      rows.length < MIN_ROWS
        ? Array.from({ length: MIN_ROWS - rows.length }).map(() =>
            Array(hasDiscount ? 8 : 7).fill({ text: ' ', ...FONT.small })
          )
        : [];

    return [
      { text: 'PROFORMA INVOICE', ...FONT.title, alignment: 'center', margin: [0, 0, 0, 4] },
      {
        table: {
          widths: ['60%', '20%', '20%'],
          body: [
            [
              {
                stack: [
                  ...(logoNode ? [{ ...logoNode, margin: [0, 0, 0, 4] }] : []),
                  { text: companyName, fontSize: 14, bold: true, color: COLORS.text },
                  { text: companyAddress, ...FONT.small, margin: [0, 2, 0, 0] },
                  { text: `GSTIN: ${companyGST || '-'}`, ...FONT.small, margin: [0, 2, 0, 0] },
                  { text: `Mobile No. ${companyPhone || ''}`, ...FONT.small, margin: [0, 2, 0, 0] },
                ],
                rowSpan: 4,
              },
              { text: 'Proforma No.', ...FONT.label },
              { text: billNo || '', ...FONT.normal },
            ],
            [{}, { text: 'Date', ...FONT.label }, { text: formatDate(date), ...FONT.normal }],
            [
              {},
              { text: 'Valid Until', ...FONT.label },
              { text: validUntil ? formatDate(validUntil) : '-', ...FONT.normal },
            ],
            [
              {},
              { text: 'Order No.', ...FONT.label },
              { text: orderNo || '-', ...FONT.normal },
            ],
          ],
        },
        layout: paddedBorderLayout,
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
                      { text: 'BUYER (BILL TO)', ...FONT.label, margin: [0, 0, 0, 2] },
                      { text: customer?.name || '-', ...FONT.normal },
                      { text: customer?.address || '-', ...FONT.small, margin: [0, 2, 0, 0] },
                      { text: `GSTIN: ${customer?.gstNo || 'NA'}`, ...FONT.small, margin: [0, 2, 0, 0] },
                    ],
                    margin: [4, 4, 4, 4],
                  },
                ],
              ],
            },
            layout: simpleBorderLayout,
          },
          {
            width: '50%',
            table: {
              widths: ['100%'],
              body: [
                [
                  {
                    stack: [
                      { text: 'CONSIGNEE (SHIP TO)', ...FONT.label, margin: [0, 0, 0, 2] },
                      { text: shipToData?.name || '-', ...FONT.normal },
                      { text: shipToData?.address || '-', ...FONT.small, margin: [0, 2, 0, 0] },
                      { text: `GSTIN: ${shipToData?.gstNo || 'NA'}`, ...FONT.small, margin: [0, 2, 0, 0] },
                    ],
                    margin: [4, 4, 4, 4],
                  },
                ],
              ],
            },
            layout: simpleBorderLayout,
          },
        ],
        margin: [0, 4, 0, 6],
      },
      {
        table: {
          headerRows: 1,
          widths: hasDiscount
            ? ['6%', '41%', '9%', '6%', '8%', '9%', '9%', '12%']
            : ['6%', '48%', '10%', '6%', '8%', '10%', '12%'],
          body: [
            [
              { text: 'Sr.No', ...FONT.label, alignment: 'center' },
              { text: 'Particulars', ...FONT.label, alignment: 'center' },
              { text: 'HSN', ...FONT.label, alignment: 'center' },
              { text: 'Qty', ...FONT.label, alignment: 'center' },
              { text: 'UOM', ...FONT.label, alignment: 'center' },
              { text: 'Rate', ...FONT.label, alignment: 'center' },
              ...(hasDiscount ? [{ text: 'Disc%', ...FONT.label, alignment: 'center' }] : []),
              { text: 'Amount', ...FONT.label, alignment: 'center' },
            ],
            ...rows,
            ...fillerRows,
          ],
        },
        layout: invoiceTableLayout,
        margin: [0, 4, 0, 6],
      },
      {
        table: {
          widths: ['50%', '25%', '25%'],
          body: (() => {
            const discRow = invoiceDiscount > 0 ? [[{}, { text: 'Discount', ...FONT.small }, { text: `- ${formatCurrency(invoiceDiscount)}`, ...FONT.small, alignment: 'right' }]] : [];
            const span = discRow.length + (secondTaxLabel ? 2 : 1) + 2;
            return [
              [{ text: [{ text: 'Rupees in Words:\n', bold: true }, convertToWords(grandTotal)], rowSpan: span, ...FONT.small },
               { text: 'Subtotal', ...FONT.small }, { text: formatCurrency(totalAmount), ...FONT.small, alignment: 'right' }],
              ...discRow,
              [{}, { text: taxLabel, ...FONT.small }, { text: formatCurrency(totalTaxAmount), ...FONT.small, alignment: 'right' }],
              ...(secondTaxLabel ? [[{}, { text: secondTaxLabel, ...FONT.small }, { text: formatCurrency(taxAmount), ...FONT.small, alignment: 'right' }]] : []),
              [{}, { text: 'Grand Total', ...FONT.label }, { text: formatCurrency(grandTotal), ...FONT.label, alignment: 'right' }],
            ];
          })(),
        },
        layout: compactBorderLayout,
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
                  { text: `Bank Name: ${getBankName(companyBank)}`, ...FONT.small, margin: [0, 1, 0, 0] },
                  { text: `A/C No: ${companyBank?.accountNumber || ''}`, ...FONT.small, margin: [0, 1, 0, 0] },
                  { text: `IFSC: ${getBankIfsc(companyBank)}`, ...FONT.small, margin: [0, 1, 0, 0] },
                ],
                margin: [4, 4, 4, 4],
              },
              {
                stack: [
                  { text: `For ${companyName || ''}`, ...FONT.label, alignment: 'right', margin: [0, 0, 0, 4] },
                  { image: getSignatureImage(userSignature), fit: [120, 40], alignment: 'right' },
                  { text: 'Authorized Signatory', ...FONT.small, alignment: 'right' },
                ],
                margin: [4, 4, 4, 4],
              },
            ],
          ],
        },
        layout: simpleBorderLayout,
      },
      ...(termsAndConditions
        ? [
            {
              stack: [
                { text: 'TERMS & CONDITIONS', ...TERMS_HEADING },
                {
                  table: { widths: ['100%'], body: [[{ ul: formatTextAsBulletPoints(termsAndConditions), margin: [4, 4, 4, 4] }]] },
                  layout: simpleBorderLayout,
                },
              ],
              margin: [0, 4, 0, 0],
            },
          ]
        : []),
      {
        text: 'This is a Proforma Invoice and not a Tax Invoice.',
        ...FONT.small,
        alignment: 'center',
        margin: [0, 8, 0, 0],
        italics: true,
      },
    ];
  };

  // ============================
  // TEMPLATE: MODERN
  // ============================
  const buildModernContent = () => {
    const MODERN_BLUE = '#1e3a5f';
    const MODERN_ACCENT = '#1a56db';
    const MODERN_LIGHT = '#eff6ff';
    const MODERN_ROW_ALT = '#f9fafb';

    const fillerRows =
      rows.length < MIN_ROWS
        ? Array.from({ length: MIN_ROWS - rows.length }).map((_, i) => [
            { text: ' ', ...FONT.small },
            { text: ' ', ...FONT.small },
            { text: ' ', ...FONT.small },
            { text: ' ', ...FONT.small },
            { text: ' ', ...FONT.small },
            { text: ' ', ...FONT.small },
            { text: ' ', ...FONT.small },
          ])
        : [];

    // Alternating row colors for products
    const modernRows = rows.map((row, i) =>
      row.map((cell) => ({
        ...cell,
        fillColor: i % 2 === 1 ? MODERN_ROW_ALT : null,
      }))
    );
    const modernFillerRows = fillerRows.map((row, i) =>
      row.map((cell) => ({
        ...cell,
        fillColor: (rows.length + i) % 2 === 1 ? MODERN_ROW_ALT : null,
      }))
    );

    return [
      // Full-width dark blue header bar
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                columns: [
                  ...(logoNode
                    ? [{ ...logoNode, width: 80, margin: [0, 4, 12, 4] }]
                    : []),
                  {
                    stack: [
                      { text: companyName || '', fontSize: 18, bold: true, color: '#ffffff' },
                      { text: companyAddress || '', fontSize: 8.5, color: '#cbd5e1', margin: [0, 2, 0, 0] },
                      { text: `GSTIN: ${companyGST || '-'} | Ph: ${companyPhone || ''}`, fontSize: 8.5, color: '#94a3b8', margin: [0, 2, 0, 0] },
                    ],
                  },
                ],
                fillColor: MODERN_BLUE,
                margin: [12, 10, 12, 10],
              },
            ],
          ],
        },
        layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
        margin: [0, 0, 0, 0],
      },
      // Title badge row
      {
        columns: [
          {
            text: 'PROFORMA INVOICE',
            fontSize: 13,
            bold: true,
            color: '#ffffff',
            fillColor: MODERN_ACCENT,
            margin: [8, 5, 8, 5],
          },
          { text: '', width: '*' },
        ],
        margin: [0, 0, 0, 8],
      },
      // Meta cards row
      {
        columns: [
          {
            width: '55%',
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    stack: [
                      { text: `Proforma No: `, bold: true, fontSize: 10, color: MODERN_ACCENT },
                      { text: billNo || '-', fontSize: 11, bold: true, color: MODERN_BLUE, margin: [0, 1, 0, 4] },
                      { text: `Date: ${formatDate(date)}`, fontSize: 9, color: '#374151' },
                      { text: `Valid Until: ${validUntil ? formatDate(validUntil) : '-'}`, fontSize: 9, color: '#374151', margin: [0, 2, 0, 0] },
                      ...(challanNo ? [{ text: `Challan No: ${challanNo}`, fontSize: 9, color: '#374151', margin: [0, 2, 0, 0] }] : []),
                    ],
                    fillColor: MODERN_LIGHT,
                    margin: [8, 8, 8, 8],
                  },
                ],
              ],
            },
            layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#bfdbfe', vLineColor: () => '#bfdbfe' },
          },
          { width: '5%', text: '' },
          {
            width: '40%',
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    stack: [
                      { text: 'Order Details', bold: true, fontSize: 9.5, color: MODERN_ACCENT, margin: [0, 0, 0, 4] },
                      { text: `Order No: ${orderNo || '-'}`, fontSize: 9, color: '#374151' },
                      { text: `Order Date: ${orderDate ? formatDate(orderDate) : '-'}`, fontSize: 9, color: '#374151', margin: [0, 2, 0, 0] },
                    ],
                    fillColor: MODERN_LIGHT,
                    margin: [8, 8, 8, 8],
                  },
                ],
              ],
            },
            layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#bfdbfe', vLineColor: () => '#bfdbfe' },
          },
        ],
        margin: [0, 0, 0, 8],
      },
      // Party cards
      {
        columns: [
          {
            width: '50%',
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    stack: [
                      { text: 'BILL TO', fontSize: 8, bold: true, color: MODERN_ACCENT, margin: [0, 0, 0, 3] },
                      { text: customer?.name || '-', fontSize: 11, bold: true, color: MODERN_BLUE },
                      { text: customer?.address || '-', fontSize: 8.5, color: '#374151', margin: [0, 2, 0, 0] },
                      { text: `GSTIN: ${customer?.gstNo || 'NA'}`, fontSize: 8.5, color: '#6b7280', margin: [0, 2, 0, 0] },
                    ],
                    fillColor: '#f8fafc',
                    margin: [8, 8, 8, 8],
                  },
                ],
              ],
            },
            layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#e2e8f0', vLineColor: () => '#e2e8f0' },
          },
          {
            width: '50%',
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    stack: [
                      { text: 'SHIP TO', fontSize: 8, bold: true, color: MODERN_ACCENT, margin: [0, 0, 0, 3] },
                      { text: shipToData?.name || '-', fontSize: 11, bold: true, color: MODERN_BLUE },
                      { text: shipToData?.address || '-', fontSize: 8.5, color: '#374151', margin: [0, 2, 0, 0] },
                      { text: `GSTIN: ${shipToData?.gstNo || 'NA'}`, fontSize: 8.5, color: '#6b7280', margin: [0, 2, 0, 0] },
                    ],
                    fillColor: '#f8fafc',
                    margin: [8, 8, 8, 8],
                  },
                ],
              ],
            },
            layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#e2e8f0', vLineColor: () => '#e2e8f0' },
          },
        ],
        margin: [0, 0, 0, 8],
      },
      // Products table – no vertical lines, alternating rows
      {
        table: {
          headerRows: 1,
          widths: hasDiscount
            ? ['6%', '41%', '9%', '6%', '8%', '9%', '9%', '12%']
            : ['6%', '48%', '10%', '6%', '8%', '10%', '12%'],
          body: [
            [
              { text: 'SR.', bold: true, fontSize: 9, color: '#ffffff', fillColor: MODERN_BLUE, alignment: 'center' },
              { text: 'PARTICULARS', bold: true, fontSize: 9, color: '#ffffff', fillColor: MODERN_BLUE, alignment: 'center' },
              { text: 'HSN', bold: true, fontSize: 9, color: '#ffffff', fillColor: MODERN_BLUE, alignment: 'center' },
              { text: 'QTY', bold: true, fontSize: 9, color: '#ffffff', fillColor: MODERN_BLUE, alignment: 'center' },
              { text: 'UOM', bold: true, fontSize: 9, color: '#ffffff', fillColor: MODERN_BLUE, alignment: 'center' },
              { text: 'RATE', bold: true, fontSize: 9, color: '#ffffff', fillColor: MODERN_BLUE, alignment: 'center' },
              ...(hasDiscount ? [{ text: 'DISC%', bold: true, fontSize: 9, color: '#ffffff', fillColor: MODERN_BLUE, alignment: 'center' }] : []),
              { text: 'AMOUNT', bold: true, fontSize: 9, color: '#ffffff', fillColor: MODERN_BLUE, alignment: 'right' },
            ],
            ...modernRows,
            ...modernFillerRows,
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0.3),
          vLineWidth: () => 0,
          hLineColor: () => '#e2e8f0',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
        margin: [0, 0, 0, 8],
      },
      // Totals summary card
      {
        columns: [
          {
            width: '55%',
            stack: [
              {
                fillColor: MODERN_LIGHT,
                table: { widths: ['*'], body: [[{ text: `Amount in Words:\n${convertToWords(grandTotal)}`, fontSize: 9, italic: true, color: MODERN_BLUE, margin: [8, 6, 8, 6] }]] },
                layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#bfdbfe', vLineColor: () => '#bfdbfe' },
              },
            ],
          },
          { width: '5%', text: '' },
          {
            width: '40%',
            table: {
              widths: ['*', 'auto'],
              body: [
                [{ text: 'Subtotal', fontSize: 9, color: '#374151' }, { text: formatCurrency(totalAmount), fontSize: 9, alignment: 'right', color: '#374151' }],
                ...(invoiceDiscount > 0 ? [[{ text: 'Discount', fontSize: 9, color: '#374151' }, { text: `- ${formatCurrency(invoiceDiscount)}`, fontSize: 9, alignment: 'right', color: '#374151' }]] : []),
                [{ text: taxLabel, fontSize: 9, color: '#374151' }, { text: formatCurrency(totalTaxAmount), fontSize: 9, alignment: 'right', color: '#374151' }],
                ...(secondTaxLabel
                  ? [[{ text: secondTaxLabel, fontSize: 9, color: '#374151' }, { text: formatCurrency(taxAmount), fontSize: 9, alignment: 'right', color: '#374151' }]]
                  : []),
                [
                  { text: 'GRAND TOTAL', bold: true, fontSize: 10, color: MODERN_BLUE, fillColor: MODERN_LIGHT },
                  { text: formatCurrency(grandTotal), bold: true, fontSize: 10, alignment: 'right', color: MODERN_BLUE, fillColor: MODERN_LIGHT },
                ],
              ],
            },
            layout: {
              hLineWidth: (i, node) => (i === node.table.body.length - 1 ? 1 : 0.3),
              vLineWidth: () => 0,
              hLineColor: () => MODERN_ACCENT,
              paddingLeft: () => 4,
              paddingRight: () => 4,
              paddingTop: () => 3,
              paddingBottom: () => 3,
            },
          },
        ],
        margin: [0, 0, 0, 10],
      },
      // Footer bank + signature
      {
        columns: [
          {
            width: '55%',
            stack: [
              { text: 'Bank Details', bold: true, fontSize: 9.5, color: MODERN_ACCENT, margin: [0, 0, 0, 3] },
              { text: companyName || '', fontSize: 9, color: '#374151' },
              { text: `Bank: ${getBankName(companyBank)}`, fontSize: 9, color: '#374151', margin: [0, 1, 0, 0] },
              { text: `A/C: ${companyBank?.accountNumber || ''}`, fontSize: 9, color: '#374151', margin: [0, 1, 0, 0] },
              { text: `IFSC: ${getBankIfsc(companyBank)}`, fontSize: 9, color: '#374151', margin: [0, 1, 0, 0] },
            ],
          },
          {
            width: '45%',
            stack: [
              { text: `For ${companyName || ''}`, bold: true, fontSize: 9.5, color: MODERN_BLUE, alignment: 'right', margin: [0, 0, 0, 6] },
              { image: getSignatureImage(userSignature), fit: [120, 40], alignment: 'right', margin: [0, 0, 0, 4] },
              { text: 'Authorized Signatory', fontSize: 8.5, color: '#6b7280', alignment: 'right' },
            ],
          },
        ],
        margin: [0, 0, 0, 8],
      },
      ...(termsAndConditions
        ? [{ stack: [{ text: 'Terms & Conditions', bold: true, fontSize: 9.5, color: MODERN_ACCENT, margin: [0, 0, 0, 3] }, { ul: formatTextAsBulletPoints(termsAndConditions) }], margin: [0, 4, 0, 0] }]
        : []),
      { text: 'This is a Proforma Invoice and not a Tax Invoice.', fontSize: 8.5, italic: true, alignment: 'center', color: '#9ca3af', margin: [0, 8, 0, 0] },
    ];
  };

  // ============================
  // TEMPLATE: MINIMAL
  // ============================
  const buildMinimalContent = () => {
    const GRAY = '#6b7280';
    const DARK = '#111827';
    const LINE_COLOR = '#e5e7eb';

    const fillerRows =
      rows.length < MIN_ROWS
        ? Array.from({ length: MIN_ROWS - rows.length }).map(() =>
            Array(hasDiscount ? 8 : 7).fill({ text: ' ', fontSize: 9 })
          )
        : [];

    const minimalTableLayout = {
      hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0),
      vLineWidth: () => 0,
      hLineColor: () => LINE_COLOR,
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    };

    return [
      // Header â€” no borders, company left, logo right
      {
        columns: [
          {
            stack: [
              { text: companyName || '', fontSize: 18, bold: true, color: DARK },
              { text: companyAddress || '', fontSize: 8.5, color: GRAY, margin: [0, 3, 0, 0] },
              { text: `GSTIN: ${companyGST || '-'}  |  Ph: ${companyPhone || ''}`, fontSize: 8.5, color: GRAY, margin: [0, 1, 0, 0] },
            ],
          },
          ...(logoNode ? [{ ...logoNode, width: 80, alignment: 'right', margin: [0, 0, 0, 0] }] : []),
        ],
        margin: [0, 0, 0, 6],
      },
      // Thin horizontal rule
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LINE_COLOR }], margin: [0, 0, 0, 10] },
      // Invoice meta â€” two columns, no boxes
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'PROFORMA INVOICE', fontSize: 13, bold: true, color: DARK, margin: [0, 0, 0, 6] },
              { text: [{ text: 'No: ', color: GRAY, fontSize: 9 }, { text: billNo || '-', fontSize: 9, color: DARK }] },
              { text: [{ text: 'Date: ', color: GRAY, fontSize: 9 }, { text: formatDate(date), fontSize: 9, color: DARK }], margin: [0, 2, 0, 0] },
              { text: [{ text: 'Valid Until: ', color: GRAY, fontSize: 9 }, { text: validUntil ? formatDate(validUntil) : '-', fontSize: 9, color: DARK }], margin: [0, 2, 0, 0] },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: [{ text: 'Order No: ', color: GRAY, fontSize: 9 }, { text: orderNo || '-', fontSize: 9, color: DARK }] },
              { text: [{ text: 'Order Date: ', color: GRAY, fontSize: 9 }, { text: orderDate ? formatDate(orderDate) : '-', fontSize: 9, color: DARK }], margin: [0, 2, 0, 0] },
              ...(challanNo ? [{ text: [{ text: 'Challan No: ', color: GRAY, fontSize: 9 }, { text: challanNo, fontSize: 9, color: DARK }], margin: [0, 2, 0, 0] }] : []),
            ],
          },
        ],
        margin: [0, 0, 0, 10],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LINE_COLOR }], margin: [0, 0, 0, 10] },
      // Bill To â€” no box, left accent line
      { text: 'BILL TO', fontSize: 8, bold: true, color: GRAY, margin: [0, 0, 0, 3] },
      {
        columns: [
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 0, y2: 45, lineWidth: 2, lineColor: LINE_COLOR }], width: 8 },
          {
            stack: [
              { text: customer?.name || '-', fontSize: 11, bold: true, color: DARK },
              { text: customer?.address || '-', fontSize: 8.5, color: GRAY, margin: [0, 2, 0, 0] },
              { text: `GSTIN: ${customer?.gstNo || 'NA'}`, fontSize: 8.5, color: GRAY, margin: [0, 1, 0, 0] },
            ],
          },
        ],
        margin: [0, 0, 0, 6],
      },
      ...(shipToData && shipToData !== customer
        ? [
            { text: 'SHIP TO', fontSize: 8, bold: true, color: GRAY, margin: [0, 0, 0, 3] },
            {
              columns: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 0, y2: 45, lineWidth: 2, lineColor: LINE_COLOR }], width: 8 },
                {
                  stack: [
                    { text: shipToData?.name || '-', fontSize: 11, bold: true, color: DARK },
                    { text: shipToData?.address || '-', fontSize: 8.5, color: GRAY, margin: [0, 2, 0, 0] },
                    { text: `GSTIN: ${shipToData?.gstNo || 'NA'}`, fontSize: 8.5, color: GRAY, margin: [0, 1, 0, 0] },
                  ],
                },
              ],
              margin: [0, 0, 0, 6],
            },
          ]
        : []),
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LINE_COLOR }], margin: [0, 4, 0, 8] },
      // Products table — borderless
      {
        table: {
          headerRows: 1,
          widths: hasDiscount
            ? ['6%', '41%', '9%', '6%', '8%', '9%', '9%', '12%']
            : ['6%', '48%', '10%', '6%', '8%', '10%', '12%'],
          body: [
            [
              { text: 'SR.', fontSize: 8, bold: true, color: GRAY, alignment: 'center' },
              { text: 'PARTICULARS', fontSize: 8, bold: true, color: GRAY },
              { text: 'HSN', fontSize: 8, bold: true, color: GRAY, alignment: 'center' },
              { text: 'QTY', fontSize: 8, bold: true, color: GRAY, alignment: 'center' },
              { text: 'UOM', fontSize: 8, bold: true, color: GRAY, alignment: 'center' },
              { text: 'RATE', fontSize: 8, bold: true, color: GRAY, alignment: 'right' },
              ...(hasDiscount ? [{ text: 'DISC%', fontSize: 8, bold: true, color: GRAY, alignment: 'center' }] : []),
              { text: 'AMOUNT', fontSize: 8, bold: true, color: GRAY, alignment: 'right' },
            ],
            ...rows,
            ...fillerRows,
          ],
        },
        layout: minimalTableLayout,
        margin: [0, 0, 0, 8],
      },
      // Totals — right-aligned, no borders
      {
        columns: [
          { width: '*', text: '' },
          {
            width: '45%',
            stack: [
              { columns: [{ text: 'Subtotal', fontSize: 9, color: GRAY }, { text: formatCurrency(totalAmount), fontSize: 9, alignment: 'right', color: DARK }] },
              ...(invoiceDiscount > 0 ? [{ columns: [{ text: 'Discount', fontSize: 9, color: GRAY }, { text: `- ${formatCurrency(invoiceDiscount)}`, fontSize: 9, alignment: 'right', color: DARK }], margin: [0, 2, 0, 0] }] : []),
              { columns: [{ text: taxLabel, fontSize: 9, color: GRAY }, { text: formatCurrency(totalTaxAmount), fontSize: 9, alignment: 'right', color: DARK }], margin: [0, 2, 0, 0] },
              ...(secondTaxLabel
                ? [{ columns: [{ text: secondTaxLabel, fontSize: 9, color: GRAY }, { text: formatCurrency(taxAmount), fontSize: 9, alignment: 'right', color: DARK }], margin: [0, 2, 0, 0] }]
                : []),
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 220, y2: 0, lineWidth: 0.5, lineColor: LINE_COLOR }], margin: [0, 4, 0, 4] },
              { columns: [{ text: 'Grand Total', fontSize: 11, bold: true, color: DARK }, { text: formatCurrency(grandTotal), fontSize: 11, bold: true, alignment: 'right', color: DARK }] },
              { text: `(${convertToWords(grandTotal)})`, fontSize: 8, italic: true, color: GRAY, margin: [0, 2, 0, 0] },
            ],
          },
        ],
        margin: [0, 0, 0, 16],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LINE_COLOR }], margin: [0, 0, 0, 10] },
      // Footer
      {
        columns: [
          {
            width: '55%',
            stack: [
              { text: 'Bank Details', fontSize: 9, bold: true, color: DARK, margin: [0, 0, 0, 3] },
              { text: `${getBankName(companyBank)}  |  A/C: ${companyBank?.accountNumber || ''}`, fontSize: 8.5, color: GRAY },
              { text: `IFSC: ${getBankIfsc(companyBank)}`, fontSize: 8.5, color: GRAY, margin: [0, 1, 0, 0] },
            ],
          },
          {
            width: '45%',
            stack: [
              { text: `For ${companyName || ''}`, fontSize: 9, bold: true, color: DARK, alignment: 'right', margin: [0, 0, 0, 8] },
              { image: getSignatureImage(userSignature), fit: [120, 40], alignment: 'right' },
              { text: 'Authorized Signatory', fontSize: 8.5, color: GRAY, alignment: 'right', margin: [0, 2, 0, 0] },
            ],
          },
        ],
        margin: [0, 0, 0, 8],
      },
      ...(termsAndConditions
        ? [
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LINE_COLOR }], margin: [0, 4, 0, 6] },
            { text: 'Terms & Conditions', fontSize: 9, bold: true, color: GRAY, margin: [0, 0, 0, 4] },
            { stack: formatTextAsBulletPoints(termsAndConditions) },
          ]
        : []),
      { text: 'This is a Proforma Invoice and not a Tax Invoice.', fontSize: 8.5, italic: true, alignment: 'center', color: '#9ca3af', margin: [0, 10, 0, 0] },
    ];
  };

  // Select the right builder
  let content;
  if (template === 'modern') {
    content = buildModernContent();
  } else if (template === 'minimal') {
    content = buildMinimalContent();
  } else {
    content = buildClassicContent();
  }

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 25],
    defaultStyle: { font: 'Roboto', fontSize: 10.5, color: COLORS.text, lineHeight: 1 },
    content,
  };

  pdfMake.createPdf(docDefinition).download(
    `Proforma-${companyName?.split(' ').map((w) => w[0]?.toUpperCase()).join('') || 'INV'}-${billNo || ''}.pdf`,
  );
};
