import pdfMake from 'pdfmake/build/pdfmake';
import { generateInvoicePDF, generateQuotationPDF, generatePurchaseOrderPDF, generateProformaInvoicePDF, generateMonthlyInvoicesPDF } from './pdfGeneratorService';

jest.mock('pdfmake/build/pdfmake', () => ({ createPdf: jest.fn(() => ({ download: jest.fn() })) }));
jest.mock('pdfmake/build/vfs_fonts', () => ({ vfs: {} }));

const document = {
  companyName: 'Example', customer: { name: 'Customer' }, seller: { name: 'Seller' },
  products: [{ name: 'Product', quantity: 1, rate: 100.42 }], totalAmount: 100.42,
  invoiceDiscount: 10, gst: 9, gstType: 'interState', grandTotal: 107,
  taxBreakup: { taxable: 90.42, cgst: 0, sgst: 0, igst: 16.28, roundOff: 0.3 },
};

const validateSpans = (value) => {
  if (!value || typeof value !== 'object') return;
  if (value.table?.body) {
    value.table.body.forEach((row, index) => row.forEach((cell) => {
      if (cell.rowSpan) expect(index + cell.rowSpan).toBeLessThanOrEqual(value.table.body.length);
    }));
  }
  Object.values(value).forEach(validateSpans);
};

beforeEach(() => pdfMake.createPdf.mockReturnValue({ download: jest.fn() }));
afterEach(() => jest.clearAllMocks());

test.each(['classic', 'modern', 'minimal'])('all %s document PDFs retain saved tax, discounts and valid row spans', (template) => {
  for (const generate of [generateInvoicePDF, generateQuotationPDF, generatePurchaseOrderPDF, generateProformaInvoicePDF]) {
    generate({ ...document, template });
    const definition = pdfMake.createPdf.mock.calls.at(-1)[0];
    const content = JSON.stringify(definition);
    expect(content).toContain('IGST (18%)');
    expect(content).toContain('16.28');
    expect(content).toContain('Discount');
    expect(content).toContain('Round Off');
    expect(content).toContain('0.30');
    expect(content).not.toContain('CGST (9%)');
    validateSpans(definition);
  }
});

test('monthly PDF generator preserves each invoice GST type and document discount', () => {
  generateMonthlyInvoicesPDF({ companyName: 'Example', invoices: [document] });
  const content = JSON.stringify(pdfMake.createPdf.mock.calls[0][0]);
  expect(content).toContain('IGST (18%)');
  expect(content).toContain('16.28');
  expect(content).toContain('Discount');
  expect(content).not.toContain('CGST (9%)');
});

test('monthly PDFs retain each invoice historical company and customer details', () => {
  generateMonthlyInvoicesPDF({ companyName: 'Current company', invoices: [{ ...document, issuedSnapshot: {
    company: { companyName: 'Original company', companyAddress: 'Original address', template: 'minimal' },
    customer: { name: 'Original customer' },
  } }] });
  const content = JSON.stringify(pdfMake.createPdf.mock.calls[0][0]);
  expect(content).toContain('Original company');
  expect(content).toContain('Original address');
  expect(content).toContain('Original customer');
  expect(content).not.toContain('Current company');
});
