# ShadowGrid Project Specification and Implementation Status

Status date: 2026-08-01

ShadowGrid is a private, unofficial Shadowrun tabletop campaign host assembled
from an old BBS, runner forum, fixer market, corporate terminal, magical
archive, and Game Master control system. It is deliberately text-first and
information-dense rather than a generic neon dashboard.

This file condenses the requested product specification into the current
delivery status. The detailed behavioral contracts remain in
[docs/gm-workflows.md](docs/gm-workflows.md) and
[docs/player-workflows.md](docs/player-workflows.md).

## Status legend

- **Implemented** — present in the application and usable in the current MVP.
- **Partial** — a useful read path or vertical-slice action exists, but the full
  requested workflow is not complete.
- **Planned** — modeled, reserved, or required by the original specification,
  but not yet usable end to end.

## Implemented

### Platform, storage, and security boundary

- [x] Next-compatible Vinext/React application with strict TypeScript.
- [x] Cloudflare D1 persistence declared as the `DB` Sites binding.
- [x] Drizzle relational schema and generated SQL migration.
- [x] Automatic idempotent schema bootstrap and versioned seed on the first
  database-backed request.
- [x] Security bootstrap version 3 requires an owner-entered
  `SHADOWGRID_BOOTSTRAP_PASSWORD` of 12–128 characters for fresh or legacy
  version-1/version-2 state; no usable seed password exists in source or docs.
- [x] Missing or invalid bootstrap configuration fails closed. Legacy seed
  sessions are revoked, authentication remains unavailable, and the host
  records `OWNER_SECRET_REQUIRED` until a valid-secret restart performs the v3
  rotation.
- [x] Required core tables for users, profiles, roles, permissions, factions,
  clearance, relationships, contacts, vendors, products, access rules, carts,
  orders, inventory, jobs, forums, private messages, chat, announcements,
  notifications, settings, restrictions, sessions, ledger, and audit history.
- [x] Foreign keys, uniqueness rules, indexes, timestamps, and soft-deletion
  fields across the campaign model.
- [x] Database guards preventing negative balances, negative finite stock,
  unauthorized order-item inserts, repeated terminal order processing, and
  audit-log update/deletion.
- [x] Server-side Zod validation for implemented mutations, with JSON-only POST
  bodies and same-origin `Sec-Fetch-Site`/`Origin` enforcement before dispatch.
- [x] No public registration.
- [x] PBKDF2-SHA-256 password hashing, server-side session records, hashed
  session tokens, HTTP-only/SameSite cookies, logout, account-enabled checks,
  temporary-password expiry checks, atomic relative account-failure increments,
  and five-attempt/fifteen-minute account plus login/source throttling.
- [x] Accounts marked for forced first-login password replacement receive a
  credential-only snapshot, page and API command gates, current-password
  verification, other-session invalidation, and an audit event.
- [x] Server authorization helpers for player, product, economy, forum, job,
  host, thread, messaging, purchase, balance, and inventory decisions.
- [x] Game Master, Assistant GM, Moderator, and Player seed roles with explicit
  role-to-permission relationships.
- [x] Assistant GM snapshots and GM routes are scoped to their explicit
  permissions rather than granting a broad elevated read context.
- [x] Player-facing snapshots strip GM-only notes from jobs, vendors, contacts,
  orders, and inventory.

### Seeded campaign world

- [x] One enabled Game Master seed identity plus one disabled Assistant GM and
  six disabled runner identity records in the clean seed.
- [x] Only `architect` / `BLACKROOT` receives the owner-entered temporary
  bootstrap secret and must replace it at first login. Every other original
  seed identity receives a random unknown credential and remains disabled.
- [x] Six runner characters, four original factions, and six configurable
  clearance records.
- [x] Six contacts and four individually authored vendor/fixer nodes.
- [x] Nineteen product categories and thirty original fictional products.
- [x] Six Matrix hosts, twelve threads, replies, eight jobs, conversations,
  announcements, inventories, orders, ledger rows, and audit events.
- [x] Marker-guarded seed accounting version 2 reserves balance and stock for
  the pending order and aligns the delivered-order stock exactly once.
- [x] Security version 3 rotates version-1/version-2 seed credentials and
  revokes every active session on a valid-secret restart before marking the
  host ready.
- [x] Original ShadowGrid identity and campaign content without official logos,
  artwork, faction emblems, sourcebook layouts, or copied rules prose.

### Player surface

- [x] Restricted-host login and logout.
- [x] Dashboard with alias, route, fictional trace risk, nuyen, reputation,
  clearance, announcements, jobs, market signals, and forum activity.
- [x] Server-filtered Grid Feed and Matrix host directory.
- [x] Host and thread views, new player thread creation, and replies. Reply
  authorization rechecks host and thread visibility plus host read/reply
  permissions.
- [x] Authorized job index and briefing detail.
- [x] Filtered market index, category/text filtering, listing detail, and
  fictional purchase confirmation.
- [x] Vendor/fixer directory and locally themed vendor pages.
- [x] Contact directory filtered by active/hidden state, reputation, clearance,
  and known relationship.
- [x] Player order manifest, inventory view, ledger-backed balance, character
  dossier, and conversation index.
- [x] Server responses omit inaccessible hosts, threads, products, jobs, and
  targeted announcements.

### Game Master surface

- [x] Elevated GM overview with runner, order, product, and audit signals.
- [x] Runner creation with character metadata, faction, clearance, starting
  reputation, starting nuyen, temporary password, and audit history.
- [x] Nuyen, reputation, and clearance adjustment with reason, before/after
  state, ledger/reputation events, and audit history. Ledger, reputation, and
  audit values are selected from current rows inside the batch, and balances/
  reputation are changed with relative updates.
- [x] Vendor/fixer creation.
- [x] Product creation with vendor, category, price, stock, legality, rarity,
  reputation/clearance gates, approval requirement, and hidden state.
- [x] Product hide/reveal.
- [x] Matrix host creation with theme, node address, reputation/clearance gates,
  and optional hidden state.
- [x] Explicit GM/NPC/system/corporate/anonymous thread author modes with the
  real acting GM retained in audit history.
- [x] Pending-order approval and rejection for orders created through the live
  purchase workflow. Approval delivers inventory; rejection restores nuyen and
  finite stock through compensating records.
- [x] Recent economy ledger and immutable audit views.
- [x] Read-only Preview as Player with server-held preview context, persistent
  warning, no GM routes, server-side write rejection, and audited enter/exit.

### Purchase consistency and auditing

- [x] Product visibility is recalculated on the server.
- [x] Browser-supplied price is ignored; price and total are authoritative.
- [x] Quantity is validated and bounded.
- [x] Player identity, role, purchasing restriction, balance, stock, product
  state, expiry, faction, reputation, clearance, and allow/deny rules are
  checked for purchase.
- [x] Idempotency keys prevent duplicate charges/orders for a repeated request.
- [x] Order, order-item snapshot, nuyen deduction, stock decrement, ledger,
  inventory delivery when applicable, notification, and audit writes execute
  in one D1 batch protected by database triggers.
- [x] Purchase ledger before/after values are selected from the balance updated
  inside that same batch rather than copied from a pre-batch snapshot.
- [x] Approval-required orders reserve the purchase as `AWAITING GM` and defer
  inventory delivery.
- [x] Sensitive implemented GM actions write actor, action, target, summary,
  state, timestamp, and limited request metadata.
- [x] Audit records are immutable through both application design and database
  triggers.

### Interface and presentation

- [x] ShadowGrid's original old-BBS/Matrix-host visual identity incorporates
  street, corporate, Matrix, and magical content.
- [x] Persistent node navigation, status bar, context panel, and command bar.
- [x] Seattle, Corporate, Green, Amber, Redmond, Shamanic, Black Ice, and
  Low-Bandwidth themes.
- [x] Independent scanline, noise, flicker, grid, animation-intensity,
  reduced-motion, and sound preferences.
- [x] Flicker and sound disabled by default; no essential information depends
  on effects.
- [x] Keyboard command dialog, Ctrl/Command+K, Escape, and J/K/Enter list
  navigation without intercepting typing or modified browser shortcuts.
- [x] Semantic controls, visible focus styling, textual status labels, loading
  feedback for forms, empty states, denied states, and responsive CSS
  breakpoints.

## Partial

### Accounts, roles, and restrictions

- [ ] Password reset, temporary-password issue/expiry management, and active
  session revocation controls are not exposed to the GM.
- [ ] The original Assistant GM and runner seed identities are intentionally
  disabled. GM reset/enable controls are not complete, so the current usable
  path is to create replacement runner accounts through the working GM form.
- [ ] Account enable/disable and restriction fields exist, but suspension,
  independent restriction editing, and automatic session invalidation are not
  complete workflows.
- [ ] Assistant GM and Moderator permissions are server modeled and seeded, but
  the GM cannot configure their individual permissions in the UI.
- [ ] The runner directory renders search/filter controls, but complete
  filtering, sorting, pagination, bulk actions, and all player-detail tabs are
  not wired.

### Shadow Board and feed

- [ ] Thread creation and replies work; Markdown is stored and safely displayed
  as text rather than rendered with a full Markdown pipeline.
- [ ] Quote, save, watch, report, edit-history, moderation, move, pin, lock,
  restore, and pagination workflows are not complete.
- [ ] The feed combines visible forum signals with dashboard job/market
  summaries, but a unified interactive feed with saved/watched state and all
  requested event types is not complete.

### Jobs, market, contacts, and inventory

- [ ] Jobs and requirements are filtered/readable, but GM job CRUD,
  reveal/hide, applications, assignments, status transitions, briefings,
  payments, rewards, and linked-thread automation are planned.
- [ ] Product create and hide/reveal work. Full existing-product editing,
  duplicate/delete, scheduled publishing, unlimited stock, negotiable price,
  media, custom attributes, player-specific grants, and contact/job unlock
  editors are incomplete.
- [ ] Vendor creation and authored vendor pages work. Full vendor editing and
  contact relationship management are not implemented.
- [ ] Contacts are readable; contact CRUD, player assignment, job unlocks, and
  service/product management are not implemented.
- [ ] Purchase-created inventory is authoritative and readable, but GM
  grant/remove/condition/conceal/reveal/equip/story-note tools are incomplete.
- [ ] Order approve/reject works. Order detail pages, notes UI, cancellation,
  transit/dead-drop/lost/seized transitions, and advanced refund flows are
  incomplete.

### Messaging, announcements, and campaign control

- [ ] Seeded conversation and message previews are readable, but conversation
  detail, compose/reply, search, archive, unread mutations, mute/report,
  attachments, and NPC-message authoring are not implemented.
- [ ] Announcement filtering and display work, but GM create/edit/target/
  schedule/expire controls are not implemented.
- [ ] Character, contact, inventory, message, announcement, and job GM routes
  currently provide read-only slices rather than full editors.
- [ ] Campaign settings and campaign-time management have a reserved route but
  no mutation UI.
- [ ] Notifications are persisted for purchases/order decisions, but there is
  no dedicated notification center.

### Accessibility, responsive QA, and testing

- [ ] Responsive CSS and accessible control patterns are implemented, but
  final visual/narrow-window interaction QA was not completed because no
  in-app Browser session was available.
- [ ] The Node test suite is still primarily source/regex contract coverage,
  not repeatable D1 integration or concurrency coverage.
- [ ] No Playwright end-to-end suite, automated accessibility scan, or
  multi-browser matrix is present.

## Planned

- [ ] Complete account lifecycle, password recovery, suspension, restriction,
  role, and permission administration.
- [ ] Complete GM CRUD for players, characters, products, vendors, contacts,
  jobs, inventory, forum moderation, messages, announcements, and settings.
- [ ] Full Markdown rendering with sanitization, safe-link policy, quote/report/
  save/watch behavior, editing, moderation, and pagination.
- [ ] Complete private conversation flows and permissioned persistent chat
  rooms.
- [ ] R2-backed product images and message/job attachments with relational D1
  metadata.
- [ ] Full job lifecycle, applications, team assignment, settlement, rewards,
  and related content automation.
- [ ] Complete order lifecycle and detailed fulfillment views.
- [ ] GM-configurable clearance names, faction relationships, contact
  relationships, manual unlocks, and pricing rules.
- [ ] Optional pirate-radio/ambient audio architecture with explicit consent,
  mute, volume, and station selection.
- [ ] Repeatable D1 integration tests for authorization, purchase races,
  rollback, idempotency, refunds, and immutable audit constraints.
- [ ] Playwright coverage for GM and player vertical slices, responsive
  breakpoints, keyboard operation, reduced motion, and accessibility.
- [ ] Password recovery, a confirmed hosted Sites runtime-secret workflow,
  deployment access policy, deployment-wide source throttling, backup/restore
  procedure, security review, and operations guide.

## First vertical slice acceptance evidence

The vertical slice was exercised against the local D1-backed development server
on 2026-08-01 before the final security-v3 bootstrap hardening. It remains
evidence for the campaign workflow, but authenticated post-v3 runtime
verification requires the owner-entered secret and has not yet been recorded.

| Acceptance step | Result | Evidence |
| --- | --- | --- |
| GM signs in | Historical pass | Seeded `architect` login returned HTTP 200 and `/gm` rendered successfully before the v3 credential rotation |
| GM creates runner | Pass | Created `GHOST_CIRCUIT` through the GM mutation |
| GM assigns clearance and starting nuyen | Pass | New runner was created with the selected clearance and 30,000 nuyen |
| GM creates fixer/vendor | Pass | Created `NIGHT GLASS EXCHANGE` through the vendor workflow |
| GM creates and assigns restricted product | Pass | Created `Mirror Wasp Relay` under that vendor with server-side access thresholds and a 5,000 nuyen price |
| Permitted player signs in | Pass | Player login succeeded and the authorized market rendered |
| Server evaluates visibility | Pass | Permitted runner saw the listing; `STATIC_JACKAL` could not see it |
| Permitted player purchases | Pass | Purchase endpoint returned HTTP 200 |
| Nuyen changes once | Pass | Balance changed from 30,000 to 25,000 |
| Stock and order update | Pass | Finite stock decreased and one order was created |
| Inventory receives item | Pass | Inventory showed the purchased item |
| Ledger and audit are written | Pass | Purchase ledger and audit records were present after commit |
| GM sees order | Pass | GM order route rendered the created order |
| GM approval/rejection implementation | Pass in code, not exercised in this run | Handler supports one terminal review; the version-2 seed now reserves pending-order balance/stock and writes matching ledger state |
| Preview safety | Pass in code | Preview context is server-held, audited, visibly labeled, GM-routed pages are denied, and implemented mutations call the read-only guard |

The historical post-verification health response was HTTP 200 with nine users,
thirty-one products, and seven audit records. The clean seed contains eight
user records and thirty products; the extra user and product are the vertical-
slice records.

After v3 hardening, a no-secret runtime probe intentionally remained on
`seed_version=2` with `security_ready=0` and `accounting_ok=1`; the obsolete
login returned HTTP 503 and a form-encoded mutation returned HTTP 415. This
verifies fail-closed bootstrap behavior and JSON-only mutation enforcement, not
an authenticated post-v3 session.

## Verification status

The final project checks reported:

- [x] ESLint passed.
- [x] Strict TypeScript check passed.
- [x] Production build passed.
- [x] Automated tests passed: 5/5.
- [x] No-secret local health endpoint returned HTTP 200 with security not ready.
- [x] Obsolete login failed closed with HTTP 503; form-encoded mutation failed
  with HTTP 415.
- [x] First vertical slice completed historically with an allowed and denied
  player before the final v3 bootstrap hardening.
- [ ] Authenticated post-v3 runtime verification awaits the owner-entered
  bootstrap secret.
- [ ] In-app visual and narrow-window QA remains outstanding because no
  controllable in-app Browser session was available.

## Completion decision

The **first vertical slice is implemented and manually verified**. The
application is a functional campaign MVP, not a static visual concept.

The **complete original product specification is not finished**. Items under
Partial and Planned must remain visible in handoff and must not be described as
working until their server mutations, UI states, authorization, audit behavior,
and tests are complete.

## Content and intellectual-property boundary

All products, illegal services, identities, nuyen transactions, weapons,
cyberware, Matrix threats, jobs, and trace indicators are fictional tabletop
campaign entities. ShadowGrid is an unofficial independent campaign aid, not an
official Shadowrun product. It uses setting terminology for context while
avoiding official logos, art, emblems, layouts, copied sourcebook prose, and
proprietary rules tables.
