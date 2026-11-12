import { describe, expect, it } from 'vitest';
import { getPhoneUrl } from './phoneUrl';

describe('phone links', () => {
  it('strips display formatting while preserving an international prefix', () => {
    expect(getPhoneUrl('+358 9 123 4567')).toBe('tel:+35891234567');
  });

  it('returns no call link when the phone number has no digits', () => {
    expect(getPhoneUrl('')).toBeUndefined();
    expect(getPhoneUrl('not available')).toBeUndefined();
  });
});
