/** Iconos SVG propios por métrica (sin emoji, sin librería externa). */
export const ICONS: Record<string, string> = {
  'heart-pulse': `<path d="M12 21s-7.5-4.7-10-9.3C.4 8.6 2.3 5 5.8 5c2 0 3.4 1.1 4.2 2.3h4C14.8 6.1 16.2 5 18.2 5c3.5 0 5.4 3.6 3.8 6.7C19.5 16.3 12 21 12 21z"/><path d="M3.5 12h4l1.5-3 3 6 1.5-3h4" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  heart: `<path d="M12 21s-7.5-4.7-10-9.3C.4 8.6 2.3 5 5.8 5c2 0 3.4 1.1 4.2 2.3h4C14.8 6.1 16.2 5 18.2 5c3.5 0 5.4 3.6 3.8 6.7C19.5 16.3 12 21 12 21z"/>`,
  scale: `<path d="M12 3v18M8 21h8M12 6l-6 2m6-2 6 2M6 8l-2 6a3 3 0 0 0 4 0L6 8zm12 0-2 6a3 3 0 0 0 4 0l-2-6z" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  droplet: `<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" fill="none" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" fill="none" stroke-width="1.6" stroke-linecap="round"/>`,
  lungs: `<path d="M12 8v8m0-8c0-2-1.5-3-3-3m3 3c0-2 1.5-3 3-3m-6 3v8a3 3 0 0 1-6 0v-3a2 2 0 0 1 4-1m8 1a2 2 0 0 1 4 1v3a3 3 0 0 1-6 0V8z" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  thermometer: `<path d="M10 4a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0V4z" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9v6" stroke-width="1.6" stroke-linecap="round"/>`,
  alert: `<path d="M12 4 2.5 19h19L12 4z" fill="none" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 10v4m0 2.5v.01" stroke-width="1.6" stroke-linecap="round"/>`,
  check: `<path d="M5 13l4 4L19 7" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  logout: `<path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 17l5-5-5-5M15 12H3" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  plus: `<path d="M12 5v14M5 12h14" fill="none" stroke-width="1.8" stroke-linecap="round"/>`,
};

export function iconSvg(name: string, className = 'w-4 h-4'): string {
  const body = ICONS[name] ?? ICONS['heart'];
  return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${body}</svg>`;
}
