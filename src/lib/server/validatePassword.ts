// Mirrors the client-side `strongPasswordSchema` in
// src/lib/validations/auth/index.ts. The client zod schema alone is not a
// trust boundary — any direct API call (curl, a future client) bypasses it,
// so the same rule must be enforced here too.
export function validatePassword(password: string): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (password.length > 72) {
    return 'Password must not exceed 72 characters';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least 1 lowercase letter';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least 1 uppercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least 1 number';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least 1 special character';
  }
  return null;
}
