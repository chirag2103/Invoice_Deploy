export const uomList = [
  'NOS',
  'PCS',
  'SET',
  'MTR',
  'LTR',
  'UNIT',
  'BOX',
  'PACK',
  'DOZEN',
  'BUNDLE',
  'ROLL',
  'BAG',
  'CASE',
  'CARTON',
  'MG',
  'GM',
  'KG',
  'TON',
  'QTL',
  'ML',
  'KL',
  'GALLON',
  'MM',
  'CM',
  'KM',
  'FT',
  'IN',
  'YD',
  'SQFT',
  'SQM',
  'SQYD',
  'ACRE',
  'HECTARE',
  'HOUR',
  'DAY',
  'MONTH',
  'JOB',
  'LOT',
];

export const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const getFinancialYearFromDate = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  return `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
};

export const formatDocumentNumber = (number, financialYearLabel) => {
  if (number === undefined || number === null || number === '') {
    return '';
  }

  return financialYearLabel
    ? `${financialYearLabel}/${number}`
    : String(number);
};

export function formatDate(date) {
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

export function formatNumberWithCommas(num) {
  const n = Number(num || 0).toFixed(2);
  const parts = n.split('.');
  const numStr = parts[0];
  if (numStr.length <= 3) return numStr + '.' + parts[1];
  const last3 = numStr.slice(-3);
  const other = numStr.slice(0, -3);
  const otherWithCommas = other.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return otherWithCommas + ',' + last3 + '.' + parts[1];
}

export function formatCurrency(amount) {
  return formatNumberWithCommas(amount);
}

export function convertToWords(amount) {
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
