import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getViewerFromCookieHeader } from "../../lib/auth";
import { canOpenGmRoute, loadCampaignSnapshot } from "../../lib/campaign";
import { LoginScreen, PublicNotice } from "../../components/LoginScreen";
import { DesignLab } from "../../components/DesignLab";
import { BlackIceCathedral } from "../../components/BlackIceCathedral";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ShadowGrid // Хост Дождливого города",
  description: "Частный хост Матрицы для раннеров и Мастеров игры.",
};

const publicPages = new Set(["login", "design-lab", "access-denied", "account-restricted", "maintenance"]);

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
  if (route.startsWith("gm") && !canOpenGmRoute(viewer, route)) redirect("/access-denied");
  const snapshot = await loadCampaignSnapshot(viewer);
  return <BlackIceCathedral pathname={`/${route}`} viewer={viewer} snapshot={snapshot} />;
}
