"use client";

/* eslint-disable @next/next/no-html-link-for-pages */

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bird,
  Braces,
  CircleDot,
  Cpu,
  Eye,
  Fingerprint,
  Hexagon,
  KeyRound,
  LockKeyhole,
  Network,
  Radio,
  Radar,
  Router,
  ScanLine,
  ShieldCheck,
  ShieldAlert,
  Skull,
  Terminal,
  Triangle,
  Waves,
  WifiOff,
} from "lucide-react";
import { useState } from "react";

type ConceptId = "bulletin" | "ghost" | "squat" | "relay" | "totem" | "deck" | "term" | "street" | "cathedral" | "broadcast" | "lens" | "resonance" | "swarm" | "astral" | "ledger";

const concepts: Array<{ id: ConceptId; number: string; title: string; note: string }> = [
  { id: "bulletin", number: "01", title: "КРОВАВЫЙ БЮЛЛЕТЕНЬ", note: "грязная BBS / пятая редакция" },
  { id: "ghost", number: "02", title: "ПРИЗРАЧНАЯ СЕТЬ", note: "живая Матрица / шестая редакция" },
  { id: "squat", number: "03", title: "ПОДВАЛЬНЫЙ УЗЕЛ", note: "самодельный хост / декерский сквот" },
  { id: "relay", number: "04", title: "JACKPOINT RELAY", note: "децентрализованная BBS / доверенные узлы" },
  { id: "totem", number: "05", title: "ТОТЕМНЫЙ ПРОТОКОЛ", note: "Матрица / магия / дух узла" },
  { id: "deck", number: "06", title: "МЕДНАЯ ДЕКА", note: "индустриальный ЭЛТ / игровая консоль" },
  { id: "term", number: "07", title: "ZERO/TERM", note: "чистая текстовая BBS / никакого HUD" },
  { id: "street", number: "08", title: "SINLESS WALL", note: "уличный коллаж / граффити / mesh-сеть" },
  { id: "cathedral", number: "09", title: "BLACK ICE CATHEDRAL", note: "цифровая готика / ритуал доступа" },
  { id: "broadcast", number: "10", title: "CHANNEL 73", note: "пиратское ТВ / аналоговый захват" },
  { id: "lens", number: "11", title: "RAIN CITY LENS", note: "дополненная реальность / ОДР / комлинк" },
  { id: "resonance", number: "12", title: "RESONANCE BLOOM", note: "техномант / живой аватар / спрайты" },
  { id: "swarm", number: "13", title: "SWARMMIND RCC", note: "риггер / полное погружение / рой дронов" },
  { id: "astral", number: "14", title: "ASTRAL NEGATIVE", note: "ауры / эмоциональный фотонегатив / подписи" },
  { id: "ledger", number: "15", title: "FIXER'S LEDGER", note: "уважение улиц / огласка / связи и лояльность" },
];

export function DesignLab() {
  const [concept, setConcept] = useState<ConceptId>("lens");
  const activeConcept = concepts.find((item) => item.id === concept) ?? concepts[0];

  return (
    <main className="design-lab" data-concept={concept}>
      <header className="lab-toolbar">
        <div className="lab-title">
          <span>{`${activeConcept.number} // SG DESIGN LAB`}</span>
          <strong>{activeConcept.title}<small>{activeConcept.note}</small></strong>
        </div>
        <nav aria-label="Варианты дизайна главной страницы">
          {concepts.map((item) => (
            <button
              key={item.id}
              type="button"
              title={`${item.title} — ${item.note}`}
              aria-pressed={concept === item.id}
              onClick={() => setConcept(item.id)}
            >
              <b>{item.number}</b>
              <span>{item.title}<small>{item.note}</small></span>
            </button>
          ))}
        </nav>
        <a href="/login">ТЕКУЩИЙ ВХОД <ArrowRight size={14} /></a>
      </header>

      <div className="lab-stage" aria-live="polite">
        {concept === "bulletin" ? <BulletinConcept /> : null}
        {concept === "ghost" ? <GhostConcept /> : null}
        {concept === "squat" ? <SquatConcept /> : null}
        {concept === "relay" ? <RelayConcept /> : null}
        {concept === "totem" ? <TotemConcept /> : null}
        {concept === "deck" ? <DeckConcept /> : null}
        {concept === "term" ? <TermConcept /> : null}
        {concept === "street" ? <StreetConcept /> : null}
        {concept === "cathedral" ? <CathedralConcept /> : null}
        {concept === "broadcast" ? <BroadcastConcept /> : null}
        {concept === "lens" ? <LensConcept /> : null}
        {concept === "resonance" ? <ResonanceConcept /> : null}
        {concept === "swarm" ? <SwarmConcept /> : null}
        {concept === "astral" ? <AstralConcept /> : null}
        {concept === "ledger" ? <LedgerConcept /> : null}
      </div>
    </main>
  );
}

function BulletinConcept() {
  const signals = [
    ["NULL_SHAMAN", "В доках нашли пустой контейнер. Он стучит изнутри.", "СИЭТЛ / 04:11", "18"],
    ["MOTH//6", "Продаю чистый маршрут через старый хост Renraku.", "РЕДМОНД / 03:58", "07"],
    ["[УДАЛЕНО]", "Если мистер Джонсон улыбается — аванс просите дважды.", "ПЬЮАЛЛУП / 03:42", "31"],
  ];

  return (
    <section className="concept-bulletin" aria-label="Концепт Кровавый бюллетень">
      <div className="bulletin-topline"><span>ВЫПУСК 2080.11.18</span><b>НЕ ДЛЯ КОРПОРАТИВНОГО РАСПРОСТРАНЕНИЯ</b><span>SEA//GRID</span></div>
      <header className="bulletin-masthead">
        <div className="bulletin-sigil" aria-hidden="true"><Skull size={32} /><span>SG</span></div>
        <div>
          <p>ДОСКА ОБЪЯВЛЕНИЙ ДЛЯ ТЕХ, КОГО НЕТ В РЕЕСТРАХ</p>
          <h1>КРОВАВЫЙ<br /><em>БЮЛЛЕТЕНЬ</em></h1>
        </div>
        <aside><b>УЗЕЛ 73-A</b><span>12 активных ретрансляторов</span><span>3 следа ICE за последний час</span></aside>
      </header>

      <div className="bulletin-grid">
        <aside className="bulletin-index">
          <p className="bulletin-kicker">СОДЕРЖИМОЕ // 05</p>
          <nav>
            <a href="#signals"><b>01</b><span>СВЕЖИЕ СИГНАЛЫ</span><i>43</i></a>
            <a href="#door"><b>02</b><span>ДОСКА РАБОТ</span><i>08</i></a>
            <a href="#door"><b>03</b><span>ЧЁРНЫЙ РЫНОК</span><i>30</i></a>
            <a href="#door"><b>04</b><span>СЛУХИ / ШУМ</span><i>99+</i></a>
            <a href="#door"><b>05</b><span>МЁРТВЫЕ ХОСТЫ</span><i>12</i></a>
          </nav>
          <blockquote>«Матрица принадлежит тому, кто ещё держит соединение.»<cite>— надпись на сгоревшей деке</cite></blockquote>
          <div className="bulletin-wanted"><span>РАЗЫСКИВАЕТСЯ</span><b>ЖИВОЙ<br />СИСАДМИН</b><small>ОПЛАТА: НУЙЕНЫ / УСЛУГИ / МОЛЧАНИЕ</small></div>
        </aside>

        <article className="bulletin-feed" id="signals">
          <div className="bulletin-alert"><AlertTriangle size={17} /><b>СЕГОДНЯ НЕ ПОДКЛЮЧАЙТЕСЬ К УЗЛУ «БЕЛАЯ МАСКА»</b><span>его уже ждут</span></div>
          <div className="bulletin-section-title"><span>СВЕЖИЕ СИГНАЛЫ</span><small>сортировка: выжили первыми</small></div>
          {signals.map(([author, title, meta, replies], index) => (
            <a className="bulletin-post" href="#door" key={author + title}>
              <span className="post-number">0{index + 1}</span>
              <div><p>{meta}</p><h2>{title}</h2><small>передал: <b>{author}</b> · шифр проверен не полностью</small></div>
              <strong>{replies}<small>ответов</small></strong>
            </a>
          ))}
          <footer><b>ПРАВИЛО НОМЕР НОЛЬ:</b><span>никаких настоящих имён</span><span>никаких бесплатных услуг</span><span>никаких прямых маршрутов</span></footer>
        </article>

        <aside className="bulletin-door" id="door">
          <p className="bulletin-kicker">ЗАКРЫТАЯ ЧАСТЬ // ВХОД</p>
          <div className="door-stamp"><span>ЕСТЬ</span><b>ПРИГЛАШЕНИЕ?</b></div>
          <p>Хост не спрашивает, кто ты. Хост проверяет, кто за тебя поручился.</p>
          <label><span>ПОЗЫВНОЙ</span><input aria-label="Позывной" placeholder="runner_name" /></label>
          <label><span>ОДНОРАЗОВЫЙ КЛЮЧ</span><input aria-label="Одноразовый ключ" type="password" placeholder="••••••••••••" /></label>
          <a className="bulletin-enter" href="/login">ПРОЙТИ ПРОВЕРКУ <ArrowRight size={15} /></a>
          <dl><div><dt>ГОРОД</dt><dd>СИЭТЛ</dd></div><div><dt>ШУМ</dt><dd>4</dd></div><div><dt>МЕСТНЫЙ ICE</dt><dd>НЕИЗВЕСТЕН</dd></div><div><dt>ПОСЛЕДНИЙ РЕЙД</dt><dd>11 МИН НАЗАД</dd></div></dl>
        </aside>
      </div>
      <div className="bulletin-footer"><span>SHADOWGRID НЕ НЕСЁТ ОТВЕТСТВЕННОСТИ ЗА ПОТЕРЮ ДАННЫХ, ДЕК И ПАМЯТИ</span><b>СТР. 01 / 05</b></div>
    </section>
  );
}

function GhostConcept() {
  return (
    <section className="concept-ghost" aria-label="Концепт Призрачная сеть">
      <div className="ghost-grid" aria-hidden="true" />
      <div className="ghost-orbit orbit-one" aria-hidden="true" /><div className="ghost-orbit orbit-two" aria-hidden="true" />
      <header className="ghost-status">
        <div className="ghost-brand"><span>SG</span><div><b>SHADOWGRID</b><small>UNREGISTERED SOCIAL HOST</small></div></div>
        <div className="ghost-path"><i /> PUBLIC GRID <b>/</b> ORPHAN RELAY <b>/</b> <strong>RAIN CITY</strong></div>
        <div className="ghost-clock"><small>ЛОКАЛЬНОЕ ВРЕМЯ</small><b>04:17:08</b></div>
      </header>

      <div className="ghost-map" aria-label="Карта маршрута">
        <button className="ghost-node node-dead" type="button"><WifiOff size={15} /><span>МЁРТВЫЙ<br />РЕТРАНСЛЯТОР</span><small>-12 dB</small></button>
        <button className="ghost-node node-market" type="button"><Braces size={15} /><span>ЧЁРНЫЙ<br />РЫНОК</span><small>30 лотов</small></button>
        <button className="ghost-node node-sanctum" type="button"><Radio size={15} /><span>АСТРАЛЬНЫЙ<br />АРХИВ</span><small>шум 6</small></button>
        <button className="ghost-node node-you" type="button"><CircleDot size={16} /><span>ВАШ<br />СИГНАЛ</span><small>не опознан</small></button>
        <div className="ghost-route route-a" aria-hidden="true" /><div className="ghost-route route-b" aria-hidden="true" /><div className="ghost-route route-c" aria-hidden="true" />
      </div>

      <article className="ghost-manifesto">
        <p>ВИРТУАЛЬНАЯ РЕАЛЬНОСТЬ / ПОВЕРХ ГОРОДА</p>
        <h1>МЫ СПРЯТАЛИ<br />ГОРОД <em>ВНУТРИ</em><br />ГОРОДА.</h1>
        <div><span>Хосты здесь выглядят так, как их помнят владельцы.</span><span>Личности — так, как хотят быть увидены.</span><span>Маршруты — так, чтобы по ним нельзя было вернуться.</span></div>
      </article>

      <aside className="ghost-handshake">
        <div className="handshake-head"><ShieldAlert size={17} /><div><b>НЕИЗВЕСТНЫЙ АВАТАР</b><small>вы на границе частного хоста</small></div><span>?</span></div>
        <div className="handshake-scan"><i /><span>СИГНАЛ</span><b>73%</b></div>
        <p>Назовите себя так, как вас знают в Тенях. Настоящее имя только увеличит уровень шума.</p>
        <label><span>МЕТКА АВАТАРА</span><div><CircleDot size={14} /><input aria-label="Метка аватара" placeholder="alias//handle" /></div></label>
        <label><span>КЛЮЧ ДОСТУПА</span><div><KeyRound size={14} /><input aria-label="Ключ доступа" type="password" placeholder="encrypted packet" /></div></label>
        <a href="/login">ПРОЯВИТЬСЯ В ХОСТЕ <ArrowRight size={15} /></a>
        <footer><span>РИСК СХОДСТВА</span><b>11%</b><span>СЛЕД ICE</span><b>НЕ ОБНАРУЖЕН</b></footer>
      </aside>

      <div className="ghost-feed">
        <span><b>04:16</b> GLASS_ORACLE сменил сертификат узла</span>
        <span><b>04:13</b> новый заказ: «БУМАЖНЫЕ ОСЫ»</span>
        <span><b>04:09</b> кто-то слушает канал 7</span>
      </div>
    </section>
  );
}

function SquatConcept() {
  return (
    <section className="concept-squat" aria-label="Концепт Подвальный узел">
      <header className="squat-header">
        <div><Terminal size={18} /><b>SHADOWGRID_73A</b><span>{"// работает на честном слове"}</span></div>
        <p><i /> 17 ОНЛАЙН <i /> 4 ПОТЕРЯННЫХ ПАКЕТА <i className="bad" /> КОРП-СЕТЬ НЕ ВИДИТ</p>
      </header>
      <aside className="squat-rail" aria-label="Разделы узла">
        <button type="button" className="active"><span>⌂</span><b>НОРА</b></button>
        <button type="button"><span>×</span><b>ЗАКАЗЫ</b></button>
        <button type="button"><span>¥</span><b>БАРАХОЛКА</b></button>
        <button type="button"><span>#</span><b>ТРЁП</b></button>
        <button type="button"><span>!</span><b>ТРЕВОГИ</b></button>
        <small>rev. 73A<br />patch by MOTH</small>
      </aside>

      <article className="squat-main">
        <div className="squat-ascii" aria-hidden="true"><pre>{String.raw`        .---.
   ____/_____\____
  /  NO GODS    /|
 /__NO MASTERS_/ |
 |  JUST HOSTS | /
 |_____________|/`}</pre><span>не трогай провод<br />с красной изолентой</span></div>
        <div className="squat-welcome">
          <p>&gt; carrier detected / чужой, но не корп</p>
          <h1>ДОБРО ПОЖАЛОВАТЬ<br />В <em>НАШУ НОРУ.</em></h1>
          <p>Её собирали на коленке декеры, риггеры и один дух, который до сих пор требует права администратора. Тут нет правил. Есть договорённости.</p>
          <div><b>НЕ ЛОМАЙ СВОИХ.</b><b>НЕ ТАЩИ ХВОСТ.</b><b>ПЛАТИ ЗА РАБОТУ.</b></div>
        </div>

        <section className="squat-wall">
          <header><span>{"/// СТЕНА СЕЙЧАС"}</span><small>обновлено 7 сек назад</small></header>
          <div className="squat-message"><b>HEXSAINT</b><span>03:59</span><p>Кто снова подписал кофеварку как устройство ввода?</p><i>12 ответов</i></div>
          <div className="squat-message hot"><b>GRID_KEEPER</b><span>04:07</span><p>ICE на восточном маршруте. Красный уровень. Без героизма.</p><i>закреплено</i></div>
          <div className="squat-message"><b>NULL_SHAMAN</b><span>04:12</span><p>Ищу двоих на вынос из Белвью. Тихо, быстро, без вопросов.</p><i>¥ 18 000</i></div>
        </section>

        <aside className="squat-notes" aria-label="Заметки операторов">
          <div className="tape-note note-yellow"><b>НЕ ЗАБУДЬ:</b><span>сменить ключ после рейда</span><small>— G.O.</small></div>
          <div className="tape-note note-red"><b>НЕ ХОДИ</b><span>через узел 44<br />там паук</span></div>
          <div className="squat-sticker"><Skull size={19} /><b>SINLESS<br />AND PROUD</b></div>
        </aside>
      </article>

      <aside className="squat-login">
        <header><ScanLine size={16} /><span>tty73a / secure-ish</span><b>● REC</b></header>
        <div className="terminal-copy"><span>route.public ........ cut</span><span>spoof chip .......... ok</span><span>invitation .......... <b>?</b></span></div>
        <p>&gt; назови позывной_<i>▌</i></p>
        <label><span>HANDLE</span><input aria-label="Позывной" placeholder="кто_спрашивает" /></label>
        <label><span>PASSFRAG</span><input aria-label="Код доступа" type="password" placeholder="************" /></label>
        <a href="/login">[ ПОДКЛЮЧИТЬСЯ ]</a>
        <small>если тебя здесь не ждут — ты увидишь только эту страницу</small>
      </aside>
      <footer className="squat-footer"><b>SG://73A</b><span>последний бэкап: «когда-то во вторник»</span><span>пожертвовать железо → спроси MOTH//6</span></footer>
    </section>
  );
}

function RelayConcept() {
  const threads = [
    ["ICEWATCH", "КРАСНЫЙ", "На Tacoma-ветке поднялся новый патрульный паук", "03:58", "27"],
    ["PAYDATA", "ПРОВЕРЕН", "Дамп с закрытого хоста Shiawase: только приглашённым", "04:03", "08"],
    ["РАБОТА", "¥ 42K", "Нужен третий номер на тихий заход в лабораторию Bellevue", "04:11", "14"],
    ["ШУМ", "НЕЯСНО", "Кто-нибудь ещё слышит пение на частоте мёртвого узла?", "04:16", "39"],
  ];

  return (
    <section className="concept-relay" aria-label="Концепт JackPoint Relay">
      <div className="relay-corners" aria-hidden="true"><i /><i /><i /><i /></div>
      <header className="relay-topbar">
        <div className="relay-brand"><span><Eye size={23} /></span><div><b>SHADOWGRID</b><small>JACKPOINT // ORPHAN RELAY 73A</small></div></div>
        <div className="relay-route"><span>PUBLIC GRID</span><i /><span>SPOOF-04</span><i /><span>DEAD DROP</span><i className="live" /><b>SG://73A</b></div>
        <div className="relay-threat"><small>СЛЕД КОРП-СЕТИ</small><b>НЕ ОБНАРУЖЕН</b><span>00:11:47</span></div>
      </header>

      <aside className="relay-sidebar">
        <header><Network size={16} /><span>КАРТА ДОВЕРИЯ</span><b>7/9</b></header>
        <div className="relay-tree">
          <button type="button" className="trusted"><i /><div><b>73A / ВХОД</b><small>пинг 31мс · шифр v6</small></div><ShieldCheck size={13} /></button>
          <button type="button" className="trusted"><i /><div><b>MOTH-NEST</b><small>поручитель подтверждён</small></div><ShieldCheck size={13} /></button>
          <button type="button"><i /><div><b>RAIN-CITY</b><small>12 каналов · шум 3</small></div><Radio size={13} /></button>
          <button type="button" className="warning"><i /><div><b>WHITE-MASK</b><small>маршрут скомпрометирован</small></div><AlertTriangle size={13} /></button>
          <button type="button" className="dead"><i /><div><b>ORPHAN_09</b><small>последний сигнал 3ч назад</small></div><WifiOff size={13} /></button>
        </div>
        <section className="relay-encryption">
          <header><LockKeyhole size={14} /><span>СТАТУС ШИФРОВАНИЯ</span></header>
          <div><span>туннель</span><i><b style={{ width: "91%" }} /></i><strong>91%</strong></div>
          <div><span>подмена SIN</span><i><b style={{ width: "68%" }} /></i><strong>68%</strong></div>
          <div className="amber"><span>доверие</span><i><b style={{ width: "73%" }} /></i><strong>73%</strong></div>
        </section>
        <blockquote>Никто не владеет всей сетью. Поэтому её пока никто не продал.<cite>— MOTH//6</cite></blockquote>
      </aside>

      <main className="relay-main">
        <div className="relay-ident"><span>UNLISTED BBS // ТОЛЬКО ПО ЦЕПОЧКЕ ДОВЕРИЯ</span><b>17 ПОЛЬЗОВАТЕЛЕЙ В УЗЛЕ</b></div>
        <header className="relay-hero">
          <div><small>ПОДКЛЮЧЕНИЕ ПРИНЯТО // ЛИЧНОСТЬ НЕ УСТАНОВЛЕНА</small><h1>JACKPOINT<br /><em>OVERLAY</em></h1></div>
          <p>Ты уже внутри нелегальной сети. До закрытых каналов осталась одна проверка: докажи, что тебя сюда привёл свой, а не корпоративный паук.</p>
        </header>
        <section className="relay-board">
          <header><div><Braces size={15} /><b>ДОСКА / СВЕЖИЕ ПАКЕТЫ</b></div><span>обновлено 4 сек назад</span></header>
          {threads.map(([channel, status, title, time, replies]) => (
            <a href="#relay-access" className="relay-thread" key={title}>
              <span>{channel}</span><b>{status}</b><p>{title}</p><time>{time}</time><strong>{replies}<small>ответов</small></strong>
            </a>
          ))}
        </section>
        <div className="relay-code"><span>04:17:08 route.rotate(seed:0x73A)</span><span>04:17:09 trust.query(alias:UNKNOWN)</span><b>04:17:10 invitation.waiting...</b></div>
      </main>

      <aside className="relay-access" id="relay-access">
        <header><Fingerprint size={17} /><div><b>РУКОПОЖАТИЕ 03/04</b><small>приглашение ещё не раскрыто</small></div><span>?</span></header>
        <div className="relay-avatar"><div><Eye size={31} /><i /></div><span>НЕИЗВЕСТНЫЙ<br />ДЕКЕР</span><small>persona hash: 8C//??//73A</small></div>
        <p>Настоящее имя здесь считается уязвимостью. Введи позывной и фрагмент ключа, выданный поручителем.</p>
        <label><span>ПОЗЫВНОЙ / HANDLE</span><div><Terminal size={14} /><input aria-label="Позывной для JackPoint Relay" placeholder="ghost_in_the_wire" /></div></label>
        <label><span>ФРАГМЕНТ ПРИГЛАШЕНИЯ</span><div><KeyRound size={14} /><input aria-label="Фрагмент приглашения" type="password" placeholder="•••• •••• ••••" /></div></label>
        <div className="relay-proof"><span>поручитель</span><b>MOTH//6</b><span>одноразовый маршрут</span><b>ГОТОВ</b></div>
        <a href="/login">ЗАВЕРШИТЬ РУКОПОЖАТИЕ <ArrowRight size={15} /></a>
        <small><ShieldAlert size={12} /> Три ошибки сожгут этот маршрут и сотрут локальный ключ.</small>
      </aside>

      <footer className="relay-footer"><span>NO GODS // NO MASTERS // JUST HOSTS</span><b>СИЭТЛ · 2080</b><span>ПАКЕТЫ: 004913 ↑ / 004887 ↓</span><span>ICE: SLEEPING</span></footer>
    </section>
  );
}

function TotemConcept() {
  return (
    <section className="concept-totem" aria-label="Концепт Тотемный протокол">
      <div className="totem-noise" aria-hidden="true" />
      <header className="totem-top">
        <div><Hexagon size={19} /><b>SHADOWGRID // ТОТЕМНЫЙ ПРОТОКОЛ</b></div>
        <nav><span>МАТЕРИЯ</span><i /><span>МАТРИЦА</span><i /><strong>АСТРАЛ</strong></nav>
        <p><i /> ДУХ УЗЛА БОДРСТВУЕТ</p>
      </header>

      <aside className="totem-telemetry">
        <header><Activity size={15} /><b>СОСТОЯНИЕ СВЯЗИ</b><span>LIVE</span></header>
        <div className="totem-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <dl>
          <div><dt>ШУМ</dt><dd>03.7</dd><i style={{ height: "37%" }} /></div>
          <div><dt>РЕЗОНАНС</dt><dd>81%</dd><i style={{ height: "81%" }} /></div>
          <div><dt>АСТРАЛЬНЫЙ ФОН</dt><dd>12%</dd><i style={{ height: "12%" }} /></div>
        </dl>
        <section><p>ТОТЕМ УЗЛА</p><div><Bird size={38} /><span>ВОРОН<br /><small>наблюдает / запоминает</small></span></div></section>
        <blockquote>Машины видят маршрут. Духи видят намерение.</blockquote>
      </aside>

      <main className="totem-core">
        <div className="totem-title"><small>НЕЗАРЕГИСТРИРОВАННЫЙ ХОСТ // СИГНАЛ ВНЕ СЕТКИ</small><h1>СЕТЬ ПОМНИТ<br /><em>СВОИХ.</em></h1></div>
        <div className="totem-mandala" aria-hidden="true">
          <div className="totem-ring ring-a"><span>ᚨ</span><span>ᛇ</span><span>ᛟ</span><span>ᚾ</span></div>
          <div className="totem-ring ring-b" /><div className="totem-ring ring-c" />
          <div className="totem-bird"><Bird size={76} /><Eye size={22} /></div>
          <i className="totem-axis axis-x" /><i className="totem-axis axis-y" />
        </div>
        <div className="totem-pulses"><span>persona: НЕИЗВЕСТНА</span><i /><span>намерение: СКРЫТО</span><i /><b>ворота: ОТКРЫТЫ</b></div>
      </main>

      <aside className="totem-gate">
        <header><Triangle size={18} /><div><b>ПЕРЕХОД МЕЖДУ СЛОЯМИ</b><small>физический след отсечён</small></div></header>
        <div className="totem-scan"><Radar size={52} /><span><i /> СКАНИРОВАНИЕ АУРЫ</span><b>64%</b></div>
        <p>В узел входят не по паспорту. Тотем сверяет позывной, цифровой след и намерение. Ложь допустима. Предательство — нет.</p>
        <label><span>ИМЯ В МАТРИЦЕ</span><div><Waves size={14} /><input aria-label="Имя в Матрице" placeholder="назови себя" /></div></label>
        <label><span>ЗНАК ПОРУЧИТЕЛЯ</span><div><KeyRound size={14} /><input aria-label="Знак поручителя" type="password" placeholder="скрытый символ" /></div></label>
        <div className="totem-oath"><span>НЕ ЛОМАЙ СВОИХ</span><span>НЕ ВЕДИ ХВОСТ</span><span>НЕ БУДИ ЧЁРНЫЙ ICE</span></div>
        <a href="/login">ПЕРЕЙТИ ПО ТУ СТОРОНУ <ArrowRight size={15} /></a>
      </aside>

      <footer className="totem-footer"><span>ᚨ SG:73A</span><span>эфемерный ключ создан 00:00:08 назад</span><b>КАНАЛ ВНЕ ЮРИСДИКЦИИ</b><span>ворон сохранил твою тень</span></footer>
    </section>
  );
}

function DeckConcept() {
  const jobs = [
    ["JP-1088", "БЕЛЬВЬЮ", "Извлечь исследователя до смены охраны", "42 000¥", "СРЕДНИЙ"],
    ["JP-1091", "РЕДМОНД", "Поднять данные с утопленной кибердеки", "18 500¥", "НИЗКИЙ"],
    ["JP-1094", "ТАКОМА", "Стереть три минуты городского архива", "31 000¥", "ВЫСОКИЙ"],
  ];

  return (
    <section className="concept-deck" aria-label="Концепт Медная дека">
      <div className="deck-shell">
        <header className="deck-header">
          <div className="deck-power"><CircleDot size={20} /><span>SG</span></div>
          <div><b>SHADOWGRID CYBERTERMINAL</b><small>FIRMWARE 73A.2080 // CASE MOD BY KUBICH</small></div>
          <p><span>CORE</span><i><b /></i><strong>76°</strong><span>TRACE</span><i><b /></i><strong>09%</strong></p>
          <div className="deck-clock">04:17:12<small>LOCAL</small></div>
        </header>
        <nav className="deck-tabs" aria-label="Разделы кибертерминала">
          <button className="active" type="button">JACKPOINT</button><button type="button">КОНТРАКТЫ <b>03</b></button><button type="button">БАРАХОЛКА</button><button type="button">АРХИВ</button><button type="button">СИСТЕМА</button>
        </nav>

        <div className="deck-body">
          <aside className="deck-persona">
            <header><Fingerprint size={15} /><b>PERSONA SLOT</b><span>EMPTY</span></header>
            <div className="deck-portrait"><div><Eye size={38} /><i /></div><span>NO IMAGE<br />NO SIN<br />NO MASTER</span></div>
            <dl><div><dt>ACCESS</dt><dd>GUEST</dd></div><div><dt>MARKS</dt><dd>0 / 3</dd></div><div><dt>EDGE</dt><dd>UNKNOWN</dd></div><div><dt>OVERWATCH</dt><dd>004</dd></div></dl>
            <section><b>ПОДКЛЮЧЁННЫЕ МОДУЛИ</b><div><span><Router size={18} /><small>SPOOF</small></span><span><Cpu size={18} /><small>DECRYPT</small></span><span><ShieldCheck size={18} /><small>ARMOR</small></span><span className="empty"><Hexagon size={18} /><small>EMPTY</small></span></div></section>
          </aside>

          <main className="deck-screen">
            <header><div><Terminal size={15} /><b>JACKPOINT / ОБЩАЯ ДОСКА</b></div><span>СОРТИРОВКА: ДОВЕРИЕ</span></header>
            <div className="deck-banner"><small>НЕЛЕГАЛЬНЫЙ РЕТРАНСЛЯТОР // КОРПОРАТИВНЫХ УЧЁТНЫХ ЗАПИСЕЙ НЕТ</small><h1>ВЫБЕРИ РАБОТУ.<br /><em>НЕ ОСТАВЬ СЛЕД.</em></h1><p>Доступ к деталям откроется после проверки позывного. До тех пор заказчики, адреса и имена защищены локальной маской.</p></div>
            <section className="deck-jobs">
              {jobs.map(([id, place, title, pay, risk]) => (
                <button type="button" key={id}><span>{id}</span><small>{place}</small><p>{title}</p><strong>{pay}</strong><i data-risk={risk}>{risk}</i></button>
              ))}
            </section>
            <footer><span>{">"} 19 новых пакетов</span><span>{">"} 2 маршрута потеряны</span><b>{">"} BLACK_ICE: СПИТ</b></footer>
          </main>

          <aside className="deck-login">
            <header><LockKeyhole size={15} /><b>SECURE JACK</b><span>AUX-3</span></header>
            <div className="deck-diagnostic"><div><ScanLine size={48} /><i /></div><p><span>ДЕКА</span><b>НЕ ОПОЗНАНА</b><span>ПОРУЧИТЕЛЬ</span><b>MOTH//6</b><span>ШИФР</span><b>ГОТОВ</b></p></div>
            <p>Подключение установлено, но интерфейс работает в гостевом режиме. Вставь свою персону в свободный слот.</p>
            <label><span>HANDLE</span><div><Terminal size={13} /><input aria-label="Позывной кибердеки" placeholder="runner_alias" /></div></label>
            <label><span>PASSCODE</span><div><KeyRound size={13} /><input aria-label="Код кибердеки" type="password" placeholder="••••••••••" /></div></label>
            <a className="deck-connect" href="/login">ЗАНЯТЬ СЛОТ 01 <ArrowRight size={15} /></a>
            <small><AlertTriangle size={12} /> ОТСОЕДИНИ КАБЕЛЬ, ЕСЛИ ИНДИКАТОР СТАНЕТ КРАСНЫМ</small>
          </aside>
        </div>
        <footer className="deck-footer"><span>BUS A: 01101001</span><span>HEAT SINK: NOMINAL</span><b>ENCRYPTED // PEER-TO-PEER</b><span>NO WARRANTY // NO LOGS</span></footer>
      </div>
    </section>
  );
}

function TermConcept() {
  return (
    <section className="concept-term" aria-label="Концепт Zero Term">
      <div className="term-tear" aria-hidden="true" />
      <header className="term-status">
        <span>carrier 14400 // handshake accepted</span>
        <span>route: SEA → ??? → 73A</span>
        <b>NO LOGS / NO SIN / NO GODS</b>
      </header>

      <main className="term-console">
        <div className="term-boot">
          <p>ShadowGrid Operating System [Version 0.73a]</p>
          <p>(c) 2071–2080 nobody. No rights reserved.</p>
          <p className="term-delay-one">mount /dev/dead-drop ............ <b>OK</b></p>
          <p className="term-delay-two">spoof public grid signature ..... <b>OK</b></p>
          <p className="term-delay-three">identify remote persona ......... <strong>REFUSED</strong></p>
        </div>

        <div className="term-wordmark" aria-hidden="true"><span>SHADOW</span><span>GRID</span></div>
        <p className="term-motd">MESSAGE OF THE NIGHT: ЕСЛИ ТЫ ВИДИШЬ ЭТУ СТРОКУ — КТО-ТО ИЗ НАШИХ УЖЕ РИСКНУЛ ЗА ТЕБЯ.</p>

        <div className="term-columns">
          <section className="term-board">
            <header>┌─ /boards/sea/general ───────────────────────────────────────────── 43 new ─┐</header>
            <button type="button"><b>04:17</b><span>&lt;NULL_SHAMAN&gt;</span><p>на частоте 73 снова кто-то шепчет по-латыни. техноманты, это ваше?</p></button>
            <button type="button"><b>04:13</b><span>&lt;MOTH//6&gt;</span><p>маршрут через Auburn сожжён. НЕ ПРОВЕРЯЙТЕ САМИ.</p></button>
            <button type="button"><b>04:09</b><span>&lt;GLASS_ORACLE&gt;</span><p>[JOB] двое в Bellevue / тихий вход / 42k¥ / ключ у меня</p></button>
            <button type="button"><b>03:58</b><span>&lt;hexsaint&gt;</span><p>продам Fairlight, пережил владельца. подробности в /market</p></button>
            <footer>└─ PgDn: ещё 117 сообщений ── F3: поиск ── F10: сжечь соединение ───────┘</footer>
          </section>

          <aside className="term-sysop">
            <p>WHO IS ONLINE?</p>
            <span><i>+</i> MOTH//6 <small>sysop</small></span>
            <span><i>+</i> NULL_SHAMAN <small>hidden</small></span>
            <span><i>+</i> GLASS_ORACLE <small>vr</small></span>
            <span><i>+</i> 14 anonymous</span>
            <hr />
            <p>SECURITY</p>
            <span>trace ........ 0.04</span>
            <span>noise ........ 3</span>
            <span>ICE .......... asleep</span>
            <span>trust ........ <b>?</b></span>
          </aside>
        </div>

        <div className="term-prompt" id="term-prompt">
          <span>guest@shadowgrid:~$</span>
          <label><span className="sr-only">Команда или позывной</span><input aria-label="Команда или позывной" placeholder="login --handle твой_позывной --key " /></label>
          <a href="/login">EXECUTE ↵</a>
        </div>
        <p className="term-warning">*** WARNING: THREE FAILED LOGINS WILL FORMAT THE INVITATION CHIP ***</p>
      </main>
    </section>
  );
}

function StreetConcept() {
  return (
    <section className="concept-street" aria-label="Концепт Sinless Wall">
      <div className="street-spray spray-a" aria-hidden="true" /><div className="street-spray spray-b" aria-hidden="true" />
      <header className="street-header"><span>СИЭТЛ // СТЕНА 73A // ОБНОВЛЕНО ТОЛЬКО ЧТО</span><b>КОРПАМ ВХОД С ИХ АДВОКАТОМ</b></header>
      <div className="street-marquee"><div>БЕЗ SIN · БЕЗ ХОЗЯЕВ · БЕЗ ЛОГОВ · ПЛАТИ ЗА РАБОТУ · НЕ ТАЩИ ХВОСТ · БЕЗ SIN · БЕЗ ХОЗЯЕВ · БЕЗ ЛОГОВ · ПЛАТИ ЗА РАБОТУ · НЕ ТАЩИ ХВОСТ ·</div></div>

      <main className="street-canvas">
        <div className="street-title"><small>НЕ САЙТ. НЕ СЕРВИС. НАША СТЕНА.</small><h1>SIN<span>LESS</span><br />WALL</h1><p>Локальная mesh-сеть оживает, когда рядом хотя бы две деки. Никаких серверов. Никаких владельцев. Только люди, которые решили не исчезать поодиночке.</p></div>

        <article className="street-note note-one"><span>РАБОТА / ¥¥¥</span><b>НУЖЕН МАГ,<br />КОТОРЫЙ НЕ ЗАДАЁТ<br />ВОПРОСОВ</b><small>→ спроси NULL_SHAMAN</small></article>
        <article className="street-note note-two"><span>ICE ALERT</span><b>WHITE MASK<br />СЛУШАЕТ</b><small>не ходи через канал 04</small></article>
        <article className="street-note note-three"><span>БАРАХОЛКА</span><b>ДЕКА / 3 СЛОТА<br />НЕМНОГО ГОРЕЛА</b><small>18 000¥ или услуга</small></article>
        <article className="street-note note-four"><span>СЛУХ</span><b>В RENRAKU<br />ВИДЕЛИ ДРАКОНА</b><small>27 ответов / 19 оскорблений</small></article>

        <div className="street-totem" aria-hidden="true"><Bird size={88} /><span>73A</span><i /><i /></div>
        <div className="street-sticker sticker-a"><Skull size={20} /><b>SINLESS<br />&amp; LOUD</b></div>
        <div className="street-sticker sticker-b">NO<br />MASTER<br />HOST</div>

        <aside className="street-door">
          <p>ТЕБЯ ПОЗВАЛИ?</p><h2>ОСТАВЬ<br />МЕТКУ.</h2>
          <label><span>КАК ТЕБЯ ЗОВУТ В ТЕНЯХ</span><input aria-label="Уличный позывной" placeholder="@handle" /></label>
          <label><span>КТО ЗА ТЕБЯ ВПИСАЛСЯ</span><input aria-label="Поручитель" type="password" placeholder="знак / фраза / шрам" /></label>
          <a href="/login">ПРОЛЕЗТЬ В СЕТЬ <ArrowRight size={18} /></a>
          <small>если соврёшь — стена запомнит</small>
        </aside>
      </main>
    </section>
  );
}

function CathedralConcept() {
  return (
    <section className="concept-cathedral" aria-label="Концепт Black ICE Cathedral">
      <div className="cathedral-rain" aria-hidden="true"><span>01001101<br />†<br />73A<br />000101</span><span>NO SIN<br />∴<br />BLACK ICE<br />AWAKE</span><span>ᚨ<br />0101<br />MOTH<br />00110</span><span>TRUST<br />NULL<br />†<br />TRACE</span><span>00073<br />EYE<br />∴<br />HOST</span></div>
      <header className="cathedral-header"><span>LIBER UMBRARUM // HOST 73A</span><b>BLACK ICE CATHEDRAL</b><span>SEATTLE // 04:17</span></header>

      <main className="cathedral-nave">
        <div className="cathedral-arch arch-left" aria-hidden="true" /><div className="cathedral-arch arch-right" aria-hidden="true" />
        <div className="cathedral-window" aria-hidden="true"><i /><i /><i /><Eye size={70} /><span>73A</span></div>
        <div className="cathedral-copy"><p>НЕЗАРЕГИСТРИРОВАННЫЙ ЦИФРОВОЙ ПРИХОД</p><h1>ENTER<br />WITHOUT<br /><em>A NAME.</em></h1><blockquote>Корпорации называют это преступлением.<br />Мы называем это правом остаться невидимым.</blockquote></div>

        <aside className="cathedral-margin margin-left">
          <span>I.</span><b>ТРИ ОБЕТА</b><p>Не выдавай своих.<br />Не храни настоящих имён.<br />Не оставляй маршрут живым.</p>
        </aside>
        <aside className="cathedral-margin margin-right">
          <span>II.</span><b>СЕГОДНЯ ПОМЯНУТ</b><p>ORPHAN_09<br />SISTER STATIC<br />RED WIRE</p>
        </aside>

        <section className="cathedral-confession">
          <header><Triangle size={15} /><span>РИТУАЛ ДОСТУПА // ОДНО РУКОПОЖАТИЕ</span><Triangle size={15} /></header>
          <label><span>ИМЯ, КОТОРОГО НЕТ В РЕЕСТРЕ</span><input aria-label="Имя вне реестра" placeholder="позывной" /></label>
          <i>✦</i>
          <label><span>СЛОВО, ДАННОЕ ПОРУЧИТЕЛЕМ</span><input aria-label="Слово поручителя" type="password" placeholder="••••••••••••" /></label>
          <a href="/login">ПЕРЕСТУПИТЬ ПОРОГ</a>
        </section>
      </main>
      <footer className="cathedral-footer"><span>ICE спит, пока ты говоришь правду</span><b>NO RECORD SHALL REMAIN</b><span>overwatch 004 / 040</span></footer>
    </section>
  );
}

function BroadcastConcept() {
  return (
    <section className="concept-broadcast" aria-label="Концепт Channel 73">
      <div className="broadcast-desk">
        <header><b>SG PIRATE RECEIVER</b><span>PROPERTY OF NOBODY</span><i>2080</i></header>
        <div className="broadcast-set">
          <main className="broadcast-screen">
            <div className="broadcast-static" aria-hidden="true" /><div className="broadcast-roll" aria-hidden="true" />
            <div className="broadcast-bars" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            <header><span>CHANNEL 73 // SIGNAL HIJACKED</span><b>● LIVE</b></header>
            <div className="broadcast-feed">
              <p>WE INTERRUPT<br />YOUR REGULAR<br />PROGRAMMING</p>
              <h1>SHADOW<br /><em>GRID</em></h1>
              <div><span>17 RUNNERS ONLINE</span><span>4 CONTRACTS OPEN</span><span>1 CORP TRACE LOST</span></div>
            </div>
            <footer><span>04:17 ICEWATCH: Tacoma route is hot</span><span>04:13 MOTH//6: rotate your keys</span><span>04:09 JOB: Bellevue / 42K¥</span></footer>
          </main>

          <aside className="broadcast-tuner">
            <div className="broadcast-logo"><Radio size={27} /><b>SG<br />73</b></div>
            <section><span>TUNING</span><div className="broadcast-knob"><i /><b>73</b></div><small>88—108 / ILLEGAL BAND</small></section>
            <section className="broadcast-meter"><span>TRACE</span><i><b /></i><strong>09%</strong></section>
            <button type="button">CH +</button><button type="button">CH −</button>
          </aside>
        </div>

        <div className="broadcast-controls">
          <p><b>ПРИЁМ ЗАКРЫТОГО СИГНАЛА</b><span>Передатчик не знает твоего настоящего имени — не порть ему вечер.</span></p>
          <label><span>CALLSIGN</span><input aria-label="Позывной для пиратского канала" placeholder="runner_73" /></label>
          <label><span>ACCESS TONE</span><input aria-label="Код доступа к каналу" type="password" placeholder="•••• ••••" /></label>
          <a href="/login"><Radio size={16} /> ВЫЙТИ В ЭФИР</a>
        </div>
        <footer><span>WARNING: UNLICENSED BROADCAST</span><b>IF YOU CAN HEAR US, YOU ARE ALREADY PART OF THE NETWORK</b><span>VHF // 73.0</span></footer>
      </div>
    </section>
  );
}

function LensConcept() {
  return (
    <section className="concept-lens" aria-label="Концепт Rain City Lens">
      <div className="lens-rain" aria-hidden="true" /><div className="lens-city" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
      <header className="lens-status"><div><Eye size={16} /><b>RENRAKU IRIS//OFFLINE MOD</b></div><span>AR FILTER: <strong>SHADOW ONLY</strong></span><span>КОМЛИНК 73A · ЗАРЯД 61%</span></header>
      <div className="lens-reticle" aria-hidden="true"><i /><i /><CircleDot size={20} /></div>

      <main className="lens-world">
        <article className="lens-marker marker-cafe"><span>ОДР//PUBLIC</span><b>SOYKAF 2¥</b><small>реклама подавлена фильтром</small></article>
        <article className="lens-marker marker-drone"><span>DEVICE//UNKNOWN</span><b>НАБЛЮДАЮЩИЙ ДРОН</b><small>владелец скрыт · дистанция 38м</small></article>
        <article className="lens-marker marker-route"><span>ROUTE//ENCRYPTED</span><b>ПОВЕРНИ В ПЕРЕУЛОК</b><small>метка видна только приглашённым</small></article>
        <article className="lens-marker marker-dead"><span>HOST ECHO</span><b>ЗДЕСЬ БЫЛ ORPHAN_09</b><small>астральная подпись отсутствует</small></article>

        <section className="lens-handshake">
          <p>СКРЫТЫЙ ОБЪЕКТ ДОПОЛНЕННОЙ РЕАЛЬНОСТИ</p>
          <h1>СМОТРИ<br />МЕЖДУ<br /><em>СЛОЯМИ.</em></h1>
          <div><span><i /> звук подключён</span><span><i /> тактильный канал</span><span><i /> публичные ОДР скрыты</span></div>
          <label><span>НАЛОЖИТЬ ПОЗЫВНОЙ НА ПЕРСОНУ</span><input aria-label="Позывной дополненной реальности" placeholder="@твой_образ" /></label>
          <a href="/login">ПРИНЯТЬ СКРЫТУЮ МЕТКУ <ArrowRight size={16} /></a>
        </section>
      </main>
      <footer className="lens-footer"><span>ФИЗИЧЕСКИЙ МИР</span><i /><b>ДОПОЛНЕННАЯ РЕАЛЬНОСТЬ</b><i /><span>МАТРИЦА</span><small>04:17 / SEATTLE RAIN</small></footer>
    </section>
  );
}

function ResonanceConcept() {
  return (
    <section className="concept-resonance" aria-label="Концепт Resonance Bloom">
      <div className="resonance-field" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <header className="resonance-header"><span>NO DEVICE DETECTED</span><b>ИСТОЧНИК СИГНАЛА: ЧЕЛОВЕЧЕСКОЕ СОЗНАНИЕ</b><span>РЕЗОНАНС 6</span></header>

      <main className="resonance-space">
        <div className="resonance-avatar" aria-hidden="true"><div><Fingerprint size={76} /></div><i /><i /><i /><span>ЖИВОЙ<br />АВАТАР</span></div>
        <div className="resonance-sprite sprite-one"><b>СПРАЙТ ДАННЫХ</b><span>слушает поток</span><i /></div>
        <div className="resonance-sprite sprite-two"><b>СПРАЙТ-МЫСЛЬ</b><span>задач осталось: 2</span><i /></div>
        <div className="resonance-sprite sprite-three"><b>СИГНАТУРА</b><span>уникальный след</span><i /></div>
        <div className="resonance-form form-one">СЛОЖНАЯ ФОРМА<br /><b>ЗАВЕСА</b></div>
        <div className="resonance-form form-two">ПОТОК ДАННЫХ<br /><b>НЕ ТРОГАТЬ</b></div>

        <section className="resonance-copy">
          <small>МАТРИЦА ДЛЯ ТЕХ, КОМУ НЕ НУЖНА ДЕКА</small>
          <h1>ТЫ НЕ<br />ПОДКЛЮЧЁН.<br /><em>ТЫ — СВЯЗЬ.</em></h1>
          <p>Техномант не запускает программы. Он вплетает намерение в Резонанс, зовёт спрайтов и оставляет в потоке собственную сигнатуру.</p>
        </section>

        <aside className="resonance-entry">
          <Waves size={30} /><p>Живой аватар распознал приглашение как знакомый образ.</p>
          <button type="button"><span>СОВПАДЕНИЕ МЫСЛИ</span><b>87%</b></button>
          <button type="button"><span>СИГНАТУРА РЕЗОНАНСА</span><b>НОВАЯ</b></button>
          <a href="/login">НЫРНУТЬ В ПОТОК</a>
          <small>ментальное истощение: 0</small>
        </aside>
      </main>
    </section>
  );
}

function SwarmConcept() {
  return (
    <section className="concept-swarm" aria-label="Концепт Swarmmind RCC">
      <header className="swarm-header"><div><Router size={18} /><b>RCC//SWARMMIND</b></div><span>4 ДРОНА ПОДЧИНЕНЫ</span><span>ШУМ: 3</span><strong>РИГ-ИНТЕРФЕЙС ГОТОВ</strong></header>
      <main className="swarm-grid">
        <article className="swarm-feed feed-a"><header>FLY-SPY_01 <b>REC</b></header><div><span>38M</span><i /><p>TACOMA<br />ROOFTOP</p></div><footer>optic 12x · silent</footer></article>
        <article className="swarm-feed feed-b"><header>ROTODRONE_02 <b>ARMED</b></header><div><Radar size={62} /><p>NO TARGET<br />LOCK</p></div><footer>alt 84m · ammo 120</footer></article>
        <article className="swarm-feed feed-c"><header>DOBERMAN_03 <b>HOLD</b></header><div><span>SECTOR<br />CLEAR</span><i /></div><footer>ground · armor 6</footer></article>
        <article className="swarm-feed feed-d"><header>ROADMASTER <b>JUMPED-IN</b></header><div><span>112</span><small>KM/H</small><p>AUTOPILOT<br />BYPASSED</p></div><footer>body 16 · handling 3</footer></article>

        <section className="swarm-core">
          <div className="swarm-radar" aria-hidden="true"><i /><i /><i /><CircleDot size={22} /><span>01</span><span>02</span><span>03</span><span>YOU</span></div>
          <p>ТЫ ЧУВСТВУЕШЬ КАЖДЫЙ МОТОР</p><h1>СТАНЬ<br /><em>РОЕМ.</em></h1>
          <div><b>01</b><span>наблюдает</span><b>02</b><span>прикрывает</span><b>03</b><span>держит вход</span></div>
        </section>

        <aside className="swarm-jack">
          <Activity size={24} /><h2>ПОЛНОЕ<br />ПОГРУЖЕНИЕ</h2><p>Один водитель. Одно устройство. Никакой дистанции между мыслью и машиной.</p>
          <dl><div><dt>СИГНАЛ</dt><dd>5</dd></div><div><dt>БИООТДАЧА</dt><dd>0</dd></div><div><dt>ЗАЩИТА</dt><dd>8</dd></div></dl>
          <label><span>ПОЗЫВНОЙ ПИЛОТА</span><input aria-label="Позывной риггера" placeholder="control_rig://" /></label>
          <a href="/login">ВПРЫГНУТЬ В УЗЕЛ</a><small>не выпрыгивай на скорости</small>
        </aside>
      </main>
      <footer className="swarm-footer"><span>КАЖДЫЙ ДРОН МОЖЕТ СТАТЬ ВХОДОМ</span><b>ВРАЖЕСКИЙ ДЕКЕР НЕ ОБНАРУЖЕН</b><span>RADIO ELECTRONIC WARFARE: STANDBY</span></footer>
    </section>
  );
}

function AstralConcept() {
  return (
    <section className="concept-astral" aria-label="Концепт Astral Negative">
      <div className="astral-wash" aria-hidden="true"><i /><i /><i /><i /></div>
      <header className="astral-header"><span>МАТЕРИАЛЬНЫЙ ПЛАН</span><i /><b>ВОСПРИЯТИЕ АСТРАЛА</b><i /><span>ЭМОЦИОНАЛЬНЫЙ ФОТОНЕГАТИВ</span></header>
      <main className="astral-scene">
        <div className="astral-body" aria-hidden="true"><span /><i /><i /><i /></div>
        <div className="astral-aura aura-calm"><b>СПОКОЙСТВИЕ</b><span>аура чистая</span></div>
        <div className="astral-aura aura-fear"><b>СТРАХ</b><span>свежий эмоциональный след</span></div>
        <div className="astral-aura aura-magic"><b>ПРОБУЖДЁННЫЙ</b><span>магическая природа</span></div>
        <div className="astral-signature"><span>АСТРАЛЬНАЯ ПОДПИСЬ</span><i /><b>оставлена 11 минут назад</b></div>

        <section className="astral-copy"><small>В АСТРАЛЕ НЕ ВИДНО ТЕКСТА. ЗАТО ВИДНО НАМЕРЕНИЕ.</small><h1>ПРОЧТИ<br />ТО, ЧТО<br /><em>ОСТАЛОСЬ.</em></h1><p>Живые ауры сияют. Мёртвые вещи становятся тенями. Заклинания, духи и сильные эмоции оставляют след, который умеющий смотреть может прочесть.</p></section>
        <aside className="astral-reading">
          <Eye size={27} /><h2>ЧТЕНИЕ АУРЫ</h2>
          <div><span>ОБЩЕЕ СОСТОЯНИЕ</span><b>ЖИВ / УСТАЛ</b></div><div><span>ЭМОЦИЯ</span><b>НАСТОРОЖЕН</b></div><div><span>МАГИЯ</span><b>?</b></div><div><span>КИБЕРИМПЛАНТЫ</span><b>СКРЫТЫ</b></div>
          <label><span>НАЗОВИ СВОЮ ТЕНЬ</span><input aria-label="Имя астральной тени" placeholder="имя не обязательно" /></label>
          <a href="/login">КОСНУТЬСЯ СИГНАТУРЫ</a>
        </aside>
      </main>
    </section>
  );
}

function LedgerConcept() {
  return (
    <section className="concept-ledger" aria-label="Концепт Fixer's Ledger">
      <div className="ledger-folder">
        <header><span>ЛИЧНОЕ ДЕЛО / НЕ ОЦИФРОВЫВАТЬ</span><b>MOTH//6 — ЧЁРНАЯ КНИГА</b><span>SEATTLE METROPLEX</span></header>
        <main className="ledger-spread">
          <section className="ledger-left">
            <p className="ledger-kicker">КАНДИДАТ В СЕТЬ // ЛИЧНОСТЬ НЕ ПОДТВЕРЖДЕНА</p>
            <div className="ledger-photo"><Fingerprint size={65} /><span>ФОТО<br />УНИЧТОЖЕНО</span><i /></div>
            <h1>КТО ЗА ТЕБЯ<br /><em>ПОРУЧИТСЯ?</em></h1>
            <p>В Тенях паспорт ничего не значит. Значит имя того, кто возьмёт трубку, когда ты исчезнешь с авансом мистера Джонсона.</p>
            <div className="ledger-contact"><b>MOTH//6</b><span>СВЯЗЬ 4</span><span>ЛОЯЛЬНОСТЬ 2</span><small>«Работает чисто. Обычно.»</small></div>
            <div className="ledger-contact"><b>NULL_SHAMAN</b><span>СВЯЗЬ 3</span><span>ЛОЯЛЬНОСТЬ 1</span><small>«Долг пока не просрочен.»</small></div>
          </section>

          <section className="ledger-right">
            <div className="ledger-stamp">НЕ<br />ПРОВЕРЕН</div>
            <header><span>РЕПУТАЦИОННЫЙ СЛЕД</span><small>собрано по слухам, долгам и выжившим свидетелям</small></header>
            <div className="ledger-reputation">
              <article><b>07</b><span>УВАЖЕНИЕ<br />УЛИЦ</span><i><strong style={{ width: "70%" }} /></i><small>законченные дела</small></article>
              <article className="bad"><b>02</b><span>ОГЛАСКА</span><i><strong style={{ width: "20%" }} /></i><small>плохие слухи</small></article>
              <article className="hot"><b>04</b><span>ОБЩЕСТВЕННАЯ<br />ОСВЕДОМЛЁННОСТЬ</span><i><strong style={{ width: "40%" }} /></i><small>кто тебя узнает</small></article>
            </div>
            <section className="ledger-notes"><p>✓ вернул аванс после отменённой работы</p><p>✓ вытащил раненого свидетеля</p><p>× спорил с Джонсоном при всей команде</p><p>? был замечен рядом с рейдом Knight Errant</p></section>
            <div className="ledger-signin">
              <label><span>ПОЗЫВНОЙ</span><input aria-label="Позывной в книге фиксера" placeholder="впиши от руки" /></label>
              <label><span>ИМЯ ПОРУЧИТЕЛЯ</span><input aria-label="Поручитель в книге фиксера" type="password" placeholder="будет проверено" /></label>
              <a href="/login">ОТДАТЬ ДЕЛО ФИКСЕРУ <ArrowRight size={15} /></a>
            </div>
          </section>
        </main>
        <footer><span>ЕСЛИ ЭТА ПАПКА ПОПАЛА К ТЕБЕ СЛУЧАЙНО — СЖЕЧЬ</span><b>15 / 73A</b></footer>
      </div>
    </section>
  );
}
