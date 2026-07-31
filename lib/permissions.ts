export type AccessUser = {
  id: string;
  roles: string[];
  permissions: string[];
  enabled: boolean;
  streetReputation: number;
  clearanceRank: number;
  factionId: string | null;
  postingRestricted: boolean;
  messagingRestricted: boolean;
  purchasingRestricted: boolean;
};

export type AccessResource = {
  active?: boolean;
  hidden?: boolean;
  minReputation?: number;
  minClearanceRank?: number;
  factionId?: string | null;
  allowedUserIds?: string[];
  deniedUserIds?: string[];
  expiresAt?: string | null;
};

function isGameMaster(user: AccessUser): boolean {
  return user.roles.includes("GAME_MASTER");
}

function hasPermission(user: AccessUser, permission: string): boolean {
  return isGameMaster(user) || user.permissions.includes(permission);
}

function canViewRestrictedResource(user: AccessUser, resource: AccessResource): boolean {
  if (!user.enabled) return false;
  if (isGameMaster(user)) return true;
  if (resource.active === false || resource.hidden === true) return false;
  if (resource.expiresAt && new Date(resource.expiresAt).getTime() <= Date.now()) return false;
  if ((resource.deniedUserIds ?? []).includes(user.id)) return false;
  if ((resource.allowedUserIds?.length ?? 0) > 0 && !resource.allowedUserIds?.includes(user.id)) return false;
  if (user.streetReputation < (resource.minReputation ?? 0)) return false;
  if (user.clearanceRank < (resource.minClearanceRank ?? 0)) return false;
  if (resource.factionId && resource.factionId !== user.factionId) return false;
  return true;
}

export const canManagePlayers = (user: AccessUser) => hasPermission(user, "manage_players");
export const canManageProducts = (user: AccessUser) => hasPermission(user, "manage_products");
export const canManageEconomy = (user: AccessUser) => hasPermission(user, "manage_economy");
export const canManageForum = (user: AccessUser) => hasPermission(user, "manage_forum");
export const canManageJobs = (user: AccessUser) => hasPermission(user, "manage_jobs");
export const canManageOrders = (user: AccessUser) => hasPermission(user, "manage_orders");
export const canSendNpcMessages = (user: AccessUser) => hasPermission(user, "send_npc_messages");
export const canManageAnnouncements = (user: AccessUser) => hasPermission(user, "manage_announcements");
export const canManageSettings = (user: AccessUser) => hasPermission(user, "manage_settings");
export const canViewAudit = (user: AccessUser) => hasPermission(user, "view_audit");
export const canAdjustBalance = (user: AccessUser) => hasPermission(user, "manage_economy");
export const canGrantInventory = (user: AccessUser) => hasPermission(user, "manage_economy");
export const canViewHost = (user: AccessUser, host: AccessResource) => canViewRestrictedResource(user, host);
export const canViewThread = (user: AccessUser, thread: AccessResource) => canViewRestrictedResource(user, thread);
export const canViewProduct = (user: AccessUser, product: AccessResource) => canViewRestrictedResource(user, product);
export const canViewJob = (user: AccessUser, job: AccessResource) => canViewRestrictedResource(user, job);

export function canPurchaseProduct(user: AccessUser, product: AccessResource): boolean {
  return !user.purchasingRestricted && canViewRestrictedResource(user, product);
}

export function canSendMessage(user: AccessUser, recipient: AccessUser): boolean {
  if (!user.enabled || !recipient.enabled || user.messagingRestricted) return false;
  return true;
}

export function canPost(user: AccessUser): boolean {
  return user.enabled && !user.postingRestricted;
}
