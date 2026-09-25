// Minimal auth utilities used by app API routes.
// This file intentionally contains small placeholder implementations so the
// project can build. Replace with real authentication logic (DB lookup,
// password hashing, JWT creation) when integrating with your backend.

/**
 * verifyUser(email, password)
 * - Placeholder: returns a fake user object when the password equals
 *   the DEV_AUTH_PASS env var (useful for local development), otherwise null.
 */
export async function verifyUser(email, password) {
  try {
    const devPass = process.env.DEV_AUTH_PASS || process.env.NEXT_PUBLIC_DEV_AUTH_PASS;
    if (devPass && password === devPass) {
      // return a minimal user object expected by callers
      return { id: 'dev-user', email };
    }

    // In production this should check the real user store and verify hashes.
    return null;
  } catch (err) {
    // Don't throw during build/runtime in this placeholder; consumers handle null.
    return null;
  }
}

const auth = { verifyUser };
export default auth;
