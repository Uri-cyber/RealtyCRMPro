import {
  formatCurrency,
  formatPhoneNumber,
  getInitials,
  truncateText,
  calculateLeadScore,
  cn,
} from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats numbers as USD currency', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
    expect(formatCurrency(1234567)).toBe('$1,234,567');
    expect(formatCurrency(0)).toBe('$0');
  });

  it('rounds to whole numbers', () => {
    expect(formatCurrency(1000.99)).toBe('$1,001');
    expect(formatCurrency(1000.49)).toBe('$1,000');
  });
});

describe('formatPhoneNumber', () => {
  it('formats 10-digit phone numbers', () => {
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
  });

  it('formats 11-digit phone numbers with country code', () => {
    expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567');
  });

  it('strips non-numeric characters before formatting', () => {
    expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567');
  });

  it('returns original for non-standard formats', () => {
    expect(formatPhoneNumber('123')).toBe('123');
    expect(formatPhoneNumber('+44 7911 123456')).toBe('+44 7911 123456');
  });
});

describe('getInitials', () => {
  it('returns first two initials of a name', () => {
    expect(getInitials('John Smith')).toBe('JS');
    expect(getInitials('Jane Doe')).toBe('JD');
  });

  it('handles single names', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('handles multiple names', () => {
    expect(getInitials('John Michael Smith Jr')).toBe('JM');
  });

  it('returns uppercase initials', () => {
    expect(getInitials('john smith')).toBe('JS');
  });
});

describe('truncateText', () => {
  it('truncates text longer than maxLength', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...');
  });

  it('does not truncate text shorter than maxLength', () => {
    expect(truncateText('Hi', 10)).toBe('Hi');
  });

  it('handles exact length', () => {
    expect(truncateText('Hello', 5)).toBe('Hello');
  });

  it('trims trailing whitespace before adding ellipsis', () => {
    expect(truncateText('Hello World', 6)).toBe('Hello...');
  });
});

describe('calculateLeadScore', () => {
  it('returns 0 for a lead with no activity', () => {
    expect(calculateLeadScore({})).toBe(0);
  });

  it('calculates score based on email opens', () => {
    expect(calculateLeadScore({ emailOpens: 2 })).toBe(10);
    expect(calculateLeadScore({ emailOpens: 5 })).toBe(20); // max 20
  });

  it('calculates score based on property views', () => {
    expect(calculateLeadScore({ propertyViews: 2 })).toBe(20);
    expect(calculateLeadScore({ propertyViews: 5 })).toBe(30); // max 30
  });

  it('calculates score based on showings attended', () => {
    expect(calculateLeadScore({ showingsAttended: 1 })).toBe(15);
    expect(calculateLeadScore({ showingsAttended: 3 })).toBe(30); // max 30
  });

  it('adds recency bonus for recent activity', () => {
    expect(calculateLeadScore({ daysActive: 5 })).toBe(20);
    expect(calculateLeadScore({ daysActive: 10 })).toBe(15);
    expect(calculateLeadScore({ daysActive: 20 })).toBe(10);
    expect(calculateLeadScore({ daysActive: 45 })).toBe(5);
    expect(calculateLeadScore({ daysActive: 90 })).toBe(0);
  });

  it('caps total score at 100', () => {
    const maxActivityLead = {
      emailOpens: 10,
      propertyViews: 10,
      showingsAttended: 5,
      daysActive: 1,
    };
    expect(calculateLeadScore(maxActivityLead)).toBe(100);
  });
});

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});
