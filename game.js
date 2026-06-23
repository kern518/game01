const mapCanvas = document.querySelector("#game");
const mapCtx = mapCanvas.getContext("2d");
const battleCanvas = document.querySelector("#battle");
const battleCtx = battleCanvas.getContext("2d");
const battleLayer = document.querySelector("#battleLayer");
const hangarLayer = document.querySelector("#hangarLayer");
const sidePanel = document.querySelector(".side-panel");
const panelTitle = document.querySelector("#panelTitle");
const hangarMechCanvas = document.querySelector("#hangarMech");
const hangarMechCtx = hangarMechCanvas.getContext("2d");
const logEl = document.querySelector("#log");
const portraitCanvas = document.querySelector("#portrait");
const portraitCtx = portraitCanvas.getContext("2d");

const ui = {
  credits: document.querySelector("#credits"),
  scrap: document.querySelector("#scrap"),
  wins: document.querySelector("#wins"),
  level: document.querySelector("#level"),
  armor: document.querySelector("#armor"),
  energyText: document.querySelector("#energyText"),
  weapon: document.querySelector("#weapon"),
  chip: document.querySelector("#chip"),
  playerHp: document.querySelector("#playerHp"),
  playerEn: document.querySelector("#playerEn"),
  enemyName: document.querySelector("#enemyName"),
  enemyHp: document.querySelector("#enemyHp"),
  enemyEn: document.querySelector("#enemyEn"),
  speaker: document.querySelector("#speaker"),
  speech: document.querySelector("#speech"),
  objective: document.querySelector("#objective"),
  devTools: document.querySelector("#devTools"),
  npcSelect: document.querySelector("#npcSelect"),
  npcCoords: document.querySelector("#npcCoords"),
  npcSelected: document.querySelector("#npcSelected"),
  npcSpeakerInput: document.querySelector("#npcSpeakerInput"),
  npcTextInput: document.querySelector("#npcTextInput"),
  npcBlockingInput: document.querySelector("#npcBlockingInput"),
  scrapAmountInput: document.querySelector("#scrapAmountInput"),
  scrapCoords: document.querySelector("#scrapCoords"),
  devHint: document.querySelector("#devHint"),
  enemyVisible: document.querySelector("#enemyVisible"),
};

const assets = {
  tiles: loadImage("assets/tiles-scifi-rpg.png"),
  mapBg: loadImage("assets/map-background-large.png"),
  battleMechs: loadImage("assets/mecha-sd-battle.png"),
  heroActions: loadImage("assets/hero-actions.png"),
  heroWalk: loadImage("assets/hero-walk-sheet.png"),
  pilotMap: loadImage("assets/pilot-rpg-map-downfix.png"),
  npc1: loadImage("assets/npc1.png"),
  npc2: loadImage("assets/npc2.png"),
  npc3: loadImage("assets/npc3.png"),
  npc4: loadImage("assets/npc4.png"),
  teacher: loadImage("assets/老师.png"),
  portraits: loadImage("assets/portraits.png"),
  heroPortrait: loadImage("assets/hero-portrait.png"),
  conceptPortrait: loadImage("assets/pilot-concept-portrait.png"),
  effects: loadImage("assets/effects.png"),
  icons: loadImage("assets/ui-icons.png"),
  battleBg: loadImage("assets/battle-bg.png"),
  battleField: loadImage("assets/battle-bg-field.png"),
};

const assetState = {
  loaded: 0,
  total: Object.keys(assets).length,
};

function loadImage(src) {
  const image = new Image();
  image.src = src;
  image.addEventListener("load", () => {
    assetState.loaded += 1;
    if (mode === "map") drawMap();
    if (mode === "hangar") drawHangar();
    drawPortrait(currentSpeaker.portrait);
    if (mode === "battle") drawBattle();
  });
  return image;
}

const TILE = 32;
const STEP_DURATION = 150;
const COLLISION_STORAGE_KEY = "mechaStorm.collisionMap.v2";
const NPC_STORAGE_KEY = "mechaStorm.npcLayout.v3";
const LEGACY_NPC_STORAGE_KEYS = ["mechaStorm.npcLayout.v1", "mechaStorm.npcLayout.v2"];
const SAVE_STORAGE_KEY = "mechaStorm.demoSave.v3";
const LEGACY_SAVE_STORAGE_KEYS = ["mechaStorm.demoSave.v1", "mechaStorm.demoSave.v2"];
const STORAGE_MIGRATION_KEY = "mechaStorm.storageMigration.v3";
const LEGACY_STORAGE_MIGRATION_KEYS = ["mechaStorm.storageMigration.v2"];
const DEV_MODE = new URLSearchParams(window.location.search).has("dev");
const BASE_COORD = { x: 3, y: 5 };
const defaultMap = [
  "############################",
  "##########s.######..########",
  "##########..######..########",
  "#########...........E...####",
  "#########........###....####",
  "###B####........####....####",
  "########.................###",
  "########................E.##",
  "###E......r.P......###....##",
  "########..........#####E..##",
  "########rr........####....##",
  "########..........####....##",
  "###........#####..........##",
  "####.......######.........##",
  "#####.....########........##",
  "######.....#######........##",
  "#########....#####....######",
  "############################",
];
let map = loadCollisionMap();

const enemies = [];
const initialEnemies = enemies.map((enemy) => ({ ...enemy }));

const npcTemplates = [
  { type: "npc1", label: "npc1 巡逻员", mapSprite: "npc1", portrait: 0, speaker: "巡逻员 宁", text: "外圈道路已经打通，贴着建筑边缘走会更安全。" },
  { type: "npc2", label: "npc2 指挥官", mapSprite: "npc2", portrait: 1, speaker: "基地指挥官", text: "旧城区还有四台敌机，把蓝图碎片带回来。" },
  { type: "npc3", label: "npc3 机械师", mapSprite: "npc3", portrait: 2, speaker: "机械师 阿棠", text: "维修站能扩装甲，先攒两块零件。" },
  { type: "npc4", label: "npc4 侦察兵", mapSprite: "npc4", portrait: 3, speaker: "废土侦察兵", text: "东侧有重型机甲的热源，先清小型敌机再过去。" },
  { type: "teacher", label: "老师", mapSprite: "teacher", portrait: 2, speaker: "老师", text: "机甲不是只靠火力，能量节奏和撤退路线也要提前想好。" },
];
const defaultNpcInstances = [];
runStorageMigration();
let npcs = loadNpcLayout();

const defaultScrapNodes = [
  { id: "scrap-01", x: 6, y: 12, amount: 1, label: "散落零件" },
  { id: "scrap-02", x: 15, y: 8, amount: 2, label: "废弃补给箱" },
  { id: "scrap-03", x: 21, y: 15, amount: 2, label: "损坏能源匣" },
  { id: "scrap-04", x: 24, y: 4, amount: 3, label: "机体残骸" },
];
let scrapNodes = cloneDefaultScrapNodes();

const tileSprites = {
  ".": 0,
  "#": 1,
  "r": 2,
  "B": 3,
  "s": 4,
  "P": 5,
  "E": 5,
  "G": 7,
};

const player = {
  x: 12,
  y: 8,
  hp: 120,
  maxHp: 120,
  en: 42,
  maxEn: 60,
  credits: 120,
  scrap: 0,
  wins: 0,
  level: 1,
  atk: 32,
  defense: 18,
  weapon: "pulse",
  guard: false,
};
const initialPlayer = { ...player };

const weapons = {
  pulse: { label: "脉冲机炮", damage: [14, 22], energy: 0, log: "机炮弹幕压住了敌机。" },
  rail: { label: "磁轨炮", damage: [25, 35], energy: 16, log: "磁轨炮打出贯穿电弧。" },
  repair: { label: "维修核心", damage: [12, 17], energy: -4, log: "维修核心补偿了能量回路。" },
};

let mode = "hangar";
let currentEnemy = null;
let battleFx = { shake: 0, flash: 0, text: "", kind: "muzzle", x: 438, y: 88 };
let currentSpeaker = { speaker: "驾驶员 洛辰", text: "游隼上线，等待出击指令。", portrait: 0 };
let mapAnim = null;
let bumpAnim = null;
let facing = 1;
let battleAnim = null;
let battleLocked = false;
let lastMoveDy = 0;
let lastMoveDx = 0;
let queuedMove = null;
let heldMove = null;
const pressedMoveKeys = new Set();
let showCollisionDebug = false;
let showNpcDebug = false;
let showScrapDebug = false;
let showEnemyMarkers = !DEV_MODE;
let selectedNpcType = "npc1";
let selectedNpcInstanceId = null;
let dialogOpenNpcId = null;
let npcEraseMode = false;
let scrapEraseMode = false;
let demoComplete = false;

const panelTitles = {
  mech: "机体",
  pilot: "人物",
  equip: "装备",
  log: "通讯",
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addLog(text) {
  const li = document.createElement("li");
  li.textContent = text;
  logEl.prepend(li);
  while (logEl.children.length > 8) logEl.lastChild.remove();
}

function setComms(speaker, text, portrait = 0) {
  currentSpeaker = { speaker, text, portrait };
  ui.speaker.textContent = speaker;
  ui.speech.textContent = text;
  drawPortrait(portrait);
}

function isWall(x, y) {
  return map[y]?.[x] === "#";
}

function tileAt(x, y) {
  return map[y]?.[x] ?? "#";
}

function enemyAt(x, y) {
  return enemies.find((enemy) => !enemy.defeated && enemy.x === x && enemy.y === y);
}

function cloneDefaultScrapNodes() {
  return defaultScrapNodes.map((node) => ({ ...node, collected: false }));
}

function scrapNodeAt(x, y) {
  return scrapNodes.find((node) => !node.collected && node.x === x && node.y === y);
}

function anyScrapNodeAt(x, y) {
  return scrapNodes.find((node) => node.x === x && node.y === y);
}

function selectedScrapAmount() {
  const value = Number.parseInt(ui.scrapAmountInput?.value ?? "1", 10);
  return Math.max(1, Math.min(9, Number.isFinite(value) ? value : 1));
}

function placeScrapNode(x, y) {
  if (!map[y] || x < 0 || x >= map[y].length) return;
  const existing = anyScrapNodeAt(x, y);
  if (existing) {
    existing.amount = selectedScrapAmount();
    existing.collected = false;
    existing.label = "自定义零件点";
    addLog(`零件点已更新：${x}, ${y} / +${existing.amount}`);
  } else {
    const node = {
      id: `scrap-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      x,
      y,
      amount: selectedScrapAmount(),
      label: "自定义零件点",
      collected: false,
    };
    scrapNodes.push(node);
    addLog(`零件点已放置：${x}, ${y} / +${node.amount}`);
  }
  updateNpcEditor();
}

function removeScrapNodeAt(x, y) {
  const index = scrapNodes.findIndex((node) => node.x === x && node.y === y);
  if (index < 0) {
    addLog(`这里没有零件点：${x}, ${y}。`);
    return;
  }
  scrapNodes.splice(index, 1);
  updateNpcEditor();
  addLog(`零件点已删除：${x}, ${y}`);
}

function clearScrapNodes() {
  scrapNodes = [];
  updateNpcEditor();
  updateUi();
  addLog("零件层已清空。");
}

function resetScrapNodes() {
  scrapNodes = cloneDefaultScrapNodes();
  scrapEraseMode = false;
  updateNpcEditor();
  updateUi();
  addLog("零件层已恢复默认。");
}

function blockingNpcAt(x, y) {
  return npcs.find((npc) => npc.blocking && npc.x === x && npc.y === y);
}

function loadCollisionMap() {
  try {
    const saved = JSON.parse(localStorage.getItem(COLLISION_STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length === defaultMap.length && saved.every((row, index) => row.length === defaultMap[index].length)) {
      return saved;
    }
  } catch {
    localStorage.removeItem(COLLISION_STORAGE_KEY);
  }
  return [...defaultMap];
}

function saveCollisionMap() {
  localStorage.setItem(COLLISION_STORAGE_KEY, JSON.stringify(map));
}

function setCollisionTile(x, y, type) {
  if (!map[y] || x < 0 || x >= map[y].length) return;
  const chars = map[y].split("");
  chars[x] = type;
  map[y] = chars.join("");
  saveCollisionMap();
}

function resetCollisionMap() {
  map = [...defaultMap];
  saveCollisionMap();
  addLog("碰撞层已恢复默认。");
}

function runStorageMigration() {
  if (localStorage.getItem(STORAGE_MIGRATION_KEY) === "done") return;
  LEGACY_STORAGE_MIGRATION_KEYS.forEach((key) => localStorage.removeItem(key));
  LEGACY_NPC_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  LEGACY_SAVE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(NPC_STORAGE_KEY);
  localStorage.removeItem(SAVE_STORAGE_KEY);
  localStorage.setItem(STORAGE_MIGRATION_KEY, "done");
}

function npcTemplate(type) {
  return npcTemplates.find((template) => template.type === type) ?? npcTemplates[0];
}

function hydrateNpcInstance(instance, index = 0) {
  const template = npcTemplate(instance?.type);
  return {
    ...template,
    id: instance?.id ?? `npc-${Date.now()}-${index}`,
    type: template.type,
    x: Number.isInteger(instance?.x) ? instance.x : 0,
    y: Number.isInteger(instance?.y) ? instance.y : 0,
    speaker: typeof instance?.speaker === "string" ? instance.speaker : template.speaker,
    text: typeof instance?.text === "string" ? instance.text : template.text,
    blocking: Boolean(instance?.blocking),
  };
}

function cloneDefaultNpcs() {
  return defaultNpcInstances.map((instance, index) =>
    hydrateNpcInstance({ ...instance, id: `default-${index + 1}` }, index),
  );
}

function normalizeNpcLayout(saved) {
  if (!Array.isArray(saved)) return cloneDefaultNpcs();

  // Backward-compatible migration from the old fixed-NPC layout.
  if (saved.some((item) => item?.mapSprite || item?.visible !== undefined)) {
    return saved
      .filter((item) => item?.visible !== false)
      .map((item, index) =>
        hydrateNpcInstance(
          {
            id: `migrated-${index + 1}`,
            type: item?.mapSprite === "teacher" ? "teacher" : item?.id ?? item?.mapSprite,
            x: item?.x,
            y: item?.y,
          },
          index,
        ),
      );
  }

  return saved.map((item, index) => hydrateNpcInstance(item, index));
}

function loadNpcLayout() {
  try {
    LEGACY_NPC_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    const saved = JSON.parse(localStorage.getItem(NPC_STORAGE_KEY) || "null");
    return normalizeNpcLayout(saved);
  } catch {
    localStorage.removeItem(NPC_STORAGE_KEY);
    return cloneDefaultNpcs();
  }
}

function saveNpcLayout() {
  localStorage.setItem(
    NPC_STORAGE_KEY,
    JSON.stringify(npcs.map(({ id, type, x, y, speaker, text, blocking }) => ({ id, type, x, y, speaker, text, blocking }))),
  );
}

function resetNpcLayout() {
  localStorage.removeItem(NPC_STORAGE_KEY);
  npcs = cloneDefaultNpcs();
  selectedNpcType = npcTemplates[0]?.type ?? "npc1";
  selectedNpcInstanceId = null;
  npcEraseMode = false;
  updateNpcEditor();
  addLog("NPC 层已重置为空。");
}

function clearNpcLayout() {
  npcs = [];
  selectedNpcInstanceId = null;
  saveNpcLayout();
  updateNpcEditor();
  addLog("NPC 层已清空，可任意重新摆放。");
}

function selectedNpcInstance() {
  return npcs.find((npc) => npc.id === selectedNpcInstanceId) ?? null;
}

function selectNpcInstance(npc) {
  selectedNpcInstanceId = npc?.id ?? null;
  if (npc) {
    selectedNpcType = npc.type;
    setComms(npc.speaker, npc.text, npc.portrait);
  }
  updateNpcEditor();
}

function placeNpcInstance(x, y) {
  if (!map[y] || x < 0 || x >= map[y].length) return;
  const template = npcTemplate(selectedNpcType);
  const npc = hydrateNpcInstance({
    id: `npc-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    type: template.type,
    x,
    y,
  });
  npcs.push(npc);
  selectedNpcInstanceId = npc.id;
  saveNpcLayout();
  updateNpcEditor();
  addLog(`${template.label} 已新增到 ${x}, ${y}。`);
}

function removeNpcAt(x, y) {
  const index = [...npcs].reverse().findIndex((npc) => npc.x === x && npc.y === y);
  if (index < 0) {
    addLog(`这里没有 NPC：${x}, ${y}。`);
    return;
  }
  const realIndex = npcs.length - 1 - index;
  const [removed] = npcs.splice(realIndex, 1);
  if (selectedNpcInstanceId === removed.id) selectedNpcInstanceId = null;
  saveNpcLayout();
  updateNpcEditor();
  addLog(`${removed.label} 已从 ${x}, ${y} 移除。`);
}

function npcAt(x, y) {
  return [...npcs].reverse().find((npc) => npc.x === x && npc.y === y) ?? null;
}

function facingDelta() {
  if (lastMoveDy < 0) return { dx: 0, dy: -1 };
  if (lastMoveDy > 0) return { dx: 0, dy: 1 };
  if (lastMoveDx < 0 || facing < 0) return { dx: -1, dy: 0 };
  return { dx: 1, dy: 0 };
}

function nearbyPoints() {
  const { dx, dy } = facingDelta();
  return [
    { x: player.x + dx, y: player.y + dy },
    { x: player.x, y: player.y },
    { x: player.x, y: player.y + 1 },
    { x: player.x, y: player.y - 1 },
    { x: player.x - 1, y: player.y },
    { x: player.x + 1, y: player.y },
  ];
}

function collectScrapNode(node) {
  if (!node || node.collected) return false;
  node.collected = true;
  player.scrap += node.amount;
  setComms("系统", `回收 ${node.label}，获得 ${node.amount} 个零件。`, 0);
  addLog(`回收 ${node.label}：+${node.amount} 零件。`);
  updateUi();
  return true;
}

function collectNearbyScrap() {
  const node = nearbyPoints().map((point) => scrapNodeAt(point.x, point.y)).find(Boolean);
  return collectScrapNode(node);
}

function interactWithNpc() {
  if (mode !== "map") return false;
  const target = nearbyPoints().map((point) => npcAt(point.x, point.y)).find(Boolean);
  if (!target) {
    if (collectNearbyScrap()) return true;
    addLog("附近没有可交互的 NPC。");
    return false;
  }
  if (dialogOpenNpcId === target.id && document.body.classList.contains("panel-open") && sidePanel.dataset.active === "pilot") {
    closePanel();
    return true;
  }
  selectedNpcInstanceId = target.id;
  dialogOpenNpcId = target.id;
  setComms(target.speaker, target.text, target.portrait);
  openPanel("pilot");
  updateNpcEditor();
  addLog(`正在对话：${target.speaker}`);
  return true;
}

function saveSelectedNpcText() {
  const npc = selectedNpcInstance();
  if (!npc) {
    addLog("请先在地图上选择一个 NPC。");
    return;
  }
  npc.speaker = ui.npcSpeakerInput?.value.trim() || npcTemplate(npc.type).speaker;
  npc.text = ui.npcTextInput?.value.trim() || npcTemplate(npc.type).text;
  npc.blocking = Boolean(ui.npcBlockingInput?.checked);
  saveNpcLayout();
  updateNpcEditor();
  setComms(npc.speaker, npc.text, npc.portrait);
  addLog(`${npc.label} 的对话已保存。`);
}

function previewSelectedNpcText() {
  const npc = selectedNpcInstance();
  if (!npc) {
    addLog("请先在地图上选择一个 NPC。");
    return;
  }
  const speaker = ui.npcSpeakerInput?.value.trim() || npc.speaker;
  const text = ui.npcTextInput?.value.trim() || npc.text;
  setComms(speaker, text, npc.portrait);
}

function updateNpcEditor() {
  if (!DEV_MODE || !ui.npcSelect) return;
  ui.npcSelect.value = selectedNpcType;
  if (ui.npcCoords) {
    const template = npcTemplate(selectedNpcType);
    const count = npcs.filter((npc) => npc.type === selectedNpcType).length;
    ui.npcCoords.textContent = `${template.label}：${count} 个 / 总计 ${npcs.length} 个`;
  }
  const selected = selectedNpcInstance();
  if (ui.npcSelected) {
    ui.npcSelected.textContent = selected ? `${selected.label} @ ${selected.x}, ${selected.y}` : "未选中";
  }
  if (ui.npcSpeakerInput) {
    ui.npcSpeakerInput.value = selected?.speaker ?? "";
    ui.npcSpeakerInput.disabled = !selected;
  }
  if (ui.npcTextInput) {
    ui.npcTextInput.value = selected?.text ?? "";
    ui.npcTextInput.disabled = !selected;
  }
  if (ui.npcBlockingInput) {
    ui.npcBlockingInput.checked = Boolean(selected?.blocking);
    ui.npcBlockingInput.disabled = !selected;
  }
  document.querySelectorAll("[data-dev-action='collision-mode']").forEach((button) => {
    button.classList.toggle("active", showCollisionDebug);
  });
  document.querySelectorAll("[data-dev-action='npc-mode']").forEach((button) => {
    button.classList.toggle("active", showNpcDebug);
  });
  document.querySelectorAll("[data-dev-action='scrap-mode']").forEach((button) => {
    button.classList.toggle("active", showScrapDebug);
  });
  document.querySelectorAll("[data-dev-action='npc-erase-mode']").forEach((button) => {
    button.classList.toggle("active", npcEraseMode);
  });
  document.querySelectorAll("[data-dev-action='scrap-erase-mode']").forEach((button) => {
    button.classList.toggle("active", scrapEraseMode);
  });
  if (ui.scrapCoords) {
    const active = scrapNodes.filter((node) => !node.collected).length;
    ui.scrapCoords.textContent = `零件点 ${active} / 总计 ${scrapNodes.length} 个`;
  }
  if (ui.devHint) {
    ui.devHint.textContent = showNpcDebug
      ? npcEraseMode
        ? "当前：NPC 层擦除。点击 NPC 所在格删除最上层 NPC。"
        : "当前：NPC 层。点已有 NPC 选择编辑，点空格新增，Ctrl+点强制新增。"
      : showScrapDebug
        ? scrapEraseMode
          ? "当前：零件层擦除。点击零件点删除。"
          : "当前：零件层。点击地图放置或更新零件点，Shift+点击删除。"
      : showCollisionDebug
        ? "当前：碰撞层。点击可走，Shift+点击不可走。"
        : "选择碰撞、NPC 或零件模式后，点击地图修改对应图层。";
  }
  if (ui.enemyVisible) ui.enemyVisible.checked = showEnemyMarkers;
}

function initDevTools() {
  if (!ui.devTools) return;
  if (!DEV_MODE) {
    ui.devTools.classList.add("hidden");
    return;
  }
  ui.devTools.classList.remove("hidden");
  if (ui.npcSelect) {
    ui.npcSelect.innerHTML = "";
    npcTemplates.forEach((npc) => {
      const option = document.createElement("option");
      option.value = npc.type;
      option.textContent = npc.label;
      ui.npcSelect.append(option);
    });
    ui.npcSelect.addEventListener("change", () => {
      selectedNpcType = ui.npcSelect.value;
      updateNpcEditor();
    });
  }
  ui.enemyVisible?.addEventListener("change", () => {
    showEnemyMarkers = ui.enemyVisible.checked;
    updateNpcEditor();
  });
  updateNpcEditor();
}

function buildSaveData() {
  return {
    player: { ...player },
    enemies: enemies.map((enemy) => ({
      hp: enemy.hp,
      en: enemy.en,
      defeated: enemy.defeated,
    })),
    demoComplete,
    map,
    npcs: npcs.map(({ id, type, x, y, speaker, text, blocking }) => ({ id, type, x, y, speaker, text, blocking })),
    scrapNodes: scrapNodes.map(({ id, x, y, amount, label, collected }) => ({ id, x, y, amount, label, collected })),
  };
}

function applySaveData(data) {
  if (!data?.player || !Array.isArray(data.enemies)) return false;
  Object.assign(player, initialPlayer, data.player);
  enemies.forEach((enemy, index) => {
    const saved = data.enemies[index] ?? {};
    enemy.hp = typeof saved.hp === "number" ? saved.hp : enemy.maxHp;
    enemy.en = typeof saved.en === "number" ? saved.en : initialEnemies[index].en;
    enemy.defeated = Boolean(saved.defeated);
  });
  if (Array.isArray(data.map) && data.map.length === defaultMap.length && data.map.every((row, index) => row.length === defaultMap[index].length)) {
    map = data.map;
    saveCollisionMap();
  }
  if (Array.isArray(data.npcs)) {
    npcs = normalizeNpcLayout(data.npcs);
    saveNpcLayout();
    updateNpcEditor();
  }
  if (Array.isArray(data.scrapNodes)) {
    scrapNodes = data.scrapNodes
      .filter((node) => Number.isInteger(node?.x) && Number.isInteger(node?.y))
      .map((node, index) => ({
        id: typeof node.id === "string" ? node.id : `scrap-loaded-${index}`,
        x: node.x,
        y: node.y,
        amount: Math.max(1, Math.min(9, Number.parseInt(node.amount ?? 1, 10) || 1)),
        label: typeof node.label === "string" ? node.label : "零件点",
        collected: Boolean(node.collected),
      }));
  }
  demoComplete = Boolean(data.demoComplete);
  currentEnemy = null;
  battleLocked = false;
  battleAnim = null;
  mapAnim = null;
  bumpAnim = null;
  heldMove = null;
  queuedMove = null;
  pressedMoveKeys.clear();
  return true;
}

function saveDemo() {
  LEGACY_SAVE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(buildSaveData()));
  addLog("进度已保存。");
}

function loadDemo() {
  try {
    LEGACY_SAVE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    const saved = JSON.parse(localStorage.getItem(SAVE_STORAGE_KEY) || "null");
    if (!applySaveData(saved)) {
      addLog("没有可读取的存档。");
      return;
    }
    setComms("系统", "已读取保存进度。", 0);
    updateUi();
    showMap({ preserveComms: true });
  } catch {
    addLog("存档读取失败。");
  }
}

function resetDemo() {
  localStorage.removeItem(SAVE_STORAGE_KEY);
  LEGACY_SAVE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(COLLISION_STORAGE_KEY);
  localStorage.removeItem(NPC_STORAGE_KEY);
  LEGACY_NPC_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  map = [...defaultMap];
  npcs = cloneDefaultNpcs();
  scrapNodes = cloneDefaultScrapNodes();
  Object.assign(player, initialPlayer);
  enemies.forEach((enemy, index) => Object.assign(enemy, initialEnemies[index]));
  demoComplete = false;
  currentEnemy = null;
  battleLocked = false;
  battleAnim = null;
  showCollisionDebug = false;
  pressedMoveKeys.clear();
  showNpcDebug = false;
  updateNpcEditor();
  setComms("驾驶员 洛辰", "系统复位。游隼上线，重新执行蓝图回收任务。", 0);
  addLog("Demo 已重置。");
  updateUi();
  showMap({ preserveComms: true });
}

function defeatedEnemyCount() {
  return enemies.filter((enemy) => enemy.defeated).length;
}

function remainingEnemyCount() {
  return enemies.length - defeatedEnemyCount();
}

function updateObjectiveText() {
  if (!ui.objective) return;
  if (enemies.length === 0) {
    const remainingScrap = scrapNodes.filter((node) => !node.collected).length;
    ui.objective.textContent = DEV_MODE ? `地图编辑中 / 零件点 ${remainingScrap}` : `寻找零件 ${remainingScrap}`;
    return;
  }
  if (demoComplete) {
    ui.objective.textContent = "Demo 完成";
    return;
  }
  const remaining = remainingEnemyCount();
  ui.objective.textContent = remaining > 0 ? `剩余敌机 ${remaining}` : "返回基地交付蓝图";
}

function completeDemo() {
  if (demoComplete) return;
  demoComplete = true;
  player.hp = player.maxHp;
  player.en = player.maxEn;
  player.credits += 160;
  setComms("基地指挥官", "四块蓝图碎片已经拼合。游隼试作数据回收完成。", 1);
  addLog("Demo 完成：蓝图回收完毕，基地开放后续整备。");
  updateUi();
}

function rememberDirection(dx, dy) {
  facing = dx < 0 ? -1 : dx > 0 ? 1 : facing;
  lastMoveDx = dx;
  lastMoveDy = dy;
}

function move(dx, dy) {
  if (mode !== "map") return;
  rememberDirection(dx, dy);
  if (document.body.classList.contains("panel-open") && sidePanel.dataset.active === "pilot") closePanel();
  if (mapAnim) {
    queuedMove = { dx, dy };
    return;
  }
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (isWall(nx, ny)) {
    queuedMove = null;
    bumpAnim = { dx, dy, start: performance.now(), duration: 140 };
    addLog("装甲撞上废墟墙体，传感器一阵雪花。");
    return;
  }
  const blockedNpc = blockingNpcAt(nx, ny);
  if (blockedNpc) {
    queuedMove = null;
    bumpAnim = { dx, dy, start: performance.now(), duration: 120 };
    dialogOpenNpcId = blockedNpc.id;
    setComms(blockedNpc.speaker, blockedNpc.text, blockedNpc.portrait);
    openPanel("pilot");
    return;
  }

  mapAnim = {
    fromX: player.x,
    fromY: player.y,
    toX: nx,
    toY: ny,
    dx,
    dy,
    start: performance.now(),
    duration: STEP_DURATION,
  };
  player.x = nx;
  player.y = ny;
}

function continueHeldMove() {
  if (mode !== "map" || mapAnim || !heldMove) return;
  move(heldMove.dx, heldMove.dy);
}

function handleArrival() {
  const nx = player.x;
  const ny = player.y;
  const enemy = enemyAt(nx, ny);
  if (enemy) startBattle(enemy);
  if (tileAt(nx, ny) === "B") {
    player.hp = player.maxHp;
    player.en = player.maxEn;
    if (enemies.length > 0 && remainingEnemyCount() === 0) {
      completeDemo();
    } else {
      const message = enemies.length > 0 ? `整备完成。剩余 ${remainingEnemyCount()} 台敌机，带回蓝图碎片。` : "基地整备完成。当前地图没有敌人实例。";
      setComms("基地指挥官", message, 1);
      addLog("基地完成整备：装甲与能量已恢复。");
    }
  }
  if (tileAt(nx, ny) === "s" && player.scrap >= 2) {
    player.scrap -= 2;
    player.maxHp += 10;
    player.hp = player.maxHp;
    setComms("机械师 阿棠", "装甲板重新焊好了，这下抗揍多了。", 2);
    addLog("维修站消耗 2 零件，机体装甲上限 +10。");
  }
  const npc = npcs.find((item) => item.x === nx && item.y === ny);
  if (npc) setComms(npc.speaker, npc.text, npc.portrait);
  collectScrapNode(scrapNodeAt(nx, ny));
  updateUi();
}

function startBattle(enemy) {
  mode = "battle";
  mapAnim = null;
  mapCanvas.classList.add("hidden");
  hangarLayer.classList.add("hidden");
  document.body.classList.remove("map-mode");
  currentEnemy = { ...enemy };
  battleLayer.classList.remove("hidden");
  ui.enemyName.textContent = currentEnemy.name;
  setComms("敌方驾驶员", `${currentEnemy.name} 接入战术频道。`, 3);
  addLog(`${currentEnemy.name} 锁定了你。`);
  updateUi();
  drawBattle();
}

function endBattle(won) {
  const defeatedName = currentEnemy?.name ?? "敌机";
  if (won) {
    const original = enemies.find((enemy) => enemy.name === defeatedName);
    if (original) original.defeated = true;
    const scrapReward = currentEnemy?.training ? 3 : rand(1, 3);
    const creditReward = rand(45, 80);
    if (!currentEnemy?.training) player.wins += 1;
    player.scrap += scrapReward;
    player.credits += creditReward;
    player.level = 1 + Math.floor(player.wins / 2);
    player.maxEn = 60 + player.level * 4;
    player.en = Math.min(player.maxEn, player.en + 24);
    addLog(currentEnemy?.training ? `${defeatedName} 停机，回收训练零件。` : `${defeatedName} 停机，回收蓝图碎片 ${player.wins}/${enemies.length}。`);
    addLog(`战利品：${creditReward} Cr，${scrapReward} 零件。`);
    if (currentEnemy?.training) {
      setComms("驾驶员 洛辰", "训练机停机。带着零件去找老师交付。", 0);
    } else if (remainingEnemyCount() === 0) {
      setComms("驾驶员 洛辰", "四个信号源都熄灭了。回基地交付蓝图碎片。", 0);
    } else {
      setComms("驾驶员 洛辰", `目标清除。还有 ${remainingEnemyCount()} 台敌机在外圈活动。`, 0);
    }
  } else {
    player.hp = Math.ceil(player.maxHp * 0.55);
    player.en = 34;
    player.x = BASE_COORD.x;
    player.y = BASE_COORD.y;
    setComms("基地指挥官", "机体已回收。修复后重新出击，别让蓝图落在废土里。", 1);
    addLog("机体紧急弹射回基地，装甲临时修复。");
  }
  currentEnemy = null;
  battleLocked = false;
  battleAnim = null;
  battleFx = { shake: 0, flash: 0, text: "", kind: "muzzle", x: 438, y: 88 };
  setBattleButtons(false);
  battleLayer.classList.add("hidden");
  updateUi();
  showMap({ preserveComms: true });
}

function playerAction(action) {
  if (mode !== "battle" || !currentEnemy || battleLocked) return;
  player.guard = false;

  if (action === "guard") {
    setBattleButtons(true);
    player.guard = true;
    player.en = Math.min(player.maxEn, player.en + 18);
    startBattleAnim({ actor: "player", kind: "shield", text: "+EN", x: 142, y: 72, duration: 520 });
    addLog("游隼架起盾场，能量回流。");
    updateUi();
    setTimeout(enemyTurn, 560);
    return;
  }

  if (action === "repair") {
    if (player.en < 14) {
      addLog("能量不足，维修核心没有启动。");
      return;
    }
    setBattleButtons(true);
    player.en -= 14;
    const fixed = rand(22, 34);
    player.hp = Math.min(player.maxHp, player.hp + fixed);
    startBattleAnim({ actor: "player", kind: "repair", text: `+${fixed}`, x: 142, y: 72, duration: 560 });
    addLog(`纳米维修回复 ${fixed} 装甲。`);
    updateUi();
    setTimeout(enemyTurn, 600);
    return;
  }

  const weapon = action === "missile" ? { label: "蜂巢导弹", damage: [28, 42], energy: 20, log: "导弹群划过低空。" } : action === "blade" ? { label: "光刃突袭", damage: [20, 31], energy: 10, log: "光刃切开敌方外甲。" } : weapons[player.weapon];
  if (player.en < weapon.energy) {
    addLog(`${weapon.label} 需要更多能量。`);
    return;
  }

  setBattleButtons(true);
  player.en = Math.min(player.maxEn, player.en - weapon.energy + (weapon.energy <= 0 ? 8 : 0));
  const damage = rand(...weapon.damage) + player.level * 2;
  currentEnemy.hp = Math.max(0, currentEnemy.hp - damage);
  const kind = action === "missile" ? "missile" : action === "blade" ? "slash" : player.weapon === "rail" ? "rail" : "muzzle";
  const duration = kind === "slash" ? 900 : kind === "missile" ? 760 : 640;
  startBattleAnim({ actor: "player", target: "enemy", kind, text: `-${damage}`, x: 404, y: 64, duration, shake: 8 });
  addLog(`${weapon.log} 造成 ${damage} 伤害。`);
  updateUi();

  if (currentEnemy.hp <= 0) {
    setTimeout(() => endBattle(true), duration + 140);
    return;
  }
  setTimeout(enemyTurn, duration + 120);
}

function enemyTurn() {
  if (!currentEnemy) return;
  const charged = currentEnemy.en >= 18 && Math.random() > 0.52;
  const raw = charged ? rand(currentEnemy.atk + 9, currentEnemy.atk + 18) : rand(currentEnemy.atk - 3, currentEnemy.atk + 7);
  const damage = Math.max(4, player.guard ? Math.floor(raw * 0.42) : raw);
  currentEnemy.en = charged ? currentEnemy.en - 18 : Math.min(60, currentEnemy.en + 10);
  player.hp = Math.max(0, player.hp - damage);
  startBattleAnim({ actor: "enemy", target: "player", kind: charged ? "explosion" : "muzzle", text: `-${damage}`, x: 186, y: 72, duration: 640, shake: 8 });
  addLog(`${currentEnemy.name}${charged ? "释放重击" : "开火"}，装甲损失 ${damage}。`);
  updateUi();
  if (player.hp <= 0) {
    setTimeout(() => endBattle(false), 760);
  } else {
    setTimeout(() => setBattleButtons(false), 700);
  }
}

function setBattleButtons(disabled) {
  battleLocked = disabled;
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.disabled = disabled;
  });
}

function startBattleAnim({ actor, target = "", kind, text, x, y, duration = 560, shake = 0 }) {
  battleFx = { shake, flash: Math.ceil(duration / 40), text, kind, x, y };
  battleAnim = {
    actor,
    target,
    kind,
    text,
    x,
    y,
    start: performance.now(),
    duration,
  };
}

const battleLayout = {
  topPanel: { x: 34, y: 10, w: 300, h: 64 },
  bottomPanel: { x: 318, y: 286, w: 300, h: 64 },
  playerLane: { y: 78, floor: 176 },
  enemyLane: { y: 202, floor: 284 },
  playerHome: { x: 128, y: 182 },
  enemyHome: { x: 500, y: 274 },
  unitSize: 106,
};

function showHangar() {
  mode = "hangar";
  closePanel();
  battleLayer.classList.add("hidden");
  mapCanvas.classList.add("hidden");
  hangarLayer.classList.remove("hidden");
  document.body.classList.remove("map-mode");
  ui.speech.textContent = "机库待命。检查机体状态后可以直接出击。";
  document.querySelector("#areaLabel").textContent = "基地机库";
  drawHangar();
}

function showMap(options = {}) {
  mode = "map";
  closePanel();
  battleLayer.classList.add("hidden");
  hangarLayer.classList.add("hidden");
  mapCanvas.classList.remove("hidden");
  document.body.classList.add("map-mode");
  document.querySelector("#areaLabel").textContent = "旧城区外围";
  if (!options.preserveComms) {
    setComms("驾驶员 洛辰", "进入外勤地图。找到敌方信号源后接触开战。", 0);
  }
  drawMap();
}

function openPanel(panel) {
  const active = panelTitles[panel] ? panel : "mech";
  sidePanel.dataset.active = active;
  panelTitle.textContent = panelTitles[active];
  document.body.classList.add("panel-open");
}

function closePanel() {
  document.body.classList.remove("panel-open");
  dialogOpenNpcId = null;
}

function launchBattle() {
  const target = enemies.find((enemy) => !enemy.defeated) ?? {
    x: -1,
    y: -1,
    name: "失控训练机",
    hp: 86,
    maxHp: 86,
    en: 36,
    atk: 11,
    defense: 10,
    sprite: 4,
    defeated: false,
    training: true,
  };
  if (!target) {
    setComms("基地指挥官", "敌机信号已经清空。返回基地交付蓝图碎片。", 1);
    addLog("没有可出击目标。");
    showMap({ preserveComms: true });
    return;
  }
  setComms("驾驶员 洛辰", "游隼出击。把战斗压在第一轮。", 0);
  startBattle(target);
}

function repairAtHangar() {
  player.hp = player.maxHp;
  player.en = player.maxEn;
  setComms("机械师 阿棠", "整备完成。能量回路和装甲板都重新校准了。", 2);
  addLog("机库整备完成：装甲与能量已恢复。");
  updateUi();
  drawHangar();
}

function drawHangar() {
  const ctx = hangarMechCtx;
  const now = performance.now();
  ctx.clearRect(0, 0, hangarMechCanvas.width, hangarMechCanvas.height);
  ctx.fillStyle = "#050910";
  ctx.fillRect(0, 0, hangarMechCanvas.width, hangarMechCanvas.height);
  ctx.strokeStyle = "rgba(88, 199, 255, 0.16)";
  for (let x = 0; x < hangarMechCanvas.width; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, hangarMechCanvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < hangarMechCanvas.height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(hangarMechCanvas.width, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#142544";
  ctx.fillRect(22, 130, 196, 16);
  ctx.fillStyle = "#526db2";
  ctx.fillRect(38, 146, 164, 4);
  drawBattleMech(ctx, 120, 88 + Math.sin(now / 360) * 2, 138, 0, 1);
  ctx.fillStyle = "#e6edf1";
  ctx.font = "13px Microsoft YaHei, sans-serif";
  ctx.fillText(`装甲 ${player.hp}/${player.maxHp}`, 14, 20);
  ctx.fillText(`能量 ${player.en}/${player.maxEn}`, 14, 38);
}

function updateUi() {
  ui.credits.textContent = player.credits;
  ui.scrap.textContent = player.scrap;
  ui.wins.textContent = `${player.wins} / ${enemies.length}`;
  updateObjectiveText();
  ui.level.textContent = `Lv.${player.level}`;
  ui.armor.textContent = `${player.hp} / ${player.maxHp}`;
  ui.energyText.textContent = `${player.en} / ${player.maxEn}`;
  ui.weapon.textContent = weapons[player.weapon].label;
  ui.playerHp.max = player.maxHp;
  ui.playerHp.value = player.hp;
  ui.playerEn.max = player.maxEn;
  ui.playerEn.value = player.en;
  if (currentEnemy) {
    ui.enemyHp.max = currentEnemy.maxHp;
    ui.enemyHp.value = currentEnemy.hp;
    ui.enemyEn.max = 60;
    ui.enemyEn.value = currentEnemy.en;
  }
  document.querySelectorAll(".slot").forEach((button) => {
    button.classList.toggle("active", button.dataset.equip === player.weapon);
  });
}

function drawTile(x, y, type, camera) {
  const px = x * TILE - camera.x;
  const py = y * TILE - camera.y;
  const index = tileSprites[type] ?? 0;
  if (drawSprite(mapCtx, assets.tiles, index, 32, px + TILE / 2, py + TILE / 2, TILE, TILE, 1)) return;
  mapCtx.fillStyle = type === "#" ? "#222b3d" : "#6f7fa6";
  mapCtx.fillRect(px, py, TILE, TILE);
}

function drawSprite(ctx, image, index, cell, x, y, w, h, facing = 1) {
  if (!image.complete || !image.naturalWidth) return false;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.drawImage(image, index * cell, 0, cell, cell, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}

function drawBattleMech(ctx, x, y, size, sprite, facing = 1) {
  if (drawSheetSprite(ctx, assets.battleMechs, sprite % 4, Math.floor(sprite / 4), 256, 256, x, y, size, size, facing)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.fillStyle = "#42d6a4";
  ctx.fillRect(-size / 4, -size / 2, size / 2, size);
  ctx.restore();
}

function drawAnchoredBattleMech(ctx, x, footY, size, sprite, facing = 1, flash = false) {
  if (assets.battleMechs.complete && assets.battleMechs.naturalWidth) {
    const col = sprite % 4;
    const row = Math.floor(sprite / 4);
    const drawW = size;
    const drawH = size;
    const dx = Math.round(-drawW / 2);
    const dy = Math.round(-drawH + 9);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(footY));
    ctx.scale(facing, 1);
    ctx.drawImage(
      assets.battleMechs,
      col * 256,
      row * 256,
      256,
      256,
      dx,
      dy,
      drawW,
      drawH
    );
    if (flash) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
      ctx.fillRect(dx, dy, drawW, drawH);
    }
    ctx.restore();
    return;
  }
  drawFallbackMech(ctx, x, footY - size * 0.35, size * 0.72, facing);
}

function drawCharacter(ctx, x, y, sprite, w = 28, h = 28, facing = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.fillStyle = "#101722";
  ctx.fillRect(-w / 2, -h + 2, w, h);
  ctx.fillStyle = sprite === 0 ? "#58c7ff" : "#f0c84b";
  ctx.fillRect(-w / 2 + 4, -h + 6, w - 8, h - 12);
  ctx.fillStyle = "#0a1018";
  ctx.fillRect(-w / 2, -h + 2, w, 2);
  ctx.restore();
}

function drawMapNpc(ctx, x, y, npc) {
  const image = assets[npc.mapSprite];
  if (image?.complete && image.naturalWidth) {
    ctx.drawImage(image, x - 22, y - 26, 44, 44);
    return;
  }
  drawCharacter(ctx, x, y, npc.portrait ?? 0, 30, 32);
}

function drawHero(ctx, x, y, frame, direction = 1) {
  const walk = getHeroWalkFrame(frame, direction);
  if (drawSheetSprite(ctx, assets.pilotMap, walk.col, walk.row, 64, 64, x, y - walk.lift, 44, 44)) return;
  if (drawSheetSprite(ctx, assets.heroWalk, walk.col, walk.row, 32, 48, x, y - 6, 28, 42)) return;
  const face = frame >= 6 && frame <= 8 ? direction : 1;
  if (drawSprite(ctx, assets.heroActions, frame, 32, x, y - 6, 28, 42, face)) return;
  drawCharacter(ctx, x, y, 0);
}

function drawSheetSprite(ctx, image, col, row, cellW, cellH, x, y, w, h, facing = 1) {
  if (!image.complete || !image.naturalWidth) return false;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.drawImage(image, col * cellW, row * cellH, cellW, cellH, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}

function drawEnemyMarker(ctx, x, y, sprite) {
  if (drawBattleMech(ctx, x, y - 2, 48, sprite % 4, -1)) {
    drawAlertMarker(ctx, x, y);
    return;
  }
  drawFallbackMech(ctx, x, y, 36, -1);
  drawAlertMarker(ctx, x, y);
}

function drawFallbackMech(ctx, x, y, size, facing = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.fillStyle = "#101722";
  ctx.fillRect(-size * 0.35, -size * 0.55, size * 0.7, size * 0.62);
  ctx.fillStyle = "#7d8fa8";
  ctx.fillRect(-size * 0.28, -size * 0.48, size * 0.56, size * 0.42);
  ctx.fillStyle = "#58c7ff";
  ctx.fillRect(-size * 0.08, -size * 0.38, size * 0.16, size * 0.08);
  ctx.fillStyle = "#2c3a52";
  ctx.fillRect(-size * 0.44, -size * 0.28, size * 0.18, size * 0.38);
  ctx.fillRect(size * 0.26, -size * 0.28, size * 0.18, size * 0.38);
  ctx.fillStyle = "#0a1018";
  ctx.fillRect(-size * 0.26, size * 0.04, size * 0.18, size * 0.22);
  ctx.fillRect(size * 0.08, size * 0.04, size * 0.18, size * 0.22);
  ctx.restore();
}

function drawAlertMarker(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 98, 80, 0.92)";
  ctx.strokeStyle = "#2a1a18";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - 24);
  ctx.lineTo(x + 5, y - 17);
  ctx.lineTo(x - 5, y - 17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawWreckMarker(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(18, 20, 24, 0.82)";
  ctx.fillRect(-12, -2, 24, 9);
  ctx.fillStyle = "#586072";
  ctx.fillRect(-9, -7, 13, 7);
  ctx.fillStyle = "#263040";
  ctx.fillRect(3, -5, 8, 5);
  ctx.fillStyle = "#58c7ff";
  ctx.fillRect(-7, -5, 3, 2);
  ctx.fillStyle = "rgba(255, 110, 74, 0.78)";
  ctx.fillRect(7, -9, 3, 3);
  ctx.restore();
}

function drawScrapNode(ctx, x, y, node, now) {
  const glow = 0.55 + Math.sin(now / 260 + node.x) * 0.22;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(0, 15, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(88, 199, 255, ${glow})`;
  ctx.fillRect(-8, -10, 16, 12);
  ctx.fillStyle = "#f0c84b";
  ctx.fillRect(-6, -8, 12, 3);
  ctx.fillStyle = "#1d2c42";
  ctx.fillRect(-7, -4, 14, 7);
  ctx.fillStyle = "#58c7ff";
  ctx.fillRect(-3, -2, 6, 3);
  ctx.strokeStyle = "#08101d";
  ctx.strokeRect(-8.5, -10.5, 17, 13);
  ctx.fillStyle = "rgba(255, 239, 152, 0.9)";
  ctx.font = "10px Microsoft YaHei, sans-serif";
  ctx.fillText(`+${node.amount}`, 7, -14);
  ctx.restore();
}

function drawActorShadow(ctx, x, y, w = 24, h = 7) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.beginPath();
  ctx.ellipse(x, y + 15, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(88, 199, 255, 0.1)";
  ctx.fillRect(x - w / 4, y + 14, w / 2, 1);
  ctx.restore();
}

function drawEffect(ctx, kind, x, y, size, facing = 1) {
  const effectIndex = { muzzle: 0, slash: 1, missile: 2, explosion: 3, shield: 4, repair: 5, rail: 6, hit: 7 }[kind] ?? 0;
  drawSprite(ctx, assets.effects, effectIndex, 64, x, y, size, size, facing);
}

function drawPortrait(index) {
  portraitCtx.clearRect(0, 0, portraitCanvas.width, portraitCanvas.height);
  portraitCtx.fillStyle = "#0f151b";
  portraitCtx.fillRect(0, 0, 64, 64);
  if (index === 0 && drawSprite(portraitCtx, assets.conceptPortrait, 0, 128, 32, 32, 64, 64, 1)) return;
  if (index === 0 && drawSprite(portraitCtx, assets.heroPortrait, 0, 64, 32, 32, 64, 64, 1)) return;
  drawSprite(portraitCtx, assets.portraits, index, 64, 32, 32, 64, 64, 1);
}

function drawMap() {
  const now = performance.now();
  mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
  const playerPos = getPlayerDrawPosition(now);
  const camera = getCamera(playerPos);
  if (assets.mapBg.complete && assets.mapBg.naturalWidth) {
    mapCtx.drawImage(assets.mapBg, -camera.x, -camera.y, mapCanvas.width, mapCanvas.height);
  } else {
    for (let y = 0; y < map.length; y += 1) {
      for (let x = 0; x < map[y].length; x += 1) {
        drawTile(x, y, map[y][x], camera);
      }
    }
  }
  if (showCollisionDebug) drawCollisionOverlay(camera);
  if (showNpcDebug) drawNpcOverlay(camera);
  if (showScrapDebug) drawScrapOverlay(camera);
  const actors = [];
  scrapNodes.filter((node) => !node.collected).forEach((node) => {
    const x = node.x * TILE + TILE / 2 - camera.x;
    const y = node.y * TILE + TILE / 2 + 4 - camera.y;
    actors.push({
      y,
      draw: () => drawScrapNode(mapCtx, x, y, node, now),
    });
  });
  if (!DEV_MODE || showEnemyMarkers) enemies.forEach((enemy) => {
    const x = enemy.x * TILE + TILE / 2 - camera.x;
    const y = enemy.y * TILE + TILE / 2 + 4 - camera.y;
    actors.push({
      y,
      draw: () => {
        if (enemy.defeated) {
          drawActorShadow(mapCtx, x, y, 26, 7);
          drawWreckMarker(mapCtx, x, y + 7);
          return;
        }
        const bob = Math.sin(now / 280 + enemy.x) * 1.2;
        drawActorShadow(mapCtx, x, y, 30, 8);
        drawEnemyMarker(mapCtx, x, y + bob, enemy.sprite);
      },
    });
  });
  npcs.forEach((npc) => {
    const x = npc.x * TILE + TILE / 2 - camera.x;
    const y = npc.y * TILE + TILE / 2 + 4 - camera.y;
    actors.push({
      y,
      draw: () => {
        drawActorShadow(mapCtx, x, y, 24, 7);
        drawMapNpc(mapCtx, x, y, npc);
      },
    });
  });
  actors.push({
    y: playerPos.y - camera.y,
    draw: () => {
      drawActorShadow(mapCtx, playerPos.x - camera.x, playerPos.y - camera.y, 28, 8);
      drawHero(mapCtx, playerPos.x - camera.x, playerPos.y - camera.y, playerPos.frame, facing);
    },
  });
  actors.sort((a, b) => a.y - b.y).forEach((actor) => actor.draw());
  mapCtx.fillStyle = "rgba(16, 19, 24, 0.66)";
  const help = showNpcDebug
    ? `NPC 摆放：${npcs.length} 个 / 点击放置 / Shift 删除`
    : showScrapDebug
      ? `零件摆放：${scrapNodes.length} 个 / 点击放置 / Shift 删除`
    : showCollisionDebug
      ? "碰撞编辑：点击可走 / Shift 不可走 / R 重置"
      : DEV_MODE
        ? `WASD 移动 / E 对话或回收 / N NPC / M 零件 / C 碰撞`
        : "WASD 移动 / E 对话或回收";
  const hintWidth = showNpcDebug ? 330 : showScrapDebug ? 330 : showCollisionDebug ? 330 : DEV_MODE ? 430 : 236;
  mapCtx.fillRect(10, 10, hintWidth, 22);
  mapCtx.fillStyle = "#e6edf1";
  mapCtx.font = "12px Microsoft YaHei, sans-serif";
  mapCtx.fillText(help, 18, 25);
}

function drawCollisionOverlay(camera) {
  mapCtx.save();
  mapCtx.font = "10px Consolas, monospace";
  mapCtx.textBaseline = "top";
  for (let y = 0; y < map.length; y += 1) {
    for (let x = 0; x < map[y].length; x += 1) {
      const type = map[y][x];
      const px = x * TILE - camera.x;
      const py = y * TILE - camera.y;
      const isBlocked = type === "#";
      const isEvent = type !== "." && type !== "#";
      mapCtx.fillStyle = isBlocked ? "rgba(255, 62, 72, 0.34)" : isEvent ? "rgba(255, 220, 92, 0.34)" : "rgba(86, 255, 150, 0.16)";
      mapCtx.fillRect(px, py, TILE, TILE);
      mapCtx.strokeStyle = isBlocked ? "rgba(255, 120, 120, 0.82)" : "rgba(120, 255, 190, 0.36)";
      mapCtx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      if (isBlocked || isEvent) {
        mapCtx.fillStyle = "rgba(255, 255, 255, 0.86)";
        mapCtx.fillText(type, px + 3, py + 3);
      }
    }
  }
  mapCtx.restore();
}

function drawNpcOverlay(camera) {
  mapCtx.save();
  mapCtx.font = "11px Microsoft YaHei, sans-serif";
  mapCtx.textBaseline = "top";
  npcs.forEach((npc) => {
    const px = npc.x * TILE - camera.x;
    const py = npc.y * TILE - camera.y;
    const active = npc.type === selectedNpcType;
    mapCtx.strokeStyle = active ? "#ffef98" : "rgba(88, 199, 255, 0.8)";
    mapCtx.lineWidth = active ? 2 : 1;
    mapCtx.strokeRect(px + 2.5, py + 2.5, TILE - 5, TILE - 5);
    mapCtx.fillStyle = "rgba(8, 16, 29, 0.82)";
    mapCtx.fillRect(px + 1, py + 1, TILE - 2, 12);
    mapCtx.fillStyle = "#e6edf1";
    mapCtx.fillText(npc.type === "teacher" ? "老师" : npc.type, px + 4, py + 2);
  });
  mapCtx.restore();
}

function drawScrapOverlay(camera) {
  mapCtx.save();
  mapCtx.font = "11px Microsoft YaHei, sans-serif";
  mapCtx.textBaseline = "top";
  scrapNodes.forEach((node) => {
    const px = node.x * TILE - camera.x;
    const py = node.y * TILE - camera.y;
    mapCtx.strokeStyle = node.collected ? "rgba(120, 120, 120, 0.75)" : "#ffef98";
    mapCtx.lineWidth = 2;
    mapCtx.strokeRect(px + 3.5, py + 3.5, TILE - 7, TILE - 7);
    mapCtx.fillStyle = node.collected ? "rgba(36, 36, 36, 0.78)" : "rgba(8, 16, 29, 0.84)";
    mapCtx.fillRect(px + 1, py + 1, TILE - 2, 12);
    mapCtx.fillStyle = node.collected ? "#b8b8b8" : "#ffef98";
    mapCtx.fillText(`+${node.amount}`, px + 5, py + 2);
  });
  mapCtx.restore();
}

function getPlayerDrawPosition(now) {
  let x = player.x * TILE + TILE / 2;
  let y = player.y * TILE + TILE / 2 + 4;

  if (mapAnim) {
    const t = Math.min(1, (now - mapAnim.start) / mapAnim.duration);
    const eased = t;
    x = (mapAnim.fromX + (mapAnim.toX - mapAnim.fromX) * eased) * TILE + TILE / 2;
    y = (mapAnim.fromY + (mapAnim.toY - mapAnim.fromY) * eased) * TILE + TILE / 2 + 4;
    if (t >= 1) {
      mapAnim = null;
      handleArrival();
      if (mode === "map" && queuedMove) {
        const next = queuedMove;
        queuedMove = null;
        move(next.dx, next.dy);
      } else {
        queuedMove = null;
        continueHeldMove();
      }
    }
  } else {
    y += 0;
  }

  if (bumpAnim) {
    const t = Math.min(1, (now - bumpAnim.start) / bumpAnim.duration);
    const push = Math.sin(t * Math.PI) * 5;
    x += bumpAnim.dx * push;
    y += bumpAnim.dy * push;
    if (t >= 1) bumpAnim = null;
  }

  return { x, y, frame: getHeroFrame(now) };
}

function getCamera(playerPos) {
  return { x: 0, y: 0 };
}

function getMapTileFromPointer(event) {
  const rect = mapCanvas.getBoundingClientRect();
  const scaleX = mapCanvas.width / rect.width;
  const scaleY = mapCanvas.height / rect.height;
  const playerPos = {
    x: player.x * TILE + TILE / 2,
    y: player.y * TILE + TILE / 2 + 4,
  };
  const camera = getCamera(playerPos);
  const worldX = (event.clientX - rect.left) * scaleX + camera.x;
  const worldY = (event.clientY - rect.top) * scaleY + camera.y;
  return {
    x: Math.floor(worldX / TILE),
    y: Math.floor(worldY / TILE),
  };
}

function getHeroFrame(now) {
  const moving = !!mapAnim;
  const progress = moving ? Math.min(0.999, Math.max(0, (now - mapAnim.start) / mapAnim.duration)) : 0;
  const step = moving ? Math.floor(progress * 4) : 0;
  const row = getHeroDirectionRow();
  return row * 100 + step;
}

function getHeroWalkFrame(frame, direction) {
  const cycle = [0, 1, 0, 3];
  const liftCycle = [0, 1, 0, 1];
  if (frame >= 300) {
    const step = frame - 300;
    return { row: 3, col: cycle[step] ?? 0, lift: liftCycle[step] ?? 0 };
  }
  if (frame >= 200) {
    const step = frame - 200;
    return { row: 2, col: cycle[step] ?? 0, lift: liftCycle[step] ?? 0 };
  }
  if (frame >= 100) {
    const step = frame - 100;
    return { row: 1, col: cycle[step] ?? 0, lift: liftCycle[step] ?? 0 };
  }
  const step = frame;
  return { row: 0, col: cycle[step] ?? 0, lift: liftCycle[step] ?? 0 };
}

function getHeroDirectionRow() {
  if (lastMoveDy < 0) return 3;
  if (lastMoveDy > 0) return 0;
  if (lastMoveDx < 0 || facing < 0) return 1;
  if (lastMoveDx > 0 || facing > 0) return 2;
  return 0;
}

function drawBattle() {
  const now = performance.now();
  battleCtx.clearRect(0, 0, battleCanvas.width, battleCanvas.height);
  const shake = battleFx.shake > 0 ? rand(-battleFx.shake, battleFx.shake) : 0;
  drawBattleStage(battleCtx);
  drawBattleStatusPanel(battleCtx, battleLayout.topPanel, {
    name: "RX-17 游隼",
    level: player.level,
    hp: player.hp,
    maxHp: player.maxHp,
    en: player.en,
    maxEn: player.maxEn,
    atk: player.atk + player.level * 2,
    defense: player.defense,
    weapon: weapons[player.weapon].label,
    status: player.guard ? "防御中" : "正常",
  });
  if (currentEnemy) {
    drawBattleStatusPanel(battleCtx, battleLayout.bottomPanel, {
      name: currentEnemy.name,
      level: currentEnemy.level ?? 1,
      hp: currentEnemy.hp,
      maxHp: currentEnemy.maxHp,
      en: currentEnemy.en,
      maxEn: currentEnemy.maxEn ?? 60,
      atk: currentEnemy.atk,
      defense: currentEnemy.defense ?? 8,
      weapon: currentEnemy.training ? "训练武装" : "敌机武装",
      status: battleAnim?.target === "enemy" ? "受击" : "正常",
    });
  }
  const pose = getBattlePose(now);
  drawBattleUnit(battleCtx, pose.playerX + shake, pose.playerY, battleLayout.unitSize, getPlayerMechaFrame(), 1, pose.playerAlpha, pose.playerFlash);
  if (currentEnemy) drawBattleUnit(battleCtx, pose.enemyX - shake, pose.enemyY, battleLayout.unitSize, getEnemyMechaFrame(), -1, pose.enemyAlpha, pose.enemyFlash);
  if (battleAnim) {
    const progress = Math.min(1, (now - battleAnim.start) / battleAnim.duration);
    drawBattleActionEffect(battleCtx, battleAnim, progress);
    const float = Math.sin(progress * Math.PI) * 8 + progress * 18;
    const textPoint = battleDamagePoint(battleAnim, progress);
    battleCtx.fillStyle = "#ffef98";
    battleCtx.strokeStyle = "#241510";
    battleCtx.lineWidth = 3;
    battleCtx.font = "bold 22px Segoe UI, sans-serif";
    battleCtx.strokeText(battleAnim.text, textPoint.x, textPoint.y - float);
    battleCtx.fillText(battleAnim.text, textPoint.x, textPoint.y - float);
    if (progress >= 1) battleAnim = null;
  }
  battleFx.shake = Math.max(0, battleFx.shake - 1);
}

function drawBattleStage(ctx) {
  if (assets.battleField.complete && assets.battleField.naturalWidth) {
    ctx.drawImage(assets.battleField, 0, 0, battleCanvas.width, battleCanvas.height);
    ctx.fillStyle = "rgba(3, 8, 18, 0.2)";
    ctx.fillRect(0, 0, battleCanvas.width, battleCanvas.height);
    drawBattleLaneFocus(ctx);
    return;
  }
  ctx.fillStyle = "#253848";
  ctx.fillRect(0, 0, battleCanvas.width, battleCanvas.height);
  ctx.fillStyle = "#384c5d";
  ctx.fillRect(0, 70, battleCanvas.width, 92);
  ctx.fillRect(0, 196, battleCanvas.width, 92);
  ctx.fillStyle = "#07101a";
  ctx.fillRect(0, 176, battleCanvas.width, 12);
  drawBattleLaneFocus(ctx);
}

function drawBattleLaneFocus(ctx) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
  ctx.fillRect(0, battleLayout.playerLane.y + 18, battleCanvas.width, 64);
  ctx.fillRect(0, battleLayout.enemyLane.y + 6, battleCanvas.width, 70);
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.fillRect(0, 0, battleCanvas.width, battleLayout.topPanel.y + battleLayout.topPanel.h + 2);
  ctx.fillRect(0, battleLayout.bottomPanel.y + battleLayout.bottomPanel.h + 1, battleCanvas.width, battleCanvas.height);
  ctx.strokeStyle = "rgba(88, 199, 255, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, battleLayout.playerHome.y - 3);
  ctx.lineTo(battleCanvas.width, battleLayout.playerHome.y - 3);
  ctx.moveTo(0, battleLayout.enemyHome.y - 3);
  ctx.lineTo(battleCanvas.width, battleLayout.enemyHome.y - 3);
  ctx.stroke();
  ctx.restore();
}

function drawBattleStatusPanel(ctx, box, unit) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.fillRect(box.x + 4, box.y + 4, box.w, box.h);
  ctx.fillStyle = "rgba(57, 64, 196, 0.9)";
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.fillStyle = "rgba(104, 128, 255, 0.22)";
  ctx.fillRect(box.x + 5, box.y + 5, box.w - 10, 10);
  ctx.strokeStyle = "#eef4ff";
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);
  ctx.strokeStyle = "#252b79";
  ctx.lineWidth = 1;
  ctx.strokeRect(box.x + 4.5, box.y + 4.5, box.w - 9, box.h - 9);

  ctx.fillStyle = "#fff4a0";
  ctx.font = "bold 14px Microsoft YaHei, sans-serif";
  drawBattleText(ctx, `${unit.name}  Lv ${unit.level}`, box.x + 10, box.y + 17, "#fff4a0");

  ctx.font = "bold 11px Microsoft YaHei, sans-serif";
  drawBattleText(ctx, `装甲 ${unit.hp}/${unit.maxHp}`, box.x + 10, box.y + 34, "#ffffff");
  drawMiniBar(ctx, box.x + 92, box.y + 26, 86, 7, unit.hp / unit.maxHp, "#ff6e4a");
  drawBattleText(ctx, `能量 ${unit.en}/${unit.maxEn}`, box.x + 10, box.y + 48, "#bcd7ff");
  drawMiniBar(ctx, box.x + 92, box.y + 40, 86, 7, unit.en / unit.maxEn, "#58c7ff");
  drawBattleText(ctx, `攻 ${unit.atk}`, box.x + 194, box.y + 34, "#eef4ff");
  drawBattleText(ctx, `防 ${unit.defense}`, box.x + 244, box.y + 34, "#eef4ff");
  drawBattleText(ctx, `状态 ${unit.status}`, box.x + 194, box.y + 48, unit.status === "正常" ? "#d9f7ff" : "#ffef98");
  drawBattleText(ctx, `武器 ${unit.weapon}`, box.x + 10, box.y + 60, "#ffffff");
  ctx.restore();
}

function drawBattleText(ctx, text, x, y, color) {
  const px = Math.round(x);
  const py = Math.round(y);
  ctx.fillStyle = "rgba(15, 18, 52, 0.88)";
  ctx.fillText(text, px + 1, py + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, px, py);
}

function drawMiniBar(ctx, x, y, w, h, ratio, color) {
  const value = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  ctx.fillStyle = "#070b18";
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
  ctx.strokeStyle = "#111f48";
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, w - 1, h - 1);
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x + 1), Math.round(y + 1), Math.max(0, Math.round((w - 2) * value)), h - 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.34)";
  ctx.fillRect(Math.round(x + 1), Math.round(y + 1), Math.max(0, Math.round((w - 2) * value)), 1);
}

function getPlayerMechaFrame() {
  if (!battleAnim || battleAnim.actor !== "player") return 0;
  if (battleAnim.kind === "slash") return 3;
  if (["muzzle", "missile", "rail"].includes(battleAnim.kind)) return 4;
  if (["shield", "repair"].includes(battleAnim.kind)) return 6;
  return 1;
}

function getEnemyMechaFrame() {
  const idleFrame = currentEnemy?.sprite ?? 1;
  if (!battleAnim) return idleFrame;
  if (battleAnim.target === "enemy") return 5;
  if (battleAnim.actor === "enemy") return battleAnim.kind === "explosion" ? 3 : 4;
  return idleFrame;
}

function getBattlePose(now) {
  const idle = Math.sin(now / 420) * 1.25;
  const pose = {
    playerX: battleLayout.playerHome.x,
    playerY: battleLayout.playerHome.y + idle,
    enemyX: battleLayout.enemyHome.x,
    enemyY: battleLayout.enemyHome.y - idle,
    playerAlpha: 1,
    enemyAlpha: 1,
    playerFlash: false,
    enemyFlash: false,
  };
  if (!battleAnim) return pose;

  const t = Math.min(1, (now - battleAnim.start) / battleAnim.duration);
  if (battleAnim.actor === "player" && battleAnim.kind === "slash") {
    if (t < 0.16) {
      pose.playerX = battleLayout.playerHome.x - Math.sin((t / 0.16) * Math.PI) * 10;
      pose.playerY = battleLayout.playerHome.y + idle;
    } else if (t < 0.44) {
      pose.playerX = lerp(battleLayout.playerHome.x + 4, 536, easeOut((t - 0.16) / 0.28));
      pose.playerY = battleLayout.playerHome.y - Math.sin(((t - 0.16) / 0.28) * Math.PI) * 5;
    } else if (t < 0.72) {
      pose.playerX = lerp(126, battleLayout.enemyHome.x - 18, easeOut((t - 0.44) / 0.28));
      pose.playerY = battleLayout.enemyHome.y;
    } else {
      pose.playerX = lerp(battleLayout.enemyHome.x - 18, battleLayout.playerHome.x, easeInOut((t - 0.72) / 0.28));
      pose.playerY = lerp(battleLayout.enemyHome.y, battleLayout.playerHome.y, easeInOut((t - 0.72) / 0.28));
    }
  } else if (battleAnim.actor === "player" && ["muzzle", "missile", "rail"].includes(battleAnim.kind)) {
    pose.playerX += Math.sin(t * Math.PI) * 7;
  } else if (battleAnim.actor === "enemy") {
    pose.enemyX -= Math.sin(t * Math.PI) * 8;
  }
  if (battleAnim.target === "enemy") {
    const hit = t > 0.56 && t < 0.86;
    pose.enemyX += hit ? Math.sin(t * Math.PI * 10) * 3 : 0;
    pose.enemyFlash = hit && Math.floor(t * 26) % 2 === 0;
  }
  if (battleAnim.target === "player") {
    const hit = t > 0.45 && t < 0.78;
    pose.playerX += hit ? Math.sin(t * Math.PI * 10) * 3 : 0;
    pose.playerFlash = hit && Math.floor(t * 26) % 2 === 0;
  }
  return pose;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function drawBattleActionEffect(ctx, anim, progress) {
  if (anim.kind === "slash") {
    if (progress > 0.18 && progress < 0.72) {
      drawBattleAfterimage(ctx, progress);
    }
    const x = lerp(150, battleLayout.enemyHome.x - 26, easeOut(Math.min(1, Math.max(0, (progress - 0.46) / 0.28))));
    const y = battleLayout.enemyHome.y - battleLayout.unitSize * 0.46;
    if (progress > 0.54 && progress < 0.86) {
      drawEffect(ctx, "slash", x, y, 86, 1);
      ctx.strokeStyle = "rgba(88, 255, 255, 0.78)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x - 42, y - 28);
      ctx.lineTo(x + 38, y + 24);
      ctx.stroke();
    }
    return;
  }
  if (["muzzle", "rail", "missile"].includes(anim.kind)) {
    const start = { x: battleLayout.playerHome.x + 48, y: battleLayout.playerHome.y - battleLayout.unitSize * 0.44 };
    const end = { x: battleLayout.enemyHome.x - 52, y: battleLayout.enemyHome.y - battleLayout.unitSize * 0.46 };
    const fireT = Math.min(1, Math.max(0, (progress - 0.12) / 0.72));
    const x = lerp(start.x, end.x, easeOut(fireT));
    const y = lerp(start.y, end.y, easeOut(fireT));
    ctx.save();
    if (progress < 0.2) drawEffect(ctx, "hit", start.x + 4, start.y, 34 + progress * 80, 1);
    ctx.strokeStyle = anim.kind === "rail" ? "#58c7ff" : "#ffef98";
    ctx.lineWidth = anim.kind === "rail" ? 5 : 3;
    ctx.beginPath();
    ctx.moveTo(Math.max(start.x, x - 54), y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = anim.kind === "missile" ? "#ff6e4a" : "#ffffff";
    if (progress > 0.1 && progress < 0.92) ctx.fillRect(x - 8, y - 3, 16, 6);
    ctx.restore();
    if (progress > 0.72) drawEffect(ctx, anim.kind === "missile" ? "explosion" : "hit", end.x + 18, end.y + 8, 78, 1);
    return;
  }
  const pulse = 72 + Math.sin(progress * Math.PI) * 16;
  drawEffect(ctx, anim.kind, anim.x, anim.y, pulse, anim.x > 300 ? 1 : -1);
}

function battleDamagePoint(anim, progress) {
  if (anim.target === "enemy") return { x: battleLayout.enemyHome.x - 24, y: battleLayout.enemyHome.y - battleLayout.unitSize * 0.78 };
  if (anim.target === "player") return { x: battleLayout.playerHome.x + 18, y: battleLayout.playerHome.y - battleLayout.unitSize * 0.78 };
  return { x: anim.x + 28, y: anim.y - 8 };
}

function drawBattleAfterimage(ctx, progress) {
  const ghostT = Math.min(1, Math.max(0, (progress - 0.18) / 0.42));
  const x = lerp(battleLayout.playerHome.x, battleLayout.enemyHome.x - 26, ghostT);
  const y = progress < 0.46 ? battleLayout.playerHome.y : battleLayout.enemyHome.y;
  ctx.save();
  ctx.globalAlpha = 0.18 * (1 - ghostT);
  drawAnchoredBattleMech(ctx, x - 24, y, battleLayout.unitSize, getPlayerMechaFrame(), 1, true);
  ctx.restore();
}

function drawBattleUnit(ctx, x, footY, size, sprite, direction, alpha, flash = false) {
  ctx.save();
  ctx.globalAlpha = alpha;
  drawBattleShadow(ctx, x, footY, size);
  drawAnchoredBattleMech(ctx, x, footY, size, sprite, direction, flash);
  ctx.restore();
}

function drawBattleShadow(ctx, x, footY, size) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.ellipse(x, footY - 5, size * 0.34, size * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const moveDirections = {
  arrowup: [0, -1],
  w: [0, -1],
  arrowdown: [0, 1],
  s: [0, 1],
  arrowleft: [-1, 0],
  a: [-1, 0],
  arrowright: [1, 0],
  d: [1, 0],
};

function isUiInputTarget(target) {
  return Boolean(target?.closest?.("input, select, textarea, button"));
}

function syncHeldMoveFromPressedKeys() {
  const keys = [...pressedMoveKeys];
  const key = keys[keys.length - 1];
  if (!key) {
    heldMove = null;
    return;
  }
  const direction = moveDirections[key];
  heldMove = { dx: direction[0], dy: direction[1], key };
  rememberDirection(direction[0], direction[1]);
}

document.addEventListener("keydown", (event) => {
  if (isUiInputTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  const direction = moveDirections[key];
  if (!direction) return;
  event.preventDefault();
  if (pressedMoveKeys.has(key)) return;
  pressedMoveKeys.add(key);
  syncHeldMoveFromPressedKeys();
  move(direction[0], direction[1]);
});

document.addEventListener("keyup", (event) => {
  if (isUiInputTarget(event.target)) return;
  const key = event.key.toLowerCase();
  if (!moveDirections[key]) return;
  event.preventDefault();
  pressedMoveKeys.delete(key);
  if (heldMove?.key === key) syncHeldMoveFromPressedKeys();
});

window.addEventListener("blur", () => {
  pressedMoveKeys.clear();
  heldMove = null;
  queuedMove = null;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePanel();
  if (!isUiInputTarget(event.target) && ["e", "enter", " "].includes(event.key.toLowerCase())) {
    if (interactWithNpc()) event.preventDefault();
  }
  if (DEV_MODE && event.key.toLowerCase() === "c") {
    showCollisionDebug = !showCollisionDebug;
    if (showCollisionDebug) {
      showNpcDebug = false;
      showScrapDebug = false;
    }
    updateNpcEditor();
    addLog(showCollisionDebug ? "碰撞调试已开启。" : "碰撞调试已关闭。");
  }
  if (DEV_MODE && event.key.toLowerCase() === "n") {
    showNpcDebug = !showNpcDebug;
    if (showNpcDebug) {
      showCollisionDebug = false;
      showScrapDebug = false;
    }
    if (!showNpcDebug) npcEraseMode = false;
    updateNpcEditor();
    addLog(showNpcDebug ? "NPC 摆放已开启。" : "NPC 摆放已关闭。");
  }
  if (DEV_MODE && event.key.toLowerCase() === "m") {
    showScrapDebug = !showScrapDebug;
    if (showScrapDebug) {
      showCollisionDebug = false;
      showNpcDebug = false;
    }
    if (!showScrapDebug) scrapEraseMode = false;
    updateNpcEditor();
    addLog(showScrapDebug ? "零件摆放已开启。" : "零件摆放已关闭。");
  }
  if (DEV_MODE && showCollisionDebug && event.key.toLowerCase() === "r") resetCollisionMap();
});

mapCanvas.addEventListener("pointerdown", (event) => {
  if (mode === "map" && (!DEV_MODE || (!showCollisionDebug && !showNpcDebug && !showScrapDebug))) {
    if (document.body.classList.contains("panel-open") && sidePanel.dataset.active === "pilot") closePanel();
    return;
  }
  if (!DEV_MODE || mode !== "map" || (!showCollisionDebug && !showNpcDebug && !showScrapDebug)) return;
  event.preventDefault();
  const { x, y } = getMapTileFromPointer(event);
  if (showScrapDebug) {
    if (event.shiftKey || scrapEraseMode) {
      removeScrapNodeAt(x, y);
    } else {
      placeScrapNode(x, y);
    }
    return;
  }
  if (showNpcDebug) {
    if (event.shiftKey || npcEraseMode) {
      removeNpcAt(x, y);
    } else {
      const existingNpc = npcAt(x, y);
      if (existingNpc && !event.ctrlKey) {
        selectNpcInstance(existingNpc);
      } else {
        placeNpcInstance(x, y);
      }
    }
    return;
  }
  setCollisionTile(x, y, event.shiftKey ? "#" : ".");
  addLog(event.shiftKey ? `已设为不可走：${x}, ${y}` : `已设为可走：${x}, ${y}`);
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => playerAction(button.dataset.action));
});

document.querySelectorAll("[data-equip]").forEach((button) => {
  button.addEventListener("click", () => {
    const equip = button.dataset.equip;
    if (equip === "rail" && player.credits < 160) {
      addLog("磁轨炮需要 160 Cr 才能挂载。");
      return;
    }
    if (equip === "repair" && player.scrap < 2) {
      addLog("维修核心需要 2 零件。");
      return;
    }
    player.weapon = equip;
    addLog(`已切换武器：${weapons[equip].label}。`);
    updateUi();
  });
});

document.querySelectorAll("[data-screen]").forEach((button) => {
  button.addEventListener("click", () => {
    const screen = button.dataset.screen;
    if (screen === "battle") launchBattle();
    if (screen === "map") showMap();
    if (screen === "hangar") showHangar();
    if (screen === "repair") repairAtHangar();
  });
});

document.querySelectorAll("button[data-panel]").forEach((button) => {
  button.addEventListener("click", () => openPanel(button.dataset.panel));
});

document.querySelectorAll("[data-demo-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.demoAction;
    if (action === "save") saveDemo();
    if (action === "load") loadDemo();
    if (action === "reset") resetDemo();
    updateUi();
  });
});

document.querySelectorAll("[data-dev-action]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!DEV_MODE) return;
    const action = button.dataset.devAction;
    if (action === "collision-mode") {
      showCollisionDebug = !showCollisionDebug;
      if (showCollisionDebug) {
        showNpcDebug = false;
        showScrapDebug = false;
      }
      addLog(showCollisionDebug ? "碰撞编辑已开启。" : "碰撞编辑已关闭。");
    }
    if (action === "npc-mode") {
      showNpcDebug = !showNpcDebug;
      if (showNpcDebug) {
        showCollisionDebug = false;
        showScrapDebug = false;
      }
      if (!showNpcDebug) npcEraseMode = false;
      addLog(showNpcDebug ? "NPC 摆放已开启。" : "NPC 摆放已关闭。");
    }
    if (action === "scrap-mode") {
      showScrapDebug = !showScrapDebug;
      if (showScrapDebug) {
        showCollisionDebug = false;
        showNpcDebug = false;
      }
      if (!showScrapDebug) scrapEraseMode = false;
      addLog(showScrapDebug ? "零件摆放已开启。" : "零件摆放已关闭。");
    }
    if (action === "collision-reset") resetCollisionMap();
    if (action === "npc-erase-mode") {
      npcEraseMode = !npcEraseMode;
      addLog(npcEraseMode ? "NPC 擦除已开启。" : "NPC 擦除已关闭。");
    }
    if (action === "npc-preview") previewSelectedNpcText();
    if (action === "npc-save-text") saveSelectedNpcText();
    if (action === "npc-clear") clearNpcLayout();
    if (action === "npc-reset") resetNpcLayout();
    if (action === "scrap-erase-mode") {
      scrapEraseMode = !scrapEraseMode;
      addLog(scrapEraseMode ? "零件擦除已开启。" : "零件擦除已关闭。");
    }
    if (action === "scrap-clear") clearScrapNodes();
    if (action === "scrap-reset") resetScrapNodes();
    updateNpcEditor();
  });
});

document.querySelectorAll("[data-panel-close]").forEach((button) => {
  button.addEventListener("click", closePanel);
});

document.querySelectorAll("[data-move]").forEach((button) => {
  const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const direction = directions[button.dataset.move];
  const start = (event) => {
    event.preventDefault();
    heldMove = { dx: direction[0], dy: direction[1], key: `pad-${button.dataset.move}` };
    rememberDirection(direction[0], direction[1]);
    move(direction[0], direction[1]);
  };
  const stop = (event) => {
    event.preventDefault();
    if (heldMove?.key === `pad-${button.dataset.move}`) heldMove = null;
  };
  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointerleave", stop);
  button.addEventListener("pointercancel", stop);
});

function loop() {
  if (mode === "hangar") drawHangar();
  if (mode === "map") drawMap();
  if (mode === "battle") drawBattle();
  requestAnimationFrame(loop);
}

addLog("游隼上线。清理四台敌机，回收蓝图碎片。");
initDevTools();
updateUi();
showMap();
loop();
