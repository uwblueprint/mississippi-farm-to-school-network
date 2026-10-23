import logger from '@/utilities/logger';

const Logger = logger(__filename);

let warnedMissingDomain = false;

/**
 * True when `email` belongs to the admin org domain (`ADMIN_EMAIL_DOMAIN`, no `@`).
 * Requires the full `@domain` suffix so lookalikes (`notdomain.org`) and subdomains don't match.
 * Read at call time so tests and env changes apply; fails closed when the variable is unset.
 * Kept out of authHelpers.ts because authHelpers imports UserService (circular import).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  const domain = process.env.ADMIN_EMAIL_DOMAIN?.trim().toLowerCase();
  if (!domain) {
    if (!warnedMissingDomain) {
      Logger.warn('ADMIN_EMAIL_DOMAIN is not set; no accounts will be auto-assigned ADMIN.');
      warnedMissingDomain = true;
    }
    return false;
  }
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${domain}`);
}
