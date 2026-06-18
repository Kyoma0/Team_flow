import { t, setLocale, formatNumber, formatCurrency } from '@/lib/i18n';

describe('t()', () => {
  it('returns correct translation for pt-BR', () => {
    setLocale('pt-BR');
    expect(t('common.save')).toBe('Salvar');
    expect(t('common.cancel')).toBe('Cancelar');
    expect(t('common.delete')).toBe('Excluir');
  });

  it('falls back to key when translation is not found', () => {
    setLocale('pt-BR');
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('returns correct translation after changing locale', () => {
    setLocale('pt-BR');
    expect(t('common.save')).toBe('Salvar');

    setLocale('en-US');
    expect(t('common.save')).toBe('Save');
  });
});

describe('setLocale', () => {
  it('switches language and affects t() output', () => {
    setLocale('en-US');
    expect(t('common.save')).toBe('Save');

    setLocale('pt-BR');
    expect(t('common.save')).toBe('Salvar');
  });
});

describe('formatNumber', () => {
  it('formats number with pt-BR locale', () => {
    setLocale('pt-BR');
    const result = formatNumber(1234.56);
    expect(result).toBe('1.234,56');
  });

  it('formats number with en-US locale', () => {
    setLocale('en-US');
    const result = formatNumber(1234.56);
    expect(result).toBe('1,234.56');
  });
});

describe('formatCurrency', () => {
  it('formats currency with pt-BR locale and BRL', () => {
    setLocale('pt-BR');
    const result = formatCurrency(1234.56);
    expect(result).toContain('1.234');
    expect(result).toContain('56');
  });

  it('formats currency with en-US locale and USD', () => {
    setLocale('en-US');
    const result = formatCurrency(1234.56);
    expect(result).toContain('1,234');
    expect(result).toContain('56');
  });
});
