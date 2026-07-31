import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getViewerFromCookieHeader } from "../../lib/auth";
import { canOpenGmRoute, loadCampaignSnapshot, type CampaignSnapshot } from "../../lib/campaign";
import { LoginScreen, PublicNotice } from "../../components/LoginScreen";
import { ShadowGridApp } from "../../components/ShadowGridApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ShadowGrid // Rain City Host",
  description: "Private campaign Matrix host for runners and Game Masters.",
};

const publicPages = new Set(["login", "access-denied", "account-restricted", "maintenance"]);

function credentialOnlySnapshot(): CampaignSnapshot {
  return {
    campaignName: "RAIN CITY // CREDENTIAL GATE",
    campaignTime: "2080-11-18T04:17:00-08:00",
    announcements: [], hosts: [], threads: [], posts: [], jobs: [], products: [], vendors: [], contacts: [],
    orders: [], inventory: [], conversations: [], players: [], audit: [], ledger: [], clearances: [], factions: [], categories: [],
  };
}

export default async function ShadowGridRoute({ params }: { params: Promise<{ path?: string[] }> }) {
  const segments = (await params).path ?? [];
  const route = segments.join("/");
  if (!route) redirect("/login");
  if (publicPages.has(route)) {
    if (route === "login") return <LoginScreen />;
    if (route === "access-denied") return <PublicNotice code="ACCESS DENIED" title="Clearance does not match this node" body="The host disclosed no metadata. Return to a permitted route or contact your Game Master." />;
    if (route === "account-restricted") return <PublicNotice code="ACCOUNT RESTRICTED" title="Runner privileges have been limited" body="The campaign authority has restricted one or more account capabilities. Restrictions are configurable and may not affect login." />;
    return <PublicNotice code="HOST MAINTENANCE" title="Local relay temporarily sealed" body="Campaign data remains intact. The Game Master will restore the route when the host is ready." />;
  }
  const requestHeaders = await headers();
  const viewer = await getViewerFromCookieHeader(requestHeaders.get("cookie"));
  if (!viewer) redirect("/login");
  if (!viewer.isPreview && viewer.actor.forcePasswordChange && route !== "settings") redirect("/settings?password-change=required");
  if (!viewer.isPreview && viewer.actor.forcePasswordChange) {
    return <ShadowGridApp pathname="/settings" viewer={viewer} snapshot={credentialOnlySnapshot()} />;
  }
  if (route.startsWith("gm") && !canOpenGmRoute(viewer, route)) redirect("/access-denied");
  const snapshot = await loadCampaignSnapshot(viewer);
  return <ShadowGridApp pathname={`/${route}`} viewer={viewer} snapshot={snapshot} />;
}
