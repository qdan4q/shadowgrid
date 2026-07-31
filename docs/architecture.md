# ShadowGrid architecture

## Current implementation status

ShadowGrid is a working Cloudflare Sites/Vinext campaign application, not the
original starter skeleton. The current repository contains:

- a 49-table Drizzle schema and generated SQLite migration;
- runtime D1 schema initialization, database triggers, and idempotent seed data;
- app-owned campaign login with PBKDF2 password hashes and opaque sessions;
- server-side role helpers and resource visibility checks;
- GM creation flows for runners, vendors, products, and Matrix hosts;
- player product filtering and an atomic purchase/order/inventory/ledger flow;
- GM balance/reputation/clearance adjustments and order approval/rejection;
- Matrix host browsing, thread creation, replies, and explicit NPC/system posts;
- audited, read-only Preview as Player;
- database-backed read surfaces for jobs, messages, announcements, contacts,
  orders, inventory, and the nuyen ledger;
- a responsive player/GM shell with keyboard commands and configurable effects.

The following are **partial or planned**, even though supporting tables or
screens may already exist:

- GM password reset, suspension controls, reset-driven session invalidation,
  and durable cross-isolate/network-wide login throttling;
- per-user permission editing beyond the current role-level grants;
- product access through contacts, jobs, host rules, or PlayerUnlock;
- forum moderation, reports, revisions, save/watch mutations, and relational
  HostAccessRule/player/faction/role grants;
- job creation, application, assignment, reward, and payment mutations;
- private-message authoring, full conversation views, chat, attachments, mute,
  report, and NPC-message mutations;
- announcement authoring, campaign-setting mutations, carts, inventory grants,
  full edit/delete workflows, bulk actions, and pagination;
- R2-backed product images, portraits, and attachments.

The schema and API handlers are the authority for live behavior. A table or
navigation entry alone does not mean its complete workflow is implemented.

## Runtime topology

| Layer | Current choice | Responsibility |
| --- | --- | --- |
| UI | React 19 and Next.js App Router semantics through Vinext | Responsive player and GM views, forms, navigation, local effects |
| Page entry | app/[[...path]]/page.tsx, forced dynamic | Public gateway pages, session resolution, GM route gate, server snapshot load |
| API entry | app/api/[...action]/route.ts | Login/logout plus authenticated JSON-only mutations with request-origin checks |
| Domain | lib/auth.ts, lib/permissions.ts, lib/campaign.ts | Sessions, capability checks, resource policy, workflows, audit |
| Validation | Zod plus strict TypeScript | Mutation payload bounds and enum validation |
| Persistence | Cloudflare D1 through prepared SQL; Drizzle for schema/migration | Authoritative users, campaign state, economy, access, history |
| Runtime | Vinext-generated Cloudflare Worker ESM | Serves the application and receives the DB binding |
| Blob storage | R2 is null | Planned for uploads; no upload workflow is live |

The logical D1 binding is DB in .openai/hosting.json. The Worker accesses it
through db/runtime.ts and db/index.ts. Application services currently use raw,
bound D1 prepared statements; db/schema.ts and drizzle/0000_next_mandrill.sql
define and migrate the relational shape.

### Request flow

For a protected page:

1. The catch-all page resolves the route.
2. getViewerFromCookieHeader hashes the cookie token and looks up an unrevoked,
   unexpired session.
3. The actor User, roles, role permissions, profile, faction, clearance, account
   restrictions, and nuyen balance are loaded from D1.
4. A preview_user_id, when authorized, changes effectiveUser but not actor.
5. GM paths pass canOpenGmRoute.
6. loadCampaignSnapshot queries D1 and applies current resource filters.
7. ShadowGridApp receives one server-built snapshot and renders the requested
   module.

For a mutation:

1. The catch-all API route requires application/json and rejects cross-site
   Sec-Fetch-Site or mismatched Origin requests.
2. It parses JSON and resolves the session again; layouts and hidden buttons are
   not trusted.
3. The domain handler rejects preview mode, validates input, and checks its
   capability/resource helper.
4. It reloads authoritative records and writes through prepared D1 statements.
5. Multi-record operations use D1 batch; sensitive operations append audit
   records in the same batch.
6. The route returns no-store JSON with a stable status/error message.

The current snapshot design is simple and appropriate for the campaign-sized
seed, but it loads most modules on each protected page. Future work should split
it into route-specific queries and response models before data volume grows.

## D1 bootstrap and seed

db/runtime.ts imports the generated migration as text. Once per Worker isolate,
ensureCampaignReady:

1. splits migration statements at Drizzle statement breakpoints;
2. converts CREATE TABLE/INDEX to IF NOT EXISTS;
3. runs them in D1 batches of 35;
4. creates seven runtime triggers for nonnegative balances/stock, bounded street
   reputation, order-item access, terminal order decisions, and immutable audit
   rows;
5. reads the optional SHADOWGRID_BOOTSTRAP_PASSWORD Worker secret;
6. calls seedCampaignIfEmpty and records seed_version=3 only after secure
   bootstrap is ready. The v2 accounting marker still makes the one-time seed
   reservation correction idempotent when upgrading a v1 demo database.

The seed contains one GM, one Assistant GM, six players, four factions, six
clearances, ten permissions, six contacts, four vendors, nineteen categories,
thirty products, six hosts, twelve threads plus replies, eight jobs, messages,
announcements, inventory, orders, ledger entries, and audit history.

Secure seed initialization requires an owner-supplied
SHADOWGRID_BOOTSTRAP_PASSWORD of 12 through 128 characters. The value is not
stored in source or plaintext D1 state. Without it, a fresh database receives
the schema and OWNER_SECRET_REQUIRED marker but no demo identities/content;
authentication returns 503 while seed_version is not 3. A legacy v1/v2 database
also has active sessions revoked and remains behind the same authentication
gate.

With a valid secret, a fresh database receives the populated seed. Only the GM
identity is enabled and receives a hash of that bootstrap secret; it is forced
through the credential-only password-change route. Seeded Assistant GM and
Player identities receive unguessable random hashes and remain disabled, so the
owner secret cannot authenticate those roles. A v1 upgrade applies accounting
v2 first, then security v3 unconditionally rotates every fixed seed identity.
user-gm receives the owner secret and stays enabled; user-agm and all fixed seed
Players receive unique random unusable secrets and are disabled. The upgrade
revokes all sessions, writes SEED_CREDENTIALS_ROTATED, and marks
bootstrap_security=READY.

Runtime bootstrap still does not replace controlled production migration
practice: hosted releases need migration review, backup, explicit environment
selection, secret provisioning, and a post-deployment smoke test.

## Authentication and sessions

The application currently uses campaign credentials rather than the unused
dispatch-owned ChatGPT auth helper:

- public registration has no route;
- login names are normalized to lowercase for lookup;
- passwords use Web Crypto PBKDF2-SHA-256 with 120,000 iterations and a random
  16-byte salt;
- hash verification compares all bytes without early return;
- unknown handles still perform a dummy PBKDF2 verification to reduce account
  timing disclosure;
- known-account failure count increments atomically in D1; five consecutive
  failures lock that account for fifteen minutes;
- an additional address-plus-handle throttle covers unknown and known handles
  within a Worker isolate;
- disabled accounts, active lockouts, and expired temporary passwords are
  rejected;
- successful login resets the failure counter and updates last_login_at;
- force_password_change confines page access to Settings and rejects every
  authenticated mutation except logout and account/change-password;
- the forced-change Settings route receives a credential-only snapshot with no
  campaign modules, so the gate does not load otherwise restricted data;
- password change verifies the current passcode, requires a different confirmed
  passcode of at least twelve characters, clears temporary-password state,
  revokes every other active session, and audits PASSWORD_CHANGED;
- session tokens contain 32 random bytes; only a SHA-256 token hash is stored;
- sessions expire after twelve hours and may be revoked by logout;
- the cookie is HttpOnly, SameSite=Lax, Path=/, and Secure on HTTPS.

Every request reloads the actor and rejects a disabled User, so disabling an
account prevents continued use even if its session row remains unrevoked.

Current limitations:

- there is no GM reset/suspend mutation or session-version mechanism for those
  administrative flows;
- last_seen_at is updated, but there is no idle-expiry check;
- the address-plus-handle throttle is memory-local to one Worker isolate rather
  than durable/shared across the deployment;
- case-insensitive lookup is implemented, while the database unique index uses
  the stored login text; the creation API avoids collisions by lowercasing.

These gaps must be closed before treating authentication as production-ready.

## RBAC and resource authorization

Roles, permissions, UserRole, and RolePermission are normalized. GAME_MASTER
receives every seeded permission and is treated as a superuser by the helper
layer. ASSISTANT_GM receives selected management permissions; MODERATOR receives
manage_forum; PLAYER receives normal player behavior. Archetype remains
descriptive character metadata.

Current helpers cover the names required by the specification:
canManagePlayers, canManageProducts, canManageEconomy, canManageForum,
canManageJobs, canViewHost, canViewThread, canViewProduct, canPurchaseProduct,
canViewJob, canSendMessage, canAdjustBalance, and canGrantInventory.

The shared resource predicate checks enabled status, active/hidden state,
expiration, explicit player deny/allow lists, reputation, clearance, and
faction. Product lists and purchases use it on the server. Announcements use a
D1 query filtered by target player, faction, clearance, activation, and time.
Conversation summaries require a ConversationParticipant row.

Current access-rule limits are documented in permissions.md. In particular,
HostAccessRule and PlayerUnlock exist but are not yet evaluated, and product
rules currently enforce player allow/deny plus scalar faction/clearance/
reputation gates.

Snapshot disclosure is capability-scoped: separate flags control product,
forum, job, order, announcement, player-directory, audit, economy, and contact
administration. Non-administrative job, vendor, contact, order, and inventory
rows pass through withoutPrivateFields so gm_notes is removed before
serialization. manage_players receives the full player-administration
projection; an economy-only actor receives only player id, runner alias, and
balance for the ledger/economy surface.

## Transactional purchase and fulfilment

purchaseProduct is the completed first vertical slice:

1. Zod accepts a product id, quantity from 1 through 10, and an idempotency key.
2. The session supplies the buyer. Preview and non-Player actors are rejected.
3. D1 supplies product, vendor, current price, access rules, stock, and approval
   state. Client price, user id, balance, stock, and status are ignored.
4. The service checks visibility, current stock, and the loaded nuyen balance.
5. It chooses DELIVERED for automatic fulfilment or AWAITING GM when approval
   is required.
6. One D1 batch creates Order, OrderItem snapshot, Transaction, AuditLog, and
   Notification; it debits nuyen and finite stock, and creates InventoryEntry
   only for automatic fulfilment.
7. Runtime triggers abort the entire batch if the account would become
   negative, finite stock would become negative, or OrderItem insertion no
   longer satisfies product price/access/visibility predicates.
8. orders.idempotency_key is unique. A retry looks up and returns the existing
   order instead of charging again.

The purchase UI keeps one key for the active quantity, blocks parallel clicks,
disables the button while pending, and reuses that key if the request must be
retried.

Approval uses the same reservation policy consistently: nuyen and stock are
deducted at purchase time, inventory is withheld, approval delivers it, and
rejection refunds nuyen and restores finite stock. The terminal-order trigger
allows status change only from PENDING or AWAITING GM. Approval/rejection,
notification, refund ledger entry, inventory/stock update, and audit record are
batched.

Purchase and rejection ledger snapshots are derived from the account row after
the debit or refund statement inside the same ordered D1 batch. Direct GM
adjustment now follows the same state-local pattern: audit, nuyen ledger, and
reputation-event rows select exact before/after values inside the batch, then
balance and reputation are changed with relative updates. Balance and reputation
triggers reject negative nuyen and reputation outside -100 through 100. Concurrent
adjustments therefore cannot overwrite one another with stale absolute values.

## Matrix hosts, forum, and preview

Matrix host creation is implemented with server validation, manage_forum, and
audit. Player host/thread lists enforce active, hidden, expiration, reputation,
clearance, and faction fields. Players can open threads and reply; posting
restriction and locked-thread checks are active. Non-player author modes require
both manage_forum and send_npc_messages, so the seeded Moderator cannot
impersonate a source. AuditLog retains the real actor.

Forum moderation, reports, editing, tag/save/watch actions, host-specific
relational access rules remain planned. The current read/thread/reply permission
strings are enforced for Player operations, and reply rechecks both Host and
Thread visibility before insertion. HostAccessRule rows are not yet integrated.

Preview as Player is implemented in the Session row:

- only GM or a user with manage_players can set preview_user_id;
- the target must be an enabled Player;
- actor remains the authenticated manager while effectiveUser becomes target;
- a persistent preview bar identifies the player and provides exit;
- GM routes are rejected while preview is active;
- every implemented domain mutation begins with assertMutable and returns
  PREVIEW_READ_ONLY;
- entering and exiting writes PREVIEW_ENTERED/PREVIEW_EXITED in the same batch
  as the session context update.

## Jobs, messages, announcements, and other modules

Jobs and JobAssignment are populated and player reads apply the generic active,
hidden, expiry, reputation, clearance, and faction resource predicate. Job
application, creation, assignment, status, payment, reputation, reward, and
related-thread mutations are not implemented.

PrivateConversation, ConversationParticipant, and PrivateMessage are populated.
The inbox shows only conversations joined by the effective user, including the
latest seeded message/source and unread count. Conversation detail, send/reply,
archive, search, attachment, mute/report changes, NPC messaging, and chat-room
workflows remain planned.

Announcements are stored and read with server-side activation, date, player,
faction, and clearance filters. Authoring/dismissal mutations are planned.
Contacts, vendors, inventory, orders, ledger, and campaign settings have useful
read surfaces; their remaining full CRUD workflows are partial as listed above.

## Audit

Implemented sensitive handlers append audit rows for purchase, runner/vendor/
product/host creation, runner economic/reputation/clearance adjustment, product
visibility, order decisions, forum thread/reply creation, and preview entry/exit.
Account password change also appends PASSWORD_CHANGED.
Rows contain actor, action, target, summary, optional before/after JSON text,
timestamp, and bounded request path/user-agent metadata.

Two D1 triggers reject every UPDATE or DELETE against audit_logs, providing
database-level immutability in addition to the absence of application edit
routes. Audit state must never include plaintext passwords or session tokens.

## Security status

Implemented controls:

- prepared/bound SQL for application values;
- Zod bounds on implemented mutations;
- password and session-token hashing;
- per-account login lockout;
- server-side session, capability, and resource checks;
- atomic economic batches with database invariant triggers;
- idempotency for purchase;
- immutable audit triggers;
- JSON-only mutation requests with Sec-Fetch-Site and Origin/forwarded-host
  same-origin checks;
- React text rendering, so stored Markdown source is escaped rather than
  rendered as raw HTML;
- no-store API responses and robots no-index metadata;
- reduced-motion support and strong flicker disabled by default.

Required hardening before production:

- test and harden forwarded-host/origin handling and add a CSRF token if the
  final deployment threat model requires one;
- replace isolate-local address throttling with a durable distributed limiter;
- replace the broad multi-module CampaignSnapshot with route-specific DTOs while
  preserving the current capability-scoped projections and GM-note redaction;
- add GM password reset/suspension and their session invalidation workflows;
- add database CHECK constraints or equivalent triggers for remaining numeric
  invariants, plus rate limits for high-value mutations;
- add security headers/CSP, bounded pagination, structured secret-free logging,
  backup/restore practice, and R2 authorization when uploads arrive.

## Deployment and verification

The deployment target is a Cloudflare Worker-compatible ESM build through
Sites, with DB declared and R2 unset. The safe release order is:

1. inspect the generated migration and runtime triggers;
2. back up the target D1 database;
3. apply/verify schema in the intended environment;
4. configure an owner-only SHADOWGRID_BOOTSTRAP_PASSWORD secret before the
   first seed or v1/v2 security upgrade;
5. run seed only in an intentional demo/development database and replace the GM
   bootstrap passcode on first login;
6. keep the random-credential seed identities disabled and create or explicitly
   provision real campaign accounts;
7. run lint, strict type checking, tests, and the Vinext production build;
8. deploy through Sites;
9. verify health reports seed_version 3/security_ready, then smoke-test separate
   GM and low-clearance Player sessions.

Current tests verify starter removal, presence of core relational entities,
server-owned purchase price, D1 batch/triggers/idempotency, immutable audit
triggers, and display/reduced-motion controls. Full D1 integration tests for
bootstrap fail-closed behavior/security migration, concurrency, rollback, RBAC
denial, hidden-id access, preview mutation denial, session invalidation, and
GM-only field redaction remain required.
