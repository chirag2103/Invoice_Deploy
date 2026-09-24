import { round2, mul, sum } from '../utils/money.js';

/**
 * Single source of truth for line + tax + grand-total maths on every
 * priced document (invoice / quotation / proforma / purchase order).
 *
 * Conventions in this codebase:
 *   - product.discount    : line-level discount, a PERCENT
 *   - invoiceDiscount     : document-level discount, a FLAT rupee amount
 *   - gst                 : the HALF rate (e.g. 9 => 18% total GST)
 *   - gstType             : 'intraState' (CGST+SGST) | 'interState' (IGST)
 *
 * The client sends its own totals for a live preview; the server ignores them
 * and stores what this function returns.
 */
export const computeDocumentTotals = ({
  products = [],
  invoiceDiscount = 0,
  gst = 0,
  gstType = 'intraState',
} = {}) => {
  const halfRate = Number(gst) || 0;
  const isInterState = gstType === 'interState';
  const docDiscount = round2(Math.max(Number(invoiceDiscount) || 0, 0));

  const lines = (products || []).map((p) => {
    const quantity = Number(p.quantity) || 0;
    const rate = Number(p.rate) || 0;
    const discountPct = Math.min(Math.max(Number(p.discount) || 0, 0), 100);

    const gross = mul(quantity, rate);
    const lineDiscount = round2((gross * discountPct) / 100);
    const amount = round2(gross - lineDiscount);

    return { gross, lineDiscount, amount };
  });

  const subTotal = sum(lines.map((l) => l.amount));
  const taxable = round2(Math.max(subTotal - docDiscount, 0));

  const halfTax = round2((taxable * halfRate) / 100);
  const cgst = isInterState ? 0 : halfTax;
  const sgst = isInterState ? 0 : halfTax;
  const igst = isInterState ? round2((taxable * halfRate * 2) / 100) : 0;

  const preRound = round2(taxable + cgst + sgst + igst);
  const grandTotal = Math.round(preRound);
  const roundOff = round2(grandTotal - preRound);

  return {
    lines,
    subTotal,
    invoiceDiscount: docDiscount,
    taxable,
    cgst,
    sgst,
    igst,
    roundOff,
    grandTotal,
    taxBreakup: { taxable, cgst, sgst, igst, roundOff },
  };
};

export default computeDocumentTotals;
