export type Plan = {
  id: string;
  name: string;
  price_cents: number;
  annual_price_cents?: number | null;
  currency: string;
  frequency: 'monthly' | 'yearly' | 'weekly' | 'daily' | 'custom';
};

export type Preset = {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  category?: string;
  plans: Plan[];
};

export const presets: Preset[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    icon: 'television-play',
    color: '#E50914',
    category: 'video',
    plans: [
      { id: 'netflix-ads', name: 'Com anúncios (Mensal)', price_cents: 2090, currency: 'BRL', frequency: 'monthly' },
      { id: 'netflix-standard', name: 'Padrão (Mensal)', price_cents: 4490, currency: 'BRL', frequency: 'monthly' },
      { id: 'netflix-premium', name: 'Premium (Mensal)', price_cents: 5990, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: 'music',
    color: '#1DB954',
    category: 'music',
    plans: [
      { id: 'spotify-individual', name: 'Individual (Mensal)', price_cents: 2390, currency: 'BRL', frequency: 'monthly' },
      { id: 'spotify-duo', name: 'Duo (Mensal)', price_cents: 3190, currency: 'BRL', frequency: 'monthly' },
      { id: 'spotify-family', name: 'Família (Mensal)', price_cents: 4090, currency: 'BRL', frequency: 'monthly' },
      { id: 'spotify-student', name: 'Universitário (Mensal)', price_cents: 1290, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  {
    id: 'amazon-prime',
    name: 'Amazon Prime',
    icon: 'shopping',
    color: '#00A8E1',
    category: 'video',
    plans: [
      { id: 'prime-monthly', name: 'Prime Mensal', price_cents: 1290, currency: 'BRL', frequency: 'monthly' },
      { id: 'prime-yearly', name: 'Prime Anual', price_cents: 11900, currency: 'BRL', frequency: 'yearly' },
    ],
  },
  {
    id: 'disneyplus',
    name: 'Disney+',
    icon: 'television',
    color: '#113CCF',
    category: 'video',
    plans: [
      { id: 'disney-ad', name: 'Padrão com anúncios (Mensal)', price_cents: 2799, currency: 'BRL', frequency: 'monthly' },
      { id: 'disney-standard', name: 'Padrão (Mensal)', price_cents: 4690, currency: 'BRL', frequency: 'monthly', annual_price_cents: 39390 },
      { id: 'disney-premium', name: 'Premium (Mensal)', price_cents: 6690, currency: 'BRL', frequency: 'monthly', annual_price_cents: 56190 },
    ],
  },
  {
    id: 'globoplay',
    name: 'Globoplay',
    icon: 'play-box',
    color: '#FF2D55',
    category: 'video',
    plans: [
      { id: 'globoplay-ad', name: 'Padrão com anúncios (Mensal)', price_cents: 2290, currency: 'BRL', frequency: 'monthly', annual_price_cents: 17880 },
      { id: 'globoplay-premium', name: 'Premium / Combo (Mensal)', price_cents: 5490, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  {
    id: 'hbomax',
    name: 'Max',
    icon: 'filmstrip',
    color: '#4E2A8E',
    category: 'video',
    plans: [
      { id: 'max-basic', name: 'Básico (com anúncios) (Mensal)', price_cents: 2990, currency: 'BRL', frequency: 'monthly', annual_price_cents: 27480 },
      { id: 'max-standard', name: 'Standard (Mensal)', price_cents: 4490, currency: 'BRL', frequency: 'monthly', annual_price_cents: 41880 },
      { id: 'max-platinum', name: 'Platinum (Mensal)', price_cents: 5590, currency: 'BRL', frequency: 'monthly', annual_price_cents: 53880 },
    ],
  },
  {
    id: 'paramount',
    name: 'Paramount+',
    icon: 'television-classic',
    color: '#1434A4',
    category: 'video',
    plans: [
      { id: 'paramount-basic', name: 'Básico (Mensal)', price_cents: 1890, currency: 'BRL', frequency: 'monthly', annual_price_cents: 16990 },
      { id: 'paramount-standard', name: 'Padrão (Mensal)', price_cents: 2790, currency: 'BRL', frequency: 'monthly', annual_price_cents: 24990 },
      { id: 'paramount-premium', name: 'Premium (Mensal)', price_cents: 3490, currency: 'BRL', frequency: 'monthly', annual_price_cents: 30990 },
    ],
  },
  {
    id: 'appletv',
    name: 'Apple TV+',
    icon: 'apple',
    color: '#000000',
    category: 'video',
    plans: [
      { id: 'appletv-monthly', name: 'Mensal', price_cents: 2990, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  // Music / audio alternatives
  {
    id: 'apple-music',
    name: 'Apple Music',
    icon: 'music-note',
    color: '#FA2D48',
    category: 'music',
    plans: [
      { id: 'applemusic-individual', name: 'Individual (Mensal)', price_cents: 2190, currency: 'BRL', frequency: 'monthly' },
      { id: 'applemusic-family', name: 'Família (Mensal)', price_cents: 3490, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    icon: 'youtube',
    color: '#FF0000',
    category: 'music',
    plans: [
      { id: 'ytp-individual', name: 'Individual (Mensal)', price_cents: 2690, currency: 'BRL', frequency: 'monthly', annual_price_cents: 26900 },
    ],
  },
  // Cloud / productivity
  {
    id: 'google-one',
    name: 'Google One',
    icon: 'cloud',
    color: '#4285F4',
    category: 'cloud',
    plans: [
      { id: 'google-200gb', name: '200 GB / Google AI Plus (Mensal)', price_cents: 2499, currency: 'BRL', frequency: 'monthly' },
      { id: 'google-2tb', name: '2 TB (Mensal)', price_cents: 9699, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  {
    id: 'onedrive-microsoft365',
    name: 'Microsoft 365',
    icon: 'microsoft',
    color: '#0078D4',
    category: 'productivity',
    plans: [
      { id: 'ms365-personal-monthly', name: 'Personal (Mensal)', price_cents: 5100, currency: 'BRL', frequency: 'monthly', annual_price_cents: 50900 },
      { id: 'ms365-family-monthly', name: 'Family (Mensal)', price_cents: 6000, currency: 'BRL', frequency: 'monthly', annual_price_cents: 59900 },
    ],
  },
  {
    id: 'icloud',
    name: 'iCloud+',
    icon: 'cloud-outline',
    color: '#34AADC',
    category: 'cloud',
    plans: [
      { id: 'icloud-50gb', name: '50 GB (Mensal)', price_cents: 399, currency: 'BRL', frequency: 'monthly' },
      { id: 'icloud-2tb', name: '2 TB (Mensal)', price_cents: 2490, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  // AI / ChatGPT / tools
  {
    id: 'chatgpt',
    name: 'ChatGPT / OpenAI',
    icon: 'robot',
    color: '#00A67E',
    category: 'ai',
    plans: [
      { id: 'chatgpt-plus', name: 'Plus (Mensal)', price_cents: 2000, currency: 'BRL', frequency: 'monthly' },
      { id: 'chatgpt-pro', name: 'Pro (Mensal)', price_cents: 5990, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  {
    id: 'google-ai',
    name: 'Google AI',
    icon: 'google',
    color: '#4285F4',
    category: 'ai',
    plans: [
      { id: 'googleai-pro', name: 'Pro (Mensal)', price_cents: 9699, currency: 'BRL', frequency: 'monthly' },
      { id: 'googleai-ultra', name: 'Ultra (Mensal)', price_cents: 19900, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  // Health & telemedicine
  {
    id: 'telemed',
    name: 'Clube Saúde / Telemedicina',
    icon: 'heart-pulse',
    color: '#FF6B6B',
    category: 'health',
    plans: [
      { id: 'telemed-basic', name: 'Básico (Mensal)', price_cents: 1990, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  // Niche services
  {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    icon: 'popcorn',
    color: '#F26822',
    category: 'video',
    plans: [
      { id: 'crunchyroll-premium', name: 'Premium (Mensal)', price_cents: 2590, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  {
    id: 'telecine',
    name: 'Telecine',
    icon: 'film',
    color: '#FF5722',
    category: 'video',
    plans: [
      { id: 'telecine-monthly', name: 'Mensal', price_cents: 1990, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  {
    id: 'looke',
    name: 'Looke',
    icon: 'filmstrip-box',
    color: '#00C853',
    category: 'video',
    plans: [
      { id: 'looke-monthly', name: 'Aluguel / Compra', price_cents: 0, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  // Documents / digital-signature
  {
    id: 'assinaweb',
    name: 'AssinaWeb',
    icon: 'file-document-outline',
    color: '#6A1B9A',
    category: 'documents',
    plans: [
      { id: 'assinaweb-basic', name: 'Basic (Mensal)', price_cents: 990, currency: 'BRL', frequency: 'monthly' },
    ],
  },
  // Placeholder for other services — users can add more via app settings
  {
    id: 'other',
    name: 'Outro / Personalizado',
    icon: 'dots-horizontal',
    color: '#9E9E9E',
    category: 'other',
    plans: [
      { id: 'custom-monthly', name: 'Mensal (Custom)', price_cents: 0, currency: 'BRL', frequency: 'monthly' },
    ],
  },
];

export default presets;
