import { toISOString } from '../utils/dateUtils';
import { readJsonFile, writeJsonFile } from './index';

const PARTICIPANTS_FILE = `participants_db.json`;

type Participant = { id: string; name: string; isMe?: boolean; subscriptionIds?: string[]; created_at: string; updated_at?: string };

let participants: Participant[] = [];
let initialized = false;

async function persist() {
  try {
    await writeJsonFile(PARTICIPANTS_FILE, participants);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to persist participants DB:', e);
  }
}

export async function initParticipantsDB(): Promise<void> {
  if (initialized) return;
  try {
    const content = await readJsonFile(PARTICIPANTS_FILE);
    if (content) {
      participants = content as Participant[];
    } else {
      participants = [];
      await writeJsonFile(PARTICIPANTS_FILE, participants);
    }
    initialized = true;
    // eslint-disable-next-line no-console
    console.log('✅ Participants DB initialized (file-backed)');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro initParticipantsDB:', error);
    participants = [];
    initialized = true;
  }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getAllParticipants(): Participant[] {
  return participants.slice();
}

export function getParticipantById(id: string): Participant | null {
  return participants.find(p => p.id === id) || null;
}

export async function createParticipant(name: string, opts?: { isMe?: boolean }): Promise<Participant> {
  await initParticipantsDB();
  const existing = participants.find(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (existing) return existing;
  const now = toISOString(new Date());
  const p = { id: generateUUID(), name: name.trim(), isMe: !!opts?.isMe, subscriptionIds: [], created_at: now } as Participant;
  participants.push(p);
  await persist();
  return p;
}

export async function findOrCreateByName(name: string): Promise<Participant> {
  await initParticipantsDB();
  const existing = participants.find(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (existing) return existing;
  return createParticipant(name);
}

export async function updateParticipant(id: string, patch: Partial<Participant>): Promise<Participant | null> {
  await initParticipantsDB();
  const idx = participants.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const updated = { ...participants[idx], ...patch, updated_at: toISOString(new Date()) };
  participants[idx] = updated;
  await persist();
  return updated;
}

/**
 * Marca o participante indicado como o usuário 'Você' e desmarca qualquer outro.
 * Retorna o participante atualizado ou null.
 */
export async function setParticipantAsMe(id: string): Promise<Participant | null> {
  await initParticipantsDB();
  // desmarcar qualquer outro
  let changed = false;
  participants = participants.map((p) => {
    if (p.id === id) return p; // keep target for now
    if (p.isMe) {
      changed = true;
      return { ...p, isMe: false, updated_at: toISOString(new Date()) };
    }
    return p;
  });

  const idx = participants.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const now = toISOString(new Date());
  participants[idx] = { ...participants[idx], isMe: true, updated_at: now } as Participant;
  await persist();
  return participants[idx];
}

export async function deleteParticipant(id: string): Promise<boolean> {
  await initParticipantsDB();
  const before = participants.length;
  participants = participants.filter(p => p.id !== id);
  const removed = participants.length < before;
  if (removed) await persist();
  return removed;
}

export async function addSubscriptionToParticipant(participantId: string, subscriptionId: string): Promise<void> {
  await initParticipantsDB();
  const p = participants.find(x => x.id === participantId);
  if (!p) return;
  p.subscriptionIds = p.subscriptionIds || [];
  if (!p.subscriptionIds.includes(subscriptionId)) {
    p.subscriptionIds.push(subscriptionId);
    p.updated_at = toISOString(new Date());
    await persist();
  }
}

export async function removeSubscriptionFromParticipant(participantId: string, subscriptionId: string): Promise<void> {
  await initParticipantsDB();
  const p = participants.find(x => x.id === participantId);
  if (!p || !p.subscriptionIds) return;
  const before = p.subscriptionIds.length;
  p.subscriptionIds = p.subscriptionIds.filter(id => id !== subscriptionId);
  if (p.subscriptionIds.length < before) {
    p.updated_at = toISOString(new Date());
    await persist();
  }
}

export async function clearParticipants(): Promise<void> {
  participants = [];
  await persist();
}

export default {
  initParticipantsDB,
  getAllParticipants,
  getParticipantById,
  createParticipant,
  findOrCreateByName,
  updateParticipant,
  deleteParticipant,
  clearParticipants,
  addSubscriptionToParticipant,
  removeSubscriptionFromParticipant,
  setParticipantAsMe,
};
