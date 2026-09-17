import crypto from 'crypto'
import * as OTPAuth from 'otpauth'

const ISSUER = 'Primegen Trading Corporation'

// Derives a stable 32-byte AES key from PAYLOAD_SECRET (already required by
// the app, so this needs no new env var) -- used to encrypt TOTP secrets
// at rest.
function getKey(): Buffer {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set')
  return crypto.createHash('sha256').update(secret).digest()
}

// ===== TOTP secret encryption at rest =====
// A user's totpSecret column is already unreadable through any API
// response (see Users.ts's field-level access), but encrypting it too
// means a raw database dump/leak doesn't hand over usable codes either.

export function encryptSecret(plainBase32: string): string {
  const iv = crypto.randomBytes(12) // AES-GCM standard IV size
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plainBase32, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decryptSecret(encoded: string): string {
  const raw = Buffer.from(encoded, 'base64')
  const iv = raw.subarray(0, 12)
  const authTag = raw.subarray(12, 28)
  const encrypted = raw.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

// ===== TOTP secret + code =====

export function generateTotpSecret(email: string): { base32Secret: string; otpauthUrl: string } {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  })
  return { base32Secret: totp.secret.base32, otpauthUrl: totp.toString() }
}

// window: 1 tolerates the code from one step before/after the current
// 30s window, so a slightly-off phone clock or slow typing doesn't fail
// a code that's genuinely still valid.
export function verifyTotpCode(base32Secret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(base32Secret),
  })
  return totp.validate({ token: code, window: 1 }) !== null
}
