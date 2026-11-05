import logger from '@/utilities/logger';

const Logger = logger(__filename);

let warnedMissingDomain = false;

/**
 * True when `email` belongs to an admin org domain (`ADMIN_EMAIL_DOMAIN`: comma-separated
 * domains, no `@`, e.g. `mississippifarmtoschool.org,uwaterloo.ca`).
 * Requires the full `@domain` suffix so lookalikes (`notdomain.org`) and subdomains don't match.
 * Read at call time so tests and env changes apply; fails closed when the variable is unset.
 * Kept out of authHelpers.ts because authHelpers imports UserService (circular import).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  const domains = (process.env.ADMIN_EMAIL_DOMAIN ?? '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  if (domains.length === 0) {
    if (!warnedMissingDomain) {
      Logger.warn('ADMIN_EMAIL_DOMAIN is not set; no accounts will be auto-assigned ADMIN.');
      warnedMissingDomain = true;
    }
    return false;
  }
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return domains.some((domain) => normalized.endsWith(`@${domain}`));
}
