/* Where the dashboard lives.
 *
 * Set VITE_ADMIN_PATH in .env (and in the Vercel project settings) to
 * something only the committee knows.
 *
 * The password is the security boundary, not this. The router matches on the
 * path, so the string ends up in the public bundle and anyone who reads it can
 * find the URL — where they meet a rate-limited login form. What it does buy
 * is that the panel stays out of search results, crawlers and scanner
 * wordlists: nothing links here, the page serves noindex at runtime, and
 * `/admin` and friends resolve to the ordinary home page.
 *
 * Change it whenever a committee hands over, alongside the passwords.
 */
const RAW = import.meta.env.VITE_ADMIN_PATH || "control-tower";

// Strip stray slashes so both "control-tower" and "/control-tower/" work.
export const ADMIN_PATH = RAW.replace(/^\/+|\/+$/g, "");
