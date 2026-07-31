# ShadowGrid design-reference analysis

Status: implementation brief, inspected 2026-07-31

This document records which reference patterns ShadowGrid adopts, rejects, and transforms. It is intentionally evidence-bounded: the public pages were inspected through text extraction, but the in-app browser runtime exposed no browser session. The currently available **Vibe4 group could not be opened**, and neither desktop screenshots nor narrow-window screenshots could be captured. Accordingly, this document does not claim visual or responsive observations that were not made.

The responsive rules in the project specification remain implementation requirements. They are not presented here as findings about the reference sites. A later visual QA pass should revisit every public source at desktop, tablet, and mobile widths and add screenshot-backed notes without changing the originality boundaries below.

## Reference priority

ShadowGrid applies the references in this order:

1. Vibe4 for application structure and administrative workflow, pending direct inspection.
2. Cyberspace for text-first forum and feed interaction.
3. Elm-chan for compact, authored, old-web information architecture.
4. Rekt Network for persistent controls and optional display effects.
5. nowhere.moe for explicit transitions across a fictional network boundary.
6. The Shadowrun campaign context for terminology only; all presentation, factions, identities, artwork, and copy remain original.

This ordering prevents a visual effect or old-web flourish from weakening access control, form clarity, or the core campaign workflow.

## Vibe4

Reference: the Vibe4 browser group named in the project specification.

### Observed patterns

No Vibe4 page was observable in this run. The browser connection reported no available browser backend or tabs, so there is no verified evidence about Vibe4 navigation, cards, tables, spacing, forms, dashboards, administration, or responsive behavior.

The application's specification describes Vibe4 as the structural reference for page hierarchy, content grouping, navigation, sidebars, tables, cards, forms, dashboard composition, information density, responsive behavior, and administrative workflows. Those are requirements supplied by the project brief, not observations from Vibe4.

### Selected patterns

Provisionally select only the brief-defined structural categories:

- persistent application navigation with a clear current section;
- dense list and detail workflows for runners, products, orders, hosts, and audit events;
- searchable and filterable administrative tables;
- detail pages organized into task-focused tabs or sections;
- visible primary and secondary actions on forms;
- dashboard summaries that link directly to actionable queues;
- responsive transformation from persistent columns to drawers and stacked context.

These selections must be checked against the actual Vibe4 group when a browser session is available.

### Rejected patterns

No Vibe4-specific visual pattern is rejected on observational grounds because the reference was unavailable. The following project boundaries still apply:

- no Vibe4 branding, logo, copy, proprietary content, exact colors, or exact page composition;
- no generic polished-SaaS treatment that erases the old-host, street, magical, and corporate layers;
- no card-only information architecture where a compact table or directory communicates state better;
- no client-only permission affordances masquerading as access control.

### Transformation for ShadowGrid

Use conventional administration structure as a quiet foundation, then express it through original in-world surfaces: a GM control host, runner records, clearance labels, ledger rows, host access matrices, and audit trails. Familiar workflows should stay legible even when headings and status labels use campaign language. Styling never changes the semantic order of controls or the server-authoritative behavior.

### ShadowGrid pages using the patterns

- `/gm`, `/gm/players`, `/gm/players/[playerId]`
- `/gm/products`, `/gm/products/[productId]`, `/gm/vendors`
- `/gm/orders`, `/gm/economy`, `/gm/audit`
- `/gm/board`, `/gm/hosts`, `/gm/jobs`, `/gm/settings`
- shared list/detail/form patterns across `/orders`, `/inventory`, and `/contacts`

### Verification still required

When Vibe4 is available, inspect at least its main dashboard, one dense index, one record detail page, one create/edit form, one settings page, and the narrow-window state of each. Record only structural ideas; capture no branding or proprietary copy.

## Elm-chan

References inspected:

- [Elm-chan home](https://elm-chan.org/)
- [Technical Notes index](https://elm-chan.org/cc_e.html)
- [exFAT Filesystem technical document](https://elm-chan.org/docs/exfat_e.html)

### Observed patterns

The home page is a small table of contents rather than a marketing landing page. It exposes direct links to profile, projects, technical notes, software, a BBS, links, and history; immediately below, dated update entries communicate active personal maintenance. A short operator-written statement explains the site's purpose and sets expectations.

The Technical Notes page groups a large link inventory under plain subject headings. The individual exFAT document begins with created and updated dates, an in-page numbered contents list, direct prose, progressively nested headings, technical tables, hexadecimal notation, and code fragments. The information is allowed to be long and dense without being divided into decorative product cards.

The BBS link was discoverable on the home page but its contents were not retrievable in this inspection. Visual spacing, exact typography, and viewport behavior were not directly observed.

### Selected patterns

- direct, link-dense directories with minimal ceremony;
- page-local tables of contents for long records and technical archives;
- visible created/updated dates and maintainer identity;
- small explanatory notes that make a node feel operated by a particular person;
- plain separators, nested headings, compact tables, and inline technical notation;
- permission for individual hosts and vendors to vary locally inside a shared accessible shell;
- dense content where the content itself is the interface.

### Rejected patterns

- the Elm name, identity, images, text, technical content, and exact layout;
- literal imitation of its typography, language quirks, or navigation labels;
- an assumption that every user is comfortable with an undocumented directory;
- shrinking body text or link targets merely to look old;
- applying the same handmade treatment to security-critical forms and GM actions;
- removing search, filters, status, or accessible navigation from dense application pages.

### Transformation for ShadowGrid

Elm-chan's authored documentation model becomes the local voice of a Matrix node. A talismonger archive may have a hand-maintained index and an astral-field notation legend; a decker's host may publish dated diagnostics and hex-address tables; a fixer page may include terse operator notes and irregular subsections. Shared landmarks, focus order, access checks, and mobile behavior remain consistent beneath those local skins.

Long job briefings, after-action records, product metadata, and audit details use real headings and tables rather than ornamental cards. A compact `LAST PATCHED` or `MAINTAINED BY` line provides character without obscuring the authoritative timestamp.

### ShadowGrid pages using the patterns

- `/board` and `/board/[host]` host directories
- `/board/thread/[threadId]` for readable long-form posts
- `/vendors/[vendorId]` and `/contacts` for individually authored local pages
- `/jobs/[jobId]` for structured briefings and attachments
- `/market/[productId]` for technical and magical attribute tables
- `/inventory`, `/character`, and archival or lore nodes
- `/gm/audit` for dense, inspectable records rather than oversized cards

## nowhere.moe

Reference inspected: [nowhere.moe public gateway](https://nowhere.moe/)

### Observed patterns

The public page is a boundary notice rather than the destination. Its heading announces that the site is going underground; the copy explicitly distinguishes the clearnet from a hidden network, provides one principal route onward, and frames identity around action rather than public persona. The small amount of content makes the transition itself the experience.

This inspection covered the public gateway text only. It did not enter or inspect any hidden service, and exact visual or responsive behavior was not observable.

### Selected patterns

- a minimal interstitial before a meaningful access boundary;
- explicit old-route/new-route language;
- a single dominant continue action plus a safe way back;
- concise warnings that state what changes after entry;
- anonymous or pseudonymous presentation as an in-world identity mode;
- a clear distinction between public, permitted, restricted, and unknown hosts.

### Rejected patterns

- real Tor or onion-service instructions, links, or operational claims;
- any promise of real anonymity, censorship resistance, privacy, or trace protection;
- copying nowhere.moe's wording, name, imagery, political statements, or exact composition;
- ambiguous consent, fake system-browser warnings, or a gateway that traps navigation;
- using an atmospheric access screen as a substitute for server-side authorization.

### Transformation for ShadowGrid

The boundary becomes fictional campaign state. A gateway may say `CLEARNET RELAY TERMINATED`, identify the destination host, show the required Matrix clearance or faction credential, and explain whether the character has access. The route, SIN bypass, certificate, and trace-risk values are explicitly labeled as campaign fiction. Continue and cancel actions use ordinary accessible controls.

Denied access shows the rule category without leaking hidden story data: for example, `CLEARANCE INSUFFICIENT`, `INVITATION TOKEN ABSENT`, or `ACCOUNT RESTRICTED`. The server still decides whether the destination can be rendered.

### ShadowGrid pages using the patterns

- `/login`
- `/access-denied`, `/account-restricted`, `/maintenance`
- entry to hidden `/board/[host]` nodes
- restricted job and product reveal states on `/jobs/[jobId]` and `/market/[productId]`
- preview-mode entry and exit notices in the GM workflow

## Rekt Network

References inspected:

- [Rekt Network Chillsynth route](https://rekt.network/eq?station=chillsynth)
- [Rekt Network EQ](https://rekt.network/eq)
- [Rekt Network Chat](https://rekt.network/chat)

### Observed patterns

The extracted pages share a persistent set of destinations for EQ, visualization, station, chat, archive, and releases, followed by a compact station directory. Site tips describe pinning pages with `Ctrl+Click`, a minimal mode with `Ctrl+F11`, unconventional compact controls, and reset gestures. The settings list exposes Flicker, Scanlines, Noise, Flip, HLS Audio, and Clear Cache as user-controlled items.

This demonstrates a persistent station/tool model and makes effects adjustable rather than silently fixed. The extracted HTML also asks for JavaScript, so the complete interactive equalizer, pinning behavior, and visual layering could not be verified. Desktop versus narrow-window behavior was not inspected.

### Selected patterns

- a persistent Matrix signal/status panel across destinations;
- compact global controls that do not require leaving the current task;
- optional pinned context panels;
- explicit scanline, noise, motion, and audio settings;
- a low-distraction or minimal mode;
- keyboard-oriented navigation when it does not override browser and assistive-technology shortcuts;
- architecture for an optional campaign broadcast that leaves the rest of the site independent.

### Rejected patterns

- the Rekt/Nightride identity, station names, music, copy, and exact controls;
- synthwave as ShadowGrid's primary identity;
- strong flicker, screen flipping, or disorienting motion;
- hiding an essential control in a logo, hover-only gesture, or right-click action;
- autoplaying audible media;
- requiring effects, audio, or JavaScript-only decoration to understand or operate a page;
- copying a full-screen music interface onto forms, tables, or long forum threads.

### Transformation for ShadowGrid

The station shell becomes a `MATRIX SIGNAL MONITOR`: current host, fictional route, clearance, unread count, trace-risk fiction, and announcement state persist in the app shell. A small optional broadcast panel can show an in-world station and volume after the player opts in. Pinned panels hold context such as a job briefing, contact channel, or thread watch state, not music-site content.

Display settings are independent and saved on the current device: scanlines, noise, flicker, background grid, animation intensity, reduced motion, and sound. Strong flicker is never offered; flicker defaults off, sound defaults off, and reduced-motion preference wins over theme animation.

### ShadowGrid pages using the patterns

- the authenticated player shell around `/dashboard`, `/feed`, `/board`, and `/market`
- `/messages/[conversationId]` and optional campaign chat rooms
- `/settings` for effects, themes, sound, and reduced motion
- `/gm` for persistent campaign status and urgent queues
- an optional future broadcast panel available across the authenticated shell

## Cyberspace

Reference inspected: [Cyberspace home and public discussion index](https://cyberspace.online/)

### Observed patterns

Cyberspace presents itself as text-first social media and explicitly deprioritizes ads, video, algorithms, suggestions, tracking, crypto, and bots. Its public navigation exposes Index, Discussions, Interests, Forums, Following, Friends, and Watching. A visible theme chooser includes multiple functionally equivalent styles such as Dark, Light, LCD, C64, VT320, Matrix, Brutalist, and GRiD.

Discussion entries are compact and text-forward. They show a handle, relative time, word count, reply or save counts, title or excerpt, tags, and direct actions such as Open, Save, and Expand. A published update describes chat in a sidebar mode and quick room or input shortcuts. The page footer advertises a command layer with `Ctrl+K`, arrow navigation, Escape, and Tab.

Individual profile and discussion routes were linked but were not retrievable through this inspection, so thread-detail layout, authenticated watching behavior, and narrow-window behavior remain unverified.

### Selected patterns

- a text-first feed with readable long-form content;
- compact post metadata and explicit tags;
- direct open, save, watch, reply, quote, and report actions;
- separate discussion, forum-host, saved, and watched views;
- an optional persistent room/chat panel;
- a command palette and list navigation with visible focus and documented shortcuts;
- several readable, functionally equivalent themes;
- reduced dependence on portraits and decorative imagery.

### Rejected patterns

- the Cyberspace name, wordmark, writing, member content, theme names, or exact page design;
- public sign-up, because ShadowGrid accounts are GM-created by default;
- consumer-social concepts that do not serve the campaign, such as a generic friends graph;
- copying the reference's entire theme palette or terminal treatment;
- shortcut handling that captures text input or overrides established browser and accessibility commands;
- loading an unauthorized excerpt into the feed before checking its host, faction, clearance, reputation, or player-specific rules.

### Transformation for ShadowGrid

Compact social metadata gains campaign meaning: author display mode, source host, clearance, tags, word count, replies, saves, and encryption state. `Watching` becomes watched Matrix threads or nodes; private chat becomes permission-aware runner channels; the command palette exposes only actions the server allows.

Theme labels become original in-world options such as `SEATTLE GRID`, `CORPORATE HOST`, `GREEN PHOSPHOR`, `AMBER TERMINAL`, `REDMOND BBS`, `SHAMANIC NODE`, `BLACK ICE`, and `LOW-BANDWIDTH MODE`. Themes share semantic markup, content order, contrast requirements, and capability. Images support a post or listing but never replace its textual identity.

### ShadowGrid pages using the patterns

- `/feed`
- `/board` and `/board/[host]`
- `/board/thread/[threadId]`
- `/messages` and `/messages/[conversationId]`
- saved threads, watched nodes, and notifications in `/dashboard`
- `/settings` for themes, keyboard help, motion, and bandwidth preferences

## Cross-reference synthesis

The sources are assigned different jobs rather than blended into one visual collage:

| Concern | Primary source | ShadowGrid result |
| --- | --- | --- |
| Application and GM workflow | Vibe4, pending verification | Familiar list/detail/form structure inside an elevated control host |
| Forum and feed behavior | Cyberspace | Text-first entries, compact metadata, saves, watches, commands, and rooms |
| Local node personality | Elm-chan | Authored directories, maintainer notes, dense technical records, irregular local skins |
| Persistent system controls | Rekt Network | Signal monitor, pinned context, independent effect toggles, consent-based audio |
| Restricted-host transition | nowhere.moe | Minimal fictional route-change and access-decision gateways |
| Campaign identity | original ShadowGrid content | Megacorporate, street, Matrix, metatype, magical, and fixer-network layers without official presentation |

Across all pages, state and access are communicated in text as well as color. The visual system uses dark charcoal, aged green, amber, muted red, restrained corporate cyan, and restrained astral violet; it avoids neon gradients, glassmorphism, oversized rounded cards, cryptocurrency imagery, and constant glitch effects.

## Responsive interpretation and outstanding visual QA

Because a controllable browser was unavailable, no claim is made that a particular reference uses a particular breakpoint or narrow-screen transformation. ShadowGrid follows the project specification directly:

- desktop: persistent status bar and left navigation, central content, optional right context and bottom command bar;
- tablet: collapsible navigation, contextual panels after the main content, reduced table columns;
- mobile: navigation drawer, compact status, stacked rows/cards, reduced effects, and no horizontal page overflow;
- GM workflows: the same actions remain reachable on tablet and mobile, with data tables transformed into labeled rows rather than clipped.

A browser-backed QA pass is still required for the reference sites and ShadowGrid itself. Test widths should include at least 1440, 1024, 768, 390, and 320 CSS pixels, plus keyboard-only navigation, 200% zoom, reduced-motion preference, and effects-disabled mode. Findings should be added as observations only after they are directly verified.

## Originality and safety guardrails

- No official Shadowrun logo, artwork, sourcebook layout, faction emblem, portrait, rule table, or long text is copied.
- All corporations, contacts, factions, portraits, product copy, forum content, icons, and host identities are original.
- Marketplace goods, services, nuyen, trace risk, routes, and transactions are clearly fictional campaign entities.
- The interface does not provide real anonymity guidance, real darknet links, or real illegal services.
- Theme and atmosphere never weaken semantic HTML, focus order, error clarity, contrast, reduced motion, or server-side authorization.
