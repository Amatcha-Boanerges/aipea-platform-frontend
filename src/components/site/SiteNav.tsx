'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'
import { C, dis, bod, INNER } from './tokens'
import { Logo } from './Logo'

// One flat list drives both the desktop bar and the mobile drawer. Every item
// goes straight to its own page.
const NAV = [
  { label: 'About',         href: '/about' },
  { label: 'Membership',    href: '/membership' },
  { label: 'Certification', href: '/certification' },
  { label: 'Events',        href: '/events' },
  { label: 'Resources',     href: '/resources' },
] as const

// --- Mobile drawer --------------------------------------------------------------

function MobileDrawer({ onClose }: { onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      style={{ position: 'fixed', inset: 0, top: 60, zIndex: 45, background: C.white, overflowY: 'auto', padding: '16px 20px 40px' }}>
      {NAV.map(item => (
        <Link key={item.label} href={item.href} onClick={onClose}
          style={{ display: 'block', padding: '18px 4px', borderBottom: `1px solid ${C.border}`, fontFamily: dis, fontWeight: 800, fontSize: 18, color: C.text }}>
          {item.label}
        </Link>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
        <Link href="/sign-in" onClick={onClose} style={{ fontFamily: dis, fontWeight: 700, fontSize: 15, color: C.text, textAlign: 'center', padding: '13px', border: `1px solid ${C.border}`, borderRadius: 999 }}>Sign in</Link>
        <Link href="/sign-up" onClick={onClose} style={{ fontFamily: dis, fontWeight: 700, fontSize: 15, color: C.white, background: C.orange, textAlign: 'center', padding: '13px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>Join AIPEA <ArrowRight size={15} /></Link>
      </div>
    </motion.div>
  )
}

// --- Nav ------------------------------------------------------------------------

// `overDark`: the page opens with a dark full-bleed image behind the bar, so the
// default navy-on-transparent chrome would be invisible against it. Only applies
// while the bar itself is still transparent; once it goes solid white the normal
// navy treatment takes over, which happens at 12px of scroll.
export function SiteNav({ overDark = false }: { overDark?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Keep the bar solid while the drawer is open so the burger stays readable.
  const solid = scrolled || mobileOpen
  // Light chrome only while sitting on the image, never once the bar is solid.
  const onDark = overDark && !solid
  const inkStrong = onDark ? C.white : C.text
  const inkSoft = onDark ? 'rgba(255,255,255,0.72)' : C.muted
  const rule = onDark ? 'rgba(255,255,255,0.28)' : C.border

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
      <nav className="aipea-nav" style={{
        height: 60, padding: '0 40px',
        background: solid ? 'rgba(255,255,255,0.94)' : 'transparent',
        backdropFilter: solid ? 'blur(20px)' : 'none',
        borderBottom: `1px solid ${solid ? C.border : 'transparent'}`,
        transition: 'background 0.35s, border-color 0.35s',
      }}>
        {/* INNER wrapper so the brand lands on the same gutter as page content. The
            bar's background still spans the full viewport; only its contents are capped. */}
        <div style={{ ...INNER, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <Link href="/" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo height={54} priority />
            <span className="aipea-nav-tag" style={{ fontFamily: bod, fontSize: 11, color: inkSoft, lineHeight: 1.15, borderLeft: `1px solid ${rule}`, paddingLeft: 12, maxWidth: 150, transition: 'color 0.35s, border-color 0.35s' }}>
              Africa Institute of Personal &amp; Executive Assistants
            </span>
          </Link>

          {/* Desktop links */}
          <div className="aipea-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV.map(item => (
              <Link key={item.label} href={item.href}
                style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 16px', borderRadius: 999, fontFamily: dis, fontWeight: 700, fontSize: 15.5, whiteSpace: 'nowrap', color: inkStrong, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.orange)}
                onMouseLeave={e => (e.currentTarget.style.color = inkStrong)}>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="aipea-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Link href="/sign-in" style={{ fontFamily: bod, fontSize: 13, whiteSpace: 'nowrap', color: inkStrong, opacity: onDark ? 0.9 : 0.72, transition: 'color 0.35s' }}>Sign in</Link>
            <Link href="/sign-up"
              style={{ fontFamily: dis, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', color: C.white, background: C.orange, padding: '9px 20px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = C.orangeDim)}
              onMouseLeave={e => (e.currentTarget.style.background = C.orange)}>
              Join AIPEA <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile burger */}
          <button className="aipea-nav-burger" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(v => !v)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: inkStrong, padding: 6, transition: 'color 0.35s' }}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && <MobileDrawer onClose={() => setMobileOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
