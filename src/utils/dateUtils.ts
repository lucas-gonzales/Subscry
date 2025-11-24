import { addDays, addMonths, addYears, addWeeks, isAfter, parseISO, formatISO, differenceInCalendarDays } from 'date-fns';
import { Subscription, FrequencyType } from '../types/subscription';

/**
 * Calcula a próxima data de vencimento com base na frequência e data de início
 * @param subscription - Assinatura com dados de recorrência
 * @param fromDate - Data de referência (padrão: hoje)
 * @returns Próxima data de vencimento
 */
export function calculateNextDue(subscription: Subscription, fromDate: Date = new Date()): Date {
  const startDate = parseISO(subscription.start_date);
  let nextDue = new Date(startDate);

  // Se a data de início é futura, retorna ela
  if (isAfter(startDate, fromDate)) {
    return startDate;
  }

  // Calcula o próximo vencimento baseado na frequência
  switch (subscription.frequency) {
    case 'daily':
      while (!isAfter(nextDue, fromDate)) {
        nextDue = addDays(nextDue, 1);
      }
      break;

    case 'weekly':
      while (!isAfter(nextDue, fromDate)) {
        nextDue = addWeeks(nextDue, 1);
      }
      break;

    case 'monthly':
      while (!isAfter(nextDue, fromDate)) {
        nextDue = addMonths(nextDue, 1);
      }
      break;

    case 'yearly':
      while (!isAfter(nextDue, fromDate)) {
        nextDue = addYears(nextDue, 1);
      }
      break;

    case 'custom':
      const interval = subscription.custom_interval_days || 30;
      while (!isAfter(nextDue, fromDate)) {
        nextDue = addDays(nextDue, interval);
      }
      break;

    default:
      throw new Error(`Frequência não suportada: ${subscription.frequency}`);
  }

  // Verifica se há data de término
  if (subscription.end_date) {
    const endDate = parseISO(subscription.end_date);
    if (isAfter(nextDue, endDate)) {
      return endDate;
    }
  }

  return nextDue;
}

/**
 * Formata data para string ISO 8601
 */
export function toISOString(date: Date): string {
  return formatISO(date);
}

/**
 * Converte string ISO para Date
 */
export function fromISOString(isoString: string): Date {
  return parseISO(isoString);
}

/**
 * Dias até a data ISO (pode ser negativa se já passou)
 */
export function daysUntil(isoString: string): number {
  try {
    const d = parseISO(isoString);
    return differenceInCalendarDays(d, new Date());
  } catch (e) {
    return Infinity;
  }
}
