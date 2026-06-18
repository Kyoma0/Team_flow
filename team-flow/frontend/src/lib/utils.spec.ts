import {
  cn,
  formatDate,
  formatDateTime,
  formatBytes,
  getStatusColor,
  getStatusLabel,
  getPriorityLabel,
  renderMentions,
  getPriorityColor,
} from '@/lib/utils';

describe('cn', () => {
  it('combines class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 px-4')).toBe('px-4');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('formatDate', () => {
  it('formats a date string to dd/MM/yyyy', () => {
    const result = formatDate('2024-03-15T10:30:00Z');
    expect(result).toBe('15/03/2024');
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date(2024, 0, 5));
    expect(result).toBe('05/01/2024');
  });
});

describe('formatDateTime', () => {
  it('formats a date string to dd/MM/yyyy HH:mm', () => {
    const result = formatDateTime('2024-03-15T10:30:00');
    expect(result).toMatch(/^15\/03\/2024 \d{2}:30$/);
  });

  it('formats a Date object', () => {
    const result = formatDateTime(new Date(2024, 0, 5, 8, 5));
    expect(result).toBe('05/01/2024 08:05');
  });
});

describe('formatBytes', () => {
  it('returns "0 B" for 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('returns bytes in KB', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('returns bytes in MB', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  it('returns bytes in GB', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('handles fractional values', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });
});

describe('getStatusLabel', () => {
  it('returns correct label for NOT_STARTED', () => {
    expect(getStatusLabel('NOT_STARTED')).toBe('Não iniciada');
  });

  it('returns correct label for IN_PROGRESS', () => {
    expect(getStatusLabel('IN_PROGRESS')).toBe('Em andamento');
  });

  it('returns correct label for PAUSED', () => {
    expect(getStatusLabel('PAUSED')).toBe('Pausada');
  });

  it('returns correct label for IN_REVIEW', () => {
    expect(getStatusLabel('IN_REVIEW')).toBe('Em revisão');
  });

  it('returns correct label for COMPLETED', () => {
    expect(getStatusLabel('COMPLETED')).toBe('Concluída');
  });

  it('returns the status itself for unknown statuses', () => {
    expect(getStatusLabel('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('getPriorityLabel', () => {
  it('returns correct label for LOW', () => {
    expect(getPriorityLabel('LOW')).toBe('Baixa');
  });

  it('returns correct label for MEDIUM', () => {
    expect(getPriorityLabel('MEDIUM')).toBe('Média');
  });

  it('returns correct label for HIGH', () => {
    expect(getPriorityLabel('HIGH')).toBe('Alta');
  });

  it('returns correct label for URGENT', () => {
    expect(getPriorityLabel('URGENT')).toBe('Urgente');
  });

  it('returns the priority itself for unknown priorities', () => {
    expect(getPriorityLabel('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('getStatusColor', () => {
  it('returns gray for NOT_STARTED', () => {
    expect(getStatusColor('NOT_STARTED')).toBe('bg-gray-500');
  });

  it('returns blue for IN_PROGRESS', () => {
    expect(getStatusColor('IN_PROGRESS')).toBe('bg-blue-500');
  });

  it('returns yellow for PAUSED', () => {
    expect(getStatusColor('PAUSED')).toBe('bg-yellow-500');
  });

  it('returns purple for IN_REVIEW', () => {
    expect(getStatusColor('IN_REVIEW')).toBe('bg-purple-500');
  });

  it('returns green for COMPLETED', () => {
    expect(getStatusColor('COMPLETED')).toBe('bg-green-500');
  });

  it('defaults to gray for unknown statuses', () => {
    expect(getStatusColor('UNKNOWN')).toBe('bg-gray-500');
  });
});

describe('getPriorityColor', () => {
  it('returns correct classes for LOW', () => {
    expect(getPriorityColor('LOW')).toBe('bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300');
  });

  it('returns correct classes for MEDIUM', () => {
    expect(getPriorityColor('MEDIUM')).toBe('bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300');
  });

  it('returns correct classes for HIGH', () => {
    expect(getPriorityColor('HIGH')).toBe('bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300');
  });

  it('returns correct classes for URGENT', () => {
    expect(getPriorityColor('URGENT')).toBe('bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300');
  });

  it('defaults to gray for unknown priorities', () => {
    expect(getPriorityColor('UNKNOWN')).toBe('bg-gray-100 text-gray-700');
  });
});

describe('renderMentions', () => {
  it('returns plain text when there are no mentions', () => {
    const result = renderMentions('hello world') as any[];
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('hello world');
  });

  it('wraps @username in a span', () => {
    const result = renderMentions('hello @john') as any[];
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('hello ');
    expect(result[1].type).toBe('span');
    expect(result[1].props.className).toBe('text-primary-600 dark:text-primary-400 font-medium');
    expect(result[1].props.children).toBe('@john');
    expect(result[2]).toBe('');
  });

  it('handles multiple mentions', () => {
    const result = renderMentions('@alice and @bob') as any[];
    expect(result).toHaveLength(5);
    expect(result[0]).toBe('');
    expect(result[1].props?.children).toBe('@alice');
    expect(result[1].type).toBe('span');
    expect(result[3].props?.children).toBe('@bob');
    expect(result[3].type).toBe('span');
  });

  it('handles mentions with dots and dashes', () => {
    const result = renderMentions('@john.doe and @jane-doe') as any[];
    expect(result[0]).toBe('');
    expect(result[1].props?.children).toBe('@john.doe');
    expect(result[1].type).toBe('span');
    expect(result[3].props?.children).toBe('@jane-doe');
    expect(result[3].type).toBe('span');
  });
});
