# ShadowGrid

ShadowGrid is a working campaign-host MVP for a Shadowrun tabletop game. It
combines a private runner forum, restricted Matrix nodes, fixer catalogues,
fictional nuyen purchases, player inventories, and a Game Master control host.

The implemented release centers on the first complete vertical slice:

> A Game Master creates a runner, vendor/fixer, and restricted listing; an
> eligible player buys the listing; D1 commits the order, balance, stock,
> inventory, ledger, notification, and audit state together.

This is not yet the complete platform described in `PROJECT_SPEC.md`. See
[Current limitations](#current-limitations) before using it for a live campaign.

## What works now

- Private login with no public registration.
- Owner-secret security bootstrap with no usable seed password embedded in the
  repository or published in this documentation. Missing or invalid bootstrap
  configuration fails closed for fresh and legacy version-1/version-2 seeds.
- PBKDF2-SHA-256 password hashes, hashed session tokens, HTTP-only session
  cookies, logout, atomic relative account-failure updates, and a
  five-attempt/fifteen-minute account plus login/source lockout.
- JSON-only mutation requests with `Sec-Fetch-Site` and `Origin` validation
  before action dispatch.
- For accounts marked `forcePasswordChange`, enforced first-login password
  replacement with a credential-only settings view, a server command gate,
  current-password verification, other-session invalidation, and an audit
  event.
- Server-side role and permission checks for protected reads, GM routes, and
  implemented mutations across Game Master, Assistant Game Master, Moderator,
  and Player roles.
- A persistent Cloudflare D1 relational model, migration, constraints, safety
  triggers, automatic bootstrap, and populated campaign seed.
- Runner dashboard, authorized feed, Shadow Board hosts/threads, jobs,
  marketplace, vendor and contact directories, orders, inventory, messages
  index, character dossier, and display settings.
- Server-filtered host, thread, job, contact, announcement, and product
  visibility based on current player context. Player snapshots strip GM-only
  notes.
- Thread creation and replies, including explicit and audited GM/NPC author
  modes. Reply authorization rechecks both host and thread visibility plus host
  read/reply permissions.
- Marketplace search/filter, listing detail, and fictional purchases.
- Idempotent purchase requests with authoritative server price, a guarded D1
  write batch, nonnegative balance/stock triggers, access guard, order snapshot,
  ledger entry, inventory delivery, notification, and audit event.
- GM overview, runner creation, nuyen/reputation/clearance adjustment with
  current-row ledger/audit values and relative in-batch updates, product
  creation and hide/reveal, vendor creation, host creation, NPC threads, order
  approval/rejection, economy view, and immutable audit view.
- Read-only Preview as Player. Preview keeps the GM session, displays a
  persistent warning, removes GM routing, and rejects campaign mutations on
  the server.
- Eight readable host themes plus independent scanline, noise, flicker,
  background-grid, animation-intensity, reduced-motion, and sound controls.
  Flicker and sound are off by default.
- Responsive desktop, tablet, and mobile CSS, visible focus states, semantic
  controls, reduced-motion CSS, Ctrl/Command+K commands, and J/K list
  navigation.

## Requirements

- Windows PowerShell
- Node.js 22.13.0 or newer
- npm

No separate PostgreSQL server or Docker container is needed for this Sites
build. Local development uses the project-scoped Cloudflare D1 simulator.

## Run locally

Before the first start, copy `.env.example` to the ignored `.env.local` file and
enter an owner-created temporary secret of 12–128 characters:

```dotenv
SHADOWGRID_BOOTSTRAP_PASSWORD=<owner-created temporary secret>
```

Do not commit, publish, or paste the real value into documentation. Open
PowerShell in the cloned `shadowgrid` project directory, then run:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the exact `Local` URL printed by the development server. It normally
starts at `http://localhost:3000` and chooses the next free port when that port
is already occupied.

The first login or health request initializes D1 automatically. To check the
running host, append `/api/health` to the printed Local URL. For example, when
the server uses port 3000:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/health'
```

Stop the development server with Ctrl+C.

## D1 bootstrap and seed behavior

`.openai/hosting.json` declares one D1 binding named `DB`. R2 object storage is
not enabled.

On the first database-backed request in a process, ShadowGrid:

1. Loads `drizzle/0000_next_mandrill.sql`.
2. Creates missing tables and indexes idempotently.
3. Installs database guards for nonnegative nuyen, nonnegative finite stock,
   purchasable order items, terminal order transitions, and immutable audit
   rows.
4. Checks `campaign_settings.seed_version` and the owner-entered
   `SHADOWGRID_BOOTSTRAP_PASSWORD`.
5. Fails closed when a fresh or version-1/version-2 database has no valid
   12–128 character secret. The host records `OWNER_SECRET_REQUIRED`, rejects
   authentication, and revokes seeded sessions.
6. With a valid secret, creates a fresh campaign seed and applies the guarded
   accounting-v2 correction, or upgrades an existing version-1 seed through
   accounting v2.
7. Applies security v3: rotates every seeded credential, enables only
   `architect` / `BLACKROOT` with the owner secret, disables the other original
   seed identities behind random unrecoverable credentials, forces the owner
   password change, revokes every active session, and records the security
   audit/marker.
8. Reuses a version-3 campaign without rewriting campaign records.

Later requests reuse the existing D1 data. Restarting a version-3 app does not
deliberately overwrite campaign records. Version-1/version-2 hosts remain
closed until restarted with a valid secret; that restart rotates credentials
and revokes sessions before marking security version 3 ready. The accounting-v2 step
reserves nuyen and stock for the seeded pending order, writes its matching
ledger row, and aligns delivered-order stock once behind a dedicated correction
marker. Local simulator state is stored under the project's ignored `.wrangler`
directory.

For a hosted Sites deployment, configure `SHADOWGRID_BOOTSTRAP_PASSWORD` as an
owner-entered runtime secret before the first database-backed request. Never put
the value in `.openai/hosting.json`, source, seed data, or a committed env file.
The exact hosted secret command is intentionally omitted until the active Sites
hosting workflow is confirmed.

There is no manual `db:seed` command. `npm.cmd run db:generate` only generates a
new Drizzle migration after a schema edit; it does not apply or seed a database.

## Owner bootstrap and seeded identities

The repository contains no usable seed passcodes. The owner supplies one
temporary `SHADOWGRID_BOOTSTRAP_PASSWORD`; only the Game Master login
`architect`, runner alias `BLACKROOT`, is enabled with it. The credential gate
requires that owner to replace the temporary secret before any other host route
or command becomes available.

The original Assistant GM and runner identities remain in the fictional seed,
but security v3 gives each a random unknown credential and disables the account.
They cannot log in. The current GM can create usable replacement runner accounts
through `/gm/players/new`; reset/enable controls for those original identities
are not complete yet.

The clean seed contains one GM, one Assistant GM, six runners, four factions,
six clearance levels, six contacts, four vendors, nineteen product categories,
thirty products, six hosts, twelve threads plus replies, eight jobs,
conversations, announcements, inventories, orders, ledger rows, and audit
events.

## Verification commands

Run these from the project directory in PowerShell:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
```

`npm.cmd test` runs a production build again, then executes the Node test suite.
The current tests check the access gateway, relational schema, purchase safety
guards, effect controls, and removal of starter residue. They are source-level
contract tests, not a substitute for D1 integration tests or browser
end-to-end tests.

Verified on 2026-08-01:

- ESLint passed.
- Strict TypeScript checking passed.
- The production build passed.
- The automated suite passed 5/5 tests.
- A post-v3 no-secret runtime probe returned HTTP 200 from `/api/health` with
  `seed_version=2`, `security_ready=0`, and `accounting_ok=1`; an obsolete login
  failed closed with HTTP 503, and a form-encoded mutation was rejected with
  HTTP 415.
- The authenticated first vertical slice completed with an allowed player and
  a denied player before the final v3 bootstrap hardening. Historical details
  are recorded in
  [PROJECT_SPEC.md](PROJECT_SPEC.md#first-vertical-slice-acceptance-evidence).
- Authenticated post-v3 runtime verification awaits the owner-entered secret.
- In-app visual and narrow-window QA remains outstanding because no
  controllable in-app Browser session was available.

To serve an already built production bundle locally:

```powershell
npm.cmd run start
```

## Routes

All protected pages require a valid ShadowGrid session. Direct navigation does
not bypass the server snapshot filters.

### Public

| Route | Current behavior |
| --- | --- |
| `/login` | Restricted-host login; public registration is absent |
| `/access-denied` | Metadata-safe permission denial |
| `/account-restricted` | Account restriction notice |
| `/maintenance` | Maintenance notice |
| `/api/health` | Initializes D1 and reports counts, seed/security readiness, and accounting health |

### Player

| Route | Current behavior |
| --- | --- |
| `/dashboard` | Status, announcements, nuyen, reputation, clearance, activity |
| `/feed` | Authorized thread-focused network feed |
| `/board` | Visible Matrix host directory |
| `/board/[host]` | Host threads and new-thread form |
| `/board/thread/[threadId]` | Thread posts and reply form |
| `/jobs`, `/jobs/[jobId]` | Authorized job index and briefing |
| `/market`, `/market/[productId]` | Filtered market, listing, purchase |
| `/vendors`, `/vendors/[vendorId]` | Fixer/vendor directory and local page |
| `/contacts` | Authorized contact dossiers |
| `/orders` | Player order manifest |
| `/orders/[orderId]` | Currently resolves to the order manifest, not a detail editor |
| `/inventory` | Authoritative player-visible inventory |
| `/messages` | Conversation index |
| `/messages/[conversationId]` | Currently resolves to the index; no reply view yet |
| `/character` | Read-only runner dossier and account capabilities |
| `/settings` | Enforced password change plus device-local display preferences |

### Game Master

| Route | Current behavior |
| --- | --- |
| `/gm` | Control overview, metrics, quick actions, pending orders |
| `/gm/players` | Runner directory |
| `/gm/players/new` | Transactional runner creation |
| `/gm/players/[playerId]` | Adjustment and read-only preview entry |
| `/gm/products` | Listing directory and hide/reveal |
| `/gm/products/new` | Product creation |
| `/gm/products/[productId]` | Product list today; full edit form is planned |
| `/gm/vendors` | Vendor/fixer creation and directory |
| `/gm/orders` | Approve or reject pending orders |
| `/gm/hosts` | Restricted host creation and directory |
| `/gm/board` | Explicit NPC/system thread creation |
| `/gm/characters` | Read-only character index |
| `/gm/contacts` | Read-only contact view |
| `/gm/jobs` | Read-only job view |
| `/gm/inventories` | Limited read-only inventory view |
| `/gm/messages` | Seeded inbox view; NPC message authoring is planned |
| `/gm/announcements` | Seeded announcement view; authoring is planned |
| `/gm/economy` | Recent immutable ledger window |
| `/gm/audit` | Recent immutable audit window |
| `/gm/settings` | Reserved configuration node |

## Current limitations

- This is an MVP vertical slice, not the full campaign-management specification.
- GM-initiated password reset, temporary-password issue/expiry management,
  account suspension controls, and role/permission editors are not complete.
- Only the bootstrap Game Master is enabled in the clean seed. The original
  Assistant GM and runner identities remain disabled until a future GM reset/
  enable workflow is complete; use the working runner-creation flow for usable
  player accounts today.
- Assistant GM permissions are seeded and enforced for protected reads, GM
  routes, and implemented mutations, but there is no UI to configure them
  individually.
- Product management currently supports create and hide/reveal. Editing every
  field, duplication, deletion, media, scheduled publishing, individual
  unlocks, and contact/job-based unlock editors are planned.
- Product restrictions currently cover visibility state, reputation,
  clearance, faction, expiry, and relational player allow/deny records. The GM
  form exposes the first two thresholds but not every access-rule type.
- Forum creation and replies work. Markdown is stored safely and shown as text;
  rich Markdown rendering, quotes, edit history UI, reports, saving/watching,
  moderation controls, and pagination are not complete.
- Jobs are readable, but applications, assignment, editing, payments, rewards,
  and related-thread automation are not implemented.
- Messaging is a seeded conversation index. Conversation detail, reply,
  attachments, search, archive, mute/report mutations, chat rooms, and NPC
  message authoring are planned.
- GM contact, announcement, inventory, character, and campaign-setting
  management are read-only or reserved.
- Order detail pages and the wider status workflow are partial; the GM
  implementation currently approves live pending purchases to Delivered or
  rejects with a refund.
- Notifications are written for purchases/order decisions but do not yet have a
  dedicated notification center.
- R2 uploads, product images, attachments, and ambient audio are not wired.
- Display settings use browser storage because they are intentionally
  device-local; all campaign authority remains in D1.
- The supplied automated tests are primarily source/regex contract checks.
  Repeatable D1 integration, concurrency, accessibility, and Playwright browser
  suites remain planned.
- Login-name/client-source throttling is process-local; deployment-wide source
  throttling across worker isolates remains planned.
- Production hardening still needs password recovery, a confirmed hosted Sites
  runtime-secret workflow, deployment access policy, backup/restore procedures,
  and an operator-reviewed threat model. JSON-only/same-origin mutation checks
  are implemented.
- The Sites build uses Cloudflare D1 rather than the originally suggested
  PostgreSQL/Docker Compose deployment.

See [PROJECT_SPEC.md](PROJECT_SPEC.md) for the implementation checklist and
[docs/gm-workflows.md](docs/gm-workflows.md) /
[docs/player-workflows.md](docs/player-workflows.md) for operational workflows.

## Fictional-content and IP notice

ShadowGrid is an unofficial, independently created tabletop campaign aid. It is
not an official Shadowrun product and is not affiliated with or endorsed by the
owners of Shadowrun.

Shadowrun terminology is used only to describe the campaign context. The
ShadowGrid name, interface, corporations, factions, characters, vendors,
listings, posts, and other presentation are original. No official logos,
artwork, faction emblems, sourcebook layouts, or copied rules text are included.

Every weapon, illegal service, identity, cyberware item, program, job, nuyen
balance, purchase, delivery, and trace indicator in this application is
fictional tabletop-game content. Nothing in ShadowGrid is a real marketplace,
financial service, anonymity measurement, or guide to unlawful activity.
