"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, PointerEvent, WheelEvent, type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import type { ViewerContext } from "../lib/auth";
import type { CampaignSnapshot } from "../lib/campaign";

type Row = Record<string, unknown>;
type Mode = "pulse" | "contracts" | "exchange" | "whispers" | "persona" | "root";
type Phosphor = "green" | "amber" | "ice";
type Packet = {
  id: string;
  stamp: string;
  source: string;
  title: string;
  body: string;
  meta: string;
  alarm?: boolean;
};
type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getVideoData: () => { title?: string };
  destroy: () => void;
};
type YouTubeApi = {
  Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayer;
  PlayerState: { PLAYING: number };
};

const modeOrder: Mode[] = ["pulse", "contracts", "exchange", "whispers", "persona", "root"];
const modeMeta: Record<Mode, { key: string; command: string; label: string; path: string }> = {
  pulse: { key: "F1", command: "pulse", label: "СЕТЕВОЙ ПУЛЬС", path: "/var/grid/pulse" },
  contracts: { key: "F2", command: "jobs", label: "КОНТРАКТЫ", path: "/mnt/dead-drops/jobs" },
  exchange: { key: "F3", command: "market", label: "ОБМЕННИК", path: "/dev/black-market" },
  whispers: { key: "F4", command: "whispers", label: "ШЁПОТ", path: "/home/ghost/mail" },
  persona: { key: "F5", command: "whoami", label: "ПЕРСОНА", path: "/proc/self" },
  root: { key: "F6", command: "root", label: "ROOT-СЛОЙ", path: "/root/overwatch" },
};

const KEYGEN_UPLOADS = "UUHgbw5cuDIas28eMvbI8Nqg";

function value(row: Row, ...keys: string[]): string {
  for (const key of keys) {
    const candidate = row[key];
    if (candidate !== null && candidate !== undefined && candidate !== "") return String(candidate);
  }
  return "NULL";
}

function amount(input: unknown): string {
  return `${new Intl.NumberFormat("ru-RU").format(Number(input) || 0)} ¥`;
}

function shortTime(input: unknown): string {
  if (!input) return "--:--";
  const date = new Date(String(input));
  if (!Number.isFinite(date.getTime())) return String(input).slice(0, 5);
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function makeRouteToken(): string {
  const segments = ["SEA", "PUGET", "NULL", "MIRROR", "GHOST", "73A", "TAC", "VOID"];
  return Array.from({ length: 4 }, () => segments[Math.floor(Math.random() * segments.length)]).join(">");
}

function buildPackets(snapshot: CampaignSnapshot, viewer: ViewerContext): Record<Mode, Packet[]> {
  const announcements = snapshot.announcements.slice(0, 2).map((row, index) => ({
    id: `notice-${value(row, "id", "title")}-${index}`,
    stamp: shortTime(row.created_at),
    source: value(row, "source_label", "severity"),
    title: value(row, "title"),
    body: value(row, "body", "content", "message"),
    meta: `BROADCAST/${value(row, "severity")} · CLR ${value(row, "min_clearance_rank")}`,
    alarm: value(row, "severity").includes("HOSTILE"),
  }));
  const threads = snapshot.threads.slice(0, 8).map((row, index) => ({
    id: `thread-${value(row, "id")}-${index}`,
    stamp: shortTime(row.updated_at ?? row.created_at),
    source: value(row, "author", "author_label", "host_name"),
    title: value(row, "title"),
    body: value(row, "excerpt", "content_markdown", "last_message"),
    meta: `${value(row, "host_name", "node_address")} · ${value(row, "reply_count", "post_count")} REPLIES`,
  }));
  const contracts = snapshot.jobs.slice(0, 8).map((row, index) => ({
    id: `job-${value(row, "id")}-${index}`,
    stamp: value(row, "status").slice(0, 5),
    source: value(row, "johnson_alias", "fixer_alias"),
    title: value(row, "title"),
    body: value(row, "short_briefing", "full_briefing", "description"),
    meta: `${value(row, "location")} · ${amount(row.payment ?? row.reward)}`,
    alarm: ["HOT", "CLASSIFIED"].some((token) => value(row, "status").includes(token)),
  }));
  const exchange = snapshot.products.slice(0, 10).map((product, index) => ({
    id: `lot-${product.id}-${index}`,
    stamp: product.listingCode.slice(-5),
    source: product.vendorName,
    title: product.name,
    body: product.shortDescription,
    meta: `${amount(product.price)} · CACHE ${product.stock} · ${product.legality}`,
    alarm: product.legality === "FORBIDDEN",
  }));
  const whispers = snapshot.conversations.slice(0, 8).map((row, index) => ({
    id: `mail-${value(row, "id")}-${index}`,
    stamp: shortTime(row.updated_at ?? row.last_message_at),
    source: value(row, "counterpart_alias", "subject", "participant_alias"),
    title: value(row, "subject", "title", "counterpart_alias"),
    body: value(row, "last_message", "preview", "message"),
    meta: `${value(row, "unread_count")} UNREAD · END-TO-END/UNVERIFIED`,
  }));
  const persona: Packet[] = [
    {
      id: "self",
      stamp: "SELF",
      source: "KERNEL",
      title: viewer.effectiveUser.runnerAlias,
      body: `${viewer.effectiveUser.metatype ?? "МЕТАТИП СКРЫТ"} // ${viewer.effectiveUser.archetype ?? "РОЛЬ СКРЫТА"} // ${viewer.effectiveUser.factionName ?? "НЕЗАВИСИМЫЙ"}`,
      meta: `CLR ${viewer.effectiveUser.clearanceKey} · REP ${viewer.effectiveUser.streetReputation} · HEAT ${viewer.effectiveUser.notoriety}`,
    },
    ...snapshot.inventory.slice(0, 7).map((row, index) => ({
      id: `inv-${value(row, "id", "name")}-${index}`,
      stamp: `x${value(row, "quantity")}`,
      source: value(row, "category", "acquisition_source"),
      title: value(row, "custom_name", "name"),
      body: value(row, "custom_description", "description", "condition"),
      meta: `${value(row, "condition")} · ${value(row, "acquisition_source")}`,
    })),
  ];
  const rootSource = viewer.actor.roles.includes("GAME_MASTER") ? snapshot.audit : snapshot.hosts;
  const root = rootSource.slice(0, 9).map((row, index) => ({
    id: `root-${value(row, "id", "slug")}-${index}`,
    stamp: viewer.actor.roles.includes("GAME_MASTER") ? shortTime(row.created_at) : `N${index + 1}`,
    source: viewer.actor.roles.includes("GAME_MASTER") ? value(row, "actor_alias", "action") : value(row, "node_address", "owner"),
    title: viewer.actor.roles.includes("GAME_MASTER") ? value(row, "action") : value(row, "name"),
    body: viewer.actor.roles.includes("GAME_MASTER") ? value(row, "summary") : value(row, "description"),
    meta: viewer.actor.roles.includes("GAME_MASTER") ? `AUDIT/IMMUTABLE · ${value(row, "target_type")}` : `${value(row, "thread_count")} SIGNALS · TRUST UNKNOWN`,
  }));

  return {
    pulse: [...announcements, ...threads],
    contracts,
    exchange,
    whispers,
    persona,
    root,
  };
}

function BootSequence({ onDone }: { onDone: () => void }) {
  return <section className="zt-boot" aria-label="Инициализация ZERO TERM">
    <div className="zt-boot__tear" />
    <pre>{`SHADOWGRID OPERATING SYSTEM [0.73a]\n(c) 2071—2080 NOBODY. NO RIGHTS RESERVED.\n\nMOUNT /dev/dead-drop ............ OK\nSPOOF PUBLIC GRID SIGNATURE ..... OK\nWAKE PIRATE CHOIR ............... STANDBY\nIDENTIFY REMOTE PERSONA ......... REFUSED`}</pre>
    <div><span>ZERO</span><span>{"//TERM"}</span></div>
    <p>NO LOGS / NO SIN / NO GODS<span>_</span></p>
    <button type="button" onClick={onDone}>[ ESC ] ПРОПУСТИТЬ ЗАГРУЗКУ</button>
  </section>;
}

function AudioTerminal({ openSignal = 0 }: { openSignal?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(24);
  const [title, setTitle] = useState("KEYGEN CHURCH // UPLINK WAITING");

  useEffect(() => { if (openSignal > 0) setOpen(true); }, [openSignal]);

  useEffect(() => {
    let cancelled = false;
    const apiWindow = window as typeof window & { YT?: YouTubeApi; onYouTubeIframeAPIReady?: () => void };
    const createPlayer = () => {
      if (cancelled || !mountRef.current || !apiWindow.YT || playerRef.current) return;
      const api = apiWindow.YT;
      playerRef.current = new api.Player(mountRef.current, {
        width: "320",
        height: "180",
        playerVars: { listType: "playlist", list: KEYGEN_UPLOADS, controls: 0, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: (event: { target: YouTubePlayer }) => { event.target.setVolume(24); setReady(true); },
          onStateChange: (event: { data: number; target: YouTubePlayer }) => {
            setPlaying(event.data === api.PlayerState.PLAYING);
            const nextTitle = event.target.getVideoData().title;
            if (nextTitle) setTitle(nextTitle);
          },
        },
      });
    };
    if (apiWindow.YT?.Player) createPlayer();
    else {
      const previous = apiWindow.onYouTubeIframeAPIReady;
      apiWindow.onYouTubeIframeAPIReady = () => { previous?.(); createPlayer(); };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.head.appendChild(script);
      }
    }
    return () => { cancelled = true; playerRef.current?.destroy(); playerRef.current = null; };
  }, []);

  function togglePlayback() {
    if (!playerRef.current) return;
    if (playing) playerRef.current.pauseVideo(); else playerRef.current.playVideo();
  }
  function toggleMute() {
    if (!playerRef.current) return;
    if (playerRef.current.isMuted()) { playerRef.current.unMute(); setMuted(false); }
    else { playerRef.current.mute(); setMuted(true); }
  }

  return <aside className={`zt-audio ${open ? "is-open" : ""}`}>
    <button type="button" className="zt-audio__tab" onClick={() => setOpen(!open)} aria-expanded={open}>[{playing ? "●" : " "}] PIRATE_AUDIO</button>
    <section>
      <header><span>/dev/radio/keygen_church</span><button type="button" onClick={() => setOpen(false)}>[X]</button></header>
      <div className="zt-audio__screen"><div ref={mountRef} /><i /></div>
      <p title={title}>{title}</p>
      <nav>
        <button type="button" onClick={() => playerRef.current?.previousVideo()} disabled={!ready}>|&lt;</button>
        <button type="button" onClick={togglePlayback} disabled={!ready}>{playing ? "PAUSE" : "PLAY"}</button>
        <button type="button" onClick={() => playerRef.current?.nextVideo()} disabled={!ready}>&gt;|</button>
        <button type="button" onClick={toggleMute} disabled={!ready}>{muted ? "UNMUTE" : "MUTE"}</button>
      </nav>
      <label><span>VOL {String(volume).padStart(2, "0")}</span><input type="range" min="0" max="100" value={volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); playerRef.current?.setVolume(next); }} /></label>
      <footer>{ready ? "CARRIER LOCKED" : "NEGOTIATING CARRIER..."} · <a href="https://www.youtube.com/channel/UCHgbw5cuDIas28eMvbI8Nqg" target="_blank" rel="noreferrer">SOURCE</a></footer>
    </section>
  </aside>;
}

export function ZeroTerm({ pathname, viewer, snapshot }: { pathname: string; viewer: ViewerContext; snapshot: CampaignSnapshot }) {
  const initialMode: Mode = pathname.startsWith("/jobs") ? "contracts" : pathname.startsWith("/market") ? "exchange" : pathname.startsWith("/messages") ? "whispers" : pathname.startsWith("/character") || pathname.startsWith("/inventory") ? "persona" : pathname.startsWith("/gm") ? "root" : "pulse";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [selected, setSelected] = useState(0);
  const [detail, setDetail] = useState<Packet | null>(null);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>(["carrier accepted: SEA > ??? > 73A", "type 'help' if you still trust documentation"]);
  const [composer, setComposer] = useState(false);
  const [localDrops, setLocalDrops] = useState<Packet[]>([]);
  const [phosphor, setPhosphor] = useState<Phosphor>("green");
  const [booting, setBooting] = useState(true);
  const [audioSignal, setAudioSignal] = useState(0);
  const [routeToken, setRouteToken] = useState("SEA>NULL>73A");
  const [panic, setPanic] = useState(false);
  const commandRef = useRef<HTMLInputElement>(null);
  const wheelLock = useRef(false);
  const packetMap = useMemo(() => buildPackets(snapshot, viewer), [snapshot, viewer]);
  const packets = useMemo(() => mode === "pulse" ? [...localDrops, ...packetMap.pulse] : packetMap[mode], [localDrops, mode, packetMap]);
  const unread = snapshot.conversations.reduce((sum, row) => sum + Number(row.unread_count ?? 0), 0);
  const isGm = viewer.actor.roles.includes("GAME_MASTER");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = window.sessionStorage.getItem("shadowgrid.zero-term.boot.v1") === "seen";
    if (reduced || seen) { setBooting(false); return; }
    const timer = window.setTimeout(() => { setBooting(false); window.sessionStorage.setItem("shadowgrid.zero-term.boot.v1", "seen"); }, 4300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => { setSelected(0); setDetail(null); }, [mode]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (panic) setPanic(false); else if (composer) setComposer(false); else if (detail) setDetail(null); else commandRef.current?.focus();
        return;
      }
      const functionIndex = ["F1", "F2", "F3", "F4", "F5", "F6"].indexOf(event.key);
      if (functionIndex >= 0) { event.preventDefault(); setMode(modeOrder[functionIndex]); return; }
      if (event.key === "F7") { event.preventDefault(); setComposer(true); return; }
      if (event.key === "F8") { event.preventDefault(); setAudioSignal((signal) => signal + 1); return; }
      if (event.key === "F9") {
        event.preventDefault();
        const next = makeRouteToken();
        setRouteToken(next);
        setHistory((items) => [...items.slice(-5), `route rotated: ${next}`]);
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "/") { event.preventDefault(); commandRef.current?.focus(); return; }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Enter") return;
      event.preventDefault();
      if (event.key === "Enter") { if (packets[selected]) setDetail(packets[selected]); return; }
      const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
      if (detail) {
        const current = packets.findIndex((packet) => packet.id === detail.id);
        const next = (Math.max(0, current) + direction + Math.max(1, packets.length)) % Math.max(1, packets.length);
        setSelected(next); setDetail(packets[next] ?? null);
      } else setSelected((current) => (current + direction + Math.max(1, packets.length)) % Math.max(1, packets.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composer, detail, packets, panic, selected]);

  function changeMode(next: Mode) {
    if (next === "root" && !isGm) setHistory((items) => [...items.slice(-4), "root: permission denied; showing visible host topology"]);
    setMode(next);
  }

  function execute(event: FormEvent) {
    event.preventDefault();
    const raw = command.trim();
    if (!raw) return;
    const [verb, argument] = raw.toLowerCase().split(/\s+/, 2);
    setHistory((items) => [...items.slice(-5), `guest@73a:~$ ${raw}`]);
    const targetMode = modeOrder.find((candidate) => modeMeta[candidate].command === verb);
    if (targetMode) changeMode(targetMode);
    else if (verb === "help") setHistory((items) => [...items, "pulse | jobs | market | whispers | whoami | root", "open <n> | write | music | scramble | phosphor <green|amber|ice>", "reboot | clear | burn"]);
    else if (verb === "open") {
      const target = Math.max(0, Number(argument || "1") - 1);
      if (packets[target]) { setSelected(target); setDetail(packets[target]); } else setHistory((items) => [...items, `open: packet ${argument ?? "?"} not found`]);
    } else if (verb === "write") setComposer(true);
    else if (verb === "music") setAudioSignal((signal) => signal + 1);
    else if (verb === "scramble") scrambleRoute();
    else if (verb === "phosphor" && ["green", "amber", "ice"].includes(argument ?? "")) setPhosphor(argument as Phosphor);
    else if (verb === "reboot") { window.sessionStorage.removeItem("shadowgrid.zero-term.boot.v1"); setBooting(true); window.setTimeout(() => setBooting(false), 4300); }
    else if (verb === "clear") setHistory([]);
    else if (verb === "burn" || verb === "panic") setPanic(true);
    else setHistory((items) => [...items, `${verb}: command not found. the grid does not admit everything it knows.`]);
    setCommand("");
  }

  function scrambleRoute() {
    const next = makeRouteToken();
    setRouteToken(next);
    setHistory((items) => [...items.slice(-5), `route rotated: ${next}`]);
  }

  function cycle(event: WheelEvent<HTMLElement>) {
    if (wheelLock.current || Math.abs(event.deltaY) < 16) return;
    wheelLock.current = true;
    const direction = event.deltaY > 0 ? 1 : -1;
    setSelected((current) => (current + direction + Math.max(1, packets.length)) % Math.max(1, packets.length));
    window.setTimeout(() => { wheelLock.current = false; }, 150);
  }

  function trackPointer(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--zt-x", `${event.clientX}px`);
    event.currentTarget.style.setProperty("--zt-y", `${event.clientY}px`);
  }

  function submitDrop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const channel = String(data.get("channel") || "LOCAL").toUpperCase();
    const body = String(data.get("message") || "").trim();
    if (!body) return;
    const packet: Packet = { id: `local-${Date.now()}`, stamp: "NOW", source: viewer.effectiveUser.runnerAlias, title: `[DEAD-DROP/${channel}]`, body, meta: `TTL ${data.get("ttl") || "10 MIN"} · SESSION MEMORY ONLY` };
    setLocalDrops((items) => [packet, ...items]);
    setMode("pulse"); setSelected(0); setComposer(false);
    setHistory((items) => [...items.slice(-5), `packet staged in volatile memory: ${packet.id}`]);
    event.currentTarget.reset();
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    window.location.assign("/login");
  }

  return <div className={`zt zt--${phosphor}`} onPointerMove={trackPointer}>
    {booting ? <BootSequence onDone={() => { setBooting(false); window.sessionStorage.setItem("shadowgrid.zero-term.boot.v1", "seen"); }} /> : null}
    <div className="zt-cursor" aria-hidden="true"><i /><span>+</span></div>
    <div className="zt-crt" aria-hidden="true" /><div className="zt-tear" aria-hidden="true" /><div className="zt-noise" aria-hidden="true" />

    <header className="zt-status">
      <button type="button" onClick={scrambleRoute} title="Сменить маршрут">ROUTE::{routeToken}</button>
      <span>CARRIER 14400 / ENCRYPTION <b>UNVERIFIED</b></span>
      <span>USER::{viewer.effectiveUser.runnerAlias}</span>
      <button type="button" className="zt-status__burn" onClick={() => setPanic(true)}>[ BURN ]</button>
    </header>

    <main className="zt-shell">
      <aside className="zt-functions">
        <p>ZERO/TERM<br /><b>FUNCTION TABLE</b></p>
        <nav>{modeOrder.map((candidate) => <button type="button" key={candidate} className={mode === candidate ? "active" : ""} onClick={() => changeMode(candidate)}><span>{modeMeta[candidate].key}</span><b>{modeMeta[candidate].label}</b><small>{modeMeta[candidate].command}</small></button>)}</nav>
        <section><p>LOCAL PROCESSES</p><button type="button" onClick={() => setComposer(true)}>[F7] WRITE DROP</button><button type="button" onClick={() => setAudioSignal((signal) => signal + 1)}>[F8] PIRATE AUDIO</button><button type="button" onClick={scrambleRoute}>[F9] SCRAMBLE</button></section>
        <footer><span>REP {viewer.effectiveUser.streetReputation}</span><span>HEAT {viewer.effectiveUser.notoriety}</span><span>{amount(viewer.effectiveUser.nuyen)}</span></footer>
      </aside>

      <section className="zt-workspace" onWheel={cycle}>
        <header><span>guest@shadowgrid:{modeMeta[mode].path}$ ls -la</span><b>{String(packets.length).padStart(3, "0")} PACKETS</b></header>
        <div className="zt-watermark" aria-hidden="true"><span>ZERO</span><span>TERM</span></div>
        <div className="zt-motd"><span>MESSAGE OF THE NIGHT //</span><b> ЕСЛИ СЕТЬ НАЗЫВАЕТ ТЕБЯ ПО ИМЕНИ — ВЫДЕРНИ КАБЕЛЬ.</b></div>
        <div className="zt-list" role="listbox" aria-label={modeMeta[mode].label}>
          {packets.length ? packets.map((packet, index) => <button type="button" role="option" aria-selected={selected === index} key={packet.id} className={`${selected === index ? "selected" : ""} ${packet.alarm ? "alarm" : ""}`} onMouseEnter={() => setSelected(index)} onFocus={() => setSelected(index)} onClick={() => { setSelected(index); setDetail(packet); }}>
            <span>{String(index + 1).padStart(2, "0")}</span><time>{packet.stamp}</time><b>&lt;{packet.source}&gt;</b><p>{packet.title}</p><small>{packet.meta}</small>
          </button>) : <div className="zt-empty">NO CARRIER // DIRECTORY EXISTS, CONTENT DENIED</div>}
        </div>
        <footer><span>↑↓ SELECT</span><span>ENTER OPEN</span><span>/ COMMAND</span><span>ESC CLOSE</span><b>NO WARRANTY // NO LOGS</b></footer>
      </section>

      <aside className="zt-monitor">
        <section><header>SESSION.PROC</header><dl><div><dt>alias</dt><dd>{viewer.effectiveUser.runnerAlias}</dd></div><div><dt>clearance</dt><dd>{viewer.effectiveUser.clearanceKey}</dd></div><div><dt>unread</dt><dd>{unread}</dd></div><div><dt>trace</dt><dd className="warn">11%</dd></div></dl></section>
        <section className="zt-wave"><header>CARRIER.WAV</header><div>{Array.from({ length: 32 }, (_, index) => <i key={index} style={{ "--bar": `${18 + ((index * 17) % 72)}%` } as CSSProperties} />)}</div><p>SYNCED / PHASE UNKNOWN</p></section>
        <section><header>PHOSPHOR.SYS</header><div className="zt-phosphor"><button className={phosphor === "green" ? "active" : ""} onClick={() => setPhosphor("green")}>G</button><button className={phosphor === "amber" ? "active" : ""} onClick={() => setPhosphor("amber")}>A</button><button className={phosphor === "ice" ? "active" : ""} onClick={() => setPhosphor("ice")}>I</button></div></section>
        <section className="zt-history"><header>STDERR.TAIL</header>{history.slice(-7).map((line, index) => <p key={`${line}-${index}`}><span>{index === history.slice(-7).length - 1 ? ">" : ":"}</span>{line}</p>)}</section>
      </aside>
    </main>

    <form className="zt-prompt" onSubmit={execute}>
      <span>guest@shadowgrid:{modeMeta[mode].path}$</span><input ref={commandRef} value={command} onChange={(event) => setCommand(event.target.value)} placeholder="type help, or lie convincingly..." aria-label="Команда ZERO TERM" autoComplete="off" /><button>EXEC ↵</button>
    </form>

    {detail ? <article className="zt-pager" aria-modal="true" role="dialog" aria-label={detail.title}>
      <header><span>LESS(1) // {detail.id}</span><button type="button" onClick={() => setDetail(null)}>[Q] QUIT</button></header>
      <div><p>{detail.source} @ {detail.stamp}</p><h1>{detail.title}</h1><blockquote>{detail.body}</blockquote><footer>{detail.meta}</footer></div>
      <nav><button type="button" onClick={() => { const next = (selected - 1 + packets.length) % packets.length; setSelected(next); setDetail(packets[next]); }}>← PREV</button><span>{selected + 1} / {packets.length}</span><button type="button" onClick={() => { const next = (selected + 1) % packets.length; setSelected(next); setDetail(packets[next]); }}>NEXT →</button></nav>
    </article> : null}

    {composer ? <div className="zt-modal"><form className="zt-compose" onSubmit={submitDrop}><header><span>VI /tmp/dead-drop.packet</span><button type="button" onClick={() => setComposer(false)}>[ESC]</button></header><label>CHANNEL<input name="channel" defaultValue="SEA/GENERAL" maxLength={24} /></label><label>PAYLOAD<textarea name="message" rows={8} required maxLength={900} autoFocus placeholder="Настоящие имена будут заменены шумом..." /></label><label>SELF-DESTRUCT<select name="ttl" defaultValue="10 MIN"><option>10 MIN</option><option>1 HOUR</option><option>AT LOGOUT</option></select></label><footer><span>:wq</span><button>WRITE TO VOLATILE MEMORY</button></footer></form></div> : null}

    {panic ? <div className="zt-panic"><section><p>kill -9 shadowgrid_session</p><h1>BURN<br />THIS<br />ROUTE?</h1><span>Локальная сессия будет уничтожена. Память терминала останется только послесвечением.</span><div><button type="button" onClick={() => setPanic(false)}>CANCEL</button><button type="button" onClick={logout}>CONFIRM BURN</button></div></section></div> : null}

    <AudioTerminal openSignal={audioSignal} />
  </div>;
}
