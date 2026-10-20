import { formatDocumentNumber } from './helper';

const documentFields = {
  invoice: ['invoiceProducts', 'invoiceNo', 'billNo'],
  proforma: ['proformaProducts', 'proformaNo', 'billNo'],
  quotation: ['quotationProducts', 'quoteNo', 'quotationNo'],
  po: ['poProducts', 'poNo', 'poNo'],
};

export const savedDocumentPdf = (document, type) => {
  const [productsField, numberField, pdfNumberField] = documentFields[type];
  return {
    date: document.date,
    products: document[productsField] || [],
    totalAmount: document.invoiceTotal,
    invoiceDiscount: document.invoiceDiscount || 0,
    gst: document.gst,
    gstType: document.gstType || 'intraState',
    grandTotal: document.grandTotal,
    taxBreakup: document.taxBreakup,
    financialYearLabel: document.financialYearLabel,
    [pdfNumberField]: formatDocumentNumber(document[numberField], document.financialYearLabel),
    shipTo: document.shipTo || null,
    challanNo: document.challanNo,
    challanDate: document.challanDate,
    orderNo: document.orderNo,
    orderDate: document.orderDate,
    validUntil: document.validUntil,
    termsAndConditions: document.termsAndConditions || '',
    technicalSpecifications: document.technicalSpecifications || '',
    ...(type === 'invoice' && document.issuedSnapshot ? {
      issuedSnapshot: document.issuedSnapshot,
      customer: document.issuedSnapshot.customer,
      ...document.issuedSnapshot.company,
    } : {}),
  };
};
