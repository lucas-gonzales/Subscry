export type IconItem = {
  id: string;
  name: string; // MaterialCommunityIcons name
  label: string;
  color?: string;
};

export const iconCollection: IconItem[] = [
  { id: 'tv', name: 'television-play', label: 'TV', color: '#6C5CE7' },
  { id: 'music', name: 'music', label: 'Música', color: '#1DB954' },
  { id: 'shopping', name: 'shopping', label: 'Compras', color: '#00A8E1' },
  { id: 'cloud', name: 'cloud', label: 'Nuvem', color: '#4285F4' },
  { id: 'apple', name: 'apple', label: 'Apple', color: '#000' },
  { id: 'youtube', name: 'youtube', label: 'YouTube', color: '#FF0000' },
  { id: 'film', name: 'film', label: 'Filmes', color: '#FF5722' },
  { id: 'robot', name: 'robot', label: 'IA', color: '#00A67E' },
  { id: 'heart', name: 'heart-pulse', label: 'Saúde', color: '#FF6B6B' },
  { id: 'file', name: 'file-document-outline', label: 'Docs', color: '#6A1B9A' },
  { id: 'game', name: 'gamepad-variant', label: 'Games', color: '#FF7043' },
  { id: 'wallet', name: 'wallet', label: 'Finanças', color: '#00C896' },
  { id: 'generic', name: 'dots-horizontal', label: 'Outro', color: '#9E9E9E' },
];

export default iconCollection;
