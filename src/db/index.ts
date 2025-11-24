// Use the legacy export to keep `getInfoAsync` / `readAsStringAsync` APIs
// without runtime deprecation errors. The deprecation message suggests either
// migrating to the new File/Directory classes or importing the legacy API.
import * as FileSystem from 'expo-file-system/legacy';

type Row = any;

// `expo-file-system`'s typings can sometimes make `documentDirectory` unavailable
// in this project's TS configuration. Cast to `any` and fallback to `cacheDirectory`
// to avoid the TS error while keeping runtime behavior.
const BASE_DIR = ((FileSystem as any).documentDirectory) || ((FileSystem as any).cacheDirectory) || '';
const DB_FILE = `${BASE_DIR}subscriptions_db.json`;

let memoryRows: Row[] = [];
let initialized = false;

function persistToDisk() {
  // fire-and-forget
  FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(memoryRows, null, 2)).catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Failed to persist DB:', e);
  });
}

/**
 * Carrega o arquivo DB para memória (se existir)
 */
export async function initDatabase(): Promise<void> {
  if (initialized) return;
  try {
    const info = await FileSystem.getInfoAsync(DB_FILE);
    if (info.exists) {
      const content = await FileSystem.readAsStringAsync(DB_FILE);
      memoryRows = JSON.parse(content) as Row[];
    } else {
      memoryRows = [];
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(memoryRows, null, 2));
    }
    initialized = true;
    // eslint-disable-next-line no-console
    console.log('✅ Database initialized (file-backed)');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro initDatabase:', error);
    memoryRows = [];
    initialized = true;
  }
}

/**
 * Limpa o DB
 */
export async function clearDatabase(): Promise<void> {
  memoryRows = [];
  await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(memoryRows, null, 2));
  // eslint-disable-next-line no-console
  console.log('🗑️  Database cleared');
}

/**
 * Retorna um "db" com a API síncrona que o DAO espera.
 * Implementação limitada, suficiente para as queries usadas atualmente.
 */
export function getDatabase() {
  // Helper simples
  function sortByNextDue(rows: Row[]) {
    return rows.slice().sort((a, b) => {
      const ta = new Date(a.next_due).getTime();
      const tb = new Date(b.next_due).getTime();
      return ta - tb;
    });
  }

  return {
    // SELECT * FROM subscriptions ORDER BY next_due ASC
    getAllSync: (sql: string) => {
      if (/ORDER\s+BY\s+next_due/i.test(sql)) {
        return sortByNextDue(memoryRows);
      }
      return memoryRows.slice();
    },

    // SELECT * FROM subscriptions WHERE id = ?
    getFirstSync: (sql: string, params?: any[]) => {
      const m = sql.match(/WHERE\s+id\s*=\s*\?/i);
      if (m && params && params[0]) {
        const id = params[0];
        return memoryRows.find((r) => r.id === id) || null;
      }
      // fallback: return first row
      return memoryRows.length > 0 ? memoryRows[0] : null;
    },

    // INSERT / UPDATE / DELETE rudimentar
    runSync: (sql: string, params?: any[]) => {
      const trimmed = sql.trim().toUpperCase();

      if (trimmed.startsWith('INSERT')) {
        // Expect params in one of two shapes (backwards-compatible):
        // Legacy: [id, title, amount, currency, frequency, custom_interval_days, start_date, end_date, next_due, auto_renew, tags, notes, created_at, updated_at]
        // New:    [id, title, amount, participantsJson, frequency, custom_interval_days, start_date, end_date, next_due, auto_renew, tags, notes, created_at, updated_at]
        const p = params || [];
        let id, title, amount, participantsJson, frequency, custom_interval_days, start_date, end_date, next_due, auto_renew, tags, notes, created_at, updated_at;

        if (p.length >= 14 && typeof p[3] === 'string' && (p[3].trim().startsWith('[') || p[3].trim().startsWith('{'))) {
          // New shape
          [id, title, amount, participantsJson, frequency, custom_interval_days, start_date, end_date, next_due, auto_renew, tags, notes, created_at, updated_at] = p;
        } else {
          // Legacy: treat the 4th param as currency (keep for compatibility) and set participants empty
          const currency = p[3];
          participantsJson = '[]';
          [id, title, amount, /*currency*/ , frequency, custom_interval_days, start_date, end_date, next_due, auto_renew, tags, notes, created_at, updated_at] = p;
        }

        const row: Row = {
          id,
          title,
          amount,
          participants: participantsJson ? (typeof participantsJson === 'string' ? participantsJson : JSON.stringify(participantsJson)) : '[]',
          frequency,
          custom_interval_days,
          start_date,
          end_date,
          next_due,
          auto_renew: Boolean(auto_renew),
          tags,
          notes,
          created_at,
          updated_at,
        };

        memoryRows.push(row);
        persistToDisk();
        return;
      }

      if (trimmed.startsWith('UPDATE')) {
        // Support updated shapes:
        // Legacy: [title, amount, currency, frequency, custom_interval_days, start_date, end_date, next_due, auto_renew, tags, notes, updated_at, id]
        // New:    [title, amount, participantsJson, frequency, custom_interval_days, start_date, end_date, next_due, auto_renew, tags, notes, updated_at, id]
        const p = params || [];
        let title, amount, participantsJson, frequency, custom_interval_days, start_date, end_date, next_due, auto_renew, tags, notes, updated_at, id;

        if (p.length >= 13 && typeof p[2] === 'string' && (p[2].trim().startsWith('[') || p[2].trim().startsWith('{'))) {
          // New shape
          [title, amount, participantsJson, frequency, custom_interval_days, start_date, end_date, next_due, auto_renew, tags, notes, updated_at, id] = p;
        } else {
          // Legacy: participants empty
          participantsJson = '[]';
          [title, amount, /*currency*/ , frequency, custom_interval_days, start_date, end_date, next_due, auto_renew, tags, notes, updated_at, id] = p;
        }

        const idx = memoryRows.findIndex((r) => r.id === id);
        if (idx >= 0) {
          memoryRows[idx] = {
            ...memoryRows[idx],
            title,
            amount,
            participants: participantsJson ? (typeof participantsJson === 'string' ? participantsJson : JSON.stringify(participantsJson)) : '[]',
            frequency,
            custom_interval_days,
            start_date,
            end_date,
            next_due,
            auto_renew: Boolean(auto_renew),
            tags,
            notes,
            updated_at,
          };
          persistToDisk();
        }
        return;
      }

      if (trimmed.startsWith('DELETE')) {
        // DELETE FROM subscriptions WHERE id = ?
        const m = sql.match(/WHERE\s+id\s*=\s*\?/i);
        if (m && params && params[0]) {
          const id = params[0];
          memoryRows = memoryRows.filter((r) => r.id !== id);
          persistToDisk();
        } else {
          // DELETE FROM subscriptions; (clear)
          memoryRows = [];
          persistToDisk();
        }
        return;
      }

      // fallback: no-op (CREATE TABLE, CREATE INDEX, etc.)
      return;
    },

    // usado na inicialização para executar DDL; aqui é no-op
    execSync: (_sql: string) => {
      // noop - mantemos compatibilidade com chamadas de criação de tabela/index
      return;
    },
  };
}

/**
 * Helpers to read/write arbitrary JSON files next to the main DB file.
 * Centralizes FileSystem usage so consumers don't call native APIs directly.
 */
export async function readJsonFile(fileName: string): Promise<any | null> {
  const path = `${BASE_DIR}${fileName}`;
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      const content = await FileSystem.readAsStringAsync(path);
      return JSON.parse(content);
    }
    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Erro readJsonFile(${fileName}):`, error);
    return null;
  }
}

export async function writeJsonFile(fileName: string, data: any): Promise<void> {
  const path = `${BASE_DIR}${fileName}`;
  try {
    await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Erro writeJsonFile(${fileName}):`, error);
  }
}
