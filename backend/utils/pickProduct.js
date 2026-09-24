/**
 * Whitelist + coerce a single line-item from a client payload. Prevents extra
 * keys (e.g. a client-supplied `amount`) from being persisted and normalises
 * numeric fields.
 */
export const pickProduct = (p = {}) => {
  const item = {
    name: String(p.name ?? '').trim(),
    quantity: Number(p.quantity) || 0,
    uom: p.uom ? String(p.uom) : 'NOS',
  };

  if (p.rate !== undefined) item.rate = Number(p.rate) || 0;
  if (p.discount !== undefined) item.discount = Number(p.discount) || 0;
  if (p.hsn !== undefined && p.hsn !== null && p.hsn !== '') {
    item.hsn = String(p.hsn).trim();
  }

  return item;
};

export const pickProducts = (list) =>
  Array.isArray(list) ? list.map(pickProduct) : [];

export default pickProduct;
