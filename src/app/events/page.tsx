'use client'

import { useState } from 'react'
import { Video, CalendarClock, ChevronDown, ExternalLink } from 'lucide-react'
import { C, dis, bod, INNER, SECTION } from '@/components/site/tokens'
import {
  PageShell, PageHero, SectionHeading, SplitFeature, CTASection,
} from '@/components/site/PageKit'
import { Reveal } from '@/components/site/Reveal'
import { CONFERENCE, CONTACT, PAST_CONFERENCES } from '@/lib/facts'

// This page used to list six regional hubs (Accra, Lagos, Nairobi, Johannesburg,
// Cairo, Kigali), three named webinars and a five-row 2026 calendar. None of it
// was confirmed: the client's answer on meetups was "annual calendar will be
// shared", on webinars "to be confirmed", and the only country AIPEA currently
// operates in is Ghana. All of it is now stated as forthcoming instead.

/** A section that says something is coming without inventing what it will contain. */
function ComingSoon({ icon: Icon, title, body }: {
  icon: typeof Video; title: string; body: string
}) {
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

/** Year picker for earlier PA Conferences. Each year shows a link to its media once one is supplied. */
function PastConferences() {
  const [year, setYear] = useState<number>(PAST_CONFERENCES[PAST_CONFERENCES.length - 1].year)
  const selected = PAST_CONFERENCES.find(c => c.year === year) ?? PAST_CONFERENCES[0]

  return (
    <Reveal>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <label htmlFor="pa-year" style={{ display: 'block', fontFamily: dis, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>Choose a year</label>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <select
            id="pa-year"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{ appearance: 'none', fontFamily: dis, fontWeight: 700, fontSize: 16, color: C.text, background: C.bg, border: `1.5px solid ${C.borderHover}`, borderRadius: 12, padding: '12px 44px 12px 18px', cursor: 'pointer', minWidth: 220 }}
          >
            {PAST_CONFERENCES.map(c => (
              <option key={c.year} value={c.year}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={16} color={C.muted} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>

        <div style={{ marginTop: 28, padding: 'clamp(28px,4vw,44px)', borderRadius: 22, background: C.bg, border: `1px solid ${C.border}` }}>
          <h3 style={{ fontFamily: dis, fontWeight: 800, fontSize: 'clamp(20px,2.2vw,26px)', letterSpacing: '-0.02em', color: C.text }}>{selected.name}</h3>
          {selected.videoUrl ? (
            <a href={selected.videoUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 18, fontFamily: dis, fontWeight: 700, fontSize: 14, color: C.white, background: C.orange, padding: '12px 24px', borderRadius: 999 }}>
              Watch the highlights <ExternalLink size={15} />
            </a>
          ) : (
            <p style={{ fontFamily: bod, fontSize: 14.5, lineHeight: 1.75, color: C.muted, marginTop: 12 }}>
              Photos and recordings from this conference are being added soon.
            </p>
          )}
        </div>
      </div>
    </Reveal>
  )
}

export default function EventsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Events"
        title="Where the profession"
        highlight="comes together."
        subtitle={`${CONFERENCE.name} is AIPEA's flagship gathering: two days at the ${CONFERENCE.venue} in Accra on ${CONFERENCE.dateLabel}.`}
        image="/images/conference/optimized/events-stage.webp"
        primary={{ label: 'Register interest', href: '#conference' }}
        secondary={{ label: 'See the calendar', href: '#calendar' }}
      />

      <section id="conference" style={{ ...SECTION, background: C.bg }}>
        <div style={INNER}>
          <SplitFeature
            image="/images/conference/optimized/gallery-02.webp"
            eyebrow="Flagship event"
            title={`${CONFERENCE.name}.`}
            body={CONFERENCE.description}
            points={[
              `${CONFERENCE.dateLabel} · ${CONFERENCE.days} days`,
              `${CONFERENCE.venue}, ${CONFERENCE.city}`,
              'Speaker line-up and agenda to be announced',
              'Registration details to follow',
            ]}
            cta={{ label: 'Register interest', href: '/sign-up' }}
          />
        </div>
      </section>

      <section id="pa-conferences" style={{ ...SECTION, background: C.surface }}>
        <div style={INNER}>
          <SectionHeading
            eyebrow="PA Conferences"
            title="Where we have gathered before."
            aside="Pick a year to revisit it."
          />
          <PastConferences />
        </div>
      </section>

      <section id="webinars" style={{ ...SECTION, background: C.bg }}>
        <div style={INNER}>
          <SectionHeading
            eyebrow="Webinars & masterclasses"
            title="Learn live, from anywhere."
            aside="Short, practical sessions led by senior practitioners, delivered online for members across time zones."
          />
          <ComingSoon
            icon={Video}
            title="The webinar programme is being confirmed."
            body="Session topics, speakers and dates are in preparation. Members are notified first when the schedule opens."
          />
        </div>
      </section>

      <section id="calendar" style={{ ...SECTION, background: C.surface }}>
        <div style={INNER}>
          <SectionHeading
            eyebrow="Events calendar"
            title="Everything on one timeline."
            aside="Two confirmed dates so far. The rest of the year fills in as the calendar is signed off."
          />
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Reveal>
              <div className="aipea-cal-row" style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 20, alignItems: 'center', padding: '22px 26px', background: C.bg, border: '1px solid rgba(232,80,26,0.28)', borderRadius: 16 }}>
                <span style={{ fontFamily: dis, fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', color: C.orange }}>{CONFERENCE.dateShort}</span>
                <span>
                  <span style={{ display: 'block', fontFamily: dis, fontWeight: 800, fontSize: 17, color: C.text, letterSpacing: '-0.01em' }}>{CONFERENCE.name}</span>
                  <span style={{ display: 'block', fontFamily: bod, fontSize: 13, color: C.muted, marginTop: 3 }}>{CONFERENCE.venue}, {CONFERENCE.city}</span>
                </span>
                <span className="aipea-cal-type" style={{ fontFamily: dis, fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.orange, background: 'rgba(232,80,26,0.08)', padding: '6px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>Conference</span>
              </div>
            </Reveal>
            <Reveal delay={0.04}>
              <div className="aipea-cal-row" style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 20, alignItems: 'center', padding: '22px 26px', background: C.bg, border: '1px solid rgba(232,80,26,0.28)', borderRadius: 16 }}>
                <span style={{ fontFamily: dis, fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', color: C.orange }}>OCT</span>
                <span>
                  <span style={{ display: 'block', fontFamily: dis, fontWeight: 800, fontSize: 17, color: C.text, letterSpacing: '-0.01em' }}>AI Workshop</span>
                  <span style={{ display: 'block', fontFamily: bod, fontSize: 13, color: C.muted, marginTop: 3 }}>Exact date and venue to be confirmed</span>
                </span>
                <span className="aipea-cal-type" style={{ fontFamily: dis, fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.orange, background: 'rgba(232,80,26,0.08)', padding: '6px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>Workshop</span>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '22px 26px', borderRadius: 16, border: `1px dashed ${C.border}` }}>
                <CalendarClock size={18} color={C.faint} style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: bod, fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
                  Meetups, webinars and masterclasses appear here as they are confirmed.
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <CTASection
        title="Save your seat at the table."
        body="Members hear about every AIPEA event first. Associate membership is free to join."
        primary={{ label: 'Join AIPEA', href: '/sign-up' }}
        secondary={{ label: 'Explore membership', href: '/membership' }}
      />
    </PageShell>
  )
}
