export type FrequencyType = 'monthly' | 'yearly' | 'weekly' | 'daily' | 'custom';

export interface Subscription {
  id: string;
  title: string;
  amount: number; // Valor em centavos para evitar problemas de precisão
  participants?: { name: string; isMe?: boolean }[];
  frequency: FrequencyType;
  custom_interval_days: number | null;
  start_date: string; // ISO 8601
  end_date: string | null; // ISO 8601
  next_due: string; // ISO 8601
  auto_renew: boolean;
  tags: string; // JSON stringified array ou separado por vírgulas
  notes: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export type CreateSubscriptionInput = Omit<Subscription, 'id' | 'created_at' | 'updated_at' | 'next_due'>;

export type UpdateSubscriptionInput = Partial<CreateSubscriptionInput>;
