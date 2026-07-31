"use client";

/* eslint-disable @next/next/no-html-link-for-pages */

import { AlertTriangle, ArrowRight, CircleDot, KeyRound, RadioTower, ShieldAlert } from "lucide-react";
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

  return (
    <main className="login-gateway">
      <div className="gateway-route" aria-hidden="true">
        <span>РЕТРАНСЛЯТОР//ПУБЛИЧНЫЙ</span><i /><span>СЕТКА-СИЭТЛА</span><i /><span className="route-cut">ОТКЛЮЧЁН</span>
      </div>
      <section className="gateway-card" aria-labelledby="login-title">
        <header className="gateway-header">
          <div className="brand-mark" aria-hidden="true"><span>SG</span><b>⌁</b></div>
          <div>
            <p className="eyebrow">ЧАСТНЫЙ ХОСТ КАМПАНИИ // ДОЖДЛИВЫЙ ГОРОД</p>
            <h1 id="login-title">SHADOW<span>GRID</span></h1>
            <p className="host-address">SG://SEA.00/ROOT-GATE · сборка 2080.11</p>
          </div>
        </header>
        <div className="gateway-warning">
          <ShieldAlert size={18} aria-hidden="true" />
          <div><strong>РУКОПОЖАТИЕ ТЕНЕВОГО ХОСТА</strong><span>Наблюдение со стороны местной администрации Сетки не исключено.</span></div>
        </div>
        <p className="gateway-copy">Введите назначенный псевдоним и код доступа. Незарегистрированные личности будут отклонены. Хост содержит только вымышленные данные настольной кампании.</p>
        <form onSubmit={connect} className="login-form">
          <label><span>НАЗНАЧЕННЫЙ ПСЕВДОНИМ</span><div className="input-shell"><CircleDot size={15} aria-hidden="true" /><input name="loginName" autoComplete="username" required minLength={3} placeholder="псевдоним_раннера" /></div></label>
          <label><span>КОД ДОСТУПА</span><div className="input-shell"><KeyRound size={15} aria-hidden="true" /><input name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="••••••••••••" /></div></label>
          {error ? <div className="form-error" role="alert"><AlertTriangle size={16} />{error}</div> : null}
          <button className="primary-command" disabled={busy}>{busy ? "СОГЛАСОВАНИЕ МАРШРУТА…" : "ВОЙТИ В ТЕНЕВОЙ ХОСТ"}<ArrowRight size={17} /></button>
        </form>
        <div className="demo-credentials" aria-label="Данные преднастроенного аккаунта">
          <p><RadioTower size={14} /> ТОЛЬКО НАЗНАЧЕННЫЕ АККАУНТЫ</p>
          <dl><div><dt>ПУБЛИЧНАЯ РЕГИСТРАЦИЯ</dt><dd>ОТКЛЮЧЕНА</dd></div><div><dt>ПЕРВОЕ РУКОПОЖАТИЕ</dt><dd>СМЕНИТЬ ВРЕМЕННЫЙ КОД</dd></div></dl>
        </div>
        <footer><span>ПУБЛИЧНАЯ РЕГИСТРАЦИЯ: ОТКЛЮЧЕНА</span><span>РИСК ТРАССИРОВКИ: <b>ВЫМЫШЛЕННЫЙ</b></span></footer>
      </section>
      <aside className="gateway-aside" aria-label="Диагностика соединения">
        <p>СОГЛАСОВАНИЕ МАРШРУТА</p>
        <ol><li className="done">РЕТРАНСЛЯТОР ОТКРЫТОЙ СЕТИ ОТКЛЮЧЁН</li><li className="done">МАРШРУТ ЧЕРЕЗ ТЕНЕВОЙ ХОСТ</li><li className="done">ПРОВЕРКА SIN ОБОЙДЕНА</li><li>МЕСТНАЯ АДМИНИСТРАЦИЯ СЕТКИ: НЕИЗВЕСТНО</li></ol>
        <div className="sigil-lock" aria-hidden="true"><span>ᛉ</span><i /><b>АСТРАЛЬНЫЕ<br />ПОМЕХИ</b></div>
      </aside>
    </main>
  );
}

export function PublicNotice({ code, title, body }: { code: string; title: string; body: string }) {
  return <main className="public-notice"><div className="notice-terminal"><p className="eyebrow">SHADOWGRID // ОТВЕТ СИСТЕМЫ</p><div className="notice-code">{code}</div><h1>{title}</h1><p>{body}</p><a href="/dashboard" className="primary-command">ВЕРНУТЬСЯ В ДОМАШНИЙ УЗЕЛ <ArrowRight size={17} /></a></div></main>;
}
