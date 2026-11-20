// Local stand-in for the backend (previously Firebase Auth + Firestore).
//
// The site currently runs with NO network backend: accounts, the signed-in
// session, member profiles and saved track audits all live in this browser's
// localStorage. The public surface of `lib/auth.ts` and `hooks/useAuth.ts` is
// unchanged, so every page keeps working and a real backend can be swapped back
// in by re-implementing only this file's callers (auth.ts / useAuth.ts).
//
// DEMO ONLY: passwords are kept in localStorage in plain form and nothing here
// is secure or shared between browsers/devices.

import type { MembershipTier } from './auth'

export interface SessionUser {
  uid: string
  email: string
  displayName: string
}

export interface StoredProfile {
  uid: string
  name: string
  email: string
  country: string
  organisation: string
  tier: MembershipTier
  status: 'active' | 'pending_payment'
  newsletterConsent: boolean
  memberId: string
  createdAt: string // ISO
  recommendedTrack: {
    acronym: string
    name: string
    strandId: string
    strandName: string
    scope: 'A' | 'B'
    horizon: 1 | 2 | 3
  } | null
}

interface Account {
  uid: string
  email: string
  password: string
}

const ACCOUNTS_KEY = 'aipea_local_accounts'
const PROFILES_KEY = 'aipea_local_profiles'
const SESSION_KEY = 'aipea_local_session'
const AUDITS_KEY = 'aipea_local_audits'

class LocalAuthError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable (private mode / quota): state just won't persist.
  }
}

// --- change notification (same tab via listeners, other tabs via 'storage') ---

const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach(fn => fn())
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith('aipea_local_')) fn()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}

// --- reads --------------------------------------------------------------------

export function getSession(): SessionUser | null {
  return read<SessionUser | null>(SESSION_KEY, null)
}

export function getProfile(uid: string): StoredProfile | null {
  return read<Record<string, StoredProfile>>(PROFILES_KEY, {})[uid] ?? null
}

// --- writes -------------------------------------------------------------------

function newUid(): string {
  return `local_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function createAccount(
  email: string,
  password: string,
  profile: Omit<StoredProfile, 'uid' | 'email' | 'createdAt' | 'recommendedTrack'>,
): void {
  const normalised = email.trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(normalised)) throw new LocalAuthError('auth/invalid-email')
  if (password.length < 6) throw new LocalAuthError('auth/weak-password')

  const accounts = read<Account[]>(ACCOUNTS_KEY, [])
  if (accounts.some(a => a.email === normalised)) throw new LocalAuthError('auth/email-already-in-use')

  const uid = newUid()
  write(ACCOUNTS_KEY, [...accounts, { uid, email: normalised, password }])
  write(PROFILES_KEY, {
    ...read<Record<string, StoredProfile>>(PROFILES_KEY, {}),
    [uid]: { ...profile, uid, email: normalised, createdAt: new Date().toISOString(), recommendedTrack: null },
  })
  write(SESSION_KEY, { uid, email: normalised, displayName: profile.name } satisfies SessionUser)
  notify()
}

export function signIn(email: string, password: string): void {
  const normalised = email.trim().toLowerCase()
  const account = read<Account[]>(ACCOUNTS_KEY, []).find(a => a.email === normalised)
  if (!account || account.password !== password) throw new LocalAuthError('auth/invalid-credential')
  const profile = getProfile(account.uid)
  write(SESSION_KEY, {
    uid: account.uid,
    email: account.email,
    displayName: profile?.name ?? account.email.split('@')[0],
  } satisfies SessionUser)
  notify()
}

export function signOutLocal(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
  notify()
}

export function updateProfileFields(uid: string, fields: Partial<StoredProfile>): void {
  const profiles = read<Record<string, StoredProfile>>(PROFILES_KEY, {})
  if (!profiles[uid]) return
  write(PROFILES_KEY, { ...profiles, [uid]: { ...profiles[uid], ...fields } })
  notify()
}

export function addScopeAudit(uid: string, record: unknown): string {
  const id = `audit_${Date.now().toString(36)}`
  const all = read<Record<string, Record<string, unknown>>>(AUDITS_KEY, {})
  write(AUDITS_KEY, { ...all, [uid]: { ...(all[uid] ?? {}), [id]: record } })
  return id
}

/** Stable string snapshot of session + profile, for useSyncExternalStore. */
export function snapshotRaw(): string {
  const session = getSession()
  return JSON.stringify({ session, profile: session ? getProfile(session.uid) : null })
}
