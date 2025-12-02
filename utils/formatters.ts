const BIRTHDATE_COMPLETE_REGEX = /^\d{2}-\d{2}-\d{4}$/;

export const normalizePhoneNumber = (value: string) => value.replace(/\D/g, '').slice(0, 10);

export const formatPhoneInput = (value: string) => {
  const digits = normalizePhoneNumber(value);

  if (!digits) {
    return '';
  }

  if (digits.length < 4) {
    const closing = digits.length === 3 ? ')' : '';
    return `(${digits}${closing}`;
  }

  if (digits.length < 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

export const formatBirthDateInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (!digits) {
    return '';
  }

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
};

export const isCompleteBirthDate = (value: string) => BIRTHDATE_COMPLETE_REGEX.test(value);

export const normalizeBirthDateFromServer = (value?: string | null) => {
  if (!value) {
    return '';
  }

  if (BIRTHDATE_COMPLETE_REGEX.test(value)) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${month}-${day}-${year}`;
  }

  return value;
};
