// Only server-owned business fields are captured; credentials never enter invoices.
export const buildInvoiceSnapshot = (user, customer) => ({
  version: 1,
  capturedAt: new Date(),
  customer: {
    name: customer.name || '',
    address: customer.address || '',
    gstNo: customer.gstNo || '',
  },
  company: {
    companyName: user.companyDetails?.name || '',
    companyAddress: user.companyDetails?.address || '',
    companyGST: user.companyDetails?.gstin || '',
    companyPhone: user.companyDetails?.mobile || '',
    companyBank: {
      bankName: user.bankDetails?.bankName || '',
      accountNumber: user.bankDetails?.accountNumber || '',
      ifsc: user.bankDetails?.ifsc || '',
    },
    userSignature: user.signature?.toObject?.() || user.signature || null,
    companyLogo: user.companyLogo?.toObject?.() || user.companyLogo || null,
    template: user.pdfTemplate || 'classic',
  },
});
