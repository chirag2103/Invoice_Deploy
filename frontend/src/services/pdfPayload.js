// Shared "company/user branding" fields every document PDF (invoice, quotation,
// challan, proforma, purchase order) stamps onto its pdfGeneratorService payload.
export const getPdfExtras = (user, { includeBank = true } = {}) => ({
  companyName: user.companyDetails?.name,
  companyAddress: user.companyDetails?.address,
  companyGST: user.companyDetails?.gstin,
  companyPhone: user.companyDetails?.mobile,
  ...(includeBank ? { companyBank: user.bankDetails || {} } : {}),
  userSignature: user.signature || null,
  companyLogo: user.companyLogo || null,
  template: user.pdfTemplate || 'classic',
});
