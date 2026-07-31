import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("defines the ShadowGrid access gateway without starter residue", async () => {
  const [gateway, layout, page, packageJson] = await Promise.all([
    readFile(new URL("../components/LoginScreen.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[[...path]]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /ShadowGrid \/\/ Rain City Host/i);
  assert.match(gateway, /SHADOW HOST HANDSHAKE/);
  assert.match(gateway, /PUBLIC REGISTRATION:\s*DISABLED/);
  assert.match(gateway, /Assigned handle/i);
  assert.match(page, /route === "login"/);
  assert.doesNotMatch(`${gateway}${layout}${page}${packageJson}`, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("defines the required relational campaign entities", async () => {
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  for (const entity of ["users", "playerProfiles", "characterProfiles", "roles", "permissions", "factions", "matrixHosts", "products", "orders", "transactions", "inventoryEntries", "jobs", "forumThreads", "forumPosts", "privateMessages", "announcements", "auditLogs", "sessions"]) {
    assert.match(schema, new RegExp(`export const ${entity}\\b`));
  }
  assert.match(schema, /uniqueIndex\("users_login_name_unique"\)/);
  assert.match(schema, /foreign key|references\(/i);
});

test("keeps purchase authority and atomic guards on the server", async () => {
  const [campaign, runtime, permissions] = await Promise.all([
    readFile(new URL("../lib/campaign.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/runtime.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/permissions.ts", import.meta.url), "utf8"),
  ]);
  assert.match(campaign, /const price = Number\(row\.price\)/);
  assert.match(campaign, /await db\.batch\(statements\)/);
  assert.match(campaign, /idempotencyKey/);
  assert.match(runtime, /INSUFFICIENT_FUNDS/);
  assert.match(runtime, /INSUFFICIENT_STOCK/);
  assert.match(runtime, /PRODUCT_NOT_PURCHASABLE/);
  assert.match(runtime, /AUDIT_LOG_IMMUTABLE/);
  assert.match(permissions, /canViewProduct/);
  assert.match(permissions, /canPurchaseProduct/);
});

test("ships effect controls and reduced-motion handling", async () => {
  const [app, css] = await Promise.all([
    readFile(new URL("../components/ShadowGridApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  for (const control of ["SCANLINES", "NOISE", "FLICKER", "BACKGROUND GRID", "REDUCED MOTION", "SOUND"]) assert.match(app, new RegExp(control));
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(app, /ctrlKey|metaKey/);
});

test("fails closed around owner bootstrap and cookie-authenticated mutations", async () => {
  const [seed, auth, route, config] = await Promise.all([
    readFile(new URL("../db/seed.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/[...action]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
  ]);
  assert.match(seed, /seed_version','3/);
  assert.match(seed, /user\.id === "user-gm" \? 1 : 0/);
  assert.match(seed, /crypto\.randomUUID\(\).*crypto\.randomUUID\(\)/s);
  assert.doesNotMatch(seed, /BlackIce!|GridGhost!/);
  assert.match(auth, /security\?\.value !== "3"/);
  assert.match(auth, /failed_login_count=failed_login_count\+1/);
  assert.match(route, /validateMutationRequest/);
  assert.match(route, /application\/json/);
  assert.match(route, /sec-fetch-site/);
  assert.match(config, /SHADOWGRID_BOOTSTRAP_PASSWORD/);
});
