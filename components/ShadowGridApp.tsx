"use client";

/* eslint-disable @next/next/no-html-link-for-pages, react-hooks/set-state-in-effect */

import type { LucideIcon } from "lucide-react";
import {
  Activity, AlertTriangle, Archive, ArrowLeft, ArrowRight, BadgeDollarSign, Bell, Boxes, BriefcaseBusiness,
  ChevronRight, CircleDollarSign, CircleUserRound, Command, ContactRound, Eye,
  FileClock, Fingerprint, Gauge, Globe2, HandCoins, Hexagon, Home, Inbox, KeyRound, LockKeyhole,
  LogOut, Menu, MessageSquareText, PackageCheck, PackagePlus, Radio, RefreshCw, Search, Send,
  Settings, ShieldAlert, ShieldCheck, ShoppingBasket, SlidersHorizontal, Store, TerminalSquare,
  UserPlus, Users, WalletCards, X, Zap,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { ViewerContext } from "../lib/auth";
import type { CampaignSnapshot, ProductView } from "../lib/campaign";

type Row = Record<string, unknown>;
type ThemeKey = "seattle" | "corporate" | "green" | "amber" | "redmond" | "shamanic" | "blackice" | "lowband";
type Effects = { scanlines: boolean; noise: boolean; flicker: boolean; grid: boolean; intensity: number; reducedMotion: boolean; sound: boolean; theme: ThemeKey };

const defaultEffects: Effects = { scanlines: true, noise: false, flicker: false, grid: true, intensity: 0.35, reducedMotion: false, sound: false, theme: "seattle" };

const playerNavigation: Array<[string, string, LucideIcon]> = [
  ["/dashboard", "HOME NODE", Home], ["/feed", "GRID FEED", Activity], ["/board", "SHADOW BOARD", MessageSquareText],
  ["/jobs", "JOBS", BriefcaseBusiness], ["/market", "BLACK MARKET", ShoppingBasket], ["/vendors", "FIXERS", ContactRound],
  ["/contacts", "CONTACTS", Users], ["/orders", "ORDERS", PackageCheck], ["/inventory", "INVENTORY", Boxes],
  ["/messages", "MESSAGES", Inbox], ["/character", "CHARACTER", CircleUserRound], ["/settings", "SETTINGS", Settings],
];

const gmNavigation: Array<[string, string, LucideIcon]> = [
  ["/gm", "GM OVERVIEW", Gauge], ["/gm/players", "RUNNERS", Users], ["/gm/characters", "CHARACTERS", Fingerprint],
  ["/gm/products", "PRODUCTS", ShoppingBasket], ["/gm/vendors", "VENDORS", Store], ["/gm/orders", "ORDERS", PackageCheck],
  ["/gm/inventories", "INVENTORIES", Boxes], ["/gm/board", "SHADOW BOARD", MessageSquareText], ["/gm/hosts", "MATRIX HOSTS", Globe2],
  ["/gm/contacts", "CONTACTS", ContactRound], ["/gm/messages", "MESSAGES", Send], ["/gm/announcements", "ANNOUNCEMENTS", Bell],
  ["/gm/jobs", "JOBS", BriefcaseBusiness], ["/gm/economy", "ECONOMY", CircleDollarSign], ["/gm/audit", "AUDIT LOG", FileClock],
  ["/gm/settings", "CAMPAIGN SETTINGS", Settings],
];

function text(row: Row, key: string, fallback = "—"): string {
  const value = row[key];
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function number(row: Row, key: string, fallback = 0): number {
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : fallback;
}

function flag(row: Row, key: string): boolean {
  return Boolean(row[key]);
}

function nuyen(value: unknown): string {
  return `${new Intl.NumberFormat("en-US").format(Number(value) || 0)} ¥`;
}

function timeAgo(value: unknown): string {
  if (!value) return "UNKNOWN TIME";
  const elapsed = Date.now() - new Date(String(value)).getTime();
  if (!Number.isFinite(elapsed)) return String(value);
  const minutes = Math.max(1, Math.round(elapsed / 60_000));
  if (minutes < 60) return `${minutes} MINUTES AGO`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} HOURS AGO`;
  return `${Math.round(hours / 24)} DAYS AGO`;
}

function StatusTag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "danger" | "magic" | "corp" }) {
  return <span className={`status-tag ${tone}`}>{children}</span>;
}

function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <header className="section-header"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</header>;
}

function EmptyState({ icon: Icon = Archive, title, body }: { icon?: LucideIcon; title: string; body: string }) {
  return <div className="empty-state"><Icon size={24} /><strong>{title}</strong><p>{body}</p></div>;
}

function ActionForm({ endpoint, submitLabel, children, className = "command-form", successMessage, onSuccess }: { endpoint: string; submitLabel: string; children: ReactNode; className?: string; successMessage?: string; onSuccess?: (result: unknown) => void }) {
  const [state, setState] = useState<{ busy: boolean; error: string; success: string }>({ busy: false, error: "", success: "" });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ busy: true, error: "", success: "" });
    const form = event.currentTarget;
    const payload: Record<string, FormDataEntryValue | boolean> = Object.fromEntries(new FormData(form).entries());
    for (const [key, value] of Object.entries(payload)) {
      if (value === "true") payload[key] = true;
      if (value === "false") payload[key] = false;
    }
    for (const input of Array.from(form.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name]'))) payload[input.name] = input.checked;
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = (await response.json()) as { ok?: boolean; error?: string; result?: unknown; redirect?: string };
      if (!response.ok || !body.ok) throw new Error(body.error ?? "Host command rejected.");
      if (body.redirect) { window.location.assign(body.redirect); return; }
      setState({ busy: false, error: "", success: successMessage ?? "HOST STATE COMMITTED" });
      form.reset();
      if (onSuccess) onSuccess(body.result); else window.setTimeout(() => window.location.reload(), 450);
    } catch (caught) {
      setState({ busy: false, error: caught instanceof Error ? caught.message : "Host command rejected.", success: "" });
    }
  }
  return <form className={className} onSubmit={submit}>{children}{state.error ? <div className="form-error" role="alert"><AlertTriangle size={15} />{state.error}</div> : null}{state.success ? <div className="form-success" role="status"><ShieldCheck size={15} />{state.success}</div> : null}<button className="primary-command" disabled={state.busy}>{state.busy ? "COMMITTING…" : submitLabel}<ArrowRight size={16} /></button></form>;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field"><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>;
}

function TextField({ label, name, type = "text", required = true, placeholder, defaultValue, min, max, hint }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string; defaultValue?: string | number; min?: number; max?: number; hint?: string }) {
  return <Field label={label} hint={hint}><input name={name} type={type} required={required} placeholder={placeholder} defaultValue={defaultValue} min={min} max={max} /></Field>;
}

function SelectField({ label, name, options, defaultValue }: { label: string; name: string; options: Array<[string, string]>; defaultValue?: string }) {
  return <Field label={label}><select name={name} defaultValue={defaultValue}>{options.map(([value, labelText]) => <option key={value} value={value}>{labelText}</option>)}</select></Field>;
}

function ToggleField({ label, name, defaultChecked = false }: { label: string; name: string; defaultChecked?: boolean }) {
  return <label className="toggle-field"><input type="checkbox" name={name} defaultChecked={defaultChecked} /><span className="toggle-track" aria-hidden="true"><i /></span><span>{label}</span></label>;
}

function RecordTable({ headers, rows, empty = "NO RECORDS RETURNED" }: { headers: string[]; rows: ReactNode[][]; empty?: string }) {
  if (!rows.length) return <EmptyState title={empty} body="The current access context returned no visible records." />;
  return <div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((cells, index) => <tr key={index}>{cells.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function Metric({ label, value, note, icon: Icon, tone = "green" }: { label: string; value: string; note: string; icon: LucideIcon; tone?: string }) {
  return <div className={`metric ${tone}`}><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div><Icon size={20} aria-hidden="true" /></div>;
}

function PageIntro({ route, title, body, actions }: { route: string; title: string; body: string; actions?: ReactNode }) {
  return <div className="page-intro"><div><p className="route-label">NODE::{route.toUpperCase()}</p><h1>{title}</h1><p>{body}</p></div>{actions ? <div className="page-actions">{actions}</div> : null}</div>;
}

function FeedRow({ thread }: { thread: Row }) {
  return <article className="feed-row navigable" tabIndex={-1} data-href={`/board/thread/${text(thread, "id")}`}>
    <div className="feed-glyph" aria-hidden="true">{flag(thread, "encrypted") ? "◇" : "//"}</div>
    <div className="feed-main"><div className="feed-meta"><strong>{text(thread, "author")}</strong><span>{timeAgo(thread.created_at)}</span><span>{String(text(thread, "content", "")).split(/\s+/u).length} WORDS</span><span>{number(thread, "reply_count")} REPLIES</span></div><a href={`/board/thread/${text(thread, "id")}`}><h3>{text(thread, "title")}</h3></a><p>{text(thread, "content")}</p><footer><span>HOST: {text(thread, "host_name")}</span>{flag(thread, "pinned") ? <StatusTag tone="warn">PINNED</StatusTag> : null}{flag(thread, "encrypted") ? <StatusTag tone="magic">ENCRYPTED</StatusTag> : null}</footer></div>
    <ChevronRight size={17} aria-hidden="true" />
  </article>;
}

function Dashboard({ snapshot, viewer }: { snapshot: CampaignSnapshot; viewer: ViewerContext }) {
  const announcement = snapshot.announcements[0];
  const pending = snapshot.orders.filter((order) => ["AWAITING GM", "PENDING"].includes(text(order, "status"))).length;
  return <>
    <PageIntro route="HOME NODE" title={`Good evening, ${viewer.effectiveUser.runnerAlias}.`} body="Your route is stable enough. The host has filtered this view against your clearance, reputation, faction and manual unlocks." actions={<a className="secondary-command" href="/feed"><Activity size={16} /> OPEN GRID FEED</a>} />
    {announcement ? <section className={`alert-strip severity-${text(announcement, "severity").toLowerCase().replaceAll(" ", "-")}`}><ShieldAlert size={20} /><div><p>{text(announcement, "severity")}{" // "}{text(announcement, "source_label")}</p><strong>{text(announcement, "title")}</strong><span>{text(announcement, "body")}</span></div><small>{timeAgo(announcement.created_at)}</small></section> : null}
    <div className="metric-grid"><Metric label="AVAILABLE NUYEN" value={nuyen(viewer.effectiveUser.nuyen)} note="authoritative ledger balance" icon={CircleDollarSign} /><Metric label="STREET REPUTATION" value={String(viewer.effectiveUser.streetReputation)} note={`${viewer.effectiveUser.notoriety} notoriety`} icon={Zap} tone="amber" /><Metric label="MATRIX CLEARANCE" value={viewer.effectiveUser.clearanceKey} note={`rank ${viewer.effectiveUser.clearanceRank} access`} icon={KeyRound} tone="cyan" /><Metric label="UNREAD / PENDING" value={String(snapshot.conversations.reduce((total, item) => total + number(item, "unread_count"), 0) + pending)} note={`${pending} order reviews`} icon={Inbox} tone="violet" /></div>
    <div className="dashboard-grid">
      <section className="data-panel wide"><SectionHeader eyebrow="LOCAL GRID ACTIVITY" title="Signals worth opening" action={<a href="/board">ALL HOSTS →</a>} /><div className="feed-list">{snapshot.threads.slice(0, 5).map((thread) => <FeedRow key={text(thread, "id")} thread={thread} />)}</div></section>
      <aside className="data-panel signal-panel"><SectionHeader eyebrow="PERSISTENT MONITOR" title="Route diagnostics" /><div className="signal-wave" aria-hidden="true">{Array.from({ length: 32 }, (_, index) => <i key={index} style={{ height: `${18 + ((index * 17) % 62)}%` }} />)}</div><dl className="terminal-list"><div><dt>ACTIVE ROUTE</dt><dd>SEA.44 → NULL.8 → LOCAL</dd></div><div><dt>CONNECTION</dt><dd><span className="live-dot" /> STABLE</dd></div><div><dt>TRACE RISK</dt><dd>LOW / FICTIONAL</dd></div><div><dt>ASTRAL NOISE</dt><dd>0.31 KIRLIAN</dd></div><div><dt>HOST TIME</dt><dd>{new Date(snapshot.campaignTime).toLocaleString()}</dd></div></dl></aside>
      <section className="data-panel"><SectionHeader eyebrow="FIXER TRAFFIC" title="Restricted stock" action={<a href="/market">MARKET →</a>} /><div className="compact-list">{snapshot.products.slice(0, 4).map((product) => <a href={`/market/${product.id}`} key={product.id}><div><strong>{product.name}</strong><span>{product.vendorName} · {product.rarity}</span></div><b>{nuyen(product.price)}</b></a>)}</div></section>
      <section className="data-panel"><SectionHeader eyebrow="CONTRACT BOARD" title="Open jobs" action={<a href="/jobs">JOBS →</a>} /><div className="compact-list">{snapshot.jobs.slice(0, 4).map((job) => <a href={`/jobs/${text(job, "id")}`} key={text(job, "id")}><div><strong>{text(job, "title")}</strong><span>{text(job, "location")} · {text(job, "danger")}</span></div><StatusTag tone={text(job, "status") === "AVAILABLE" ? "good" : "warn"}>{text(job, "status")}</StatusTag></a>)}</div></section>
    </div>
  </>;
}

function GridFeed({ snapshot }: { snapshot: CampaignSnapshot }) {
  return <><PageIntro route="GRID FEED" title="The network, as permitted." body="Announcements, runner posts, contracts and market changes are merged here without algorithmic ranking." actions={<button className="secondary-command" onClick={() => window.location.reload()}><RefreshCw size={15} /> REFRESH ROUTE</button>} /><div className="feed-toolbar"><span>{snapshot.threads.length + snapshot.jobs.length + snapshot.products.length} VISIBLE SIGNALS</span><div><button>ALL</button><button>BOARD</button><button>JOBS</button><button>MARKET</button></div></div><section className="data-panel feed-primary"><div className="feed-list">{snapshot.threads.map((thread) => <FeedRow key={text(thread, "id")} thread={thread} />)}</div></section></>;
}

function Board({ snapshot, pathname, viewer }: { snapshot: CampaignSnapshot; pathname: string; viewer: ViewerContext }) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[1] === "thread" && parts[2]) {
    const thread = snapshot.threads.find((item) => text(item, "id") === parts[2]);
    if (!thread) return <EmptyState icon={LockKeyhole} title="THREAD NOT DISCLOSED" body="The node may be hidden, deleted, or outside your current clearance." />;
    const posts = snapshot.posts.filter((post) => text(post, "thread_id") === text(thread, "id"));
    return <><a className="back-link" href={`/board/${text(thread, "host_slug")}`}><ArrowLeft size={15} /> {text(thread, "host_name")}</a><PageIntro route={`BOARD/${text(thread, "id")}`} title={text(thread, "title")} body={`Opened through ${text(thread, "host_name")}. Raw HTML is disabled; posts are stored as Markdown source.`} /><section className="thread-stack">{posts.map((post, index) => <article className="thread-post" key={text(post, "id")}><aside><span>{String(index + 1).padStart(2, "0")}</span><div className="avatar-rune">{text(post, "author").slice(0, 2)}</div><strong>{text(post, "author")}</strong><small>{text(post, "author_display_mode")}</small></aside><div><header><span>{timeAgo(post.created_at)}</span>{post.edited_at ? <StatusTag>EDITED</StatusTag> : null}</header><p>{text(post, "content_markdown")}</p><footer><button>QUOTE</button><button>SAVE</button><button>REPORT</button></footer></div></article>)}</section>{flag(thread, "locked") ? <div className="alert-strip"><LockKeyhole size={18} /><div><strong>THREAD LOCKED</strong><span>Replies have been disabled by a moderator.</span></div></div> : viewer.effectiveUser.postingRestricted ? <div className="alert-strip"><ShieldAlert size={18} /><div><strong>POSTING RESTRICTED</strong><span>Your account may read but cannot reply.</span></div></div> : <section className="data-panel compose-panel"><SectionHeader eyebrow="REPLY CHANNEL" title="Transmit a response" /><ActionForm endpoint="/api/board/reply" submitLabel="TRANSMIT REPLY"><input type="hidden" name="threadId" value={text(thread, "id")} /><Field label="MARKDOWN MESSAGE"><textarea name="content" required minLength={2} rows={6} placeholder="Compose a readable, in-character response…" /></Field></ActionForm></section>}</>;
  }
  const hostSlug = parts[1];
  if (hostSlug) {
    const host = snapshot.hosts.find((item) => text(item, "slug") === hostSlug || text(item, "id") === hostSlug);
    if (!host) return <EmptyState icon={LockKeyhole} title="HOST NOT DISCLOSED" body="No route metadata is available at your current clearance." />;
    const threads = snapshot.threads.filter((thread) => text(thread, "host_id") === text(host, "id"));
    return <><a className="back-link" href="/board"><ArrowLeft size={15} /> SHADOW BOARD DIRECTORY</a><PageIntro route={text(host, "node_address")} title={text(host, "name")} body={text(host, "description")} actions={<StatusTag tone="corp">CLEARANCE {number(host, "min_clearance_rank")}</StatusTag>} /><section className={`node-local theme-${text(host, "visual_theme").toLowerCase().replaceAll("_", "-")}`}><div className="node-mast"><span>{text(host, "icon")}</span><div><b>OPERATOR: {text(host, "owner")}</b><small>LOCAL THEME: {text(host, "visual_theme")}</small></div></div><div className="feed-list">{threads.length ? threads.map((thread) => <FeedRow key={text(thread, "id")} thread={thread} />) : <EmptyState title="NO THREADS ON THIS HOST" body="The directory is open, but nobody has transmitted here yet." />}</div></section>{!viewer.effectiveUser.postingRestricted ? <section className="data-panel compose-panel"><SectionHeader eyebrow="NEW TRANSMISSION" title="Open a thread" /><ActionForm endpoint="/api/board/create-thread" submitLabel="PUBLISH THREAD"><input type="hidden" name="hostId" value={text(host, "id")} /><TextField label="THREAD TITLE" name="title" placeholder="Concise subject line" /><Field label="MESSAGE"><textarea name="content" required minLength={8} rows={6} /></Field><input type="hidden" name="displayMode" value="PLAYER_ALIAS" /></ActionForm></section> : null}</>;
  }
  return <><PageIntro route="SHADOW BOARD" title="Connected Matrix hosts" body="Each directory enforces its own clearance, reputation and faction rules on the server. Missing hosts do not leak metadata." /><div className="host-directory">{snapshot.hosts.map((host) => <a className="host-entry navigable" tabIndex={-1} data-href={`/board/${text(host, "slug")}`} href={`/board/${text(host, "slug")}`} key={text(host, "id")}><span className="host-icon">{text(host, "icon")}</span><div><p>{text(host, "node_address")}</p><h3>{text(host, "name")}</h3><span>{text(host, "description")}</span></div><dl><dt>{number(host, "thread_count")}</dt><dd>THREADS</dd><dt>{number(host, "min_clearance_rank")}</dt><dd>MIN CLR</dd></dl><ChevronRight size={18} /></a>)}</div></>;
}

function Jobs({ snapshot, pathname }: { snapshot: CampaignSnapshot; pathname: string }) {
  const id = pathname.split("/").filter(Boolean)[1];
  const selected = id ? snapshot.jobs.find((job) => text(job, "id") === id) : null;
  if (id && !selected) return <EmptyState icon={LockKeyhole} title="CONTRACT CLASSIFIED" body="The requested briefing is outside your current access context." />;
  if (selected) return <><a className="back-link" href="/jobs"><ArrowLeft size={15} /> CONTRACT INDEX</a><PageIntro route={`JOBS/${text(selected, "id")}`} title={text(selected, "title")} body={text(selected, "short_briefing")} actions={<StatusTag tone={text(selected, "status") === "AVAILABLE" ? "good" : "warn"}>{text(selected, "status")}</StatusTag>} /><div className="dossier-grid"><section className="data-panel"><SectionHeader eyebrow="CONTROLLED BRIEFING" title={`Johnson: ${text(selected, "johnson_alias")}`} /><p className="long-copy">{text(selected, "full_briefing")}</p><div className="warning-stamp">DANGER // {text(selected, "danger")}</div></section><aside className="data-panel"><dl className="terminal-list"><div><dt>FIXER</dt><dd>{text(selected, "fixer_alias")}</dd></div><div><dt>LOCATION</dt><dd>{text(selected, "location")}</dd></div><div><dt>PAYMENT</dt><dd>{nuyen(selected.payment)}</dd></div><div><dt>ADVANCE</dt><dd>{nuyen(selected.advance_payment)}</dd></div><div><dt>MIN REPUTATION</dt><dd>{text(selected, "min_reputation")}</dd></div><div><dt>MIN CLEARANCE</dt><dd>{text(selected, "min_clearance_rank")}</dd></div><div><dt>TEAM</dt><dd>{text(selected, "participant_count")} / {text(selected, "max_participants")}</dd></div></dl><button className="primary-command" disabled={text(selected, "status") !== "AVAILABLE"}>SIGNAL INTEREST <ArrowRight size={16} /></button></aside></div></>;
  return <><PageIntro route="JOHNSON JOB BOARD" title="Contracts and rumors" body="Briefings are filtered before they reach this screen. Payments and dates belong to the campaign, not the real world." /><div className="job-index">{snapshot.jobs.map((job) => <a href={`/jobs/${text(job, "id")}`} className="job-row navigable" tabIndex={-1} data-href={`/jobs/${text(job, "id")}`} key={text(job, "id")}><span className={`danger-gauge danger-${text(job, "danger").toLowerCase()}`}>{text(job, "danger")}</span><div><p>{text(job, "johnson_alias")} via {text(job, "fixer_alias")}</p><h3>{text(job, "title")}</h3><span>{text(job, "short_briefing")}</span></div><dl><dt>{nuyen(job.payment)}</dt><dd>{text(job, "location")}</dd></dl><StatusTag tone={text(job, "status") === "AVAILABLE" ? "good" : text(job, "status") === "CLASSIFIED" ? "danger" : "warn"}>{text(job, "status")}</StatusTag><ChevronRight size={18} /></a>)}</div></>;
}

function ProductDetail({ product, viewer }: { product: ProductView; viewer: ViewerContext }) {
  const [result, setResult] = useState("");
  const [buying, setBuying] = useState(false);
  const purchaseAttempt = useRef<{ quantity: number; key: string } | null>(null);
  const purchaseInFlight = useRef(false);
  async function buy(quantity: number) {
    if (purchaseInFlight.current) return;
    purchaseInFlight.current = true;
    setBuying(true);
    if (!purchaseAttempt.current || purchaseAttempt.current.quantity !== quantity) purchaseAttempt.current = { quantity, key: crypto.randomUUID() };
    setResult("NEGOTIATING VENDOR ROUTE…");
    try {
      const response = await fetch("/api/purchase", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id, quantity, idempotencyKey: purchaseAttempt.current.key }) });
      const body = (await response.json()) as { ok?: boolean; error?: string; result?: { order_code?: string; status?: string } };
      if (!response.ok || !body.ok) throw new Error(body.error ?? "Purchase rejected.");
      setResult(`ORDER ${body.result?.order_code ?? "ACCEPTED"} // ${body.result?.status ?? "COMMITTED"}`);
      window.setTimeout(() => window.location.assign("/orders"), 800);
    } catch (caught) { purchaseInFlight.current = false; setBuying(false); setResult(caught instanceof Error ? caught.message : "Purchase rejected."); }
  }
  const restricted = viewer.effectiveUser.streetReputation < product.minReputation || viewer.effectiveUser.clearanceRank < product.minClearanceRank;
  return <><a className="back-link" href="/market"><ArrowLeft size={15} /> BLACK MARKET INDEX</a><div className={`vendor-sheet theme-${product.vendorTheme.toLowerCase().replaceAll("_", "-")}`}><header><div><p>{product.vendorName}{" // "}{product.listingCode}</p><h1>{product.name}</h1><span>{product.shortDescription}</span></div><div className="listing-price"><small>ASKING PRICE</small><strong>{nuyen(product.price)}</strong><span>{product.stock} units in cache</span></div></header><div className="listing-body"><section><div className="product-glyph" aria-hidden="true"><Hexagon /><span>{product.category.slice(0, 3)}</span><i /></div><p className="long-copy">{product.fullDescription}</p><div className="attribute-grid"><span><small>RARITY</small><b>{product.rarity}</b></span><span><small>LEGALITY</small><b>{product.legality}</b></span><span><small>CONDITION</small><b>{product.condition}</b></span><span><small>APPROVAL</small><b>{product.requiresGmApproval ? "REQUIRED" : "AUTOMATIC"}</b></span></div></section><aside><p className="eyebrow">ACCESS CERTIFICATE</p><dl className="terminal-list"><div><dt>YOUR CLEARANCE</dt><dd>{viewer.effectiveUser.clearanceKey}</dd></div><div><dt>MIN RANK</dt><dd>{product.minClearanceRank}</dd></div><div><dt>YOUR REP</dt><dd>{viewer.effectiveUser.streetReputation}</dd></div><div><dt>MIN REP</dt><dd>{product.minReputation}</dd></div><div><dt>BALANCE</dt><dd>{nuyen(viewer.effectiveUser.nuyen)}</dd></div></dl>{restricted ? <div className="form-error"><LockKeyhole size={16} /> ACCESS MISMATCH</div> : <><Field label="QUANTITY"><select id="purchase-quantity" defaultValue="1"><option value="1">1 unit</option>{product.stock >= 2 ? <option value="2">2 units</option> : null}{product.stock >= 3 ? <option value="3">3 units</option> : null}</select></Field><button className="primary-command" disabled={product.stock < 1 || viewer.isPreview || buying} onClick={() => buy(Number((document.getElementById("purchase-quantity") as HTMLSelectElement | null)?.value ?? 1))}><HandCoins size={16} /> {viewer.isPreview ? "PREVIEW ONLY" : buying ? "COMMITTING ORDER…" : "CONFIRM FICTIONAL PURCHASE"}</button></>}{result ? <div className={result.includes("ORDER ") ? "form-success" : "form-error"} role="status">{result}</div> : null}<small className="purchase-note">Price, access, balance and stock are rechecked by the server inside the purchase transaction.</small></aside></div></div></>;
}

function Market({ snapshot, pathname, viewer }: { snapshot: CampaignSnapshot; pathname: string; viewer: ViewerContext }) {
  const id = pathname.split("/").filter(Boolean)[1];
  const selected = id ? snapshot.products.find((product) => product.id === id || product.slug === id) : null;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const visible = snapshot.products.filter((product) => (category === "ALL" || product.category === category) && `${product.name} ${product.vendorName} ${product.shortDescription}`.toLowerCase().includes(query.toLowerCase()));
  if (id && !selected) return <EmptyState icon={LockKeyhole} title="LISTING NOT DISCLOSED" body="The vendor returned no metadata. Access may require more reputation, clearance, faction standing or a direct unlock." />;
  if (selected) return <ProductDetail product={selected} viewer={viewer} />;
  return <><PageIntro route="BLACK MARKET" title="Fragmented vendor index" body="Fictional campaign gear is assembled from independent fixer nodes. The server filters every listing before disclosure." /><div className="market-controls"><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search visible listings" aria-label="Search visible listings" /></label><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter category"><option>ALL</option>{Array.from(new Set(snapshot.products.map((product) => product.category))).map((item) => <option key={item}>{item}</option>)}</select><span>{visible.length} / {snapshot.products.length} DISCLOSED</span></div><div className="market-ledger">{Array.from(new Set(visible.map((product) => product.vendorName))).map((vendor) => <section key={vendor} className="vendor-block"><header><div><Store size={18} /><strong>{vendor}</strong></div><span>ENCRYPTED CATALOGUE // NO WARRANTY</span></header>{visible.filter((product) => product.vendorName === vendor).map((product) => <a className="listing-row navigable" tabIndex={-1} data-href={`/market/${product.id}`} href={`/market/${product.id}`} key={product.id}><div className="listing-code">{product.listingCode}</div><div><h3>{product.name}</h3><p>{product.shortDescription}</p><footer><StatusTag tone={product.legality === "FORBIDDEN" ? "danger" : "neutral"}>{product.legality}</StatusTag><span>{product.rarity}</span><span>REP {product.minReputation}+</span><span>CLR {product.minClearanceRank}+</span></footer></div><dl><dt>{nuyen(product.price)}</dt><dd>{product.stock} IN CACHE</dd></dl><ChevronRight size={17} /></a>)}</section>)}</div></>;
}

function Vendors({ snapshot, pathname }: { snapshot: CampaignSnapshot; pathname: string }) {
  const id = pathname.split("/").filter(Boolean)[1];
  const selected = id ? snapshot.vendors.find((vendor) => text(vendor, "id") === id || text(vendor, "slug") === id) : null;
  if (selected) return <><a className="back-link" href="/vendors"><ArrowLeft size={15} /> FIXER INDEX</a><div className={`vendor-page theme-${text(selected, "local_theme").toLowerCase().replaceAll("_", "-")}`}><p className="route-label">{text(selected, "node_address")}</p><h1>{text(selected, "name")}</h1><p>{text(selected, "description")}</p><div className="node-mast"><Store size={28} /><div><b>{text(selected, "vendor_type")}</b><small>{number(selected, "product_count")} CATALOGUED LISTINGS</small></div></div><a href={`/market?vendor=${text(selected, "id")}`} className="primary-command">OPEN LOCAL CATALOGUE <ArrowRight size={16} /></a></div></>;
  return <><PageIntro route="FIXER NETWORK" title="Vendors with names to protect" body="Each node keeps its own voice, rules and presentation. Availability is a campaign relationship, not a storefront promise." /><div className="vendor-directory">{snapshot.vendors.map((vendor) => <a href={`/vendors/${text(vendor, "id")}`} key={text(vendor, "id")} className={`vendor-tile theme-${text(vendor, "local_theme").toLowerCase().replaceAll("_", "-")}`}><p>{text(vendor, "node_address")}</p><h3>{text(vendor, "name")}</h3><span>{text(vendor, "description")}</span><footer><b>{text(vendor, "vendor_type")}</b><small>{number(vendor, "product_count")} LISTINGS</small></footer></a>)}</div></>;
}

function Contacts({ snapshot }: { snapshot: CampaignSnapshot }) {
  return <><PageIntro route="CONTACT NETWORK" title="People behind the relays" body="Loyalty and connection are campaign values. Hidden contacts remain absent until a relationship, faction or run unlocks them." /><div className="contact-grid">{snapshot.contacts.map((contact) => <article className="contact-sheet" key={text(contact, "id")}><header><div className="contact-avatar">{text(contact, "alias").slice(0, 2)}</div><div><p>{text(contact, "type")}</p><h3>{text(contact, "alias")}</h3><span>{text(contact, "name")}</span></div>{flag(contact, "known") ? <StatusTag tone="good">KNOWN</StatusTag> : <StatusTag>OPEN SOURCE</StatusTag>}</header><p>{text(contact, "description")}</p><dl><div><dt>LOCATION</dt><dd>{text(contact, "location")}</dd></div><div><dt>CONNECTION</dt><dd>{text(contact, "connection_rating")}</dd></div><div><dt>LOYALTY</dt><dd>{text(contact, "effective_loyalty")}</dd></div><div><dt>CHANNEL</dt><dd>{text(contact, "communication_channel")}</dd></div></dl><footer>{text(contact, "services")}</footer></article>)}</div></>;
}

function Orders({ snapshot }: { snapshot: CampaignSnapshot }) {
  return <><PageIntro route="ORDER MANIFEST" title="Dead drops and delivery states" body="Every fictional purchase has an authoritative server price, immutable ledger change and a recoverable order trail." /><section className="data-panel"><RecordTable headers={["ORDER", "VENDOR", "CONTENTS", "STATUS", "TOTAL", "CREATED"]} rows={snapshot.orders.map((order) => [<a href={`/orders/${text(order, "id")}`} key="order">{text(order, "order_code")}</a>, text(order, "vendor_name"), text(order, "items"), <StatusTag key="status" tone={text(order, "status") === "DELIVERED" ? "good" : text(order, "status") === "REJECTED" ? "danger" : "warn"}>{text(order, "status")}</StatusTag>, nuyen(order.total), timeAgo(order.created_at)])} /></section></>;
}

function Inventory({ snapshot }: { snapshot: CampaignSnapshot }) {
  return <><PageIntro route="INVENTORY" title="Authoritative carried assets" body="Players can inspect but cannot directly rewrite quantities, condition or story ownership." /><div className="inventory-grid">{snapshot.inventory.length ? snapshot.inventory.map((item) => <article className="inventory-entry" key={text(item, "id")}><div className="inventory-icon"><Boxes size={21} /></div><div><p>{text(item, "category")}{" // "}{text(item, "condition")}</p><h3>{text(item, "custom_name", text(item, "name"))}</h3><span>{text(item, "custom_description", text(item, "description"))}</span><footer><StatusTag tone="good">QTY {text(item, "quantity")}</StatusTag>{flag(item, "equipped") ? <StatusTag tone="corp">EQUIPPED</StatusTag> : null}<small>{text(item, "acquisition_source")}</small></footer></div></article>) : <EmptyState icon={Boxes} title="NO DISCLOSED INVENTORY" body="Nothing is visible in the selected runner context." />}</div></>;
}

function Messages({ snapshot }: { snapshot: CampaignSnapshot }) {
  return <><PageIntro route="PRIVATE MATRIX MAIL" title="Encrypted conversations" body="NPC source identity is explicit in the GM interface and every impersonated transmission is audited." /><section className="data-panel message-index">{snapshot.conversations.length ? snapshot.conversations.map((conversation) => <a href={`/messages/${text(conversation, "id")}`} className="message-row" key={text(conversation, "id")}><div className="message-sigil"><MessageSquareText size={18} />{number(conversation, "unread_count") ? <b>{number(conversation, "unread_count")}</b> : null}</div><div><p>{text(conversation, "last_sender")} · {timeAgo(conversation.updated_at)}</p><h3>{text(conversation, "subject")}</h3><span>{text(conversation, "last_message")}</span></div><ChevronRight size={17} /></a>) : <EmptyState icon={Inbox} title="INBOX QUIET" body="No conversation routes are currently attached to this identity." />}</section></>;
}

function Character({ viewer, snapshot }: { viewer: ViewerContext; snapshot: CampaignSnapshot }) {
  return <><PageIntro route="RUNNER DOSSIER" title={viewer.effectiveUser.characterName ?? viewer.effectiveUser.runnerAlias} body="The public-facing handle is separate from the character record. Archetype is descriptive metadata, not an authorization role." /><div className="character-dossier"><aside><div className="large-avatar">{viewer.effectiveUser.runnerAlias.slice(0, 2)}</div><p>{viewer.effectiveUser.runnerAlias}</p><span>{viewer.effectiveUser.metatype}{" // "}{viewer.effectiveUser.archetype}</span></aside><section><dl className="dossier-stats"><div><dt>STREET REPUTATION</dt><dd>{viewer.effectiveUser.streetReputation}</dd></div><div><dt>NOTORIETY</dt><dd>{viewer.effectiveUser.notoriety}</dd></div><div><dt>PUBLIC AWARENESS</dt><dd>{viewer.effectiveUser.publicAwareness}</dd></div><div><dt>MATRIX CLEARANCE</dt><dd>{viewer.effectiveUser.clearanceKey}</dd></div><div><dt>FACTION</dt><dd>{viewer.effectiveUser.factionName ?? "UNALIGNED"}</dd></div><div><dt>CONTACTS</dt><dd>{snapshot.contacts.filter((item) => flag(item, "known")).length}</dd></div></dl><div className="restriction-readout"><ShieldCheck size={18} /><div><strong>ACCOUNT CAPABILITIES</strong><span>Posting: {viewer.effectiveUser.postingRestricted ? "RESTRICTED" : "ACTIVE"} · Messaging: {viewer.effectiveUser.messagingRestricted ? "RESTRICTED" : "ACTIVE"} · Purchasing: {viewer.effectiveUser.purchasingRestricted ? "RESTRICTED" : "ACTIVE"}</span></div></div></section></div></>;
}

function SettingsPage({ viewer, effects, setEffects }: { viewer: ViewerContext; effects: Effects; setEffects: (effects: Effects) => void }) {
  return <><PageIntro route="LOCAL SETTINGS" title="Account, display and accessibility controls" body="Credential changes are authoritative. Display preferences stay on this device; strong flicker is off by default and sound never autoplays." />{viewer.effectiveUser.forcePasswordChange ? <div className="alert-strip"><ShieldAlert size={18} /><div><strong>TEMPORARY PASSCODE MUST BE REPLACED</strong><span>Other host commands remain sealed until this handshake is complete.</span></div></div> : null}<section className="data-panel editor-panel"><SectionHeader eyebrow="IDENTITY CERTIFICATE" title="Change assigned passcode" /><ActionForm endpoint="/api/account/change-password" submitLabel="REPLACE PASSCODE" successMessage="PASSCODE REPLACED"><div className="form-grid"><Field label="CURRENT PASSCODE"><input name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} /></Field><Field label="NEW PASSCODE" hint="At least 12 characters."><input name="newPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></Field><Field label="CONFIRM NEW PASSCODE"><input name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></Field></div></ActionForm></section><section className="data-panel settings-page"><SectionHeader eyebrow="THEME MATRIX" title="Readable host presentation" /><div className="theme-grid">{(["seattle", "corporate", "green", "amber", "redmond", "shamanic", "blackice", "lowband"] as ThemeKey[]).map((theme) => <button key={theme} className={effects.theme === theme ? "active" : ""} onClick={() => setEffects({ ...effects, theme })}><span className={`theme-swatch ${theme}`} /><b>{theme.toUpperCase()}</b><small>Functionally equivalent</small></button>)}</div><SectionHeader eyebrow="SIGNAL EFFECTS" title="Control ambient presentation" /><div className="setting-toggles"><ToggleFieldControl label="SCANLINES" value={effects.scanlines} onChange={(value) => setEffects({ ...effects, scanlines: value })} /><ToggleFieldControl label="NOISE" value={effects.noise} onChange={(value) => setEffects({ ...effects, noise: value })} /><ToggleFieldControl label="FLICKER" value={effects.flicker} onChange={(value) => setEffects({ ...effects, flicker: value })} /><ToggleFieldControl label="BACKGROUND GRID" value={effects.grid} onChange={(value) => setEffects({ ...effects, grid: value })} /><ToggleFieldControl label="REDUCED MOTION" value={effects.reducedMotion} onChange={(value) => setEffects({ ...effects, reducedMotion: value })} /><ToggleFieldControl label="SOUND" value={effects.sound} onChange={(value) => setEffects({ ...effects, sound: value })} /></div><Field label={`ANIMATION INTENSITY // ${Math.round(effects.intensity * 100)}%`}><input type="range" min="0" max="1" step="0.05" value={effects.intensity} onChange={(event) => setEffects({ ...effects, intensity: Number(event.target.value) })} /></Field></section></>;
}

function ToggleFieldControl({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label className="toggle-field"><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} /><span className="toggle-track" aria-hidden="true"><i /></span><span>{label}</span></label>;
}

function GmOverview({ snapshot }: { snapshot: CampaignSnapshot }) {
  const pending = snapshot.orders.filter((order) => ["AWAITING GM", "PENDING"].includes(text(order, "status"))).length;
  return <><PageIntro route="GM CONTROL HOST" title="Campaign authority overview" body="Every control below executes on the server and writes audit history. Player preview is read-only and never silently acts as the selected runner." /><div className="gm-alert"><ShieldAlert size={20} /><div><strong>ELEVATED HOST</strong><span>ROOT-equivalent campaign controls active. Fictional economy and content only.</span></div><span>SESSION VERIFIED</span></div><div className="metric-grid"><Metric label="RUNNER ACCOUNTS" value={String(snapshot.players.filter((item) => text(item, "roles").includes("PLAYER")).length)} note={`${snapshot.players.filter((item) => !flag(item, "enabled")).length} disabled`} icon={Users} /><Metric label="PENDING ORDERS" value={String(pending)} note="requires operator review" icon={PackageCheck} tone="amber" /><Metric label="ACTIVE LISTINGS" value={String(snapshot.products.filter((item) => item.active && !item.hidden).length)} note={`${snapshot.products.filter((item) => item.hidden).length} hidden`} icon={ShoppingBasket} tone="cyan" /><Metric label="AUDIT EVENTS" value={String(snapshot.audit.length)} note="immutable recent window" icon={FileClock} tone="violet" /></div><section className="data-panel quick-actions"><SectionHeader eyebrow="CONTROL SHORTCUTS" title="Authorized quick actions" /><div><a href="/gm/players/new"><UserPlus /> CREATE RUNNER</a><a href="/gm/products/new"><PackagePlus /> ADD PRODUCT</a><a href="/gm/players"><BadgeDollarSign /> ADJUST NUYEN</a><a href="/gm/hosts"><Globe2 /> CREATE MATRIX HOST</a><a href="/gm/board"><MessageSquareText /> POST AS NPC</a><a href="/gm/announcements"><Bell /> ANNOUNCEMENT</a><a href="/gm/orders"><PackageCheck /> REVIEW ORDERS</a></div></section><div className="dashboard-grid"><section className="data-panel wide"><SectionHeader eyebrow="ORDER QUEUE" title="Needs a decision" action={<a href="/gm/orders">FULL QUEUE →</a>} /><OrderReview snapshot={snapshot} compact /></section><section className="data-panel"><SectionHeader eyebrow="RUNNER WATCH" title="Recent access" /><div className="compact-list">{snapshot.players.filter((player) => text(player, "roles").includes("PLAYER")).slice(0, 5).map((player) => <a href={`/gm/players/${text(player, "id")}`} key={text(player, "id")}><div><strong>{text(player, "runner_alias")}</strong><span>{text(player, "clearance_key")} · REP {text(player, "street_reputation")}</span></div><StatusTag tone={flag(player, "enabled") ? "good" : "danger"}>{flag(player, "enabled") ? "ACTIVE" : "DISABLED"}</StatusTag></a>)}</div></section><section className="data-panel"><SectionHeader eyebrow="LATEST AUDIT" title="Control history" /><div className="audit-mini">{snapshot.audit.slice(0, 5).map((event) => <div key={text(event, "id")}><span>{timeAgo(event.created_at)}</span><strong>{text(event, "action")}</strong><p>{text(event, "summary")}</p></div>)}</div></section></div></>;
}

function CreatePlayerForm({ snapshot }: { snapshot: CampaignSnapshot }) {
  return <section className="data-panel editor-panel"><SectionHeader eyebrow="ACCOUNT + CHARACTER" title="Create runner identity" /><ActionForm endpoint="/api/gm/create-player" submitLabel="CREATE RUNNER ACCOUNT" successMessage="RUNNER CREATED"><div className="form-grid"><TextField label="LOGIN NAME" name="loginName" placeholder="ghost_circuit" hint="Lowercase letters, numbers, underscore or dash." /><TextField label="RUNNER ALIAS" name="runnerAlias" placeholder="GHOST_CIRCUIT" /><TextField label="TEMPORARY PASSWORD" name="temporaryPassword" type="password" placeholder="At least 12 characters" /><TextField label="CHARACTER NAME" name="characterName" placeholder="Campaign identity" /><SelectField label="METATYPE" name="metatype" options={["HUMAN", "ELF", "DWARF", "ORK", "TROLL"].map((item) => [item, item])} /><SelectField label="ARCHETYPE" name="archetype" options={["STREET SAMURAI", "DECKER", "RIGGER", "MAGE", "SHAMAN", "TECHNOMANCER", "FACE", "ADEPT", "INFILTRATOR", "MERCENARY"].map((item) => [item, item])} /><SelectField label="FACTION" name="factionId" options={snapshot.factions.map((item) => [text(item, "id"), text(item, "name")])} /><SelectField label="MATRIX CLEARANCE" name="clearanceId" options={snapshot.clearances.map((item) => [text(item, "id"), `${text(item, "label")} // RANK ${text(item, "rank")}`])} /><TextField label="STARTING NUYEN" name="startingNuyen" type="number" min={0} defaultValue={20000} /><TextField label="STARTING REPUTATION" name="startingReputation" type="number" min={-100} max={100} defaultValue={0} /></div><ToggleField label="FORCE PASSWORD CHANGE ON FIRST LOGIN" name="forcePasswordChange" defaultChecked /><Field label="INTERNAL GM NOTES"><textarea name="gmNotes" rows={4} placeholder="Never shown to the player." /></Field></ActionForm></section>;
}

function GmPlayers({ snapshot, pathname }: { snapshot: CampaignSnapshot; pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[2] === "new") return <><a className="back-link" href="/gm/players"><ArrowLeft size={15} /> RUNNER DIRECTORY</a><PageIntro route="GM/RUNNERS/NEW" title="Provision a runner" body="Public registration remains disabled. The temporary passcode is hashed before storage and never appears in audit state." /><CreatePlayerForm snapshot={snapshot} /></>;
  if (parts[2]) {
    const player = snapshot.players.find((item) => text(item, "id") === parts[2]);
    if (!player) return <EmptyState title="RUNNER NOT FOUND" body="The account may have been removed from this campaign host." />;
    return <><a className="back-link" href="/gm/players"><ArrowLeft size={15} /> RUNNER DIRECTORY</a><PageIntro route={`GM/RUNNERS/${text(player, "id")}`} title={text(player, "runner_alias")} body={`${text(player, "character_name")} // ${text(player, "metatype")} ${text(player, "archetype")}`} actions={<StatusTag tone={flag(player, "enabled") ? "good" : "danger"}>{flag(player, "enabled") ? "ACTIVE" : "DISABLED"}</StatusTag>} /><nav className="record-tabs"><button className="active">OVERVIEW</button><button>ACCOUNT</button><button>CHARACTER</button><button>PERMISSIONS</button><button>INVENTORY</button><button>ORDERS</button><button>TRANSACTIONS</button><button>GM NOTES</button><button>AUDIT</button></nav><div className="dossier-grid"><section className="data-panel"><SectionHeader eyebrow="CURRENT STATE" title="Campaign values" /><dl className="dossier-stats"><div><dt>BALANCE</dt><dd>{nuyen(player.balance)}</dd></div><div><dt>REPUTATION</dt><dd>{text(player, "street_reputation")}</dd></div><div><dt>CLEARANCE</dt><dd>{text(player, "clearance_key")}</dd></div><div><dt>FACTION</dt><dd>{text(player, "faction_name")}</dd></div></dl><ActionForm endpoint="/api/gm/adjust-player" submitLabel="COMMIT ADJUSTMENT"><input type="hidden" name="userId" value={text(player, "id")} /><div className="form-grid"><TextField label="NUYEN DELTA" name="nuyenDelta" type="number" defaultValue={0} /><TextField label="REPUTATION DELTA" name="reputationDelta" type="number" defaultValue={0} /><SelectField label="NEW CLEARANCE" name="clearanceId" defaultValue={snapshot.clearances.find((item) => text(item, "key") === text(player, "clearance_key")) ? text(snapshot.clearances.find((item) => text(item, "key") === text(player, "clearance_key"))!, "id") : ""} options={snapshot.clearances.map((item) => [text(item, "id"), text(item, "label")])} /><TextField label="REASON" name="reason" placeholder="Required audit explanation" /></div></ActionForm></section><aside className="data-panel"><SectionHeader eyebrow="SAFE INSPECTION" title="Preview as player" /><p className="long-copy">Preview changes only the read context of this GM session. Mutating controls disappear and server actions are rejected.</p><ActionForm endpoint="/api/gm/preview" submitLabel="ENTER READ-ONLY PREVIEW"><input type="hidden" name="userId" value={text(player, "id")} /></ActionForm><div className="restriction-readout"><ShieldAlert size={18} /><div><strong>RESTRICTIONS</strong><span>Post {flag(player, "posting_restricted") ? "BLOCKED" : "OK"} · Message {flag(player, "messaging_restricted") ? "BLOCKED" : "OK"} · Purchase {flag(player, "purchasing_restricted") ? "BLOCKED" : "OK"}</span></div></div></aside></div></>;
  }
  return <><PageIntro route="GM/RUNNERS" title="Runner account directory" body="Searchable campaign identities with server-owned role, economy, clearance and restriction state." actions={<a className="primary-command" href="/gm/players/new"><UserPlus size={16} /> CREATE RUNNER</a>} /><div className="filter-bar"><label><Search size={15} /><input placeholder="Search alias, character or login" /></label><select aria-label="Filter account status"><option>ALL STATUS</option><option>ACTIVE</option><option>DISABLED</option></select><select aria-label="Filter clearance"><option>ALL CLEARANCE</option>{snapshot.clearances.map((item) => <option key={text(item, "id")}>{text(item, "label")}</option>)}</select></div><section className="data-panel"><RecordTable headers={["RUNNER", "CHARACTER", "ROLE", "FACTION", "CLEARANCE", "BALANCE", "REP", "LAST LOGIN", "STATUS", ""]} rows={snapshot.players.map((player) => [<div key="runner"><strong>{text(player, "runner_alias")}</strong><small>{text(player, "login_name")}</small></div>, <div key="char"><strong>{text(player, "character_name")}</strong><small>{text(player, "metatype")} · {text(player, "archetype")}</small></div>, text(player, "roles"), text(player, "faction_name"), <StatusTag key="clear" tone="corp">{text(player, "clearance_key")}</StatusTag>, nuyen(player.balance), text(player, "street_reputation"), timeAgo(player.last_login_at), <StatusTag key="status" tone={flag(player, "enabled") ? "good" : "danger"}>{flag(player, "enabled") ? "ACTIVE" : "DISABLED"}</StatusTag>, <a className="row-action" href={`/gm/players/${text(player, "id")}`} key="open" title={`Open ${text(player, "runner_alias")}`}><ChevronRight size={16} /></a>])} /></section></>;
}

function CreateProductForm({ snapshot }: { snapshot: CampaignSnapshot }) {
  return <section className="data-panel editor-panel"><SectionHeader eyebrow="IDENTIFICATION + ACCESS" title="Create black-market listing" /><ActionForm endpoint="/api/gm/create-product" submitLabel="PUBLISH PRODUCT"><div className="form-grid"><TextField label="NAME" name="name" placeholder="Original fictional item" /><TextField label="LISTING CODE" name="listingCode" placeholder="CC-NEW-01" /><SelectField label="CATEGORY" name="categoryId" options={snapshot.categories.map((item) => [text(item, "id"), text(item, "name")])} /><SelectField label="VENDOR" name="vendorId" options={snapshot.vendors.map((item) => [text(item, "id"), text(item, "name")])} /><TextField label="PRICE IN NUYEN" name="price" type="number" min={0} defaultValue={1000} /><TextField label="STOCK" name="stock" type="number" min={0} defaultValue={1} /><SelectField label="RARITY" name="rarity" options={["COMMON", "UNCOMMON", "SCARCE", "RARE", "MILITARY", "EXPERIMENTAL", "UNIQUE"].map((item) => [item, item])} /><SelectField label="LEGALITY" name="legality" options={["LEGAL", "LICENSE REQUIRED", "RESTRICTED", "FORBIDDEN", "CORPORATE CONTROLLED", "UNKNOWN"].map((item) => [item, item])} /><TextField label="MIN REPUTATION" name="minReputation" type="number" min={-100} max={100} defaultValue={0} /><SelectField label="MIN CLEARANCE" name="minClearanceRank" options={snapshot.clearances.map((item) => [text(item, "rank"), `${text(item, "label")} // ${text(item, "rank")}`])} /></div><TextField label="SHORT DESCRIPTION" name="shortDescription" placeholder="One compact catalogue line." /><Field label="FULL DESCRIPTION"><textarea name="fullDescription" rows={6} required minLength={20} /></Field><div className="toggle-row"><ToggleField label="REQUIRES GM APPROVAL" name="requiresGmApproval" /><ToggleField label="HIDDEN ON PUBLISH" name="hidden" /></div></ActionForm></section>;
}

function GmProducts({ snapshot, pathname }: { snapshot: CampaignSnapshot; pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[2] === "new") return <><a className="back-link" href="/gm/products"><ArrowLeft size={15} /> PRODUCT DIRECTORY</a><PageIntro route="GM/PRODUCTS/NEW" title="Publish a restricted listing" body="Price, stock and visibility rules become server authority. GM-only notes never enter player payloads." /><CreateProductForm snapshot={snapshot} /></>;
  return <><PageIntro route="GM/PRODUCTS" title="Market catalogue control" body="Hide, reveal and inspect original fictional campaign listings without deleting their order history." actions={<a className="primary-command" href="/gm/products/new"><PackagePlus size={16} /> ADD PRODUCT</a>} /><section className="data-panel"><RecordTable headers={["CODE", "LISTING", "VENDOR", "ACCESS", "PRICE", "STOCK", "STATE", "CONTROL"]} rows={snapshot.products.map((product) => [product.listingCode, <div key="name"><strong>{product.name}</strong><small>{product.category} · {product.rarity}</small></div>, product.vendorName, `REP ${product.minReputation} / CLR ${product.minClearanceRank}`, nuyen(product.price), String(product.stock), <div key="state"><StatusTag tone={product.active && !product.hidden ? "good" : "warn"}>{product.active ? product.hidden ? "HIDDEN" : "VISIBLE" : "INACTIVE"}</StatusTag></div>, <ActionForm key="toggle" endpoint="/api/gm/toggle-product" submitLabel={product.hidden ? "REVEAL" : "HIDE"} className="inline-action"><input type="hidden" name="productId" value={product.id} /><input type="hidden" name="hidden" value={product.hidden ? "false" : "true"} /></ActionForm>])} /></section></>;
}

function GmVendors({ snapshot }: { snapshot: CampaignSnapshot }) {
  return <><PageIntro route="GM/VENDORS" title="Fixers and authored market nodes" body="Create a distinct operator node before attaching products to it." /><div className="dossier-grid"><section className="data-panel"><SectionHeader eyebrow="NEW OPERATOR" title="Create vendor" /><ActionForm endpoint="/api/gm/create-vendor" submitLabel="CREATE VENDOR"><div className="form-grid"><TextField label="VENDOR NAME" name="name" placeholder="Original operator name" /><SelectField label="TYPE" name="vendorType" options={["FIXER", "STREET DOC", "TALISMONGER", "SMUGGLER", "ARMS DEALER", "CORPORATE CONTACT", "GANG"].map((item) => [item, item])} /><TextField label="NODE ADDRESS" name="nodeAddress" placeholder="SG://SEA.00/NODE" /><SelectField label="LOCAL THEME" name="localTheme" options={["STREET", "LOW BANDWIDTH", "CORPORATE", "SHAMANIC", "GREEN PHOSPHOR"].map((item) => [item, item])} /></div><Field label="DESCRIPTION"><textarea name="description" rows={5} required minLength={20} /></Field></ActionForm></section><section className="data-panel"><SectionHeader eyebrow="CURRENT OPERATORS" title={`${snapshot.vendors.length} vendor nodes`} /><div className="compact-list">{snapshot.vendors.map((vendor) => <div key={text(vendor, "id")}><div><strong>{text(vendor, "name")}</strong><span>{text(vendor, "node_address")} · {text(vendor, "vendor_type")}</span></div><StatusTag tone={flag(vendor, "active") ? "good" : "warn"}>{flag(vendor, "active") ? "ACTIVE" : "OFFLINE"}</StatusTag></div>)}</div></section></div></>;
}

function OrderReview({ snapshot, compact = false }: { snapshot: CampaignSnapshot; compact?: boolean }) {
  const pending = snapshot.orders.filter((order) => ["AWAITING GM", "PENDING"].includes(text(order, "status")));
  if (!pending.length) return <EmptyState icon={PackageCheck} title="ORDER QUEUE CLEAR" body="No vendor is waiting for a Game Master decision." />;
  return <div className="order-review">{pending.slice(0, compact ? 4 : undefined).map((order) => <article key={text(order, "id")}><div><p>{text(order, "order_code")} · {text(order, "runner_alias")}</p><h3>{text(order, "items")}</h3><span>{text(order, "vendor_name")} · {nuyen(order.total)}</span></div><div className="decision-actions"><ActionForm endpoint="/api/gm/process-order" submitLabel="APPROVE" className="inline-action approve"><input type="hidden" name="orderId" value={text(order, "id")} /><input type="hidden" name="decision" value="APPROVE" /></ActionForm><ActionForm endpoint="/api/gm/process-order" submitLabel="REJECT" className="inline-action reject"><input type="hidden" name="orderId" value={text(order, "id")} /><input type="hidden" name="decision" value="REJECT" /></ActionForm></div></article>)}</div>;
}

function GmHosts({ snapshot }: { snapshot: CampaignSnapshot }) {
  return <><PageIntro route="GM/MATRIX HOSTS" title="Host directories and clearance gates" body="Create a node with an address, local theme, reputation floor and Matrix clearance floor." /><div className="dossier-grid"><section className="data-panel"><SectionHeader eyebrow="NEW HOST" title="Provision Matrix directory" /><ActionForm endpoint="/api/gm/create-host" submitLabel="CREATE MATRIX HOST"><div className="form-grid"><TextField label="HOST NAME" name="name" placeholder="DEAD DROP INDEX" /><TextField label="NODE ADDRESS" name="nodeAddress" placeholder="SG://NULL.00/DROP" /><SelectField label="VISUAL THEME" name="theme" options={["SEATTLE GRID", "CORPORATE HOST", "GREEN PHOSPHOR", "AMBER TERMINAL", "REDMOND BBS", "SHAMANIC NODE", "BLACK ICE"].map((item) => [item, item])} /><TextField label="MIN REPUTATION" name="minReputation" type="number" min={0} defaultValue={0} /><SelectField label="MIN CLEARANCE" name="minClearanceRank" options={snapshot.clearances.map((item) => [text(item, "rank"), `${text(item, "label")} // ${text(item, "rank")}`])} /></div><Field label="HOST DESCRIPTION"><textarea name="description" required minLength={12} rows={5} /></Field><ToggleField label="HIDDEN ON CREATE" name="hidden" /></ActionForm></section><section className="data-panel"><SectionHeader eyebrow="DIRECTORY" title={`${snapshot.hosts.length} known hosts`} /><div className="compact-list">{snapshot.hosts.map((host) => <a key={text(host, "id")} href={`/board/${text(host, "slug")}`}><div><strong>{text(host, "name")}</strong><span>{text(host, "node_address")} · REP {text(host, "min_reputation")} · CLR {text(host, "min_clearance_rank")}</span></div><StatusTag tone={flag(host, "hidden") ? "warn" : "good"}>{flag(host, "hidden") ? "HIDDEN" : "OPEN"}</StatusTag></a>)}</div></section></div></>;
}

function GmBoard({ snapshot }: { snapshot: CampaignSnapshot }) {
  return <><PageIntro route="GM/SHADOW BOARD" title="Publish as runner, NPC or system" body="Non-player identities must be chosen explicitly here. The source mode and acting GM are written to audit history." /><div className="dossier-grid"><section className="data-panel"><SectionHeader eyebrow="NPC TRANSMISSION" title="Open a controlled thread" /><ActionForm endpoint="/api/board/create-thread" submitLabel="POST AS SELECTED IDENTITY"><SelectField label="HOST" name="hostId" options={snapshot.hosts.map((item) => [text(item, "id"), `${text(item, "name")} // ${text(item, "node_address")}`])} /><div className="form-grid"><TextField label="TITLE" name="title" placeholder="Thread subject" /><SelectField label="AUTHOR MODE" name="displayMode" options={["NPC_IDENTITY", "SYSTEM", "CORPORATE_RELAY", "UNKNOWN_SOURCE", "ANONYMOUS"].map((item) => [item, item])} /><TextField label="SOURCE LABEL" name="authorLabel" placeholder="VELA / GRID KEEPER / UNKNOWN" /></div><Field label="MESSAGE"><textarea name="content" rows={7} required minLength={8} /></Field></ActionForm></section><section className="data-panel"><SectionHeader eyebrow="RECENT THREADS" title="Moderator window" /><div className="feed-list">{snapshot.threads.slice(0, 7).map((thread) => <FeedRow key={text(thread, "id")} thread={thread} />)}</div></section></div></>;
}

function AuditLog({ snapshot }: { snapshot: CampaignSnapshot }) {
  return <><PageIntro route="GM/AUDIT" title="Immutable control history" body="Sensitive actions record actor, target, summary, before and after state, timestamp and limited request metadata. Entries cannot be edited through the application." /><section className="data-panel audit-log"><RecordTable headers={["TIME", "ACTOR", "ACTION", "TARGET", "SUMMARY", "STATE"]} rows={snapshot.audit.map((event) => [timeAgo(event.created_at), text(event, "actor_alias", "SYSTEM"), <StatusTag key="action" tone={text(event, "action").includes("REJECT") || text(event, "action").includes("SUSPEND") ? "danger" : "neutral"}>{text(event, "action")}</StatusTag>, `${text(event, "target_type")} // ${text(event, "target_id")}`, text(event, "summary"), <details key="state"><summary>INSPECT</summary><pre>{text(event, "after_state", text(event, "before_state", "{}"))}</pre></details>])} /></section></>;
}

function Economy({ snapshot }: { snapshot: CampaignSnapshot }) {
  const circulation = snapshot.players.reduce((total, player) => total + number(player, "balance"), 0);
  return <><PageIntro route="GM/ECONOMY" title="Nuyen ledger" body="Every balance mutation has before/after values, reason and actor. Ledger rows are immutable campaign records." /><div className="metric-grid"><Metric label="RUNNER LIQUIDITY" value={nuyen(circulation)} note="visible account total" icon={CircleDollarSign} /><Metric label="LEDGER WINDOW" value={String(snapshot.ledger.length)} note="recent entries loaded" icon={FileClock} tone="cyan" /><Metric label="PURCHASE FLOW" value={nuyen(snapshot.ledger.filter((row) => text(row, "type") === "PURCHASE").reduce((sum, row) => sum + Math.abs(number(row, "amount")), 0))} note="recent fictional spend" icon={ShoppingBasket} tone="amber" /><Metric label="NONNEGATIVE GUARD" value="ACTIVE" note="database trigger enforced" icon={ShieldCheck} tone="violet" /></div><section className="data-panel"><RecordTable headers={["TIME", "RUNNER", "TYPE", "AMOUNT", "BEFORE", "AFTER", "REASON"]} rows={snapshot.ledger.map((entry) => [timeAgo(entry.created_at), text(entry, "runner_alias", "CURRENT RUNNER"), <StatusTag key="type" tone={number(entry, "amount") >= 0 ? "good" : "warn"}>{text(entry, "type")}</StatusTag>, nuyen(entry.amount), nuyen(entry.balance_before), nuyen(entry.balance_after), text(entry, "reason")])} /></section></>;
}

function GenericGmModule({ snapshot, module }: { snapshot: CampaignSnapshot; module: string }) {
  if (module === "orders") return <><PageIntro route="GM/ORDERS" title="Order processing queue" body="Approval delivers reserved items; rejection refunds nuyen and restores finite stock in one guarded batch." /><section className="data-panel"><OrderReview snapshot={snapshot} /></section></>;
  if (module === "contacts") return <Contacts snapshot={snapshot} />;
  if (module === "jobs") return <Jobs snapshot={snapshot} pathname="/jobs" />;
  if (module === "economy") return <Economy snapshot={snapshot} />;
  if (module === "audit") return <AuditLog snapshot={snapshot} />;
  if (module === "inventories") return <><PageIntro route="GM/INVENTORIES" title="Runner inventory matrix" body="The current implementation exposes authoritative inventory through player detail and order workflows." /><section className="data-panel"><RecordTable headers={["RUNNER", "ITEM", "QTY", "CONDITION", "SOURCE"]} rows={snapshot.inventory.map((item) => ["SELECTED CONTEXT", text(item, "name"), text(item, "quantity"), text(item, "condition"), text(item, "acquisition_source")])} /></section></>;
  if (module === "characters") return <><PageIntro route="GM/CHARACTERS" title="Character dossier index" body="Character archetypes remain metadata; authorization is controlled separately through roles and permissions." /><section className="data-panel"><RecordTable headers={["RUNNER", "CHARACTER", "METATYPE", "ARCHETYPE", "FACTION", "REP"]} rows={snapshot.players.filter((row) => text(row, "roles").includes("PLAYER")).map((row) => [text(row, "runner_alias"), text(row, "character_name"), text(row, "metatype"), text(row, "archetype"), text(row, "faction_name"), text(row, "street_reputation")])} /></section></>;
  if (module === "messages") return <><PageIntro route="GM/MESSAGES" title="NPC message control" body="The seeded inbox demonstrates explicit source labels; authoring UI is reserved for the next messaging slice." /><Messages snapshot={snapshot} /></>;
  if (module === "announcements") return <><PageIntro route="GM/ANNOUNCEMENTS" title="Campaign broadcast control" body="Targeting rules are enforced when player feeds load. Current seeded announcements show severity and clearance filtering." /><section className="data-panel"><RecordTable headers={["SEVERITY", "TITLE", "SOURCE", "CLEARANCE", "STATE"]} rows={snapshot.announcements.map((row) => [<StatusTag key="severity" tone={text(row, "severity").includes("ASTRAL") ? "magic" : text(row, "severity").includes("HOSTILE") ? "danger" : "neutral"}>{text(row, "severity")}</StatusTag>, text(row, "title"), text(row, "source_label"), text(row, "min_clearance_rank"), flag(row, "active") ? "ACTIVE" : "INACTIVE"])} /></section></>;
  return <><PageIntro route={`GM/${module.toUpperCase()}`} title="Campaign host configuration" body="This control surface shares the same server authorization and immutable audit boundary as the implemented vertical slice." /><section className="data-panel"><EmptyState icon={Settings} title="CONFIGURATION NODE RESERVED" body="The database model and route are present; controls beyond the first vertical slice remain deliberately inactive." /></section></>;
}

function ContextPanel({ snapshot, viewer, onSettings }: { snapshot: CampaignSnapshot; viewer: ViewerContext; onSettings: () => void }) {
  return <aside className="context-panel"><section><p className="eyebrow">IDENTITY CERT</p><div className="identity-block"><div>{viewer.effectiveUser.runnerAlias.slice(0, 2)}</div><strong>{viewer.effectiveUser.runnerAlias}</strong><span>{viewer.effectiveUser.clearanceKey} CLEARANCE</span></div><dl className="terminal-list"><div><dt>FACTION</dt><dd>{viewer.effectiveUser.factionName ?? "UNALIGNED"}</dd></div><div><dt>REP / NOTORIETY</dt><dd>{viewer.effectiveUser.streetReputation} / {viewer.effectiveUser.notoriety}</dd></div><div><dt>NUYEN</dt><dd>{nuyen(viewer.effectiveUser.nuyen)}</dd></div></dl></section><section><p className="eyebrow">WATCHED ROUTES</p>{snapshot.hosts.slice(0, 3).map((host) => <a href={`/board/${text(host, "slug")}`} key={text(host, "id")}><span>{text(host, "icon")}</span><div><strong>{text(host, "name")}</strong><small>{number(host, "thread_count")} signals</small></div></a>)}</section><section><p className="eyebrow">PIRATE BAND // MUTED</p><div className="radio-line"><button title="Sound is off" onClick={onSettings}><Radio size={18} /></button><div><strong>KSM-2080</strong><span>NO AUDIO AUTOPLAY</span></div><i /></div></section></aside>;
}

export function ShadowGridApp({ pathname, viewer, snapshot }: { pathname: string; viewer: ViewerContext; snapshot: CampaignSnapshot }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [effects, setEffectsState] = useState<Effects>(defaultEffects);
  const selectedIndex = useRef(0);
  const gmMode = pathname === "/gm" || pathname.startsWith("/gm/");
  const navigation = gmMode ? gmNavigation : playerNavigation;

  useEffect(() => {
    const stored = window.localStorage.getItem("shadowgrid.effects");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (stored) {
      try { setEffectsState({ ...defaultEffects, ...JSON.parse(stored), reducedMotion: motion || Boolean(JSON.parse(stored).reducedMotion) }); } catch { setEffectsState({ ...defaultEffects, reducedMotion: motion }); }
    } else setEffectsState({ ...defaultEffects, reducedMotion: motion });
  }, []);
  function setEffects(next: Effects) { setEffectsState(next); window.localStorage.setItem("shadowgrid.effects", JSON.stringify(next)); }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandsOpen(true); return; }
      if (event.key === "Escape") { setCommandsOpen(false); setSettingsOpen(false); setMenuOpen(false); return; }
      if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
      const rows = Array.from(document.querySelectorAll<HTMLElement>(".navigable"));
      if (!rows.length) return;
      if (event.key.toLowerCase() === "j" || event.key.toLowerCase() === "k") {
        event.preventDefault();
        selectedIndex.current = event.key.toLowerCase() === "j" ? Math.min(rows.length - 1, selectedIndex.current + 1) : Math.max(0, selectedIndex.current - 1);
        rows[selectedIndex.current]?.focus(); rows[selectedIndex.current]?.scrollIntoView({ block: "nearest" });
      }
      if (event.key === "Enter" && document.activeElement?.classList.contains("navigable")) {
        const href = (document.activeElement as HTMLElement).dataset.href; if (href) window.location.assign(href);
      }
    }
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    window.location.assign("/login");
  }

  async function exitPreview() {
    await fetch("/api/gm/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "" }) });
    window.location.assign("/gm");
  }

  const content = useMemo(() => {
    const activeModule = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
    if (activeModule === "gm") {
      const gmModule = pathname.split("/").filter(Boolean)[1] ?? "overview";
      if (gmModule === "overview") return <GmOverview snapshot={snapshot} />;
      if (gmModule === "players") return <GmPlayers snapshot={snapshot} pathname={pathname} />;
      if (gmModule === "products") return <GmProducts snapshot={snapshot} pathname={pathname} />;
      if (gmModule === "vendors") return <GmVendors snapshot={snapshot} />;
      if (gmModule === "hosts") return <GmHosts snapshot={snapshot} />;
      if (gmModule === "board") return <GmBoard snapshot={snapshot} />;
      return <GenericGmModule snapshot={snapshot} module={gmModule} />;
    }
    if (activeModule === "dashboard") return <Dashboard snapshot={snapshot} viewer={viewer} />;
    if (activeModule === "feed") return <GridFeed snapshot={snapshot} />;
    if (activeModule === "board") return <Board snapshot={snapshot} pathname={pathname} viewer={viewer} />;
    if (activeModule === "jobs") return <Jobs snapshot={snapshot} pathname={pathname} />;
    if (activeModule === "market") return <Market snapshot={snapshot} pathname={pathname} viewer={viewer} />;
    if (activeModule === "vendors") return <Vendors snapshot={snapshot} pathname={pathname} />;
    if (activeModule === "contacts") return <Contacts snapshot={snapshot} />;
    if (activeModule === "orders") return <Orders snapshot={snapshot} />;
    if (activeModule === "inventory") return <Inventory snapshot={snapshot} />;
    if (activeModule === "messages") return <Messages snapshot={snapshot} />;
    if (activeModule === "character") return <Character viewer={viewer} snapshot={snapshot} />;
    if (activeModule === "settings") return <SettingsPage viewer={viewer} effects={effects} setEffects={setEffects} />;
    return <Dashboard snapshot={snapshot} viewer={viewer} />;
  }, [effects, pathname, snapshot, viewer]);

  return <div className={`shadowgrid ${gmMode ? "gm-mode" : "player-mode"}`} data-theme={effects.theme} data-scanlines={effects.scanlines} data-noise={effects.noise} data-flicker={effects.flicker} data-grid={effects.grid} data-reduced-motion={effects.reducedMotion} style={{ "--effect-intensity": effects.intensity } as React.CSSProperties}>
    {viewer.isPreview ? <div className="preview-bar"><Eye size={16} /><strong>PREVIEW AS {viewer.effectiveUser.runnerAlias}</strong><span>READ-ONLY PLAYER CONTEXT · ACTIONS DISABLED</span><button onClick={exitPreview}>EXIT PREVIEW <X size={15} /></button></div> : null}
    <header className="matrix-status"><button className="mobile-menu" onClick={() => setMenuOpen(true)} title="Open navigation"><Menu size={19} /></button><a href={gmMode ? "/gm" : "/dashboard"} className="mini-brand"><span>SG</span><div><strong>SHADOWGRID</strong><small>{gmMode ? "CONTROL HOST" : "RAIN CITY HOST"}</small></div></a><div className="status-route"><span className="live-dot" /><div><small>CURRENT HOST</small><strong>{gmMode ? "GM://ROOT-CONTROL" : "SG://SEA.00/LOCAL"}</strong></div></div><div className="status-chip"><small>ROUTE</small><strong>3 RELAYS</strong></div><div className="status-chip"><small>TRACE RISK</small><strong className="warning-text">LOW / FICTIONAL</strong></div><div className="status-spacer" /><div className="status-balance"><WalletCards size={15} /><div><small>AVAILABLE</small><strong>{nuyen(viewer.effectiveUser.nuyen)}</strong></div></div><div className="status-user"><div>{viewer.effectiveUser.runnerAlias.slice(0, 2)}</div><span><small>{viewer.effectiveUser.clearanceKey} CLEARANCE</small><strong>{viewer.effectiveUser.runnerAlias}</strong></span></div><button className="icon-button" onClick={() => setSettingsOpen(true)} title="Display settings"><SlidersHorizontal size={18} /></button></header>
    <aside className={`node-nav ${menuOpen ? "open" : ""}`}><div className="nav-head"><div className="brand-mark"><span>SG</span><b>⌁</b></div><button className="nav-close" onClick={() => setMenuOpen(false)} title="Close navigation"><X size={18} /></button></div><p className="nav-section">{gmMode ? "CAMPAIGN AUTHORITY" : "RUNNER NODES"}</p><nav>{navigation.map(([href, label, Icon]) => <a key={href} href={href} className={pathname === href || (href !== "/gm" && href !== "/dashboard" && pathname.startsWith(`${href}/`)) ? "active" : ""}><Icon size={17} aria-hidden="true" /><span>{label}</span>{label === "MESSAGES" && snapshot.conversations.some((item) => number(item, "unread_count") > 0) ? <b>{snapshot.conversations.reduce((sum, item) => sum + number(item, "unread_count"), 0)}</b> : null}</a>)}</nav>{viewer.actor.roles.includes("GAME_MASTER") && !viewer.isPreview ? <a className="mode-switch" href={gmMode ? "/dashboard" : "/gm"}>{gmMode ? <><Eye size={16} /> PLAYER SURFACE</> : <><ShieldAlert size={16} /> GM CONTROL HOST</>}</a> : null}<div className="nav-foot"><button onClick={() => setCommandsOpen(true)}><Command size={16} /><span>COMMANDS</span><kbd>⌘K</kbd></button><button onClick={logout}><LogOut size={16} /><span>DISCONNECT</span></button></div></aside>
    {menuOpen ? <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} /> : null}
    <main className="main-content">{content}</main>
    <ContextPanel snapshot={snapshot} viewer={viewer} onSettings={() => setSettingsOpen(true)} />
    <footer className="command-bar"><button onClick={() => setCommandsOpen(true)}><kbd>CTRL K</kbd> COMMANDS</button><span><kbd>J / K</kbd> NAVIGATE</span><span><kbd>ENTER</kbd> OPEN</span><span><kbd>ESC</kbd> CLOSE</span><i /> <b>{snapshot.campaignName} · {new Date(snapshot.campaignTime).toLocaleString()}</b></footer>
    {settingsOpen ? <div className="dialog-backdrop" role="presentation" onMouseDown={() => setSettingsOpen(false)}><section className="control-dialog" role="dialog" aria-modal="true" aria-labelledby="display-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">LOCAL DISPLAY CONTROLS</p><h2 id="display-title">Signal effects</h2></div><button onClick={() => setSettingsOpen(false)} title="Close"><X size={19} /></button></header><div className="setting-toggles"><ToggleFieldControl label="SCANLINES" value={effects.scanlines} onChange={(value) => setEffects({ ...effects, scanlines: value })} /><ToggleFieldControl label="NOISE" value={effects.noise} onChange={(value) => setEffects({ ...effects, noise: value })} /><ToggleFieldControl label="FLICKER" value={effects.flicker} onChange={(value) => setEffects({ ...effects, flicker: value })} /><ToggleFieldControl label="BACKGROUND GRID" value={effects.grid} onChange={(value) => setEffects({ ...effects, grid: value })} /><ToggleFieldControl label="REDUCED MOTION" value={effects.reducedMotion} onChange={(value) => setEffects({ ...effects, reducedMotion: value })} /><ToggleFieldControl label="SOUND" value={effects.sound} onChange={(value) => setEffects({ ...effects, sound: value })} /></div><Field label={`ANIMATION INTENSITY // ${Math.round(effects.intensity * 100)}%`}><input type="range" min="0" max="1" step="0.05" value={effects.intensity} onChange={(event) => setEffects({ ...effects, intensity: Number(event.target.value) })} /></Field><p className="dialog-note">Flicker and sound are off by default. No essential information depends on these effects.</p></section></div> : null}
    {commandsOpen ? <div className="dialog-backdrop" role="presentation" onMouseDown={() => setCommandsOpen(false)}><section className="command-dialog" role="dialog" aria-modal="true" aria-labelledby="command-title" onMouseDown={(event) => event.stopPropagation()}><header><TerminalSquare size={20} /><div><p className="eyebrow">KEYBOARD ROUTER</p><h2 id="command-title">Open a node</h2></div><button onClick={() => setCommandsOpen(false)} title="Close"><X size={19} /></button></header><label><Search size={16} /><input autoFocus placeholder="Type a node name or command…" /></label><div>{navigation.slice(0, 8).map(([href, label, Icon]) => <a href={href} key={href}><Icon size={16} /><span>{label}</span><kbd>↵</kbd></a>)}</div><footer>J / K navigates visible entries without replacing browser shortcuts.</footer></section></div> : null}
  </div>;
}
