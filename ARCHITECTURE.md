# AIPEA Platform Frontend: Architecture

> Documents the codebase **as it exists today** (branch `develop`, 54 commits), based on reading the source. It is not a target design. Section 12 lists the unclear, duplicated and risky decisions found along the way.

---

## 1. What this project is

The public website and member portal for **AIPEA** (Africa Institute of Personal & Executive Assistants), a professional membership and certification body based in Accra, Ghana.

It has two halves:

| Half | Pages | Backend |
|---|---|---|
| **Marketing site** (static content) | `/`, `/about`, `/membership`, `/certification`, `/events`, `/resources` | None. All copy lives in the repo. |
| **Member portal** (dynamic) | `/sign-up`, `/sign-in`, `/dashboard`, `/certification/track-finder` (save step), `/checkout` (dormant) | Browser-local storage via `lib/localBackend.ts` (backend disconnected). |

This repo is **frontend only** and is currently **disconnected from any backend**. Accounts, the session, profiles and saved track audits live in the browser's `localStorage` through `lib/localBackend.ts` (demo only: nothing is shared between devices, no emails are sent, Google sign-in is unavailable). The public API of `lib/auth.ts` and `hooks/useAuth.ts` is unchanged, so a real backend can be reconnected by re-implementing those two files. The sections below that describe Firebase/Firestore document the previous, now-removed integration.

---

## 2. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.2.9**, App Router | Scripts use `--webpack` explicitly (`next dev --webpack`, `next build --webpack`), not Turbopack. `AGENTS.md` warns this version has breaking changes. |
| UI | React 19.2.4, TypeScript 5 (`strict`) | Path alias `@/*` maps to `src/*`. |
| Styling | **Inline `style={{}}` objects**, plus a global `globals.css` for media queries and keyframes, plus Tailwind 4 | Tailwind is installed, but the live pages barely use it (see 7). |
| Animation | `framer-motion` 12 | Global `MotionConfig reducedMotion="user"`. |
| Icons | `lucide-react` | |
| Auth and data | _(none)_ | Firebase SDK removed; local storage stand-in in `lib/localBackend.ts`. |
| Theming | `next-themes` | Wired up, but the site is light-only (see 12). |
| Fonts | `next/font/google`, DM Sans loaded twice | Exposed as CSS variables `--font-syne` and `--font-inter`. Both are DM Sans despite the names. |
| Validation | `zod` (devDependency) | **Not imported anywhere.** |
| Payments | Paystack inline script, loaded from `checkout/page.tsx` | Dormant (see 6.4). |
| Lint | ESLint 9 with `eslint-config-next` (core-web-vitals and typescript) | |
| Tests | **None** | No test runner, no test files. |
| CI/CD | GitHub Actions `deploy.yml` | On push to `main`, runs `npm ci` then `npx vercel --prod`. It does not run lint, typecheck or build first. |

`next.config.ts` is empty (`{}`). There is no `middleware`/`proxy`, no API routes, no server actions, no `robots`/`sitemap`, no `not-found`/`error`/`loading` files.

---

## 3. Directory map

```
.
├── .github/workflows/deploy.yml Vercel prod deploy on push to main
├── AGENTS.md / CLAUDE.md        Agent instructions (CLAUDE.md just includes AGENTS.md)
├── public/
│   ├── docs/aipea-2026-prospectus.pdf
│   ├── images/conference/optimized/   ~34 photos (.webp / .jpg)
│   ├── logo/                    icon.png (used), AIPEA6.png, aipea-mark.png, aipea-horizontal.png
│   └── *.svg, auth-side.jpg     create-next-app leftovers
└── src/
    ├── app/                     Routes (App Router)
    │   ├── layout.tsx           Root layout: fonts, metadata, extension-attr cleanup script, <Providers>
    │   ├── providers.tsx        ThemeProvider + MotionConfig
    │   ├── globals.css          Tailwind import, theme tokens, ALL responsive overrides
    │   ├── icon.png             Favicon
    │   ├── page.tsx             "/"  renders <AIPEA/>
    │   ├── about/ membership/ certification/ events/ resources/   content pages
    │   ├── certification/track-finder/   Professional Scope Audit
    │   ├── sign-in/ sign-up/    Auth forms
    │   ├── checkout/            Paystack flow (unreachable, see 6.4)
    │   └── dashboard/           Member dashboard (auth-gated client-side)
    ├── components/
    │   ├── AIPEA.tsx            1,261 lines: the entire homepage plus its own helpers
    │   ├── site/                Shared chrome and page kit (SiteNav, SiteFooter, PageKit, Reveal, Logo, tokens)
    │   ├── auth/                AuthKit (form primitives), BrandPanel, GoogleGlyph
    │   ├── layout/Navbar.tsx    UNUSED (see 12.1)
    │   ├── sections/Hero.tsx    UNUSED (see 12.1)
    │   └── ui/Starfield.tsx     Only used by the unused Hero
    ├── hooks/useAuth.ts         Local session and profile (useSyncExternalStore)
    └── lib/
        ├── localBackend.ts      Browser-local accounts, session, profiles, audits
        ├── auth.ts              Auth/profile operations (local), tiers, helpers
        ├── facts.ts             Single source of truth for site content
        └── trackFinder.ts       Track Finder logic and copy
```

Approximate size: about 6,000 lines of TypeScript. The largest files are `AIPEA.tsx` (1,261), `facts.ts` (384), `dashboard/page.tsx` (390), `checkout/page.tsx` (340), `PageKit.tsx` (357) and `AuthKit.tsx` (345).

---

## 4. Routing and page inventory

Everything is a **Client Component** (`'use client'`). There are no Server Components that render content, other than `layout.tsx`. Pages are statically prerendered shells that hydrate fully on the client.

| Route | File | Shell | Data | Purpose |
|---|---|---|---|---|
| `/` | `app/page.tsx` → `components/AIPEA.tsx` | `SiteNav overDark` + `SiteFooter` (inside AIPEA) | `facts.ts` | 15-section landing page (see 5.1) |
| `/about` | `app/about/page.tsx` | `PageShell` | `facts.ts` | Story, DNA values, leadership, governance, contact details |
| `/membership` | `app/membership/page.tsx` | `PageShell` | `facts.ts` | Why join, tiers, benefits, directory |
| `/certification` | `app/certification/page.tsx` | `PageShell` | `facts.ts` | Credential, 3 strands × 2 tracks, assessment stages, trimester artifacts |
| `/certification/track-finder` | `…/track-finder/page.tsx` | `PageShell` | `trackFinder.ts`, Firestore | 2-question quiz that recommends a track. Saving needs sign-in. |
| `/events` | `app/events/page.tsx` | `PageShell` | `facts.ts` (`CONFERENCE`) | PA Conference 2026, with regional meetups and webinars marked "to be confirmed" |
| `/resources` | `app/resources/page.tsx` | `PageShell` | `facts.ts` | Tracks, templates and tools (not yet available), trimester artifacts |
| `/sign-in` | `app/sign-in/page.tsx` | Own split layout (`BrandPanel` + `AuthCard`) | Firebase | Email/password and Google |
| `/sign-up` | `app/sign-up/page.tsx` | Same | Firebase | Free Associate signup, email/password and Google |
| `/dashboard` | `app/dashboard/page.tsx` | Own `DashNav` (not `SiteNav`) | Firebase | Member profile card, Track Finder status, roadmap cards |
| `/checkout` | `app/checkout/page.tsx` | None (own layout) | `localStorage`, Paystack | **Dormant**, nothing links to it |

Navigation structure is **defined in one place**: the `NAV` array at the top of `components/site/SiteNav.tsx` (a flat list of 5 links: Membership, Certification, Events, Resources, About, each going straight to its page, with no dropdowns). The same list feeds the desktop bar and the mobile drawer. Footer links are in `SiteFooter.tsx`.

`sign-in` and `sign-up` accept `?next=<path>`. `safeNextPath()` accepts only paths that start with `/` and not `//`, which blocks open redirects. The default is `/dashboard`.

---

## 5. Frontend composition

### 5.1 Homepage (`components/AIPEA.tsx`)

A single 1,261-line client file that **defines its own copies of the design tokens and helper components** instead of importing the shared ones. Section order as rendered:

`SiteNav` → `Hero` (auto-rotating image slides, 6.5 s) → `Marquee` → `EditorialMoment` → `PillarStrip` → `About` → `CoreValues` → `PricingSection` (`#membership`) → `EventHighlight` (`#events`, live countdown) → `Courses` (`#courses`) → `Process` (`#process`) → `LeadershipSection` → `PathwayStrip` → `Contact` (`#contact`) → `CTABanner` → `SiteFooter`.

Internal helpers defined in this file: `ScrollReveal`, `TiltCard`, `RotatingWord`, `Reveal`, `Magnetic`, `SectionHeader`, `useCountdown`, `MarqueeRow`, `ValueCard`.

It imports the shared `SiteNav`, `SiteFooter` and `PricingBreakdown`, so the homepage uses the same chrome as the other pages. Note that `AIPEA.tsx` also re-declares `C`, `EASE`, `dis`, `bod`, `SECTION` and `INNER`, and defines its own `Reveal`.

### 5.2 Shared page kit (`components/site/`)

| File | Exports | Used by |
|---|---|---|
| `tokens.ts` | `C` (palette), `EASE`, `dis`/`bod` (font stacks), `INNER`, `SECTION` | All pages except `checkout` and `AIPEA.tsx` (see 12.2) |
| `PageKit.tsx` | `PageShell`, `PageHero`, `SectionHeading`, `FeatureGrid`, `SplitFeature`, `StatBand`, `CTASection`, `PricingBreakdown` | The 5 content pages, the Track Finder, and `PricingBreakdown` also by the homepage |
| `SiteNav.tsx` | `SiteNav({overDark})`: fixed bar with flat links, mobile drawer, scroll-aware background | `PageShell`, `AIPEA` |
| `SiteFooter.tsx` | footer with contact details from `facts.ts` | `PageShell`, `AIPEA` |
| `Reveal.tsx` | scroll-in fade/slide | Content pages |
| `Logo.tsx` | `<Image src="/logo/icon.png">` | Nav, footer, dashboard, auth panel |

Content pages follow one pattern: `<PageShell>` → `<PageHero>` → a series of `<section style={{...SECTION}}><div style={INNER}>…` using `SectionHeading` / `SplitFeature` / `FeatureGrid` / `StatBand`, ending in `<CTASection>`.

### 5.3 Auth UI (`components/auth/`)

`AuthKit.tsx` is a set of form primitives: `AuthCard`, `AuthHeader`, `Field`, `PasswordField`, `ConsentCheckbox`, `FormError`, `PrimaryButton`, `GoogleButton`, `Divider`, `AuthFooterLink` and `AuthRedirectOverlay`. `BrandPanel` is the left-hand image panel, hidden under 860 px. Both auth pages wrap their form in `<Suspense>` because they call `useSearchParams()`.

### 5.4 Dashboard

`dashboard/page.tsx` is self-contained: its own `DashNav`, `LoadingScreen`, `CredentialCard` and feature cards. It aliases the shared tokens locally (`const ORANGE = C.orange`, and so on). Its feature roadmap (Member Directory, CPD Tracker, Course Library, Events) is a **hardcoded array** with `status: 'Building' | 'Planned'` tags. Nothing on it is interactive except the Track Finder link, the "Compare membership tiers" link and sign-out.

---

## 6. Data and state flows

### 6.1 Content: `lib/facts.ts`

Documented intent: *"single source of truth for every factual claim the site publishes"*. Every entry cites a client document (`[CI §n]`, `[ABT]`, `[DES]`, `[TF]`, `[DD]`, `[PRO]`).

Exports: `ORG`, `CONTACT`, `FIGURES`, `DNA`, `PURPOSE`, `WHY_WE_EXIST`, `STRANDS` (3 strands × 2 tracks), `TRIMESTER_DELIVERABLES`, `ASSESSMENT_STAGES`, `MEMBERSHIP`, `MEMBERSHIP_BENEFITS`, `CONFERENCE`, `LEADERSHIP`, `SECRETARIAT`, `PENDING`.

`PENDING` is a registry of facts the client has not confirmed (phone number, CPD framework, ticket prices, bios, legal policies, testimonials, and so on). The UI is meant to say such things are "coming" rather than invent values. Several comments record where source documents disagreed and which version was chosen. Examples: acronyms CEA/SCEA over CEP/SCEP, and DNA values Growth/Value/Impact over the five-value set.

### 6.2 Firebase

`lib/firebase.ts` initializes lazily through `getFirebaseApp()` / `getFirebaseAuth()` / `getFirebaseDb()`, using `NEXT_PUBLIC_FIREBASE_*` env vars. Lazy init is deliberate so prerendering doesn't fail when env vars are absent.

**Firestore data model (as written by the client):**

```
users/{uid}
  uid, name, email, country, tier ('Associate'), status ('active'),
  newsletterConsent, memberId ('AIPEA-<year>-<5 digits>'), createdAt (serverTimestamp)
  recommendedTrack?: { acronym, name, strandId, strandName, scope, horizon,
                       auditedAt, latestAuditId }
users/{uid}/scopeAudits/{auditId}
  horizon, scope, trackAcronym, trackName, strandId, strandName, coreFocus,
  operationalHorizon, targetAccountability, coreValueDriver, bullets[3], createdAt
```

The type `MemberProfile.status` also allows `'pending_payment'`, but no code path writes it.

### 6.3 Auth and profile (`lib/auth.ts`, `hooks/useAuth.ts`)

- **`signUpAssociate`** calls `createUserWithEmailAndPassword`, then `updateProfile`, then writes `users/{uid}`. The tier is hardcoded to `Associate`, and a comment says Firestore rules only allow that.
- **`continueWithGoogle`** tries `signInWithPopup`. On `popup-blocked` or `operation-not-supported-in-environment`, it saves the newsletter-consent choice to `localStorage` and falls back to `signInWithRedirect`. Either way `ensureGoogleProfile` creates the Associate profile if none exists.
- **`completeGoogleRedirect`** is called in a `useEffect` on every mount of `/sign-in` and `/sign-up`. It finishes a redirect sign-in and applies the stored consent.
- **`useAuth()`** subscribes to `onAuthStateChanged`, then to a live `onSnapshot` of `users/{uid}`, and returns `{ user, profile, loading }`. `loading` stays true until the profile for the *current* uid has arrived.
- **`memberId`** is generated **client-side** with `Math.random()` (`generateMemberId`). There is no uniqueness check.
- Error codes are mapped to user-facing strings by `getAuthErrorMessage`.

**Route protection:** only `/dashboard`, and only on the client. After `useAuth` finishes loading with no user, it runs `router.push('/sign-in')`. There is no middleware, so protected content is simply never rendered without a profile. The Track Finder is public until the user chooses to save.

### 6.4 Paid membership and checkout (dormant)

`/checkout` exists and is fully built (Paystack inline script, tier perks, order summary). But:

- **Nothing links to it.** `sign-up` says "Every signup is a free Associate membership for now… parked until paid tiers are confirmed."
- It reads a `PendingSignup` from `localStorage`. `savePendingSignup` is only defined in `auth.ts`, and nothing calls it, so the page redirects to `/sign-up` immediately.
- If reached with a paid tier, the Paystack `callback` calls `saveFakePaidUser`, which writes a fake user to `localStorage` and then redirects to `/dashboard`. The dashboard doesn't read it. **No payment is verified and no account is created.**
- A Paystack **test public key is hardcoded** (`pk_test_…`) in the file.
- On the live site, paid tiers show "Contact us" (`href: '#contact'`) and are handled by the Secretariat offline.

### 6.5 Track Finder (`lib/trackFinder.ts` + page)

```
Step 1: horizon (1|2|3)  ─┐
Step 2: scope   (A|B)    ─┴─► resolveTrack(h, s) = STRANDS[h-1].tracks[s==='A'?0:1] + RESULT_COPY[h]
                                   │
                         "Save" ───┤ signed in?  yes → saveScopeAudit()  → writes scopeAudits doc + updates users/{uid}.recommendedTrack
                                   │             no  → sessionStorage.aipea_pending_scope_audit
                                   │                   → /sign-in?next=/certification/track-finder
                                   └─ on return, an effect (guarded by a ref) reads the pending audit, shows the result and saves it
```

The 3×2 matrix maps directly onto the 3 strands × 2 tracks in `facts.ts`, so **strand order in `STRANDS` is load-bearing** (`STRANDS[horizon - 1]`). The audit record is shaped to match the placeholders in an email template ("Email: DYNAMIC_BULLET_1..3"). The `scopeAudits` write is meant to trigger a Cloud Function that sends a post-audit email.

### 6.6 Contact form (homepage)

The `Contact` section in `AIPEA.tsx` has inputs and a button whose `onClick` just calls `setSubmitted(true)`. **No request is made and nothing is stored or sent.** The user sees a success state, but no message goes anywhere (see 12.3).

---

## 7. Styling system

Three layers exist at once:

1. **Inline style objects** (the dominant approach). `AIPEA.tsx` has about 217 `style={{` occurrences, the dashboard about 90, and `PageKit.tsx` about 89. Palette and fonts come from `tokens.ts`, or from local re-declarations.
2. **`globals.css` class-based overrides.** Because inline styles can't hold media queries, each responsive layout is a hook class on the element, for example `className="aipea-dash-hero"`. The CSS then uses `!important` to override the inline `gridTemplateColumns` at breakpoints (860 / 1024 / 768 / 640 / 560 / 480 px, and others). Roughly 90 `aipea-*` classes live in that one file, grouped by page area (auth, dashboard, homepage grids, nav, page kit, certification, hero, about card).
3. **Tailwind 4** (`@import "tailwindcss"`, `@theme` tokens). It is effectively used only by the unused `Navbar.tsx` and `Hero.tsx` (classes such as `text-orange`, `font-display` and the `void` colour). Live pages don't depend on it.

Other styling points:

- A `.aipea` wrapper class scopes a CSS reset, link reset and `::selection`. `PageShell` and `AIPEA` both apply it. `/dashboard`, `/sign-in`, `/sign-up` and `/checkout` do not, and instead rely on the global `*` reset in `globals.css`.
- `.aipea section { padding: … !important }` at ≤1024 / ≤768 px is a blanket override that forced later patches (`.aipea section.aipea-hero-section { padding: 0 !important }`).
- Brand colours: orange `#E8501A`, navy `#1B2A5E`, navy-dark `#111c42`. `orangeOnDark #FF8A5B` exists for WCAG contrast on navy.
- Accessibility work is visible: reduced-motion handling, contrast-aware tokens, `svh` for the hero.

---

## 8. Cross-cutting concerns

- **Root layout:** sets metadata (`metadataBase` `https://www.aipea.co`, title, description, OpenGraph), loads fonts, and injects a `beforeInteractive` script plus `MutationObserver` that strips Grammarly-style attributes from `<html>`/`<body>` for 3 seconds. This works around extension-caused hydration warnings. `suppressHydrationWarning` is also set.
- **Smooth scroll:** `data-scroll-behavior="smooth"` on `<html>` plus `scroll-padding-top: 76px` for the fixed nav.
- **Hydration safety:** `Reveal` and other animated components use deterministic `initial` state, with reduced motion handled globally in `Providers` (documented in comments after a past hydration bug).
- **SEO:** only root-level metadata. No per-page titles, no `robots`/`sitemap`, no structured data. Because every page is a client component, per-page `metadata` exports are not possible without restructuring (see 12.7).
- **Images:** `next/image` for photos in `/public/images/conference/optimized/`. Static `public/` assets are referenced by hardcoded string paths.
- **Environment:** only the six `NEXT_PUBLIC_FIREBASE_*` variables. `.env*` is gitignored except `.env.example`.

---

## 9. Dependency graph (condensed)

```
app/layout ──► app/providers ──► next-themes, framer-motion MotionConfig
app/page ───► components/AIPEA ──► site/{SiteNav, SiteFooter, PageKit(PricingBreakdown)}, lib/facts
app/{about,membership,certification,events,resources}/page
        ──► site/{PageKit, tokens, Reveal}, lib/facts
app/certification/track-finder/page
        ──► site/{PageKit, tokens, Reveal}, hooks/useAuth, lib/{auth, trackFinder, facts}
app/sign-in|sign-up/page ──► auth/{AuthKit, BrandPanel}, site/tokens, lib/auth
app/dashboard/page ──► site/{tokens, Logo}, hooks/useAuth, lib/auth
app/checkout/page ──► lib/auth  (no shared tokens or components)

lib/auth ──► lib/firebase, lib/trackFinder ──► lib/facts
hooks/useAuth ──► lib/firebase, (type) lib/auth
```

There are no circular imports.

---

## 10. Build, run, deploy

```powershell
npm install           # node_modules was absent at time of writing
# no environment variables are required
npm run dev           # next dev --webpack
npm run build         # next build --webpack
npm run lint          # eslint
```

Deployment: pushing to `main` triggers `.github/workflows/deploy.yml` (Node 20, `npm ci`, `npx vercel --prod --yes`), using `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` secrets. The Firebase env vars must be configured in Vercel.

---

## 11. External dependencies not in this repo

Referenced in code comments, not verifiable here:

- **Firestore security rules.** The code relies on rules that only permit a client to self-create `users/{uid}` with `tier: 'Associate'` and `status: 'active'`.
- **Cloud Function `onUserProfileCreated`.** Sends the welcome email (Resend templates are mentioned).
- **A Cloud Function triggered by `scopeAudits` documents.** Sends the post-audit email.
- **Firebase Console config.** Google provider enabled and authorised domains set (the error text for `auth/unauthorized-domain` points at this).

---

## 12. Unclear, duplicated or problematic decisions

Ordered roughly by impact. These are observations about the existing code, not changes made.

### 12.1 Dead and unused code
- `components/layout/Navbar.tsx`, `components/sections/Hero.tsx` and `components/ui/Starfield.tsx` are imported by nothing. They use the old dark theme (`bg void`, Tailwind classes) and appear to be remnants of an earlier design. They are the only users of Tailwind utility classes.
- `zod` is a dependency, but there are no imports of it. Form validation is hand-rolled `if` checks.
- `checkout/page.tsx`, `savePendingSignup`/`getPendingSignup`/`clearPendingSignup`, `saveFakePaidUser`, `FakePaidUser`, `TIER_PRICING`, `formatCedis`, `PendingSignup` and the `'pending_payment'` status make up a dormant paid-signup path (6.4). Parts are exported but never reached.
- Unused assets: `public/{file,globe,next,vercel,window}.svg`, `public/auth-side.jpg`, and logo variants `AIPEA6.png`, `aipea-mark.png` and `aipea-horizontal.png` (only `icon.png` is referenced). `leader-noreen.jpg` is also not referenced. Her entry was removed from `LEADERSHIP` at the client's request, so the photo should arguably be removed too.
- The `README.md` is still the default `create-next-app` text.

### 12.2 Duplicated design tokens and components
- `AIPEA.tsx` re-declares the palette (`C`), `EASE`, `dis`, `bod`, `SECTION` and `INNER`, **and** defines its own `Reveal`. `site/tokens.ts` and `site/Reveal.tsx` already provide these, and the `tokens.ts` header comment says it "mirrors" the homepage palette. The two copies can drift.
- `checkout/page.tsx` re-declares its colours as literals (`'#E8501A'`, and so on) and does not import tokens.
- `dashboard/page.tsx` creates local aliases (`const ORANGE = C.orange`, …) for each token.
- Membership tier data appears **three times**: `MEMBERSHIP.tiers` in `facts.ts`, `priceTiers` in `AIPEA.tsx`, and an equivalent array in `membership/page.tsx` (line 65). Prices are also in `TIER_PRICING` in `auth.ts` (numeric, ₵) and as strings ("Ghc 1,200"). The currency notation differs (`₵` in code vs `Ghc` in content). This breaks the "single source of truth" rule `facts.ts` states for itself.
- The "Join AIPEA" CTA and footer, plus the sign-in and sign-up links, are hardcoded in several places rather than from one definition.

### 12.3 Misleading or non-functional UI
- **Homepage contact form does nothing.** Submitting only toggles a local "submitted" state (6.6). A visitor believes their message was sent. This is the most serious functional gap.
- **"Forgot password?"** on `/sign-in` is a plain `<span>`, with no handler and no `sendPasswordResetEmail`. Users who forget their password have no recovery path.
- Paid-tier cards (Professional, Fellow) link to `#contact`, which lands on the non-functional form above.
- The membership page and homepage both say paid applications are "completed through the Secretariat", but only a `mailto:` email address and the dead form exist.
- Dashboard shows an "Active Member" badge for every profile, including Google signups with an empty country.

### 12.4 Security and correctness
- **Paystack test key hardcoded** in `checkout/page.tsx` (public keys aren't secret, but it should be config, and the live key swap is untracked).
- **`memberId` generated client-side** with `Math.random()`, no uniqueness guarantee, and set by the client. That makes it spoofable under permissive rules, and collisions are possible (about 90,000 values per year).
- **Security depends entirely on Firestore rules that aren't in this repo**, so they can't be reviewed or version-controlled alongside the code that depends on them. The same applies to the Cloud Functions.
- Password policy is 6 characters (Firebase default). The sign-up helper text and the client check agree with each other.
- Dashboard protection is client-side only (acceptable for display-only data under Firestore rules, but there is no server-side gate or middleware).
- `signInWithPopup` + `ensureGoogleProfile` create the profile after sign-in. If that second step fails, the user exists in Auth with no Firestore doc, and `useAuth` would show a perpetual loading state (`loading` stays true while `profile?.uid !== user.uid`).
- `useAuth` uses `new Date().toISOString()` as the join date when `createdAt` is still a pending server timestamp, so the date can briefly be wrong.
- The Track Finder pending-audit resume effect swallows `loading` edge cases only via a ref flag. If saving fails, the pending audit remains in `sessionStorage` but the ref blocks a retry until reload.

### 12.5 Architecture and maintainability
- **Everything is a Client Component.** Static marketing pages (`/about`, `/membership`, and so on) ship the whole React/framer-motion tree to the client and hydrate it, even though they have no interactivity beyond animation. Server Components would cut JS and allow per-page `metadata`.
- **Inline styles plus `!important` media-query overrides in a global CSS file** is a fragile pairing. Responsive behaviour is split between the TSX (base layout) and `globals.css` (overrides), joined only by string class names. `.aipea section` blanket rules have already needed counter-overrides. Adding a layout requires editing two files and remembering `!important`.
- Tailwind 4 is installed and configured but effectively unused, so the project carries a styling system it doesn't use.
- **`AIPEA.tsx` is a 1,261-line monolith** that holds 15 sections, helpers, section copy and layout. It is hard to navigate and test, and its helpers aren't reusable.
- **Inconsistent page shells.** Content pages use `PageShell` (`SiteNav` + `SiteFooter`). Auth pages use a custom split layout. The dashboard uses its own `DashNav` with no footer and no link back to the main site navigation. Checkout has no chrome.
- Naming and comments are out of sync with reality: font variables `--font-syne`/`--font-inter` (both are DM Sans), the `.aipea` class name, and comments referencing "Syne".
- `facts.ts` mixes Date objects (`CONFERENCE.startDate`), long copy and structural data. `PENDING` is documentation only and nothing reads it at runtime, so unresolved items are not enforced by code.
- `STRANDS[horizon - 1]` indexing couples Track Finder to array order in `facts.ts`.
- The Track Finder is linked only from the Certification page and the dashboard, not from the navbar.

### 12.6 Process and tooling
- No tests of any kind, including for `resolveTrack`, `safeNextPath` and the auth error mapping, which are pure and easy to test.
- CI deploys to production on every push to `main` **without** lint, typecheck or build steps.
- `eslint` and `next build` have not been run as part of this documentation, so the current lint and type status is unknown.
- The `--webpack` flag is pinned in scripts with no comment explaining why. The reason (a Turbopack issue or a plugin) is not recorded.

### 12.7 SEO and platform gaps
- A single global title and description for every page, with no per-page metadata, canonical URLs, `robots.txt` or `sitemap`. The legal pages (privacy, terms, cookies) are listed in `PENDING` as outstanding. A site with sign-up and newsletter consent has no privacy policy.
- No custom `not-found`, `error` or `loading` UI.
- The prospectus PDF in `public/docs/` is not linked from anywhere found in `src`.

---

## 13. Quick orientation for a new developer

1. **Change copy, prices, dates, names:** edit `src/lib/facts.ts` first, but also check the duplicates in 12.2 (`AIPEA.tsx`, `membership/page.tsx`, `SiteNav.tsx`).
2. **Change the nav or footer:** `src/components/site/SiteNav.tsx` (`NAV` array) and `SiteFooter.tsx`.
3. **Add a content page:** copy the structure of `app/about/page.tsx` (use `PageShell`, `PageHero`, `SectionHeading`, and so on), then add a link in `NAV`.
4. **Adjust responsive behaviour:** the base layout is inline in the TSX, but the breakpoints are in `globals.css`. Find the `aipea-*` className on the element.
5. **Touch auth or member data:** `lib/auth.ts` and `hooks/useAuth.ts`. Remember the Firestore rules and Cloud Functions live outside this repo.
6. **Track Finder logic or copy:** `lib/trackFinder.ts` (the matrix and email copy) and `facts.ts` (`STRANDS`).
7. **Don't assume** `Navbar.tsx`, `Hero.tsx`, `Starfield.tsx`, `/checkout` or `zod` are in use. They aren't.
8. Read `AGENTS.md` before writing code: this Next.js version differs from older conventions, and docs are in `node_modules/next/dist/docs/` once dependencies are installed.
