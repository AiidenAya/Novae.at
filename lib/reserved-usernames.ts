// Usernames that can't be registered — blocks staff/system impersonation,
// brand-name squatting, and collisions with top-level app routes.
const ROUTE_SEGMENTS = [
  "admin", "api", "browse", "home", "library", "notifications", "referrals",
  "settings", "login", "register", "forgot-password", "reset-password",
];

const SYSTEM_AND_STAFF = [
  "root", "superadmin", "super-admin", "moderator", "mod", "staff", "support",
  "help", "helpdesk", "contact", "info", "about", "terms", "privacy", "legal",
  "security", "abuse", "webmaster", "hostmaster", "postmaster", "noreply",
  "no-reply", "system", "sysadmin", "owner", "official", "verified", "bot",
  "team", "billing", "payment", "payments",
];

const APP_AND_AUTH = [
  "dashboard", "account", "accounts", "profile", "profiles", "user", "users",
  "username", "signin", "signup", "signout", "logout", "auth", "oauth", "sso",
  "password",
];

const BRAND = [
  "novae", "novaeai", "novae-official", "novae-team", "novae-support",
];

const MISC = [
  "test", "testing", "demo", "sample", "example", "guest", "anonymous",
  "anon", "everyone", "here", "channel", "null", "undefined", "true", "false",
];

export const RESERVED_USERNAMES = new Set([
  ...ROUTE_SEGMENTS,
  ...SYSTEM_AND_STAFF,
  ...APP_AND_AUTH,
  ...BRAND,
  ...MISC,
]);

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}
