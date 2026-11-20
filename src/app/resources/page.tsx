'use client'

import { FileText } from 'lucide-react'
import { C, dis, bod, INNER, SECTION } from '@/components/site/tokens'
import {
  PageShell, PageHero, SectionHeading, CTASection,
} from '@/components/site/PageKit'
import { Reveal } from '@/components/site/Reveal'
import { CONTACT } from '@/lib/facts'

// The courses this page used to advertise were invented, as were four templates
// and three insight articles. The learning offer itself lives on the
// Certification page. Articles, work forms and templates are stated as forthcoming:
// the client's answers were "tools to be loaded" and, on career guides, "not sure
// I get this". Replace the ComingSoon block with real content once it is supplied.

function ComingSoon({ icon: Icon, title, body }: { icon: typeof FileText; title: string; body: string }) {
  return (
    <Reveal>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: 'clamp(36px,5vw,56px) clamp(24px,4vw,44px)', borderRadius: 22, border: `1px dashed ${C.borderHover}`, background: C.bg }}>
        <span style={{ width: 52, height: 52, borderRadius: 15, background: 'rgba(232,80,26,0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 22px' }}>
          <Icon size={23} color={C.orange} />
        </span>
        <h3 style={{ fontFamily: dis, fontWeight: 800, fontSize: 'clamp(20px,2.2vw,26px)', letterSpacing: '-0.02em', color: C.text, lineHeight: 1.2 }}>{title}</h3>
        <p style={{ fontFamily: bod, fontSize: 14.5, lineHeight: 1.75, color: C.muted, marginTop: 14 }}>{body}</p>
        <a href={`mailto:${CONTACT.email}`} style={{ display: 'inline-block', marginTop: 22, fontFamily: dis, fontWeight: 700, fontSize: 13, color: C.orange }}>
          Ask the Secretariat →
        </a>
      </div>
    </Reveal>
  )
}

export default function ResourcesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Resources"
        title="Built for the workplace,"
        highlight="not just studied."
        subtitle="AIPEA's learning model is not built on passive listening. Every module ends in a concrete deliverable that adds value to your current employer."
        image="/images/conference/optimized/resources-hero.webp"
        primary={{ label: 'See the tracks', href: '/certification#strands' }}
        secondary={{ label: 'What is coming', href: '#library' }}
      />

      <section id="library" style={{ ...SECTION, background: C.bg }}>
        <div style={INNER}>
          <SectionHeading
            eyebrow="Articles, forms and templates"
            title="A practical library for members."
            aside="Reusable resources for the everyday work of executive support, plus news and perspectives from across the AIPEA network."
          />
          <ComingSoon
            icon={FileText}
            title="The library is being built."
            body="Articles, work forms and templates are being prepared. Members are notified as each one is published."
          />
        </div>
      </section>

      <CTASection
        title="Turn your experience into a designation."
        body="Associate membership is free. Certification tracks open from there."
        primary={{ label: 'Join AIPEA', href: '/sign-up' }}
        secondary={{ label: 'See membership tiers', href: '/membership#tiers' }}
      />
    </PageShell>
  )
}
