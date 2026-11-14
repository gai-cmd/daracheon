// Bundled icon and service-mark markup of the team console (SPEC-CONSOLE-001 REQ-CON-022, design.md §6.1).
// Ported from the approved prototype. Constant SVG inner markup only: no user data, no external
// reference. `{u}` in a mark is replaced with a per-instance id so gradients never collide.
// Rendered through dangerouslySetInnerHTML only because the strings are constants of this module.

/** Line icons drawn on a 24x24 grid with currentColor strokes. */
export const ICONS: Readonly<Record<string, string>> = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.8" r=".7" fill="currentColor" stroke="none"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  sortUp: '<path d="M12 18V6M7 11l5-5 5 5"/>',
  sortDown: '<path d="M12 6v12M7 13l5 5 5-5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.7.4-1.2.9-1.2 1.7v.4"/><circle cx="12" cy="16.8" r=".7" fill="currentColor" stroke="none"/>',
  download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
  upload: '<path d="M12 20V9"/><path d="m7 14 5-5 5 5"/><path d="M5 4h14"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4.5V9h4.5"/>',
  logout: '<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M10 16l-4-4 4-4M6 12h9"/>',
  home: '<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z"/>',
  list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.8" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.8" cy="17.5" r="1.1" fill="currentColor" stroke="none"/>',
  key: '<circle cx="8" cy="15.5" r="4"/><path d="m11 12.5 8.5-8.5M16 7l2.5 2.5M13.5 9.5 15.5 11.5"/>',
  star: '<path d="m12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8z"/>',
  starFill: '<path d="m12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8z" fill="currentColor"/>',
  edit: '<path d="M4 20h4L18.6 9.4a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14 8 3 3"/>',
  trash: '<path d="M4.5 7h15M9.5 7V5.2c0-.7.5-1.2 1.2-1.2h2.6c.7 0 1.2.5 1.2 1.2V7M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.6c.5-.1.9-.1 1.4-.1 6 0 9.5 6.5 9.5 6.5a16.7 16.7 0 0 1-3 3.8M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.5 0 2.9-.4 4.1-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  grip: '<circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  flag: '<path d="M5.5 21V4.5"/><path d="M5.5 4.5h11.5l-2.2 4.2L17 13H5.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10.5 5-3v9l-5-3"/>',
  folder: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5z"/>',
  chart: '<path d="M4 20h16"/><path d="M7 16v-4M12 16V7M17 16v-6"/>',
  cart: '<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2.5 3.5h2.8l2.4 11.2a1.2 1.2 0 0 0 1.2.9h9a1.2 1.2 0 0 0 1.2-.9L21 7.5H6"/>',
  sparkles: '<path d="M11 3.5l1.7 4.3 4.3 1.7-4.3 1.7L11 15.5l-1.7-4.3L5 9.5l4.3-1.7z"/><path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  book: '<path d="M3 5h6a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H3z"/><path d="M21 5h-6a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H21z"/>',
  // Bookshelf mark for the built-in wiki (SPEC-CONSOLE-001 REQ-CON-026); distinct from `book`.
  library: '<path d="M3.5 20.5h17"/><rect x="4.5" y="4" width="3.5" height="16.5" rx=".8"/><rect x="9" y="6.5" width="3.5" height="14" rx=".8"/><path d="m14.2 7.6 3.3-.9 3.2 12.8-3.3.9z"/>'
};

// Service marks, simplified for 16-24px, in brand colours (currentColor marks follow the ink colour).
const DOC = (fill: string, fold: string) => '<path d="M6.6 2h7.6l5.1 5.1v13.1c0 1-.8 1.8-1.8 1.8H6.6c-1 0-1.8-.8-1.8-1.8V3.8c0-1 .8-1.8 1.8-1.8z" fill="' + fill + '"/><path d="M14.2 2v3.6c0 .8.7 1.5 1.5 1.5h3.6z" fill="' + fold + '"/>';
export const MARKS: Readonly<Record<string, string>> = {
  youtube: '<rect x="1.5" y="4.5" width="21" height="15" rx="4.5" fill="#FF0000"/><path d="M9.8 8.6v6.8l5.9-3.4z" fill="#fff"/>',
  instagram: '<defs><linearGradient id="ig{u}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FEDA75"/><stop offset=".3" stop-color="#FA7E1E"/><stop offset=".62" stop-color="#D62976"/><stop offset="1" stop-color="#4F5BD5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig{u})"/><rect x="6.2" y="6.2" width="11.6" height="11.6" rx="3.6" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="2.8" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="15.7" cy="8.3" r="1" fill="#fff"/>',
  google: '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>',
  drive: '<path d="M8.5 3h7l7 12h-7z" fill="#FFBA00"/><path d="M8.5 3 12 9 5 21l-3.5-6z" fill="#00AC47"/><path d="M8.5 15h14L19 21H5z" fill="#2684FC"/>',
  sheets: DOC('#0F9D58', '#87CEAC') + '<path d="M8.2 10.6h7.6v6.8H8.2zM8.2 14h7.6M12 10.6v6.8" fill="none" stroke="#fff" stroke-width="1.4"/>',
  docs: DOC('#4285F4', '#A1C2FA') + '<path d="M8.4 11.2h7.2M8.4 14.2h7.2M8.4 17.2h4.6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>',
  slides: DOC('#F4B400', '#FADA80') + '<rect x="8.2" y="11" width="7.6" height="5.8" rx=".8" fill="none" stroke="#fff" stroke-width="1.5"/>',
  ga: '<rect x="15.2" y="2.5" width="5.6" height="19" rx="2.8" fill="#F9AB00"/><rect x="9.2" y="9" width="5.6" height="12.5" rx="2.8" fill="#E37400"/><circle cx="6" cy="18.7" r="2.8" fill="#E37400"/>',
  gsc: '<circle cx="10.4" cy="10.4" r="6.4" fill="none" stroke="#4285F4" stroke-width="2.6"/><path d="m15.2 15.2 5.4 5.4" stroke="#34A853" stroke-width="3" stroke-linecap="round"/><path d="M8.2 12.4v-1.6M10.4 12.4V8.4M12.6 12.4v-2.6" stroke="#EA4335" stroke-width="1.6" stroke-linecap="round"/>',
  gadmin: '<path d="M12 2.4 20 5.4v6c0 4.9-3.4 8.7-8 10.2-4.6-1.5-8-5.3-8-10.2v-6z" fill="#4285F4"/><circle cx="12" cy="10" r="2.6" fill="#fff"/><path d="M7.9 16.3c.9-2 2.4-3 4.1-3s3.2 1 4.1 3" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>',
  naver: '<rect x="2" y="2" width="20" height="20" rx="5" fill="#03C75A"/><path d="M7.5 6.5H11l2 3.5V6.5h3.5v11H13l-2-3.5v3.5H7.5z" fill="#fff"/>',
  nblog: '<rect x="2" y="2" width="20" height="20" rx="5" fill="#03C75A"/><path d="M6 7.4C6 6.6 6.6 6 7.4 6h9.2c.8 0 1.4.6 1.4 1.4v6.7c0 .8-.6 1.4-1.4 1.4h-4.4L9.4 18v-2.5h-2c-.8 0-1.4-.6-1.4-1.4z" fill="#fff"/><path d="M10.2 8v5.3M10.2 11.6a1.9 1.9 0 1 0 3.8 0 1.9 1.9 0 1 0-3.8 0" fill="none" stroke="#03C75A" stroke-width="1.5" stroke-linecap="round"/>',
  nstore: '<path d="M4.6 8h14.8l-1 12.1c-.1.8-.8 1.4-1.6 1.4H7.2c-.8 0-1.5-.6-1.6-1.4z" fill="#03C75A"/><path d="M8.7 8V6.7a3.3 3.3 0 0 1 6.6 0V8" fill="none" stroke="#03C75A" stroke-width="1.8"/><path d="M9.4 11.4h1.9l1.4 2.4v-2.4h1.9v6.2h-1.9l-1.4-2.4v2.4H9.4z" fill="#fff"/>',
  nsearch: '<rect x="2" y="2" width="20" height="20" rx="5" fill="#03C75A"/><circle cx="11" cy="11" r="4.3" fill="none" stroke="#fff" stroke-width="2"/><path d="m14.2 14.2 3.4 3.4" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
  slack: '<rect x="2.6" y="8.6" width="8.8" height="2.8" rx="1.4" fill="#36C5F0"/><rect x="8.6" y="2.6" width="2.8" height="3.8" rx="1.4" fill="#36C5F0"/><rect x="12.6" y="2.6" width="2.8" height="8.8" rx="1.4" fill="#2EB67D"/><rect x="17.6" y="8.6" width="3.8" height="2.8" rx="1.4" fill="#2EB67D"/><rect x="12.6" y="12.6" width="8.8" height="2.8" rx="1.4" fill="#ECB22E"/><rect x="12.6" y="17.6" width="2.8" height="3.8" rx="1.4" fill="#ECB22E"/><rect x="8.6" y="12.6" width="2.8" height="8.8" rx="1.4" fill="#E01E5A"/><rect x="2.6" y="12.6" width="3.8" height="2.8" rx="1.4" fill="#E01E5A"/>',
  github: '<path fill="currentColor" transform="translate(2 2) scale(1.25)" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>',
  vercel: '<path d="M12 3.2 22 20.5H2z" fill="currentColor"/>',
  claude: '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" stroke="#D97757" stroke-width="2.5" stroke-linecap="round"/>',
  openai: '<g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="8.7" y="3.2" width="6.6" height="17.6" rx="3.3"/><rect x="8.7" y="3.2" width="6.6" height="17.6" rx="3.3" transform="rotate(60 12 12)"/><rect x="8.7" y="3.2" width="6.6" height="17.6" rx="3.3" transform="rotate(120 12 12)"/></g>',
  capcut: '<rect x="3" y="5" width="18" height="14" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M7.2 8.8 16.8 15.2M16.8 8.8 7.2 15.2" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  midjourney: '<path d="M12.6 3.4v12.2H4.6z" fill="currentColor"/><path d="M14 6.4l5.4 9.2H14z" fill="currentColor" opacity=".7"/><path d="M3 17.6h18c-1.3 1.9-3.4 3-5.9 3H8.9c-2.5 0-4.6-1.1-5.9-3z" fill="currentColor"/>',
  bing: '<path d="M6.2 2.8 10 4.1v12.6l4.9-2.8-2.4-1.1-1.5-3.8 7.8 2.7v4.4L10 21.2l-3.8-2.1z" fill="#008373"/>',
  n8n: '<g fill="none" stroke="#EA4B71" stroke-width="2"><circle cx="4.8" cy="12" r="2.4"/><circle cx="12.4" cy="12" r="2.4"/><circle cx="19.2" cy="6.6" r="2.4"/><circle cx="19.2" cy="17.4" r="2.4"/><path d="M7.2 12h2.8M14.5 10.6l2.7-2.2M14.5 13.4l2.7 2.2"/></g>'
};
/** Wordmark-only brands get a letter tile; Zoellife and Agarwooding use their own letter marks. */
export const LETTERS: Readonly<Record<string, readonly [string, LetterTone]>> = { zoel: ['Z', 'zoel'], agar: ['A', 'agar'], runway: ['R', 'ink'], did: ['D', 'ink'], kling: ['K', 'ink'], higgsfield: ['H', 'ink'] };

/** Tile style of a letter mark: the brand's own colours or the ink tile. */
export type LetterTone = 'zoel' | 'agar' | 'ink';

/**
 * Picks the service mark from the address, so items staff add get the right icon without choosing
 * one. Without an address a few services are recognised by name.
 */
export function brandOf(url: string, title: string): string | null {
  let host = '';
  let path = '';
  try {
    const x = new URL(url);
    if (/^https?:$/.test(x.protocol)) {
      host = x.hostname.toLowerCase().replace(/^www\./, '');
      path = x.pathname.toLowerCase();
    }
  } catch {
    // no usable address
  }
  const on = (d: string) => host === d || host.endsWith('.' + d);
  if (host) {
    if (on('youtube.com') || host === 'youtu.be') return 'youtube';
    if (on('instagram.com')) return 'instagram';
    if (host === 'docs.google.com') {
      return path.startsWith('/spreadsheets') ? 'sheets' : path.startsWith('/presentation') ? 'slides' : path.startsWith('/document') ? 'docs' : 'drive';
    }
    if (host === 'drive.google.com') return 'drive';
    if (host === 'analytics.google.com') return 'ga';
    if (host === 'search.google.com' && path.startsWith('/search-console')) return 'gsc';
    if (host === 'admin.google.com') return 'gadmin';
    if (on('google.com') || on('labs.google')) return 'google';
    if (host === 'blog.naver.com' || host === 'm.blog.naver.com') return 'nblog';
    if (on('smartstore.naver.com')) return 'nstore';
    if (on('searchadvisor.naver.com') || on('searchad.naver.com')) return 'nsearch';
    if (on('naver.com')) return 'naver';
    if (on('slack.com')) return 'slack';
    if (on('github.com')) return 'github';
    if (host.includes('agarwooding')) return 'agar';
    if (on('zoellife.com') || host === 'zoel-workshop.vercel.app' || /^daracheon-/.test(host)) return 'zoel';
    if (on('vercel.com') || on('vercel.app')) return 'vercel';
    if (on('claude.ai') || on('claude.com') || on('anthropic.com')) return 'claude';
    if (on('chatgpt.com') || on('openai.com')) return 'openai';
    if (on('capcut.com')) return 'capcut';
    if (on('midjourney.com')) return 'midjourney';
    if (on('bing.com')) return 'bing';
    if (on('n8n.io') || on('n8n.cloud')) return 'n8n';
    if (on('runwayml.com')) return 'runway';
    if (on('d-id.com')) return 'did';
    if (on('klingai.com')) return 'kling';
    if (on('higgsfield.ai')) return 'higgsfield';
    return null;
  }
  const s = String(title || '').toLowerCase();
  const byName: [RegExp, string][] = [
    [/kling/, 'kling'],
    [/higgsfield/, 'higgsfield'],
    [/midjourney/, 'midjourney'],
    [/youtube|유튜브/, 'youtube'],
    [/instagram|인스타/, 'instagram'],
    [/smart ?store|스마트스토어/, 'nstore'],
    [/capcut/, 'capcut'],
    [/runway/, 'runway'],
  ];
  for (const [re, k] of byName) if (re.test(s)) return k;
  return null;
}

/** First letter or digit of a title, upper-cased; '·' when there is none. */
export function firstChar(s: string): string {
  const m = String(s || '').match(/[\p{L}\p{N}]/u);
  return m ? m[0].toUpperCase() : '·';
}
