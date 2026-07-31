# ShadowGrid permissions and authorization

## Current status

ShadowGrid has app-owned authentication, server-loaded roles/permissions,
server-side GM route gates, player resource filters, mutation guards, and
read-only Preview as Player. Those controls cover the implemented vertical
slice.

The full specification is not yet complete. Per-user permission editing,
AccountRestriction integration, relational HostAccessRule integration, forum
moderation, job mutations, messaging mutations, and several GM administration
actions remain planned.

## Security principals

ViewerContext keeps three concepts separate:

- **actor**: the authenticated CampaignUser responsible for the request;
- **effectiveUser**: normally actor, or the selected Player during preview;
- **isPreview**: true when those ids differ.

An in-world author label is display data only. NPC, anonymous, system, corporate
relay, and unknown-source posts retain actor_user_id and write an audit event.
The browser never supplies the authoritative actor, effective user, role,
balance, price, or session.

## Authentication gate

Public registration is disabled because no registration route exists. Accounts
are created by an authorized GM action.

Current login behavior:

1. Initialize schema/seed state and reject authentication with 503 unless
   campaign_settings.seed_version is 3.
2. Normalize the supplied login name to lowercase.
3. Select a non-deleted User by case-insensitive login.
4. Reject disabled accounts, active lockouts, and expired temporary passwords.
5. Verify PBKDF2-SHA-256 using the stored salt and iteration count; an unknown
   handle performs a dummy PBKDF2 check before returning the generic rejection.
6. Atomically increment failed_login_count in D1; the fifth failure sets
   locked_until fifteen minutes ahead.
7. Record failures in an address-plus-handle in-memory throttle for both known
   and unknown handles; its fifth failure also locks that key for fifteen
   minutes within the current Worker isolate.
8. On success, clear failures, update last_login_at, create a random session,
   and store only its SHA-256 token hash.
9. Set shadowgrid_session as HttpOnly, SameSite=Lax, Path=/, twelve-hour Max-Age,
   and Secure when the request uses HTTPS.
10. When force_password_change is set, page routing is confined to Settings and
   API routing rejects every command except logout and account/change-password.
11. The forced-change page receives a credential-only snapshot with empty
   campaign collections rather than loading the regular multi-module snapshot.
12. Password change verifies the current passcode, requires a different
   confirmed passcode of at least twelve characters, installs a new salt/hash,
   clears temporary-password state, revokes every other active Session, and
   audits PASSWORD_CHANGED.

Each protected page and API action loads an unrevoked, unexpired Session and
then reloads the User. A disabled User is rejected even if a session row still
exists. Logout sets revoked_at and clears the cookie.

Implemented limitations:

- there is no password-reset or suspension mutation;
- last_seen_at is recorded without idle expiry;
- no session_version exists for bulk invalidation after reset/role changes;
- the address-plus-handle throttle is isolate-local and is not a durable,
  deployment-wide network limiter;
- mutation defense has no independent CSRF nonce/token. It relies on
  SameSite=Lax plus JSON-only requests, Sec-Fetch-Site, and Origin/host checks;
  requests with no Origin are accepted when Sec-Fetch-Site is absent or allowed.

Bootstrap authentication is fail-closed. SHADOWGRID_BOOTSTRAP_PASSWORD is
required to create a fresh seed or upgrade v1/v2 security state; without it,
seed_version remains below 3, current seed sessions are revoked, and both login
and cookie-session resolution reject access. The source contains no default
password. Security v3 unconditionally rotates every fixed seed identity, assigns
the owner secret only to enabled user-gm, assigns unique random unknown hashes to
disabled user-agm and fixed seed Players, forces GM credential change, and
revokes all existing sessions. The owner secret must remain owner-only.

## Implemented roles and permissions

Permissions are normalized through RolePermission. The current stable keys are:

| Key | Current use |
| --- | --- |
| manage_players | create runner, enter preview, full player projection/routes; required for adjustment |
| manage_products | create vendor/product, hide/reveal product, product/vendor routes |
| manage_economy | global ledger, narrow id/alias/balance projection, economy route; required for adjustment |
| manage_forum | create host, create/moderate board content, board/host GM routes |
| manage_jobs | GM jobs route; job mutations are not implemented |
| manage_orders | approve/reject order |
| send_npc_messages | required with manage_forum for NPC/non-player forum authorship; private message send is not implemented |
| manage_announcements | seeded role grant only; no announcement mutation |
| view_audit | audit route and audit read |
| manage_settings | seeded role grant only; no setting mutation |

Seeded role grants:

| Role | Effective grants |
| --- | --- |
| GAME_MASTER | Superuser behavior plus every permission row |
| ASSISTANT_GM | products, forum, jobs, orders, NPC messages, announcements, audit |
| MODERATOR | manage_forum |
| PLAYER | no management permission; player behavior comes from authenticated ownership/resource policy |

Archetypes such as DECKER, SHAMAN, or STREET SAMURAI never grant access.

There is no UserPermission table or mutation. Assistant GM permissions are
therefore configurable in the database through role mappings, not individually
through the current UI.

## Management helpers

lib/permissions.ts implements:

- canManagePlayers: GAME_MASTER or manage_players;
- canManageProducts: GAME_MASTER or manage_products;
- canManageEconomy and canAdjustBalance: GAME_MASTER or manage_economy;
- canManageForum: GAME_MASTER or manage_forum;
- canManageJobs: GAME_MASTER or manage_jobs;
- canManageOrders: GAME_MASTER or manage_orders;
- canSendNpcMessages: GAME_MASTER or send_npc_messages;
- canManageAnnouncements: GAME_MASTER or manage_announcements;
- canManageSettings: GAME_MASTER or manage_settings;
- canViewAudit: GAME_MASTER or view_audit;
- canGrantInventory: GAME_MASTER or manage_economy;
- canSendMessage: sender/recipient enabled and sender not messaging-restricted;
- canPost: enabled and not posting-restricted.

lib/campaign.ts additionally checks manage_orders directly for order decisions
and requires both manage_players and manage_economy for the combined nuyen,
reputation, and clearance adjustment. It also exposes canOpenGmRoute. Every
implemented mutation calls assertMutable before its capability check, so preview
cannot mutate.

### GM route mapping

Current explicit route checks are:

- /gm/players and /gm/characters require manage_players;
- /gm/products and /gm/vendors require manage_products;
- /gm/jobs requires manage_jobs;
- /gm/hosts requires manage_forum;
- /gm/board requires manage_forum plus send_npc_messages;
- /gm/orders requires manage_orders;
- /gm/inventories requires manage_players or manage_economy;
- /gm/messages requires send_npc_messages;
- /gm/announcements requires manage_announcements;
- /gm/settings requires manage_settings;
- /gm/contacts is GM-only;
- /gm/economy requires manage_economy;
- /gm/audit requires view_audit.

GAME_MASTER may open every GM route. /gm itself is available to a non-GM only
when isGmSurface finds a management permission or view_audit. Unknown GM routes
deny rather than falling through.

## Resource policy

The common AccessResource predicate evaluates in this order:

1. User must be enabled.
2. GAME_MASTER in normal GM context bypasses resource gates.
3. active=false or hidden=true denies.
4. an expired expiresAt denies.
5. a matching player deny denies.
6. when a player allow list exists, the User must match it.
7. street reputation and clearance rank must meet the minimums.
8. a scalar faction id must match the User faction.

Direct allow does not override hidden state or scalar gates. The helper returns
a boolean, not a decision/reason object.

Implemented resource helpers are canViewHost, canViewThread, canViewProduct,
canPurchaseProduct, and canViewJob. canPurchaseProduct adds the
purchasingRestricted check. Stock and balance are not authorization facts; the
purchase service and D1 triggers validate them.

### Product visibility and purchase

Product reads aggregate player-specific ALLOW and DENY rows, then apply:

- Product active, hidden, deleted, and expiry state;
- minimum reputation and clearance;
- scalar Product faction;
- player allow/deny list.

GM surfaces receive hidden/inactive products. Player market/detail rendering
receives only the server-filtered product array. purchaseProduct reloads the
Product and rules by id, rechecks canPurchaseProduct, and takes price from D1.
The OrderItem trigger repeats buyer/product/price/visibility/restriction/
reputation/clearance/faction/player-rule checks inside the atomic batch.

Contact, job, or PlayerUnlock-based product access fields exist in the schema
but are not evaluated yet. ProductAccessRule DENY/ALLOW behavior is currently
reliable only for player-targeted rules. A hidden Product cannot yet be revealed
to one selected player through PlayerUnlock.

The purchase button keeps one key for the selected quantity, blocks parallel
clicks, disables while pending, and reuses the key after a request error. This
complements the server's unique idempotency constraint.

After the atomic debit, the PURCHASE Transaction selects balance + total and
balance from the updated CurrencyAccount row in that same D1 batch. Rejection
uses the corresponding post-refund balance - total and balance derivation, so
both ledger snapshots describe the committed transition rather than a stale
viewer snapshot.

### Host and thread visibility

The server filters MatrixHost rows by active/hidden state, reputation,
clearance, and faction-shaped fields. Thread rows must belong to a visible Host,
then pass hidden/reputation/clearance/faction checks. Hidden Posts are omitted
from player snapshots.

HostAccessRule, allowed roles/players/factions, PlayerUnlock, and MatrixHost
relational rules are not queried by current policy. The Host
read_permission/thread_permission/reply_permission strings are checked against
Player-capable values on read/create/reply. Thread creation rechecks Host
visibility and posting restriction. Non-player author modes require both
manage_forum and send_npc_messages.

Reply validates session, preview, posting restriction, thread/Host existence,
locked state, Host read/reply permission strings, Host visibility, and Thread
visibility before insertion. A known restricted thread id therefore does not
bypass the reply gate. HostAccessRule rows and typed role/faction/player grants
remain outside the current helper.

### Jobs

Job reads apply active/hidden/expiry/reputation/clearance/faction through the
generic resource helper. Current rows do not have player allow/deny aggregation,
and there is no JobAccessRule table. Application, assignment, status, reward,
and payment mutations are not live.

### Messages and announcements

Conversation summaries join ConversationParticipant on effectiveUser.id, so a
player receives only conversations they participate in. The current UI does not
load a complete conversation or expose send/reply/archive/mute/report actions.
canSendMessage exists but is not used by a mutation.

Announcement reads are filtered in SQL by active/soft-delete state, start/end
time, target User, faction, and clearance. Authoring/dismissal is not live.

### GM-only fields and response scope

ProductView explicitly projects player-safe fields. Jobs, vendors, contacts,
orders, and inventory rows pass through withoutPrivateFields for
non-administrative readers, removing gm_notes before serialization.

The snapshot calculates separate capability flags for product, forum, job,
order, announcement, player-directory, audit, economy, and contact
administration. manage_players receives the full player directory. An actor with
manage_economy but not manage_players receives only player id, runner alias, and
balance; login name, status, password-change flag, activity, character, faction,
reputation, restrictions, clearance, and role memberships remain absent.
Assistant GM/Moderator users receive other elevated rows only for their assigned
domain; all-order views, global ledger, audit, and hidden resources are not
unlocked by an unrelated permission.

This is one multi-module snapshot rather than route-specific DTOs, so future
work should split the query/response by route while preserving the current
capability projections and redaction.

## Restriction overlay

The active implementation uses:

- User.enabled for login/access disablement;
- PlayerProfile.posting_restricted for both new threads and replies;
- PlayerProfile.messaging_restricted in canSendMessage;
- PlayerProfile.purchasing_restricted in canPurchaseProduct and the D1 purchase
  trigger.

AccountRestriction rows support typed start/expiry/lift records but are not
consulted. Independent new-thread restriction and per-host block are not
implemented. Current restrictions have no GM mutation UI.

## Preview as Player

Preview is implemented and read-only:

1. GM or manage_players submits a Player id to /api/gm/preview.
2. setPreviewUser verifies the target exists, is enabled, and has PLAYER role.
3. sessions.preview_user_id is updated; PREVIEW_ENTERED is inserted in the same
   D1 batch.
4. Subsequent requests retain actor but load the target as effectiveUser.
5. The snapshot uses player visibility, GM routes redirect to access denied,
   mutating controls disappear, and every implemented domain mutation rejects
   with PREVIEW_READ_ONLY.
6. A persistent warning bar exposes an always-available exit.
7. Exit clears preview_user_id and writes PREVIEW_EXITED in one batch.

Preview does not send posts, purchases, or other actions as the Player. Session
expiry/logout also ends its use because preview state belongs to that Session.

## Audit policy

Current handlers audit:

- PURCHASE_COMPLETED;
- PLAYER_CREATED and PLAYER_ADJUSTED;
- VENDOR_CREATED and PRODUCT_CREATED;
- PRODUCT_HIDDEN or PRODUCT_REVEALED;
- ORDER_APPROVED or ORDER_REJECTED;
- HOST_CREATED;
- THREAD_CREATED, NPC_THREAD_CREATED, and FORUM_REPLY_CREATED;
- PREVIEW_ENTERED and PREVIEW_EXITED;
- PASSWORD_CHANGED.

Audit rows store actor, action, target type/id, summary, optional before/after
JSON text, timestamp, and request path plus a truncated user-agent. Passwords
and raw session tokens are not included. Database triggers reject UPDATE and
DELETE for every AuditLog row.

Actions not implemented cannot yet be audited: password reset, suspension,
role/permission change, product edit/delete beyond visibility, item grant/remove,
forum moderation, job assignment/reward, NPC private message, announcement
authoring, and campaign setting change.

GM account adjustment requires both player and economy capabilities. Its ordered
D1 batch selects current balance/reputation/clearance into AuditLog,
Transaction, and ReputationEvent snapshots before applying relative updates.
The nonnegative-balance and reputation-range triggers are authoritative, and a
post-batch read returns committed state. Concurrent adjustments therefore retain
both deltas and accurate per-transition history. Purchase and order
rejection/refund likewise derive their ledger state inside ordered batches.

## Errors and route behavior

- Unauthenticated pages redirect to /login; unauthenticated API actions return
  401.
- Explicit GM capability failures and preview mutations return 403.
- Invalid implemented mutation input returns 422.
- non-JSON mutation requests return 415; cross-site or mismatched-origin requests
  return 403 before the domain handler runs;
- stale funds/stock/order state generally returns 409;
- unknown actions/resources return 404 where handled;
- successful and failed API responses use Cache-Control: no-store.

Hidden-resource behavior is not fully uniform: some access failures return 403
rather than indistinguishable 404. The JSON/Sec-Fetch/Origin defense needs
deployment-level proxy-header verification and security tests; a separate CSRF
token and generalized mutation rate limits remain potential hardening.

## Required completion tests

The current test file is structural: it checks the gateway copy, core schema
exports, server-owned price, D1 batch/triggers/idempotency, immutable audit
triggers, and effect/reduced-motion controls. It does not execute D1 integration
flows.

Before production, integration tests must prove:

- missing/invalid bootstrap secret leaves seed_version below 3 and rejects both
  login and existing-cookie resolution, while a valid owner secret enables only
  the seeded GM and never appears in stored plaintext;
- v1/v2 security upgrade unconditionally rotates every fixed seed id, gives only
  user-gm the owner secret and enabled state, randomizes/disables user-agm and
  fixed seed Players regardless of PASSWORD_CHANGED history, and revokes every
  existing session;
- GM succeeds and Player/Moderator/under-permissioned Assistant GM fail each GM
  action and data query;
- disabled, locked, expired-temporary-password, and revoked sessions fail;
- atomic known-account and isolate-local address/handle throttles behave at the
  five-attempt boundary, including parallel and unknown-handle attempts;
- non-JSON, cross-site Sec-Fetch-Site, and mismatched Origin requests are
  rejected while legitimate proxied same-origin requests pass;
- forced password change confines access, verifies the old passcode, clears the
  flag, and revokes other sessions; GM reset invalidation remains planned;
- product list, detail, and purchase agree for clearance, reputation, faction,
  hidden, expired, allow, and deny cases;
- insufficient funds/stock and changed access roll back every purchase write;
- repeated idempotency keys cannot charge twice;
- rapid duplicate UI confirmation is suppressed and reuses one idempotency key;
- concurrent same-account purchases produce accurate ledger snapshots;
- concurrent GM adjustments retain every relative delta and exact audit, ledger,
  and reputation-event transitions;
- approval and rejection deliver or refund/restore exactly once;
- restricted thread ids cannot be used for create/reply;
- Moderator cannot select NPC/system/corporate/unknown identities without the
  dedicated impersonation grant;
- player payloads contain no gm_notes, password, session, audit, or unrelated
  player/economy data;
- preview cannot perform any mutation and records enter/exit events;
- message, job, moderation, announcement, and permission workflows gain
  equivalent tests as they are implemented.
