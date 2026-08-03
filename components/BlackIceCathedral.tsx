"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import {
  Archive, BriefcaseBusiness, ContactRound, Eye, Fingerprint,
  ExternalLink, LogOut, Music2, Pause, Play, RadioTower, ShieldAlert, ShoppingBag,
  SkipBack, SkipForward, Sparkles, Triangle, UserRound, Volume2, VolumeX, X, Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type WheelEvent } from "react";
import type { ViewerContext } from "../lib/auth";
import type { CampaignSnapshot } from "../lib/campaign";

type Row = Record<string, unknown>;
type RiteKey = "voices" | "contracts" | "contraband" | "reliquary" | "faces" | "identity";
type Revelation = { overline: string; title: string; copy: string; meta: string; danger?: boolean };
type YouTubePlayer = {
  playVideo: () => void; pauseVideo: () => void; nextVideo: () => void; previousVideo: () => void;
  setVolume: (volume: number) => void; mute: () => void; unMute: () => void; isMuted: () => boolean;
  getVideoData: () => { title?: string }; destroy: () => void;
};
type YouTubeApi = { Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayer; PlayerState: { PLAYING: number; PAUSED: number; ENDED: number } };

const rites: Array<{ key: RiteKey; numeral: string; label: string; whisper: string; icon: LucideIcon }> = [
  { key: "voices", numeral: "I", label: "ГОЛОСА", whisper: "перехваченные передачи", icon: RadioTower },
  { key: "contracts", numeral: "II", label: "ОБЕТЫ", whisper: "работа без свидетелей", icon: BriefcaseBusiness },
  { key: "contraband", numeral: "III", label: "ДЕСЯТИНА", whisper: "рынок запретных вещей", icon: ShoppingBag },
  { key: "reliquary", numeral: "IV", label: "РЕЛИКВИИ", whisper: "то, что пережило владельца", icon: Archive },
  { key: "faces", numeral: "V", label: "ЛИКИ", whisper: "долги и знакомые тени", icon: ContactRound },
  { key: "identity", numeral: "VI", label: "ИСПОВЕДЬ", whisper: "ложь, которую зовут тобой", icon: Fingerprint },
];

function value(row: Row, ...keys: string[]) {
  for (const key of keys) {
    const candidate = row[key];
    if (candidate !== null && candidate !== undefined && candidate !== "") return String(candidate);
  }
  return "СВЕДЕНИЯ СОЖЖЕНЫ";
}

function amount(input: unknown) {
  return `${new Intl.NumberFormat("ru-RU").format(Number(input) || 0)} ¥`;
}

function initialRite(pathname: string): RiteKey {
  if (pathname.includes("jobs")) return "contracts";
  if (pathname.includes("market") || pathname.includes("vendors") || pathname.includes("orders")) return "contraband";
  if (pathname.includes("inventory")) return "reliquary";
  if (pathname.includes("contacts")) return "faces";
  if (pathname.includes("character") || pathname.includes("settings") || pathname.startsWith("/gm")) return "identity";
  return "voices";
}

const fallbacks: Record<RiteKey, Revelation[]> = {
  voices: [
    { overline: "04:17 // СЛЕПОЙ РЕТРАНСЛЯТОР", title: "Кто-нибудь ещё слышит колокола?", copy: "Сигнал идёт из мёртвого сектора. Не отвечайте настоящим именем.", meta: "7 ОТВЕТОВ · TRACE 09%" },
    { overline: "03:58 // MOTH_6", title: "Маршрут через Tacoma скомпрометирован", copy: "Смените ключи и не пользуйтесь привычными убежищами.", meta: "ЗАПЕЧАТАНО" },
  ],
  contracts: [{ overline: "ОБЕТ 73-A", title: "Забрать чёрный ящик до рассвета", copy: "Никаких вопросов. Никаких корпоративных меток. Никаких тел в фургоне.", meta: "42 000 ¥ · BELLEVUE", danger: true }],
  contraband: [{ overline: "КАТАЛОГ БЕЗ ГАРАНТИЙ", title: "Дека, которой не существует", copy: "Серийный номер выжжен. Продавец принимает только безымянную валюту.", meta: "18 500 ¥ · ОСТАЛАСЬ 1" }],
  reliquary: [{ overline: "ИЗЪЯТО ИЗ ПАМЯТИ", title: "Осколок чужого комлинка", copy: "Внутри всё ещё мигает последнее непрочитанное сообщение.", meta: "СОСТОЯНИЕ: НЕСТАБИЛЬНО" }],
  faces: [{ overline: "ДОЛГ НЕ ЗАБЫТ", title: "Sister Static", copy: "Техномант. Лечит чужие сигналы, но никогда не объясняет цену.", meta: "ЛОЯЛЬНОСТЬ 3 · СВЯЗИ 5" }],
  identity: [{ overline: "SIN: НЕ ОБНАРУЖЕН", title: "У тебя нет имени внутри этого места", copy: "Собор знает только маску, репутацию и то, сколько раз ты вернулся живым.", meta: "СВИДЕТЕЛЕЙ: 0" }],
};

function buildRevelations(snapshot: CampaignSnapshot, viewer: ViewerContext): Record<RiteKey, Revelation[]> {
  const voices = snapshot.threads.slice(0, 4).map((row) => ({
    overline: `${value(row, "host_name", "source_label")} // ${value(row, "author", "author_label")}`,
    title: value(row, "title"),
    copy: value(row, "excerpt", "content_markdown", "last_message"),
    meta: `${value(row, "reply_count", "post_count")} ОТВЕТОВ · ${value(row, "updated_at", "created_at")}`,
  }));
  const contracts = snapshot.jobs.slice(0, 4).map((row) => ({
    overline: `${value(row, "status")} // ${value(row, "location")}`,
    title: value(row, "title"),
    copy: value(row, "summary", "description", "brief"),
    meta: `${amount(row.reward)} · РЕП ${value(row, "min_reputation", "reputation_required")}`,
    danger: value(row, "status").includes("HOT"),
  }));
  const contraband = snapshot.products.slice(0, 4).map((product) => ({
    overline: `${product.vendorName} // ${product.listingCode}`,
    title: product.name,
    copy: product.shortDescription,
    meta: `${amount(product.price)} · ${product.stock} В КЭШЕ`,
    danger: product.legality === "FORBIDDEN",
  }));
  const reliquary = snapshot.inventory.slice(0, 4).map((row) => ({
    overline: `${value(row, "category")} // ${value(row, "condition")}`,
    title: value(row, "custom_name", "name"),
    copy: value(row, "custom_description", "description"),
    meta: `КОЛ. ${value(row, "quantity")} · ${value(row, "acquisition_source")}`,
  }));
  const faces = snapshot.contacts.slice(0, 4).map((row) => ({
    overline: `${value(row, "type", "contact_type")} // ${value(row, "location")}`,
    title: value(row, "name", "alias"),
    copy: value(row, "description", "notes", "summary"),
    meta: `СВЯЗИ ${value(row, "connection")} · ЛОЯЛЬНОСТЬ ${value(row, "loyalty")}`,
  }));
  const identity = [{
    overline: `${viewer.effectiveUser.clearanceKey} // SIN NULL`,
    title: viewer.effectiveUser.runnerAlias,
    copy: `${viewer.effectiveUser.metatype ?? "МЕТАТИП СКРЫТ"} · ${viewer.effectiveUser.archetype ?? "АРХЕТИП СКРЫТ"} · ${viewer.effectiveUser.factionName ?? "НЕЗАВИСИМЫЙ"}`,
    meta: `РЕП ${viewer.effectiveUser.streetReputation} · ДУРНАЯ СЛАВА ${viewer.effectiveUser.notoriety} · ${amount(viewer.effectiveUser.nuyen)}`,
  }];
  return {
    voices: voices.length ? voices : fallbacks.voices,
    contracts: contracts.length ? contracts : fallbacks.contracts,
    contraband: contraband.length ? contraband : fallbacks.contraband,
    reliquary: reliquary.length ? reliquary : fallbacks.reliquary,
    faces: faces.length ? faces : fallbacks.faces,
    identity,
  };
}

function CathedralOpening({ onDone }: { onDone: () => void }) {
  return <div className="bic-opening" role="status" aria-label="Открывается защищённый узел">
    <div className="bic-opening__doors"><i /><i /></div>
    <div className="bic-opening__choir" aria-hidden="true"><span>NULL</span><span>73A</span><span>NO SIN</span><span>AWAKE</span></div>
    <section>
      <div className="bic-opening__seal"><Eye /><span>IX</span><i /></div>
      <p>LIBER UMBRARUM // HANDSHAKE ACCEPTED</p>
      <h1>BLACK ICE<br /><em>CATHEDRAL</em></h1>
      <ol><li>ИМЯ СТЁРТО</li><li>МАРШРУТ ПОХОРОНЕН</li><li>СВИДЕТЕЛИ ОТСЕЧЕНЫ</li></ol>
      <button type="button" onClick={onDone}>ПЕРЕСТУПИТЬ ПОРОГ</button>
    </section>
  </div>;
}

const KEYGEN_UPLOADS = "UUHgbw5cuDIas28eMvbI8Nqg";

function CathedralChoir() {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(28);
  const [title, setTitle] = useState("KEYGEN CHURCH // CHANNEL TRANSMISSION");

  useEffect(() => {
    let cancelled = false;
    const apiWindow = window as typeof window & { YT?: YouTubeApi; onYouTubeIframeAPIReady?: () => void };
    const createPlayer = () => {
      if (cancelled || !mountRef.current || !apiWindow.YT || playerRef.current) return;
      const api = apiWindow.YT;
      playerRef.current = new api.Player(mountRef.current, {
        width: "320", height: "180",
        playerVars: { listType: "playlist", list: KEYGEN_UPLOADS, controls: 0, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: (event: { target: YouTubePlayer }) => { event.target.setVolume(28); setReady(true); },
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
    setOpen(true);
    if (!playerRef.current || !ready) return;
    if (playing) playerRef.current.pauseVideo(); else playerRef.current.playVideo();
  }

  function toggleMute() {
    if (!playerRef.current) return;
    if (playerRef.current.isMuted()) { playerRef.current.unMute(); setMuted(false); }
    else { playerRef.current.mute(); setMuted(true); }
  }

  function changeVolume(next: number) {
    setVolume(next);
    playerRef.current?.setVolume(next);
    if (next > 0 && muted) { playerRef.current?.unMute(); setMuted(false); }
  }

  return <aside className={`bic-choir ${open ? "is-open" : ""}`} aria-label="Музыкальный хор KEYGEN CHURCH">
    <button type="button" className="bic-choir__tab" onClick={() => setOpen(!open)} aria-expanded={open}><Music2 /><span>РАЗБУДИТЬ ХОР</span><i className={playing ? "is-live" : ""} /></button>
    <section>
      <header><div><small>CHORUS://KEYGEN_CHURCH</small><b>{title}</b></div><button type="button" onClick={() => setOpen(false)} aria-label="Свернуть хор"><X /></button></header>
      <div className="bic-choir__screen"><div ref={mountRef} /><i aria-hidden="true" /></div>
      <div className="bic-choir__transport">
        <button type="button" onClick={() => playerRef.current?.previousVideo()} disabled={!ready} aria-label="Предыдущая композиция"><SkipBack /></button>
        <button type="button" className="bic-choir__play" onClick={togglePlayback} disabled={!ready} aria-label={playing ? "Пауза" : "Воспроизвести"}>{playing ? <Pause /> : <Play />}</button>
        <button type="button" onClick={() => playerRef.current?.nextVideo()} disabled={!ready} aria-label="Следующая композиция"><SkipForward /></button>
        <button type="button" onClick={toggleMute} disabled={!ready} aria-label={muted ? "Включить звук" : "Выключить звук"}>{muted ? <VolumeX /> : <Volume2 />}</button>
        <input type="range" min="0" max="100" value={volume} onChange={(event) => changeVolume(Number(event.target.value))} aria-label="Громкость хора" />
      </div>
      <footer><span>{ready ? playing ? "● ХОР ЗВУЧИТ" : "ХОР ОЖИДАЕТ ЖЕСТА" : "СОГЛАСОВАНИЕ СИГНАЛА…"}</span><a href="https://www.youtube.com/channel/UCHgbw5cuDIas28eMvbI8Nqg" target="_blank" rel="noreferrer">ИСТОЧНИК <ExternalLink /></a></footer>
    </section>
  </aside>;
}

export function BlackIceCathedral({ pathname, viewer, snapshot }: { pathname: string; viewer: ViewerContext; snapshot: CampaignSnapshot }) {
  const [active, setActive] = useState<RiteKey>(() => initialRite(pathname));
  const [opening, setOpening] = useState(true);
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState<RiteKey | null>(null);
  const [openedRecord, setOpenedRecord] = useState<number | null>(null);
  const wheelLock = useRef(false);
  const revelations = useMemo(() => buildRevelations(snapshot, viewer), [snapshot, viewer]);
  const rite = rites.find((item) => item.key === active) ?? rites[0];
  const ActiveIcon = rite.icon;
  const activeItems = revelations[active];
  const chosen = activeItems[Math.min(index, activeItems.length - 1)] ?? fallbacks[active][0];
  const opened = openedRecord === null ? null : activeItems[Math.min(openedRecord, activeItems.length - 1)];
  const unread = snapshot.conversations.reduce((sum, row) => sum + Number(row.unread_count ?? 0), 0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = window.sessionStorage.getItem("shadowgrid.cathedral.v2") === "seen";
    if (reduced || seen) { setOpening(false); return; }
    window.sessionStorage.setItem("shadowgrid.cathedral.v2", "seen");
    const timer = window.setTimeout(() => setOpening(false), 4300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "Escape") {
        if (openedRecord !== null) setOpenedRecord(null);
        else if (expanded) setExpanded(null);
        return;
      }
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      setIndex((current) => (current + direction + activeItems.length) % activeItems.length);
      if (openedRecord !== null) setOpenedRecord((current) => current === null ? null : (current + direction + activeItems.length) % activeItems.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeItems.length, expanded, openedRecord]);

  function choose(next: RiteKey) {
    if (next === active) {
      setExpanded((current) => current === next ? null : next);
      setOpenedRecord(null);
      return;
    }
    setActive(next); setIndex(0); setOpenedRecord(null);
  }

  function trackPointer(event: PointerEvent<HTMLDivElement>) {
    const eyeX = Math.max(-14, Math.min(14, ((event.clientX / window.innerWidth) - .5) * 28));
    const eyeY = Math.max(-10, Math.min(10, ((event.clientY / window.innerHeight) - .5) * 20));
    event.currentTarget.style.setProperty("--pointer-x", `${event.clientX}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${event.clientY}px`);
    event.currentTarget.style.setProperty("--eye-x", `${eyeX}px`);
    event.currentTarget.style.setProperty("--eye-y", `${eyeY}px`);
  }

  function cycleRecords(event: WheelEvent<HTMLElement>) {
    if (Math.abs(event.deltaY) < 18 && Math.abs(event.deltaX) < 18 || wheelLock.current) return;
    wheelLock.current = true;
    const direction = event.deltaY + event.deltaX > 0 ? 1 : -1;
    setIndex((current) => (current + direction + activeItems.length) % activeItems.length);
    if (openedRecord !== null) setOpenedRecord((current) => current === null ? null : (current + direction + activeItems.length) % activeItems.length);
    window.setTimeout(() => { wheelLock.current = false; }, 260);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    window.location.assign("/login");
  }

  return <div className={`bic ${expanded ? "is-sector-expanded" : ""}`} onPointerMove={trackPointer} style={{ "--rite-index": rites.findIndex((item) => item.key === active) } as CSSProperties}>
    {opening ? <CathedralOpening onDone={() => setOpening(false)} /> : null}
    <div className="bic-pointer" aria-hidden="true" />
    <div className="bic-cursor" aria-hidden="true"><i /><span /></div>
    <div className="bic-noise" aria-hidden="true" />
    <div className="bic-data-rain" aria-hidden="true">
      <span>01001<br />NO SIN<br />†<br />73A<br />NULL</span><span>ᚨ<br />TRACE<br />000101<br />EYE</span><span>BLACK ICE<br />AWAKE<br />∴<br />00110</span><span>TRUST<br />NULL<br />†<br />SEA.00</span><span>00073<br />MOTH<br />HOST<br />∴</span><span>RITUAL<br />04:17<br />0101<br />VOID</span>
    </div>

    <header className="bic-clerestory">
      <div className="bic-brand"><span>IX</span><div><b>LIBER UMBRARUM</b><small>HOST 73A // СОБСТВЕННОСТЬ НИКОГО</small></div></div>
      <div className="bic-clerestory__line"><i /><span>BLACK ICE CATHEDRAL</span><i /></div>
      <div className="bic-session"><span><small>НЕИЗВЕСТНЫЙ ПРИХОЖАНИН</small><b>{viewer.effectiveUser.runnerAlias}</b></span><button type="button" onClick={logout} aria-label="Отключиться"><LogOut /></button></div>
    </header>

    <main className="bic-nave">
      <aside className="bic-memorial">
        <p>IN MEMORIAM</p>
        <div className="bic-memorial__names"><span>ORPHAN_09</span><span>SISTER STATIC</span><span>RED WIRE</span><span>NODE//LOST</span></div>
        <i />
        <blockquote>«Сеть хранит не людей.<br />Она хранит следы,<br />которые они не успели стереть».</blockquote>
        <small>АРХИВ МЁРТВЫХ КЛЮЧЕЙ<br />73A / 41 / NULL</small>
      </aside>

      <section className="bic-sanctum" aria-live="polite" onWheel={cycleRecords}>
        {!expanded ? <><header className="bic-sanctum__heading">
          <p>НЕЗАРЕГИСТРИРОВАННЫЙ ЦИФРОВОЙ ПРИХОД</p>
          <h1>THE GRID<br />REMEMBERS<br /><em>WHAT THEY ERASE.</em></h1>
        </header>

        <div className="bic-rose" aria-label="Выбор раздела">
          <div className="bic-rose__architecture" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
          <div className="bic-rose__orbit orbit-a" aria-hidden="true" /><div className="bic-rose__orbit orbit-b" aria-hidden="true" />
          <div className="bic-rose__eye" aria-hidden="true"><Eye /><i /></div>
          {rites.map(({ key, numeral, label, icon: Icon }) => <button type="button" key={key} className={`bic-rite bic-rite--${key} ${active === key ? "active" : ""}`} aria-pressed={active === key} onClick={() => choose(key)}><span>{numeral}</span><Icon /><b>{label}</b></button>)}
          <div className="bic-rose__readout"><span>{rite.numeral}{" // "}{rite.label}</span><small>{rite.whisper}</small></div>
        </div>

        <section className={`bic-revelation ${chosen.danger ? "is-danger" : ""}`} key={`${active}-${index}`}>
          <header><span>{chosen.overline}</span><b>{String(index + 1).padStart(2, "0")} / {String(activeItems.length).padStart(2, "0")}</b></header>
          <button type="button" className="bic-revelation__open" onClick={() => setOpenedRecord(index)}><span className="bic-revelation__mark"><ActiveIcon /></span><article><h2>{chosen.title}</h2><p>{chosen.copy}</p><footer>{chosen.meta} · ОТКРЫТЬ ЗАПИСЬ</footer></article></button>
          <nav aria-label="Записи выбранного раздела">{activeItems.map((item, itemIndex) => <button type="button" key={`${item.title}-${itemIndex}`} className={index === itemIndex ? "active" : ""} onClick={() => setIndex(itemIndex)} aria-label={`Открыть запись ${itemIndex + 1}`}><i /></button>)}</nav>
        </section>
        {opened ? <article className="bic-record" key={`${active}-record-${openedRecord}`}>
          <div className="bic-watcher" aria-hidden="true"><Eye /><i /></div>
          <button type="button" className="bic-record__close" onClick={() => setOpenedRecord(null)} aria-label="Закрыть запись"><X /></button>
          <p>{opened.overline}</p><ActiveIcon /><h2>{opened.title}</h2><blockquote>{opened.copy}</blockquote><footer>{opened.meta}</footer>
          <nav><button type="button" onClick={() => setOpenedRecord((Number(openedRecord) - 1 + activeItems.length) % activeItems.length)}><SkipBack /> ПРЕДЫДУЩАЯ</button><button type="button" onClick={() => setOpenedRecord((Number(openedRecord) + 1) % activeItems.length)}>СЛЕДУЮЩАЯ <SkipForward /></button></nav>
        </article> : null}</> : <section className="bic-sector" key={expanded}>
          <div className="bic-watcher" aria-hidden="true"><Eye /><i /></div>
          <header><span>{rite.numeral}{" // RITUAL SECTOR"}</span><button type="button" onClick={() => setExpanded(null)} aria-label="Вернуть ICE-розу"><X /></button><ActiveIcon /><h2>{rite.label}</h2><p>{rite.whisper}</p></header>
          <div className="bic-sector__records">{activeItems.map((item, itemIndex) => <button type="button" key={`${item.title}-${itemIndex}`} className={itemIndex === index ? "active" : ""} onMouseEnter={() => setIndex(itemIndex)} onFocus={() => setIndex(itemIndex)} onClick={() => { setIndex(itemIndex); setOpenedRecord(itemIndex); }}><span>{String(itemIndex + 1).padStart(2, "0")}</span><div><small>{item.overline}</small><h3>{item.title}</h3><p>{item.copy}</p></div><b>{item.meta}</b></button>)}</div>
          <nav className="bic-sector__rites">{rites.map(({ key, numeral, label, icon: Icon }) => <button type="button" key={key} className={key === active ? "active" : ""} onClick={() => { setActive(key); setIndex(0); setOpenedRecord(null); setExpanded(key); }}><span>{numeral}</span><Icon /><b>{label}</b></button>)}</nav>
          <footer>КОЛЕСО / ← → ЛИСТАТЬ · ESC ВЕРНУТЬ РОЗУ · НАЖАТЬ ЗАПИСЬ ДЛЯ РАСКРЫТИЯ</footer>
          {opened ? <article className="bic-record" key={`${active}-record-${openedRecord}`}><div className="bic-watcher" aria-hidden="true"><Eye /><i /></div><button type="button" className="bic-record__close" onClick={() => setOpenedRecord(null)} aria-label="Закрыть запись"><X /></button><p>{opened.overline}</p><ActiveIcon /><h2>{opened.title}</h2><blockquote>{opened.copy}</blockquote><footer>{opened.meta}</footer><nav><button type="button" onClick={() => setOpenedRecord((Number(openedRecord) - 1 + activeItems.length) % activeItems.length)}><SkipBack /> ПРЕДЫДУЩАЯ</button><button type="button" onClick={() => setOpenedRecord((Number(openedRecord) + 1) % activeItems.length)}>СЛЕДУЮЩАЯ <SkipForward /></button></nav></article> : null}
        </section>}
      </section>

      <aside className="bic-confessional">
        <header><Triangle /><span>ИСПОВЕДЬ БЕЗ СВИДЕТЕЛЕЙ</span></header>
        <div className="bic-mask"><i /><UserRound /><span>{viewer.effectiveUser.runnerAlias.slice(0, 2)}</span></div>
        <h2>{viewer.effectiveUser.runnerAlias}</h2>
        <p>{viewer.effectiveUser.metatype ?? "МЕТАТИП СКРЫТ"}{" // "}{viewer.effectiveUser.archetype ?? "РОЛЬ СКРЫТА"}</p>
        <dl><div><dt>РЕПУТАЦИЯ</dt><dd>{viewer.effectiveUser.streetReputation}</dd></div><div><dt>ДУРНАЯ СЛАВА</dt><dd>{viewer.effectiveUser.notoriety}</dd></div><div><dt>ДЕСЯТИНА</dt><dd>{amount(viewer.effectiveUser.nuyen)}</dd></div><div><dt>НЕПРОЧИТАНО</dt><dd>{unread}</dd></div></dl>
        <section className="bic-trace"><span>ВЕРОЯТНОСТЬ ТРАССИРОВКИ</span><div><i /></div><b>11%</b></section>
        <p className="bic-vow"><Sparkles /> Никаких истинных имён.<br />Никаких живых маршрутов.<br />Никаких корпоративных богов.</p>
      </aside>
    </main>

    <footer className="bic-crypt">
      <span><ShieldAlert /> ICE СПИТ, ПОКА ТЫ ГОВОРИШЬ ПРАВДУ</span>
      <div><i /><b>{snapshot.campaignName}</b><i /></div>
      <span><Zap /> OVERWATCH 004 / 040</span>
    </footer>
    <CathedralChoir />
  </div>;
}
