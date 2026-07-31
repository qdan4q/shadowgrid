import { z } from "zod";
import { ensureCampaignReady, getD1 } from "../db/runtime";
import type { CampaignUser, ViewerContext } from "./auth";
import {
  canAdjustBalance,
  canManageAnnouncements,
  canManageForum,
  canManageJobs,
  canManageOrders,
  canManagePlayers,
  canManageProducts,
  canManageSettings,
  canPurchaseProduct,
  canSendNpcMessages,
  canViewAudit,
  canViewHost,
  canViewJob,
  canViewProduct,
  canViewThread,
} from "./permissions";
import { hashPassword, secureId, verifyPassword } from "./security";

export class CampaignError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "CAMPAIGN_ERROR",
  ) {
    super(message);
  }
}

export type ProductView = {
  id: string;
  listingCode: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  vendorId: string;
  vendorName: string;
  vendorTheme: string;
  price: number;
  stock: number;
  unlimitedStock: boolean;
  rarity: string;
  legality: string;
  condition: string;
  minReputation: number;
  minClearanceRank: number;
  factionId: string | null;
  requiresGmApproval: boolean;
  hidden: boolean;
  active: boolean;
  featured: boolean;
  expiresAt: string | null;
  allowedUserIds: string[];
  deniedUserIds: string[];
};

export type CampaignSnapshot = {
  campaignName: string;
  campaignTime: string;
  announcements: Array<Record<string, unknown>>;
  hosts: Array<Record<string, unknown>>;
  threads: Array<Record<string, unknown>>;
  posts: Array<Record<string, unknown>>;
  jobs: Array<Record<string, unknown>>;
  products: ProductView[];
  vendors: Array<Record<string, unknown>>;
  contacts: Array<Record<string, unknown>>;
  orders: Array<Record<string, unknown>>;
  inventory: Array<Record<string, unknown>>;
  conversations: Array<Record<string, unknown>>;
  players: Array<Record<string, unknown>>;
  audit: Array<Record<string, unknown>>;
  ledger: Array<Record<string, unknown>>;
  clearances: Array<Record<string, unknown>>;
  factions: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
};

type ProductRow = {
  id: string;
  listing_code: string;
  name: string;
  slug: string;
  short_description: string;
  full_description: string;
  category: string;
  vendor_id: string;
  vendor_name: string;
  vendor_theme: string;
  price: number;
  stock: number;
  unlimited_stock: number;
  rarity: string;
  legality: string;
  condition: string;
  min_reputation: number;
  min_clearance_rank: number;
  faction_id: string | null;
  requires_gm_approval: number;
  hidden: number;
  active: number;
  featured: number;
  expires_at: string | null;
  allowed_user_ids: string | null;
  denied_user_ids: string | null;
};

async function all<T>(query: string, ...values: unknown[]): Promise<T[]> {
  const result = await getD1().prepare(query).bind(...values).all<T>();
  return result.results;
}

function splitList(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function productFromRow(row: ProductRow): ProductView {
  return {
    id: row.id,
    listingCode: row.listing_code,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    category: row.category,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    vendorTheme: row.vendor_theme,
    price: row.price,
    stock: row.stock,
    unlimitedStock: Boolean(row.unlimited_stock),
    rarity: row.rarity,
    legality: row.legality,
    condition: row.condition,
    minReputation: row.min_reputation,
    minClearanceRank: row.min_clearance_rank,
    factionId: row.faction_id,
    requiresGmApproval: Boolean(row.requires_gm_approval),
    hidden: Boolean(row.hidden),
    active: Boolean(row.active),
    featured: Boolean(row.featured),
    expiresAt: row.expires_at,
    allowedUserIds: splitList(row.allowed_user_ids),
    deniedUserIds: splitList(row.denied_user_ids),
  };
}

function accessShape(row: Record<string, unknown>) {
  return {
    active: row.active === undefined ? true : Boolean(row.active),
    hidden: Boolean(row.hidden),
    minReputation: Number(row.min_reputation ?? 0),
    minClearanceRank: Number(row.min_clearance_rank ?? 0),
    factionId: (row.faction_id as string | null) ?? null,
  };
}

function withoutPrivateFields(row: Record<string, unknown>): Record<string, unknown> {
  const safe = { ...row };
  delete safe.gm_notes;
  return safe;
}

function allowsPlayers(value: unknown): boolean {
  return value === undefined || ["PLAYER", "ALL", "AUTHENTICATED"].includes(String(value).toUpperCase());
}

export async function loadCampaignSnapshot(viewer: ViewerContext): Promise<CampaignSnapshot> {
  await ensureCampaignReady();
  const dbUser = viewer.effectiveUser;
  const elevated = !viewer.isPreview;
  const productAdmin = elevated && canManageProducts(viewer.actor);
  const forumAdmin = elevated && canManageForum(viewer.actor);
  const jobAdmin = elevated && canManageJobs(viewer.actor);
  const orderAdmin = elevated && canManageOrders(viewer.actor);
  const announcementAdmin = elevated && canManageAnnouncements(viewer.actor);
  const playerAdmin = elevated && canManagePlayers(viewer.actor);
  const auditAdmin = elevated && canViewAudit(viewer.actor);
  const economyAdmin = elevated && canAdjustBalance(viewer.actor);
  const contactAdmin = elevated && viewer.actor.roles.includes("GAME_MASTER");
  const settings = await all<{ key: string; value: string }>("SELECT key,value FROM campaign_settings WHERE key IN ('campaign_name','campaign_time')");
  const settingMap = new Map(settings.map((item) => [item.key, item.value]));

  const productRows = await all<ProductRow>(`SELECT product.id,product.listing_code,product.name,product.slug,
      product.short_description,product.full_description,category.name AS category,
      product.vendor_id,vendor.name AS vendor_name,vendor.local_theme AS vendor_theme,
      product.price,product.stock,product.unlimited_stock,product.rarity,product.legality,product.condition,
      product.min_reputation,product.min_clearance_rank,product.faction_id,product.requires_gm_approval,
      product.hidden,product.active,product.featured,product.expires_at,
      GROUP_CONCAT(DISTINCT CASE WHEN rule.effect = 'ALLOW' AND rule.user_id IS NOT NULL THEN rule.user_id END) AS allowed_user_ids,
      GROUP_CONCAT(DISTINCT CASE WHEN rule.effect = 'DENY' AND rule.user_id IS NOT NULL THEN rule.user_id END) AS denied_user_ids
    FROM products product
    JOIN product_categories category ON category.id = product.category_id
    JOIN vendors vendor ON vendor.id = product.vendor_id
    LEFT JOIN product_access_rules rule ON rule.product_id = product.id
    WHERE product.deleted_at IS NULL
    GROUP BY product.id
    ORDER BY product.featured DESC, product.updated_at DESC, product.name`);
  const products = productRows.map(productFromRow).filter((product) => productAdmin || canViewProduct(dbUser, product));

  const hostRows = await all<Record<string, unknown>>(`SELECT host.*,
      (SELECT COUNT(*) FROM forum_threads thread WHERE thread.host_id = host.id AND thread.deleted_at IS NULL) AS thread_count
    FROM matrix_hosts host WHERE host.deleted_at IS NULL ORDER BY host.display_order,host.name`);
  const hosts = hostRows.filter((host) => forumAdmin || (allowsPlayers(host.read_permission) && canViewHost(dbUser, accessShape(host))));
  const visibleHostIds = new Set(hosts.map((host) => String(host.id)));
  const threadRows = await all<Record<string, unknown>>(`SELECT thread.id,thread.host_id,thread.title,thread.content,
      thread.author_display_mode,thread.author_label,thread.pinned,thread.locked,thread.hidden,thread.encrypted,
      thread.min_reputation,thread.min_clearance_rank,thread.faction_id,thread.created_at,thread.updated_at,
      host.name AS host_name,host.slug AS host_slug,
      COALESCE(thread.author_label,user.runner_alias,'UNKNOWN SOURCE') AS author,
      (SELECT COUNT(*) - 1 FROM forum_posts post WHERE post.thread_id = thread.id AND post.deleted_at IS NULL) AS reply_count
    FROM forum_threads thread
    JOIN matrix_hosts host ON host.id = thread.host_id
    LEFT JOIN users user ON user.id = thread.author_user_id
    WHERE thread.deleted_at IS NULL
    ORDER BY thread.pinned DESC,thread.updated_at DESC`);
  const threads = threadRows.filter((thread) => visibleHostIds.has(String(thread.host_id)) && (forumAdmin || canViewThread(dbUser, accessShape(thread))));
  const visibleThreadIds = new Set(threads.map((thread) => String(thread.id)));
  const posts = (await all<Record<string, unknown>>(`SELECT post.id,post.thread_id,post.content_markdown,post.author_display_mode,
      post.author_label,post.edited_at,post.hidden,post.created_at,COALESCE(post.author_label,user.runner_alias,'UNKNOWN SOURCE') AS author
    FROM forum_posts post LEFT JOIN users user ON user.id = post.author_user_id
    WHERE post.deleted_at IS NULL ORDER BY post.created_at`)).filter((post) => visibleThreadIds.has(String(post.thread_id)) && (forumAdmin || !Boolean(post.hidden)));

  const jobRows = await all<Record<string, unknown>>(`SELECT job.*,contact.alias AS fixer_alias,
      (SELECT COUNT(*) FROM job_assignments assignment WHERE assignment.job_id = job.id) AS participant_count
    FROM jobs job LEFT JOIN contacts contact ON contact.id = job.fixer_contact_id
    WHERE job.deleted_at IS NULL ORDER BY CASE job.status WHEN 'AVAILABLE' THEN 0 WHEN 'ACTIVE' THEN 1 ELSE 2 END,job.updated_at DESC`);
  const jobs = jobRows
    .filter((job) => jobAdmin || canViewJob(dbUser, accessShape(job)))
    .map((job) => jobAdmin ? job : withoutPrivateFields(job));

  const announcements = announcementAdmin
    ? await all<Record<string, unknown>>(`SELECT * FROM announcements WHERE deleted_at IS NULL ORDER BY pinned DESC,created_at DESC`)
    : await all<Record<string, unknown>>(`SELECT * FROM announcements
      WHERE deleted_at IS NULL AND active = 1 AND starts_at <= CURRENT_TIMESTAMP
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        AND (target_user_id IS NULL OR target_user_id = ?)
        AND (faction_id IS NULL OR faction_id = ?)
        AND min_clearance_rank <= ?
      ORDER BY pinned DESC,created_at DESC`, dbUser.id, dbUser.factionId, dbUser.clearanceRank);
  const vendorRows = await all<Record<string, unknown>>(`SELECT vendor.*,
      (SELECT COUNT(*) FROM products product WHERE product.vendor_id = vendor.id AND product.active = 1 AND product.deleted_at IS NULL) AS product_count
    FROM vendors vendor WHERE vendor.deleted_at IS NULL AND (? = 1 OR (vendor.active = 1 AND vendor.hidden = 0)) ORDER BY vendor.name`, productAdmin ? 1 : 0);
  const vendors = vendorRows.map((vendor) => productAdmin ? vendor : withoutPrivateFields(vendor));
  const contactRows = await all<Record<string, unknown>>(`SELECT contact.*,
      CASE WHEN player_contact.id IS NULL THEN 0 ELSE 1 END AS known,
      COALESCE(player_contact.loyalty,contact.loyalty) AS effective_loyalty
    FROM contacts contact
    LEFT JOIN player_contacts player_contact ON player_contact.contact_id = contact.id AND player_contact.player_profile_id = ?
    WHERE contact.deleted_at IS NULL AND (? = 1 OR (contact.active = 1 AND contact.hidden = 0 AND contact.min_reputation <= ? AND contact.min_clearance_rank <= ?))
    ORDER BY known DESC,contact.alias`, `profile-${dbUser.id}`, contactAdmin ? 1 : 0, dbUser.streetReputation, dbUser.clearanceRank);
  const contacts = contactRows.map((contact) => contactAdmin ? contact : withoutPrivateFields(contact));

  const orderRows = orderAdmin
    ? await all<Record<string, unknown>>(`SELECT orders.*,user.runner_alias,vendor.name AS vendor_name,
        (SELECT GROUP_CONCAT(item.product_name || ' x' || item.quantity, ', ') FROM order_items item WHERE item.order_id = orders.id) AS items
      FROM orders JOIN users user ON user.id = orders.user_id JOIN vendors vendor ON vendor.id = orders.vendor_id
      WHERE orders.deleted_at IS NULL ORDER BY orders.created_at DESC`)
    : await all<Record<string, unknown>>(`SELECT orders.*,vendor.name AS vendor_name,
        (SELECT GROUP_CONCAT(item.product_name || ' x' || item.quantity, ', ') FROM order_items item WHERE item.order_id = orders.id) AS items
      FROM orders JOIN vendors vendor ON vendor.id = orders.vendor_id
      WHERE orders.user_id = ? AND orders.deleted_at IS NULL ORDER BY orders.created_at DESC`, dbUser.id);
  const orders = orderRows.map((order) => orderAdmin ? order : withoutPrivateFields(order));
  const inventory = (await all<Record<string, unknown>>(`SELECT entry.*,item.name,item.category,item.description
    FROM inventory_entries entry JOIN inventory_items item ON item.id = entry.inventory_item_id
    WHERE entry.user_id = ? AND entry.deleted_at IS NULL AND entry.concealed = 0 ORDER BY entry.created_at DESC`, dbUser.id)).map(withoutPrivateFields);
  const conversations = await all<Record<string, unknown>>(`SELECT conversation.id,conversation.subject,conversation.updated_at,
      participant.unread_count,participant.muted,
      (SELECT message.body_markdown FROM private_messages message WHERE message.conversation_id = conversation.id AND message.deleted_at IS NULL ORDER BY message.created_at DESC LIMIT 1) AS last_message,
      (SELECT COALESCE(message.source_label,user.runner_alias,'UNKNOWN SOURCE') FROM private_messages message LEFT JOIN users user ON user.id = message.sender_user_id WHERE message.conversation_id = conversation.id AND message.deleted_at IS NULL ORDER BY message.created_at DESC LIMIT 1) AS last_sender
    FROM private_conversations conversation
    JOIN conversation_participants participant ON participant.conversation_id = conversation.id
    WHERE participant.user_id = ? AND conversation.deleted_at IS NULL ORDER BY conversation.updated_at DESC`, dbUser.id);
  const players = playerAdmin ? await all<Record<string, unknown>>(`SELECT user.id,user.login_name,user.runner_alias,user.enabled,user.force_password_change,user.last_login_at,
      character.character_name,character.metatype,character.archetype,profile.street_reputation,profile.notoriety,
      profile.posting_restricted,profile.messaging_restricted,profile.purchasing_restricted,
      clearance.key AS clearance_key,clearance.label AS clearance_label,account.balance,faction.name AS faction_name,
      GROUP_CONCAT(DISTINCT role.key) AS roles
    FROM users user
    LEFT JOIN player_profiles profile ON profile.user_id = user.id
    LEFT JOIN character_profiles character ON character.player_profile_id = profile.id
    LEFT JOIN matrix_clearances clearance ON clearance.id = profile.clearance_id
    LEFT JOIN currency_accounts account ON account.user_id = user.id
    LEFT JOIN factions faction ON faction.id = profile.faction_id
    LEFT JOIN user_roles ur ON ur.user_id = user.id LEFT JOIN roles role ON role.id = ur.role_id
    WHERE user.deleted_at IS NULL GROUP BY user.id ORDER BY user.runner_alias`)
    : economyAdmin ? await all<Record<string, unknown>>(`SELECT user.id,user.runner_alias,account.balance
      FROM users user JOIN currency_accounts account ON account.user_id=user.id
      WHERE user.deleted_at IS NULL ORDER BY user.runner_alias`)
    : [];
  const audit = auditAdmin ? await all<Record<string, unknown>>(`SELECT audit.*,actor.runner_alias AS actor_alias
    FROM audit_logs audit LEFT JOIN users actor ON actor.id = audit.actor_user_id ORDER BY audit.created_at DESC LIMIT 80`) : [];
  const ledger = economyAdmin
    ? await all<Record<string, unknown>>(`SELECT ledger_entry.*,user.runner_alias FROM transactions ledger_entry JOIN users user ON user.id = ledger_entry.user_id ORDER BY ledger_entry.created_at DESC LIMIT 80`)
    : await all<Record<string, unknown>>(`SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 80`, dbUser.id);
  const clearances = await all<Record<string, unknown>>("SELECT id,key,label,rank,color FROM matrix_clearances ORDER BY rank");
  const factions = await all<Record<string, unknown>>("SELECT id,name,slug,summary,accent FROM factions WHERE active = 1 AND deleted_at IS NULL ORDER BY name");
  const categories = await all<Record<string, unknown>>("SELECT id,name,slug FROM product_categories WHERE active = 1 ORDER BY display_order");

  return {
    campaignName: settingMap.get("campaign_name") ?? "RAIN CITY // 2080",
    campaignTime: settingMap.get("campaign_time") ?? "2080-11-18T04:17:00-08:00",
    announcements, hosts, threads, posts, jobs, products, vendors, contacts, orders, inventory,
    conversations, players, audit, ledger, clearances, factions, categories,
  };
}

function assertMutable(viewer: ViewerContext): void {
  if (viewer.isPreview) throw new CampaignError("Preview mode is read-only. Exit preview to perform actions.", 403, "PREVIEW_READ_ONLY");
}

export async function changeOwnPassword(viewer: ViewerContext, input: unknown, request?: Request) {
  assertMutable(viewer);
  if (viewer.actor.id !== viewer.effectiveUser.id) throw new CampaignError("Exit preview before changing credentials.", 403, "PREVIEW_READ_ONLY");
  const parsed = z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(12).max(128),
    confirmPassword: z.string().min(12).max(128),
  }).safeParse(input);
  if (!parsed.success) throw new CampaignError("New passcodes must contain at least 12 characters.", 422, "INVALID_PASSWORD");
  if (parsed.data.newPassword !== parsed.data.confirmPassword) throw new CampaignError("New passcode confirmation does not match.", 422, "PASSWORD_MISMATCH");
  if (parsed.data.newPassword === parsed.data.currentPassword) throw new CampaignError("Choose a passcode different from the temporary one.", 422, "PASSWORD_UNCHANGED");
  const db = getD1();
  const current = await db.prepare("SELECT password_hash,password_salt,password_iterations FROM users WHERE id=? AND enabled=1 AND deleted_at IS NULL").bind(viewer.actor.id).first<{ password_hash: string; password_salt: string; password_iterations: number }>();
  if (!current || !await verifyPassword(parsed.data.currentPassword, current.password_hash, current.password_salt, current.password_iterations)) {
    throw new CampaignError("Current passcode was rejected.", 401, "CURRENT_PASSWORD_REJECTED");
  }
  const next = await hashPassword(parsed.data.newPassword);
  await db.batch([
    db.prepare("UPDATE users SET password_hash=?,password_salt=?,password_iterations=?,force_password_change=0,temporary_password_expires_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(next.hash, next.salt, next.iterations, viewer.actor.id),
    db.prepare("UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND id<>? AND revoked_at IS NULL").bind(viewer.actor.id, viewer.sessionId),
    db.prepare("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,request_metadata) VALUES (?,?,?,?,?,?,?)").bind(secureId("audit"), viewer.actor.id, "PASSWORD_CHANGED", "User", viewer.actor.id, "Account owner changed passcode and invalidated other sessions", requestSummary(request)),
  ]);
  return { changed: true };
}

function requestSummary(request?: Request): string {
  if (!request) return "{}";
  return JSON.stringify({ path: new URL(request.url).pathname, userAgent: request.headers.get("user-agent")?.slice(0, 120) ?? null });
}

const purchaseSchema = z.object({
  productId: z.string().min(1).max(80),
  quantity: z.coerce.number().int().min(1).max(10),
  idempotencyKey: z.string().min(8).max(100),
});

export async function purchaseProduct(viewer: ViewerContext, input: unknown, request?: Request) {
  assertMutable(viewer);
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success) throw new CampaignError("Invalid purchase request.", 422, "INVALID_PURCHASE");
  const buyer = viewer.effectiveUser;
  if (buyer.id !== viewer.actor.id || !buyer.roles.includes("PLAYER")) throw new CampaignError("Only a player account can purchase gear.", 403, "PLAYER_REQUIRED");
  const db = getD1();
  const existing = await db.prepare("SELECT id,order_code,status,total FROM orders WHERE idempotency_key = ? AND user_id = ?").bind(parsed.data.idempotencyKey, buyer.id).first();
  if (existing) return existing;
  const row = await db.prepare(`SELECT product.*,vendor.name AS vendor_name,
      GROUP_CONCAT(DISTINCT CASE WHEN rule.effect='ALLOW' AND rule.user_id IS NOT NULL THEN rule.user_id END) AS allowed_user_ids,
      GROUP_CONCAT(DISTINCT CASE WHEN rule.effect='DENY' AND rule.user_id IS NOT NULL THEN rule.user_id END) AS denied_user_ids
    FROM products product JOIN vendors vendor ON vendor.id=product.vendor_id
    LEFT JOIN product_access_rules rule ON rule.product_id=product.id
    WHERE product.id=? AND product.deleted_at IS NULL GROUP BY product.id`).bind(parsed.data.productId).first<Record<string, unknown>>();
  if (!row) throw new CampaignError("Listing not found.", 404, "PRODUCT_NOT_FOUND");
  const access = {
    active: Boolean(row.active), hidden: Boolean(row.hidden), minReputation: Number(row.min_reputation),
    minClearanceRank: Number(row.min_clearance_rank), factionId: (row.faction_id as string | null) ?? null,
    allowedUserIds: splitList((row.allowed_user_ids as string | null) ?? null),
    deniedUserIds: splitList((row.denied_user_ids as string | null) ?? null),
    expiresAt: (row.expires_at as string | null) ?? null,
  };
  if (!canPurchaseProduct(buyer, access)) throw new CampaignError("Your current clearance cannot access this listing.", 403, "PRODUCT_RESTRICTED");
  const quantity = parsed.data.quantity;
  const price = Number(row.price);
  const total = price * quantity;
  if (!Boolean(row.unlimited_stock) && Number(row.stock) < quantity) throw new CampaignError("Vendor stock changed before confirmation.", 409, "INSUFFICIENT_STOCK");
  if (buyer.nuyen < total) throw new CampaignError("Insufficient nuyen for this order.", 409, "INSUFFICIENT_FUNDS");
  const orderId = secureId("order");
  const orderCode = `SG-${new Date().getUTCFullYear()}-${crypto.getRandomValues(new Uint16Array(1))[0].toString().padStart(5, "0")}`;
  const requiresApproval = Boolean(row.requires_gm_approval);
  const status = requiresApproval ? "AWAITING GM" : "DELIVERED";
  const statements = [
    db.prepare("INSERT INTO orders (id,order_code,user_id,vendor_id,status,total,idempotency_key) VALUES (?,?,?,?,?,?,?)").bind(orderId, orderCode, buyer.id, row.vendor_id, status, total, parsed.data.idempotencyKey),
    db.prepare("UPDATE currency_accounts SET balance=balance-?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(total, buyer.id),
    db.prepare("UPDATE products SET stock=CASE WHEN unlimited_stock=1 THEN stock ELSE stock-? END,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(quantity, row.id),
    db.prepare("INSERT INTO order_items (id,order_id,product_id,product_name,listing_code,quantity,unit_price,line_total) VALUES (?,?,?,?,?,?,?,?)").bind(secureId("orderitem"), orderId, row.id, row.name, row.listing_code, quantity, price, total),
    db.prepare(`INSERT INTO transactions (id,user_id,type,amount,balance_before,balance_after,reason,related_order_id,performed_by)
      SELECT ?,user_id,'PURCHASE',?,balance+?,balance,?,?,? FROM currency_accounts WHERE user_id=?`)
      .bind(secureId("transaction"), -total, total, `${row.vendor_name} order ${orderCode}`, orderId, buyer.id, buyer.id),
    db.prepare("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,after_state,request_metadata) VALUES (?,?,?,?,?,?,?,?)").bind(secureId("audit"), buyer.id, "PURCHASE_COMPLETED", "Order", orderId, `Placed fictional order ${orderCode}`, JSON.stringify({ productId: row.id, quantity, total, status }), requestSummary(request)),
    db.prepare("INSERT INTO notifications (id,user_id,type,title,body,resource_type,resource_id) VALUES (?,?,?,?,?,?,?)").bind(secureId("notification"), buyer.id, "ORDER", `ORDER ${orderCode}`, requiresApproval ? "Funds reserved. Awaiting Game Master review." : "Dead-drop manifest accepted; item added to inventory.", "Order", orderId),
  ];
  if (!requiresApproval) {
    statements.push(db.prepare("INSERT INTO inventory_entries (id,user_id,inventory_item_id,quantity,condition,acquisition_source,related_order_id) VALUES (?,?,?,?,?,?,?)").bind(secureId("inventory"), buyer.id, `item-${row.id}`, quantity, row.condition, "PURCHASE", orderId));
  }
  try {
    await db.batch(statements);
  } catch (error) {
    const duplicate = await db.prepare("SELECT id,order_code,status,total FROM orders WHERE idempotency_key = ? AND user_id = ?").bind(parsed.data.idempotencyKey, buyer.id).first();
    if (duplicate) return duplicate;
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("INSUFFICIENT_FUNDS")) throw new CampaignError("Insufficient nuyen for this order.", 409, "INSUFFICIENT_FUNDS");
    if (message.includes("INSUFFICIENT_STOCK")) throw new CampaignError("Vendor stock changed before confirmation.", 409, "INSUFFICIENT_STOCK");
    if (message.includes("PRODUCT_NOT_PURCHASABLE")) throw new CampaignError("Listing access changed before confirmation.", 403, "PRODUCT_RESTRICTED");
    throw error;
  }
  return { id: orderId, order_code: orderCode, status, total };
}

const createPlayerSchema = z.object({
  loginName: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{3,32}$/),
  runnerAlias: z.string().trim().min(2).max(40),
  temporaryPassword: z.string().min(12).max(128),
  characterName: z.string().trim().min(2).max(80),
  metatype: z.string().trim().min(2).max(40),
  archetype: z.string().trim().min(2).max(40),
  factionId: z.string().min(1),
  clearanceId: z.string().min(1),
  startingNuyen: z.coerce.number().int().min(0).max(10_000_000),
  startingReputation: z.coerce.number().int().min(-100).max(100),
  forcePasswordChange: z.coerce.boolean().default(true),
  gmNotes: z.string().max(2000).optional().default(""),
});

export async function createPlayer(viewer: ViewerContext, input: unknown, request?: Request) {
  assertMutable(viewer);
  if (!canManagePlayers(viewer.actor)) throw new CampaignError("Player management permission required.", 403, "FORBIDDEN");
  const parsed = createPlayerSchema.safeParse(input);
  if (!parsed.success) throw new CampaignError(parsed.error.issues[0]?.message ?? "Invalid player details.", 422, "INVALID_PLAYER");
  const data = parsed.data;
  const db = getD1();
  const clearance = await db.prepare("SELECT id,key,rank FROM matrix_clearances WHERE id=?").bind(data.clearanceId).first();
  const faction = await db.prepare("SELECT id FROM factions WHERE id=? AND active=1").bind(data.factionId).first();
  if (!clearance || !faction) throw new CampaignError("Clearance or faction is invalid.", 422, "INVALID_ACCESS_PROFILE");
  const password = await hashPassword(data.temporaryPassword);
  const userId = secureId("user");
  const profileId = `profile-${userId}`;
  try {
    await db.batch([
      db.prepare("INSERT INTO users (id,login_name,runner_alias,password_hash,password_salt,password_iterations,enabled,force_password_change,gm_notes) VALUES (?,?,?,?,?,?,1,?,?)").bind(userId, data.loginName, data.runnerAlias.toUpperCase(), password.hash, password.salt, password.iterations, data.forcePasswordChange ? 1 : 0, data.gmNotes),
      db.prepare("INSERT INTO user_roles (user_id,role_id,granted_by) VALUES (?,'role-player',?)").bind(userId, viewer.actor.id),
      db.prepare("INSERT INTO player_profiles (id,user_id,faction_id,clearance_id,street_reputation) VALUES (?,?,?,?,?)").bind(profileId, userId, data.factionId, data.clearanceId, data.startingReputation),
      db.prepare("INSERT INTO character_profiles (id,player_profile_id,character_name,metatype,archetype) VALUES (?,?,?,?,?)").bind(`character-${userId}`, profileId, data.characterName, data.metatype, data.archetype),
      db.prepare("INSERT INTO currency_accounts (id,user_id,balance) VALUES (?,?,?)").bind(`acct-${userId}`, userId, data.startingNuyen),
      db.prepare("INSERT INTO carts (id,user_id) VALUES (?,?)").bind(`cart-${userId}`, userId),
      db.prepare("INSERT INTO reputation_events (id,player_profile_id,before_value,after_value,reason,actor_user_id) VALUES (?,?,?,?,?,?)").bind(secureId("reputation"), profileId, 0, data.startingReputation, "Starting street reputation", viewer.actor.id),
      db.prepare("INSERT INTO transactions (id,user_id,type,amount,balance_before,balance_after,reason,performed_by) VALUES (?,?,?,?,?,?,?,?)").bind(secureId("transaction"), userId, "GM GRANT", data.startingNuyen, 0, data.startingNuyen, "Starting nuyen", viewer.actor.id),
      db.prepare("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,after_state,request_metadata) VALUES (?,?,?,?,?,?,?,?)").bind(secureId("audit"), viewer.actor.id, "PLAYER_CREATED", "User", userId, `Created runner ${data.runnerAlias.toUpperCase()}`, JSON.stringify({ loginName: data.loginName, runnerAlias: data.runnerAlias.toUpperCase(), clearanceId: data.clearanceId, startingNuyen: data.startingNuyen, startingReputation: data.startingReputation }), requestSummary(request)),
    ]);
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new CampaignError("Login name or runner alias already exists.", 409, "DUPLICATE_PLAYER");
    throw error;
  }
  return { id: userId, runnerAlias: data.runnerAlias.toUpperCase() };
}

const vendorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  vendorType: z.string().trim().min(2).max(40),
  description: z.string().trim().min(20).max(2000),
  nodeAddress: z.string().trim().min(5).max(120),
  localTheme: z.string().trim().min(2).max(40),
});

export async function createVendor(viewer: ViewerContext, input: unknown, request?: Request) {
  assertMutable(viewer);
  if (!canManageProducts(viewer.actor)) throw new CampaignError("Product management permission required.", 403, "FORBIDDEN");
  const parsed = vendorSchema.safeParse(input);
  if (!parsed.success) throw new CampaignError("Invalid fixer or vendor details.", 422, "INVALID_VENDOR");
  const data = parsed.data;
  const id = secureId("vendor");
  const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/(^-|-$)/gu, "")}-${id.slice(-5).toLowerCase()}`;
  await getD1().batch([
    getD1().prepare("INSERT INTO vendors (id,name,slug,vendor_type,description,node_address,local_theme) VALUES (?,?,?,?,?,?,?)").bind(id, data.name.toUpperCase(), slug, data.vendorType.toUpperCase(), data.description, data.nodeAddress, data.localTheme.toUpperCase()),
    getD1().prepare("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,after_state,request_metadata) VALUES (?,?,?,?,?,?,?,?)").bind(secureId("audit"), viewer.actor.id, "VENDOR_CREATED", "Vendor", id, `Created vendor ${data.name.toUpperCase()}`, JSON.stringify(data), requestSummary(request)),
  ]);
  return { id, slug };
}

const productSchema = z.object({
  name: z.string().trim().min(3).max(100),
  listingCode: z.string().trim().min(3).max(32),
  shortDescription: z.string().trim().min(12).max(220),
  fullDescription: z.string().trim().min(20).max(4000),
  categoryId: z.string().min(1),
  vendorId: z.string().min(1),
  price: z.coerce.number().int().min(0).max(100_000_000),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  rarity: z.string().min(2).max(30),
  legality: z.string().min(2).max(40),
  minReputation: z.coerce.number().int().min(-100).max(100),
  minClearanceRank: z.coerce.number().int().min(0).max(5),
  requiresGmApproval: z.coerce.boolean().default(false),
  hidden: z.coerce.boolean().default(false),
});

export async function createProduct(viewer: ViewerContext, input: unknown, request?: Request) {
  assertMutable(viewer);
  if (!canManageProducts(viewer.actor)) throw new CampaignError("Product management permission required.", 403, "FORBIDDEN");
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) throw new CampaignError(parsed.error.issues[0]?.message ?? "Invalid listing details.", 422, "INVALID_PRODUCT");
  const data = parsed.data;
  const db = getD1();
  const category = await db.prepare("SELECT name FROM product_categories WHERE id=? AND active=1").bind(data.categoryId).first<{ name: string }>();
  const vendor = await db.prepare("SELECT id FROM vendors WHERE id=? AND active=1 AND deleted_at IS NULL").bind(data.vendorId).first();
  if (!category || !vendor) throw new CampaignError("Vendor or category is unavailable.", 422, "INVALID_PRODUCT_RELATION");
  const id = secureId("prod");
  const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/(^-|-$)/gu, "")}-${id.slice(-5).toLowerCase()}`;
  await db.batch([
    db.prepare("INSERT INTO products (id,internal_id,listing_code,name,slug,short_description,full_description,category_id,vendor_id,price,stock,rarity,legality,min_reputation,min_clearance_rank,requires_gm_approval,hidden) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id, `SG-${id.toUpperCase()}`, data.listingCode.toUpperCase(), data.name, slug, data.shortDescription, data.fullDescription, data.categoryId, data.vendorId, data.price, data.stock, data.rarity.toUpperCase(), data.legality.toUpperCase(), data.minReputation, data.minClearanceRank, data.requiresGmApproval ? 1 : 0, data.hidden ? 1 : 0),
    db.prepare("INSERT INTO inventory_items (id,product_id,name,category,description) VALUES (?,?,?,?,?)").bind(`item-${id}`, id, data.name, category.name, data.shortDescription),
    db.prepare("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,after_state,request_metadata) VALUES (?,?,?,?,?,?,?,?)").bind(secureId("audit"), viewer.actor.id, "PRODUCT_CREATED", "Product", id, `Created listing ${data.name}`, JSON.stringify(data), requestSummary(request)),
  ]);
  return { id, slug };
}

const adjustPlayerSchema = z.object({
  userId: z.string().min(1),
  nuyenDelta: z.coerce.number().int().min(-10_000_000).max(10_000_000).default(0),
  reputationDelta: z.coerce.number().int().min(-100).max(100).default(0),
  clearanceId: z.string().optional(),
  reason: z.string().trim().min(4).max(500),
});

export async function adjustPlayer(viewer: ViewerContext, input: unknown, request?: Request) {
  assertMutable(viewer);
  if (!canManagePlayers(viewer.actor) || !canAdjustBalance(viewer.actor)) throw new CampaignError("Player and economy permissions required.", 403, "FORBIDDEN");
  const parsed = adjustPlayerSchema.safeParse(input);
  if (!parsed.success) throw new CampaignError("Invalid player adjustment.", 422, "INVALID_ADJUSTMENT");
  const data = parsed.data;
  const db = getD1();
  const before = await db.prepare(`SELECT account.balance,profile.id AS profile_id,profile.street_reputation,profile.clearance_id
    FROM currency_accounts account JOIN player_profiles profile ON profile.user_id=account.user_id WHERE account.user_id=?`).bind(data.userId).first<{ balance: number; profile_id: string; street_reputation: number; clearance_id: string }>();
  if (!before) throw new CampaignError("Player not found.", 404, "PLAYER_NOT_FOUND");
  const balanceAfter = before.balance + data.nuyenDelta;
  const reputationAfter = before.street_reputation + data.reputationDelta;
  if (balanceAfter < 0) throw new CampaignError("Adjustment would create a negative balance.", 409, "NEGATIVE_BALANCE");
  if (data.clearanceId) {
    const clearance = await db.prepare("SELECT id FROM matrix_clearances WHERE id=?").bind(data.clearanceId).first();
    if (!clearance) throw new CampaignError("Clearance level not found.", 422, "INVALID_CLEARANCE");
  }
  const statements = [
    db.prepare(`INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,before_state,after_state,request_metadata)
      SELECT ?,?,'PLAYER_ADJUSTED','User',?,?,
        json_object('balance',account.balance,'streetReputation',profile.street_reputation,'clearanceId',profile.clearance_id),
        json_object('balance',account.balance+?,'streetReputation',profile.street_reputation+?,'clearanceId',COALESCE(?,profile.clearance_id)),?
      FROM currency_accounts account JOIN player_profiles profile ON profile.user_id=account.user_id
      WHERE account.user_id=?`).bind(secureId("audit"), viewer.actor.id, data.userId, data.reason, data.nuyenDelta, data.reputationDelta, data.clearanceId ?? null, requestSummary(request), data.userId),
  ];
  if (data.nuyenDelta !== 0) statements.push(db.prepare(`INSERT INTO transactions (id,user_id,type,amount,balance_before,balance_after,reason,performed_by)
      SELECT ?,user_id,?,?,balance,balance+?,?,? FROM currency_accounts WHERE user_id=?`)
    .bind(secureId("transaction"), data.nuyenDelta > 0 ? "GM GRANT" : "GM DEDUCTION", data.nuyenDelta, data.nuyenDelta, data.reason, viewer.actor.id, data.userId));
  if (data.reputationDelta !== 0) statements.push(db.prepare(`INSERT INTO reputation_events (id,player_profile_id,before_value,after_value,reason,actor_user_id)
      SELECT ?,id,street_reputation,street_reputation+?,?,? FROM player_profiles WHERE user_id=?`)
    .bind(secureId("reputation"), data.reputationDelta, data.reason, viewer.actor.id, data.userId));
  statements.push(
    db.prepare("UPDATE currency_accounts SET balance=balance+?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(data.nuyenDelta, data.userId),
    db.prepare("UPDATE player_profiles SET street_reputation=street_reputation+?,clearance_id=COALESCE(?,clearance_id),updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(data.reputationDelta, data.clearanceId ?? null, data.userId),
  );
  try {
    await db.batch(statements);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("INSUFFICIENT_FUNDS")) throw new CampaignError("Adjustment would create a negative balance.", 409, "NEGATIVE_BALANCE");
    if (message.includes("REPUTATION_OUT_OF_RANGE")) throw new CampaignError("Adjustment would move reputation outside the configured range.", 409, "REPUTATION_OUT_OF_RANGE");
    throw error;
  }
  const after = await db.prepare(`SELECT account.balance,profile.street_reputation
    FROM currency_accounts account JOIN player_profiles profile ON profile.user_id=account.user_id
    WHERE account.user_id=?`).bind(data.userId).first<{ balance: number; street_reputation: number }>();
  return { balance: after?.balance ?? balanceAfter, reputation: after?.street_reputation ?? reputationAfter };
}

export async function toggleProduct(viewer: ViewerContext, input: unknown, request?: Request) {
  assertMutable(viewer);
  if (!canManageProducts(viewer.actor)) throw new CampaignError("Product management permission required.", 403, "FORBIDDEN");
  const parsed = z.object({ productId: z.string().min(1), hidden: z.boolean().optional(), active: z.boolean().optional() }).safeParse(input);
  if (!parsed.success || (parsed.data.hidden === undefined && parsed.data.active === undefined)) throw new CampaignError("Invalid product state change.", 422, "INVALID_PRODUCT_STATE");
  const db = getD1();
  const before = await db.prepare("SELECT hidden,active,name FROM products WHERE id=? AND deleted_at IS NULL").bind(parsed.data.productId).first<Record<string, unknown>>();
  if (!before) throw new CampaignError("Product not found.", 404, "PRODUCT_NOT_FOUND");
  const hidden = parsed.data.hidden === undefined ? Number(before.hidden) : parsed.data.hidden ? 1 : 0;
  const active = parsed.data.active === undefined ? Number(before.active) : parsed.data.active ? 1 : 0;
  await db.batch([
    db.prepare("UPDATE products SET hidden=?,active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(hidden, active, parsed.data.productId),
    db.prepare("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,before_state,after_state,request_metadata) VALUES (?,?,?,?,?,?,?,?,?)").bind(secureId("audit"), viewer.actor.id, hidden ? "PRODUCT_HIDDEN" : "PRODUCT_REVEALED", "Product", parsed.data.productId, `Changed visibility for ${before.name}`, JSON.stringify(before), JSON.stringify({ hidden: Boolean(hidden), active: Boolean(active) }), requestSummary(request)),
  ]);
  return { hidden: Boolean(hidden), active: Boolean(active) };
}

export async function processOrder(viewer: ViewerContext, input: unknown, request?: Request) {
  assertMutable(viewer);
  const mayManage = viewer.actor.roles.includes("GAME_MASTER") || viewer.actor.permissions.includes("manage_orders");
  if (!mayManage) throw new CampaignError("Order management permission required.", 403, "FORBIDDEN");
  const parsed = z.object({ orderId: z.string().min(1), decision: z.enum(["APPROVE", "REJECT"]), note: z.string().max(500).optional().default("") }).safeParse(input);
  if (!parsed.success) throw new CampaignError("Invalid order decision.", 422, "INVALID_ORDER_DECISION");
  const db = getD1();
  const order = await db.prepare("SELECT * FROM orders WHERE id=? AND status IN ('AWAITING GM','PENDING') AND deleted_at IS NULL").bind(parsed.data.orderId).first<Record<string, unknown>>();
  if (!order) throw new CampaignError("Order is no longer awaiting review.", 409, "ORDER_ALREADY_PROCESSED");
  const items = await all<Record<string, unknown>>("SELECT item.*,product.unlimited_stock FROM order_items item JOIN products product ON product.id=item.product_id WHERE item.order_id=?", parsed.data.orderId);
  const statements: D1PreparedStatement[] = [];
  if (parsed.data.decision === "APPROVE") {
    statements.push(db.prepare("UPDATE orders SET status='DELIVERED',approved_by=?,approved_at=CURRENT_TIMESTAMP,gm_notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(viewer.actor.id, parsed.data.note, parsed.data.orderId));
    for (const item of items) statements.push(db.prepare("INSERT INTO inventory_entries (id,user_id,inventory_item_id,quantity,condition,acquisition_source,related_order_id) VALUES (?,?,?,?,?,?,?)").bind(secureId("inventory"), order.user_id, `item-${item.product_id}`, item.quantity, "NEW", "APPROVED PURCHASE", parsed.data.orderId));
  } else {
    const account = await db.prepare("SELECT id FROM currency_accounts WHERE user_id=?").bind(order.user_id).first<{ id: string }>();
    if (!account) throw new CampaignError("Buyer account is missing.", 500, "ACCOUNT_MISSING");
    statements.push(db.prepare("UPDATE orders SET status='REJECTED',approved_by=?,approved_at=CURRENT_TIMESTAMP,gm_notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(viewer.actor.id, parsed.data.note, parsed.data.orderId));
    statements.push(db.prepare("UPDATE currency_accounts SET balance=balance+?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(order.total, order.user_id));
    statements.push(db.prepare(`INSERT INTO transactions (id,user_id,type,amount,balance_before,balance_after,reason,related_order_id,performed_by)
      SELECT ?,user_id,'REFUND',?,balance-?,balance,?,?,? FROM currency_accounts WHERE user_id=?`)
      .bind(secureId("transaction"), order.total, order.total, `Rejected order ${order.order_code}`, parsed.data.orderId, viewer.actor.id, order.user_id));
    for (const item of items) statements.push(db.prepare("UPDATE products SET stock=CASE WHEN unlimited_stock=1 THEN stock ELSE stock+? END,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(item.quantity, item.product_id));
  }
  statements.push(db.prepare("INSERT INTO notifications (id,user_id,type,title,body,resource_type,resource_id) VALUES (?,?,?,?,?,?,?)").bind(secureId("notification"), order.user_id, "ORDER", `ORDER ${order.order_code}`, parsed.data.decision === "APPROVE" ? "Game Master approved delivery." : "Game Master rejected the order and returned reserved nuyen.", "Order", parsed.data.orderId));
  statements.push(db.prepare("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,before_state,after_state,request_metadata) VALUES (?,?,?,?,?,?,?,?,?)").bind(secureId("audit"), viewer.actor.id, parsed.data.decision === "APPROVE" ? "ORDER_APPROVED" : "ORDER_REJECTED", "Order", parsed.data.orderId, `${parsed.data.decision.toLowerCase()}d ${order.order_code}`, JSON.stringify({ status: order.status }), JSON.stringify({ status: parsed.data.decision === "APPROVE" ? "DELIVERED" : "REJECTED", note: parsed.data.note }), requestSummary(request)));
  try {
    await db.batch(statements);
  } catch (error) {
    if (String(error).includes("ORDER_ALREADY_PROCESSED")) throw new CampaignError("Order is no longer awaiting review.", 409, "ORDER_ALREADY_PROCESSED");
    throw error;
  }
  return { id: parsed.data.orderId, status: parsed.data.decision === "APPROVE" ? "DELIVERED" : "REJECTED" };
}

export async function createHost(viewer: ViewerContext, input: unknown, request?: Request) {
  assertMutable(viewer);
  if (!canManageForum(viewer.actor)) throw new CampaignError("Forum management permission required.", 403, "FORBIDDEN");
  const parsed = z.object({ name: z.string().min(3).max(80), description: z.string().min(12).max(1000), nodeAddress: z.string().min(5).max(100), theme: z.string().min(2).max(40), minReputation: z.coerce.number().int().min(0).max(100), minClearanceRank: z.coerce.number().int().min(0).max(5), hidden: z.coerce.boolean().default(false) }).safeParse(input);
  if (!parsed.success) throw new CampaignError("Invalid Matrix host.", 422, "INVALID_HOST");
  const id = secureId("host");
  const slug = `${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/(^-|-$)/gu, "")}-${id.slice(-4).toLowerCase()}`;
  await getD1().batch([
    getD1().prepare("INSERT INTO matrix_hosts (id,category_id,name,slug,description,node_address,icon,visual_theme,owner,display_order,hidden,min_reputation,min_clearance_rank) VALUES (?,'forum-shadow',?,?,?,?,? ,?,?,99,?,?,?)").bind(id, parsed.data.name.toUpperCase(), slug, parsed.data.description, parsed.data.nodeAddress, "#", parsed.data.theme.toUpperCase(), viewer.actor.runnerAlias, parsed.data.hidden ? 1 : 0, parsed.data.minReputation, parsed.data.minClearanceRank),
    getD1().prepare("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,after_state,request_metadata) VALUES (?,?,?,?,?,?,?,?)").bind(secureId("audit"), viewer.actor.id, "HOST_CREATED", "MatrixHost", id, `Created Matrix host ${parsed.data.name.toUpperCase()}`, JSON.stringify(parsed.data), requestSummary(request)),
  ]);
  return { id, slug };
}

export async function createThread(viewer: ViewerContext, input: unknown, request?: Request) {
  assertMutable(viewer);
  const parsed = z.object({ hostId: z.string().min(1), title: z.string().trim().min(4).max(160), content: z.string().trim().min(8).max(12_000), displayMode: z.enum(["PLAYER_ALIAS", "NPC_IDENTITY", "ANONYMOUS", "SYSTEM", "CORPORATE_RELAY", "UNKNOWN_SOURCE"]).default("PLAYER_ALIAS"), authorLabel: z.string().max(80).optional() }).safeParse(input);
  if (!parsed.success) throw new CampaignError("Invalid thread.", 422, "INVALID_THREAD");
  const gmPost = parsed.data.displayMode !== "PLAYER_ALIAS";
  const forumManager = canManageForum(viewer.actor);
  if (gmPost && (!forumManager || !canSendNpcMessages(viewer.actor))) throw new CampaignError("NPC posting requires forum and NPC-message permissions.", 403, "FORBIDDEN");
  if (!gmPost && viewer.effectiveUser.postingRestricted) throw new CampaignError("Posting is restricted on this account.", 403, "POSTING_RESTRICTED");
  const host = await getD1().prepare("SELECT * FROM matrix_hosts WHERE id=? AND deleted_at IS NULL").bind(parsed.data.hostId).first<Record<string, unknown>>();
  if (!host || (!forumManager && (!allowsPlayers(host.read_permission) || !allowsPlayers(host.thread_permission) || !canViewHost(viewer.effectiveUser, accessShape(host))))) {
    throw new CampaignError("Host access denied.", 403, "HOST_RESTRICTED");
  }
  const id = secureId("thread");
  const label = gmPost ? parsed.data.authorLabel ?? viewer.actor.runnerAlias : null;
  await getD1().batch([
    getD1().prepare("INSERT INTO forum_threads (id,host_id,author_user_id,title,author_display_mode,author_label,content) VALUES (?,?,?,?,?,?,?)").bind(id, parsed.data.hostId, viewer.actor.id, parsed.data.title, parsed.data.displayMode, label, parsed.data.content),
    getD1().prepare("INSERT INTO forum_posts (id,thread_id,author_user_id,author_display_mode,author_label,content_markdown) VALUES (?,?,?,?,?,?)").bind(secureId("post"), id, viewer.actor.id, parsed.data.displayMode, label, parsed.data.content),
    getD1().prepare("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,after_state,request_metadata) VALUES (?,?,?,?,?,?,?,?)").bind(secureId("audit"), viewer.actor.id, gmPost ? "NPC_THREAD_CREATED" : "THREAD_CREATED", "ForumThread", id, `Created thread ${parsed.data.title}`, JSON.stringify({ hostId: parsed.data.hostId, displayMode: parsed.data.displayMode }), requestSummary(request)),
  ]);
  return { id };
}

export async function replyThread(viewer: ViewerContext, input: unknown, request?: Request) {
  assertMutable(viewer);
  const parsed = z.object({ threadId: z.string().min(1), content: z.string().trim().min(2).max(8000) }).safeParse(input);
  if (!parsed.success) throw new CampaignError("Invalid reply.", 422, "INVALID_REPLY");
  if (viewer.effectiveUser.postingRestricted) throw new CampaignError("Posting is restricted on this account.", 403, "POSTING_RESTRICTED");
  const forumManager = canManageForum(viewer.actor);
  const thread = await getD1().prepare(`SELECT thread.*,host.hidden AS host_hidden,host.active AS host_active,
      host.min_reputation AS host_min_reputation,host.min_clearance_rank AS host_min_clearance_rank,
      host.read_permission AS host_read_permission,host.reply_permission AS host_reply_permission
    FROM forum_threads thread JOIN matrix_hosts host ON host.id=thread.host_id
    WHERE thread.id=? AND thread.deleted_at IS NULL AND host.deleted_at IS NULL`).bind(parsed.data.threadId).first<Record<string, unknown>>();
  if (!thread || Boolean(thread.locked)) throw new CampaignError("Thread is locked or unavailable.", 409, "THREAD_LOCKED");
  const hostAccess = {
    active: Boolean(thread.host_active),
    hidden: Boolean(thread.host_hidden),
    minReputation: Number(thread.host_min_reputation ?? 0),
    minClearanceRank: Number(thread.host_min_clearance_rank ?? 0),
  };
  if (!forumManager && (
    !allowsPlayers(thread.host_read_permission)
    || !allowsPlayers(thread.host_reply_permission)
    || !canViewHost(viewer.effectiveUser, hostAccess)
    || !canViewThread(viewer.effectiveUser, accessShape(thread))
  )) throw new CampaignError("Thread access denied.", 403, "THREAD_RESTRICTED");
  const id = secureId("post");
  await getD1().batch([
    getD1().prepare("INSERT INTO forum_posts (id,thread_id,author_user_id,author_display_mode,content_markdown) VALUES (?,?,?,'PLAYER_ALIAS',?)").bind(id, parsed.data.threadId, viewer.effectiveUser.id, parsed.data.content),
    getD1().prepare("UPDATE forum_threads SET updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(parsed.data.threadId),
    getD1().prepare("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,request_metadata) VALUES (?,?,?,?,?,?,?)").bind(secureId("audit"), viewer.actor.id, "FORUM_REPLY_CREATED", "ForumPost", id, `Replied to ${parsed.data.threadId}`, requestSummary(request)),
  ]);
  return { id };
}

export function isGmSurface(user: CampaignUser): boolean {
  return user.roles.includes("GAME_MASTER") || user.permissions.some((permission) => permission.startsWith("manage_") || permission === "view_audit");
}

export function canOpenGmRoute(viewer: ViewerContext, path: string): boolean {
  if (viewer.isPreview) return false;
  if (viewer.actor.roles.includes("GAME_MASTER")) return true;
  if (!path.startsWith("gm")) return true;
  if (path === "gm") return isGmSurface(viewer.actor);
  if (path.startsWith("gm/players") || path.startsWith("gm/characters")) return canManagePlayers(viewer.actor);
  if (path.startsWith("gm/products") || path.startsWith("gm/vendors")) return canManageProducts(viewer.actor);
  if (path.startsWith("gm/jobs")) return canManageJobs(viewer.actor);
  if (path.startsWith("gm/board")) return canManageForum(viewer.actor) && canSendNpcMessages(viewer.actor);
  if (path.startsWith("gm/hosts")) return canManageForum(viewer.actor);
  if (path.startsWith("gm/orders")) return canManageOrders(viewer.actor);
  if (path.startsWith("gm/inventories")) return canManagePlayers(viewer.actor) || canAdjustBalance(viewer.actor);
  if (path.startsWith("gm/messages")) return canSendNpcMessages(viewer.actor);
  if (path.startsWith("gm/announcements")) return canManageAnnouncements(viewer.actor);
  if (path.startsWith("gm/settings")) return canManageSettings(viewer.actor);
  if (path.startsWith("gm/contacts")) return false;
  if (path.startsWith("gm/economy")) return canAdjustBalance(viewer.actor);
  if (path.startsWith("gm/audit")) return canViewAudit(viewer.actor);
  return false;
}
