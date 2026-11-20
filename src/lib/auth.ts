import * as backend from './localBackend'
import {
  buildScopeAuditRecord,
  resolveTrack,
  type HorizonId,
  type ScopeLevel,
  type TrackFinderResult,
} from './trackFinder'

export type MembershipTier = 'Associate' | 'Professional' | 'Fellow'

export interface AssociateSignupInput {
  name: string
  email: string
  country: string
  organisation: string
  password: string
  newsletterConsent: boolean
}

/** Adds the tier choice, used only by the (currently dormant) paid checkout. */
export interface PendingSignup extends AssociateSignupInput {
  tier: MembershipTier
}

export const TIER_PRICING: Record<MembershipTier, number> = {
  Associate: 0,
  Professional: 1200,
  Fellow: 2000,
}

export function formatCedis(amount: number): string {
  return amount === 0 ? 'Free' : `₵${amount.toLocaleString('en-GH')}`
}

export function savePendingSignup(pending: PendingSignup): void {
  localStorage.setItem('aipea_pending', JSON.stringify(pending))
}

export function getPendingSignup(): PendingSignup | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('aipea_pending')
    return raw ? (JSON.parse(raw) as PendingSignup) : null
  } catch {
    return null
  }
}

export function clearPendingSignup(): void {
  localStorage.removeItem('aipea_pending')
}

export function generateMemberId(): string {
  const year = new Date().getFullYear()
  return `AIPEA-${year}-${String(Math.floor(10000 + Math.random() * 90000))}`
}

export function formatJoinDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function firstName(name: string): string {
  return name.trim().split(' ')[0]
}

/** Maps auth error codes to messages safe to show in the UI. */
export function getAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string } | null | undefined)?.code
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.'
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/weak-password':
      return 'Please choose a password with at least 6 characters.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Please allow popups and try again.'
    case 'auth/account-exists-with-different-credential':
      return 'An account with this email already exists using a different sign-in method. Try signing in with your password instead.'
    case 'auth/operation-not-allowed':
      return 'Google sign-in isn’t available right now. Please sign up with your email and password.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

/**
 * Creates the Associate account + profile. Backend-free: stored locally in this
 * browser (see lib/localBackend.ts). The signature is unchanged so a real
 * backend can be reconnected here without touching any page.
 */
export async function signUpAssociate(pending: AssociateSignupInput): Promise<void> {
  backend.createAccount(pending.email, pending.password, {
    name: pending.name,
    country: pending.country,
    organisation: pending.organisation,
    tier: 'Associate',
    status: 'active',
    newsletterConsent: pending.newsletterConsent,
    memberId: generateMemberId(),
  })
}

/**
 * Google sign-in needs a backend identity provider, which is disconnected, so
 * this reports a friendly error instead of starting a popup.
 */
export async function continueWithGoogle(_newsletterConsent = false): Promise<void> {
  void _newsletterConsent
  throw { code: 'auth/operation-not-allowed' }
}

/** No redirect sign-in exists without a backend: nothing to complete. */
export async function completeGoogleRedirect(): Promise<boolean> {
  return false
}

export async function signInMember(email: string, password: string): Promise<void> {
  backend.signIn(email, password)
}

export async function signOutMember(): Promise<void> {
  backend.signOutLocal()
}

/** Lets a member update where they work when their employer changes. */
export async function updateOrganisation(organisation: string): Promise<void> {
  const session = backend.getSession()
  if (!session) throw new Error('You must be signed in to update your organisation.')
  backend.updateProfileFields(session.uid, { organisation: organisation.trim() })
}

/**
 * Stores a completed Professional Scope Audit under the signed-in member and
 * updates their recommended track (local only; no email is sent).
 */
export async function saveScopeAudit(
  horizon: HorizonId,
  scope: ScopeLevel,
): Promise<TrackFinderResult> {
  const session = backend.getSession()
  if (!session) throw new Error('You must be signed in to save your track audit.')

  const result = resolveTrack(horizon, scope)
  const now = new Date().toISOString()
  const auditId = backend.addScopeAudit(session.uid, buildScopeAuditRecord(result, now))
  backend.updateProfileFields(session.uid, {
    recommendedTrack: {
      acronym: result.track.acronym,
      name: result.track.name,
      strandId: result.strand.id,
      strandName: result.strand.name,
      scope: result.scope,
      horizon: result.horizon,
    },
  })
  void auditId

  return result
}

// --- Paid-tier (Professional/Fellow) placeholder, kept fake on purpose ------
//
// Payment verification isn't wired up yet (see checkout/page.tsx) — there's
// no backend that confirms a Paystack transaction actually happened, so a
// "paid" signup can't be granted a real account the way Associate signups
// are. This local-only stand-in preserves today's demo behaviour for the
// paid flow without pretending it's a real, persisted membership. It's
// superseded once Paystack verification ships.

export interface FakePaidUser {
  name: string
  email: string
  tier: MembershipTier
  country?: string
  memberId: string
  joinedAt: string
}

export function saveFakePaidUser(user: FakePaidUser): void {
  localStorage.setItem('aipea_fake_paid_user', JSON.stringify(user))
}
