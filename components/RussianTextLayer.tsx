"use client";

import { useEffect } from "react";

const exact = new Map<string, string>([
  ["Campaign authority overview", "Обзор управления кампанией"],
  ["Every control below executes on the server and writes audit history. Player preview is read-only and never silently acts as the selected runner.", "Каждый элемент управления выполняется на сервере и записывается в журнал аудита. Предпросмотр игрока доступен только для чтения и никогда скрытно не действует от имени выбранного раннера."],
  ["Account, display and accessibility controls", "Управление аккаунтом, отображением и доступностью"],
  ["Credential changes are authoritative. Display preferences stay on this device; strong flicker is off by default and sound never autoplays.", "Изменения учётных данных авторитетны. Настройки отображения остаются на этом устройстве; сильное мерцание отключено по умолчанию, а звук никогда не запускается автоматически."],
  ["Change assigned passcode", "Сменить назначенный код доступа"],
  ["Readable host presentation", "Читаемое оформление хоста"],
  ["Control ambient presentation", "Управление визуальными эффектами"],
  ["Functionally equivalent", "Функционально равнозначно"],
  ["At least 12 characters.", "Не менее 12 символов."],
  ["Other host commands remain sealed until this handshake is complete.", "Остальные команды хоста заблокированы до завершения этого рукопожатия."],
  ["Create runner identity", "Создать личность раннера"],
  ["Provision a runner", "Зарегистрировать раннера"],
  ["Public registration remains disabled. The temporary passcode is hashed before storage and never appears in audit state.", "Публичная регистрация остаётся отключённой. Временный код хешируется до сохранения и никогда не появляется в журнале аудита."],
  ["Runner account directory", "Каталог аккаунтов раннеров"],
  ["Searchable campaign identities with server-owned role, economy, clearance and restriction state.", "Доступные для поиска личности кампании с серверным управлением ролями, экономикой, допуском и ограничениями."],
  ["Campaign values", "Показатели кампании"],
  ["Preview as player", "Предпросмотр от лица игрока"],
  ["Preview changes only the read context of this GM session. Mutating controls disappear and server actions are rejected.", "Предпросмотр меняет только контекст чтения текущей сессии Мастера. Элементы изменения скрываются, а серверные действия отклоняются."],
  ["Create black-market listing", "Создать лот чёрного рынка"],
  ["Publish a restricted listing", "Опубликовать ограниченный лот"],
  ["Price, stock and visibility rules become server authority. GM-only notes never enter player payloads.", "Цена, запас и правила видимости контролируются сервером. Заметки Мастера никогда не попадают в данные игрока."],
  ["Market catalogue control", "Управление рыночным каталогом"],
  ["Hide, reveal and inspect original fictional campaign listings without deleting their order history.", "Скрывайте, раскрывайте и проверяйте вымышленные лоты кампании, не удаляя историю заказов."],
  ["Fixers and authored market nodes", "Фиксеры и авторские рыночные узлы"],
  ["Create a distinct operator node before attaching products to it.", "Создайте отдельный узел оператора, прежде чем прикреплять к нему товары."],
  ["Create vendor", "Создать продавца"],
  ["Host directories and clearance gates", "Каталоги хостов и шлюзы допуска"],
  ["Create a node with an address, local theme, reputation floor and Matrix clearance floor.", "Создайте узел с адресом, локальной темой, минимальной репутацией и минимальным допуском Матрицы."],
  ["Provision Matrix directory", "Создать каталог Матрицы"],
  ["Publish as runner, NPC or system", "Публикация от раннера, NPC или системы"],
  ["Non-player identities must be chosen explicitly here. The source mode and acting GM are written to audit history.", "Неигровую личность нужно явно выбрать здесь. Режим источника и действующий Мастер записываются в журнал аудита."],
  ["Open a controlled thread", "Открыть контролируемую ветку"],
  ["Moderator window", "Окно модератора"],
  ["Immutable control history", "Неизменяемая история управления"],
  ["Sensitive actions record actor, target, summary, before and after state, timestamp and limited request metadata. Entries cannot be edited through the application.", "Чувствительные действия фиксируют исполнителя, цель, сводку, состояние до и после, время и ограниченные метаданные запроса. Записи нельзя изменить через приложение."],
  ["Nuyen ledger", "Реестр нуйен"],
  ["Every balance mutation has before/after values, reason and actor. Ledger rows are immutable campaign records.", "Каждое изменение баланса содержит значения до и после, причину и исполнителя. Строки реестра — неизменяемые записи кампании."],
  ["Order processing queue", "Очередь обработки заказов"],
  ["Approval delivers reserved items; rejection refunds nuyen and restores finite stock in one guarded batch.", "Одобрение доставляет зарезервированные предметы; отклонение возвращает нуйены и восстанавливает ограниченный запас одной защищённой транзакцией."],
  ["Runner inventory matrix", "Матрица инвентарей раннеров"],
  ["Character dossier index", "Каталог досье персонажей"],
  ["NPC message control", "Управление сообщениями NPC"],
  ["Campaign broadcast control", "Управление трансляциями кампании"],
  ["Campaign host configuration", "Настройка хоста кампании"],
  ["The database model and route are present; controls beyond the first vertical slice remain deliberately inactive.", "Модель базы данных и маршрут готовы; элементы вне первого вертикального среза намеренно остаются неактивными."],
  ["Order queue clear", "Очередь заказов пуста"],
  ["No vendor is waiting for a Game Master decision.", "Ни один продавец не ждёт решения Мастера игры."],
  ["Signal effects", "Эффекты сигнала"],
  ["Open a node", "Открыть узел"],
  ["Type a node name or command…", "Введите имя узла или команду…"],
  ["J / K navigates visible entries without replacing browser shortcuts.", "J / K перемещают по видимым записям, не заменяя сочетания клавиш браузера."],
  ["Flicker and sound are off by default. No essential information depends on these effects.", "Мерцание и звук отключены по умолчанию. Эти эффекты не передают важную информацию."],
  ["Sound is off", "Звук отключён"],
  ["Open navigation", "Открыть навигацию"],
  ["Close navigation", "Закрыть навигацию"],
  ["Display settings", "Настройки отображения"],
  ["Close", "Закрыть"],
  ["Original fictional item", "Оригинальный вымышленный предмет"],
  ["One compact catalogue line.", "Одна краткая строка каталога."],
  ["Never shown to the player.", "Никогда не показывается игроку."],
  ["Required audit explanation", "Обязательное объяснение для аудита"],
  ["Search alias, character or login", "Поиск по псевдониму, персонажу или логину"],
  ["Campaign identity", "Личность кампании"],
  ["JACKPOINT//LOCAL", "ДЖЕКПОЙНТ//ЛОКАЛЬНЫЙ"],
  ["SEATTLE SHADOWLAND", "ТЕНЕВЫЕ ЗЕМЛИ СИЭТЛА"],
  ["REDMOND RUMOR MILL", "СЛУХИ РЕДМОНДА"],
  ["FIXER EXCHANGE", "БИРЖА ФИКСЕРОВ"],
  ["MATRIX WATCH", "ДОЗОР МАТРИЦЫ"],
  ["TALISMONGER CIRCLE", "КРУГ ТАЛИСМАНЩИКОВ"],
  ["CORPORATE LEAKS", "КОРПОРАТИВНЫЕ УТЕЧКИ"],
  ["The common room: jobs, warnings and the etiquette of surviving Seattle.", "Общая комната: задания, предупреждения и этикет выживания в Сиэтле."],
  ["Street reports, gang boundaries and infrastructure failures.", "Уличные сводки, границы банд и аварии инфраструктуры."],
  ["Introductions and controlled opportunities for proven runners.", "Знакомства и контролируемые возможности для проверенных раннеров."],
  ["IC sightings, compromised certificates and hostile routes.", "Наблюдения за IC, скомпрометированные сертификаты и враждебные маршруты."],
  ["Astral weather, ritual provenance and spirit protocol.", "Астральная погода, происхождение ритуалов и протокол общения с духами."],
  ["Expensive truths behind a clean, hostile interface.", "Дорогая правда за чистым и враждебным интерфейсом."],
  ["SEATTLE GRID: maintenance window and false certificates", "СЕТКА СИЭТЛА: окно обслуживания и ложные сертификаты"],
  ["The rain near Touristville is whispering names", "Дождь возле Турист-вилля шепчет имена"],
  ["Quiet retrieval / Tacoma / no corporate marks", "Тихое изъятие / Такома / без корпоративных следов"],
  ["New IC signature: paper wasp swarm", "Новая сигнатура IC: рой бумажных ос"],
  ["Cataloguing displaced hearth spirits", "Каталогизация изгнанных домашних духов"],
  ["AEGIS protocol KESTREL has moved", "Протокол AEGIS «ПУСТЕЛЬГА» перемещён"],
  ["Reliable rotor shop south of the cut?", "Надёжная мастерская роторов к югу от канала?"],
  ["Barrens checkpoint moved overnight", "КПП в Пустошах перенесли за ночь"],
  ["Crew availability roll-call", "Перекличка доступности команды"],
  ["Dead zone singing on channel 9", "Мёртвая зона поёт на девятом канале"],
  ["Ward chalk batch comparisons", "Сравнение партий защитного мела"],
  ["After-action: glass elevator extraction", "После операции: эвакуация из стеклянного лифта"],
  ["The Empty Container", "Пустой контейнер"], ["Static in the Sanctuary", "Помехи в святилище"],
  ["Seven Minutes Late", "На семь минут позже"], ["Clinic Night Shift", "Ночная смена в клинике"],
  ["Paper Wasps", "Бумажные осы"], ["Cold Rail", "Холодный путь"], ["Borrowed Weather", "Одолженная погода"], ["The Honest Badge", "Честный значок"],
  ["Recover an unmanifested container before dawn.", "Вернуть незадекларированный контейнер до рассвета."],
  ["Find the source of hostile signal noise inside a protected shrine.", "Найти источник враждебного сигнального шума внутри защищённого святилища."],
  ["Extract a compliance archive before its scheduled deletion.", "Извлечь архив соответствия до запланированного удаления."],
  ["Keep a street clinic open through a gang evacuation.", "Удержать уличную клинику открытой во время эвакуации банды."],
  ["Map and contain a new distributed IC pattern.", "Нанести на карту и локализовать новую распределённую структуру IC."],
  ["Escort a sealed carriage through abandoned switching yards.", "Сопроводить запечатанный вагон через заброшенные сортировочные пути."],
  ["Return ritual condensate before the storm closes.", "Вернуть ритуальный конденсат до окончания шторма."],
  ["Identify who is selling real access under fake authority.", "Выяснить, кто продаёт настоящий доступ под видом поддельных полномочий."],
  ["Ghostline Signal Tap", "Перехватчик сигнала «Призрачная линия»"], ["Aresdown Folding Carbine", "Складной карабин «Аресдаун»"],
  ["Rain-Shell Lined Coat", "Плащ с подкладкой «Дождевик»"], ["Caseless Match Load", "Безгильзовый матчевый боекомплект"],
  ["Trace Scrubber Suite", "Комплекс очистки следов"], ["Needle-Eye Scout Drone", "Разведдрон «Игольное око»"],
  ["Blackout Field Jammer", "Полевой глушитель «Блэкаут»"], ["Thirty-Day Mirror SIN", "Зеркальный SIN на тридцать дней"],
  ["Cross-Grid Dead Drop", "Межсетевой тайник"], ["Municipal Tunnel Delta", "Изменения муниципальных тоннелей"],
  ["Courier Foldbike", "Складной курьерский байк"], ["Sealed Corporate Crate", "Запечатанный корпоративный ящик"],
  ["Synaptic Reflex Tune", "Настройка синаптических рефлексов"], ["Low-Light Ocular Suite", "Глазной комплекс слабого освещения"],
  ["Street Trauma Kit", "Уличный травматологический набор"], ["Dermal Patch Set", "Комплект дермальных пластин"],
  ["No-Questions Cleanup", "Зачистка без вопросов"], ["Portable Auto-Doc Cradle", "Переносная платформа авто-дока"],
  ["Ember-Thread Focus", "Фокус «Угольная нить»"], ["Rain-Caught Reagents", "Реагенты дождевого сбора"],
  ["Displaced Spirit Ledger", "Реестр перемещённых духов"], ["Ochre Ward Chalk", "Охристый защитный мел"],
  ["Mnemonic Bone Charm", "Костяной амулет памяти"], ["Astral Site Consultation", "Консультация по астральному объекту"],
  ["Whisperlink Commlink", "Коммлинк «Шёпот»"], ["Bishop-6 Cyberdeck", "Кибердека «Слон-6»"],
  ["Room Bug Sweeper", "Комнатный сканер жучков"], ["Coagulant Medgel", "Коагулянтный медгель"],
  ["Moonwell Condensate", "Конденсат Лунного колодца"], ["Freight Route Cipher", "Шифр грузового маршрута"],
  ["A palm-sized relay shim for a fictional Matrix run.", "Ретранслятор размером с ладонь для вымышленного забега по Матрице."],
  ["Compact runner carbine with a rebuilt smart interface.", "Компактный карабин раннера с восстановленным смарт-интерфейсом."],
  ["Street armor disguised as a weather-beaten commuter coat.", "Уличная броня под видом потрёпанного плаща пассажира."],
  ["Defensive deck utility that burns its route history.", "Защитная утилита деки, стирающая историю маршрутов."],
  ["Quiet inspection drone for ducts and dead zones.", "Тихий инспекционный дрон для воздуховодов и мёртвых зон."],
  ["Briefcase relay that turns a room into signal weather.", "Ретранслятор в кейсе, превращающий комнату в сигнальный шторм."],
  ["Time-limited fictional identity package with shallow history.", "Ограниченный по времени пакет вымышленной личности с неглубокой историей."],
  ["One sealed delivery across two controlled districts.", "Одна запечатанная доставка через два контролируемых района."],
  ["Recent changes to utility tunnels beneath south Seattle.", "Свежие изменения коммунальных тоннелей под южным Сиэтлом."],
  ["Compact electric bike with replaceable identity plates.", "Компактный электробайк со сменными идентификационными табличками."],
  ["Unmanifested crate. Contents disclosed after approval.", "Незадекларированный ящик. Содержимое раскрывается после одобрения."],
  ["Clinic appointment for calibrated response enhancement.", "Приём в клинике для калиброванного усиления реакции."],
  ["Rugged low-light optics with a clean diagnostic history.", "Надёжная оптика слабого освещения с чистой историей диагностики."],
  ["Sealed field kit marked for trained campaign characters.", "Запечатанный полевой набор для обученных персонажей кампании."],
  ["Subtle protective implant package.", "Незаметный комплект защитных имплантов."],
  ["After-action clinic slot and forensic scrub.", "Место в клинике после операции и криминалистическая зачистка."],
  ["Bulky diagnostic cradle for a runner safehouse.", "Громоздкая диагностическая платформа для убежища раннеров."],
  ["Hand-knotted focus carrying a patient heat signature.", "Связанный вручную фокус со спокойной тепловой сигнатурой."],
  ["Ritual reagents gathered during a severe electrical storm.", "Ритуальные реагенты, собранные во время сильной грозы."],
  ["Private index of recent astral displacement events.", "Частный указатель недавних событий астрального смещения."],
  ["Twelve sticks of prepared ritual chalk.", "Двенадцать брусков подготовленного ритуального мела."],
  ["A small charm associated with stable recall.", "Небольшой амулет, связанный с устойчивой памятью."],
  ["Remote reading followed by one supervised visit.", "Дистанционное чтение и один визит под наблюдением."],
  ["Low-profile commlink rebuilt for quiet team traffic.", "Незаметный коммлинк, переделанный для тихого командного трафика."],
  ["Older deck with excellent thermals and suspiciously new ports.", "Старая дека с отличным охлаждением и подозрительно новыми портами."],
  ["Broad-spectrum survey kit in a battered tool roll.", "Широкополосный поисковый набор в потрёпанном свёртке инструментов."],
  ["Compact emergency gel packets for campaign use.", "Компактные пакеты экстренного геля для кампании."],
  ["Two sealed vials with faint violet interference.", "Две запечатанные ампулы со слабым фиолетовым свечением."],
  ["A week of fictional freight-routing credentials.", "Неделя вымышленных учётных данных для грузовых маршрутов."],
]);

const tokens = new Map<string, string>([
  ["ACTIVE", "АКТИВНО"], ["INACTIVE", "НЕАКТИВНО"], ["DISABLED", "ОТКЛЮЧЕНО"], ["OFFLINE", "НЕ В СЕТИ"],
  ["VISIBLE", "ВИДИМО"], ["HIDDEN", "СКРЫТО"], ["OPEN", "ОТКРЫТО"], ["BLOCKED", "ЗАБЛОКИРОВАНО"], ["OK", "ДОСТУПНО"],
  ["PENDING", "ОЖИДАЕТ"], ["AWAITING GM", "ОЖИДАЕТ МАСТЕРА"], ["APPROVED", "ОДОБРЕНО"], ["REJECTED", "ОТКЛОНЕНО"], ["DELIVERED", "ДОСТАВЛЕНО"],
  ["AVAILABLE", "ДОСТУПНО"], ["CLASSIFIED", "ЗАСЕКРЕЧЕНО"], ["NEGOTIATION", "ПЕРЕГОВОРЫ"], ["ASSIGNED", "НАЗНАЧЕНО"], ["COMPLETED", "ЗАВЕРШЕНО"], ["RUMORED", "СЛУХ"],
  ["COMMON", "ОБЫЧНОЕ"], ["UNCOMMON", "НЕОБЫЧНОЕ"], ["SCARCE", "ДЕФИЦИТНОЕ"], ["RARE", "РЕДКОЕ"], ["MILITARY", "ВОЕННОЕ"], ["EXPERIMENTAL", "ЭКСПЕРИМЕНТАЛЬНОЕ"], ["UNIQUE", "УНИКАЛЬНОЕ"],
  ["LEGAL", "ЛЕГАЛЬНО"], ["LICENSE REQUIRED", "ТРЕБУЕТСЯ ЛИЦЕНЗИЯ"], ["RESTRICTED", "ОГРАНИЧЕНО"], ["FORBIDDEN", "ЗАПРЕЩЕНО"], ["CORPORATE CONTROLLED", "КОРПОРАТИВНЫЙ КОНТРОЛЬ"], ["UNKNOWN", "НЕИЗВЕСТНО"],
  ["HUMAN", "ЧЕЛОВЕК"], ["ELF", "ЭЛЬФ"], ["DWARF", "ДВОРФ"], ["ORK", "ОРК"], ["TROLL", "ТРОЛЛЬ"],
  ["PLAYER", "ИГРОК"], ["GAME_MASTER", "МАСТЕР ИГРЫ"], ["SYSTEM", "СИСТЕМА"], ["ANONYMOUS", "АНОНИМ"],
  ["WEAPONS", "ОРУЖИЕ"], ["ARMOR", "БРОНЯ"], ["AMMUNITION", "БОЕПРИПАСЫ"], ["CYBERWARE", "КИБЕРИМПЛАНТЫ"], ["BIOWARE", "БИОИМПЛАНТЫ"],
  ["COMMLINKS", "КОММЛИНКИ"], ["CYBERDECKS", "КИБЕРДЕКИ"], ["PROGRAMS", "ПРОГРАММЫ"], ["ELECTRONICS", "ЭЛЕКТРОНИКА"], ["DRONES", "ДРОНЫ"],
  ["VEHICLES", "ТРАНСПОРТ"], ["MAGICAL GOODS", "МАГИЧЕСКИЕ ТОВАРЫ"], ["FOCI", "ФОКУСЫ"], ["REAGENTS", "РЕАГЕНТЫ"], ["MEDICAL", "МЕДИЦИНА"],
  ["IDENTITIES", "ЛИЧНОСТИ"], ["SERVICES", "УСЛУГИ"], ["INFORMATION", "ИНФОРМАЦИЯ"], ["CONTRABAND", "КОНТРАБАНДА"],
  ["STREET SAMURAI", "УЛИЧНЫЙ САМУРАЙ"], ["DECKER", "ДЕКЕР"], ["RIGGER", "РИГГЕР"], ["MAGE", "МАГ"], ["SHAMAN", "ШАМАН"],
  ["TECHNOMANCER", "ТЕХНОМАНТ"], ["FACE", "ФЕЙС"], ["ADEPT", "АДЕПТ"], ["INFILTRATOR", "ИНФИЛЬТРАТОР"], ["MERCENARY", "НАЁМНИК"],
]);

function translate(value: string): string {
  const trimmed = value.trim();
  const direct = exact.get(trimmed) ?? tokens.get(trimmed);
  if (direct) return value.replace(trimmed, direct);
  let translated = value;
  const replacements: Array<[RegExp, string]> = [
    [/\bCLEARANCE\b/gu, "ДОПУСК"], [/\bFACTION\b/gu, "ФРАКЦИЯ"], [/\bREPUTATION\b/gu, "РЕПУТАЦИЯ"],
    [/\bBALANCE\b/gu, "БАЛАНС"], [/\bSTATUS\b/gu, "СТАТУС"], [/\bRUNNER\b/gu, "РАННЕР"], [/\bCHARACTER\b/gu, "ПЕРСОНАЖ"],
    [/\bVENDOR\b/gu, "ПРОДАВЕЦ"], [/\bPRODUCT\b/gu, "ТОВАР"], [/\bORDER\b/gu, "ЗАКАЗ"], [/\bMESSAGE\b/gu, "СООБЩЕНИЕ"],
    [/\bHOST\b/gu, "ХОСТ"], [/\bSOURCE\b/gu, "ИСТОЧНИК"], [/\bTIME\b/gu, "ВРЕМЯ"], [/\bSTATE\b/gu, "СОСТОЯНИЕ"],
    [/\bTYPE\b/gu, "ТИП"], [/\bAMOUNT\b/gu, "СУММА"], [/\bBEFORE\b/gu, "ДО"], [/\bAFTER\b/gu, "ПОСЛЕ"], [/\bREASON\b/gu, "ПРИЧИНА"],
    [/\bCREATE\b/gu, "СОЗДАТЬ"], [/\bADD\b/gu, "ДОБАВИТЬ"], [/\bADJUST\b/gu, "ИЗМЕНИТЬ"], [/\bREVIEW\b/gu, "ПРОВЕРИТЬ"],
    [/\bAPPROVE\b/gu, "ОДОБРИТЬ"], [/\bREJECT\b/gu, "ОТКЛОНИТЬ"], [/\bPUBLISH\b/gu, "ОПУБЛИКОВАТЬ"], [/\bHIDE\b/gu, "СКРЫТЬ"], [/\bREVEAL\b/gu, "РАСКРЫТЬ"],
    [/\bSETTINGS\b/gu, "НАСТРОЙКИ"], [/\bCOMMANDS\b/gu, "КОМАНДЫ"], [/\bNAVIGATE\b/gu, "НАВИГАЦИЯ"], [/\bDISCONNECT\b/gu, "ОТКЛЮЧИТЬСЯ"],
    [/\bSCANLINES\b/gu, "СКАН-ЛИНИИ"], [/\bNOISE\b/gu, "ШУМ"], [/\bFLICKER\b/gu, "МЕРЦАНИЕ"], [/\bSOUND\b/gu, "ЗВУК"],
  ];
  for (const [pattern, replacement] of replacements) translated = translated.replace(pattern, replacement);
  return translated;
}

function translateElement(root: unknown): void {
  const localRoot = root as Node & { querySelectorAll: (selectors: string) => NodeListOf<HTMLElement> };
  const walker = document.createTreeWalker(localRoot, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    if (node.parentElement?.closest("script,style,pre,code")) continue;
    const next = translate(node.nodeValue ?? "");
    if (next !== node.nodeValue) node.nodeValue = next;
  }
  for (const element of Array.from(localRoot.querySelectorAll("[placeholder],[title],[aria-label]"))) {
    for (const attribute of ["placeholder", "title", "aria-label"]) {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, translate(value));
    }
  }
}

export function RussianTextLayer() {
  useEffect(() => {
    translateElement(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData" && record.target.nodeType === Node.TEXT_NODE) {
          const node = record.target as Text;
          const next = translate(node.nodeValue ?? "");
          if (next !== node.nodeValue) node.nodeValue = next;
        }
        for (const added of Array.from(record.addedNodes)) if (added.nodeType === Node.ELEMENT_NODE) translateElement(added as Element);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
