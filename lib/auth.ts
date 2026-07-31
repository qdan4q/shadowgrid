import { ensureCampaignReady, getD1 } from "../db/runtime";
import { createSessionToken, hashPassword, hashToken, secureId, verifyPassword } from "./security";
import type { AccessUser } from "./permissions";

export const SESSION_COOKIE = "shadowgrid_session";
const SESSION_HOURS = 12;
const transientLoginThrottle = new Map<string, { failures: number; lockedUntil: number }>();
let dummyCredential: Promise<{ hash: string; salt: string; iterations: number }> | undefined;

function throttleKey(loginName: string, clientAddress: string): string {
  return `${clientAddress.slice(0, 96)}|${loginName}`;
}

function isTransientlyLocked(key: string): boolean {
  const entry = transientLoginThrottle.get(key);
  if (!entry) return false;
  if (entry.lockedUntil > Date.now()) return true;
  if (entry.lockedUntil) transientLoginThrottle.delete(key);
  return false;
}

function recordTransientFailure(key: string): void {
  const previous = transientLoginThrottle.get(key);
  const failures = (previous?.failures ?? 0) + 1;
  transientLoginThrottle.set(key, { failures, lockedUntil: failures >= 5 ? Date.now() + 15 * 60_000 : 0 });
  if (transientLoginThrottle.size > 2_000) {
    const now = Date.now();
    for (const [candidate, value] of transientLoginThrottle) {
      if (!value.lockedUntil || value.lockedUntil <= now) transientLoginThrottle.delete(candidate);
      if (transientLoginThrottle.size <= 1_500) break;
    }
  }
}

async function runDummyPasswordCheck(password: string): Promise<void> {
  dummyCredential ??= hashPassword("SHADOWGRID DUMMY CREDENTIAL - NO ACCOUNT");
  const credential = await dummyCredential;
  await verifyPassword(password, credential.hash, credential.salt, credential.iterations);
}

export type CampaignUser = AccessUser & {
  loginName: string;
  runnerAlias: string;
  characterName: string | null;
  metatype: string | null;
  archetype: string | null;
  factionName: string | null;
  clearanceKey: string;
  clearanceLabel: string;
  nuyen: number;
  notoriety: number;
  publicAwareness: number;
  forcePasswordChange: boolean;
};

export type ViewerContext = {
  sessionId: string;
  actor: CampaignUser;
  effectiveUser: CampaignUser;
  isPreview: boolean;
};

type UserRow = {
  id: string;
  login_name: string;
  runner_alias: string;
  enabled: number;
  force_password_change: number;
  character_name: string | null;
  metatype: string | null;
  archetype: string | null;
  faction_id: string | null;
  faction_name: string | null;
  clearance_key: string | null;
  clearance_label: string | null;
  clearance_rank: number | null;
  street_reputation: number | null;
  notoriety: number | null;
  public_awareness: number | null;
  posting_restricted: number | null;
  messaging_restricted: number | null;
  purchasing_restricted: number | null;
  balance: number | null;
};

function parseCsv(value: string | null | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

async function loadCampaignUser(userId: string): Promise<CampaignUser | null> {
  const db = getD1();
  const row = await db.prepare(`SELECT
      user.id, user.login_name, user.runner_alias, user.enabled, user.force_password_change,
      character.character_name, character.metatype, character.archetype,
      profile.faction_id, faction.name AS faction_name,
      clearance.key AS clearance_key, clearance.label AS clearance_label, clearance.rank AS clearance_rank,
      profile.street_reputation, profile.notoriety, profile.public_awareness,
      profile.posting_restricted, profile.messaging_restricted, profile.purchasing_restricted,
      account.balance
    FROM users user
    LEFT JOIN player_profiles profile ON profile.user_id = user.id
    LEFT JOIN character_profiles character ON character.player_profile_id = profile.id
    LEFT JOIN factions faction ON faction.id = profile.faction_id
    LEFT JOIN matrix_clearances clearance ON clearance.id = profile.clearance_id
    LEFT JOIN currency_accounts account ON account.user_id = user.id
    WHERE user.id = ? AND user.deleted_at IS NULL`).bind(userId).first<UserRow>();
  if (!row) return null;
  const roleResult = await db.prepare("SELECT GROUP_CONCAT(role.key) AS value FROM user_roles ur JOIN roles role ON role.id = ur.role_id WHERE ur.user_id = ?").bind(userId).first<{ value: string | null }>();
  const permissionResult = await db.prepare("SELECT GROUP_CONCAT(DISTINCT permission.key) AS value FROM user_roles ur JOIN role_permissions rp ON rp.role_id = ur.role_id JOIN permissions permission ON permission.id = rp.permission_id WHERE ur.user_id = ?").bind(userId).first<{ value: string | null }>();
  return {
    id: row.id,
    loginName: row.login_name,
    runnerAlias: row.runner_alias,
    enabled: Boolean(row.enabled),
    forcePasswordChange: Boolean(row.force_password_change),
    roles: parseCsv(roleResult?.value),
    permissions: parseCsv(permissionResult?.value),
    characterName: row.character_name,
    metatype: row.metatype,
    archetype: row.archetype,
    factionId: row.faction_id,
    factionName: row.faction_name,
    clearanceKey: row.clearance_key ?? "ROOT",
    clearanceLabel: row.clearance_label ?? "Root",
    clearanceRank: row.clearance_rank ?? 5,
    streetReputation: row.street_reputation ?? 0,
    notoriety: row.notoriety ?? 0,
    publicAwareness: row.public_awareness ?? 0,
    postingRestricted: Boolean(row.posting_restricted),
    messagingRestricted: Boolean(row.messaging_restricted),
    purchasingRestricted: Boolean(row.purchasing_restricted),
    nuyen: row.balance ?? 0,
  };
}

export function readSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const pair of cookieHeader.split(";")) {
    const [name, ...rest] = pair.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function getViewerFromCookieHeader(cookieHeader: string | null): Promise<ViewerContext | null> {
  await ensureCampaignReady();
  const security = await getD1().prepare("SELECT value FROM campaign_settings WHERE key='seed_version'").first<{ value: string }>();
  if (security?.value !== "3") return null;
  const token = readSessionToken(cookieHeader);
  if (!token) return null;
  const tokenHash = await hashToken(token);
  const session = await getD1().prepare(`SELECT id,user_id,preview_user_id,expires_at
      FROM sessions
      WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP`).bind(tokenHash).first<{
    id: string;
    user_id: string;
    preview_user_id: string | null;
    expires_at: string;
  }>();
  if (!session) return null;
  const actor = await loadCampaignUser(session.user_id);
  if (!actor?.enabled) return null;
  const mayPreview = actor.roles.includes("GAME_MASTER") || actor.permissions.includes("manage_players");
  const effectiveUser = session.preview_user_id && mayPreview
    ? await loadCampaignUser(session.preview_user_id)
    : actor;
  if (!effectiveUser?.enabled) return { sessionId: session.id, actor, effectiveUser: actor, isPreview: false };
  getD1().prepare("UPDATE sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?").bind(session.id).run().catch(() => undefined);
  return { sessionId: session.id, actor, effectiveUser, isPreview: effectiveUser.id !== actor.id };
}

export async function authenticate(loginName: string, password: string, clientAddress = "unknown"): Promise<
  | { ok: true; token: string; user: CampaignUser }
  | { ok: false; status: number; message: string }
> {
  await ensureCampaignReady();
  const security = await getD1().prepare("SELECT value FROM campaign_settings WHERE key='seed_version'").first<{ value: string }>();
  if (security?.value !== "3") {
    return { ok: false, status: 503, message: "Owner bootstrap is locked. Configure SHADOWGRID_BOOTSTRAP_PASSWORD and restart the host." };
  }
  const normalized = loginName.trim().toLowerCase();
  const transientKey = throttleKey(normalized, clientAddress);
  if (isTransientlyLocked(transientKey)) return { ok: false, status: 429, message: "Too many failed handshakes. Try again after the lockout window." };
  const db = getD1();
  const row = await db.prepare(`SELECT id,password_hash,password_salt,password_iterations,enabled,
      temporary_password_expires_at,failed_login_count,locked_until
    FROM users WHERE LOWER(login_name) = ? AND deleted_at IS NULL`).bind(normalized).first<{
    id: string;
    password_hash: string;
    password_salt: string;
    password_iterations: number;
    enabled: number;
    temporary_password_expires_at: string | null;
    failed_login_count: number;
    locked_until: string | null;
  }>();
  const generic = { ok: false as const, status: 401, message: "Assigned handle or passcode rejected." };
  if (!row) {
    await runDummyPasswordCheck(password);
    recordTransientFailure(transientKey);
    return generic;
  }
  if (!row.enabled) return { ok: false, status: 403, message: "This account is disabled. Contact the Game Master." };
  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    return { ok: false, status: 429, message: "Too many failed handshakes. Try again after the lockout window." };
  }
  if (row.temporary_password_expires_at && new Date(row.temporary_password_expires_at).getTime() <= Date.now()) {
    return { ok: false, status: 403, message: "Temporary passcode expired. Ask the Game Master for a reset." };
  }
  const valid = await verifyPassword(password, row.password_hash, row.password_salt, row.password_iterations);
  if (!valid) {
    await db.prepare(`UPDATE users SET
        failed_login_count=failed_login_count+1,
        locked_until=CASE WHEN failed_login_count+1>=5 THEN strftime('%Y-%m-%dT%H:%M:%fZ','now','+15 minutes') ELSE locked_until END,
        updated_at=CURRENT_TIMESTAMP
      WHERE id=?`).bind(row.id).run();
    const failureState = await db.prepare("SELECT failed_login_count,locked_until FROM users WHERE id=?").bind(row.id).first<{ failed_login_count: number; locked_until: string | null }>();
    recordTransientFailure(transientKey);
    return (failureState?.failed_login_count ?? 0) >= 5 ? { ok: false, status: 429, message: "Handshake throttled for fifteen minutes." } : generic;
  }
  transientLoginThrottle.delete(transientKey);
  await db.prepare("UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(row.id).run();
  const token = createSessionToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60_000).toISOString();
  const sessionId = secureId("session");
  await db.prepare("INSERT INTO sessions (id,user_id,token_hash,expires_at) VALUES (?,?,?,?)").bind(sessionId, row.id, tokenHash, expiresAt).run();
  const user = await loadCampaignUser(row.id);
  if (!user) return generic;
  return { ok: true, token, user };
}

export async function revokeSession(viewer: ViewerContext): Promise<void> {
  await getD1().prepare("UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?").bind(viewer.sessionId).run();
}

export async function setPreviewUser(viewer: ViewerContext, userId: string | null): Promise<void> {
  const mayPreview = viewer.actor.roles.includes("GAME_MASTER") || viewer.actor.permissions.includes("manage_players");
  if (!mayPreview) throw new Error("FORBIDDEN");
  if (userId) {
    const target = await loadCampaignUser(userId);
    if (!target || !target.roles.includes("PLAYER")) throw new Error("PLAYER_NOT_FOUND");
  }
  await getD1().batch([
    getD1().prepare("UPDATE sessions SET preview_user_id = ? WHERE id = ?").bind(userId, viewer.sessionId),
    getD1().prepare("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,after_state) VALUES (?,?,?,?,?,?,?)")
      .bind(secureId("audit"), viewer.actor.id, userId ? "PREVIEW_ENTERED" : "PREVIEW_EXITED", "User", userId, userId ? `Entered read-only preview for ${userId}` : "Exited player preview", JSON.stringify({ previewUserId: userId })),
  ]);
}

export function sessionCookie(token: string, requestUrl: string): string {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_HOURS * 60 * 60}${secure}`;
}

export function expiredSessionCookie(requestUrl: string): string {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
