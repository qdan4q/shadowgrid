import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getViewerFromCookieHeader } from "../../lib/auth";
import { canOpenGmRoute, loadCampaignSnapshot, type CampaignSnapshot } from "../../lib/campaign";
import { LoginScreen, PublicNotice } from "../../components/LoginScreen";
import { DesignLab } from "../../components/DesignLab";
import { ShadowGridApp } from "../../components/ShadowGridApp";
import { ZeroTerm } from "../../components/ZeroTerm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ZERO/TERM // ShadowGrid",
  description: "Чистая текстовая BBS без публичного грида, SIN и корпоративных журналов.",
};

const publicPages = new Set(["login", "design-lab", "access-denied", "account-restricted", "maintenance"]);

function credentialOnlySnapshot(): CampaignSnapshot {
  return {
    campaignName: "ДОЖДЛИВЫЙ ГОРОД // ШЛЮЗ ДОСТУПА",
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
    if (route === "design-lab") return <DesignLab />;
    if (route === "access-denied") return <PublicNotice code="ДОСТУП ЗАПРЕЩЁН" title="Уровень допуска не соответствует этому узлу" body="Хост не раскрыл метаданные. Вернитесь на разрешённый маршрут или свяжитесь с Мастером игры." />;
    if (route === "account-restricted") return <PublicNotice code="АККАУНТ ОГРАНИЧЕН" title="Привилегии раннера ограничены" body="Администрация хоста ограничила одну или несколько возможностей аккаунта. Статус допуска не обязательно запрещает вход." />;
    return <PublicNotice code="ОБСЛУЖИВАНИЕ ХОСТА" title="Локальный ретранслятор временно изолирован" body="Данные узла сохранены. Администратор восстановит маршрут после завершения диагностики." />;
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
  return <ZeroTerm pathname={`/${route}`} viewer={viewer} snapshot={snapshot} />;
}
