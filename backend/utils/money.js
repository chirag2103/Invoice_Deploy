/**
 * Money helpers. Amounts stay plain JS `Number` (rupees); every operation is
 * rounded to 2 decimal places so repeated arithmetic does not drift.
 */

export const round2 = (n) => {
  const value = Number(n);
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const mul = (a, b) => round2(Number(a || 0) * Number(b || 0));

export const sum = (arr) =>
  round2((arr || []).reduce((acc, x) => acc + Number(x || 0), 0));
