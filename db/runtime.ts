import { env } from "cloudflare:workers";
import migrationSql from "../drizzle/0000_next_mandrill.sql?raw";

let readiness: Promise<void> | undefined;

export function getD1(): D1Database {
  const workerEnv = env as unknown as { DB?: D1Database };
  if (!workerEnv.DB) throw new Error("ShadowGrid database binding DB is unavailable.");
  return workerEnv.DB;
}

async function executeInChunks(db: D1Database, statements: string[], size = 35): Promise<void> {
  for (let index = 0; index < statements.length; index += size) {
    await db.batch(statements.slice(index, index + size).map((statement) => db.prepare(statement)));
  }
}

async function initializeSchema(): Promise<void> {
  const db = getD1();
  const statements = migrationSql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) =>
      statement
        .replace(/^CREATE TABLE /u, "CREATE TABLE IF NOT EXISTS ")
        .replace(/^CREATE UNIQUE INDEX /u, "CREATE UNIQUE INDEX IF NOT EXISTS ")
        .replace(/^CREATE INDEX /u, "CREATE INDEX IF NOT EXISTS "),
    );
  await executeInChunks(db, statements);

  await db.batch([
    db.prepare(`CREATE TRIGGER IF NOT EXISTS currency_balance_nonnegative
      BEFORE UPDATE OF balance ON currency_accounts
      WHEN NEW.balance < 0
      BEGIN SELECT RAISE(ABORT, 'INSUFFICIENT_FUNDS'); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS product_stock_nonnegative
      BEFORE UPDATE OF stock ON products
      WHEN NEW.unlimited_stock = 0 AND NEW.stock < 0
      BEGIN SELECT RAISE(ABORT, 'INSUFFICIENT_STOCK'); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS player_reputation_range
      BEFORE UPDATE OF street_reputation ON player_profiles
      WHEN NEW.street_reputation < -100 OR NEW.street_reputation > 100
      BEGIN SELECT RAISE(ABORT, 'REPUTATION_OUT_OF_RANGE'); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS order_item_access_guard
      BEFORE INSERT ON order_items
      WHEN NOT EXISTS (
        SELECT 1
        FROM products product
        JOIN orders purchase_order ON purchase_order.id = NEW.order_id
        JOIN users buyer ON buyer.id = purchase_order.user_id
        JOIN player_profiles profile ON profile.user_id = buyer.id
        JOIN matrix_clearances clearance ON clearance.id = profile.clearance_id
        WHERE product.id = NEW.product_id
          AND product.vendor_id = purchase_order.vendor_id
          AND product.active = 1
          AND product.hidden = 0
          AND product.deleted_at IS NULL
          AND (product.expires_at IS NULL OR product.expires_at > CURRENT_TIMESTAMP)
          AND product.price = NEW.unit_price
          AND profile.purchasing_restricted = 0
          AND buyer.enabled = 1
          AND profile.street_reputation >= product.min_reputation
          AND clearance.rank >= product.min_clearance_rank
          AND (product.faction_id IS NULL OR product.faction_id = profile.faction_id)
          AND NOT EXISTS (
            SELECT 1 FROM product_access_rules denied
            WHERE denied.product_id = product.id
              AND denied.effect = 'DENY'
              AND (denied.user_id IS NULL OR denied.user_id = buyer.id)
          )
          AND (
            NOT EXISTS (
              SELECT 1 FROM product_access_rules scoped
              WHERE scoped.product_id = product.id AND scoped.rule_type = 'PLAYER' AND scoped.effect = 'ALLOW'
            )
            OR EXISTS (
              SELECT 1 FROM product_access_rules allowed
              WHERE allowed.product_id = product.id AND allowed.user_id = buyer.id AND allowed.effect = 'ALLOW'
            )
          )
      )
      BEGIN SELECT RAISE(ABORT, 'PRODUCT_NOT_PURCHASABLE'); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS order_terminal_guard
      BEFORE UPDATE OF status ON orders
      WHEN OLD.status NOT IN ('AWAITING GM', 'PENDING')
      BEGIN SELECT RAISE(ABORT, 'ORDER_ALREADY_PROCESSED'); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS audit_logs_immutable_update
      BEFORE UPDATE ON audit_logs
      BEGIN SELECT RAISE(ABORT, 'AUDIT_LOG_IMMUTABLE'); END`),
    db.prepare(`CREATE TRIGGER IF NOT EXISTS audit_logs_immutable_delete
      BEFORE DELETE ON audit_logs
      BEGIN SELECT RAISE(ABORT, 'AUDIT_LOG_IMMUTABLE'); END`),
  ]);
}

export async function ensureCampaignReady(): Promise<void> {
  if (!readiness) {
    readiness = (async () => {
      await initializeSchema();
      const { seedCampaignIfEmpty } = await import("./seed");
      const workerEnv = env as unknown as { SHADOWGRID_BOOTSTRAP_PASSWORD?: string };
      await seedCampaignIfEmpty(getD1(), workerEnv.SHADOWGRID_BOOTSTRAP_PASSWORD);
    })().catch((error) => {
      readiness = undefined;
      throw error;
    });
  }
  return readiness;
}
