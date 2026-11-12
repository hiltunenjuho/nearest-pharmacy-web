export function getPhoneUrl(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, '');
  if (!digits) {
    return undefined;
  }

  const internationalPrefix = phoneNumber.trim().startsWith('+') ? '+' : '';
  return `tel:${internationalPrefix}${digits}`;
}
