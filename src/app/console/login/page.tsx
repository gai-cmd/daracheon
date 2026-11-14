import { isConsoleNext } from '@/lib/google-oauth';
import LoginScreen from './LoginScreen';

export const dynamic = 'force-dynamic';

const ERROR_CODES = new Set([
  'sso_not_configured',
  'console_not_configured',
  'oauth_state',
  'oauth_token',
  'oauth_userinfo',
  'oauth_email',
  'not_allowed',
  'oauth_failed',
]);

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Console sign-in (design.md §6.1): one button to the shared Google OAuth start route. The return
// path is kept only when isConsoleNext accepts it, otherwise /console; an unknown error code shows
// the generic message.
export default async function ConsoleLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const nextRaw = first(sp.next);
  const next = nextRaw && isConsoleNext(nextRaw) ? nextRaw : '/console';
  const err = first(sp.error);
  const error = err ? (ERROR_CODES.has(err) ? err : 'unknown') : null;
  const startHref = `/api/admin/auth/google/start?next=${encodeURIComponent(next)}`;
  return <LoginScreen startHref={startHref} error={error} />;
}
