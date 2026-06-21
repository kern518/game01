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
};

const assets = {
  tiles: loadImage("assets/tiles-scifi-rpg.png"),
  mapBg: loadImage("assets/map-background-large.png"),
  mapMechs: loadImage("assets/map-mechs.png"),
  battleMechs: loadImage("assets/mecha-sd-battle.png"),
  heroActions: loadImage("assets/hero-actions.png"),
  heroWalk: loadImage("assets/hero-walk-sheet.png"),
  pilotMap: loadImage("assets/pilot-rpg-map-downfix.png"),
  characters: loadImage("assets/characters.png"),
  portraits: loadImage("assets/portraits.png"),
  heroPortrait: loadImage("assets/hero-portrait.png"),
  conceptPortrait: loadImage("assets/pilot-concept-portrait.png"),
  effects: loadImage("assets/effects.png"),
  icons: loadImage("assets/ui-icons.png"),
  battleBg: loadImage("assets/battle-bg.png"),
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
const STEP_DURATION = 165;
const COLLISION_STORAGE_KEY = "mechaStorm.collisionMap.v1";
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

const enemies = [
  { x: 20, y: 3, name: "獠牙巡逻机", hp: 72, maxHp: 72, en: 28, atk: 13, sprite: 1, defeated: false },
  { x: 3, y: 8, name: "废土盾卫", hp: 96, maxHp: 96, en: 22, atk: 11, sprite: 2, defeated: false },
  { x: 23, y: 9, name: "蜂群炮艇", hp: 64, maxHp: 64, en: 42, atk: 15, sprite: 3, defeated: false },
  { x: 24, y: 7, name: "黑匣子原型机", hp: 128, maxHp: 128, en: 48, atk: 17, sprite: 4, defeated: false },
];

const npcs = [
  { x: 3, y: 5, sprite: 1, speaker: "基地指挥官", text: "旧城区还有四台敌机，把蓝图碎片带回来。" },
  { x: 10, y: 1, sprite: 2, speaker: "机械师 阿棠", text: "维修站能扩装甲，先攒两块零件。" },
];

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
  weapon: "pulse",
  guard: false,
};

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
let showCollisionDebug = false;

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

function rememberDirection(dx, dy) {
  facing = dx < 0 ? -1 : dx > 0 ? 1 : facing;
  lastMoveDx = dx;
  lastMoveDy = dy;
}

function move(dx, dy) {
  if (mode !== "map") return;
  rememberDirection(dx, dy);
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
    setComms("基地指挥官", "整备完成。别恋战，留能量给重武器。", 1);
    addLog("基地完成整备：装甲与能量已恢复。");
  }
  if (tileAt(nx, ny) === "s" && player.scrap >= 2) {
    player.scrap -= 2;
    player.maxHp += 10;
    player.hp = player.maxHp;
    setComms("机械师 阿棠", "装甲板重新焊好了，这下抗揍多了。", 2);
    addLog("维修站消耗 2 零件，机体装甲上限 +10。");
  }
  const npc = npcs.find((item) => item.x === nx && item.y === ny);
  if (npc) setComms(npc.speaker, npc.text, npc.sprite);
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
  if (won) {
    const original = enemies.find((enemy) => enemy.name === currentEnemy.name);
    original.defeated = true;
    player.wins += 1;
    player.scrap += rand(1, 3);
    player.credits += rand(45, 80);
    player.level = 1 + Math.floor(player.wins / 2);
    player.maxEn = 60 + player.level * 4;
    player.en = Math.min(player.maxEn, player.en + 24);
    addLog(`${currentEnemy.name} 停机，回收小队获得战利品。`);
  } else {
    player.hp = Math.ceil(player.maxHp * 0.55);
    player.en = 34;
    player.x = 8;
    player.y = 9;
    addLog("机体紧急弹射回基地，装甲临时修复。");
  }
  currentEnemy = null;
  mode = "hangar";
  battleLocked = false;
  battleAnim = null;
  battleFx = { shake: 0, flash: 0, text: "", kind: "muzzle", x: 438, y: 88 };
  setBattleButtons(false);
  battleLayer.classList.add("hidden");
  updateUi();
  showHangar();
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
  startBattleAnim({ actor: "player", target: "enemy", kind, text: `-${damage}`, x: 404, y: 64, duration: 620, shake: 8 });
  addLog(`${weapon.log} 造成 ${damage} 伤害。`);
  updateUi();

  if (currentEnemy.hp <= 0) {
    setTimeout(() => endBattle(true), 740);
    return;
  }
  setTimeout(enemyTurn, 700);
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

function showMap() {
  mode = "map";
  closePanel();
  battleLayer.classList.add("hidden");
  hangarLayer.classList.add("hidden");
  mapCanvas.classList.remove("hidden");
  document.body.classList.add("map-mode");
  document.querySelector("#areaLabel").textContent = "旧城区外围";
  setComms("驾驶员 洛辰", "进入外勤地图。找到敌方信号源后接触开战。", 0);
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
}

function launchBattle() {
  const target = enemies.find((enemy) => !enemy.defeated) ?? enemies[enemies.length - 1];
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
  ui.wins.textContent = player.wins;
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

function drawMapMech(ctx, x, y, size, sprite, facing = 1) {
  if (drawSprite(ctx, assets.mapMechs, sprite, 32, x, y, size, size, facing)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.fillStyle = "#42d6a4";
  ctx.fillRect(-size / 4, -size / 2, size / 2, size);
  ctx.restore();
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

function drawCharacter(ctx, x, y, sprite, w = 28, h = 28, facing = 1) {
  if (drawSprite(ctx, assets.characters, sprite, 32, x, y, w, h, facing)) return;
  ctx.fillStyle = "#f0c84b";
  ctx.fillRect(x - 7, y - 14, 14, 28);
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
  const patrolSprite = sprite === 4 ? 3 : 4;
  drawCharacter(ctx, x, y, patrolSprite, 30, 32, -1);
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

function drawActorShadow(ctx, x, y, w = 24, h = 7) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + 15, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
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
  const actors = [];
  enemies.forEach((enemy) => {
    if (enemy.defeated) return;
    const x = enemy.x * TILE + TILE / 2 - camera.x;
    const y = enemy.y * TILE + TILE / 2 + 4 - camera.y;
    actors.push({
      y,
      draw: () => {
        const bob = Math.sin(now / 280 + enemy.x) * 1.2;
        drawActorShadow(mapCtx, x, y, 22, 7);
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
        drawActorShadow(mapCtx, x, y, 22, 7);
        drawCharacter(mapCtx, x, y, npc.sprite, 30, 32);
      },
    });
  });
  actors.push({
    y: playerPos.y - camera.y,
    draw: () => {
      drawActorShadow(mapCtx, playerPos.x - camera.x, playerPos.y - camera.y, 25, 8);
      drawHero(mapCtx, playerPos.x - camera.x, playerPos.y - camera.y, playerPos.frame, facing);
    },
  });
  actors.sort((a, b) => a.y - b.y).forEach((actor) => actor.draw());
  mapCtx.fillStyle = "rgba(16, 19, 24, 0.82)";
  mapCtx.fillRect(10, 10, 356, 30);
  mapCtx.fillStyle = "#e6edf1";
  mapCtx.font = "14px Microsoft YaHei, sans-serif";
  const help = showCollisionDebug ? "C 关闭碰撞，点击=可走，Shift+点击=不可走，R 重置" : "方向键/WASD 移动，接触红标敌人进入机甲战斗，C 显示碰撞";
  mapCtx.fillText(help, 20, 30);
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

function getHeroFrame(now) {
  const moving = !!mapAnim;
  const progress = moving ? Math.min(0.999, Math.max(0, (now - mapAnim.start) / mapAnim.duration)) : 0;
  const step = moving ? Math.floor(progress * 4) : 0;
  const row = getHeroDirectionRow();
  return row * 100 + step;
}

function getHeroWalkFrame(frame, direction) {
  if (frame >= 300) return { row: 3, col: frame - 300, lift: 0 };
  if (frame >= 200) return { row: 2, col: frame - 200, lift: 0 };
  if (frame >= 100) return { row: 1, col: frame - 100, lift: 0 };
  if (direction < 0) return { row: 1, col: 0, lift: 0 };
  return { row: 0, col: frame, lift: 0 };
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
  if (assets.battleBg.complete && assets.battleBg.naturalWidth) {
    battleCtx.drawImage(assets.battleBg, 0, 0, battleCanvas.width, battleCanvas.height);
  } else {
    battleCtx.fillStyle = "#10161d";
    battleCtx.fillRect(0, 0, battleCanvas.width, battleCanvas.height);
    battleCtx.fillStyle = "#6f4328";
    battleCtx.fillRect(0, 196, battleCanvas.width, 88);
  }
  const pose = getBattlePose(now);
  drawBattleUnit(battleCtx, 168 + shake + pose.playerX, 142 + pose.playerY, 190, getPlayerMechaFrame(), 1, pose.playerAlpha);
  if (currentEnemy) drawBattleUnit(battleCtx, 474 - shake + pose.enemyX, 142 + pose.enemyY, 178, getEnemyMechaFrame(), -1, pose.enemyAlpha);
  if (battleAnim) {
    const progress = Math.min(1, (now - battleAnim.start) / battleAnim.duration);
    const float = Math.sin(progress * Math.PI) * 10 + progress * 14;
    const pulse = 78 + Math.sin(progress * Math.PI) * 18;
    drawEffect(battleCtx, battleAnim.kind, battleAnim.x, battleAnim.y - float * 0.35, pulse, battleAnim.x > 300 ? 1 : -1);
    battleCtx.fillStyle = "#ffef98";
    battleCtx.font = "24px Segoe UI, sans-serif";
    battleCtx.fillText(battleAnim.text, battleAnim.x + 34, battleAnim.y - 8 - float);
    if (progress >= 1) battleAnim = null;
  }
  battleFx.shake = Math.max(0, battleFx.shake - 1);
}

function getPlayerMechaFrame() {
  if (!battleAnim || battleAnim.actor !== "player") return 0;
  if (battleAnim.kind === "slash") return 3;
  if (["muzzle", "missile", "rail"].includes(battleAnim.kind)) return 4;
  if (["shield", "repair"].includes(battleAnim.kind)) return 6;
  return 1;
}

function getEnemyMechaFrame() {
  if (!battleAnim) return 1;
  if (battleAnim.target === "enemy") return 5;
  if (battleAnim.actor === "enemy") return battleAnim.kind === "explosion" ? 3 : 4;
  return 1;
}

function getBattlePose(now) {
  const idle = Math.sin(now / 360) * 2;
  const pose = {
    playerX: 0,
    playerY: idle,
    enemyX: 0,
    enemyY: -idle,
    playerAlpha: 1,
    enemyAlpha: 1,
  };
  if (!battleAnim) return pose;

  const t = Math.min(1, (now - battleAnim.start) / battleAnim.duration);
  const strike = Math.sin(t * Math.PI);
  const hurtFlash = Math.floor(t * 18) % 2 === 0 ? 0.45 : 1;
  if (battleAnim.actor === "player") pose.playerX += strike * 24;
  if (battleAnim.actor === "enemy") pose.enemyX -= strike * 20;
  if (battleAnim.target === "enemy") {
    pose.enemyX += Math.sin(t * Math.PI * 8) * 5;
    pose.enemyAlpha = t < 0.75 ? hurtFlash : 1;
  }
  if (battleAnim.target === "player") {
    pose.playerX += Math.sin(t * Math.PI * 8) * 5;
    pose.playerAlpha = t < 0.75 ? hurtFlash : 1;
  }
  return pose;
}

function drawBattleUnit(ctx, x, y, size, sprite, direction, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  drawBattleMech(ctx, x, y, size, sprite, direction);
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

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const direction = moveDirections[key];
  if (!direction) return;
  event.preventDefault();
  heldMove = { dx: direction[0], dy: direction[1], key };
  rememberDirection(direction[0], direction[1]);
  move(direction[0], direction[1]);
});

document.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (!moveDirections[key]) return;
  event.preventDefault();
  if (heldMove?.key === key) heldMove = null;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePanel();
  if (event.key.toLowerCase() === "c") {
    showCollisionDebug = !showCollisionDebug;
    addLog(showCollisionDebug ? "碰撞调试已开启。" : "碰撞调试已关闭。");
  }
  if (showCollisionDebug && event.key.toLowerCase() === "r") resetCollisionMap();
});

mapCanvas.addEventListener("pointerdown", (event) => {
  if (mode !== "map" || !showCollisionDebug) return;
  event.preventDefault();
  const rect = mapCanvas.getBoundingClientRect();
  const scaleX = mapCanvas.width / rect.width;
  const scaleY = mapCanvas.height / rect.height;
  const x = Math.floor(((event.clientX - rect.left) * scaleX) / TILE);
  const y = Math.floor(((event.clientY - rect.top) * scaleY) / TILE);
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
updateUi();
showMap();
loop();
