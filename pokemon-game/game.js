(function () {
  "use strict";

  var TILE = 40;
  var COLS = 20;
  var ROWS = 14;
  var worldCanvas = document.getElementById("world");
  var worldCtx = worldCanvas.getContext("2d");

  var SPECIES = [
    { id: "pikachu", name: "פיקאצ׳ו", emoji: "⚡🐭", starter: true, tier: "uncommon" },

    { id: "caterpie", name: "קטרפי", emoji: "🐛", tier: "common", weight: 26, difficulty: 0.15 },
    { id: "pidgey", name: "פיג׳י", emoji: "🐦", tier: "common", weight: 24, difficulty: 0.18 },
    { id: "rattata", name: "ראטטה", emoji: "🐭", tier: "common", weight: 22, difficulty: 0.17 },
    { id: "zubat", name: "זובאט", emoji: "🦇", tier: "common", weight: 18, difficulty: 0.22 },

    { id: "squirtle", name: "סקוויירטל", emoji: "🐢", tier: "uncommon", weight: 14, difficulty: 0.32 },
    { id: "charmander", name: "צ׳רמנדר", emoji: "🦎🔥", tier: "uncommon", weight: 13, difficulty: 0.34 },
    { id: "bulbasaur", name: "בולבזאור", emoji: "🐸🌱", tier: "uncommon", weight: 13, difficulty: 0.33 },
    { id: "growlithe", name: "גראוליית׳", emoji: "🐶🔥", tier: "uncommon", weight: 11, difficulty: 0.37 },
    { id: "machop", name: "מצ׳וקצ׳וק", emoji: "💪", tier: "uncommon", weight: 10, difficulty: 0.4 },

    { id: "meowth", name: "מיאוט׳", emoji: "🐱", tier: "rare", weight: 7, difficulty: 0.5 },
    { id: "psyduck", name: "פסיידאק", emoji: "🦆", tier: "rare", weight: 6, difficulty: 0.52 },
    { id: "eevee", name: "איווי", emoji: "🦊", tier: "rare", weight: 6, difficulty: 0.55 },
    { id: "abra", name: "אברה", emoji: "🔮", tier: "rare", weight: 6, difficulty: 0.56 },
    { id: "gastly", name: "גאסטלי", emoji: "👻", tier: "rare", weight: 5, difficulty: 0.58 },
    { id: "venomoth", name: "וונומות׳", emoji: "🦋", tier: "rare", weight: 5, difficulty: 0.6 },

    { id: "jigglypuff", name: "ג׳יגליפאף", emoji: "🎀🐹", tier: "epic", weight: 3, difficulty: 0.7 },

    { id: "mew", name: "מיו", emoji: "💗", tier: "legendary", weight: 0.6, difficulty: 0.88 },
    { id: "mewtwo", name: "מיוטו", emoji: "🟣", tier: "legendary", weight: 0.4, difficulty: 0.92 },
  ];

  var CRITTER_LOOK = {
    pikachu: { body: "#f6d229", ears: "pointy", earTip: "#3a3a3a", cheeks: "#e8483c", tail: "zigzag", tailColor: "#f6d229" },
    caterpie: { body: "#8bc34a", ears: "none", segments: true, antenna: "#e8483c" },
    pidgey: { body: "#c9a06c", ears: "none", wings: "#8a6a45", beak: "#e08a3c" },
    rattata: { body: "#b79bd1", ears: "round", whiskers: true, tail: "thin", tailColor: "#b79bd1", belly: "#efe4f6" },
    zubat: { body: "#5b4a86", ears: "none", wings: "#3f3164", fangs: true },

    squirtle: { body: "#6ec6e6", ears: "round", shell: "#8a5a2e" },
    charmander: { body: "#f2854a", ears: "round", belly: "#ffe0b0", tail: "flame", tailColor: "#ffb236" },
    bulbasaur: { body: "#7bc17e", ears: "round", bulb: "#3f7d3a", leaf: "#5fae52" },
    growlithe: { body: "#e8842c", ears: "pointy", earTip: "#5a3016", stripes: "#5a3016", collar: "#f7c873", tail: "fur", tailColor: "#e8842c" },
    machop: { body: "#8a7048", ears: "none", belt: "#3a2a18", muscleArms: "#8a7048", tuft: "#3a2a18" },

    meowth: { body: "#f2e6ab", ears: "pointy", earTip: "#f2e6ab", coin: "#e8c94a" },
    psyduck: { body: "#f5e28a", ears: "none", bill: "#e8a23c", tuft: "#e8c94a" },
    eevee: { body: "#c8a06a", ears: "pointy", earTip: "#5a4128", collar: "#efe0c0" },
    abra: { body: "#c9a8e0", ears: "pointy", earTip: "#9a6ac0", eyesClosed: true, starMark: "#f6d229" },
    gastly: { body: "#8a5ac8", ears: "none", gasBody: true, grin: true },
    venomoth: { body: "#a888c8", ears: "none", mothWings: "#c9a8e0", wingSpot: "#5a3a7a", furryAntenna: "#5a3a7a", bigEyes: true },

    jigglypuff: { body: "#f6b8d0", ears: "none", curl: "#e88fb0" },
  };

  var TIER_STATS = {
    common: { hp: 32, atkMin: 4, atkMax: 8 },
    uncommon: { hp: 44, atkMin: 6, atkMax: 11 },
    rare: { hp: 58, atkMin: 8, atkMax: 14 },
    epic: { hp: 72, atkMin: 10, atkMax: 17 },
    legendary: { hp: 100, atkMin: 15, atkMax: 24 },
  };
  var FAINT_REST_MS = 60000;

  var CATCHABLE = SPECIES.filter(function (s) { return !s.starter; });
  var TOTAL_WEIGHT = CATCHABLE.reduce(function (sum, s) { return sum + s.weight; }, 0);

  function speciesById(id) {
    for (var i = 0; i < SPECIES.length; i++) if (SPECIES[i].id === id) return SPECIES[i];
    return null;
  }

  var SAVE_KEY = "pokemonCatchGame.save.v2";
  var state = loadSave();

  var map = generateMap();

  var player = {
    x: state.playerPos ? state.playerPos.x : (COLS * TILE) / 2,
    y: state.playerPos ? state.playerPos.y : (ROWS * TILE) / 2,
    speed: 2.6,
    facing: "down",
    moving: false,
  };

  var trail = [];
  var TRAIL_LAG = 14;

  var wildCreatures = [];
  var nextWildId = 1;
  var lastSpawnAt = 0;
  var SPAWN_INTERVAL_MS = 4500;
  var MAX_WILD = 3;

  var heldKeys = Object.create(null);
  var heldTouchDir = null;

  var activeCatchTarget = null;
  var catchAnimHandle = null;

  init();

  function init() {
    bindControls();
    updateDexBadge();
    requestAnimationFrame(loop);
    window.addEventListener("beforeunload", persist);
    setInterval(persist, 10000);
  }

  // ---------- map ----------

  function generateMap() {
    var tiles = [];
    for (var r = 0; r < ROWS; r++) {
      var row = [];
      for (var c = 0; c < COLS; c++) {
        row.push({ type: "grass", shade: (c + r * 3) % 3 });
      }
      tiles.push(row);
    }

    for (var c2 = 0; c2 < COLS; c2++) {
      tiles[0][c2].type = "tree";
      tiles[ROWS - 1][c2].type = "tree";
    }
    for (var r2 = 0; r2 < ROWS; r2++) {
      tiles[r2][0].type = "tree";
      tiles[r2][COLS - 1].type = "tree";
    }

    var pathRow = Math.floor(ROWS / 2);
    for (var pc = 1; pc < COLS - 1; pc++) {
      tiles[pathRow][pc].type = "path";
    }

    var extraTrees = [
      [3, 3], [3, 4], [4, 15], [5, 16], [9, 3], [10, 4], [8, 17], [9, 17],
    ];
    extraTrees.forEach(function (p) {
      if (tiles[p[0]] && tiles[p[0]][p[1]]) tiles[p[0]][p[1]].type = "tree";
    });

    var rocks = [[6, 8], [7, 12], [3, 9]];
    rocks.forEach(function (p) {
      if (tiles[p[0]] && tiles[p[0]][p[1]]) tiles[p[0]][p[1]].type = "rock";
    });

    var tallGrassPatches = [
      { r0: 2, c0: 2, r1: 5, c1: 6 },
      { r0: 8, c0: 8, r1: 11, c1: 12 },
      { r0: 2, c0: 13, r1: 5, c1: 17 },
    ];
    tallGrassPatches.forEach(function (patch) {
      for (var r3 = patch.r0; r3 <= patch.r1; r3++) {
        for (var c3 = patch.c0; c3 <= patch.c1; c3++) {
          if (tiles[r3] && tiles[r3][c3] && tiles[r3][c3].type === "grass") {
            tiles[r3][c3].type = "tallgrass";
          }
        }
      }
    });

    var flowerSpots = [[6, 5], [11, 9], [4, 10], [10, 14], [12, 6]];
    flowerSpots.forEach(function (p) {
      if (tiles[p[0]] && tiles[p[0]][p[1]] && tiles[p[0]][p[1]].type === "grass") {
        tiles[p[0]][p[1]].flower = true;
      }
    });

    return tiles;
  }

  function tileAt(px, py) {
    var c = Math.floor(px / TILE);
    var r = Math.floor(py / TILE);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return { type: "tree" };
    return map[r][c];
  }

  function isBlocking(type) {
    return type === "tree" || type === "rock";
  }

  // ---------- controls ----------

  function bindControls() {
    window.addEventListener("keydown", function (e) {
      var dir = keyToDir(e.key);
      if (dir) heldKeys[dir] = true;
    });
    window.addEventListener("keyup", function (e) {
      var dir = keyToDir(e.key);
      if (dir) heldKeys[dir] = false;
    });

    var dpad = document.getElementById("dpad");
    dpad.querySelectorAll(".dbtn").forEach(function (btn) {
      var dir = btn.getAttribute("data-dir");
      var start = function (e) { e.preventDefault(); heldTouchDir = dir; };
      var end = function (e) { e.preventDefault(); if (heldTouchDir === dir) heldTouchDir = null; };
      btn.addEventListener("touchstart", start, { passive: false });
      btn.addEventListener("touchend", end, { passive: false });
      btn.addEventListener("touchcancel", end, { passive: false });
      btn.addEventListener("mousedown", start);
      btn.addEventListener("mouseup", end);
      btn.addEventListener("mouseleave", end);
    });

    document.getElementById("catchBtn").addEventListener("click", function () {
      if (activeCatchTarget) openCatchGame(activeCatchTarget);
    });

    document.getElementById("dexBtn").addEventListener("click", openDex);
    document.getElementById("dexClose").addEventListener("click", closeDex);
    document.getElementById("tapCatch").addEventListener("click", resolveCatchTap);

    document.getElementById("dexGrid").addEventListener("click", function (e) {
      var btn = e.target.closest(".dex-battle-btn");
      if (btn) startBattle(btn.getAttribute("data-species"));
    });

    document.getElementById("battleAttack").addEventListener("click", playerAttack);
    document.getElementById("battleFlee").addEventListener("click", closeBattle);
    document.getElementById("battleParty").addEventListener("click", function (e) {
      var btn = e.target.closest(".party-chip");
      if (btn && !btn.disabled) selectActiveBattler(btn.getAttribute("data-species"));
    });
  }

  function keyToDir(key) {
    switch (key) {
      case "ArrowUp": case "w": case "W": return "up";
      case "ArrowDown": case "s": case "S": return "down";
      case "ArrowLeft": case "a": case "A": return "left";
      case "ArrowRight": case "d": case "D": return "right";
      default: return null;
    }
  }

  function currentDir() {
    if (heldTouchDir) return heldTouchDir;
    if (heldKeys.up) return "up";
    if (heldKeys.down) return "down";
    if (heldKeys.left) return "left";
    if (heldKeys.right) return "right";
    return null;
  }

  // ---------- update ----------

  var lastTime = 0;

  function loop(ts) {
    var dt = lastTime ? ts - lastTime : 16;
    lastTime = ts;

    var paused =
      !document.getElementById("catchGame").classList.contains("hidden") ||
      !document.getElementById("battleOverlay").classList.contains("hidden");

    if (paused) {
      requestAnimationFrame(loop);
      return;
    }

    updatePlayer();
    updateTrail();
    updateWildCreatures(ts, dt);
    updateCatchPrompt();
    renderWorld();

    requestAnimationFrame(loop);
  }

  function updatePlayer() {
    var dir = currentDir();
    player.moving = !!dir;
    if (!dir) return;

    var dx = 0, dy = 0;
    if (dir === "up") { dy = -player.speed; player.facing = "up"; }
    if (dir === "down") { dy = player.speed; player.facing = "down"; }
    if (dir === "left") { dx = -player.speed; player.facing = "left"; }
    if (dir === "right") { dx = player.speed; player.facing = "right"; }

    var nx = clamp(player.x + dx, TILE * 0.6, COLS * TILE - TILE * 0.6);
    var ny = clamp(player.y + dy, TILE * 0.6, ROWS * TILE - TILE * 0.6);

    if (!isBlocking(tileAt(nx, player.y).type)) player.x = nx;
    if (!isBlocking(tileAt(player.x, ny).type)) player.y = ny;
  }

  function updateTrail() {
    trail.push({ x: player.x, y: player.y });
    if (trail.length > TRAIL_LAG) trail.shift();
  }

  function updateWildCreatures(ts, dt) {
    if (ts - lastSpawnAt > SPAWN_INTERVAL_MS && wildCreatures.length < MAX_WILD) {
      trySpawnWild();
      lastSpawnAt = ts;
    }
    wildCreatures.forEach(function (w) {
      w.age += dt;
      w.bob += dt * 0.005;
    });
    wildCreatures = wildCreatures.filter(function (w) { return w.age < 26000; });
  }

  function trySpawnWild() {
    var spot = pickTallGrassSpot();
    if (!spot) return;
    var species = pickWeightedSpecies();
    wildCreatures.push({
      id: nextWildId++,
      speciesId: species.id,
      x: spot.c * TILE + TILE / 2,
      y: spot.r * TILE + TILE / 2,
      bob: Math.random() * 10,
      age: 0,
    });
  }

  function pickTallGrassSpot() {
    var candidates = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (map[r][c].type === "tallgrass") candidates.push({ r: r, c: c });
      }
    }
    if (!candidates.length) return null;
    var occupied = wildCreatures.map(function (w) {
      return Math.floor(w.y / TILE) + ":" + Math.floor(w.x / TILE);
    });
    var free = candidates.filter(function (p) {
      return occupied.indexOf(p.r + ":" + p.c) === -1;
    });
    var pool = free.length ? free : candidates;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function pickWeightedSpecies() {
    var roll = Math.random() * TOTAL_WEIGHT;
    var acc = 0;
    for (var i = 0; i < CATCHABLE.length; i++) {
      acc += CATCHABLE[i].weight;
      if (roll <= acc) return CATCHABLE[i];
    }
    return CATCHABLE[0];
  }

  function updateCatchPrompt() {
    var prompt = document.getElementById("catchPrompt");
    var nearest = null;
    var nearestDist = 60;
    wildCreatures.forEach(function (w) {
      var d = Math.hypot(w.x - player.x, w.y - player.y);
      if (d < nearestDist) { nearestDist = d; nearest = w; }
    });
    activeCatchTarget = nearest;
    prompt.classList.toggle("hidden", !nearest);
  }

  // ---------- catch mini-game ----------

  var catchState = null;

  function openCatchGame(target) {
    var species = speciesById(target.speciesId);
    document.getElementById("catchCreatureName").textContent =
      "מנסים לתפוס: " + species.name + " " + species.emoji;
    document.getElementById("catchResult").textContent = "";

    var maxD = 190, minD = 16;
    var sweetD = maxD * 0.25 + Math.random() * (maxD * 0.45);
    var toleranceScale = 1 - species.difficulty;
    var tolerance = 10 + toleranceScale * 26;

    catchState = {
      target: target,
      species: species,
      startedAt: performance.now(),
      duration: 1700,
      maxD: maxD,
      minD: minD,
      sweetD: sweetD,
      tolerance: tolerance,
      resolved: false,
    };

    var sweet = document.getElementById("ringSweet");
    sweet.style.width = sweetD + "px";
    sweet.style.height = sweetD + "px";

    document.getElementById("catchGame").classList.remove("hidden");
    if (catchAnimHandle) cancelAnimationFrame(catchAnimHandle);
    catchAnimHandle = requestAnimationFrame(animateCatchRing);
  }

  function animateCatchRing(ts) {
    if (!catchState || catchState.resolved) return;
    var elapsed = performance.now() - catchState.startedAt;
    var t = Math.min(1, elapsed / catchState.duration);
    var d = catchState.maxD - (catchState.maxD - catchState.minD) * t;
    var outer = document.getElementById("ringOuter");
    outer.style.width = d + "px";
    outer.style.height = d + "px";
    catchState.currentD = d;

    if (t >= 1) {
      finishCatchAttempt(0);
      return;
    }
    catchAnimHandle = requestAnimationFrame(animateCatchRing);
  }

  function resolveCatchTap() {
    if (!catchState || catchState.resolved) return;
    var diff = Math.abs(catchState.currentD - catchState.sweetD);
    var successChance;
    if (diff <= catchState.tolerance) {
      successChance = 0.9 - catchState.species.difficulty * 0.35;
    } else {
      var over = diff - catchState.tolerance;
      successChance = Math.max(0.05, 0.5 - over / 120 - catchState.species.difficulty * 0.3);
    }
    finishCatchAttempt(successChance);
  }

  function finishCatchAttempt(chance) {
    if (!catchState || catchState.resolved) return;
    catchState.resolved = true;
    if (catchAnimHandle) cancelAnimationFrame(catchAnimHandle);

    var success = Math.random() < chance;
    var resultEl = document.getElementById("catchResult");

    if (success) {
      addToDex(catchState.species.id);
      resultEl.textContent = "תפסת את " + catchState.species.name + "! 🎉";
      resultEl.style.color = "#1c8a4a";
      removeWild(catchState.target.id);
      showToast("תפסת " + catchState.species.emoji + " " + catchState.species.name + "!");
      updateDexBadge();
    } else {
      var fled = Math.random() < 0.5;
      resultEl.textContent = fled ? "הפוקימון ברח! 💨" : "לא הצלחת... נסה שוב!";
      resultEl.style.color = "#c0392b";
      if (fled) removeWild(catchState.target.id);
    }

    setTimeout(closeCatchGame, 1300);
  }

  function closeCatchGame() {
    document.getElementById("catchGame").classList.add("hidden");
    catchState = null;
  }

  function removeWild(id) {
    wildCreatures = wildCreatures.filter(function (w) { return w.id !== id; });
  }

  // ---------- battle ----------

  var battle = null;
  var battlePlayerCanvas = document.getElementById("battlePlayerCanvas");
  var battlePlayerCtx = battlePlayerCanvas.getContext("2d");
  var battleOpponentCanvas = document.getElementById("battleOpponentCanvas");
  var battleOpponentCtx = battleOpponentCanvas.getContext("2d");

  function isResting(speciesId) {
    var until = state.restUntil[speciesId];
    return until && until > Date.now();
  }

  function ownedHealthySpecies() {
    return Object.keys(state.dex).filter(function (id) { return !isResting(id); });
  }

  function makeFighter(speciesId) {
    var species = speciesById(speciesId);
    var stats = TIER_STATS[species.tier] || TIER_STATS.common;
    return { speciesId: speciesId, species: species, hp: stats.hp, maxHp: stats.hp, atkMin: stats.atkMin, atkMax: stats.atkMax };
  }

  function startBattle(opponentSpeciesId) {
    var starter = ownedHealthySpecies()[0] || (isResting("pikachu") ? null : "pikachu");
    if (!starter) {
      showToast("כל הפוקימונים שלך עייפים כרגע, נסו שוב עוד רגע 😴");
      return;
    }
    battle = {
      opponent: makeFighter(opponentSpeciesId),
      player: makeFighter(starter),
      over: false,
      busy: false,
    };
    document.getElementById("battleOverlay").classList.remove("hidden");
    document.getElementById("dexOverlay").classList.add("hidden");
    setBattleMessage("קרב מתחיל! " + battle.opponent.species.name + " הופיע!");
    renderBattleParty();
    renderBattlePanels();
  }

  function selectActiveBattler(speciesId) {
    if (!battle || battle.over || battle.busy) return;
    if (isResting(speciesId)) return;
    battle.player = makeFighter(speciesId);
    setBattleMessage(battle.player.species.name + " נכנס לקרב!");
    renderBattleParty();
    renderBattlePanels();
  }

  function playerAttack() {
    if (!battle || battle.over || battle.busy || battle.player.hp <= 0) return;
    battle.busy = true;

    var dmg = randInt(battle.player.atkMin, battle.player.atkMax);
    battle.opponent.hp = Math.max(0, battle.opponent.hp - dmg);
    setBattleMessage(battle.player.species.name + " תוקף! -" + dmg + " ל" + battle.opponent.species.name);
    renderBattlePanels();

    if (battle.opponent.hp <= 0) {
      setTimeout(function () {
        state.battlesWon = (state.battlesWon || 0) + 1;
        persist();
        battle.over = true;
        battle.busy = false;
        setBattleMessage("ניצחתם! 🏆 " + battle.opponent.species.name + " ברח מהקרב.");
        renderBattlePanels();
      }, 400);
      return;
    }

    setTimeout(function () {
      var back = randInt(battle.opponent.atkMin, battle.opponent.atkMax);
      battle.player.hp = Math.max(0, battle.player.hp - back);
      var message = battle.opponent.species.name + " עונה! -" + back + " ל" + battle.player.species.name;

      if (battle.player.hp <= 0) {
        state.restUntil[battle.player.speciesId] = Date.now() + FAINT_REST_MS;
        persist();
        renderBattleParty();
        var nextHealthy = ownedHealthySpecies().filter(function (id) { return id !== battle.player.speciesId; })[0];
        if (nextHealthy) {
          message = battle.player.species.name + " עייף... בחרו פוקימון אחר להמשיך!";
        } else {
          message = battle.player.species.name + " עייף, וגם כל השאר צריכים לנוח. חוזרים בעוד קצת!";
          battle.over = true;
        }
      }

      battle.busy = false;
      setBattleMessage(message);
      renderBattlePanels();
    }, 900);
  }

  function renderBattleParty() {
    var wrap = document.getElementById("battleParty");
    wrap.innerHTML = "";
    Object.keys(state.dex).forEach(function (id) {
      var species = speciesById(id);
      if (!species) return;
      var resting = isResting(id);
      var active = battle && battle.player && battle.player.speciesId === id;
      var chip = document.createElement("button");
      chip.className = "party-chip" + (active ? " active" : "") + (resting ? " resting" : "");
      chip.setAttribute("data-species", id);
      chip.disabled = resting;
      chip.innerHTML = '<span class="party-emoji">' + species.emoji + "</span>" + (resting ? "😪" : "");
      wrap.appendChild(chip);
    });
  }

  function renderBattlePanels() {
    document.getElementById("battleOpponentName").textContent = battle.opponent.species.name + " " + battle.opponent.species.emoji;
    document.getElementById("battlePlayerName").textContent = battle.player.species.name + " " + battle.player.species.emoji;
    setHpBar("battleOpponentHp", battle.opponent.hp, battle.opponent.maxHp);
    setHpBar("battlePlayerHp", battle.player.hp, battle.player.maxHp);

    battleOpponentCtx.clearRect(0, 0, battleOpponentCanvas.width, battleOpponentCanvas.height);
    drawCritter(battleOpponentCtx, battle.opponent.speciesId, battleOpponentCanvas.width / 2, battleOpponentCanvas.height / 2 + 10, 34);

    battlePlayerCtx.clearRect(0, 0, battlePlayerCanvas.width, battlePlayerCanvas.height);
    drawCritter(battlePlayerCtx, battle.player.speciesId, battlePlayerCanvas.width / 2, battlePlayerCanvas.height / 2 + 10, 34);

    var attackBtn = document.getElementById("battleAttack");
    attackBtn.disabled = battle.over || battle.busy || battle.player.hp <= 0;
  }

  function setHpBar(id, hp, maxHp) {
    var pct = Math.max(0, Math.round((hp / maxHp) * 100));
    var fill = document.getElementById(id);
    fill.style.width = pct + "%";
    fill.className = "hp-fill" + (pct <= 25 ? " low" : pct <= 55 ? " mid" : "");
    fill.parentElement.nextElementSibling.textContent = hp + " / " + maxHp;
  }

  function setBattleMessage(msg) {
    document.getElementById("battleMessage").textContent = msg;
  }

  function closeBattle() {
    document.getElementById("battleOverlay").classList.add("hidden");
    battle = null;
  }

  // ---------- dex / persistence ----------

  function loadSave() {
    var fallback = { dex: { pikachu: 1 }, playerPos: null, restUntil: {}, battlesWon: 0 };
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      if (!parsed.dex) parsed.dex = {};
      if (!parsed.dex.pikachu) parsed.dex.pikachu = 1;
      if (!parsed.restUntil) parsed.restUntil = {};
      if (typeof parsed.battlesWon !== "number") parsed.battlesWon = 0;
      return parsed;
    } catch (e) {
      return fallback;
    }
  }

  function persist() {
    state.playerPos = { x: player.x, y: player.y };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function addToDex(speciesId) {
    state.dex[speciesId] = (state.dex[speciesId] || 0) + 1;
    persist();
  }

  function updateDexBadge() {
    var ownedCount = Object.keys(state.dex).length;
    document.getElementById("dexCount").textContent = ownedCount;
  }

  function openDex() {
    var grid = document.getElementById("dexGrid");
    grid.innerHTML = "";
    SPECIES.filter(function (s) { return !s.starter; }).forEach(function (s) {
      var count = state.dex[s.id] || 0;
      var owned = count > 0;
      var item = document.createElement("div");
      item.className = "dex-item " + (owned ? "owned" : "locked") + " tier-" + s.tier;
      item.innerHTML =
        '<span class="dex-emoji">' + (owned ? s.emoji : "❔") + "</span>" +
        '<span class="dex-name">' + (owned ? s.name : "???") + "</span>" +
        (owned ? '<span class="dex-count">x' + count + "</span>" : "") +
        (owned ? '<button class="dex-battle-btn" data-species="' + s.id + '">⚔️ קרב</button>' : "");
      grid.appendChild(item);
    });
    document.getElementById("dexOverlay").classList.remove("hidden");
  }

  function closeDex() {
    document.getElementById("dexOverlay").classList.add("hidden");
  }

  var toastHandle = null;
  function showToast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    if (toastHandle) clearTimeout(toastHandle);
    toastHandle = setTimeout(function () { el.classList.add("hidden"); }, 2200);
  }

  // ---------- render: world ----------

  var GRASS_SHADES = ["#3fa85c", "#3a9c55", "#44b063"];

  function renderWorld() {
    worldCtx.clearRect(0, 0, worldCanvas.width, worldCanvas.height);

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        drawTile(worldCtx, map[r][c], c * TILE, r * TILE);
      }
    }

    wildCreatures.forEach(function (w) {
      var bobY = Math.sin(w.bob) * 3;
      drawShadow(worldCtx, w.x, w.y + 12);
      drawCritter(worldCtx, w.speciesId, w.x, w.y + bobY, 15);
    });

    if (trail.length) {
      var lagged = trail[0];
      drawShadow(worldCtx, lagged.x, lagged.y + 14);
      drawCritter(worldCtx, "pikachu", lagged.x, lagged.y, 12);
    }

    drawShadow(worldCtx, player.x, player.y + 14);
    drawPlayer(worldCtx, player.x, player.y, player.facing);
  }

  function drawPlayer(ctx, x, y, facing) {
    var scaleX = facing === "left" ? -1 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX, 1);

    ctx.fillStyle = "#3a7bd5";
    ctx.beginPath();
    ctx.ellipse(0, 8, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f2c48d";
    ctx.beginPath();
    ctx.arc(0, -8, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e8483c";
    ctx.beginPath();
    ctx.arc(0, -12, 9.5, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-9.5, -13, 19, 3);

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.ellipse(-3, -10, 3, 1.6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2b2b2b";
    ctx.beginPath();
    ctx.arc(-3, -7, 1.4, 0, Math.PI * 2);
    ctx.arc(3, -7, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawGloss(ctx, r) {
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.beginPath();
    ctx.ellipse(-r * 0.32, -r * 0.42, r * 0.32, r * 0.2, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCritter(ctx, speciesId, x, y, r) {
    if (speciesId === "mew") return drawMew(ctx, x, y, r);
    if (speciesId === "mewtwo") return drawMewtwo(ctx, x, y, r);

    var look = CRITTER_LOOK[speciesId];
    if (!look) return;
    ctx.save();
    ctx.translate(x, y);

    if (look.tail === "zigzag") {
      ctx.strokeStyle = look.tailColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(r * 0.6, 0);
      ctx.lineTo(r * 1.3, -r * 0.5);
      ctx.lineTo(r * 1.6, 0);
      ctx.lineTo(r * 2.1, -r * 0.7);
      ctx.stroke();
    }
    if (look.tail === "flame") {
      ctx.fillStyle = look.tailColor;
      ctx.beginPath();
      ctx.moveTo(r * 0.7, r * 0.2);
      ctx.quadraticCurveTo(r * 1.6, -r * 0.2, r * 1.2, -r * 1.1);
      ctx.quadraticCurveTo(r * 1.5, -r * 0.3, r * 0.9, r * 0.4);
      ctx.fill();
    }
    if (look.tail === "thin") {
      ctx.strokeStyle = look.tailColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(r * 0.6, r * 0.1);
      ctx.quadraticCurveTo(r * 1.5, -r * 0.1, r * 1.7, r * 0.5);
      ctx.stroke();
    }
    if (look.tail === "fur") {
      ctx.fillStyle = look.tailColor;
      var tuftSpots = [[r * 0.9, -r * 0.1], [r * 1.25, -r * 0.35], [r * 1.4, r * 0.05], [r * 1.1, r * 0.2]];
      tuftSpots.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (look.ears === "pointy") {
      ctx.fillStyle = look.body;
      triangle(ctx, -r * 0.6, -r * 0.6, -r * 0.9, -r * 1.6, -r * 0.15, -r * 0.9);
      triangle(ctx, r * 0.6, -r * 0.6, r * 0.9, -r * 1.6, r * 0.15, -r * 0.9);
      if (look.earTip) {
        ctx.fillStyle = look.earTip;
        triangle(ctx, -r * 0.75, -r * 1.1, -r * 0.9, -r * 1.6, -r * 0.55, -r * 1.15);
        triangle(ctx, r * 0.75, -r * 1.1, r * 0.9, -r * 1.6, r * 0.55, -r * 1.15);
      }
    } else if (look.ears === "round") {
      ctx.fillStyle = look.body;
      ctx.beginPath();
      ctx.arc(-r * 0.65, -r * 0.85, r * 0.4, 0, Math.PI * 2);
      ctx.arc(r * 0.65, -r * 0.85, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (look.bulb) {
      ctx.fillStyle = look.bulb;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.9, r * 0.55, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = look.leaf;
      triangle(ctx, 0, -r * 1.3, -r * 0.35, -r * 0.95, r * 0.35, -r * 0.95);
    }
    if (look.shell) {
      ctx.fillStyle = look.shell;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.15, r * 0.7, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (look.wings) {
      ctx.fillStyle = look.wings;
      triangle(ctx, -r * 0.4, -r * 0.1, -r * 1.3, -r * 0.4, -r * 0.5, r * 0.5);
      triangle(ctx, r * 0.4, -r * 0.1, r * 1.3, -r * 0.4, r * 0.5, r * 0.5);
    }
    if (look.mothWings) {
      ctx.fillStyle = look.mothWings;
      ctx.beginPath();
      ctx.ellipse(-r * 0.95, -r * 0.15, r * 0.68, r * 0.9, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(r * 0.95, -r * 0.15, r * 0.68, r * 0.9, 0.35, 0, Math.PI * 2);
      ctx.fill();
      if (look.wingSpot) {
        ctx.fillStyle = look.wingSpot;
        ctx.beginPath();
        ctx.arc(-r * 0.95, -r * 0.15, r * 0.2, 0, Math.PI * 2);
        ctx.arc(r * 0.95, -r * 0.15, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (look.collar) {
      ctx.fillStyle = look.collar;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.25, r * 0.95, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (look.curl) {
      ctx.strokeStyle = look.curl;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -r * 1.5, r * 0.22, 0, Math.PI * 1.6);
      ctx.stroke();
    }
    if (look.furryAntenna) {
      ctx.strokeStyle = look.furryAntenna;
      ctx.lineWidth = 2.4;
      [-1, 1].forEach(function (side) {
        ctx.beginPath();
        ctx.moveTo(side * r * 0.22, -r * 0.85);
        ctx.quadraticCurveTo(side * r * 0.5, -r * 1.3, side * r * 0.35, -r * 1.55);
        ctx.stroke();
        for (var i = 0.3; i <= 0.9; i += 0.3) {
          ctx.beginPath();
          ctx.arc(side * r * (0.22 + i * 0.22), -r * (0.85 + i * 0.6), r * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
    if (look.muscleArms) {
      ctx.fillStyle = look.muscleArms;
      ctx.beginPath();
      ctx.ellipse(-r * 0.95, r * 0.1, r * 0.28, r * 0.4, 0.2, 0, Math.PI * 2);
      ctx.ellipse(r * 0.95, r * 0.1, r * 0.28, r * 0.4, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = look.body;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    if (look.gasBody) {
      ctx.fillStyle = look.body;
      var puffs = [[-r * 0.5, r * 0.55], [r * 0.55, r * 0.5], [0, r * 0.75]];
      puffs.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (look.stripes) {
      ctx.strokeStyle = look.stripes;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r * 0.5);
      ctx.lineTo(-r * 0.2, r * 0.4);
      ctx.moveTo(r * 0.1, -r * 0.55);
      ctx.lineTo(r * 0.4, r * 0.35);
      ctx.stroke();
    }

    if (look.belt) {
      ctx.fillStyle = look.belt;
      ctx.fillRect(-r, r * 0.15, r * 2, r * 0.24);
    }

    if (look.belly) {
      ctx.fillStyle = look.belly;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.32, r * 0.52, r * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (look.segments) {
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, -r * 0.7);
      ctx.lineTo(-r * 0.35, r * 0.7);
      ctx.moveTo(r * 0.35, -r * 0.7);
      ctx.lineTo(r * 0.35, r * 0.7);
      ctx.stroke();
      ctx.strokeStyle = look.antenna || "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, -r * 0.85);
      ctx.lineTo(-r * 0.4, -r * 1.35);
      ctx.moveTo(r * 0.25, -r * 0.85);
      ctx.lineTo(r * 0.4, -r * 1.35);
      ctx.stroke();
    }

    if (look.bill) {
      ctx.fillStyle = look.bill;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.15, r * 0.5, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (look.beak) {
      ctx.fillStyle = look.beak;
      triangle(ctx, 0, r * 0.05, -r * 0.18, r * 0.28, r * 0.18, r * 0.28);
    }
    if (look.fangs) {
      ctx.fillStyle = "#fff";
      triangle(ctx, -r * 0.22, r * 0.1, -r * 0.3, r * 0.35, -r * 0.12, r * 0.15);
      triangle(ctx, r * 0.22, r * 0.1, r * 0.3, r * 0.35, r * 0.12, r * 0.15);
    }
    if (look.tuft) {
      ctx.strokeStyle = look.tuft;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.lineTo(r * 0.15, -r * 1.4);
      ctx.stroke();
    }
    if (look.coin) {
      ctx.fillStyle = look.coin;
      ctx.beginPath();
      ctx.arc(0, -r * 1.05, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
    if (look.starMark) {
      ctx.fillStyle = look.starMark;
      ctx.beginPath();
      ctx.arc(0, -r * 0.55, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
    if (look.grin) {
      ctx.strokeStyle = "#2b2b2b";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, r * 0.05, r * 0.4, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
    if (look.whiskers) {
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1;
      [-1, 1].forEach(function (side) {
        ctx.beginPath();
        ctx.moveTo(side * r * 0.4, r * 0.15);
        ctx.lineTo(side * r * 0.95, r * 0.05);
        ctx.moveTo(side * r * 0.4, r * 0.25);
        ctx.lineTo(side * r * 0.95, r * 0.3);
        ctx.stroke();
      });
    }

    drawGloss(ctx, r);

    if (look.cheeks) {
      ctx.fillStyle = look.cheeks;
      ctx.beginPath();
      ctx.arc(-r * 0.7, r * 0.05, r * 0.22, 0, Math.PI * 2);
      ctx.arc(r * 0.7, r * 0.05, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    var eyeR = look.bigEyes ? r * 0.2 : r * 0.14;
    if (look.eyesClosed) {
      ctx.strokeStyle = "#2b2b2b";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(-r * 0.32, -r * 0.05, eyeR, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.arc(r * 0.32, -r * 0.05, eyeR, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#2b2b2b";
      ctx.beginPath();
      ctx.arc(-r * 0.32, -r * 0.1, eyeR, 0, Math.PI * 2);
      ctx.arc(r * 0.32, -r * 0.1, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-r * 0.27, -r * 0.14, eyeR * 0.3, 0, Math.PI * 2);
      ctx.arc(r * 0.37, -r * 0.14, eyeR * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawMew(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.ellipse(0, r * 0.95, r * 1.3, r * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#f7b8d0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r * 0.6, r * 0.3);
    ctx.bezierCurveTo(r * 1.6, r * 0.2, r * 1.8, -r * 0.6, r * 1.1, -r * 0.9);
    ctx.stroke();

    ctx.fillStyle = "#f8c6dc";
    ctx.beginPath();
    ctx.ellipse(0, r * 0.15, r * 0.72, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.fillStyle = "#fbd3e6";
    ctx.beginPath();
    ctx.arc(-r * 0.55, -r * 1.05, r * 0.22, 0, Math.PI * 2);
    ctx.arc(r * 0.55, -r * 1.05, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 0.85, r * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    drawGloss(ctx, r);

    ctx.fillStyle = "#2b2b2b";
    ctx.beginPath();
    ctx.arc(-r * 0.32, -r * 0.55, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.32, -r * 0.55, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-r * 0.27, -r * 0.6, r * 0.05, 0, Math.PI * 2);
    ctx.arc(r * 0.37, -r * 0.6, r * 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawMewtwo(ctx, x, y, r) {
    var R = r * 1.5;
    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = "#b8a8c8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(R * 0.1, R * 0.7);
    ctx.bezierCurveTo(R * 0.9, R * 0.6, R * 1.1, R * 0.1, R * 0.75, -R * 0.15);
    ctx.stroke();
    ctx.fillStyle = "#8a76a0";
    ctx.beginPath();
    ctx.ellipse(R * 0.75, -R * 0.15, R * 0.12, R * 0.09, 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#7a6890";
    ctx.beginPath();
    ctx.ellipse(-R * 0.28, R * 0.85, R * 0.16, R * 0.3, 0, 0, Math.PI * 2);
    ctx.ellipse(R * 0.28, R * 0.85, R * 0.16, R * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#9d89b5";
    ctx.beginPath();
    ctx.moveTo(-R * 0.55, R * 0.5);
    ctx.quadraticCurveTo(-R * 0.62, -R * 0.15, -R * 0.32, -R * 0.35);
    ctx.lineTo(R * 0.32, -R * 0.35);
    ctx.quadraticCurveTo(R * 0.62, -R * 0.15, R * 0.55, R * 0.5);
    ctx.quadraticCurveTo(0, R * 0.65, -R * 0.55, R * 0.5);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#8a76a0";
    ctx.beginPath();
    ctx.ellipse(-R * 0.68, R * 0.05, R * 0.14, R * 0.32, 0.15, 0, Math.PI * 2);
    ctx.ellipse(R * 0.68, R * 0.05, R * 0.14, R * 0.32, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#6a5880";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-R * 0.2, -R * 0.32);
    ctx.lineTo(-R * 0.28, -R * 0.52);
    ctx.moveTo(R * 0.2, -R * 0.32);
    ctx.lineTo(R * 0.28, -R * 0.52);
    ctx.stroke();

    ctx.fillStyle = "#ab97c2";
    ctx.beginPath();
    ctx.ellipse(0, -R * 0.65, R * 0.4, R * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.stroke();

    drawGloss(ctx, R * 0.6);

    ctx.fillStyle = "#5b2f8a";
    ctx.beginPath();
    ctx.ellipse(-R * 0.15, -R * 0.68, R * 0.09, R * 0.05, 0, 0, Math.PI * 2);
    ctx.ellipse(R * 0.15, -R * 0.68, R * 0.09, R * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function triangle(ctx, x1, y1, x2, y2, x3, y3) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
  }

  function drawTile(ctx, tile, x, y) {
    if (tile.type === "path") {
      ctx.fillStyle = "#d8b978";
    } else if (tile.type === "tallgrass") {
      ctx.fillStyle = "#2c7d43";
    } else {
      ctx.fillStyle = GRASS_SHADES[tile.shade];
    }
    ctx.fillRect(x, y, TILE, TILE);

    if (tile.type === "tallgrass") {
      ctx.strokeStyle = "#1f6b35";
      ctx.lineWidth = 2;
      for (var i = 0; i < 4; i++) {
        var gx = x + 6 + (i % 2) * 14 + (Math.floor(i / 2) * 10);
        ctx.beginPath();
        ctx.moveTo(gx, y + TILE - 4);
        ctx.lineTo(gx - 2, y + TILE - 16);
        ctx.stroke();
      }
    }

    if (tile.flower) {
      drawFlower(ctx, x + TILE / 2, y + TILE / 2 + 5);
    }

    if (tile.type === "tree") {
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(x + TILE / 2 - 4, y + TILE - 14, 8, 14);
      ctx.fillStyle = "#2e6b3a";
      ctx.beginPath();
      ctx.arc(x + TILE / 2, y + TILE / 2 - 4, 17, 0, Math.PI * 2);
      ctx.fill();
    }

    if (tile.type === "rock") {
      ctx.fillStyle = "#9a9a9a";
      ctx.beginPath();
      ctx.ellipse(x + TILE / 2, y + TILE / 2 + 4, 15, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawShadow(ctx, x, y) {
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(x, y, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFlower(ctx, x, y) {
    ctx.fillStyle = "#ffef7a";
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff2f9";
    var petalDx = [0, 3.2, 3.2, 0, -3.2, -3.2];
    var petalDy = [-3.2, -1.6, 1.6, 3.2, 1.6, -1.6];
    for (var i = 0; i < 6; i += 2) {
      ctx.beginPath();
      ctx.arc(x + petalDx[i], y + petalDy[i], 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function randInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }
})();
