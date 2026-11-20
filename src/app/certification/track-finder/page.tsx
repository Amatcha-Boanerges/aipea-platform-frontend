'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Download, Mail } from 'lucide-react'
import {
  PageShell, PageHero, SectionHeading, CTASection,
} from '@/components/site/PageKit'
import { Reveal } from '@/components/site/Reveal'
import { C, dis, bod, INNER, SECTION, EASE } from '@/components/site/tokens'
import { useAuth } from '@/hooks/useAuth'
import { saveScopeAudit, getAuthErrorMessage } from '@/lib/auth'
import { CONTACT, ORG } from '@/lib/facts'
import {
  AUDIT_QUESTIONS, resolveTrack, scoreAudit,
  savePendingScopeAudit, getPendingScopeAudit, clearPendingScopeAudit,
  EMPTY_AUDIT_PROFILE, INDUSTRIES, REPORTING_LEVELS, DELIVERY_FORMATS, SPONSORSHIPS, EMPLOYER_FUNDED,
  type AuditProfile, type TrackFinderResult,
} from '@/lib/trackFinder'

const PROSPECTUS_HREF = '/docs/aipea-2026-prospectus.pdf'
const JUSTIFICATION_MAIL = `mailto:${CONTACT.email}?subject=${encodeURIComponent('Request: Letter to Your Boss Justification Pack')}&body=${encodeURIComponent('Hello Secretariat,\n\nI have completed my AIPEA Professional Scope Audit and would like the corporate justification pack to share with my HR Director / Executive.\n\nThank you.')}`

const TOTAL = AUDIT_QUESTIONS.length
const LETTERS = ['A', 'B', 'C', 'D']

export default function TrackFinderPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [answers, setAnswers] = useState<number[]>([])
  const [index, setIndex] = useState(0)
  const [stage, setStage] = useState<'bio' | 'org' | 'questions'>('bio')
  const [form, setForm] = useState<Partial<AuditProfile>>({})
  const [formError, setFormError] = useState('')
  const [result, setResult] = useState<TrackFinderResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [celebrateKey, setCelebrateKey] = useState(0)
  const resumedPending = useRef(false)
  const auditRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)

  // Each step swaps in content of a different height. Without this, the page
  // shrinks under the reader and the browser leaves them further down the page
  // (on "How placement works"). Whenever the step changes, bring the top of the
  // audit back into view, but only if it has actually scrolled out of sight.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    const el = auditRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top
    if (top < 76 || top > window.innerHeight * 0.5) {
      const y = window.scrollY + top - 96
      window.scrollTo({ top: Math.max(0, y), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    }
  }, [stage, index, result])

  // After sign-in / sign-up, resume a pending audit from sessionStorage.
  useEffect(() => {
    if (authLoading || !user || !profile || resumedPending.current) return
    const pending = getPendingScopeAudit()
    if (!pending) return
    resumedPending.current = true

    // Resuming a saved audit after the sign-in redirect is a one-time sync from sessionStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(resolveTrack(pending.horizon, pending.scope))
    setCelebrateKey((k) => k + 1)
    setSaving(true)
    setError('')

    void saveScopeAudit(pending.horizon, pending.scope, pending.profile ?? null)
      .then(() => {
        clearPendingScopeAudit()
        setSaved(true)
      })
      .catch((err) => setError(getAuthErrorMessage(err)))
      .finally(() => setSaving(false))
  }, [authLoading, user, profile])

  // Signed-in members get name, email, country and employer prefilled.
  const values: AuditProfile = {
    ...EMPTY_AUDIT_PROFILE,
    name: profile?.name ?? '',
    email: profile?.email ?? user?.email ?? '',
    country: profile?.country ?? '',
    employer: profile?.organisation ?? '',
    ...form,
  }
  const setField = (key: keyof AuditProfile) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  function choose(optionIndex: number) {
    const next = [...answers.slice(0, index), optionIndex]
    setAnswers(next)
    if (index < TOTAL - 1) {
      setIndex(index + 1)
      return
    }
    const { horizon, scope } = scoreAudit(next)
    setResult(resolveTrack(horizon, scope))
    setSaved(false)
    setError('')
    setCelebrateKey((k) => k + 1)
  }

  function submitBio(e: FormEvent) {
    e.preventDefault()
    if (!values.name.trim()) { setFormError('Please enter your full name.'); return }
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) { setFormError('Please enter a valid email address.'); return }
    if (!values.country.trim()) { setFormError('Please enter your country.'); return }
    setFormError('')
    setStage('org')
  }

  function submitOrg(e: FormEvent) {
    e.preventDefault()
    setStage('questions')
  }

  function retake() {
    setAnswers([])
    setIndex(0)
    setStage('questions')
    setResult(null)
    setSaved(false)
    setError('')
  }

  async function handleSave() {
    if (!result) return
    const { horizon, scope } = result
    setError('')

    if (!user) {
      savePendingScopeAudit({ horizon, scope, profile: values })
      router.push(`/sign-in?next=${encodeURIComponent('/certification/track-finder')}`)
      return
    }

    setSaving(true)
    try {
      await saveScopeAudit(horizon, scope, values)
      clearPendingScopeAudit()
      setSaved(true)
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const question = AUDIT_QUESTIONS[index]

  return (
    <PageShell>
      <PageHero
        eyebrow="Track Finder"
        title="Find your path by"
        highlight="the problems you solve."
        subtitle="Answer five short questions about the work you do every day. We place you on the AIPEA designation that fits, whatever your job title says."
        image="/images/conference/optimized/certification-hero.webp"
        primary={{ label: 'Start the audit', href: '#audit' }}
        secondary={{ label: 'See all designations', href: '/certification#strands' }}
      />

      <section id="audit" style={{ ...SECTION, background: C.bg, overflowAnchor: 'none' }}>
        <div ref={auditRef} style={{ ...INNER, minHeight: 'min(70vh, 640px)' }}>
          {!result && stage === 'questions' && (
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              {/* Progress */}
              <div style={{ display: 'flex', gap: 6 }} role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={index + 1} aria-label="Audit progress">
                {AUDIT_QUESTIONS.map((q, i) => (
                  <span key={q.id} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= index ? C.orange : C.border, transition: 'background 0.3s' }} />
                ))}
              </div>
              <p style={{ fontFamily: dis, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.orange, marginTop: 18 }}>
                Question {index + 1} of {TOTAL} · {question.topic}
              </p>

              <motion.div key={question.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                <h2 style={{ fontFamily: dis, fontWeight: 800, fontSize: 'clamp(22px,2.8vw,30px)', letterSpacing: '-0.02em', lineHeight: 1.2, color: C.text, marginTop: 10 }}>
                  {question.headline}
                </h2>

                <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
                  {question.options.map((opt, i) => {
                    const selected = answers[index] === i
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => choose(i)}
                        aria-pressed={selected}
                        style={{
                          width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'flex-start',
                          padding: '18px 20px', borderRadius: 16,
                          border: `1.5px solid ${selected ? C.orange : C.border}`,
                          background: selected ? 'rgba(232,80,26,0.05)' : C.white,
                          transition: 'border-color 0.2s, background 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.orange }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = selected ? C.orange : C.border }}
                      >
                        <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: dis, fontWeight: 800, fontSize: 12, background: selected ? C.orange : C.surface, color: selected ? C.white : C.muted }}>
                          {LETTERS[i]}
                        </span>
                        <span style={{ fontFamily: bod, fontSize: 15, lineHeight: 1.6, color: C.text }}>{opt.text}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>

              <button type="button" onClick={() => (index > 0 ? setIndex(index - 1) : setStage('org'))} style={{ marginTop: 24, background: 'none', border: 'none', cursor: 'pointer', fontFamily: bod, fontSize: 13.5, color: C.muted, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          )}

          {!result && stage === 'bio' && (
            <motion.form key="bio" onSubmit={submitBio} noValidate initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }} style={{ maxWidth: 720, margin: '0 auto' }}>
              <StepBar total={2} current={1} />
              <p style={stepEyebrow}>Step 1 of 2 · Bio &amp; contact</p>
              <h2 style={stepTitle}>Tell us a little about you.</h2>
              <p style={stepIntro}>Name, email and country are required. Then one more short step and five questions.</p>

              <div style={{ display: 'grid', gap: 16, marginTop: 28 }}>
                <TextField label="Full name" required value={values.name} onChange={setField('name')} autoComplete="name" />
                <TextField label="Email address" required type="email" value={values.email} onChange={setField('email')} autoComplete="email" />
                <TextField label="Country of residence" required value={values.country} onChange={setField('country')} autoComplete="country-name" placeholder="Ghana" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="aipea-feature-grid">
                  <TextField label="Phone / WhatsApp (optional)" type="tel" value={values.phone} onChange={setField('phone')} autoComplete="tel" />
                  <TextField label="City / region (optional)" value={values.city} onChange={setField('city')} autoComplete="address-level2" />
                </div>
              </div>

              {formError && <p role="alert" style={errorBox}>{formError}</p>}

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginTop: 28 }}>
                <button type="submit" style={{ ...primaryBtn, border: 'none', cursor: 'pointer' }}>Continue <ArrowRight size={14} /></button>
              </div>
            </motion.form>
          )}

          {!result && stage === 'org' && (
            <motion.form key="org" onSubmit={submitOrg} noValidate initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }} style={{ maxWidth: 720, margin: '0 auto' }}>
              <StepBar total={2} current={2} />
              <p style={stepEyebrow}>Step 2 of 2 · Professional context</p>
              <h2 style={stepTitle}>Where do you work?</h2>
              <p style={stepIntro}>Everything here is optional. It helps us place you in the right cohort.</p>

              <div style={{ display: 'grid', gap: 16, marginTop: 28 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="aipea-feature-grid">
                  <TextField label="Current job title" value={values.jobTitle} onChange={setField('jobTitle')} placeholder="e.g. Senior Executive Assistant" />
                  <TextField label="Employer / organisation" value={values.employer} onChange={setField('employer')} autoComplete="organization" />
                </div>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={fieldLabel}>Industry / sector</span>
                  <select value={values.industry} onChange={(e) => setField('industry')(e.target.value)} style={{ ...inputStyle, appearance: 'auto' }}>
                    <option value="">Select…</option>
                    {INDUSTRIES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
              </div>

              <ChoiceGroup label="Who do you directly report to?" options={REPORTING_LEVELS} value={values.reportingLevel} onChange={setField('reportingLevel')} />
              <ChoiceGroup label="Preferred delivery format" options={DELIVERY_FORMATS} value={values.deliveryFormat} onChange={setField('deliveryFormat')} />
              <ChoiceGroup label="How will your certification be funded?" options={SPONSORSHIPS} value={values.sponsorship} onChange={setField('sponsorship')} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginTop: 28 }}>
                <button type="submit" style={{ ...primaryBtn, border: 'none', cursor: 'pointer' }}>Start the audit <ArrowRight size={14} /></button>
                <button type="button" onClick={() => setStage('bio')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: bod, fontSize: 13.5, color: C.muted, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <ArrowLeft size={14} /> Back
                </button>
              </div>
            </motion.form>
          )}

          {result && (
            <Reveal>
              <div style={{ position: 'relative', maxWidth: 820, margin: '0 auto' }}>
                <ResultConfetti burstKey={celebrateKey} />
                <motion.div
                  key={`result-card-${celebrateKey}`}
                  initial={{ opacity: 0, scale: 0.94, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: EASE }}
                  style={{
                    position: 'relative', zIndex: 1, borderRadius: 24, border: `1px solid ${C.border}`,
                    background: C.white, overflow: 'hidden', boxShadow: '0 22px 60px rgba(17,28,66,0.10)',
                  }}
                >
                <div style={{ padding: '36px 40px', background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyDark} 100%)`, color: C.white }}>
                  <p style={{ fontFamily: dis, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.orangeOnDark }}>Your recommended track</p>
                  <h3 style={{ fontFamily: dis, fontWeight: 800, fontSize: 'clamp(28px,3.4vw,40px)', letterSpacing: '-0.03em', lineHeight: 1.05, marginTop: 12 }}>
                    {result.track.name}
                  </h3>
                  <p style={{ fontFamily: dis, fontWeight: 700, fontSize: 18, color: C.orangeOnDark, marginTop: 10 }}>
                    {result.track.acronym}
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}> · {result.strand.name}</span>
                  </p>
                </div>

                <div style={{ padding: '32px 40px', display: 'grid', gap: 22 }}>
                  <MetaRow label="Primary focus" value={result.coreFocus} />
                  <div>
                    <p style={{ fontFamily: dis, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.faint, marginBottom: 8 }}>Why this fits you</p>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
                      {result.bullets.map((b) => (
                        <li key={b} style={{ fontFamily: bod, fontSize: 14.5, lineHeight: 1.6, color: C.text }}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p style={{ fontFamily: dis, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.faint, marginBottom: 8 }}>Key capstone</p>
                    <p style={{ fontFamily: dis, fontWeight: 800, fontSize: 17, color: C.text }}>{result.track.capstone.name}</p>
                    <p style={{ fontFamily: bod, fontSize: 14, lineHeight: 1.65, color: C.muted, marginTop: 6 }}>{result.track.capstone.desc}</p>
                  </div>

                  {error && (
                    <p style={{ fontFamily: bod, fontSize: 13, color: '#c0392b', background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.18)', borderRadius: 8, padding: '12px 14px' }}>
                      {error}
                    </p>
                  )}

                  {saved ? (
                    <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.28)' }}>
                      <p style={{ fontFamily: dis, fontWeight: 700, fontSize: 14, color: C.text }}>Audit saved to your member profile.</p>
                      <p style={{ fontFamily: bod, fontSize: 13.5, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
                        You can review this recommendation anytime from your dashboard.
                      </p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                        <Link href="/dashboard" style={primaryBtn}>Go to dashboard <ArrowRight size={14} /></Link>
                        <a href={PROSPECTUS_HREF} download style={secondaryBtn}><Download size={14} /> Download prospectus</a>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 14 }}>
                      <button type="button" onClick={() => void handleSave()} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.7 : 1, border: 'none', cursor: saving ? 'default' : 'pointer', width: '100%', justifyContent: 'center' }}>
                        {saving ? 'Saving your audit…' : user ? 'Save my results' : 'Sign in to save my results'}
                        {!saving && <ArrowRight size={14} />}
                      </button>
                      {!user && (
                        <p style={{ fontFamily: bod, fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 1.6 }}>
                          Anyone can run the audit. Saving it to your profile needs an AIPEA account.{' '}
                          <Link href={`/sign-up?next=${encodeURIComponent('/certification/track-finder')}`} style={{ color: C.orange, fontWeight: 600 }} onClick={() => savePendingScopeAudit({ horizon: result.horizon, scope: result.scope, profile: values })}>
                            Create a free Associate account →
                          </Link>
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button type="button" onClick={retake} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: bod, fontSize: 13, color: C.muted, textDecoration: 'underline' }}>
                          Retake the audit
                        </button>
                        <Link href="/certification#strands" style={{ fontFamily: bod, fontSize: 13, color: C.muted }}>Compare all designations</Link>
                      </div>
                    </div>
                  )}
                </div>
                </motion.div>
              </div>

              {(saved || values.sponsorship === EMPLOYER_FUNDED) && (
                <div style={{ maxWidth: 820, margin: '28px auto 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="aipea-feature-grid">
                  {saved && <NextStepCard
                    icon={<Download size={18} color={C.orange} />}
                    title="Review your prospectus"
                    body={`Download the curriculum breakdown for the ${result.track.acronym} path.`}
                    href={PROSPECTUS_HREF}
                    cta="Download PDF"
                    download
                  />}
                  <NextStepCard
                    icon={<Mail size={18} color={C.orange} />}
                    title="Justify corporate funding"
                    body="Over 80% of AIPEA delegates receive partial or full sponsorship from their employers. Request the Letter to Your Boss pack."
                    href={JUSTIFICATION_MAIL}
                    cta="Request justification pack"
                  />
                </div>
              )}
            </Reveal>
          )}
        </div>
      </section>

      <section style={{ ...SECTION, background: C.surface }}>
        <div style={INNER}>
          <SectionHeading
            eyebrow="How placement works"
            title="A two-axis matrix, not a title quiz."
            aside={`${ORG.abbreviation} maps operational horizon against accountability scope to place you on one of six designations.`}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="aipea-feature-grid">
            {[
              { label: 'Horizon 1 · Tactical', a: 'CERTPA', b: 'SCPA' },
              { label: 'Horizon 2 · Strategic', a: 'CEA', b: 'SCEA' },
              { label: 'Horizon 3 · Institutional', a: 'CCoS', b: 'SCCoS' },
            ].map((row) => (
              <div key={row.label} style={{ padding: '22px 24px', borderRadius: 16, border: `1px solid ${C.border}`, background: C.bg }}>
                <p style={{ fontFamily: dis, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.orange }}>{row.label}</p>
                <p style={{ fontFamily: bod, fontSize: 13.5, color: C.muted, marginTop: 12 }}>Scope A → <strong style={{ color: C.text }}>{row.a}</strong></p>
                <p style={{ fontFamily: bod, fontSize: 13.5, color: C.muted, marginTop: 6 }}>Scope B → <strong style={{ color: C.text }}>{row.b}</strong></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to certify the value you already bring?"
        body="Save your audit, then talk to the Secretariat to lock in your preferred learning matrix for the next intake."
        primary={{ label: 'Talk to the Secretariat', href: '/about#contact' }}
        secondary={{ label: 'Explore certification', href: '/certification' }}
      />
    </PageShell>
  )
}

const stepEyebrow: CSSProperties = { fontFamily: dis, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.orange, marginTop: 18 }
const stepTitle: CSSProperties = { fontFamily: dis, fontWeight: 800, fontSize: 'clamp(22px,2.8vw,30px)', letterSpacing: '-0.02em', lineHeight: 1.2, color: C.text, marginTop: 10 }
const stepIntro: CSSProperties = { fontFamily: bod, fontSize: 15, lineHeight: 1.7, color: C.muted, marginTop: 10 }
const errorBox: CSSProperties = { fontFamily: bod, fontSize: 13, color: '#c0392b', background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.18)', borderRadius: 8, padding: '12px 14px', marginTop: 24 }

function StepBar({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 6 }} role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} aria-label="Profile progress">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < current ? C.orange : C.border, transition: 'background 0.3s' }} />
      ))}
    </div>
  )
}

const inputStyle: CSSProperties = {
  width: '100%', fontFamily: bod, fontSize: 15, color: C.text, background: C.white,
  border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', outline: 'none',
}
const fieldLabel: CSSProperties = { fontFamily: dis, fontSize: 12, fontWeight: 700, color: C.text }

function TextField({ label, value, onChange, required, type = 'text', placeholder, autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean
  type?: string; placeholder?: string; autoComplete?: string
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={fieldLabel}>{label}{required && <span style={{ color: C.orange }}> *</span>}</span>
      <input
        type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)} style={inputStyle}
        onFocus={(e) => { e.currentTarget.style.borderColor = C.orange }}
        onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
      />
    </label>
  )
}

function ChoiceGroup({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <fieldset style={{ border: 'none', padding: 0, margin: '28px 0 0' }}>
      <legend style={{ ...fieldLabel, marginBottom: 10 }}>{label}</legend>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {options.map((o) => {
          const on = value === o
          return (
            <button
              key={o} type="button" aria-pressed={on} onClick={() => onChange(on ? '' : o)}
              style={{
                cursor: 'pointer', fontFamily: bod, fontSize: 13.5, lineHeight: 1.4, textAlign: 'left',
                padding: '10px 16px', borderRadius: 999,
                border: `1.5px solid ${on ? C.orange : C.border}`,
                background: on ? 'rgba(232,80,26,0.06)' : C.white, color: C.text,
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              {o}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: dis, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.faint, marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: bod, fontSize: 15, lineHeight: 1.65, color: C.text }}>{value}</p>
    </div>
  )
}

type ConfettiPiece = {
  id: number
  x: number
  y: number
  rotate: number
  delay: number
  size: number
  color: string
  shape: 'rect' | 'circle' | 'strip'
}

const CONFETTI_COLORS = [C.orange, C.orangeOnDark, C.navy, C.navyDark, '#F6C344', '#ffffff']

function ResultConfetti({ burstKey }: { burstKey: number }) {
  const reduced = useReducedMotion()
  const pieces = useMemo<ConfettiPiece[]>(() => {
    if (reduced || burstKey === 0) return []
    return Array.from({ length: 48 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 48 + (i % 5) * 0.18
      const distance = 120 + (i % 7) * 38
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 40 - (i % 4) * 18,
        rotate: (i * 47) % 360,
        delay: (i % 8) * 0.03,
        size: 6 + (i % 5) * 2,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'strip' : 'rect',
      }
    })
  }, [burstKey, reduced])

  if (pieces.length === 0) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: '-48px -36px',
        pointerEvents: 'none',
        zIndex: 2,
        overflow: 'visible',
      }}
    >
      {pieces.map((piece) => (
        <motion.span
          key={`${burstKey}-${piece.id}`}
          initial={{ opacity: 0, x: 0, y: 40, scale: 0.4, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: piece.x,
            y: [40, piece.y * 0.55, piece.y + 90],
            scale: [0.4, 1.05, 0.85],
            rotate: piece.rotate + 180,
          }}
          transition={{ duration: 1.55, delay: piece.delay, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '18%',
            width: piece.shape === 'strip' ? piece.size * 0.45 : piece.size,
            height: piece.shape === 'strip' ? piece.size * 2.2 : piece.size,
            borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'strip' ? 2 : 3,
            background: piece.color,
            boxShadow: piece.color === '#ffffff' ? '0 0 0 1px rgba(17,28,66,0.12)' : undefined,
          }}
        />
      ))}
    </div>
  )
}

function NextStepCard({ icon, title, body, href, cta, download }: {
  icon: ReactNode; title: string; body: string; href: string; cta: string; download?: boolean
}) {
  return (
    <a href={href} download={download || undefined} style={{ textDecoration: 'none', padding: '22px 24px', borderRadius: 16, border: `1px solid ${C.border}`, background: C.bg, display: 'block' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(232,80,26,0.1)', display: 'grid', placeItems: 'center', marginBottom: 14 }}>{icon}</div>
      <p style={{ fontFamily: dis, fontWeight: 800, fontSize: 16, color: C.text }}>{title}</p>
      <p style={{ fontFamily: bod, fontSize: 13.5, lineHeight: 1.65, color: C.muted, marginTop: 8 }}>{body}</p>
      <p style={{ fontFamily: dis, fontWeight: 700, fontSize: 12.5, color: C.orange, marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>{cta} <ArrowRight size={13} /></p>
    </a>
  )
}

const primaryBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: C.orange, color: C.white, fontFamily: dis, fontWeight: 700, fontSize: 14,
  padding: '14px 22px', borderRadius: 10, textDecoration: 'none',
}

const secondaryBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: C.white, color: C.text, fontFamily: dis, fontWeight: 700, fontSize: 13.5,
  padding: '13px 18px', borderRadius: 10, textDecoration: 'none',
  border: `1px solid ${C.borderHover}`,
}