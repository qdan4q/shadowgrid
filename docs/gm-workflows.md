# Game Master Workflows

This guide defines the expected Game Master behavior for ShadowGrid. It is an
operational and acceptance contract: labels may evolve, but authorization,
validation, transactional integrity, and audit behavior must remain equivalent.

## Operating rules

- Every GM page requires an authenticated, enabled account.
- Access to a control is not proof of permission. Every read and mutation is
  authorized again on the server.
- A Game Master has full campaign access. Assistant Game Masters receive only
  explicitly assigned permissions. Moderator permissions never imply access to
  accounts, inventory, or the economy.
- The server is authoritative for balances, stock, access rules, order state,
  reputation, clearance, and inventory.
- Every sensitive mutation records an immutable audit event only after the
  authoritative operation succeeds.
- Browser storage may retain device-local display preferences only. Campaign
  records, sessions, audits, and financial state must use server-side storage.
- Failure responses must not reveal whether a hidden player, host, product, job,
  or conversation exists.

## 1. Sign in to the control host

1. Open `/login`.
2. Enter the assigned login name and password.
3. Submit the Matrix host handshake.
4. The server throttles repeated attempts, verifies the password hash, checks
   account status and expiry, and creates a server-side session.
5. If a password change is required, complete it before any campaign route is
   available.
6. An authorized GM lands on `/gm`; other roles return to their permitted
   player surface.

Expected failures:

- Invalid credentials return one neutral message without identifying which
  field was wrong.
- Disabled, expired, or suspended accounts receive a restricted-account state
  and no session.
- A stale or revoked session redirects to login without exposing protected
  content.
- A valid non-GM session receives `/access-denied` when requesting `/gm`.

Audit expectations:

- Successful sign-in and sign-out may be security events.
- Failed attempts should be rate-limit/security events without storing
  plaintext credentials.
- Suspension, password reset, role changes, and session invalidation are
  mandatory audit events.

## 2. Create a runner account

Required permission: `manage_players`.

1. From `/gm/players`, choose **Create runner**.
2. Enter the login name, runner alias, temporary password, player role,
   character name, metatype, archetype, faction, starting nuyen, starting
   reputation, Matrix clearance, account status, and internal GM notes.
3. Choose whether the player must change the temporary password at first login.
4. Review the generated access summary. Archetype is descriptive and must not
   grant permissions.
5. Submit once.
6. In one authoritative operation, the server creates the user and player
   profile, stores only a password hash, assigns roles/factions/clearance,
   creates the currency account, writes the opening ledger entry when starting
   nuyen is nonzero, and records the audit event.
7. Show a success summary containing the runner alias, status, role, clearance,
   and next action. Never redisplay the temporary password after leaving the
   confirmation state.

Validation:

- Login name and runner alias are trimmed, length-bounded, and unique according
  to the application normalization rules.
- Password policy is explained before submit and enforced on the server.
- Role, faction, metatype, archetype, and clearance must be active allowed
  records—not arbitrary browser values.
- Starting nuyen and reputation must be finite integers within configured
  campaign limits.
- Avatar uploads, when enabled, require allowed type and size checks and safe
  storage.
- GM notes are never included in a player response.

Failure behavior:

- Duplicate login or alias highlights the relevant field without clearing
  unrelated input.
- Invalid references, insufficient GM permission, or a concurrent duplicate
  return a clear error and create no partial account.
- If any write fails, the entire creation operation rolls back.
- Repeated submission with the same idempotency token must not create a second
  user or opening balance.

Audit event:

- Action: player created.
- Include actor, new player identifier, role/faction/clearance assignments,
  opening balance and reputation, status, timestamp, and request metadata.
- Exclude passwords, session tokens, and private authentication material.

## 3. Manage a runner

Open `/gm/players/[playerId]` and use the relevant tab. Every change requires
a reason when it affects access, reputation, nuyen, inventory, or moderation.

### Account, roles, and permissions

1. Review the current value and effective permissions.
2. Edit the account or explicit role/permission assignments.
3. Confirm the before-and-after summary.
4. The server rejects unknown permissions and prevents an Assistant GM from
   granting capabilities they do not possess.
5. Save, refresh effective authorization, and invalidate sessions when access
   has been reduced.

### Suspend or restrict a player

1. Choose **Suspend account** or edit individual restrictions.
2. Select independent restrictions: login, posting, thread creation, messaging,
   purchasing, or selected host access.
3. Enter a reason and optional expiration.
4. Confirm the affected capabilities.
5. The server stores the restrictions and invalidates active sessions when
   login is disabled.

A restriction must be enforced at the server operation, not only by hiding a
button. Existing content and immutable financial history remain intact.

### Reset a password

1. Generate or enter a temporary password that satisfies policy.
2. Set an optional expiry and require a change at next sign-in.
3. Confirm the reset.
4. Store only the new hash and invalidate all existing sessions.
5. Display the temporary value once through an appropriately private handoff.

### Adjust nuyen

Required permission: `manage_economy`.

1. Open **Transactions** or choose **Adjust nuyen**.
2. Enter a signed amount, an allowed transaction type, and a required reason.
3. Review the current and projected balance.
4. Confirm.
5. In one database transaction, lock or otherwise protect the currency account,
   re-read the balance, reject a forbidden negative result, update the balance,
   append an immutable ledger entry, and append the audit event.
6. Show the committed balance and ledger reference.

Editing or deleting a historical ledger row is not a correction mechanism. Use
a new compensating entry.

### Adjust reputation or clearance

1. Select the new value or enter the adjustment and reason.
2. Review access that may be gained or lost.
3. Confirm.
4. Store a reputation event or clearance change containing before and after
   values.
5. Re-evaluate host, product, job, contact, and messaging access on subsequent
   server requests.

### Grant or remove inventory

Required permission: `manage_inventory`.

1. Choose an existing product/item or create a unique campaign item.
2. Enter quantity, condition, acquisition source, visibility, and story notes.
3. Keep GM-only notes separate from player-visible notes.
4. Confirm.
5. The server validates positive quantity and ownership, changes inventory
   atomically, and records an audit event.

Removing an item must not delete an order or ledger record that explains its
origin.

## 4. Create a fixer and restricted product

Required permissions: `manage_contacts` or `manage_vendors`, plus
`manage_products`.

### Create the fixer/vendor

1. Open `/gm/contacts` or `/gm/vendors`.
2. Enter an original identity, type, description, faction, location,
   communication channel, relationship thresholds, active/hidden state, and
   GM notes.
3. Define visibility by player, faction, reputation, clearance, contact
   relationship, or completed job.
4. Save and preview the public-facing profile.
5. The server stores relational access rules and logs creation.

### Create and publish the listing

1. Open `/gm/products/new`.
2. Complete Identification, Description, Category, Vendor, Price, Stock,
   Legality, Availability, Access Rules, Media, Custom Attributes, Publishing,
   and GM Notes.
3. Assign the fixer/vendor.
4. Set a restricted rule such as minimum clearance plus selected-player
   access. Multiple rule semantics—whether all or any must match—must be stated
   clearly in the form and evaluated identically on the server.
5. Choose whether the order requires GM approval.
6. Review a visibility summary and publishing window.
7. Save as hidden/inactive or publish as active.
8. Confirm by using preview mode for both an allowed and a denied player.

Validation:

- Listing code and slug are unique; price is a nonnegative integer.
- Stock is a nonnegative integer unless unlimited stock is enabled.
- Vendor, category, faction, player, contact, and job references must exist.
- Expiration must be after the visibility start time.
- Media is type/size validated and rendered with useful alternative text.
- Browser-supplied prices, stock, visibility results, and vendor identity are
  ignored during purchase authorization.

Audit expectations:

- Creation, price/stock changes, access-rule changes, hide/reveal,
  activation/deactivation, duplication, and deletion/soft deletion are logged.
- Before and after states include relevant fields but omit GM secrets not
  necessary for audit review.

## 5. Review and process orders

Required permission: `manage_orders`.

1. Open `/gm/orders`; filter by status, player, vendor, or date.
2. Open an order and review the immutable purchase snapshot: item, unit price,
   quantity, totals, access decision, ledger reference, and current fulfillment
   state.
3. Choose only a valid next status.
4. For approval, optionally add delivery instructions and mark inventory
   delivery when the product workflow requires it.
5. For rejection or cancellation, enter a reason and confirm the refund policy.
6. If a refund is due, append a compensating ledger entry and restore stock
   according to campaign rules within the same transaction as the status
   change.
7. Notify the player after commit.

Concurrency and error expectations:

- Status transitions use a current-version or current-status condition so two
  reviewers cannot process the same order twice.
- Duplicate clicks are idempotent.
- A failed refund, stock restoration, inventory grant, or status update rolls
  back the full operation.
- Errors preserve the last committed state and offer a safe retry; they do not
  imply success before commit.

Order approval, rejection, refund, cancellation, delivery, and seizure are
audited with actor, prior and new status, reason, and related ledger entries.

## 6. Operate Matrix hosts and the Shadow Board

Required permission: `manage_forum`; moderation actions may instead use the
bounded Moderator role.

1. Create a host with name, slug, node address, theme, operator, display order,
   active/hidden state, and access rules.
2. Configure read, create-thread, and reply permissions independently.
3. Validate the host with an allowed and denied identity before revealing it.
4. Create a thread as GM, system, an explicit NPC identity, corporate relay, or
   unknown source.
5. Use Markdown only; sanitize output and never allow unsafe raw HTML.
6. Pin, lock, move, hide, restore, or archive content as permitted.
7. Require a moderation reason for destructive or access-changing actions.

Hidden-host and hidden-thread responses must not leak titles, authors, counts,
tags, or node addresses. Moderation keeps edit history and uses soft deletion.
Host access changes, NPC posts/messages, and all moderation actions are audited.

## 7. Create jobs, announcements, and NPC messages

### Job

1. Enter briefing data, Johnson/fixer, danger, payment, requirements,
   participants, dates, attachments, visibility, status, and GM-only notes.
2. Save as rumored/classified or reveal to the selected audience.
3. Assign accepted players and update the status through valid transitions.
4. Issue advances, payment, items, and reputation through authoritative
   economy/inventory workflows, not by editing displayed totals.
5. Link related threads and messages after the job commit succeeds.

### Announcement

1. Choose source identity, severity, audience, clearance, start/expiry,
   dismissible state, and pinned state.
2. Preview the rendered announcement and accessible severity label.
3. Publish. Only authorized targets receive it in the feed.

### NPC or system message

1. Explicitly select **Send as** and the NPC/system identity.
2. Confirm the audience and sender before submit.
3. Store the real acting GM separately from the fictional displayed sender.
4. Log the action as NPC impersonation and create notifications after commit.

## 8. Preview as player

Preview is a read-only authorization diagnostic, not impersonation.

1. From a player record, choose **Preview as player**.
2. Confirm the selected alias and the purpose of the preview.
3. The server records a preview-start audit event and retains the GM session.
4. A persistent warning bar states the selected player, explains that writes
   are disabled, and provides **Exit preview** on every page.
5. The application calculates read visibility using the selected player's
   roles, factions, clearance, reputation, contacts, unlocks, restrictions, and
   campaign time.
6. Inspect product, forum, host, job, contact, announcement, inventory, and
   balance visibility.
7. Exit preview. The server clears preview context and records a preview-end
   event.

Safety requirements:

- Preview context is stored server-side and bound to the GM session; a client
  cannot submit an arbitrary player identifier to gain data.
- GM controls are unavailable during preview.
- Posting, replying, purchasing, messaging, applying for jobs, changing
  settings, and all other player writes are blocked server-side.
- Preview requests never create notifications, views, read receipts, carts,
  drafts, or transactions on behalf of the player.
- The warning remains visible and understandable without relying on color.
- Expired/deleted target players end preview safely.
- Session expiry, logout, or account suspension also clears preview.
- Opening a normal GM route must either require exiting preview or provide an
  explicit, audited exit—never silently combine contexts.

## 9. Error and audit contract

| Operation | Failure must leave unchanged | Required audit after success |
| --- | --- | --- |
| Create player | User, profile, roles, currency account | Player created |
| Suspend player | Restrictions and active sessions | Player suspended/restricted |
| Reset password | Password hash and sessions | Password reset |
| Adjust balance | Balance and ledger | Balance changed |
| Adjust reputation/clearance | Value and access state | Before/after change |
| Grant/remove item | Inventory quantity and ownership | Item granted/removed |
| Edit product | Product, stock, price, access rules | Product edited/hidden/revealed |
| Process order | Status, refund, stock, inventory | Status action and refund |
| Moderate post | Visibility, lock/pin state, edit history | Moderation action |
| Assign/pay job | Assignment, balance, reputation, rewards | Job/reward action |
| Send as NPC | Conversation and notification | Real actor and displayed sender |
| Enter/exit preview | Preview session context | Preview started/ended |

Audit records contain actor, action, target type/id, human-readable summary,
before state, after state, timestamp, and optional request metadata. They are
append-only through the normal application. Secrets, password hashes, tokens,
attachment bodies, and unnecessary private message content are excluded.

## 10. Accessibility and responsive operation

- Every GM task is fully operable by keyboard with visible focus and correctly
  associated labels, descriptions, and field errors.
- Confirmation dialogs move focus inside, identify the affected record and
  consequence, support Escape when cancellation is safe, and return focus to
  the trigger.
- Tables use semantic headers. On narrow screens, each transformed record keeps
  field labels rather than presenting unlabeled values.
- Status, severity, permission, and before/after changes use text or icons with
  accessible names in addition to color.
- Validation is summarized at the top and linked to invalid fields; entered
  values survive recoverable errors.
- Long lists support search, filters, sorting, pagination, loading, empty, and
  permission-denied states.
- Desktop keeps the left control-host navigation and dense tables. Tablet uses
  collapsible navigation and hides only nonessential columns. Mobile stacks
  forms and record summaries, keeps the primary action and preview-exit control
  reachable, and never requires horizontal page scrolling.
- Effect settings honor reduced motion. Strong flicker is never used, and no
  visual effect is required to complete a workflow.
- Destructive actions are separated from routine actions and require explicit
  confirmation plus a reason where specified.

## 11. First vertical slice acceptance checklist

The slice passes only when all checks use persistent server-side records and
server-side authorization.

- [ ] A GM can sign in and reach `/gm`.
- [ ] A non-GM cannot access GM data by visiting a GM URL directly.
- [ ] The GM creates a runner with a unique login, alias, temporary password,
      Matrix clearance, starting nuyen, and forced-password-change state.
- [ ] Invalid player data creates no partial user, profile, role, or currency
      account.
- [ ] The opening nuyen balance has a matching immutable ledger entry.
- [ ] The GM creates a fixer/vendor with player visibility rules.
- [ ] The GM creates a product, assigns it to that fixer, gives it finite stock
      and an authoritative nuyen price, and restricts it by clearance/player
      access.
- [ ] Preview as an eligible player shows the fixer and product.
- [ ] Preview as an ineligible player reveals neither product detail nor hidden
      metadata.
- [ ] Preview displays a persistent warning, disables writes server-side, and
      records start and end audit events.
- [ ] The eligible player can sign in after changing the temporary password.
- [ ] A direct request from an ineligible player cannot read or purchase the
      product.
- [ ] The eligible player purchases one unit using an idempotent request.
- [ ] One atomic operation rechecks access, price, balance, and stock; creates
      the order and order item; deducts nuyen; reduces stock; writes the ledger;
      grants inventory when appropriate; creates notifications; and commits.
- [ ] A forged browser price or quantity is rejected or ignored in favor of
      authoritative server data.
- [ ] Insufficient funds, depleted stock, changed access, and concurrent
      purchase failures leave balance, stock, order, ledger, and inventory
      consistent.
- [ ] Duplicate submission does not charge twice or create duplicate orders or
      inventory.
- [ ] The order appears in the GM order queue with a price snapshot and linked
      ledger/inventory records.
- [ ] The GM can approve or reject only through valid status transitions.
- [ ] A rejection/refund, when applicable, is atomic and uses a compensating
      ledger entry rather than editing history.
- [ ] Player creation, product creation/access changes, purchase, order
      processing, economy changes, inventory grants, and preview events have
      immutable audit evidence with no secrets.
- [ ] The complete workflow is keyboard accessible and usable at desktop,
      tablet, and mobile widths with effects disabled.

