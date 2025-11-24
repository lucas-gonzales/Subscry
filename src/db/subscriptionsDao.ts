import { getDatabase } from './index';
import { Subscription, CreateSubscriptionInput, UpdateSubscriptionInput } from '../types/subscription';
import { calculateNextDue, toISOString } from '../utils/dateUtils';

/**
 * Gera um UUID simples (para ambientes sem crypto.randomUUID)
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Converte row do SQLite para objeto Subscription
 */
function rowToSubscription(row: any): Subscription {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    participants: row.participants ? JSON.parse(row.participants) : [],
    frequency: row.frequency,
    custom_interval_days: row.custom_interval_days,
    start_date: row.start_date,
    end_date: row.end_date,
    next_due: row.next_due,
    auto_renew: Boolean(row.auto_renew),
    tags: row.tags || '',
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Obtém todas as assinaturas ordenadas por próximo vencimento
 */
export function getAllSubscriptions(): Subscription[] {
  const db = getDatabase();
  const rows = db.getAllSync('SELECT * FROM subscriptions ORDER BY next_due ASC');
  return rows.map(rowToSubscription);
}

/**
 * Obtém assinatura por ID
 */
export function getSubscriptionById(id: string): Subscription | null {
  const db = getDatabase();
  const row = db.getFirstSync('SELECT * FROM subscriptions WHERE id = ?', [id]);
  return row ? rowToSubscription(row) : null;
}

/**
 * Cria uma nova assinatura
 */
export function createSubscription(input: CreateSubscriptionInput): Subscription {
  const db = getDatabase();
  const now = toISOString(new Date());
  const id = generateUUID();

  // Cria objeto temporário para calcular next_due
  const tempSub: Subscription = {
    id,
    ...input,
    next_due: input.start_date, // Temporário
    created_at: now,
    updated_at: now,
  };

  const nextDue = toISOString(calculateNextDue(tempSub));

  db.runSync(
    `INSERT INTO subscriptions (
      id, title, amount, participants, frequency, custom_interval_days,
      start_date, end_date, next_due, auto_renew, tags, notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title,
      input.amount,
      JSON.stringify((input as any).participants || []),
      input.frequency,
      input.custom_interval_days,
      input.start_date,
      input.end_date,
      nextDue,
      input.auto_renew ? 1 : 0,
      input.tags,
      input.notes,
      now,
      now,
    ]
  );

  const created = getSubscriptionById(id);
  if (!created) {
    throw new Error('Falha ao criar assinatura');
  }

  return created;
}

/**
 * Atualiza uma assinatura existente
 */
export function updateSubscription(id: string, patch: UpdateSubscriptionInput): Subscription {
  const db = getDatabase();
  const existing = getSubscriptionById(id);

  if (!existing) {
    throw new Error(`Assinatura com ID ${id} não encontrada`);
  }

  const updated: Subscription = {
    ...existing,
    ...patch,
    updated_at: toISOString(new Date()),
  };

  // Recalcula next_due se frequência ou datas mudaram
  if (
    patch.frequency ||
    patch.start_date ||
    patch.custom_interval_days !== undefined
  ) {
    updated.next_due = toISOString(calculateNextDue(updated));
  }

  db.runSync(
    `UPDATE subscriptions SET
      title = ?, amount = ?, participants = ?, frequency = ?,
      custom_interval_days = ?, start_date = ?, end_date = ?,
      next_due = ?, auto_renew = ?, tags = ?, notes = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      updated.title,
      updated.amount,
      JSON.stringify((updated as any).participants || []),
      updated.frequency,
      updated.custom_interval_days,
      updated.start_date,
      updated.end_date,
      updated.next_due,
      updated.auto_renew ? 1 : 0,
      updated.tags,
      updated.notes,
      updated.updated_at,
      id,
    ]
  );

  return updated;
}

/**
 * Deleta uma assinatura
 */
export function deleteSubscription(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM subscriptions WHERE id = ?', [id]);
}

/**
 * Marca uma assinatura como paga e avança o next_due
 */
export function markAsPaid(id: string): Subscription {
  const subscription = getSubscriptionById(id);
  
  if (!subscription) {
    throw new Error(`Assinatura com ID ${id} não encontrada`);
  }

  const newNextDue = toISOString(calculateNextDue(subscription, new Date(subscription.next_due)));
  
  return updateSubscription(id, { next_due: newNextDue } as any);
}

/**
 * Busca assinaturas por filtros
 */
export function searchSubscriptions(filters: {
  active?: boolean;
  tags?: string[];
}): Subscription[] {
  const all = getAllSubscriptions();
  
  return all.filter((sub) => {
    // Filtro de ativo/inativo (baseado em end_date e auto_renew)
    if (filters.active !== undefined) {
      // Regra: se existe `end_date`, a assinatura é considerada ativa até essa data (inclusive).
      // Se não existe `end_date`, consideramos ativa apenas quando `auto_renew` está true.
      const today = new Date();
      let isActive: boolean;
      if (sub.end_date) {
        isActive = new Date(sub.end_date) >= today;
      } else {
        isActive = Boolean(sub.auto_renew);
      }
      if (filters.active !== isActive) return false;
    }

    // Filtro de tags
    if (filters.tags && filters.tags.length > 0) {
      const subTags = sub.tags ? sub.tags.split(',').map(t => t.trim()) : [];
      const hasTag = filters.tags.some(tag => subTags.includes(tag));
      if (!hasTag) return false;
    }

    return true;
  });
}

/**
 * Remove linhas automáticas do tipo "Icon: <name>" nas notas de todas as assinaturas.
 * Retorna o número de registros atualizados.
 */
export function removeIconNotesFromAll(): number {
  const db = getDatabase();
  const rows = db.getAllSync('SELECT id, notes FROM subscriptions');
  let updated = 0;

  rows.forEach((r: any) => {
    const notes = r.notes || '';
    if (/^Icon:\s*[^\r\n]*/i.test(notes)) {
      const cleaned = notes.replace(/^Icon:\s*[^\r\n]*(\r?\n)?/i, '').trim() || null;
      db.runSync('UPDATE subscriptions SET notes = ?, updated_at = ? WHERE id = ?', [cleaned, toISOString(new Date()), r.id]);
      updated++;
    }
  });

  return updated;
}

/**
 * Agrega o quanto cada participante deve somando todas as assinaturas em que aparece.
 * Retorna um array de objetos: { name, totalCents, subscriptions: [{ id, title, shareCents }] }
 * Regra de negócio aplicada: se uma assinatura tem N participantes, o total por pessoa é
 * amount / (N + 1) (ou seja, inclui automaticamente o usuário do app). Se não há
 * participantes na assinatura, o usuário assume 100%.
 */
export function getParticipantTotals() {
  const all = getAllSubscriptions();
  const map: Record<string, { name: string; totalCents: number; subscriptions: { id: string; title: string; shareCents: number }[] }> = {};

  all.forEach((sub) => {
    const partList = sub.participants || [];
    // Determine recipients: participants by name + the app user (unless there are 0 participants -> user only)
    const recipients = partList.length === 0 ? ['Você'] : [...(partList.map((p: any) => (p && p.name) ? p.name : 'Desconhecido')), 'Você'];
    const totalCents = Number(sub.amount) || 0; // amount stored in cents

    // Distribute cents fairly so sum(parts) == totalCents
    const base = Math.floor(totalCents / recipients.length);
    let remainder = totalCents - base * recipients.length;

    // assign shares deterministically by sorting recipient names so distribution is stable
    const sortedRecipients = recipients.slice().map(r => ({ name: r })).sort((a, b) => a.name.localeCompare(b.name));

    sortedRecipients.forEach((r) => {
      let share = base;
      if (remainder > 0) {
        share += 1;
        remainder -= 1;
      }

      const displayName = (r.name || 'Desconhecido').toString();
      const key = displayName.trim().toLowerCase();
      if (!map[key]) map[key] = { name: displayName, totalCents: 0, subscriptions: [] };
      map[key].totalCents += share;
      map[key].subscriptions.push({ id: sub.id, title: sub.title, shareCents: share });
    });
  });

  return Object.values(map).map(v => ({
    name: v.name,
    totalCents: v.totalCents,
    total: (v.totalCents / 100).toFixed(2),
    subscriptions: v.subscriptions,
  }));
}

/**
 * Migra participantes inline (array de objetos com `name`) para registros persistidos
 * em `participantsDao` e cria links (participant -> subscriptionId) para facilitar
 * agregação por participante no futuro. Esta migração NÃO altera o formato atual
 * salvo em `subscriptions` (mantemos compatibilidade), ela apenas garante que
 * participantes existam de forma global e que cada participante contenha `subscriptionIds`.
 */
export async function migrateInlineParticipantsToParticipantsDao(participantsDao: any) {
  const all = getAllSubscriptions();
  for (const sub of all) {
    const inline = sub.participants || [];
    if (inline.length === 0) continue;
    for (const p of inline) {
      const name = (p && p.name) ? p.name : null;
      if (!name) continue;
      const participant = await participantsDao.findOrCreateByName(name);
      await participantsDao.addSubscriptionToParticipant(participant.id, sub.id);
    }
  }
}

/**
 * Retorna agregação usando a tabela de participantes persistidos quando disponível.
 * Se não houver participantes persistidos, cairá de volta para `getParticipantTotals()`.
 */
export async function getParticipantTotalsFromDao(participantsDao: any) {
  await participantsDao.initParticipantsDB();
  const parts = participantsDao.getAllParticipants() || [];
  // if no persisted participants, fall back to inline aggregation
  if (!parts || parts.length === 0) return getParticipantTotals();

  const subs = getAllSubscriptions();

  // Build aggregation map by computing deterministic cent distribution per subscription
  // Use normalized keys (trim+lowercase) so persisted participant names match subscription participant names
  const aggMap: Record<string, { name: string; totalCents: number; subscriptions: { id: string; title: string; shareCents: number }[] }> = {};

  subs.forEach((s) => {
    const partList = s.participants || [];
    const recipients = partList.length === 0 ? ['Você'] : [...(partList.map((p: any) => (p && p.name) ? p.name : 'Desconhecido')), 'Você'];
    const totalCents = Number(s.amount) || 0;
    const base = Math.floor(totalCents / recipients.length);
    let remainder = totalCents - base * recipients.length;
    const sortedRecipients = recipients.slice().map(r => ({ name: r })).sort((a, b) => a.name.localeCompare(b.name));

    sortedRecipients.forEach((r) => {
      let share = base;
      if (remainder > 0) {
        share += 1;
        remainder -= 1;
      }
      const displayName = (r.name || 'Desconhecido').toString();
      const key = displayName.trim().toLowerCase();
      if (!aggMap[key]) aggMap[key] = { name: displayName, totalCents: 0, subscriptions: [] };
      aggMap[key].totalCents += share;
      aggMap[key].subscriptions.push({ id: s.id, title: s.title, shareCents: share });
    });
  });

  // Build result from persisted participants list plus any 'Você' aggregate
  const result = parts.map((p: any) => {
    const normalized = (p.name || '').toString().trim().toLowerCase();
    const rec = aggMap[normalized] || { name: p.name, totalCents: 0, subscriptions: [] };
    return { name: rec.name, totalCents: rec.totalCents, total: (rec.totalCents / 100).toFixed(2), subscriptions: rec.subscriptions };
  });

  // include 'Você' if present in aggMap but not in persisted parts
  const youKey = 'você'.toLowerCase();
  if (aggMap[youKey] && !parts.some((x: any) => (x.name || '').toString().trim().toLowerCase() === youKey)) {
    const y = aggMap[youKey];
    result.push({ name: y.name, totalCents: y.totalCents, total: (y.totalCents / 100).toFixed(2), subscriptions: y.subscriptions });
  }

  return result;
}
