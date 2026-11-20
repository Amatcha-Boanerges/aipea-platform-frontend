'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { getSession, snapshotRaw, subscribe, type SessionUser } from '@/lib/localBackend'
import type { MembershipTier } from '@/lib/auth'

export interface MemberProfile {
  uid: string
  name: string
  email: string
  country: string
  organisation: string
  tier: MembershipTier
  status: 'active' | 'pending_payment'
  memberId: string
  joinedAt: string // ISO string
  recommendedTrack: {
    acronym: string
    name: string
    strandId: string
    strandName: string
    scope: 'A' | 'B'
    horizon: 1 | 2 | 3
  } | null
}

interface UseAuthResult {
  user: SessionUser | null
  profile: MemberProfile | null
  loading: boolean
}

const noopSubscribe = () => () => {}

/**
 * Local session + the matching member profile. Backend-free: both come from
 * this browser's storage (lib/localBackend.ts), so the shape pages consume is
 * the same as when this was backed by a live service.
 */
export function useAuth(): UseAuthResult {
  // false on the server and during hydration, true once mounted on the client,
  // so pages never redirect on a session they haven't read yet.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const raw = useSyncExternalStore(subscribe, snapshotRaw, () => '')

  return useMemo(() => {
    if (!mounted || !raw) return { user: null, profile: null, loading: true }
    const { session, profile } = JSON.parse(raw) as {
      session: SessionUser | null
      profile: (Omit<MemberProfile, 'joinedAt'> & { createdAt: string }) | null
    }
    if (!session) return { user: null, profile: null, loading: false }
    const { createdAt, ...rest } = profile ?? ({} as NonNullable<typeof profile>)
    return {
      user: getSession(),
      profile: profile ? { ...rest, joinedAt: createdAt } : null,
      loading: false,
    }
  }, [mounted, raw])
}
