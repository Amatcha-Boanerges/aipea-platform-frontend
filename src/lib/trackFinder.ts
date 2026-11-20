/**
 * AIPEA Track Finder — Professional Scope Audit engine.
 *
 * Source: AIPEA Pathfinder Audit System spec + [DD] Deep Dive Role Descriptor Framework.
 * Five scored questions place a candidate on a 3×2 matrix: strand (horizon) × level (scope).
 * Canonical PA base acronym is CERTPA (client direction, 2026-07-24).
 */

import { STRANDS, type Strand, type Track } from './facts'

export type HorizonId = 1 | 2 | 3
export type ScopeLevel = 'A' | 'B'

/** Pre-audit bio and profile layer (spec step 1 and 2). */
export type AuditProfile = {
  name: string
  email: string
  phone: string
  country: string
  city: string
  jobTitle: string
  employer: string
  industry: string
  reportingLevel: string
  deliveryFormat: string
  sponsorship: string
}

export const EMPTY_AUDIT_PROFILE: AuditProfile = {
  name: '', email: '', phone: '', country: '', city: '', jobTitle: '', employer: '',
  industry: '', reportingLevel: '', deliveryFormat: '', sponsorship: '',
}

export const INDUSTRIES = [
  'Banking & Financial Services', 'Oil & Gas / Energy', 'Public Sector & Government',
  'Telecommunications & Tech', 'Non-Profit & Development (NGOs)', 'FMCG & Retail',
  'Professional Services', 'Healthcare & Pharma', 'Wellbeing', 'Other',
]

export const REPORTING_LEVELS = [
  'CEO / Managing Director / Founder',
  'C-Suite Executive (CFO, COO, CMO, CHRO, CTO)',
  'General Manager / Regional Director / Head of Department',
  'Multiple Executives / Departmental Pool',
]

export const DELIVERY_FORMATS = [
  'In-person Saturday sessions (Accra, Ghana)',
  'Live online evening seminars (Pan-African cohort)',
]

export const SPONSORSHIPS = [
  'Self-funded professional',
  'Employer / corporate-funded',
  'Sponsored, other',
]

/** Sponsorship answer that unlocks the "Letter to Your Boss" pack. */
export const EMPLOYER_FUNDED = SPONSORSHIPS[1]

/** Points an answer adds to each strand (PA/EA/CoS) and level (base/senior). */
export type AnswerScore = {
  pa?: number
  ea?: number
  cos?: number
  base?: number
  senior?: number
}

export type AuditOption = { text: string; score: AnswerScore }
export type AuditQuestion = {
  id: string
  topic: string
  headline: string
  options: AuditOption[]
}

/**
 * The five-question Pathfinder Audit (source: AIPEA Pathfinder Audit System spec).
 * Axis 1 routes the strand (PA / EA / CoS); axis 2 routes the level
 * (Base designation vs Senior designation).
 */
export const AUDIT_QUESTIONS: AuditQuestion[] = [
  {
    id: 'focus',
    topic: 'Primary focus',
    headline: 'What best describes the main problem you are hired to solve every day?',
    options: [
      { text: 'I remove friction from an executive’s daily execution: schedules, travel, inboxes, administrative workflows and immediate task lists.', score: { pa: 3, base: 1 } },
      { text: 'I bridge C-Suite vision and operational diplomacy: board and VIP communications, executive briefs and cross-functional alignment.', score: { ea: 3, senior: 1 } },
      { text: 'I act as an enterprise integrator: building automated software pipelines, managing project portfolios, directing post-merger integrations or driving institutional growth.', score: { cos: 3, senior: 2 } },
    ],
  },
  {
    id: 'budget',
    topic: 'Financial authority',
    headline: 'What is your direct accountability for company money and budgets?',
    options: [
      { text: 'I manage petty cash, process individual travel expenses and reconcile executive credit card statements.', score: { pa: 2, base: 2 } },
      { text: 'I oversee departmental vendor SLAs, negotiate administrative service contracts and manage office asset budgets.', score: { pa: 1, senior: 2 } },
      { text: 'I track C-Suite operational budgets, audit variances on executive spending and help prepare board-level financial reports.', score: { ea: 2, senior: 1 } },
      { text: 'I design and defend enterprise operating budgets, manage capital expenditure plans, or source international grants and fundraising resources.', score: { cos: 3, senior: 2 } },
    ],
  },
  {
    id: 'governance',
    topic: 'Governance and meetings',
    headline: 'How involved are you in your organisation’s governance and high-stakes meetings?',
    options: [
      { text: 'I handle venue setup, diary scheduling, catering and guest logistics for team or executive meetings.', score: { pa: 2, base: 2 } },
      { text: 'I compile board packs, draft minutes to statutory standard and maintain the post-meeting action tracker.', score: { ea: 3, base: 1 } },
      { text: 'I enforce governance policies across divisions, audit board committee structures and ensure executives comply with board directives.', score: { ea: 1, senior: 2 } },
      { text: 'I sit in executive and board meetings as the CEO’s strategic proxy, resolving deadlocks and directing department heads on resolutions.', score: { cos: 3, senior: 2 } },
    ],
  },
  {
    id: 'technology',
    topic: 'Technology',
    headline: 'How do you use digital systems and technology in your work?',
    options: [
      { text: 'I use standard productivity tools (Microsoft 365, Google Workspace) and AI prompts to draft communications, filter inboxes and organise calendars.', score: { pa: 2, base: 2 } },
      { text: 'I build and manage shared project dashboards (Asana, Monday.com, Notion) to track cross-departmental deliverables.', score: { ea: 2, senior: 1 } },
      { text: 'I connect multi-platform software (Zapier, Power Automate, Salesforce) to run autonomous executive-office workflows.', score: { cos: 3, base: 1 } },
      { text: 'I use machine learning models to analyse enterprise workflows, remove bottlenecks and safeguard digital assets.', score: { cos: 3, senior: 2 } },
    ],
  },
  {
    id: 'leadership',
    topic: 'Leadership and scope',
    headline: 'What level of leadership do you exercise over people and operational culture?',
    options: [
      { text: 'I work as a solo, high-touch operator dedicated to the smooth daily functioning of my immediate leader.', score: { pa: 2, base: 2 } },
      { text: 'I supervise, mentor and set performance targets for junior administrative staff, receptionists or office support pools.', score: { pa: 1, senior: 2 } },
      { text: 'I manage high-stakes external relationships with investors, board members, regulators and government officials on behalf of the C-Suite.', score: { ea: 3, senior: 1 } },
      { text: 'I direct cross-functional project teams, oversee restructuring initiatives and coach the company’s administrative pipeline.', score: { cos: 3, senior: 2 } },
    ],
  },
]

/**
 * Turns the five chosen option indexes into a strand and level.
 * Ties between strands resolve in the spec's order (PA, then EA, then CoS);
 * the Senior designation is returned only when Senior strictly beats Base.
 */
export function scoreAudit(answers: number[]): { horizon: HorizonId; scope: ScopeLevel } {
  const t = { pa: 0, ea: 0, cos: 0, base: 0, senior: 0 }
  AUDIT_QUESTIONS.forEach((q, i) => {
    const s = q.options[answers[i]]?.score
    if (!s) return
    t.pa += s.pa ?? 0
    t.ea += s.ea ?? 0
    t.cos += s.cos ?? 0
    t.base += s.base ?? 0
    t.senior += s.senior ?? 0
  })
  const top = Math.max(t.pa, t.ea, t.cos)
  const horizon: HorizonId = t.pa === top ? 1 : t.ea === top ? 2 : 3
  return { horizon, scope: t.senior > t.base ? 'B' : 'A' }
}

export type TrackFinderResult = {
  horizon: HorizonId
  scope: ScopeLevel
  strand: Strand
  track: Track
  /** Strand-level focus tailored for result / email pages. */
  coreFocus: string
  problemSolved: string
  /** Email: KEY_CORE_VALUE_DRIVER */
  coreValueDriver: string
  /** Email: DYNAMIC_BULLET_1..3 */
  bullets: [string, string, string]
}

const RESULT_COPY: Record<
  HorizonId,
  {
    coreFocus: string
    problemSolved: string
    coreValueDriver: string
    bullets: Record<ScopeLevel, [string, string, string]>
  }
> = {
  1: {
    coreFocus: 'Operational Fluidity & Executive Synchronization',
    problemSolved:
      'Taking unstructured, fast-moving daily tasks and applying tech, speed and gatekeeping diplomacy to create friction-free executive operations.',
    coreValueDriver: 'operational fluidity and executive synchronization',
    bullets: {
      A: [
        'Turning messy schedules, travel and inboxes into absolute daily order',
        'Protecting one executive’s focus through gatekeeping and tech enablement',
        'Delivering flawless individual execution under high-velocity pressure',
      ],
      B: [
        'Leading the junior admin pool and mentoring support colleagues',
        'Negotiating vendor contracts and managing office procurement budgets',
        'Designing scalable administrative systems that save the organisation real cost',
      ],
    },
  },
  2: {
    coreFocus: 'Strategic Alignment & Stakeholder Diplomacy',
    problemSolved:
      'Operating in the gray spaces of corporate politics, board dynamics, C-Suite brief synthesis and aligning cross-departmental KPIs with quarterly goals.',
    coreValueDriver: 'strategic alignment and stakeholder diplomacy',
    bullets: {
      A: [
        'Navigating corporate politics and high-touch stakeholder communication',
        'Synthesizing complex data into precise executive briefing notes',
        'Executing multi-country logistics against quarterly objectives',
      ],
      B: [
        'Commanding Board and AGM governance mechanics end to end',
        'Tracking division KPIs and aligning cross-departmental priorities',
        'Formulating board-level budgets and corporate variance tracking',
      ],
    },
  },
  3: {
    coreFocus: 'Enterprise Integration & Institutional Growth',
    problemSolved:
      'Serving as a strategic proxy and system architect—building automated tech pipelines, directing post-merger integrations and securing capital/grant resources.',
    coreValueDriver: 'enterprise integration and institutional growth',
    bullets: {
      A: [
        'Building low-code enterprise automation and support-layer project systems',
        'Deploying agile frameworks across operational teams',
        'Acting as a strategic proxy when the executive agenda must move at enterprise scale',
      ],
      B: [
        'Sourcing international grants, sponsorships and institutional funding',
        'Leading post-merger integrations and organisational redesign',
        'Lobbying and scale governance that shift how the enterprise operates',
      ],
    },
  },
}

export function resolveTrack(horizon: HorizonId, scope: ScopeLevel): TrackFinderResult {
  const strand = STRANDS[horizon - 1]
  const track = strand.tracks[scope === 'A' ? 0 : 1]
  const copy = RESULT_COPY[horizon]
  return {
    horizon,
    scope,
    strand,
    track,
    coreFocus: copy.coreFocus,
    problemSolved: copy.problemSolved,
    coreValueDriver: copy.coreValueDriver,
    bullets: copy.bullets[scope],
  }
}

export type PendingScopeAudit = {
  horizon: HorizonId
  scope: ScopeLevel
  profile?: AuditProfile
}

const PENDING_KEY = 'aipea_pending_scope_audit'

export function savePendingScopeAudit(pending: PendingScopeAudit): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
}

export function getPendingScopeAudit(): PendingScopeAudit | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingScopeAudit
    if (parsed.horizon !== 1 && parsed.horizon !== 2 && parsed.horizon !== 3) return null
    if (parsed.scope !== 'A' && parsed.scope !== 'B') return null
    return parsed
  } catch {
    return null
  }
}

export function clearPendingScopeAudit(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PENDING_KEY)
}

/** Payload stored locally under the member's scopeAudits (see lib/localBackend.ts). */
export type ScopeAuditRecord = {
  horizon: HorizonId
  scope: ScopeLevel
  trackAcronym: string
  trackName: string
  strandId: string
  strandName: string
  coreFocus: string
  operationalHorizon: string
  targetAccountability: string
  coreValueDriver: string
  bullets: [string, string, string]
  profile: AuditProfile | null
  createdAt: unknown
}

export function buildScopeAuditRecord(result: TrackFinderResult, createdAt: unknown, profile: AuditProfile | null = null): ScopeAuditRecord {
  return {
    horizon: result.horizon,
    scope: result.scope,
    trackAcronym: result.track.acronym,
    trackName: result.track.name,
    strandId: result.strand.id,
    strandName: result.strand.name,
    coreFocus: result.coreFocus,
    operationalHorizon: result.strand.horizon,
    targetAccountability: result.track.scopeLabel,
    coreValueDriver: result.coreValueDriver,
    bullets: result.bullets,
    profile,
    createdAt,
  }
}
