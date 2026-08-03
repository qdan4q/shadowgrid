import { NextResponse } from "next/server";
import { authenticate, expiredSessionCookie, getViewerFromCookieHeader, revokeSession, sessionCookie, setPreviewUser } from "../../../lib/auth";
import {
  CampaignError,
  adjustPlayer,
  changeOwnPassword,
  createHost,
  createPlayer,
  createProduct,
  createThread,
  createVendor,
  processOrder,
  purchaseProduct,
  replyThread,
  toggleProduct,
} from "../../../lib/campaign";
import { ensureCampaignReady, getD1 } from "../../../db/runtime";

function actionFromRequest(request: Request): string {
  return new URL(request.url).pathname.replace(/^\/api\//u, "").replace(/\/$/u, "");
}

async function bodyFromRequest(request: Request): Promise<unknown> {
  return request.json();
}

function json(payload: unknown, status = 200): NextResponse {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

const campaignErrorsRu: Record<string, string> = {
  PREVIEW_READ_ONLY: "Режим предпросмотра доступен только для чтения. Выйдите из него, чтобы выполнять действия.",
  INVALID_PASSWORD: "Новый код доступа должен содержать не менее 12 символов.",
  PASSWORD_MISMATCH: "Подтверждение нового кода доступа не совпадает.",
  PASSWORD_UNCHANGED: "Выберите код доступа, отличный от временного.",
  CURRENT_PASSWORD_REJECTED: "Текущий код доступа отклонён.",
  INVALID_PURCHASE: "Некорректный запрос на покупку.", PLAYER_REQUIRED: "Покупать снаряжение может только аккаунт игрока.",
  PRODUCT_NOT_FOUND: "Лот не найден.", PRODUCT_RESTRICTED: "Ваш текущий допуск не позволяет открыть этот лот.",
  INSUFFICIENT_STOCK: "Запас продавца изменился до подтверждения.", INSUFFICIENT_FUNDS: "Для этого заказа недостаточно нуйен.",
  FORBIDDEN: "Недостаточно прав для этой операции.", INVALID_PLAYER: "Некорректные данные игрока.",
  INVALID_ACCESS_PROFILE: "Некорректный допуск или фракция.", DUPLICATE_PLAYER: "Логин или псевдоним раннера уже существует.",
  INVALID_VENDOR: "Некорректные данные фиксера или продавца.", INVALID_PRODUCT: "Некорректные данные лота.",
  INVALID_PRODUCT_RELATION: "Продавец или категория недоступны.", INVALID_ADJUSTMENT: "Некорректное изменение игрока.",
  PLAYER_NOT_FOUND: "Игрок не найден.", NEGATIVE_BALANCE: "Изменение привело бы к отрицательному балансу.",
  INVALID_CLEARANCE: "Уровень допуска не найден.", REPUTATION_OUT_OF_RANGE: "Репутация выйдет за настроенный диапазон.",
  INVALID_PRODUCT_STATE: "Некорректное изменение состояния товара.", INVALID_ORDER_DECISION: "Некорректное решение по заказу.",
  ORDER_ALREADY_PROCESSED: "Заказ больше не ожидает рассмотрения.", ACCOUNT_MISSING: "Счёт покупателя отсутствует.",
  INVALID_HOST: "Некорректный хост Матрицы.", INVALID_THREAD: "Некорректная ветка.", POSTING_RESTRICTED: "Публикации для этого аккаунта ограничены.",
  HOST_RESTRICTED: "Доступ к хосту запрещён.", INVALID_REPLY: "Некорректный ответ.", THREAD_LOCKED: "Ветка закрыта или недоступна.", THREAD_RESTRICTED: "Доступ к ветке запрещён.",
};

function validateMutationRequest(request: Request): NextResponse | null {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) return json({ ok: false, error: "JSON requests are required." }, 415);
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "none"].includes(fetchSite)) return json({ ok: false, error: "Cross-site host commands are rejected." }, 403);
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const url = new URL(request.url);
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host).split(",")[0].trim();
  const protocol = (request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "")).split(",")[0].trim();
  if (origin !== `${protocol}://${host}`) return json({ ok: false, error: "Origin check failed." }, 403);
  return null;
}

export async function GET(request: Request) {
  if (actionFromRequest(request) !== "health") return json({ error: "NOT_FOUND" }, 404);
  await ensureCampaignReady();
  const state = await getD1().prepare(`SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM audit_logs) AS audits,
      (SELECT value FROM campaign_settings WHERE key='seed_version') AS seed_version,
      CASE WHEN CAST((SELECT value FROM campaign_settings WHERE key='seed_version') AS INTEGER) >= 3 THEN 1 ELSE 0 END AS security_ready,
      CASE WHEN EXISTS (SELECT 1 FROM orders WHERE id='order-seed-pending' AND status='AWAITING GM')
        THEN EXISTS (
          SELECT 1 FROM transactions ledger_entry JOIN orders purchase_order ON purchase_order.id=ledger_entry.related_order_id
          WHERE ledger_entry.id='transaction-seed-pending' AND ledger_entry.amount=-purchase_order.total
        ) ELSE 1 END AS accounting_ok`).first();
  return json({ ok: true, host: "SHADOWGRID", state });
}

export async function POST(request: Request) {
  const rejected = validateMutationRequest(request);
  if (rejected) return rejected;
  const action = actionFromRequest(request);
  try {
    const body = await bodyFromRequest(request);
    if (action === "login") {
      const input = body as Record<string, unknown>;
      const result = await authenticate(String(input.loginName ?? ""), String(input.password ?? ""));
      if (!result.ok) return json({ ok: false, error: result.message }, result.status);
      const response = json({ ok: true, redirect: result.user.forcePasswordChange ? "/settings?password-change=required" : result.user.roles.includes("GAME_MASTER") ? "/gm" : "/dashboard" });
      response.headers.set("Set-Cookie", sessionCookie(result.token, request.url));
      return response;
    }

    const viewer = await getViewerFromCookieHeader(request.headers.get("cookie"));
    if (!viewer) return json({ ok: false, error: "Сессия истекла. Подключитесь к хосту заново." }, 401);
    if (action === "logout") {
      await revokeSession(viewer);
      const response = json({ ok: true, redirect: "/login" });
      response.headers.set("Set-Cookie", expiredSessionCookie(request.url));
      return response;
    }
    if (action === "gm/preview" && viewer.isPreview && !(body as Record<string, unknown>).userId) {
      await setPreviewUser(viewer, null);
      return json({ ok: true, redirect: "/gm" });
    }
    if (action === "account/change-password") {
      await changeOwnPassword(viewer, body, request);
      return json({ ok: true, redirect: viewer.actor.roles.includes("GAME_MASTER") ? "/gm" : "/dashboard" });
    }
    if (!viewer.isPreview && viewer.actor.forcePasswordChange) {
      return json({ ok: false, error: "Смените назначенный временный код доступа перед использованием хоста.", code: "PASSWORD_CHANGE_REQUIRED" }, 403);
    }
    if (action === "gm/preview") {
      const input = body as Record<string, unknown>;
      await setPreviewUser(viewer, typeof input.userId === "string" && input.userId ? input.userId : null);
      return json({ ok: true, redirect: input.userId ? "/dashboard" : "/gm" });
    }

    const handlers: Record<string, () => Promise<unknown>> = {
      purchase: () => purchaseProduct(viewer, body, request),
      "gm/create-player": () => createPlayer(viewer, body, request),
      "gm/create-vendor": () => createVendor(viewer, body, request),
      "gm/create-product": () => createProduct(viewer, body, request),
      "gm/adjust-player": () => adjustPlayer(viewer, body, request),
      "gm/toggle-product": () => toggleProduct(viewer, body, request),
      "gm/process-order": () => processOrder(viewer, body, request),
      "gm/create-host": () => createHost(viewer, body, request),
      "board/create-thread": () => createThread(viewer, body, request),
      "board/reply": () => replyThread(viewer, body, request),
    };
    const handler = handlers[action];
    if (!handler) return json({ ok: false, error: "Неизвестная команда хоста." }, 404);
    const result = await handler();
    return json({ ok: true, result });
  } catch (error) {
    if (error instanceof CampaignError) return json({ ok: false, error: campaignErrorsRu[error.code] ?? error.message, code: error.code }, error.status);
    console.error("ShadowGrid action failed", error);
    return json({ ok: false, error: "Хост отклонил операцию. Состояние не было изменено." }, 500);
  }
}
