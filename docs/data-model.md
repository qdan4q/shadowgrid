# ShadowGrid relational data model

## Current schema

db/schema.ts and drizzle/0000_next_mandrill.sql define **49 D1 tables**. All 49
tables are created by the runtime bootstrap and are therefore implemented as
storage. Workflow coverage differs:

- **Active**: used by a current read and mutation workflow.
- **Read-backed**: seeded and shown through an authorized read surface, but its
  requested authoring/management workflow is incomplete.
- **Schema-ready**: relational storage exists, but current services do not yet
  use the full relationship or expose a workflow.

The migration, not this document, is the executable authority.

## D1 conventions

- Primary ids are application-created text values with stable prefixes.
- Money is integer nuyen; no floating-point prices or balances are used.
- Drizzle boolean fields are stored as SQLite integers.
- Timestamps are SQLite CURRENT_TIMESTAMP text or application ISO-8601 text.
- Mutable campaign content commonly uses deleted_at for soft deletion.
- Flexible product/item metadata, contact services, message attachments, post
  edit history, settings, and audit snapshots are JSON text.
- Roles, permissions, memberships, access rules, contacts, assignments, and
  unlocks are normalized relational rows, not JSON permission blobs.
- Foreign-key delete behavior is explicit: cascade for owned joins, restrict
  for economic history, and set null for optional narrative/actor references.

The current migration relies mainly on TypeScript/Zod validation, unique keys,
foreign keys, and runtime triggers. It does not yet define CHECK constraints for
every numeric/status invariant.

## Identity, roles, and runner state

| Entity/table | Status | Important implemented fields and relationships |
| --- | --- | --- |
| **User / users** | Active | unique login_name and runner_alias; PBKDF2 hash, salt, iterations; enabled, force_password_change, temporary expiry, failure count, lockout, last login, avatar, GM notes, soft delete |
| **Role / roles** | Active | unique key, label, system flag |
| **Permission / permissions** | Active | unique key, label, description |
| **UserRole / user_roles** | Active | composite user/role primary key, grant actor/time |
| **RolePermission / role_permissions** | Active | composite role/permission primary key |
| **PlayerProfile / player_profiles** | Active | one-to-one User; faction, clearance, reputation/notoriety/awareness; posting, messaging, and purchase restriction flags |
| **CharacterProfile / character_profiles** | Active | one-to-one PlayerProfile; character name, metatype, archetype, pronouns, biography |
| **MatrixClearance / matrix_clearances** | Active | unique key and rank, configurable label/color |
| **Faction / factions** | Active | unique name/slug, summary, accent, active state, GM notes, soft delete |
| **FactionRelationship / faction_relationships** | Schema-ready | unique PlayerProfile/Faction, standing and status |
| **ReputationEvent / reputation_events** | Active | immutable-style before/after, reason, actor, timestamp |
| **AccountRestriction / account_restrictions** | Schema-ready | typed reason, start/expiry, creator, lifted time; current enforcement instead reads the three PlayerProfile restriction flags and User.enabled |
| **Session / sessions** | Active | unique hashed token, User, optional preview User, absolute expiry, last seen, created and revoked timestamps |

There is no UserPermission override table. Individual permission editing and
explicit per-user allow/deny are planned; current capability grants come through
RolePermission. There is also no session_version or idle_expires_at column.

Login lookup lowercases input, and the GM creation API stores lowercase login
names. The unique database index itself uses the stored text rather than a
separate normalized/case-insensitive column.

## Contacts, vendors, products, and access

| Entity/table | Status | Important implemented fields and relationships |
| --- | --- | --- |
| **Contact / contacts** | Read-backed | unique alias; type, portrait URL, description, faction, location, loyalty/connection, minimum gates, services JSON, channel, active/hidden, GM notes, soft delete |
| **PlayerContact / player_contacts** | Read-backed | unique PlayerProfile/Contact with relationship loyalty, connection, notes, unlock time |
| **Vendor / vendors** | Active | optional Contact operator; unique name/slug, type, authored description/address/theme, active/hidden, GM notes, soft delete |
| **ProductCategory / product_categories** | Active | unique name/slug, display order, active |
| **Product / products** | Active | unique internal id/listing code/slug; descriptions, Category, Vendor, integer price/stock, unlimited stock, condition, rarity, legality, availability/rating, reputation/clearance/faction gates, approval, hidden/featured/active, expiry, metadata, GM notes, soft delete |
| **ProductImage / product_images** | Schema-ready | Product, URL, alt text, display order; R2 is not enabled and no upload mutation exists |
| **ProductAccessRule / product_access_rules** | Active in part | Product, typed faction/User/Contact/job target and ALLOW/DENY; current policy/trigger evaluates player rules and scalar Product faction gates, not every target type |
| **PlayerUnlock / player_unlocks** | Schema-ready | User, resource type/id, reason, grant actor/time, expiry; not yet connected to visibility helpers |

Current product visibility receives player allow/deny ids aggregated from
ProductAccessRule and combines them with Product active/hidden/expiry,
reputation, clearance, and faction fields. Contact-derived and job-derived
product access remain planned.

ProductImage stores a URL rather than an R2 object key. When uploads are added,
the model should gain ownership/content-type/size metadata and keep bytes in R2.

## Economy, orders, and inventory

| Entity/table | Status | Important implemented fields and relationships |
| --- | --- | --- |
| **CurrencyAccount / currency_accounts** | Active | one account per User, currency code and integer balance |
| **Transaction / transactions** | Active | User, type, signed amount, currency, balance before/after, reason, related Order/Job, actor, timestamp |
| **Cart / carts** | Schema-ready | one Cart per User |
| **CartItem / cart_items** | Schema-ready | unique Cart/Product and quantity |
| **Order / orders** | Active | unique code and globally unique idempotency key; User, Vendor, status, integer total, GM notes, approver/time, soft delete |
| **OrderItem / order_items** | Active | Order/Product plus immutable product-name, listing-code, unit-price, quantity, and line-total snapshots |
| **InventoryItem / inventory_items** | Active | optional Product definition, name/category/description, unique-item flag, metadata |
| **InventoryEntry / inventory_entries** | Active | User ownership, InventoryItem, quantity, condition, equipped/concealed, acquisition source/date, related Order, custom fields, player/GM notes, soft delete |

There is no PurchaseIntent table. Atomicity uses a D1 batch plus database
triggers:

- currency_balance_nonnegative aborts an update that would make balance negative;
- product_stock_nonnegative aborts an update that would make finite stock
  negative;
- player_reputation_range aborts an update outside -100 through 100;
- order_item_access_guard aborts OrderItem insertion if the current product,
  price, buyer, restriction, reputation, clearance, faction, player-rule,
  visibility, or expiry check fails;
- order_terminal_guard blocks a second order decision after leaving PENDING or
  AWAITING GM.

Because D1 batch is transactional, an abort rolls back the Order, debit, stock,
item snapshot, ledger, notification, inventory, and audit writes together.
OrderItem stores the commercial snapshot so later Product edits do not rewrite
history.

Approval-required orders reserve by immediately deducting balance and finite
stock. Approval adds InventoryEntry and marks DELIVERED. Rejection restores
balance and stock, adds a REFUND Transaction, and marks REJECTED.

Current schema caveats:

- idempotency_key is globally unique, although the service treats idempotency as
  a player-scoped concept;
- balance, stock, and reputation range are protected by triggers, while positive
  quantities, total arithmetic, and ledger balance equations are validated in
  services rather than CHECK constraints;
- purchase and rejection/refund ledger rows derive balance_before and
  balance_after from the account row inside the same ordered D1 batch;
- direct GM adjustment derives AuditLog, Transaction, and ReputationEvent
  before/after values from current rows inside its ordered D1 batch, then applies
  relative balance/reputation deltas so concurrent adjustments do not overwrite
  one another.

## Matrix hosts and forum

| Entity/table | Status | Important implemented fields and relationships |
| --- | --- | --- |
| **ForumCategory / forum_categories** | Active | unique slug, name, description, order, active |
| **MatrixHost / matrix_hosts** | Active | optional Category; unique slug/address, description, icon/theme/operator/order, active/hidden, reputation/clearance floors, read/thread/reply permission strings, soft delete |
| **HostAccessRule / host_access_rules** | Schema-ready | Host plus typed Faction/User/Role target and effect; current host policy does not query these rows |
| **ForumThread / forum_threads** | Active | Host, optional author User, display mode/label, content, views, moderation flags, scalar gates, optional faction, soft delete |
| **ForumPost / forum_posts** | Active | Thread, optional author, parent post, display mode/label, Markdown source, edit-history JSON, edited/hidden/deleted state |
| **ForumTag / forum_tags** | Schema-ready | unique name/slug and color |
| **ForumThreadTag / forum_thread_tags** | Schema-ready | composite Thread/Tag primary key |
| **SavedThread / saved_threads** | Schema-ready | composite User/Thread key |
| **WatchedThread / watched_threads** | Schema-ready | composite User/Thread key |

Host creation and audited thread/reply creation are live. NPC/system/anonymous/
corporate/unknown author modes store the real acting User plus a display mode
and optional label, and require both manage_forum and send_npc_messages.
Moderator state fields exist, but moderation/report/edit/save/watch APIs are not
implemented. There is no PostReport or separate ForumPostRevision table;
edit_history is JSON text.

MatrixHost read/thread/reply permission strings are enforced for current Player
thread creation and reply, and reply rechecks both Host and Thread visibility.
HostAccessRule rows still need service integration.

## Jobs

| Entity/table | Status | Important implemented fields and relationships |
| --- | --- | --- |
| **Job / jobs** | Read-backed | title, Johnson alias, fixer Contact, briefings, location/danger, integer payment/advance, reputation/clearance/faction gates, capacity/deadlines/date/status, hidden, GM notes, soft delete |
| **JobAssignment / job_assignments** | Read-backed | unique Job/User, status, assigned/completed timestamps |

Eight coherent jobs and two assignments are seeded. Server reads apply generic
visibility gates. There are no authoring, application, assignment, payment,
reward, attachment, or job-specific player allowlist mutations yet. JobAccessRule,
JobAttachment, and JobReward tables are not present.

## Messages, chat, announcements, and notifications

| Entity/table | Status | Important implemented fields and relationships |
| --- | --- | --- |
| **PrivateConversation / private_conversations** | Read-backed | subject, archive state, creator, soft delete |
| **ConversationParticipant / conversation_participants** | Active for reads | composite Conversation/User; unread count, muted, archive time |
| **PrivateMessage / private_messages** | Read-backed | Conversation, optional sender, source identity/label, Markdown body, attachments JSON, timestamp, soft delete |
| **ChatRoom / chat_rooms** | Schema-ready | unique name/slug, clearance/faction gate, active |
| **ChatMessage / chat_messages** | Schema-ready | Room, optional sender, body, timestamp, soft delete |
| **Announcement / announcements** | Read-backed | title/body/severity/source, faction or target User, clearance floor, start/expiry, dismissible/pinned/active, creator, soft delete |
| **Notification / notifications** | Active | recipient User, type, title/body, related resource, read time, timestamp |

Conversation summaries are selected only through ConversationParticipant and
show the latest seeded message/source. Full message reads and all message/chat
mutations are planned. Attachments are JSON metadata only; no R2 object flow is
implemented.

Announcement reads enforce active state, dates, target User, faction, and
clearance. Authoring and dismissal are planned. Notifications are created by
purchase and order-decision flows, but notification read/dismiss mutation is
not yet present.

## Campaign settings and audit

| Entity/table | Status | Important implemented fields and relationships |
| --- | --- | --- |
| **CampaignSetting / campaign_settings** | Active for bootstrap/read | unique key, typed value text, updater; holds campaign name/time, seed version, accounting marker, and bootstrap-security state |
| **AuditLog / audit_logs** | Active | actor, action, target type/id, summary, before/after JSON text, request metadata, timestamp |

AuditLog is database-immutable: audit_logs_immutable_update and
audit_logs_immutable_delete abort any attempted change. Current sensitive
services insert audit rows inside their D1 batch. Passwords and raw session
tokens are not placed in audit state.

## Relationship summary

- User has Roles through UserRole, permissions through RolePermission, an
  optional PlayerProfile/CharacterProfile, Sessions, Restrictions, Orders,
  Transactions, InventoryEntries, Unlocks, forum authorship, conversations,
  notifications, and audit actions.
- PlayerProfile belongs to MatrixClearance and optionally Faction, with faction
  and contact relationship rows plus reputation history.
- Contact may operate a Vendor; Vendor owns Products and receives Orders.
- Product belongs to ProductCategory and Vendor, has access/image rows, maps to
  InventoryItem, and is snapshotted into OrderItem.
- Order belongs to User and Vendor and contains OrderItems; Transactions and
  InventoryEntries reference it.
- MatrixHost optionally references ForumCategory and owns ForumThreads;
  ForumThread owns ForumPosts and joins tags/saved/watched users.
- Job may use a fixer Contact and has User assignments.
- PrivateConversation joins Users through ConversationParticipant and owns
  PrivateMessages.

## Indexes and deletion behavior

The migration includes targeted indexes/uniques for:

- User login, alias, and enabled state;
- Session token, User, and expiry;
- Player/faction and Player/contact uniqueness;
- Product visibility/access/vendor;
- one Cart per User and one Product per Cart;
- one Job assignment per Job/User;
- Order User/status, order code, and idempotency key;
- Inventory User;
- Host slug/address and Thread host/pinned/update order;
- tag, saved, and watched uniqueness;
- CampaignSetting key;
- Audit actor and creation time.

Financial foreign keys use restrict where deletion would erase ownership
history. Owned joins commonly cascade. Optional actor/contact/faction links use
set null. Mutable campaign entities use active/hidden flags and soft deletion;
orders, transactions, reputation events, and audit history should be retained.

The current User cascade into CurrencyAccount and InventoryEntry means physical
User deletion would remove authoritative state. Application policy must continue
to disable/soft-delete users rather than physically deleting them; a future
migration should harden this if account purge is ever exposed.

## Seed data

db/seed.ts is idempotent through campaign_settings.seed_version. It provides:

- GAME_MASTER, ASSISTANT_GM, MODERATOR, and PLAYER roles;
- ten permission definitions and seeded RolePermission mappings;
- six configurable clearance levels;
- one GM, one Assistant GM, and six populated runner accounts;
- four factions, six contacts, four vendors, nineteen categories, thirty
  original fictional products, and a player-specific product access rule;
- six Matrix hosts, twelve threads, seeded replies, eight jobs, assignments,
  two private conversations/messages, and three announcements;
- delivered and approval-pending orders, inventory, ledger, and audit history.

Seed initialization requires an owner-provided SHADOWGRID_BOOTSTRAP_PASSWORD of
12 through 128 characters. db/seed.ts contains no plaintext account passwords,
and the bootstrap secret is stored only through independently salted password
hashes. Without a valid secret, bootstrap records
bootstrap_security=OWNER_SECRET_REQUIRED and does not create a fresh seed;
authentication also requires seed_version=3.

On a fresh v3 seed, only user-gm is enabled and receives the owner-secret hash.
It has force_password_change=1. user-agm and every seeded Player receive unique
random, undisclosed hashes and enabled=0. On a v1/v2 upgrade, user-gm and
user-agm and every fixed seed Player are also rotated unconditionally. The GM
receives the owner secret and remains enabled; every other fixed identity is
assigned a unique random unusable hash and disabled. PASSWORD_CHANGED history
does not exempt a fixed seed id from this v3 security migration. Security v3
revokes every active Session, records an immutable SEED_CREDENTIALS_ROTATED
event, writes bootstrap_security=READY, and advances seed_version to 3.

The separate seed_accounting_v2 marker applies the old accounting correction
once before security v3. The approval-pending order has matching reserved nuyen,
reduced stock, and a PURCHASE ledger row, while the delivered seed order also
consumes its finite stock.

## Planned model hardening

Before full-spec completion:

- add per-user permission overrides or a normalized equivalent;
- add explicit schemas for post reports/revisions, job access/attachments/
  rewards, message attachments/reports, chat access rules, and announcement
  multi-target/dismissal state;
- connect existing HostAccessRule, PlayerUnlock, FactionRelationship,
  AccountRestriction, Cart, ProductImage, tags, saved/watched, chat, and
  attachment metadata to services;
- add database CHECK constraints for boolean/status/range/arithmetic invariants;
- move upload bytes to R2 and retain only relational metadata in D1;
- add migrations that evolve existing databases instead of relying on initial
  CREATE IF NOT EXISTS bootstrap.
