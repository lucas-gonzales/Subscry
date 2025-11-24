import { describe, it, expect } from '@jest/globals';
import { calculateNextDue, toISOString } from '../src/utils/dateUtils';
import { Subscription } from '../src/types/subscription';
import { addMonths, addYears, addWeeks, addDays } from 'date-fns';

describe('calculateNextDue', () => {
  const baseDate = new Date('2025-01-15T00:00:00.000Z');

  const createMockSubscription = (
    frequency: Subscription['frequency'],
    startDate: Date,
    customDays?: number
  ): Subscription => ({
    id: 'test-id',
    title: 'Test Subscription',
    amount: 1000,
    frequency,
    custom_interval_days: customDays || null,
    start_date: toISOString(startDate),
    end_date: null,
    next_due: toISOString(startDate),
    auto_renew: true,
    tags: '',
    notes: null,
    created_at: toISOString(new Date()),
    updated_at: toISOString(new Date()),
  });

  it('deve calcular next_due corretamente para frequência mensal', () => {
    const startDate = new Date('2025-01-15');
    const subscription = createMockSubscription('monthly', startDate);
    const fromDate = new Date('2025-01-20'); // Após o início

    const result = calculateNextDue(subscription, fromDate);
    const expected = new Date('2025-02-15');

    expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
  });

  it('deve calcular next_due corretamente para frequência anual', () => {
    const startDate = new Date('2024-06-01');
    const subscription = createMockSubscription('yearly', startDate);
    const fromDate = new Date('2025-01-01'); // Após o início

    const result = calculateNextDue(subscription, fromDate);
    const expected = new Date('2025-06-01');

    expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
  });

  it('deve calcular next_due corretamente para frequência semanal', () => {
    const startDate = new Date('2025-01-01'); // Quarta
    const subscription = createMockSubscription('weekly', startDate);
    const fromDate = new Date('2025-01-10');

    const result = calculateNextDue(subscription, fromDate);
    const expected = new Date('2025-01-15');

    expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
  });

  it('deve calcular next_due corretamente para frequência diária', () => {
    const startDate = new Date('2025-01-01');
    const subscription = createMockSubscription('daily', startDate);
    const fromDate = new Date('2025-01-10');

    const result = calculateNextDue(subscription, fromDate);
    const expected = new Date('2025-01-11');

    expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
  });

  it('deve calcular next_due corretamente para frequência customizada (45 dias)', () => {
    const startDate = new Date('2025-01-01');
    const subscription = createMockSubscription('custom', startDate, 45);
    const fromDate = new Date('2025-02-20'); // Após primeiro ciclo

    const result = calculateNextDue(subscription, fromDate);
    const expected = addDays(addDays(startDate, 45), 45); // 2 ciclos

    expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
  });

  it('deve retornar a data de início se ela for futura', () => {
    const futureDate = new Date('2025-12-31');
    const subscription = createMockSubscription('monthly', futureDate);
    const fromDate = new Date('2025-01-01');

    const result = calculateNextDue(subscription, fromDate);

    expect(result.toISOString().split('T')[0]).toBe(futureDate.toISOString().split('T')[0]);
  });

  it('deve respeitar end_date quando definido', () => {
    const startDate = new Date('2024-01-01');
    const subscription = createMockSubscription('monthly', startDate);
    subscription.end_date = toISOString(new Date('2025-03-01'));
    const fromDate = new Date('2025-05-01');

    const result = calculateNextDue(subscription, fromDate);
    const expected = new Date('2025-03-01');

    expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
  });
});
