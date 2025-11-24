// Static map of presetId -> required image asset.
// Metro bundler requires static require() calls, so we centralize them here.
const iconMap: { [key: string]: any } = {
  'netflix': require('../../assets/icons/netflix.png'),
  'spotify': require('../../assets/icons/spotify.png'),
  'amazon-prime': require('../../assets/icons/amazon-prime.png'),
  'disneyplus': require('../../assets/icons/disneyplus.png'),
  'globoplay': require('../../assets/icons/globoplay.png'),
  'hbomax': require('../../assets/icons/hbomax.png'),
  'paramount': require('../../assets/icons/paramount.png'),
  'appletv': require('../../assets/icons/appletv.png'),
  'apple-music': require('../../assets/icons/apple-music.png'),
  'youtube-premium': require('../../assets/icons/youtube-premium.png'),
  'google-one': require('../../assets/icons/google-one.png'),
  'onedrive-microsoft365': require('../../assets/icons/onedrive-microsoft365.png'),
  'icloud': require('../../assets/icons/icloud.png'),
  'chatgpt': require('../../assets/icons/chatgpt.png'),
  'google-ai': require('../../assets/icons/google-ai.png'),
  'crunchyroll': require('../../assets/icons/crunchyroll.png'),
  'telecine': require('../../assets/icons/telecine.png'),
  'looke': require('../../assets/icons/looke.png'),
  'assinaweb': require('../../assets/icons/assinaweb.png'),
};

export default iconMap;
