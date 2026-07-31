# Player Workflows

This guide describes the player-facing behavior of ShadowGrid. It is a workflow
and acceptance contract rather than a promise that a visible control alone
grants access. The server decides which hosts, posts, jobs, contacts, products,
messages, and actions a runner may use on every request.

## Player safety and authority

- Public registration is unavailable. A Game Master creates each account.
- Players use their runner alias in campaign-facing spaces; real-world names
  are not required for public display.
- Players cannot authoritatively change nuyen, reputation, clearance, stock,
  price, inventory quantity, access rules, or order state.
- Hidden data is omitted from responses, feeds, counts, search results, and
  related-record suggestions.
- The trace-risk indicator, route names, host warnings, nuyen, and transactions
  are fictional campaign mechanics and never claim real anonymity or value.
- Device-local storage may remember visual effects and theme preferences. It is
  not the source of truth for accounts or campaign data.

## 1. First sign-in

1. Open `/login`.
2. Enter the login name and temporary passcode supplied by the GM.
3. Submit the Shadow Host Handshake.
4. The server throttles repeated attempts, validates the account and password,
   and starts a secure server-side session.
5. If required, choose a new password before entering the campaign.
6. Arrive at `/dashboard` and review the current host, alias, clearance,
   fictional nuyen balance, unread count, route, and campaign announcements.

Expected states:

- A wrong login or password produces one neutral error and leaves no session.
- A disabled, expired, or login-restricted account goes to
  `/account-restricted` with a clear next step.
- A protected deep link returns to its safe destination after successful login
  when permitted.
- A valid session requesting an unauthorized record receives an access-denied
  or not-found-style response without hidden metadata.
- Password errors explain policy in plain language, preserve safe form values,
  and never echo the password.

## 2. Navigate the Matrix host

Desktop navigation uses the persistent node list; tablet and mobile use the
same destinations in a collapsible drawer:

- Home Node and Grid Feed
- Shadow Board and Jobs
- Black Market, Fixers, and Contacts
- Orders and Inventory
- Messages, Character, and Settings

The status bar presents readable text for connection state, clearance, balance,
unread messages, active route, fictional trace risk, and announcements. A
compact mobile status view may hide secondary detail behind an accessible
expander, but it must not hide balance or urgent restrictions during a
purchase.

Players may open the command menu with Ctrl/Command+K. J/K navigation, Enter,
R, S, W, and Escape shortcuts operate only when focus is not inside an input,
editor, or browser-reserved context. Every keyboard command has an ordinary
visible control.

## 3. Read the feed and announcements

1. Open `/feed`.
2. The server builds the feed from only authorized announcements, posts, jobs,
   listings, vendor updates, campaign events, and messages.
3. Filter or open an entry.
4. Dismiss a dismissible announcement or navigate to its source.
5. Return to the same reading position when practical.

Loading, empty, error, and end-of-feed states are explicit. Severity includes a
text label such as Warning or Astral Anomaly and is never communicated only by
color. An expired, revoked, or newly restricted item disappears on the next
authoritative request.

## 4. Use the Shadow Board

### Browse a host and thread

1. Open `/board`.
2. The server returns only hosts allowed by role, player grant, faction,
   reputation, clearance, restriction state, and campaign availability.
3. Open `/board/[host]`, then a thread.
4. Read sanitized Markdown, compact post metadata, replies, edit markers, and
   pagination.
5. Save or watch a thread when allowed.

### Create a thread or reply

1. Choose **New thread**, **Reply**, or **Quote**.
2. Write Markdown; a preview renders it using the same sanitization rules as
   the final post.
3. Submit once.
4. The server rechecks account, posting restriction, host visibility, host
   thread/reply permission, thread lock state, and content limits.
5. On success, the post appears with the runner alias or permitted display
   mode, and authorized watchers receive notifications.

Failure behavior:

- If a moderator locks or moves a thread before submit, the draft remains
  available and the page explains why it was not posted.
- Duplicate submissions create one post.
- Unsafe raw HTML is never rendered.
- A hidden or inaccessible host cannot be inferred from search, tags, counts,
  errors, or direct identifiers.
- Reporting a post confirms receipt without revealing moderation outcomes.

Players may edit within configured rules; edit history remains available to
authorized moderators. Deletion is soft deletion, not erasure of audit history.

## 5. Review jobs and contracts

1. Open `/jobs`.
2. The server filters jobs by player grant, faction, reputation, clearance,
   status, deadline, and campaign time.
3. Open a job to see the permitted briefing, Johnson/fixer, location, danger,
   payment, requirements, dates, participant limit, and attachments.
4. Apply, accept, or acknowledge only when the current job state permits it.
5. Receive later briefings, assignment changes, payments, rewards, reputation,
   and linked discussions through server-created records and notifications.

GM-only notes and classified briefing fields never appear in player payloads.
An application rejected due to changed status, deadline, capacity, or access
creates no partial assignment. Displayed payment is informational until a
matching immutable ledger entry is committed.

## 6. Discover fixers, contacts, and vendors

1. Open `/contacts` for known fixers and contacts, or `/vendors` for
   available sellers.
2. The server evaluates faction, player assignment, reputation, clearance,
   relationship, job completion, active status, and hidden state.
3. Open an available identity to review its authored page, services,
   communication channel, visible products, and player relationship.
4. Follow an allowed listing or begin an allowed conversation.

Different vendors may use distinct local Matrix layouts, but all pages retain
semantic headings, predictable core actions, readable body text, visible focus,
and a consistent way back. Hidden contacts do not appear as locked cards unless
the GM intentionally created an in-world teaser that contains no secret data.

## 7. Purchase a black-market listing

### Open a listing

1. Open `/market`.
2. Filter or search the listings returned for the signed-in player.
3. Open `/market/[productId]`.
4. The server re-evaluates product, vendor, faction, contact, player, job,
   reputation, clearance, publishing window, active/hidden state, and account
   restrictions.
5. Review the authoritative displayed price, condition, rarity, legality,
   availability, vendor, stock language, approval requirement, and accessible
   image descriptions.

### Confirm a purchase

1. Select a positive whole-number quantity within the displayed limit.
2. Review a confirmation containing product, quantity, authoritative estimated
   total, current nuyen, approval/delivery behavior, and fictional-currency
   notice.
3. Submit once. The browser sends the product identifier, quantity, and an
   idempotency token—not a trusted price or access decision.
4. Inside one database transaction, the server:
   1. Re-authenticates and re-authorizes the player.
   2. Rechecks all product and vendor visibility rules.
   3. Reads the current authoritative unit price and calculates the total.
   4. Locks or otherwise protects balance and finite stock from races.
   5. Rejects insufficient funds or stock without changing data.
   6. Creates the order and immutable order-item snapshot.
   7. Deducts or reserves nuyen.
   8. Reduces finite stock.
   9. Appends the ledger entry.
   10. Adds inventory immediately when the product workflow allows, or waits
       for GM approval/delivery.
   11. Creates required audit and notification records.
   12. Commits all changes together.
5. Show one receipt with order identifier, committed total, resulting balance,
   status, delivery/approval expectation, and inventory result.

Required failure states:

- **Access changed:** do not reveal which rule failed; create no order or
  charge.
- **Insufficient nuyen:** show required and available fictional amounts; do not
  allow a negative balance.
- **Stock changed:** show that availability changed; do not charge.
- **Price changed:** require a fresh confirmation if the committed price would
  differ from the reviewed total.
- **Duplicate submit:** return the original result rather than charging twice.
- **Concurrent purchase:** exactly the available stock succeeds; no negative
  stock or partial records.
- **Unexpected server error:** state that the purchase was not confirmed and
  provide a safe order-history check before retrying.

Changing HTML, request payloads, or client state must never bypass price,
quantity, visibility, balance, approval, or stock checks.

## 8. Inspect orders, inventory, and ledger history

### Orders

1. Open `/orders` and select an order.
2. Review its item/price snapshot, quantity, total, vendor, timeline, status,
   delivery instructions, and related ledger entries.
3. Acknowledge or cancel only when the server permits the transition.
4. Receive status notifications for approval, transit, dead drop, delivery,
   rejection, cancellation, loss, or seizure.

Historical order prices do not change when the product listing changes.

### Inventory

1. Open `/inventory`.
2. Review player-visible entries, quantity, condition, equipped/concealed state,
   acquisition source/date, custom details, and story notes.
3. Players may filter and inspect, but cannot alter authoritative quantity,
   condition, ownership, or GM-only notes.
4. Any allowed loadout preference must be a separately authorized operation and
   not a way to rewrite the inventory record.

### Transactions

Review the immutable chronological ledger through the character/economy view.
Every balance change includes amount, type, reason, before/after balance,
related order or job, performer identity when visible, and timestamp. A refund
or correction appears as a new compensating entry; history is never silently
rewritten.

## 9. Exchange private messages

1. Open `/messages`.
2. Search or select a conversation for which the player is an active
   participant.
3. Read messages and explicit displayed identities such as fixer, system,
   corporate relay, or unknown source.
4. Compose a reply and attach only allowed file types and sizes.
5. Submit once.
6. The server rechecks messaging restrictions, participant access, recipient
   eligibility, attachment ownership, and rate limits before saving.
7. Mark unread state, archive, mute, or report through authorized actions.

A direct conversation identifier never grants access. Messages sent by a GM as
an NPC display the fictional identity in-world while retaining the real actor
in protected audit data. A send failure preserves the draft and creates no
false sent state or duplicate notification.

## 10. Review character, reputation, and access

1. Open `/character`.
2. Review character identity, metatype, archetype, faction relationships,
   street reputation, notoriety, public awareness, Matrix clearance, contacts,
   and granted unlocks.
3. Follow available history links for reputation and nuyen changes.
4. Contact the GM through the designated channel if a value appears wrong.

These values are read-only for players. A newly changed clearance or
relationship takes effect on the next server access check; stale client data
cannot preserve old access.

## 11. Configure display and accessibility

1. Open `/settings`.
2. Choose a readable theme such as Seattle Grid, Corporate Host, Green
   Phosphor, Amber Terminal, Redmond BBS, Shamanic Node, Black Ice, or
   Low-Bandwidth Mode.
3. Independently toggle scanlines, noise, flicker, background grid, reduced
   motion, sound, and animation intensity.
4. Preview and save device-local preferences.

Defaults and guarantees:

- Strong flicker is never enabled; flicker starts off or at a safe subtle level.
- Operating-system reduced-motion preference is honored before any saved
  override and can always be restored.
- Sound never autoplays without consent and every audio surface has mute and
  volume controls.
- Disabling effects never removes information or functionality.
- Themes are functionally equivalent and meet contrast requirements.
- Body copy uses readable fonts and line length; monospace is reserved for
  compact metadata and terminal accents where appropriate.

## 12. Restrictions, denial, and recovery

Independent restrictions may disable login, posting, new threads, private
messages, purchases, or selected hosts.

- If login remains allowed, the player can still view permitted areas and a
  plain-language account status.
- A blocked action is enforced on the server and names the blocked capability
  without exposing GM notes.
- A restriction taking effect while a form is open prevents the write and
  preserves a safe local draft where appropriate.
- Session invalidation after full suspension returns to the restricted-account
  route.
- Maintenance and transient-error pages distinguish retryable outages from
  permission denial.
- Error messages include the next safe action and are announced to assistive
  technology.

## 13. Accessibility and responsive behavior

- Pages use semantic landmarks, ordered headings, lists, tables, forms, and
  buttons. All fields have persistent labels and linked error descriptions.
- Keyboard focus is visible. Dialogs manage focus, Escape closes only when safe,
  and focus returns to the triggering control.
- Thread, feed, market, order, and message actions have accessible names and
  visible equivalents for keyboard shortcuts.
- New content, purchase results, and validation summaries are announced without
  unexpectedly moving focus.
- Color is supplementary: clearance, legality, danger, stock, order status,
  connection state, and severity also use text.
- Desktop retains the left node navigation and optional right context panel.
  Tablet collapses navigation and places context below the main content.
  Mobile uses a drawer, compact status, stacked records/forms, large touch
  targets, and no horizontal page scrolling.
- Dense tables become labeled record rows or cards on narrow screens. Essential
  totals, status, deadlines, and primary actions remain visible.
- Markdown content, attachments, media, and long identifiers wrap without
  breaking layout.
- Loading placeholders expose meaningful accessible status; empty and denied
  states state what happened and what action is available.

## 14. First vertical slice player acceptance checklist

- [ ] A GM-created runner can sign in; public registration is absent.
- [ ] The player must replace a temporary password when configured.
- [ ] An enabled eligible player sees the assigned clearance and starting
      nuyen.
- [ ] The eligible player can discover the created fixer and restricted
      product.
- [ ] An ineligible player cannot discover the product through market lists,
      search, feeds, vendor pages, counts, or a direct URL.
- [ ] The product page shows the authoritative price, stock state, vendor,
      restrictions that are safe to disclose, and approval behavior.
- [ ] Purchase confirmation is understandable in fictional-currency terms and
      keyboard/screen-reader accessible.
- [ ] The server ignores forged prices and rechecks identity, access, balance,
      stock, and quantity at commit time.
- [ ] A successful purchase deducts the exact committed nuyen amount once,
      reduces finite stock once, creates one order, writes one purchase ledger
      entry, and grants the item once when appropriate.
- [ ] The receipt, order detail, new balance, ledger, and inventory agree.
- [ ] An approval-required purchase uses the documented pending state and does
      not falsely claim delivery.
- [ ] Insufficient funds, missing stock, changed access, changed price,
      concurrent purchase, and duplicate submit each leave consistent data and
      give a recoverable message.
- [ ] The GM sees the same order in the review queue and can process it through
      a valid transition.
- [ ] A refund appears as a new ledger entry rather than rewriting the purchase.
- [ ] The workflow works with effects disabled and reduced motion enabled.
- [ ] The workflow is operable using keyboard only and at desktop, tablet, and
      mobile widths without horizontal page overflow.
