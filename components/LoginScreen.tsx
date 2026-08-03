"use client";

/* eslint-disable @next/next/no-html-link-for-pages */

import { AlertTriangle, Eye, Fingerprint, KeyRound, RadioTower, ShieldAlert, Triangle } from "lucide-react";
import { FormEvent, useState } from "react";

export function LoginScreen() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginName: form.get("loginName"), password: form.get("password") }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string; redirect?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Рукопожатие отклонено.");
      window.location.assign(result.redirect ?? "/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Рукопожатие отклонено.");
      setBusy(false);
    }
  }

  return <main className="bic-gate">
    <div className="bic-gate__rain" aria-hidden="true"><span>01001101<br />NO SIN<br />†<br />73A</span><span>BLACK ICE<br />AWAKE<br />∴</span><span>ᚨ<br />TRACE NULL<br />00110</span><span>TRUST<br />NOBODY<br />†</span><span>HOST 73A<br />EYE<br />00073</span></div>
    <header className="bic-gate__header"><span>LIBER UMBRARUM // HOST 73A</span><b>BLACK ICE CATHEDRAL</b><span>SEATTLE // 04:17</span></header>
    <section className="bic-gate__nave">
      <aside className="bic-gate__margin">
        <span>I.</span><b>ТРИ ОБЕТА</b>
        <p>Не выдавай своих.<br />Не храни настоящих имён.<br />Не оставляй маршрут живым.</p>
        <i />
        <small>NO RECORD<br />SHALL REMAIN</small>
      </aside>

      <div className="bic-gate__portal">
        <div className="bic-gate__arch" aria-hidden="true"><i /><i /><i /></div>
        <div className="bic-gate__seal" aria-hidden="true"><Eye /><span>IX</span><b>73A</b></div>
        <p>НЕЗАРЕГИСТРИРОВАННЫЙ ЦИФРОВОЙ ПРИХОД</p>
        <h1>ENTER<br />WITHOUT<br /><em>A NAME.</em></h1>
        <blockquote>Корпорации называют это преступлением.<br />Мы называем это правом остаться невидимым.</blockquote>

        <form onSubmit={connect} className="bic-handshake">
          <header><Triangle /><span>РИТУАЛ ДОСТУПА // РУКОПОЖАТИЕ ТЕНЕВОГО ХОСТА</span><Triangle /></header>
          <label><span>ИМЯ ВНЕ РЕЕСТРА // НАЗНАЧЕННЫЙ ПСЕВДОНИМ</span><div><Fingerprint /><input name="loginName" autoComplete="username" required minLength={3} placeholder="позывной" /></div></label>
          <i>✦</i>
          <label><span>СЛОВО, ДАННОЕ ПОРУЧИТЕЛЕМ</span><div><KeyRound /><input name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="••••••••••••" /></div></label>
          {error ? <div className="bic-handshake__error" role="alert"><AlertTriangle />{error}</div> : null}
          <button type="submit" disabled={busy}>{busy ? "ПОГРЕБАЕМ МАРШРУТ…" : "ПЕРЕСТУПИТЬ ПОРОГ"}</button>
        </form>
      </div>

      <aside className="bic-gate__margin bic-gate__margin--right">
        <span>II.</span><b>СЕГОДНЯ ПОМЯНУТ</b><p>ORPHAN_09<br />SISTER STATIC<br />RED WIRE</p>
        <section><RadioTower /><div><small>TRACE</small><strong>11%</strong></div></section>
        <p className="bic-gate__warning"><ShieldAlert /> Местная администрация Сетки не приглашена.</p>
      </aside>
    </section>
    <footer className="bic-gate__footer"><span>ПУБЛИЧНАЯ РЕГИСТРАЦИЯ: ОТКЛЮЧЕНА</span><b>PROPERTY OF NOBODY</b><span>overwatch 004 / 040</span></footer>
  </main>;
}

export function PublicNotice({ code, title, body }: { code: string; title: string; body: string }) {
  return <main className="bic-notice"><section><Eye /><p>BLACK ICE CATHEDRAL // ОТВЕТ ХОСТА</p><div>{code}</div><h1>{title}</h1><span>{body}</span><a href="/dashboard">ВЕРНУТЬСЯ В НЕФ</a></section></main>;
}
