import { hashPassword } from "../lib/security";

type SeedUser = {
  id: string;
  login: string;
  alias: string;
  role: string;
  character?: string;
  metatype?: string;
  archetype?: string;
  faction?: string;
  clearance?: string;
  reputation?: number;
  nuyen?: number;
};

const clearanceRows = [
  ["clearance-guest", "GUEST", "Guest", 0, "#7f8b7f"],
  ["clearance-bronze", "BRONZE", "Bronze", 1, "#b47a48"],
  ["clearance-silver", "SILVER", "Silver", 2, "#b7c0b7"],
  ["clearance-gold", "GOLD", "Gold", 3, "#e0b64b"],
  ["clearance-black", "BLACK", "Black", 4, "#d65b52"],
  ["clearance-root", "ROOT", "Root", 5, "#8ed8c8"],
] as const;

const roleRows = [
  ["role-gm", "GAME_MASTER", "Game Master", 1],
  ["role-assistant", "ASSISTANT_GM", "Assistant Game Master", 1],
  ["role-moderator", "MODERATOR", "Moderator", 1],
  ["role-player", "PLAYER", "Player", 1],
] as const;

const permissionRows = [
  ["perm-players", "manage_players", "Manage players", "Create, edit, suspend and reset runner accounts."],
  ["perm-products", "manage_products", "Manage products", "Create and control black-market listings."],
  ["perm-economy", "manage_economy", "Manage economy", "Adjust balances, issue refunds and inspect the ledger."],
  ["perm-forum", "manage_forum", "Manage forum", "Create hosts, moderate posts and publish NPC threads."],
  ["perm-jobs", "manage_jobs", "Manage jobs", "Create, reveal, assign and settle contracts."],
  ["perm-orders", "manage_orders", "Manage orders", "Approve, reject and route fictional orders."],
  ["perm-messages", "send_npc_messages", "Send NPC messages", "Send clearly attributed and audited NPC messages."],
  ["perm-announcements", "manage_announcements", "Manage announcements", "Publish targeted campaign announcements."],
  ["perm-audit", "view_audit", "View audit", "Read immutable campaign-control history."],
  ["perm-settings", "manage_settings", "Manage settings", "Change campaign time and host configuration."],
] as const;

const factionRows = [
  ["faction-free-nodes", "REDMOND FREE NODES", "redmond-free-nodes", "Mutual-aid deckers keeping neighborhood relays alive.", "#7bcf87"],
  ["faction-aegis", "AEGIS CORPORATE SECURITY", "aegis-corporate-security", "A deniable corporate risk office with immaculate paperwork.", "#71a5d8"],
  ["faction-hollow", "THE HOLLOW CIRCUIT", "the-hollow-circuit", "Technomancer couriers who treat dead zones as sacred ground.", "#9a7ad6"],
  ["faction-talismongers", "RAIN CITY TALISMONGERS", "rain-city-talismongers", "Independent magical brokers protecting old Seattle pacts.", "#c69a56"],
] as const;

const users: SeedUser[] = [
  { id: "user-gm", login: "architect", alias: "BLACKROOT", role: "role-gm" },
  { id: "user-agm", login: "oracle", alias: "GLASS_ORACLE", role: "role-assistant" },
  { id: "user-null", login: "null_shaman", alias: "NULL_SHAMAN", role: "role-player", character: "Eira Dusk", metatype: "Elf", archetype: "SHAMAN", faction: "faction-talismongers", clearance: "clearance-gold", reputation: 8, nuyen: 42000 },
  { id: "user-hex", login: "hexsaint", alias: "HEXSAINT", role: "role-player", character: "Milo Venn", metatype: "Human", archetype: "DECKER", faction: "faction-free-nodes", clearance: "clearance-silver", reputation: 5, nuyen: 26800 },
  { id: "user-grim", login: "grimwire", alias: "GRIMWIRE", role: "role-player", character: "Kara Volkov", metatype: "Ork", archetype: "RIGGER", faction: "faction-free-nodes", clearance: "clearance-bronze", reputation: 3, nuyen: 19400 },
  { id: "user-red", login: "red_widow", alias: "RED_WIDOW", role: "role-player", character: "Imani Cross", metatype: "Human", archetype: "FACE", faction: "faction-aegis", clearance: "clearance-black", reputation: 11, nuyen: 57300 },
  { id: "user-static", login: "static_jackal", alias: "STATIC_JACKAL", role: "role-player", character: "Bram Kessler", metatype: "Dwarf", archetype: "STREET SAMURAI", faction: "faction-hollow", clearance: "clearance-bronze", reputation: 1, nuyen: 12600 },
  { id: "user-moth", login: "neon_moth", alias: "NEON_MOTH", role: "role-player", character: "Sable-9", metatype: "Troll", archetype: "TECHNOMANCER", faction: "faction-hollow", clearance: "clearance-silver", reputation: 6, nuyen: 31100 },
];

const contactRows = [
  ["contact-vela", "Irena Voss", "VELA", "FIXER", "A former port scheduler who can move a crate through three jurisdictions without letting it exist on paper.", "faction-free-nodes", "Tacoma docks", 4, 5, 3, 2, "Dead-drop routing, introductions, clean transport", "vela//relay.44"],
  ["contact-marrow", "Dr. Ansel Rook", "MARROW", "STREET DOC", "Methodical, discreet, and offended by sloppy chrome installation.", null, "Puyallup clinic", 3, 4, 2, 1, "Cyberware installation, trauma care, bioware consultation", "morrow//sterile-line"],
  ["contact-ash", "Tamsin Grey", "ASH_SISTER", "TALISMONGER", "An urban animist cataloguing spirits displaced by redevelopment.", "faction-talismongers", "Snohomish", 4, 4, 4, 2, "Foci, reagents, astral consultation", "ash//violet-circle"],
  ["contact-wraith", "Cato Muir", "WRAITH", "SMUGGLER", "A patient logistics broker with too many sealed railway maps.", null, "Kent freight yards", 2, 5, 5, 2, "Contraband transport, vehicle papers, dead drops", "wraith//cold-route"],
  ["contact-kepler", "Unknown", "KEPLER_7", "CORPORATE CONTACT", "A voice from inside a corporate compliance archive. Their messages always arrive exactly seven minutes late.", "faction-aegis", "Bellevue", 1, 6, 8, 4, "Internal records, security schedules, access badges", "corp-relay//k7"],
  ["contact-latch", "Rin Soto", "LATCHKEY", "DECKER", "Runs emergency patches and rumor verification from a laundromat host.", "faction-free-nodes", "Redmond", 3, 3, 0, 1, "Matrix overwatch, program tuning, signal tracing", "latch//spin-cycle"],
] as const;

const vendorRows = [
  ["vendor-chrome", "contact-vela", "CHROME CATHEDRAL", "chrome-cathedral", "FIXER", "Layered armor, careful gunsmithing and tools for runners who pay on time.", "SG://SEA.44/CHROME", "STREET"],
  ["vendor-wraith", "contact-wraith", "WRAITH LOGISTICS", "wraith-logistics", "SMUGGLER", "A timetable-shaped catalogue of objects that are currently somewhere else.", "SG://FREIGHT.NULL/WRAITH", "LOW_BANDWIDTH"],
  ["vendor-morrow", "contact-marrow", "MORROW STREET CLINIC", "morrow-street-clinic", "STREET DOC", "Sterile surfaces, blunt consent forms and no questions that are not medically relevant.", "SG://PUY.17/MORROW", "CORPORATE"],
  ["vendor-ashen", "contact-ash", "ASHEN MARKET", "ashen-market", "TALISMONGER", "A hand-indexed archive where every listing carries an astral provenance note.", "SG://ASTRAL.9/ASHEN", "SHAMANIC"],
] as const;

const categoryNames = [
  "WEAPONS", "ARMOR", "AMMUNITION", "CYBERWARE", "BIOWARE", "COMMLINKS", "CYBERDECKS", "PROGRAMS", "ELECTRONICS", "DRONES", "VEHICLES", "MAGICAL GOODS", "FOCI", "REAGENTS", "MEDICAL", "IDENTITIES", "SERVICES", "INFORMATION", "CONTRABAND",
];

type ProductSeed = [string, string, string, string, string, string, string, number, number, string, string, number, number, string | null, number];
const productRows: ProductSeed[] = [
  ["prod-ghostline", "CC-GLT-044", "Ghostline Signal Tap", "PROGRAMS", "vendor-chrome", "A palm-sized relay shim for a fictional Matrix run.", "Its scarred ceramic shell carries three owner marks. Vela guarantees the firmware was rewritten locally; she does not guarantee what listens back.", 7400, 3, "EXPERIMENTAL", "FORBIDDEN", 4, 2, null, 0],
  ["prod-aresdown", "CC-AR-119", "Aresdown Folding Carbine", "WEAPONS", "vendor-chrome", "Compact runner carbine with a rebuilt smart interface.", "A fictional campaign weapon assembled from mismatched corporate lots and tuned by an independent gunsmith.", 12800, 2, "MILITARY", "RESTRICTED", 7, 3, null, 1],
  ["prod-rainshell", "CC-RS-008", "Rain-Shell Lined Coat", "ARMOR", "vendor-chrome", "Street armor disguised as a weather-beaten commuter coat.", "Flexible ceramic inserts and a hidden comms pocket. The old transit patch is intentionally left in place.", 3100, 8, "UNCOMMON", "LICENSE REQUIRED", 0, 1, null, 0],
  ["prod-caseless", "CC-CM-220", "Caseless Match Load", "AMMUNITION", "vendor-chrome", "Sealed packet of precision fictional ammunition.", "Lot numbers have been acid-etched away. Sold in campaign-scale bundles rather than real-world specifications.", 480, 24, "SCARCE", "RESTRICTED", 2, 1, null, 0],
  ["prod-scrubber", "CC-SCR-52", "Trace Scrubber Suite", "PROGRAMS", "vendor-chrome", "Defensive deck utility that burns its route history.", "A fictional Matrix program with loud diagnostics and a habit of naming every process after extinct birds.", 5900, 5, "RARE", "CORPORATE CONTROLLED", 5, 2, "faction-free-nodes", 0],
  ["prod-microdrone", "CC-MD-12", "Needle-Eye Scout Drone", "DRONES", "vendor-chrome", "Quiet inspection drone for ducts and dead zones.", "Rebuilt rotors, low-light optics and a deliberately limited onboard personality.", 8800, 4, "RARE", "LICENSE REQUIRED", 3, 2, null, 0],
  ["prod-jammer", "WL-BLK-09", "Blackout Field Jammer", "ELECTRONICS", "vendor-wraith", "Briefcase relay that turns a room into signal weather.", "Wraith ships it in a municipal survey case. Use is purely a fictional campaign action.", 9600, 2, "MILITARY", "FORBIDDEN", 6, 3, null, 1],
  ["prod-clean-sin", "WL-SIN-31", "Thirty-Day Mirror SIN", "IDENTITIES", "vendor-wraith", "Time-limited fictional identity package with shallow history.", "Includes a coherent employment trail, rent records and exactly one embarrassing hobby subscription.", 14500, 3, "RARE", "FORBIDDEN", 8, 3, null, 1],
  ["prod-deaddrop", "WL-DD-7", "Cross-Grid Dead Drop", "SERVICES", "vendor-wraith", "One sealed delivery across two controlled districts.", "Wraith chooses the route and the clock. Buyers receive a phrase, a locker glyph and no refund for lateness.", 2600, 99, "UNCOMMON", "UNKNOWN", 1, 1, null, 0],
  ["prod-citymap", "WL-MAP-2", "Municipal Tunnel Delta", "INFORMATION", "vendor-wraith", "Recent changes to utility tunnels beneath south Seattle.", "Annotated with flooded sections, spirit sightings and corporate inspection schedules.", 1800, 7, "SCARCE", "CORPORATE CONTROLLED", 2, 1, null, 0],
  ["prod-foldbike", "WL-FB-66", "Courier Foldbike", "VEHICLES", "vendor-wraith", "Compact electric bike with replaceable identity plates.", "Quiet enough for service corridors and ugly enough to be ignored at a loading dock.", 11200, 2, "RARE", "LICENSE REQUIRED", 4, 2, null, 0],
  ["prod-sealedcrate", "WL-SC-0", "Sealed Corporate Crate", "CONTRABAND", "vendor-wraith", "Unmanifested crate. Contents disclosed after approval.", "The only exterior mark is a violet quarantine stripe that does not belong to any known port authority.", 23000, 1, "UNIQUE", "UNKNOWN", 10, 4, "faction-hollow", 1],
  ["prod-reflex", "MS-RX-3", "Synaptic Reflex Tune", "BIOWARE", "vendor-morrow", "Clinic appointment for calibrated response enhancement.", "Includes screening, implantation and two follow-ups in a fictional tabletop context.", 18000, 2, "RARE", "RESTRICTED", 6, 3, null, 1],
  ["prod-ocular", "MS-OC-11", "Low-Light Ocular Suite", "CYBERWARE", "vendor-morrow", "Rugged low-light optics with a clean diagnostic history.", "Morrow stripped the corporate telemetry and retained the useful self-test routines.", 9200, 4, "SCARCE", "LICENSE REQUIRED", 3, 2, null, 1],
  ["prod-trauma", "MS-TK-4", "Street Trauma Kit", "MEDICAL", "vendor-morrow", "Sealed field kit marked for trained campaign characters.", "Color-coded supplies, a blunt printed checklist and a slot for the owner's emergency contact.", 1250, 12, "COMMON", "LEGAL", 0, 0, null, 0],
  ["prod-dermal", "MS-DP-8", "Dermal Patch Set", "CYBERWARE", "vendor-morrow", "Subtle protective implant package.", "Designed for clients who need protection without advertising a chrome budget.", 13700, 2, "RARE", "RESTRICTED", 7, 3, null, 1],
  ["prod-cleanup", "MS-CL-1", "No-Questions Cleanup", "SERVICES", "vendor-morrow", "After-action clinic slot and forensic scrub.", "The service covers treatment, clothing disposal and a believable waiting-room timestamp.", 4200, 6, "SCARCE", "UNKNOWN", 2, 1, null, 0],
  ["prod-autodoc", "MS-AD-9", "Portable Auto-Doc Cradle", "MEDICAL", "vendor-morrow", "Bulky diagnostic cradle for a runner safehouse.", "Its voice interface is disabled; Morrow says this is a feature, not missing hardware.", 22600, 1, "MILITARY", "CORPORATE CONTROLLED", 9, 4, null, 1],
  ["prod-emberfocus", "AM-EF-3", "Ember-Thread Focus", "FOCI", "vendor-ashen", "Hand-knotted focus carrying a patient heat signature.", "Ash Sister records three verified custodians and one spirit that declined to identify itself.", 8900, 2, "RARE", "RESTRICTED", 5, 2, "faction-talismongers", 1],
  ["prod-rainreagents", "AM-RR-20", "Rain-Caught Reagents", "REAGENTS", "vendor-ashen", "Ritual reagents gathered during a severe electrical storm.", "Each packet is dated, warded and accompanied by a terse note about local conditions.", 1400, 14, "UNCOMMON", "LEGAL", 0, 1, null, 0],
  ["prod-spiritledger", "AM-SL-1", "Displaced Spirit Ledger", "INFORMATION", "vendor-ashen", "Private index of recent astral displacement events.", "A hand-built concordance tying construction sites, weather anomalies and witness accounts together.", 5200, 3, "UNIQUE", "UNKNOWN", 6, 3, "faction-talismongers", 0],
  ["prod-wardchalk", "AM-WC-12", "Ochre Ward Chalk", "MAGICAL GOODS", "vendor-ashen", "Twelve sticks of prepared ritual chalk.", "Marked for tabletop ritual use; each stick has a different mineral texture and astral resonance.", 680, 20, "COMMON", "LEGAL", 0, 0, null, 0],
  ["prod-memorycharm", "AM-MC-8", "Mnemonic Bone Charm", "FOCI", "vendor-ashen", "A small charm associated with stable recall.", "The seller insists it was ethically sourced from a synthetic medical substrate.", 6100, 3, "SCARCE", "LICENSE REQUIRED", 4, 2, null, 1],
  ["prod-astralconsult", "AM-AC-5", "Astral Site Consultation", "SERVICES", "vendor-ashen", "Remote reading followed by one supervised visit.", "Ash Sister delivers a threat sketch, spirit etiquette notes and a list of questions nobody answered.", 3600, 8, "UNCOMMON", "LEGAL", 2, 1, null, 0],
  ["prod-whisperlink", "CC-WL-77", "Whisperlink Commlink", "COMMLINKS", "vendor-chrome", "Low-profile commlink rebuilt for quiet team traffic.", "No fashionable shell, no subscription hooks and no cheerful setup assistant.", 2700, 10, "UNCOMMON", "LEGAL", 0, 1, null, 0],
  ["prod-bishopdeck", "CC-BD-6", "Bishop-6 Cyberdeck", "CYBERDECKS", "vendor-chrome", "Older deck with excellent thermals and suspiciously new ports.", "The boot screen contains a hand-drawn bishop and a warning about borrowed credentials.", 31500, 1, "EXPERIMENTAL", "RESTRICTED", 10, 4, "faction-free-nodes", 1],
  ["prod-bugsweeper", "WL-BS-4", "Room Bug Sweeper", "ELECTRONICS", "vendor-wraith", "Broad-spectrum survey kit in a battered tool roll.", "Reports confidence as weather symbols because its last owner disliked percentages.", 3900, 6, "UNCOMMON", "LEGAL", 1, 1, null, 0],
  ["prod-medgel", "MS-MG-40", "Coagulant Medgel", "MEDICAL", "vendor-morrow", "Compact emergency gel packets for campaign use.", "Stored in numbered sleeves with tactile labels for low-light retrieval.", 320, 30, "COMMON", "LEGAL", 0, 0, null, 0],
  ["prod-moonwater", "AM-MW-2", "Moonwell Condensate", "REAGENTS", "vendor-ashen", "Two sealed vials with faint violet interference.", "Collected from a rooftop shrine before demolition and verified against the Ashen Market ledger.", 2100, 5, "SCARCE", "RESTRICTED", 3, 2, null, 0],
  ["prod-routekey", "WL-RK-13", "Freight Route Cipher", "INFORMATION", "vendor-wraith", "A week of fictional freight-routing credentials.", "Useful only inside the campaign's Seattle grid and invalidated after first confirmed exposure.", 7600, 2, "RARE", "CORPORATE CONTROLLED", 6, 3, null, 1],
];

const hostRows = [
  ["host-jackpoint", "JACKPOINT//LOCAL", "jackpoint-local", "The common room: jobs, warnings and the etiquette of surviving Seattle.", "SG://SEA.00/JACKPOINT", "#", "SEATTLE_GRID", "VELA", 0, 0, 0],
  ["host-redmond", "REDMOND RUMOR MILL", "redmond-rumor-mill", "Street reports, gang boundaries and infrastructure failures.", "SG://RED.13/RUMOR", "%", "REDMOND_BBS", "LATCHKEY", 1, 0, 0],
  ["host-fixer", "FIXER EXCHANGE", "fixer-exchange", "Introductions and controlled opportunities for proven runners.", "SG://SEA.44/FIXER", "+", "AMBER_TERMINAL", "VELA", 2, 3, 2],
  ["host-matrix", "MATRIX WATCH", "matrix-watch", "IC sightings, compromised certificates and hostile routes.", "SG://NULL.8/WATCH", "!", "GREEN_PHOSPHOR", "THE HOLLOW CIRCUIT", 3, 2, 2],
  ["host-talis", "TALISMONGER CIRCLE", "talismonger-circle", "Astral weather, ritual provenance and spirit protocol.", "SG://ASTRAL.9/CIRCLE", "*", "SHAMANIC_NODE", "ASH_SISTER", 4, 1, 2],
  ["host-leaks", "CORPORATE LEAKS", "corporate-leaks", "Expensive truths behind a clean, hostile interface.", "SG://CORP.7/LEAKS", "^", "CORPORATE_HOST", "UNKNOWN SOURCE", 5, 8, 4],
] as const;

const threadRows = [
  ["thread-1", "host-jackpoint", "user-gm", "SEATTLE GRID: maintenance window and false certificates", "SYSTEM", "GRID KEEPER", "Two relays will rotate keys at 03:00 campaign time. If your deck reports certificate FROST-18, disconnect and message LATCHKEY."],
  ["thread-2", "host-redmond", "user-null", "The rain near Touristville is whispering names", "PLAYER_ALIAS", null, "Not poetry. Three witnesses heard the same two names in runoff under the old monorail. Looking for astral eyes before someone follows the sound."],
  ["thread-3", "host-fixer", "user-gm", "Quiet retrieval / Tacoma / no corporate marks", "NPC_IDENTITY", "VELA", "Need four careful people for a container that officially arrived empty. No fireworks. Good money for clean hands."],
  ["thread-4", "host-matrix", "user-hex", "New IC signature: paper wasp swarm", "PLAYER_ALIAS", null, "Saw a host split one trace process into hundreds of tiny agents. They fold into certificate chains when challenged. Bring area denial."],
  ["thread-5", "host-talis", "user-gm", "Cataloguing displaced hearth spirits", "NPC_IDENTITY", "ASH_SISTER", "Redevelopment is breaking old household boundaries. Post sightings with consent and do not publish true names."],
  ["thread-6", "host-leaks", "user-gm", "AEGIS protocol KESTREL has moved", "UNKNOWN_SOURCE", "K7", "The quarantine branch is no longer stored in Bellevue. Someone expects an audit and someone else expects fire."],
  ["thread-7", "host-jackpoint", "user-grim", "Reliable rotor shop south of the cut?", "PLAYER_ALIAS", null, "Need balanced replacements, not showroom parts. Paying in certified cred or two hours of clean lift time."],
  ["thread-8", "host-redmond", "user-static", "Barrens checkpoint moved overnight", "PLAYER_ALIAS", null, "New concrete at 228th. Uniforms don't match the vehicles. They wave locals through and stop anyone carrying medical gear."],
  ["thread-9", "host-fixer", "user-gm", "Crew availability roll-call", "SYSTEM", "FIXER EXCHANGE", "Update specialties and blackout dates. Do not post safehouse addresses in this thread, again."],
  ["thread-10", "host-matrix", "user-moth", "Dead zone singing on channel 9", "PLAYER_ALIAS", null, "Signal collapse has a repeating interval. It feels engineered, but the resonance signature is scared rather than hostile."],
  ["thread-11", "host-talis", "user-null", "Ward chalk batch comparisons", "PLAYER_ALIAS", null, "Ashen batch twelve holds clean on brick but smears across ferrocrete. I have field notes and can trade for reagent provenance."],
  ["thread-12", "host-jackpoint", "user-red", "After-action: glass elevator extraction", "PLAYER_ALIAS", null, "Client lied about three floors and a spirit contract. Nobody died. That is the only favorable sentence in this report."],
] as const;

const jobRows = [
  ["job-1", "The Empty Container", "CINDER", "contact-vela", "Recover an unmanifested container before dawn.", "Tacoma Docks", "HIGH", 28000, 4000, 3, 2, "AVAILABLE"],
  ["job-2", "Static in the Sanctuary", "MRS. GREY", "contact-ash", "Find the source of hostile signal noise inside a protected shrine.", "Snohomish", "MEDIUM", 18000, 2000, 2, 2, "AVAILABLE"],
  ["job-3", "Seven Minutes Late", "KEPLER_7", "contact-kepler", "Extract a compliance archive before its scheduled deletion.", "Bellevue", "EXTREME", 52000, 8000, 9, 4, "CLASSIFIED"],
  ["job-4", "Clinic Night Shift", "MARROW", "contact-marrow", "Keep a street clinic open through a gang evacuation.", "Puyallup", "HIGH", 22000, 3000, 1, 1, "NEGOTIATION"],
  ["job-5", "Paper Wasps", "LATCHKEY", "contact-latch", "Map and contain a new distributed IC pattern.", "Seattle Grid", "HIGH", 26000, 5000, 5, 2, "ACTIVE"],
  ["job-6", "Cold Rail", "WRAITH", "contact-wraith", "Escort a sealed carriage through abandoned switching yards.", "Kent", "MEDIUM", 20000, 2500, 3, 2, "ASSIGNED"],
  ["job-7", "Borrowed Weather", "ASH_SISTER", "contact-ash", "Return ritual condensate before the storm closes.", "Cascade foothills", "MEDIUM", 16500, 1500, 4, 2, "COMPLETED"],
  ["job-8", "The Honest Badge", "CINDER", "contact-vela", "Identify who is selling real access under fake authority.", "Redmond", "HIGH", 24000, 3000, 5, 2, "RUMORED"],
] as const;

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/(^-|-$)/gu, "");
}

async function runBatches(db: D1Database, statements: D1PreparedStatement[], size = 45): Promise<void> {
  for (let index = 0; index < statements.length; index += size) {
    await db.batch(statements.slice(index, index + size));
  }
}

async function applySeedAccountingV2(db: D1Database): Promise<void> {
  const correctionGuard = "NOT EXISTS (SELECT 1 FROM campaign_settings WHERE key='seed_accounting_v2')";
  const pendingGuard = "EXISTS (SELECT 1 FROM orders WHERE id='order-seed-pending' AND status='AWAITING GM')";
  await db.batch([
    db.prepare(`UPDATE currency_accounts SET balance=balance-18000,updated_at=CURRENT_TIMESTAMP
      WHERE user_id='user-red' AND ${correctionGuard} AND ${pendingGuard}`),
    db.prepare(`UPDATE products SET stock=stock-1,updated_at=CURRENT_TIMESTAMP
      WHERE id='prod-reflex' AND ${correctionGuard} AND ${pendingGuard}`),
    db.prepare(`INSERT INTO transactions (id,user_id,type,amount,balance_before,balance_after,reason,related_order_id,performed_by)
      SELECT 'transaction-seed-pending','user-red','PURCHASE',-18000,57300,39300,
        'Morrow Street Clinic order SG-2080-0048 awaiting GM review','order-seed-pending','user-red'
      WHERE ${correctionGuard} AND ${pendingGuard}
        AND NOT EXISTS (SELECT 1 FROM transactions WHERE id='transaction-seed-pending')`),
    db.prepare(`UPDATE products SET stock=stock-1,updated_at=CURRENT_TIMESTAMP
      WHERE id='prod-rainreagents' AND ${correctionGuard}`),
    db.prepare(`INSERT OR IGNORE INTO campaign_settings (id,key,value,value_type,updated_by)
      SELECT 'setting-seed-accounting-v2','seed_accounting_v2','applied','STRING','user-gm'
      WHERE ${correctionGuard}`),
    db.prepare("INSERT OR REPLACE INTO campaign_settings (id,key,value,value_type,updated_by) VALUES ('setting-seed','seed_version','2','INTEGER','user-gm')"),
  ]);
}

async function lockSeedAuthentication(db: D1Database): Promise<void> {
  const ids = users.map((user) => user.id);
  const placeholders = ids.map(() => "?").join(",");
  await db.batch([
    db.prepare(`UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP
      WHERE user_id IN (${placeholders}) AND revoked_at IS NULL`).bind(...ids),
    db.prepare(`INSERT OR REPLACE INTO campaign_settings (id,key,value,value_type,updated_by)
      VALUES ('setting-bootstrap-security','bootstrap_security','OWNER_SECRET_REQUIRED','STRING',NULL)`),
  ]);
}

async function applySeedSecurityV3(db: D1Database, bootstrapPassword: string): Promise<void> {
  const hashes = await Promise.all(users.map((user) => hashPassword(
    user.id === "user-gm" ? bootstrapPassword : `${crypto.randomUUID()}${crypto.randomUUID()}`,
  )));
  const statements = users.map((user, index) => db.prepare(`UPDATE users
      SET password_hash=?,password_salt=?,password_iterations=?,enabled=?,force_password_change=1,temporary_password_expires_at=NULL,updated_at=CURRENT_TIMESTAMP
      WHERE id=?`).bind(hashes[index].hash, hashes[index].salt, hashes[index].iterations, user.id === "user-gm" ? 1 : 0, user.id));
  statements.push(
    db.prepare("UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE revoked_at IS NULL"),
    db.prepare(`INSERT OR IGNORE INTO audit_logs (id,action,target_type,target_id,summary,after_state)
      VALUES ('audit-seed-security-v3','SEED_CREDENTIALS_ROTATED','Campaign','seed-accounts',
        'Rotated bootstrap credentials, forced first-login replacement and revoked sessions',
        '{"securityVersion":3,"plaintextStored":false}')`),
    db.prepare(`INSERT OR REPLACE INTO campaign_settings (id,key,value,value_type,updated_by)
      VALUES ('setting-bootstrap-security','bootstrap_security','READY','STRING','user-gm')`),
    db.prepare("INSERT OR REPLACE INTO campaign_settings (id,key,value,value_type,updated_by) VALUES ('setting-seed','seed_version','3','INTEGER','user-gm')"),
  );
  await db.batch(statements);
}

export async function seedCampaignIfEmpty(db: D1Database, bootstrapPassword?: string): Promise<void> {
  const seeded = await db.prepare("SELECT value FROM campaign_settings WHERE key = 'seed_version'").first<{ value: string }>();
  if (seeded?.value === "3") return;
  if (!bootstrapPassword || bootstrapPassword.length < 12 || bootstrapPassword.length > 128) {
    await lockSeedAuthentication(db);
    return;
  }
  if (seeded?.value === "1") {
    await applySeedAccountingV2(db);
  }
  if (seeded?.value === "1" || seeded?.value === "2") {
    await applySeedSecurityV3(db, bootstrapPassword);
    return;
  }

  const prepared: D1PreparedStatement[] = [];
  for (const row of clearanceRows) prepared.push(db.prepare("INSERT OR IGNORE INTO matrix_clearances (id,key,label,rank,color) VALUES (?,?,?,?,?)").bind(...row));
  for (const row of roleRows) prepared.push(db.prepare("INSERT OR IGNORE INTO roles (id,key,label,system) VALUES (?,?,?,?)").bind(...row));
  for (const row of permissionRows) prepared.push(db.prepare("INSERT OR IGNORE INTO permissions (id,key,label,description) VALUES (?,?,?,?)").bind(...row));
  for (const row of factionRows) prepared.push(db.prepare("INSERT OR IGNORE INTO factions (id,name,slug,summary,accent) VALUES (?,?,?,?,?)").bind(...row));

  const hashes = await Promise.all(users.map((user) => hashPassword(
    user.id === "user-gm" ? bootstrapPassword : `${crypto.randomUUID()}${crypto.randomUUID()}`,
  )));
  users.forEach((user, index) => {
    const password = hashes[index];
    prepared.push(db.prepare("INSERT OR IGNORE INTO users (id,login_name,runner_alias,password_hash,password_salt,password_iterations,enabled,force_password_change) VALUES (?,?,?,?,?,?,?,1)").bind(user.id, user.login, user.alias, password.hash, password.salt, password.iterations, user.id === "user-gm" ? 1 : 0));
    prepared.push(db.prepare("INSERT OR IGNORE INTO user_roles (user_id,role_id,granted_by) VALUES (?,?,?)").bind(user.id, user.role, "user-gm"));
    prepared.push(db.prepare("INSERT OR IGNORE INTO currency_accounts (id,user_id,balance) VALUES (?,?,?)").bind(`acct-${user.id}`, user.id, user.nuyen ?? 0));
    if (user.character) {
      prepared.push(db.prepare("INSERT OR IGNORE INTO player_profiles (id,user_id,faction_id,clearance_id,street_reputation) VALUES (?,?,?,?,?)").bind(`profile-${user.id}`, user.id, user.faction, user.clearance, user.reputation ?? 0));
      prepared.push(db.prepare("INSERT OR IGNORE INTO character_profiles (id,player_profile_id,character_name,metatype,archetype,biography) VALUES (?,?,?,?,?,?)").bind(`character-${user.id}`, `profile-${user.id}`, user.character, user.metatype, user.archetype, `${user.alias} maintains a deliberately incomplete biography on the host.`));
      prepared.push(db.prepare("INSERT OR IGNORE INTO carts (id,user_id) VALUES (?,?)").bind(`cart-${user.id}`, user.id));
    }
  });

  for (const permission of permissionRows) {
    prepared.push(db.prepare("INSERT OR IGNORE INTO role_permissions (role_id,permission_id) VALUES (?,?)").bind("role-gm", permission[0]));
  }
  for (const permissionId of ["perm-products", "perm-forum", "perm-jobs", "perm-orders", "perm-messages", "perm-announcements", "perm-audit"]) {
    prepared.push(db.prepare("INSERT OR IGNORE INTO role_permissions (role_id,permission_id) VALUES (?,?)").bind("role-assistant", permissionId));
  }
  prepared.push(db.prepare("INSERT OR IGNORE INTO role_permissions (role_id,permission_id) VALUES (?,?)").bind("role-moderator", "perm-forum"));

  for (const row of contactRows) {
    prepared.push(db.prepare("INSERT OR IGNORE INTO contacts (id,name,alias,type,description,faction_id,location,loyalty,connection_rating,min_reputation,min_clearance_rank,services,communication_channel) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(...row));
  }
  for (const row of vendorRows) prepared.push(db.prepare("INSERT OR IGNORE INTO vendors (id,contact_id,name,slug,vendor_type,description,node_address,local_theme) VALUES (?,?,?,?,?,?,?,?)").bind(...row));
  categoryNames.forEach((name, index) => prepared.push(db.prepare("INSERT OR IGNORE INTO product_categories (id,name,slug,display_order) VALUES (?,?,?,?)").bind(`category-${slugify(name)}`, name, slugify(name), index)));

  for (const row of productRows) {
    const [id, listingCode, name, category, vendorId, shortDescription, fullDescription, price, stock, rarity, legality, minReputation, minClearanceRank, factionId, requiresApproval] = row;
    prepared.push(db.prepare("INSERT OR IGNORE INTO products (id,internal_id,listing_code,name,slug,short_description,full_description,category_id,vendor_id,price,stock,rarity,legality,min_reputation,min_clearance_rank,faction_id,requires_gm_approval,featured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id, `SG-${id.toUpperCase()}`, listingCode, name, slugify(name), shortDescription, fullDescription, `category-${slugify(category)}`, vendorId, price, stock, rarity, legality, minReputation, minClearanceRank, factionId, requiresApproval, id === "prod-ghostline" ? 1 : 0));
    prepared.push(db.prepare("INSERT OR IGNORE INTO inventory_items (id,product_id,name,category,description) VALUES (?,?,?,?,?)").bind(`item-${id}`, id, name, category, shortDescription));
  }

  prepared.push(db.prepare("INSERT OR IGNORE INTO product_access_rules (id,product_id,rule_type,user_id,effect) VALUES (?,?,?,?,?)").bind("rule-sealed-null", "prod-sealedcrate", "PLAYER", "user-moth", "ALLOW"));
  prepared.push(db.prepare("INSERT OR IGNORE INTO player_contacts (id,player_profile_id,contact_id,loyalty,connection_rating) VALUES (?,?,?,?,?)").bind("pc-null-ash", "profile-user-null", "contact-ash", 4, 4));
  prepared.push(db.prepare("INSERT OR IGNORE INTO player_contacts (id,player_profile_id,contact_id,loyalty,connection_rating) VALUES (?,?,?,?,?)").bind("pc-null-vela", "profile-user-null", "contact-vela", 3, 5));
  prepared.push(db.prepare("INSERT OR IGNORE INTO player_contacts (id,player_profile_id,contact_id,loyalty,connection_rating) VALUES (?,?,?,?,?)").bind("pc-hex-latch", "profile-user-hex", "contact-latch", 4, 3));

  prepared.push(db.prepare("INSERT OR IGNORE INTO forum_categories (id,name,slug,description,display_order) VALUES (?,?,?,?,?)").bind("forum-shadow", "SHADOW BOARD", "shadow-board", "Connected runner hosts and controlled archives.", 0));
  for (const row of hostRows) prepared.push(db.prepare("INSERT OR IGNORE INTO matrix_hosts (id,category_id,name,slug,description,node_address,icon,visual_theme,owner,display_order,min_reputation,min_clearance_rank) VALUES (?,'forum-shadow',?,?,?,?,?,?,?,?,?,?)").bind(...row));
  for (const row of threadRows) {
    const [id, hostId, authorId, title, mode, authorLabel, content] = row;
    prepared.push(db.prepare("INSERT OR IGNORE INTO forum_threads (id,host_id,author_user_id,title,author_display_mode,author_label,content,pinned) VALUES (?,?,?,?,?,?,?,?)").bind(id, hostId, authorId, title, mode, authorLabel, content, id === "thread-1" || id === "thread-3" ? 1 : 0));
    prepared.push(db.prepare("INSERT OR IGNORE INTO forum_posts (id,thread_id,author_user_id,author_display_mode,author_label,content_markdown) VALUES (?,?,?,?,?,?)").bind(`post-${id}`, id, authorId, mode, authorLabel, content));
    if (Number(id.split("-")[1]) <= 6) prepared.push(db.prepare("INSERT OR IGNORE INTO forum_posts (id,thread_id,author_user_id,author_display_mode,content_markdown) VALUES (?,?,?,?,?)").bind(`reply-${id}`, id, "user-hex", "PLAYER_ALIAS", "Signal received. I have marked the route and will keep this thread watched."));
  }

  for (const row of jobRows) prepared.push(db.prepare("INSERT OR IGNORE INTO jobs (id,title,johnson_alias,fixer_contact_id,short_briefing,full_briefing,location,danger,payment,advance_payment,min_reputation,min_clearance_rank,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(row[0], row[1], row[2], row[3], row[4], `${row[4]} Full details are released only to assigned runners.`, row[5], row[6], row[7], row[8], row[9], row[10], row[11]));
  prepared.push(db.prepare("INSERT OR IGNORE INTO job_assignments (id,job_id,user_id,status) VALUES (?,?,?,?)").bind("assignment-paperwasps", "job-5", "user-hex", "ACTIVE"));
  prepared.push(db.prepare("INSERT OR IGNORE INTO job_assignments (id,job_id,user_id,status) VALUES (?,?,?,?)").bind("assignment-weather", "job-7", "user-null", "COMPLETED"));

  prepared.push(db.prepare("INSERT OR IGNORE INTO private_conversations (id,subject,created_by) VALUES (?,?,?)").bind("conversation-vela", "Container route // eyes only", "user-gm"));
  prepared.push(db.prepare("INSERT OR IGNORE INTO conversation_participants (conversation_id,user_id,unread_count) VALUES (?,?,?)").bind("conversation-vela", "user-null", 1));
  prepared.push(db.prepare("INSERT OR IGNORE INTO conversation_participants (conversation_id,user_id,unread_count) VALUES (?,?,?)").bind("conversation-vela", "user-gm", 0));
  prepared.push(db.prepare("INSERT OR IGNORE INTO private_messages (id,conversation_id,sender_user_id,source_identity,source_label,body_markdown) VALUES (?,?,?,?,?,?)").bind("message-vela-1", "conversation-vela", "user-gm", "FIXER", "VELA", "The container is real. The manifest is not. Confirm only if your team can keep both facts separate."));
  prepared.push(db.prepare("INSERT OR IGNORE INTO private_conversations (id,subject,created_by) VALUES (?,?,?)").bind("conversation-grid", "Host integrity bulletin", "user-gm"));
  prepared.push(db.prepare("INSERT OR IGNORE INTO conversation_participants (conversation_id,user_id,unread_count) VALUES (?,?,?)").bind("conversation-grid", "user-hex", 1));
  prepared.push(db.prepare("INSERT OR IGNORE INTO private_messages (id,conversation_id,sender_user_id,source_identity,source_label,body_markdown) VALUES (?,?,?,?,?,?)").bind("message-grid-1", "conversation-grid", "user-gm", "SYSTEM", "GRID KEEPER", "Your watched host changed certificate twice. This notification is fictional campaign telemetry."));

  const announcements = [
    ["announcement-1", "CORRUPTED CERTIFICATE DETECTED", "Do not accept route certificate FROST-18. LATCHKEY is rotating local keys.", "HOSTILE IC", "GRID KEEPER", 0, 1],
    ["announcement-2", "Astral pressure rising", "Rain City Talismongers report unstable wards along the eastern transit corridor.", "ASTRAL ANOMALY", "ASH_SISTER", 2, 0],
    ["announcement-3", "Campaign clock advanced", "Local campaign time is 04:17, 18 November 2080. Tacoma weather: hard rain.", "NOTICE", "GAME MASTER", 0, 1],
  ];
  for (const row of announcements) prepared.push(db.prepare("INSERT OR IGNORE INTO announcements (id,title,body,severity,source_label,min_clearance_rank,pinned,created_by) VALUES (?,?,?,?,?,?,?,?)").bind(...row, "user-gm"));

  prepared.push(db.prepare("INSERT OR IGNORE INTO orders (id,order_code,user_id,vendor_id,status,total,idempotency_key,approved_by,approved_at) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)").bind("order-seed-delivered", "SG-2080-0041", "user-null", "vendor-ashen", "DELIVERED", 1400, "seed-order-delivered", "user-gm"));
  prepared.push(db.prepare("INSERT OR IGNORE INTO order_items (id,order_id,product_id,product_name,listing_code,quantity,unit_price,line_total) VALUES (?,?,?,?,?,?,?,?)").bind("orderitem-seed-delivered", "order-seed-delivered", "prod-rainreagents", "Rain-Caught Reagents", "AM-RR-20", 1, 1400, 1400));
  prepared.push(db.prepare("INSERT OR IGNORE INTO inventory_entries (id,user_id,inventory_item_id,quantity,condition,acquisition_source,related_order_id) VALUES (?,?,?,?,?,?,?)").bind("inventory-null-reagents", "user-null", "item-prod-rainreagents", 1, "NEW", "PURCHASE", "order-seed-delivered"));
  prepared.push(db.prepare("INSERT OR IGNORE INTO inventory_entries (id,user_id,inventory_item_id,quantity,condition,acquisition_source) VALUES (?,?,?,?,?,?)").bind("inventory-null-chalk", "user-null", "item-prod-wardchalk", 2, "USED", "GM GRANT"));
  prepared.push(db.prepare("INSERT OR IGNORE INTO orders (id,order_code,user_id,vendor_id,status,total,idempotency_key) VALUES (?,?,?,?,?,?,?)").bind("order-seed-pending", "SG-2080-0048", "user-red", "vendor-morrow", "AWAITING GM", 18000, "seed-order-pending"));
  prepared.push(db.prepare("INSERT OR IGNORE INTO order_items (id,order_id,product_id,product_name,listing_code,quantity,unit_price,line_total) VALUES (?,?,?,?,?,?,?,?)").bind("orderitem-seed-pending", "order-seed-pending", "prod-reflex", "Synaptic Reflex Tune", "MS-RX-3", 1, 18000, 18000));
  prepared.push(db.prepare("INSERT OR IGNORE INTO transactions (id,user_id,type,amount,balance_before,balance_after,reason,related_order_id,performed_by) VALUES (?,?,?,?,?,?,?,?,?)").bind("transaction-seed-order", "user-null", "PURCHASE", -1400, 43400, 42000, "Ashen Market order SG-2080-0041", "order-seed-delivered", "user-null"));
  prepared.push(db.prepare("INSERT OR IGNORE INTO transactions (id,user_id,type,amount,balance_before,balance_after,reason,related_job_id,performed_by) VALUES (?,?,?,?,?,?,?,?,?)").bind("transaction-seed-job", "user-null", "JOB PAYMENT", 16500, 26900, 43400, "Borrowed Weather settlement", "job-7", "user-gm"));

  prepared.push(db.prepare("INSERT OR IGNORE INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,after_state) VALUES (?,?,?,?,?,?,?)").bind("audit-seed-1", "user-gm", "PLAYER_CREATED", "User", "user-null", "Created runner account NULL_SHAMAN", "{\"clearance\":\"GOLD\",\"nuyen\":26900}"));
  prepared.push(db.prepare("INSERT OR IGNORE INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,after_state) VALUES (?,?,?,?,?,?,?)").bind("audit-seed-2", "user-gm", "PRODUCT_CREATED", "Product", "prod-ghostline", "Published restricted Ghostline Signal Tap listing", "{\"minimumClearance\":2,\"minimumReputation\":4}"));
  prepared.push(db.prepare("INSERT OR IGNORE INTO audit_logs (id,actor_user_id,action,target_type,target_id,summary,after_state) VALUES (?,?,?,?,?,?,?)").bind("audit-seed-3", "user-gm", "ORDER_APPROVED", "Order", "order-seed-delivered", "Approved Ashen Market delivery", "{\"status\":\"DELIVERED\"}"));
  prepared.push(db.prepare("INSERT OR REPLACE INTO campaign_settings (id,key,value,value_type,updated_by) VALUES (?,?,?,?,?)").bind("setting-name", "campaign_name", "RAIN CITY // 2080", "STRING", "user-gm"));
  prepared.push(db.prepare("INSERT OR REPLACE INTO campaign_settings (id,key,value,value_type,updated_by) VALUES (?,?,?,?,?)").bind("setting-time", "campaign_time", "2080-11-18T04:17:00-08:00", "DATETIME", "user-gm"));

  await runBatches(db, prepared);
  await applySeedAccountingV2(db);
  await applySeedSecurityV3(db, bootstrapPassword);
}
