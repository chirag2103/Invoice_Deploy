export const round2 = (n) => {
  const value = Number(n);
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

// Keep preview arithmetic aligned with backend/services/documentTotals.js.
export const lineAmount = (p) => {
  const gross = round2(Number(p.quantity || 0) * Number(p.rate || 0));
  const discount = Math.min(Math.max(Number(p.discount) || 0, 0), 100);
  return round2(gross - round2(gross * discount / 100));
};

export const computeTaxBreakup = ({ totalAmount, invoiceDiscount = 0, gst = 0, gstType = 'intraState' }) => {
  const taxable = round2(Math.max(Number(totalAmount || 0) - round2(Math.max(Number(invoiceDiscount) || 0, 0)), 0));
  const halfTax = round2(taxable * (Number(gst) || 0) / 100);
  const cgst = gstType === 'interState' ? 0 : halfTax;
  const sgst = cgst;
  const igst = gstType === 'interState' ? round2(taxable * (Number(gst) || 0) * 2 / 100) : 0;
  const preRound = round2(taxable + cgst + sgst + igst);
  const grandTotal = Math.round(preRound);
  return { taxable, cgst, sgst, igst, roundOff: round2(grandTotal - preRound) };
};

export const recalculateDocument = (state) => {
  state.invoiceDiscount = round2(Math.max(Number(state.invoiceDiscount) || 0, 0));
  state.totalAmount = round2(state.products.reduce((sum, p) => sum + lineAmount(p), 0));
  state.taxBreakup = computeTaxBreakup(state);
  const { taxable, cgst, sgst, igst } = state.taxBreakup;
  state.grandTotal = Math.round(round2(taxable + cgst + sgst + igst));
};
