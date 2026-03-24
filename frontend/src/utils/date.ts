/**
 * Formats a Date object or ISO string into DD-MM-YYYY string
 * @param date The date to format
 * @returns string in DD-MM-YYYY format
 */
export const formatDateDDMMYYYY = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};
