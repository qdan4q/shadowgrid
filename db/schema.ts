import { sql } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = () => ({
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

const softDelete = () => ({ deletedAt: text("deleted_at") });

export const matrixClearances = sqliteTable("matrix_clearances", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  rank: integer("rank").notNull().unique(),
  color: text("color").notNull(),
  ...timestamps(),
});

export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  system: integer("system", { mode: "boolean" }).notNull().default(false),
  ...timestamps(),
});

export const permissions = sqliteTable("permissions", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  ...timestamps(),
});

export const factions = sqliteTable("factions", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  accent: text("accent").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  gmNotes: text("gm_notes"),
  ...timestamps(),
  ...softDelete(),
});

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    loginName: text("login_name").notNull(),
    runnerAlias: text("runner_alias").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    passwordIterations: integer("password_iterations").notNull().default(120000),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    forcePasswordChange: integer("force_password_change", { mode: "boolean" })
      .notNull()
      .default(false),
    temporaryPasswordExpiresAt: text("temporary_password_expires_at"),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: text("locked_until"),
    lastLoginAt: text("last_login_at"),
    avatarUrl: text("avatar_url"),
    gmNotes: text("gm_notes"),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    uniqueIndex("users_login_name_unique").on(table.loginName),
    uniqueIndex("users_runner_alias_unique").on(table.runnerAlias),
    index("users_enabled_idx").on(table.enabled),
  ],
);

export const userRoles = sqliteTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    grantedBy: text("granted_by").references(() => users.id, { onDelete: "set null" }),
    grantedAt: text("granted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })],
);

export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export const playerProfiles = sqliteTable("player_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  factionId: text("faction_id").references(() => factions.id, { onDelete: "set null" }),
  clearanceId: text("clearance_id")
    .notNull()
    .references(() => matrixClearances.id, { onDelete: "restrict" }),
  streetReputation: integer("street_reputation").notNull().default(0),
  notoriety: integer("notoriety").notNull().default(0),
  publicAwareness: integer("public_awareness").notNull().default(0),
  postingRestricted: integer("posting_restricted", { mode: "boolean" }).notNull().default(false),
  messagingRestricted: integer("messaging_restricted", { mode: "boolean" }).notNull().default(false),
  purchasingRestricted: integer("purchasing_restricted", { mode: "boolean" }).notNull().default(false),
  ...timestamps(),
});

export const characterProfiles = sqliteTable("character_profiles", {
  id: text("id").primaryKey(),
  playerProfileId: text("player_profile_id")
    .notNull()
    .unique()
    .references(() => playerProfiles.id, { onDelete: "cascade" }),
  characterName: text("character_name").notNull(),
  metatype: text("metatype").notNull(),
  archetype: text("archetype").notNull(),
  pronouns: text("pronouns"),
  biography: text("biography"),
  ...timestamps(),
});

export const factionRelationships = sqliteTable(
  "faction_relationships",
  {
    id: text("id").primaryKey(),
    playerProfileId: text("player_profile_id")
      .notNull()
      .references(() => playerProfiles.id, { onDelete: "cascade" }),
    factionId: text("faction_id")
      .notNull()
      .references(() => factions.id, { onDelete: "cascade" }),
    standing: integer("standing").notNull().default(0),
    status: text("status").notNull().default("NEUTRAL"),
    ...timestamps(),
  },
  (table) => [uniqueIndex("faction_relationship_unique").on(table.playerProfileId, table.factionId)],
);

export const reputationEvents = sqliteTable("reputation_events", {
  id: text("id").primaryKey(),
  playerProfileId: text("player_profile_id")
    .notNull()
    .references(() => playerProfiles.id, { onDelete: "cascade" }),
  beforeValue: integer("before_value").notNull(),
  afterValue: integer("after_value").notNull(),
  reason: text("reason").notNull(),
  actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const currencyAccounts = sqliteTable("currency_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  currency: text("currency").notNull().default("NUYEN"),
  balance: integer("balance").notNull().default(0),
  ...timestamps(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    previewUserId: text("preview_user_id").references(() => users.id, { onDelete: "set null" }),
    expiresAt: text("expires_at").notNull(),
    lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    revokedAt: text("revoked_at"),
  },
  (table) => [index("sessions_user_idx").on(table.userId), index("sessions_expires_idx").on(table.expiresAt)],
);

export const accountRestrictions = sqliteTable("account_restrictions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  restrictionType: text("restriction_type").notNull(),
  reason: text("reason").notNull(),
  startsAt: text("starts_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text("expires_at"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  liftedAt: text("lifted_at"),
  ...timestamps(),
});

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  alias: text("alias").notNull().unique(),
  type: text("type").notNull(),
  portraitUrl: text("portrait_url"),
  description: text("description").notNull(),
  factionId: text("faction_id").references(() => factions.id, { onDelete: "set null" }),
  location: text("location").notNull(),
  loyalty: integer("loyalty").notNull().default(1),
  connectionRating: integer("connection_rating").notNull().default(1),
  minReputation: integer("min_reputation").notNull().default(0),
  minClearanceRank: integer("min_clearance_rank").notNull().default(0),
  services: text("services").notNull().default("[]"),
  communicationChannel: text("communication_channel"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
  gmNotes: text("gm_notes"),
  ...timestamps(),
  ...softDelete(),
});

export const playerContacts = sqliteTable(
  "player_contacts",
  {
    id: text("id").primaryKey(),
    playerProfileId: text("player_profile_id")
      .notNull()
      .references(() => playerProfiles.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    loyalty: integer("loyalty").notNull().default(1),
    connectionRating: integer("connection_rating").notNull().default(1),
    relationshipNotes: text("relationship_notes"),
    unlockedAt: text("unlocked_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("player_contact_unique").on(table.playerProfileId, table.contactId)],
);

export const vendors = sqliteTable("vendors", {
  id: text("id").primaryKey(),
  contactId: text("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  vendorType: text("vendor_type").notNull(),
  description: text("description").notNull(),
  nodeAddress: text("node_address").notNull(),
  localTheme: text("local_theme").notNull().default("STREET"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
  gmNotes: text("gm_notes"),
  ...timestamps(),
  ...softDelete(),
});

export const productCategories = sqliteTable("product_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps(),
});

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    internalId: text("internal_id").notNull().unique(),
    listingCode: text("listing_code").notNull().unique(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    shortDescription: text("short_description").notNull(),
    fullDescription: text("full_description").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => productCategories.id, { onDelete: "restrict" }),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "restrict" }),
    price: integer("price").notNull(),
    negotiable: integer("negotiable", { mode: "boolean" }).notNull().default(false),
    stock: integer("stock").notNull().default(0),
    unlimitedStock: integer("unlimited_stock", { mode: "boolean" }).notNull().default(false),
    condition: text("condition").notNull().default("NEW"),
    rarity: text("rarity").notNull().default("COMMON"),
    legality: text("legality").notNull().default("LEGAL"),
    availability: text("availability").notNull().default("IMMEDIATE"),
    rating: integer("rating"),
    minReputation: integer("min_reputation").notNull().default(0),
    minClearanceRank: integer("min_clearance_rank").notNull().default(0),
    factionId: text("faction_id").references(() => factions.id, { onDelete: "set null" }),
    requiresGmApproval: integer("requires_gm_approval", { mode: "boolean" }).notNull().default(false),
    hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    expiresAt: text("expires_at"),
    customMetadata: text("custom_metadata").notNull().default("{}"),
    gmNotes: text("gm_notes"),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    index("products_visibility_idx").on(table.active, table.hidden),
    index("products_access_idx").on(table.minClearanceRank, table.minReputation),
    index("products_vendor_idx").on(table.vendorId),
  ],
);

export const productImages = sqliteTable("product_images", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: text("alt_text").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const productAccessRules = sqliteTable("product_access_rules", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  ruleType: text("rule_type").notNull(),
  factionId: text("faction_id").references(() => factions.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  contactId: text("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  jobId: text("job_id"),
  effect: text("effect").notNull().default("ALLOW"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const carts = sqliteTable("carts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  ...timestamps(),
});

export const cartItems = sqliteTable(
  "cart_items",
  {
    id: text("id").primaryKey(),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    ...timestamps(),
  },
  (table) => [uniqueIndex("cart_product_unique").on(table.cartId, table.productId)],
);

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  johnsonAlias: text("johnson_alias").notNull(),
  fixerContactId: text("fixer_contact_id").references(() => contacts.id, { onDelete: "set null" }),
  shortBriefing: text("short_briefing").notNull(),
  fullBriefing: text("full_briefing").notNull(),
  location: text("location").notNull(),
  danger: text("danger").notNull(),
  payment: integer("payment").notNull(),
  advancePayment: integer("advance_payment").notNull().default(0),
  minReputation: integer("min_reputation").notNull().default(0),
  minClearanceRank: integer("min_clearance_rank").notNull().default(0),
  factionId: text("faction_id").references(() => factions.id, { onDelete: "set null" }),
  maxParticipants: integer("max_participants").notNull().default(4),
  applicationDeadline: text("application_deadline"),
  missionDate: text("mission_date"),
  status: text("status").notNull().default("RUMORED"),
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
  gmNotes: text("gm_notes"),
  ...timestamps(),
  ...softDelete(),
});

export const jobAssignments = sqliteTable(
  "job_assignments",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("ASSIGNED"),
    assignedAt: text("assigned_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    completedAt: text("completed_at"),
  },
  (table) => [uniqueIndex("job_assignment_unique").on(table.jobId, table.userId)],
);

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    orderCode: text("order_code").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("PENDING"),
    total: integer("total").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    gmNotes: text("gm_notes"),
    approvedBy: text("approved_by").references(() => users.id, { onDelete: "set null" }),
    approvedAt: text("approved_at"),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [index("orders_user_idx").on(table.userId), index("orders_status_idx").on(table.status)],
);

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  productName: text("product_name").notNull(),
  listingCode: text("listing_code").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  lineTotal: integer("line_total").notNull(),
});

export const inventoryItems = sqliteTable("inventory_items", {
  id: text("id").primaryKey(),
  productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  uniqueItem: integer("unique_item", { mode: "boolean" }).notNull().default(false),
  metadata: text("metadata").notNull().default("{}"),
  ...timestamps(),
});

export const inventoryEntries = sqliteTable(
  "inventory_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    inventoryItemId: text("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(1),
    condition: text("condition").notNull().default("NEW"),
    equipped: integer("equipped", { mode: "boolean" }).notNull().default(false),
    concealed: integer("concealed", { mode: "boolean" }).notNull().default(false),
    acquisitionSource: text("acquisition_source").notNull(),
    acquisitionDate: text("acquisition_date").notNull().default(sql`CURRENT_TIMESTAMP`),
    relatedOrderId: text("related_order_id").references(() => orders.id, { onDelete: "set null" }),
    customName: text("custom_name"),
    customDescription: text("custom_description"),
    customMetadata: text("custom_metadata").notNull().default("{}"),
    playerNotes: text("player_notes"),
    gmNotes: text("gm_notes"),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [index("inventory_user_idx").on(table.userId)],
);

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("NUYEN"),
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  reason: text("reason").notNull(),
  relatedOrderId: text("related_order_id").references(() => orders.id, { onDelete: "set null" }),
  relatedJobId: text("related_job_id").references(() => jobs.id, { onDelete: "set null" }),
  performedBy: text("performed_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const forumCategories = sqliteTable("forum_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps(),
});

export const matrixHosts = sqliteTable("matrix_hosts", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").references(() => forumCategories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  nodeAddress: text("node_address").notNull().unique(),
  icon: text("icon").notNull(),
  visualTheme: text("visual_theme").notNull(),
  owner: text("owner").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
  minReputation: integer("min_reputation").notNull().default(0),
  minClearanceRank: integer("min_clearance_rank").notNull().default(0),
  readPermission: text("read_permission").notNull().default("PLAYER"),
  threadPermission: text("thread_permission").notNull().default("PLAYER"),
  replyPermission: text("reply_permission").notNull().default("PLAYER"),
  ...timestamps(),
  ...softDelete(),
});

export const hostAccessRules = sqliteTable("host_access_rules", {
  id: text("id").primaryKey(),
  hostId: text("host_id")
    .notNull()
    .references(() => matrixHosts.id, { onDelete: "cascade" }),
  ruleType: text("rule_type").notNull(),
  factionId: text("faction_id").references(() => factions.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id").references(() => roles.id, { onDelete: "cascade" }),
  effect: text("effect").notNull().default("ALLOW"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const playerUnlocks = sqliteTable("player_unlocks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  reason: text("reason").notNull(),
  grantedBy: text("granted_by").references(() => users.id, { onDelete: "set null" }),
  grantedAt: text("granted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text("expires_at"),
});

export const forumThreads = sqliteTable(
  "forum_threads",
  {
    id: text("id").primaryKey(),
    hostId: text("host_id")
      .notNull()
      .references(() => matrixHosts.id, { onDelete: "restrict" }),
    authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    authorDisplayMode: text("author_display_mode").notNull().default("PLAYER_ALIAS"),
    authorLabel: text("author_label"),
    content: text("content").notNull(),
    viewCount: integer("view_count").notNull().default(0),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    locked: integer("locked", { mode: "boolean" }).notNull().default(false),
    hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
    anonymous: integer("anonymous", { mode: "boolean" }).notNull().default(false),
    encrypted: integer("encrypted", { mode: "boolean" }).notNull().default(false),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    minReputation: integer("min_reputation").notNull().default(0),
    minClearanceRank: integer("min_clearance_rank").notNull().default(0),
    factionId: text("faction_id").references(() => factions.id, { onDelete: "set null" }),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [index("threads_host_idx").on(table.hostId, table.pinned, table.updatedAt)],
);

export const forumPosts = sqliteTable("forum_posts", {
  id: text("id").primaryKey(),
  threadId: text("thread_id")
    .notNull()
    .references(() => forumThreads.id, { onDelete: "cascade" }),
  authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
  parentPostId: text("parent_post_id").references((): AnySQLiteColumn => forumPosts.id, { onDelete: "set null" }),
  authorDisplayMode: text("author_display_mode").notNull().default("PLAYER_ALIAS"),
  authorLabel: text("author_label"),
  contentMarkdown: text("content_markdown").notNull(),
  editHistory: text("edit_history").notNull().default("[]"),
  editedAt: text("edited_at"),
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
  deletedAt: text("deleted_at"),
  ...timestamps(),
});

export const forumTags = sqliteTable("forum_tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  color: text("color").notNull(),
});

export const forumThreadTags = sqliteTable(
  "forum_thread_tags",
  {
    threadId: text("thread_id")
      .notNull()
      .references(() => forumThreads.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => forumTags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.threadId, table.tagId] })],
);

export const savedThreads = sqliteTable(
  "saved_threads",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: text("thread_id")
      .notNull()
      .references(() => forumThreads.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.threadId] })],
);

export const watchedThreads = sqliteTable(
  "watched_threads",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: text("thread_id")
      .notNull()
      .references(() => forumThreads.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.threadId] })],
);

export const privateConversations = sqliteTable("private_conversations", {
  id: text("id").primaryKey(),
  subject: text("subject").notNull(),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps(),
  ...softDelete(),
});

export const conversationParticipants = sqliteTable(
  "conversation_participants",
  {
    conversationId: text("conversation_id")
      .notNull()
      .references(() => privateConversations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    unreadCount: integer("unread_count").notNull().default(0),
    muted: integer("muted", { mode: "boolean" }).notNull().default(false),
    archivedAt: text("archived_at"),
  },
  (table) => [primaryKey({ columns: [table.conversationId, table.userId] })],
);

export const privateMessages = sqliteTable("private_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => privateConversations.id, { onDelete: "cascade" }),
  senderUserId: text("sender_user_id").references(() => users.id, { onDelete: "set null" }),
  sourceIdentity: text("source_identity").notNull().default("PLAYER"),
  sourceLabel: text("source_label"),
  bodyMarkdown: text("body_markdown").notNull(),
  attachments: text("attachments").notNull().default("[]"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text("deleted_at"),
});

export const chatRooms = sqliteTable("chat_rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  minClearanceRank: integer("min_clearance_rank").notNull().default(0),
  factionId: text("faction_id").references(() => factions.id, { onDelete: "set null" }),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps(),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => chatRooms.id, { onDelete: "cascade" }),
  senderUserId: text("sender_user_id").references(() => users.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text("deleted_at"),
});

export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  severity: text("severity").notNull().default("INFO"),
  sourceIdentity: text("source_identity").notNull().default("SYSTEM"),
  sourceLabel: text("source_label"),
  factionId: text("faction_id").references(() => factions.id, { onDelete: "set null" }),
  targetUserId: text("target_user_id").references(() => users.id, { onDelete: "cascade" }),
  minClearanceRank: integer("min_clearance_rank").notNull().default(0),
  startsAt: text("starts_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text("expires_at"),
  dismissible: integer("dismissible", { mode: "boolean" }).notNull().default(true),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps(),
  ...softDelete(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  readAt: text("read_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const campaignSettings = sqliteTable("campaign_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  valueType: text("value_type").notNull().default("STRING"),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps(),
});

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    summary: text("summary").notNull(),
    beforeState: text("before_state"),
    afterState: text("after_state"),
    requestMetadata: text("request_metadata"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("audit_created_idx").on(table.createdAt), index("audit_actor_idx").on(table.actorUserId)],
);
