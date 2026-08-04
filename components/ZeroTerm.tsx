"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, PointerEvent, WheelEvent, type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
type AudioTrack = { title: string; artist: string; src: string };

const modeOrder: Mode[] = ["pulse", "contracts", "exchange", "whispers", "persona", "root"];
const modeMeta: Record<Mode, { key: string; command: string; label: string; path: string }> = {
  pulse: { key: "F1", command: "pulse", label: "СЕТЕВОЙ ПУЛЬС", path: "/var/grid/pulse" },
  contracts: { key: "F2", command: "jobs", label: "КОНТРАКТЫ", path: "/mnt/dead-drops/jobs" },
  exchange: { key: "F3", command: "market", label: "ОБМЕННИК", path: "/dev/black-market" },
  whispers: { key: "F4", command: "whispers", label: "ШЁПОТ", path: "/home/ghost/mail" },
  persona: { key: "F5", command: "whoami", label: "ПЕРСОНА", path: "/proc/self" },
  root: { key: "F6", command: "root", label: "ROOT-СЛОЙ", path: "/root/overwatch" },
};

const GRID_MUSIC: AudioTrack[] = [
  "Bionatriz", "Bitrack", "Braves", "Coden", "Cybranes", "Darken", "Glamyan", "Granius", "Leista",
  "Melanot", "Natroleum", "Quantow", "Radional", "Realmea", "Stream", "Ventuny", "Zatrum",
].map((title, index) => ({
  title,
  artist: "FILFAR",
  src: `/grid_music/${String(index + 1).padStart(2, "0")}-${title.toLowerCase()}.m4a`,
}));

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

function audioClock(seconds: number): string {
  if (!Number.isFinite(seconds)) return "00:00";
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(24);
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeatOne, setRepeatOne] = useState(false);
  const track = GRID_MUSIC[trackIndex];

  useEffect(() => { if (openSignal > 0) setOpen(true); }, [openSignal]);
  useEffect(() => { setReady(false); setCurrentTime(0); setDuration(0); }, [trackIndex]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [volume, trackIndex]);

  function togglePlayback() {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else void audioRef.current.play().catch(() => setPlaying(false));
  }
  function nextTrack(forcePlay = playing) {
    const next = shuffle && GRID_MUSIC.length > 1
      ? (trackIndex + 1 + Math.floor(Math.random() * (GRID_MUSIC.length - 1))) % GRID_MUSIC.length
      : (trackIndex + 1) % GRID_MUSIC.length;
    setPlaying(forcePlay);
    setTrackIndex(next);
  }
  function previousTrack() {
    if (audioRef.current && audioRef.current.currentTime > 4) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    setTrackIndex((trackIndex - 1 + GRID_MUSIC.length) % GRID_MUSIC.length);
  }
  function ended() {
    if (repeatOne && audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    } else nextTrack(true);
  }

  return <aside className={`zt-audio ${open ? "is-open" : ""}`}>
    <button type="button" className="zt-audio__tab" onClick={() => setOpen(!open)} aria-expanded={open}>[{playing ? "●" : " "}] FILFAR_ARCHIVE</button>
    <section>
      <header><span>/mnt/audio/filfar_archive</span><button type="button" onClick={() => setOpen(false)}>[X]</button></header>
      <div className={`zt-audio__screen ${playing ? "is-playing" : ""}`}>
        <audio key={track.src} ref={audioRef} src={track.src} preload="metadata" autoPlay={playing} muted={muted}
          onCanPlay={() => setReady(true)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onEnded={ended} />
        <div className="zt-audio__bars" aria-hidden="true">{Array.from({ length: 29 }, (_, index) => <i key={index} style={{ "--audio-bar": `${18 + ((index * 37) % 78)}%`, "--audio-delay": `${-(index % 7) * 0.09}s` } as CSSProperties} />)}</div>
        <p><span>TRACK {String(trackIndex + 1).padStart(2, "0")} / {GRID_MUSIC.length}</span><strong>{track.title}</strong><b>{track.artist}</b></p><i />
      </div>
      <div className="zt-audio__timeline"><span>{audioClock(currentTime)}</span><input aria-label="Позиция трека" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => { const next = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = next; setCurrentTime(next); }} /><span>{audioClock(duration)}</span></div>
      <nav className="zt-audio__controls">
        <button type="button" onClick={previousTrack} disabled={!ready}>|&lt;</button>
        <button type="button" onClick={togglePlayback} disabled={!ready}>{playing ? "PAUSE" : "PLAY"}</button>
        <button type="button" onClick={() => nextTrack()} disabled={!ready}>&gt;|</button>
        <button type="button" className={shuffle ? "active" : ""} onClick={() => setShuffle(!shuffle)}>RND</button>
        <button type="button" className={repeatOne ? "active" : ""} onClick={() => setRepeatOne(!repeatOne)}>R1</button>
      </nav>
      <label className="zt-audio__volume"><button type="button" onClick={() => setMuted(!muted)}>{muted ? "MUTE" : "VOL"}</button><span>{String(muted ? 0 : volume).padStart(2, "0")}</span><input aria-label="Громкость" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /></label>
      <div className="zt-audio__playlist" aria-label="Плейлист Filfar">{GRID_MUSIC.map((item, index) => <button type="button" className={index === trackIndex ? "active" : ""} key={item.src} onClick={() => setTrackIndex(index)}><span>{String(index + 1).padStart(2, "0")}</span><b>{item.artist}</b><em>{item.title}</em></button>)}</div>
      <footer>{ready ? "LOCAL CARRIER LOCKED // 17 TRACKS" : "READING ARCHIVE..."} · MUSIC: FILFAR · <a href="https://www.youtube.com/watch?v=AF8LSurfct4" target="_blank" rel="noreferrer">SOURCE</a></footer>
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
  const [closing, setClosing] = useState<"detail" | "composer" | "panic" | null>(null);
  const commandRef = useRef<HTMLInputElement>(null);
  const wheelLock = useRef(false);
  const packetMap = useMemo(() => buildPackets(snapshot, viewer), [snapshot, viewer]);
  const packets = useMemo(() => mode === "pulse" ? [...localDrops, ...packetMap.pulse] : packetMap[mode], [localDrops, mode, packetMap]);
  const unread = snapshot.conversations.reduce((sum, row) => sum + Number(row.unread_count ?? 0), 0);
  const isGm = viewer.actor.roles.includes("GAME_MASTER");

  useEffect(() => {
    if (!booting) return;
    const timer = window.setTimeout(() => setBooting(false), 4400);
    return () => window.clearTimeout(timer);
  }, [booting]);

  useEffect(() => { setSelected(0); setDetail(null); }, [mode]);

  const closeLayer = useCallback((layer: "detail" | "composer" | "panic") => {
    setClosing(layer);
    window.setTimeout(() => {
      if (layer === "detail") setDetail(null);
      if (layer === "composer") setComposer(false);
      if (layer === "panic") setPanic(false);
      setClosing(null);
    }, 230);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (panic) closeLayer("panic"); else if (composer) closeLayer("composer"); else if (detail) closeLayer("detail"); else commandRef.current?.focus();
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
      if (detail && event.key.toLowerCase() === "q") { event.preventDefault(); closeLayer("detail"); return; }
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
  }, [closeLayer, composer, detail, packets, panic, selected]);

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
    else if (verb === "reboot") setBooting(true);
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
    setMode("pulse"); setSelected(0); closeLayer("composer");
    setHistory((items) => [...items.slice(-5), `packet staged in volatile memory: ${packet.id}`]);
    event.currentTarget.reset();
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    window.location.assign("/login");
  }

  return <div className={`zt zt--${phosphor}`} onPointerMove={trackPointer}>
    {booting ? <BootSequence onDone={() => setBooting(false)} /> : null}
    <div className="zt-cursor" aria-hidden="true"><i /><span>_</span></div>
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
        <div className="zt-motd"><span>MESSAGE OF THE NIGHT //</span><i><b>ЕСЛИ СЕТЬ НАЗЫВАЕТ ТЕБЯ ПО ИМЕНИ — ВЫДЕРНИ КАБЕЛЬ.</b></i></div>
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

    {detail ? <article className={`zt-pager ${closing === "detail" ? "is-closing" : ""}`} aria-modal="true" role="dialog" aria-label={detail.title}>
      <header><span>LESS(1) // {detail.id}</span><button type="button" onClick={() => closeLayer("detail")}>[Q] QUIT</button></header>
      <div><p>{detail.source} @ {detail.stamp}</p><h1>{detail.title}</h1><blockquote>{detail.body}</blockquote><footer>{detail.meta}</footer></div>
      <nav><button type="button" onClick={() => { const next = (selected - 1 + packets.length) % packets.length; setSelected(next); setDetail(packets[next]); }}>← PREV</button><span>{selected + 1} / {packets.length}</span><button type="button" onClick={() => { const next = (selected + 1) % packets.length; setSelected(next); setDetail(packets[next]); }}>NEXT →</button></nav>
    </article> : null}

    {composer ? <div className={`zt-modal ${closing === "composer" ? "is-closing" : ""}`}><form className="zt-compose" onSubmit={submitDrop}><header><span>VI /tmp/dead-drop.packet</span><button type="button" onClick={() => closeLayer("composer")}>[ESC]</button></header><label>CHANNEL<input name="channel" defaultValue="SEA/GENERAL" maxLength={24} /></label><label>PAYLOAD<textarea name="message" rows={8} required maxLength={900} autoFocus placeholder="Настоящие имена будут заменены шумом..." /></label><label>SELF-DESTRUCT<select name="ttl" defaultValue="10 MIN"><option>10 MIN</option><option>1 HOUR</option><option>AT LOGOUT</option></select></label><footer><span>:wq</span><button>WRITE TO VOLATILE MEMORY</button></footer></form></div> : null}

    {panic ? <div className={`zt-panic ${closing === "panic" ? "is-closing" : ""}`}><section><p>kill -9 shadowgrid_session</p><h1>BURN<br />THIS<br />ROUTE?</h1><span>Локальная сессия будет уничтожена. Память терминала останется только послесвечением.</span><div><button type="button" onClick={() => closeLayer("panic")}>CANCEL</button><button type="button" onClick={logout}>CONFIRM BURN</button></div></section></div> : null}

    <AudioTerminal openSignal={audioSignal} />
  </div>;
}
