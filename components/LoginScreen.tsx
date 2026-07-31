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
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Handshake rejected.");
      window.location.assign(result.redirect ?? "/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Handshake rejected.");
      setBusy(false);
    }
  }

  return (
    <main className="login-gateway">
      <div className="gateway-route" aria-hidden="true">
        <span>RELAY//PUBLIC</span><i /><span>SEA-GRID</span><i /><span className="route-cut">TERMINATED</span>
      </div>
      <section className="gateway-card" aria-labelledby="login-title">
        <header className="gateway-header">
          <div className="brand-mark" aria-hidden="true"><span>SG</span><b>⌁</b></div>
          <div>
            <p className="eyebrow">PRIVATE CAMPAIGN HOST // RAIN CITY</p>
            <h1 id="login-title">SHADOW<span>GRID</span></h1>
            <p className="host-address">SG://SEA.00/ROOT-GATE · build 2080.11</p>
          </div>
        </header>
        <div className="gateway-warning">
          <ShieldAlert size={18} aria-hidden="true" />
          <div><strong>SHADOW HOST HANDSHAKE</strong><span>Local Grid Authority monitoring cannot be ruled out.</span></div>
        </div>
        <p className="gateway-copy">Enter your assigned handle and passcode. Unregistered identities are rejected. This host contains fictional tabletop campaign data only.</p>
        <form onSubmit={connect} className="login-form">
          <label><span>ASSIGNED HANDLE</span><div className="input-shell"><CircleDot size={15} aria-hidden="true" /><input name="loginName" autoComplete="username" required minLength={3} placeholder="runner_alias" /></div></label>
          <label><span>PASSCODE</span><div className="input-shell"><KeyRound size={15} aria-hidden="true" /><input name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="••••••••••••" /></div></label>
          {error ? <div className="form-error" role="alert"><AlertTriangle size={16} />{error}</div> : null}
          <button className="primary-command" disabled={busy}>{busy ? "NEGOTIATING ROUTE…" : "ENTER SHADOW HOST"}<ArrowRight size={17} /></button>
        </form>
        <div className="demo-credentials" aria-label="Seed account credentials">
          <p><RadioTower size={14} /> ASSIGNED ACCOUNTS ONLY</p>
          <dl><div><dt>PUBLIC SIGN-UP</dt><dd>DISABLED</dd></div><div><dt>FIRST HANDSHAKE</dt><dd>REPLACE TEMPORARY PASSCODE</dd></div></dl>
        </div>
        <footer><span>PUBLIC REGISTRATION: DISABLED</span><span>TRACE RISK: <b>FICTIONAL</b></span></footer>
      </section>
      <aside className="gateway-aside" aria-label="Connection diagnostics">
        <p>ROUTE NEGOTIATION</p>
        <ol><li className="done">CLEARNET RELAY TERMINATED</li><li className="done">ROUTING THROUGH SHADOW HOST</li><li className="done">SIN VERIFICATION BYPASSED</li><li>LOCAL GRID AUTHORITY: UNKNOWN</li></ol>
        <div className="sigil-lock" aria-hidden="true"><span>ᛉ</span><i /><b>ASTRAL<br />INTERFERENCE</b></div>
      </aside>
    </main>
  );
}

export function PublicNotice({ code, title, body }: { code: string; title: string; body: string }) {
  return <main className="public-notice"><div className="notice-terminal"><p className="eyebrow">SHADOWGRID // CONTROL RESPONSE</p><div className="notice-code">{code}</div><h1>{title}</h1><p>{body}</p><a href="/dashboard" className="primary-command">RETURN TO HOME NODE <ArrowRight size={17} /></a></div></main>;
}
