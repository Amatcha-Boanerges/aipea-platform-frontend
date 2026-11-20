'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  motion,
  useInView,
  useReducedMotion,
  useMotionValue,
  useSpring,
  type Transition,
} from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Check, Users, BookOpen, Calendar, GraduationCap, Mail, MapPin } from 'lucide-react'
import { SiteNav } from '@/components/site/SiteNav'
import { SiteFooter } from '@/components/site/SiteFooter'
import { CONFERENCE, CONTACT, DNA } from '@/lib/facts'

// --- Tokens -------------------------------------------------------------------

const C = {
  orange:      '#E8501A',
  orangeDim:   '#c94314',
  // Brand orange only reaches 3.6:1 on navy, which fails WCAG AA for text under
  // ~19px. Use this tint for small orange text on a dark surface (5.9:1).
  orangeOnDark:'#FF8A5B',
  navy:        '#1B2A5E',
  navyDark:    '#111c42',
  white:       '#ffffff',
  bg:          '#ffffff',
  surface:     '#f7f8fc',
  elevated:    '#eef1f8',
  text:        '#111c42',
  muted:       'rgba(17,28,66,0.68)',
  faint:       'rgba(17,28,66,0.5)',
  border:      'rgba(27,42,94,0.09)',
  borderHover: 'rgba(27,42,94,0.22)',
} as const

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const dis = 'var(--font-syne), sans-serif'
const bod = 'var(--font-inter), sans-serif'

// Spacing scale. Every gap on the page is one of these steps, so the rhythm is a
// decision rather than an accumulation of one-off numbers. Steps roughly follow a
// 1.5x ratio off an 8px base; `section` and `headerGap` are the two that set the
// page's overall density.
const S = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 64,
  section: 88,   // vertical padding inside a section
  headerGap: 44, // section header to its content
} as const

const SECTION: React.CSSProperties = { padding: `${S.section}px 40px` }
const INNER: React.CSSProperties   = { maxWidth: 1400, margin: '0 auto' }

// --- Utilities ----------------------------------------------------------------

function ScrollReveal({ children, delay = 0, style, className }: {
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' as `${number}px` })
  const reduced = useReducedMotion()
  return (
    <motion.div ref={ref} className={className} style={style}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: reduced ? 0 : 0.65, delay: reduced ? 0 : delay, ease: EASE } satisfies Transition}
    >
      {children}
    </motion.div>
  )
}

function TiltCard({ children, max = 5, style }: { children: React.ReactNode; max?: number; style?: React.CSSProperties }) {
  const reduced = useReducedMotion()
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const sRx = useSpring(rx, { stiffness: 150, damping: 16 })
  const sRy = useSpring(ry, { stiffness: 150, damping: 16 })
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduced) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ry.set(px * max * 2)
    rx.set(-py * max * 2)
  }
  function reset() { rx.set(0); ry.set(0) }
  return (
    <motion.div onMouseMove={onMove} onMouseLeave={reset}
      style={{ height: '100%', rotateX: reduced ? 0 : sRx, rotateY: reduced ? 0 : sRy, transformPerspective: 1000, ...style }}>
      {children}
    </motion.div>
  )
}


type Dir = 'up' | 'left' | 'right' | 'scale'
function Reveal({ children, delay = 0, from = 'up', style, className }: {
  children: React.ReactNode; delay?: number; from?: Dir; style?: React.CSSProperties; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' as `${number}px` })
  const reduced = useReducedMotion()
  const offset: Record<Dir, Record<string, number>> = { up: { y: 30 }, left: { x: -44 }, right: { x: 44 }, scale: { scale: 0.92 } }
  return (
    <motion.div ref={ref} className={className} style={style}
      initial={{ opacity: 0, ...offset[from] }}
      animate={inView ? { opacity: 1, x: 0, y: 0, scale: 1 } : {}}
      transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : delay, ease: EASE } satisfies Transition}>
      {children}
    </motion.div>
  )
}

function SectionHeader({ statement, aside, align = 'split', nowrap = false }: {
  statement: string; aside?: string; align?: 'split' | 'center' | 'stacked'; nowrap?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' as `${number}px` })
  const reduced = useReducedMotion()
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: reduced ? 0 : 0.7, delay: reduced ? 0 : delay, ease: EASE } satisfies Transition,
  })

  if (align === 'center') {
    return (
      <div ref={ref} style={{ textAlign: 'center', maxWidth: nowrap ? 'none' : 720, margin: `0 auto ${S.headerGap}px` }}>
        <motion.h2 {...rise(0)} style={{ fontFamily: dis, fontWeight: 800, color: C.text, fontSize: nowrap ? 'clamp(22px,3.4vw,56px)' : 'clamp(30px,4vw,56px)', lineHeight: 1.05, letterSpacing: '-0.03em', whiteSpace: nowrap ? 'nowrap' : 'normal' }}>{statement}</motion.h2>
        {aside && <motion.p {...rise(0.08)} style={{ fontFamily: bod, fontSize: 15, lineHeight: 1.7, color: C.muted, marginTop: S.xs }}>{aside}</motion.p>}
      </div>
    )
  }

  if (align === 'stacked') {
    return (
      <div ref={ref} style={{ marginBottom: S.headerGap }}>
        <motion.h2 {...rise(0)} style={{ fontFamily: dis, fontWeight: 800, color: C.text, fontSize: 'clamp(30px,4.4vw,62px)', lineHeight: 1.02, letterSpacing: '-0.035em', maxWidth: 880 }}>{statement}</motion.h2>
        <motion.p {...rise(0.08)} style={{ fontFamily: bod, fontSize: 15, lineHeight: 1.7, color: C.muted, marginTop: S.xs, maxWidth: 460 }}>{aside}</motion.p>
      </div>
    )
  }

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'flex-end', gap: S.lg, paddingBottom: S.md, borderBottom: `1px solid ${C.border}`, marginBottom: S.headerGap, flexWrap: 'wrap' }}>
      <motion.h2 {...rise(0)} style={{ fontFamily: dis, fontWeight: 800, flex: 1, minWidth: 280, maxWidth: 620, color: C.text, fontSize: 'clamp(26px,3.2vw,44px)', lineHeight: 1.12, letterSpacing: '-0.02em' }}>{statement}</motion.h2>
      <motion.p {...rise(0.08)} style={{ fontFamily: bod, fontSize: 14, lineHeight: 1.75, maxWidth: 240, color: C.muted }}>{aside}</motion.p>
    </div>
  )
}

// --- Hero ---------------------------------------------------------------------

const HERO_SLIDES = [
  {
    src: '/images/conference/optimized/hero-main-alt.webp',
    alt: 'Attendees gathered in the PA Conference hall',
    objectPosition: 'center center',
  },
  {
    src: '/images/conference/optimized/hero-crowd-1.jpg',
    alt: 'Delegates seated across the PA Conference hall in Accra',
    objectPosition: 'center 55%',
  },
  {
    src: '/images/conference/optimized/hero-crowd-2.jpg',
    alt: 'A full hall of delegates facing the main stage',
    objectPosition: 'center 55%',
  },
  {
    src: '/images/conference/optimized/hero-crowd-3.jpg',
    alt: 'Delegates at their tables during a conference session',
    objectPosition: 'center 55%',
  },
  {
    src: '/images/conference/optimized/hero-crowd-4.jpg',
    alt: 'The audience watching a speaker at the PA Conference',
    objectPosition: 'center 55%',
  },
]

function Hero() {
  const [heroIndex, setHeroIndex] = useState(0)
  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE } satisfies Transition,
  })

  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex(i => (i + 1) % HERO_SLIDES.length)
    }, 6500)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="aipea-hero-section" style={{ position: 'relative', overflow: 'hidden', background: C.white }}>

      {/* Soft orange glow bottom-right */}
      <div className="aipea-float" style={{ position: 'absolute', right: '8%', bottom: '10%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,80,26,0.22), rgba(232,80,26,0.06) 42%, transparent 70%)', opacity: 0.14, filter: 'blur(2px)', pointerEvents: 'none', zIndex: 1 }} />

      <div className="aipea-hero-visual" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Every slide stays mounted and crossfades on opacity. Swapping a single
            <Image> via AnimatePresence meant each photo only began downloading at
            the moment it became visible, so the transition showed a grey frame
            while it fetched. Mounted-and-eager costs one upfront load instead. */}
        {HERO_SLIDES.map((slide, i) => (
          <motion.div
            key={slide.src}
            initial={false}
            animate={{ opacity: i === heroIndex ? 1 : 0 }}
            transition={{ duration: 1.1, ease: EASE }}
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden={i !== heroIndex}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: slide.objectPosition }}
              {...(i === 0 ? { priority: true } : { loading: 'eager' as const })}
            />
          </motion.div>
        ))}

        {/* A light editorial grade keeps the conference photo visible while giving
            the hero copy enough contrast. */}
        <div style={{ position: 'absolute', inset: 0, background: C.navy, mixBlendMode: 'multiply', opacity: 0.2 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(12,20,50,0.8) 0%, rgba(18,28,64,0.66) 34%, rgba(18,28,64,0.3) 64%, rgba(18,28,64,0.12) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,16,40,0.48) 0%, rgba(10,16,40,0.22) 34%, transparent 68%)' }} />
        {/* Top scrim: the nav is transparent over this image for the first 12px of
            scroll, and its light chrome needs something to sit against. */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(11,19,48,0.36) 0%, rgba(11,19,48,0.08) 14%, transparent 24%)' }} />
      </div>

      {/* Content: center-left, balanced by a compact conference card on the right. */}
      <div className="aipea-hero-content" style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', minHeight: 'inherit', padding: '128px 40px 88px' }}>
        <div style={{ ...INNER, width: '100%' }}>
          <div className="aipea-hero-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.95fr) minmax(260px, 0.45fr)', gap: 48, alignItems: 'center' }}>
            <div>
              <motion.h1 {...fade(0.18)} className="aipea-hero-h1" style={{ fontFamily: dis, fontWeight: 800, fontSize: 'clamp(38px,5vw,76px)', lineHeight: 0.98, letterSpacing: '-0.04em', color: C.white, maxWidth: 860, textShadow: '0 4px 28px rgba(0,0,0,0.42)' }}>
                Africa&apos;s professional home for <span style={{ color: '#FF9A70' }}>Personal &amp; Executive Assistants.</span>
              </motion.h1>

              <motion.p {...fade(0.26)} className="aipea-hero-sub" style={{ fontFamily: bod, fontSize: 'clamp(15px,1.6vw,18px)', lineHeight: 1.65, color: 'rgba(255,255,255,0.9)', maxWidth: 560, marginTop: S.sm, textShadow: '0 2px 18px rgba(0,0,0,0.42)' }}>
                A member-based institute for learning, certification, networking, and professional growth across Africa.
              </motion.p>

              <motion.div {...fade(0.34)} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: S.md }}>
                <Link href="/sign-up"
                  style={{ fontFamily: dis, fontWeight: 700, fontSize: 14, color: C.white, background: C.orange, padding: '13px 28px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.orangeDim)}
                  onMouseLeave={e => (e.currentTarget.style.background = C.orange)}>
                  Join AIPEA <ArrowRight size={15} />
                </Link>
                <Link href="/membership" style={{ fontFamily: dis, fontWeight: 700, fontSize: 14, color: C.white, border: '1px solid rgba(255,255,255,0.34)', padding: '12px 24px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  Explore membership
                </Link>
              </motion.div>

              <motion.div {...fade(0.5)} className="aipea-hero-values" style={{ marginTop: S.xl }}>
                <p style={{ fontFamily: dis, fontWeight: 800, fontSize: 'clamp(22px,2.6vw,34px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.white, textShadow: '0 3px 22px rgba(0,0,0,0.45)', lineHeight: 1.2 }}>
                  Growth<span style={{ color: C.orangeOnDark }}>.</span> Value<span style={{ color: C.orangeOnDark }}>.</span> Impact<span style={{ color: C.orangeOnDark }}>.</span>
                </p>
              </motion.div>
            </div>

            <motion.aside {...fade(0.42)} className="aipea-hero-card" style={{ justifySelf: 'end', width: 'min(100%, 340px)', borderRadius: 22, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(10,16,40,0.46)', backdropFilter: 'blur(16px)', padding: 24, color: C.white }}>
              <h2 style={{ fontFamily: dis, fontWeight: 800, fontSize: 26, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 10 }}>
                {CONFERENCE.name}
              </h2>
              <p style={{ fontFamily: bod, fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>
                {CONFERENCE.dateLabel}
                <br />
                {CONFERENCE.venue}, {CONFERENCE.city}
              </p>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.16)', margin: '20px 0' }} />
              <p style={{ fontFamily: bod, fontSize: 13, color: 'rgba(255,255,255,0.62)', lineHeight: 1.6 }}>
                Professional growth · Community · Impact
              </p>
            </motion.aside>
          </div>
        </div>
      </div>
    </section>
  )
}

// --- Pillar strip (ASAP homepage: Membership · Resources · Cert · Events) -----

const pillars = [
  { icon: Users,         label: 'Membership',    title: 'Connect, learn and grow.',      desc: 'Join a Pan-African community of executive professionals.', href: '/membership' },
  { icon: GraduationCap, label: 'Certification', title: 'Certified on scope, not only years.', desc: 'Six designations across three professional strands.', href: '/certification' },
  { icon: BookOpen,      label: 'Resources',     title: 'Built for the workplace.',        desc: 'Every module ends in something your employer can use.', href: '/resources' },
  { icon: Calendar,      label: 'Events',        title: 'Peer-to-peer, face-to-face.',    desc: `${CONFERENCE.name} — ${CONFERENCE.dateLabel}, Accra.`, href: '#events' },
]

function PillarStrip() {
  return (
    <section style={{ padding: `${S.xl}px 40px ${S.section}px`, background: C.bg }}>
      <div style={INNER}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} className="aipea-pillars-grid">
          {pillars.map((p, i) => {
            const Icon = p.icon
            return (
              <ScrollReveal key={p.label} delay={0.06 * i}>
                {/* Solid navy cards: the client didn't want the off-white/grey
                    surface reading flat against the white page. A navy gradient with
                    an orange corner glow gives the strip depth and puts it on-brand. */}
                <a href={p.href} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '28px 26px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.09)', background: `linear-gradient(155deg, ${C.navy} 0%, ${C.navyDark} 100%)`, textDecoration: 'none', transition: 'box-shadow 0.24s, transform 0.24s, border-color 0.24s', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(17,28,66,0.14)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,80,26,0.5)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(17,28,66,0.28)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(17,28,66,0.14)'; e.currentTarget.style.transform = 'none' }}>
                  <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,80,26,0.28), transparent 70%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'relative', zIndex: 1, width: 44, height: 44, borderRadius: 12, background: 'rgba(232,80,26,0.16)', border: '1px solid rgba(232,80,26,0.28)', display: 'grid', placeItems: 'center', marginBottom: 20 }}>
                    <Icon size={20} color={C.orange} />
                  </div>
                  <p style={{ position: 'relative', zIndex: 1, fontFamily: dis, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.orangeOnDark, marginBottom: 10 }}>{p.label}</p>
                  <h3 style={{ position: 'relative', zIndex: 1, fontFamily: dis, fontWeight: 800, fontSize: 20, lineHeight: 1.15, letterSpacing: '-0.02em', color: C.white, marginBottom: 10 }}>{p.title}</h3>
                  <p style={{ position: 'relative', zIndex: 1, fontFamily: bod, fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.62)', flex: 1 }}>{p.desc}</p>
                  <span style={{ position: 'relative', zIndex: 1, fontFamily: dis, fontWeight: 700, fontSize: 12, color: C.orangeOnDark, marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    Learn more <ArrowRight size={13} />
                  </span>
                </a>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// --- Event highlight (ASAP in-person event cards) -----------------------------

function useCountdown(target: Date) {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now())
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  return left
}

// Sourced from facts.ts so the countdown, the hero card and the events page can
// never drift apart again.
const CONFERENCE_DATE = CONFERENCE.startDate

function EventHighlight() {
  const { d, h, m, s } = useCountdown(CONFERENCE_DATE)
  const units = [['Days', d], ['Hrs', h], ['Min', m], ['Sec', s]] as const
  return (
    <section id="events" style={{ ...SECTION, background: C.navyDark, color: C.white, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 78% 30%, rgba(232,80,26,0.2), transparent 40%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.08 }}>
        <Image
          src="/images/conference/optimized/events-hero.webp"
          alt="Professional conference background"
          fill
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />
      </div>
      <div style={{ ...INNER, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }} className="aipea-event-grid">
          <ScrollReveal>
            <p style={{ fontFamily: dis, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.orange, marginBottom: 16 }}>Join us in person</p>
            <h2 style={{ fontFamily: dis, fontWeight: 800, fontSize: 'clamp(32px,4vw,52px)', lineHeight: 1.02, letterSpacing: '-0.03em', marginBottom: 16 }}>
              {CONFERENCE.name}
            </h2>
            <p style={{ fontFamily: bod, fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 8 }}>
              {CONFERENCE.dateLabel} · {CONFERENCE.venue}, {CONFERENCE.city}
            </p>
            <p style={{ fontFamily: bod, fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 420 }}>
              {CONFERENCE.description}
            </p>
            <a href="#contact"
              style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: dis, fontWeight: 700, fontSize: 14, color: C.navyDark, background: C.white, padding: '13px 26px', borderRadius: 8, textDecoration: 'none', transition: 'transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
              Register interest <ArrowRight size={15} />
            </a>
          </ScrollReveal>
          <ScrollReveal delay={0.12}>
            <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', padding: '36px 32px' }}>
              <p style={{ fontFamily: dis, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Conference opens in</p>
              <div className="aipea-countdown" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {units.map(([label, val]) => (
                  <div key={label} style={{ textAlign: 'center', padding: '18px 8px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontFamily: dis, fontWeight: 800, fontSize: 'clamp(28px,4vw,40px)', lineHeight: 1, letterSpacing: '-0.04em', color: val > 0 || label === 'Sec' ? C.white : 'rgba(255,255,255,0.25)' }}>
                      {String(val).padStart(2, '0')}
                    </div>
                    <div style={{ fontFamily: bod, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

// --- About --------------------------------------------------------------------

function About() {
  return (
    <section id="about" className="aipea-about-section" style={{ ...SECTION, background: C.bg }}>
      <div style={INNER}>
        <SectionHeader align="center" statement="Africa's home for executive professionals." aside="One membership. Everything you need." />
          {/* Full-bleed photograph with the purpose statement overlaid, so the
              image carries the whole section rather than sitting as a banner
              above a separate text block. */}
          <Reveal className="aipea-about-story-card" style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', minHeight: 'clamp(460px,64vh,640px)', background: 'linear-gradient(135deg, #0d1831 0%, #1B2A5E 55%, #24396e 100%)' }}>
            <div className="aipea-about-photo" style={{ position: 'absolute', inset: 0 }}>
              <Image
                src="/images/conference/optimized/about-story.webp"
                alt="AIPEA members gathered at the annual conference in Accra"
                fill
                sizes="(max-width: 768px) 100vw, 1400px"
                style={{ objectFit: 'cover', objectPosition: 'center 62%' }}
              />
            </div>
            {/* Scrims: darken top (for the kicker) and bottom (for the statement)
                while leaving the photograph's midtones visible. */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,16,40,0.6) 0%, rgba(10,16,40,0.18) 22%, rgba(10,16,40,0.28) 55%, rgba(10,16,40,0.82) 100%)' }} />

            <div className="aipea-about-kicker" style={{ position: 'absolute', top: 26, left: 30, fontFamily: dis, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>
              Community. Conferences.
            </div>

            <div className="aipea-about-avatars" style={{ position: 'absolute', top: 22, right: 30, display: 'flex', alignItems: 'center' }}>
              {([['AA', C.orange], ['JO', '#1B2A5E'], ['NK', '#059669'], ['FM', '#7c3aed'], ['TM', '#0891b2']] as [string, string][]).map(([ini, color], i) => (
                <div key={ini} style={{ width: 34, height: 34, borderRadius: '50%', background: color, border: '2.5px solid rgba(255,255,255,0.3)', display: 'grid', placeItems: 'center', fontFamily: dis, fontWeight: 800, fontSize: 10, color: C.white, marginLeft: i > 0 ? -12 : 0, zIndex: 10 - i, position: 'relative' }}>{ini}</div>
              ))}
            </div>

            {/* Overlaid statement, anchored to the lower half of the image. */}
            <div className="aipea-about-statement" style={{ position: 'absolute', left: 'clamp(28px,5vw,72px)', right: 'clamp(28px,5vw,72px)', bottom: 'clamp(36px,5vw,64px)', textAlign: 'center' }}>
              <p className="aipea-about-purpose" style={{ fontFamily: dis, fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18 }}>Our purpose</p>
              <p className="aipea-about-title" style={{ fontFamily: dis, fontWeight: 800, fontSize: 'clamp(28px,3.6vw,52px)', lineHeight: 1.08, letterSpacing: '-0.025em', color: C.white, maxWidth: 900, margin: '0 auto', textShadow: '0 2px 24px rgba(6,10,30,0.5)' }}>
                Where assistants and the leaders they support succeed together.
              </p>
              <p className="aipea-about-desc" style={{ fontFamily: bod, fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.78)', maxWidth: 560, margin: '18px auto 0' }}>
                Professional recognition for the people behind executive performance.
              </p>
              <div className="aipea-about-pills" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
                <span style={{ fontFamily: dis, fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.white, border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999, padding: '8px 16px' }}>Rooted in Africa</span>
                <span style={{ fontFamily: dis, fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.white, border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999, padding: '8px 16px' }}>Serving the World</span>
              </div>
            </div>
          </Reveal>
      </div>
    </section>
  )
}

// --- Core values (from the AIPEA brochure) -------------------------------------

// The AIPEA DNA. Titles come from facts.ts; the three words under each are a
// house summary of the fuller descriptions there.
const coreValues = [
  { n: '01', title: DNA[0].title, words: ['Learn', 'Advance', 'Lead'] },
  { n: '02', title: DNA[1].title, words: ['Excellence', 'Integrity', 'ROI'] },
  { n: '03', title: DNA[2].title, words: ['Empower', 'Connect', 'Champion'] },
]

function ValueCard({ value }: { value: (typeof coreValues)[number] }) {
  const [hovered, setHovered] = useState(false)
  return (
    <TiltCard>
      <div
        className="aipea-value-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative', overflow: 'hidden', height: '100%', minHeight: 320, borderRadius: 22,
          border: `1px solid ${hovered ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.14)'}`,
          background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyDark} 100%)`,
          color: C.white, padding: 34,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: hovered ? '0 32px 80px rgba(27,42,94,0.32)' : '0 12px 40px rgba(27,42,94,0.18)',
          transform: hovered ? 'translateY(-10px) scale(1.035)' : 'translateY(0) scale(1)',
          transition: 'border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}>
        <div className="aipea-spin" style={{
          position: 'absolute', top: -54, right: -54, width: 180, height: 180, borderRadius: '50%',
          border: `1px dashed ${hovered ? 'rgba(232,80,26,0.4)' : 'rgba(255,255,255,0.2)'}`,
          transition: 'border-color 0.4s ease',
        }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', marginTop: 6,
            background: C.orange,
            boxShadow: hovered ? '0 0 0 6px rgba(232,80,26,0.18)' : '0 0 0 0 rgba(232,80,26,0)',
            transition: 'box-shadow 0.5s ease',
          }} />
          <span style={{ fontFamily: dis, fontWeight: 800, fontSize: 44, letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.18)' }}>{value.n}</span>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h3 style={{ fontFamily: dis, fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', marginBottom: 14, color: hovered ? C.orangeOnDark : C.white, transition: 'color 0.4s ease' }}>{value.title}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {value.words.map((w, wi) => (
              <motion.span key={w}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: wi * 0.12, ease: EASE }}
                style={{ fontFamily: dis, fontWeight: 700, fontSize: 19, letterSpacing: '-0.01em', color: hovered ? C.orangeOnDark : 'rgba(255,255,255,0.92)', transition: 'color 0.4s ease' }}>
                <span style={{ color: C.orange, marginRight: 9 }}>·</span>{w}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </TiltCard>
  )
}

function CoreValues() {
  return (
    <section id="values" style={{ ...SECTION, background: C.bg }}>
      <div style={INNER}>
        <SectionHeader align="center" statement="The values behind the standard." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }} className="aipea-values-grid">
          {coreValues.map((v, i) => (
            <ScrollReveal key={v.title} delay={0.1 * i}>
              <ValueCard value={v} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- Contact ------------------------------------------------------------------

function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const inputStyle: React.CSSProperties = { width: '100%', background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: C.text, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s', fontFamily: bod }
  const labelStyle: React.CSSProperties = { display: 'block', fontFamily: dis, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.faint, marginBottom: 7 }
  type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  const onFocus = (e: React.FocusEvent<Field>) => {
    e.target.style.borderColor = C.orange
    e.target.style.boxShadow = '0 0 0 4px rgba(232,80,26,0.12)'
    e.target.style.background = C.bg
  }
  const onBlur = (e: React.FocusEvent<Field>) => {
    e.target.style.borderColor = C.border
    e.target.style.boxShadow = 'none'
    e.target.style.background = C.surface
  }
  const onHoverIn = (e: React.MouseEvent<Field>) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = C.borderHover }
  const onHoverOut = (e: React.MouseEvent<Field>) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = C.border }

  return (
    <section id="contact" style={{ ...SECTION, background: C.surface }}>
      <div style={INNER}>
        <ScrollReveal>
          <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', marginBottom: S.lg }}>
            <p style={{ fontFamily: dis, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.orange, marginBottom: 14 }}>Contact</p>
            <div style={{ fontFamily: dis, fontWeight: 800, fontSize: 'clamp(32px,4vw,52px)', color: C.text, lineHeight: 1.05, letterSpacing: '-0.03em' }}>Get in touch.</div>
            <p style={{ fontFamily: bod, fontSize: 16, lineHeight: 1.7, color: C.muted, marginTop: S.sm }}>Questions about membership, certification, or partnering with AIPEA? Send us a note and the team will get back to you.</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', maxWidth: 900, margin: '0 auto', borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 24px 64px rgba(27,42,94,0.14)' }} className="aipea-contact-grid">
            <div style={{ background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyDark} 100%)`, padding: 28, position: 'relative', overflow: 'hidden', color: C.white, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 82% 10%, rgba(232,80,26,0.28), transparent 38%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontFamily: dis, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.orangeOnDark, marginBottom: 24 }}>Reach us directly</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {[
                    { icon: Mail,   label: 'Email',       value: CONTACT.email },
                    { icon: MapPin, label: 'Head office', value: CONTACT.location },
                  ].map(c => {
                    const Ico = c.icon
                    return (
                      <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ico size={18} color={C.orangeOnDark} /></span>
                        <span>
                          <span style={{ display: 'block', fontFamily: bod, fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{c.label}</span>
                          <span style={{ display: 'block', fontFamily: dis, fontWeight: 700, fontSize: 15, color: C.white, marginTop: 2 }}>{c.value}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <p style={{ position: 'relative', zIndex: 1, fontFamily: bod, fontSize: 13, color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, marginTop: 28 }}>Prefer to join straight away? Associate membership is free — you can <Link href="/sign-up" style={{ color: C.orangeOnDark, fontWeight: 600 }}>sign up here</Link>.</p>
            </div>

            <div style={{ background: C.bg, padding: 28 }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(232,80,26,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Check size={26} color={C.orange} />
                  </div>
                  <div style={{ fontFamily: dis, fontWeight: 700, fontSize: 20, color: C.text }}>Message sent</div>
                  <p style={{ fontFamily: bod, fontSize: 13, color: C.muted, marginTop: 10 }}>Thanks for reaching out. The AIPEA team will get back to you as soon as we can.</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily: dis, fontWeight: 800, fontSize: 20, color: C.text, letterSpacing: '-0.01em' }}>Send us a message</div>
                  <p style={{ fontFamily: bod, fontSize: 13, color: C.muted, marginBottom: 18, marginTop: 4 }}>We&apos;d love to hear from you.</p>
                  <div className="aipea-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div><label style={labelStyle}>Full name</label><input style={inputStyle} onFocus={onFocus} onBlur={onBlur} onMouseEnter={onHoverIn} onMouseLeave={onHoverOut} placeholder="Adwoa Mensah" /></div>
                    <div><label style={labelStyle}>Email address</label><input style={inputStyle} onFocus={onFocus} onBlur={onBlur} onMouseEnter={onHoverIn} onMouseLeave={onHoverOut} placeholder="you@email.com" /></div>
                  </div>
                  <div style={{ marginBottom: 12 }}><label style={labelStyle}>Subject</label>
                    <select style={inputStyle} onFocus={onFocus} onBlur={onBlur} onMouseEnter={onHoverIn} onMouseLeave={onHoverOut}><option>General enquiry</option><option>Membership</option><option>Certification</option><option>Events</option><option>Partnership</option><option>Press or media</option><option>Other</option></select>
                  </div>
                  <div style={{ marginBottom: 16 }}><label style={labelStyle}>Message</label>
                    <textarea rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }} onFocus={onFocus} onBlur={onBlur} onMouseEnter={onHoverIn} onMouseLeave={onHoverOut} placeholder="How can we help?" />
                  </div>
                  <button onClick={() => setSubmitted(true)}
                    style={{ width: '100%', background: C.orange, color: C.white, fontFamily: dis, fontWeight: 700, fontSize: 14, padding: 12, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.orangeDim)}
                    onMouseLeave={e => (e.currentTarget.style.background = C.orange)}>
                    Send message <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// --- CTA Banner ---------------------------------------------------------------

function CTABanner() {
  const chunk = (
    <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, fontFamily: dis, fontWeight: 700, fontSize: 14, color: C.white, padding: '0 28px' }}>
      Where <span style={{ color: C.navyDark, padding: '0 6px' }}>executive excellence</span> meets Africa.
      <span style={{ padding: '0 24px' }}>Join AIPEA and <span style={{ color: C.navyDark }}>elevate your career.</span></span>
    </span>
  )
  return (
    <div style={{ background: C.orange, padding: '20px 0', overflow: 'hidden' }}>
      <div className="aipea-marquee-fast" style={{ display: 'flex', width: 'max-content' }}>
        {chunk}{chunk}{chunk}{chunk}
      </div>
    </div>
  )
}

// --- Root ---------------------------------------------------------------------

export function AIPEA() {
  return (
    <div className="aipea" style={{ background: C.bg, color: C.text }}>
      <SiteNav overDark />
      <Hero />
      <PillarStrip />
      <About />
      <CoreValues />
      <EventHighlight />
      <Contact />
      <CTABanner />
      <SiteFooter />
    </div>
  )
}
