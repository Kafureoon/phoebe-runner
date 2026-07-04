(() => {
  "use strict";

  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d");
  const scoreText = document.querySelector("#scoreText");
  const bestText = document.querySelector("#bestText");
  const sceneText = document.querySelector("#sceneText");
  const statusText = document.querySelector("#statusText");
  const jumpBtn = document.querySelector("#jumpBtn");
  const duckBtn = document.querySelector("#duckBtn");
  const restartBtn = document.querySelector("#restartBtn");

  const WIDTH = 960;
  const HEIGHT = 430;
  const GROUND_Y = 338;
  const PLAYER_X = 128;
  const PLAYER_W = 64;
  const PLAYER_H = 96;
  const DUCK_W = 84;
  const DUCK_H = 48;
  const GRAVITY = 1850;
  const JUMP_SPEED = -735;
  const SMALL_JUMP_SPEED = -590;
  const BIG_JUMP_HOLD_TIME = 0.12;
  const SCORE_DISTANCE_UNIT = 10.5;
  const SPEED_BASE = 345;
  const SPEED_STEP_SCORE = 500;
  const SPEED_STEP_GAIN = 55;
  const SPEED_MAX = 840;
  const SHIELD_DURATION = 30;
  const SHIELD_SIZE = 46;
  const POWERUP_FIRST_MIN_SCORE = 500;
  const POWERUP_FIRST_MAX_SCORE = 1000;
  const POWERUP_REPEAT_MIN_SCORE = 1600;
  const POWERUP_REPEAT_MAX_SCORE = 2600;
  const TRACK_SPEED = 235;
  const SCENERY_SPEED = 38;
  const SCENE_STEP = 1500;
  const SCENE_BLEND_SECONDS = 1.1;
  const DROP_OBSTACLE_SCORE = 2000;
  const BIG_OBSTACLE_SCORE = 4000;
  const BIG_OBSTACLE_CHANCE = 0.32;
  const BIG_OBSTACLE_MIN_HEIGHT = 116;
  const BIG_OBSTACLE_MAX_HEIGHT = 126;
  const BIG_OBSTACLE_MAX_WIDTH = 148;
  const BOUNCE_OBSTACLE_SCORE = 6000;
  const BOUNCE_OBSTACLE_CHANCE = 0.42;
  const BOUNCE_BIG_CHANCE = 0.34;
  const BOUNCE_DURATION = 0.88;
  const BOUNCE_BIG_MIN_HEIGHT = 98;
  const BOUNCE_BIG_MAX_HEIGHT = 110;
  const BOUNCE_BIG_MAX_WIDTH = 136;
  const BOUNCE_LIFT_MIN = 58;
  const BOUNCE_LIFT_MAX = 70;
  const TILE_OVERLAP = 8;
  const WEATHER_LIMIT = 64;
  const BEST_KEY = "phoebe-runner-best-v2";

  const colors = {
    ink: "#2a2438",
    paper: "rgba(255, 250, 236, 0.86)",
    shadow: "rgba(36, 28, 46, 0.24)",
    soil: "#2b2936",
    soilLine: "rgba(255, 255, 255, 0.18)",
  };

  const SCENES = [
    {
      id: "water",
      name: "水岸庭院",
      tint: ["#dff5ff", "#fff2cc", "#b9e7ff"],
      layers: {
        far: "./assets/scenes/scene1_far.png",
        mid: "./assets/scenes/scene1_mid.png",
        midCut: "./assets/scenes/scene1_mid_cut.png",
        ground: "./assets/scenes/scene1_ground.png",
      },
      midY: 92,
      midYOffset: 4,
      midHeight: 218,
      midScale: 1.02,
      midTrackFactor: 0.55,
      obstacles: ["s1Bollard", "s1LotusPot", "s1Crystal", "s1Fence", "s1Lantern", "s1Bell"],
    },
    {
      id: "garden",
      name: "花庭小径",
      tint: ["#d9f2ff", "#fff4db", "#ffdce7"],
      layers: {
        far: "./assets/scenes/scene2_far.png",
        mid: "./assets/scenes/scene2_mid.png",
        midCut: "./assets/scenes/scene2_mid_cut.png",
        ground: "./assets/scenes/scene2_ground.png",
      },
      midYOffset: 8,
      midScale: 1.14,
      midTrackFactor: 0.5,
      obstacles: ["s2Shrub", "s2Bamboo", "s2LampSign", "s2Stone", "s2Boar", "s2Tornado"],
    },
    {
      id: "moon",
      name: "月夜海岸",
      tint: ["#172447", "#425b95", "#9bc9f5"],
      layers: {
        far: "./assets/scenes/scene3_far.png",
        mid: "./assets/scenes/scene3_mid.png",
        midCut: "./assets/scenes/scene3_mid_cut.png",
        ground: "./assets/scenes/scene3_ground.png",
      },
      midYOffset: 8,
      midScale: 1.12,
      midTrackFactor: 0.42,
      obstacles: [
        "s3Crystal",
        "s3Branch",
        "s3Lantern",
        "s3Fox",
        "s3Charm",
        "s3Spirit",
      ],
    },
    {
      id: "ruins",
      name: "黑海岸遗迹",
      tint: ["#111927", "#2f415f", "#768ca9"],
      layers: {
        far: "./assets/scenes/scene4_far.png",
        mid: "./assets/scenes/scene4_mid.png",
        midCut: "./assets/scenes/scene4_mid_cut.png",
        ground: "./assets/scenes/scene4_ground.png",
      },
      midYOffset: 8,
      midScale: 1.13,
      midTrackFactor: 0.46,
      obstacles: ["s4Terminal", "s4Cube", "s4Crystal", "s4Obelisk", "s4Pool", "s4Barricade"],
    },
  ];

  const WEATHER_EFFECTS = {
    water: {
      count: 36,
      shape: "leaf",
      colors: ["#7aa85a", "#d1a34d", "#efd17a", "#5d8f66"],
      vx: [-44, -18],
      vy: [24, 48],
      size: [2, 4],
      sway: 28,
      opacity: 0.82,
    },
    garden: {
      count: 46,
      shape: "petal",
      colors: ["#ffd1dc", "#f6a6c1", "#fff0f3", "#e887aa"],
      vx: [-34, -10],
      vy: [30, 58],
      size: [2, 4],
      sway: 34,
      opacity: 0.8,
    },
    moon: {
      count: 52,
      shape: "electricRain",
      colors: ["#bfeaff", "#86c7ff", "#f3fbff", "#6edfff"],
      vx: [-62, -34],
      vy: [178, 292],
      size: [1, 2],
      length: [12, 28],
      sway: 8,
      opacity: 0.66,
    },
    ruins: {
      count: 58,
      shape: "spark",
      colors: ["#9af4ff", "#b68cff", "#73d9ff", "#f0e6ff"],
      vx: [-24, 4],
      vy: [52, 104],
      size: [1, 3],
      sway: 14,
      opacity: 0.72,
    },
  };

  const BIG_OBSTACLE_TYPES = new Set([
    "s1Bollard",
    "s1LotusPot",
    "s1Crystal",
    "s1Lantern",
    "s2Shrub",
    "s2LampSign",
    "s2Stone",
    "s3Crystal",
    "s3Lantern",
    "s3Fox",
    "s4Terminal",
    "s4Crystal",
    "s4Obelisk",
  ]);

  const BOUNCE_OBSTACLE_TYPES = new Set([
    "s1Bollard",
    "s1LotusPot",
    "s1Lantern",
    "s2Shrub",
    "s2LampSign",
    "s2Stone",
    "s3Crystal",
    "s3Lantern",
    "s3Fox",
    "s4Terminal",
    "s4Crystal",
    "s4Obelisk",
  ]);

  const OBSTACLES = {
    s1Bollard: obstacle("gen_water_bollard.png", "road", 48, 65, [8, 8, 8, 5]),
    s1LotusPot: obstacle("gen_water_lotus_pot.png", "road", 58, 58, [8, 10, 8, 5]),
    s1Crystal: obstacle("gen_water_crystal.png", "road", 62, 68, [10, 8, 10, 5]),
    s1Fence: obstacle("gen_water_fence.png", "road", 88, 52, [8, 10, 8, 5]),
    s1Lantern: obstacle("gen_water_lantern.png", "road", 48, 64, [8, 8, 8, 5]),
    s1Bell: obstacle("gen_water_bell.png", "air", 44, 56, [8, 8, 8, 8], 520),

    s2Shrub: obstacle("gen_garden_shrub.png", "road", 72, 58, [10, 10, 10, 5]),
    s2Bamboo: obstacle("gen_garden_bamboo.png", "road", 86, 54, [9, 10, 9, 5]),
    s2LampSign: obstacle("gen_garden_lamp_sign.png", "road", 50, 68, [9, 9, 9, 5]),
    s2Stone: obstacle("gen_garden_stone.png", "road", 70, 58, [9, 10, 9, 5]),
    s2Boar: obstacle("gen_garden_boar.png", "road", 66, 42, [9, 8, 9, 5]),
    s2Tornado: obstacle("gen_garden_tornado.png", "air", 48, 62, [8, 8, 8, 8], 580),

    s3Crystal: obstacle("gen_moon_crystal.png", "road", 64, 62, [10, 8, 10, 5]),
    s3Branch: obstacle("gen_moon_branch.png", "road", 94, 48, [12, 10, 12, 5]),
    s3Lantern: obstacle("gen_moon_lantern.png", "road", 46, 64, [8, 8, 8, 5]),
    s3Fox: obstacle("gen_moon_fox.png", "road", 54, 58, [8, 8, 8, 5]),
    s3Charm: obstacle("gen_moon_charm.png", "air", 34, 58, [6, 7, 6, 7], 650),
    s3Spirit: obstacle("gen_moon_spirit.png", "air", 50, 44, [7, 7, 7, 7], 760),

    s4Terminal: obstacle("gen_ruins_terminal.png", "road", 78, 56, [9, 9, 9, 5]),
    s4Cube: obstacle("gen_ruins_cube.png", "air", 50, 50, [7, 7, 7, 7], 720),
    s4Crystal: obstacle("gen_ruins_crystal.png", "road", 60, 68, [8, 8, 8, 5]),
    s4Obelisk: obstacle("gen_ruins_obelisk.png", "road", 54, 72, [8, 8, 8, 5]),
    s4Pool: obstacle("gen_ruins_pool.png", "road", 76, 42, [10, 8, 10, 5]),
    s4Barricade: obstacle("gen_ruins_barricade.png", "road", 82, 58, [9, 10, 9, 5]),
  };

  const hero = {
    idle: loadImage("./assets/phoebe/idle.png"),
    hurt: loadImage("./assets/phoebe/hurt.png"),
    run: loadFrames("./assets/phoebe/run_norm_", 12),
    jump: loadFrames("./assets/phoebe/jump_", 7),
    duck: loadFrames("./assets/phoebe/duck_", 8),
  };

  const sceneImages = SCENES.map((scene) => ({
    far: loadImage(scene.layers.far),
    mid: loadImage(scene.layers.midCut),
    ground: loadImage(scene.layers.ground),
  }));

  let pixelRatio = 1;
  let lastTime = 0;
  let bestScore = readBestScore();
  let duckHeld = false;
  let jumpHeld = false;
  let game = makeGame();

  function obstacle(file, kind, width, height, hit, minScore = 0) {
    return {
      image: loadImage(`./assets/obstacles/${file}`),
      kind,
      width,
      height,
      hit,
      minScore,
    };
  }

  function loadFrames(prefix, count) {
    return Array.from({ length: count }, (_, index) => loadImage(`${prefix}${index}.png`));
  }

  function loadImage(src) {
    const image = new Image();
    image.src = src;
    return image;
  }

  function makeGame() {
    return {
      mode: "ready",
      time: 0,
      runTime: 0,
      distance: 0,
      trackDistance: 0,
      sceneryDistance: 0,
      runCycle: 0,
      sceneStep: 0,
      sceneCurrent: 0,
      sceneFrom: 0,
      sceneTo: 0,
      sceneBlend: 0,
      sceneBlendTime: 0,
      score: 0,
      bonus: 0,
      speed: SPEED_BASE,
      nextObstacle: 720,
      lastBounceSize: null,
      nextPowerup: scoreToDistance(randomBetween(POWERUP_FIRST_MIN_SCORE, POWERUP_FIRST_MAX_SCORE)),
      notice: "",
      noticeTime: 0,
      shake: 0,
      shield: {
        active: false,
        timeLeft: 0,
        charges: 0,
        flash: 0,
        breakTime: 0,
      },
      player: {
        x: PLAYER_X,
        y: GROUND_Y - PLAYER_H,
        width: PLAYER_W,
        height: PLAYER_H,
        vy: 0,
        grounded: true,
        ducking: false,
        duckTime: 0,
        jumpTime: 0,
        jumpBoosted: false,
      },
      obstacles: [],
      powerups: [],
      dust: [],
      shieldBits: [],
      motes: makeMotes(),
      weather: makeWeather(),
    };
  }

  function makeMotes() {
    return Array.from({ length: 18 }, () => ({
      x: randomBetween(0, WIDTH),
      y: randomBetween(42, 210),
      size: randomBetween(1, 3),
      drift: randomBetween(4, 14),
      phase: randomBetween(0, Math.PI * 2),
    }));
  }

  function makeWeather() {
    return Array.from({ length: WEATHER_LIMIT }, () => {
      const particle = {};
      resetWeatherParticle(particle, SCENES[0], false);
      return particle;
    });
  }

  function resetWeatherParticle(particle, scene, fromTop) {
    const config = WEATHER_EFFECTS[scene.id] || WEATHER_EFFECTS.water;
    particle.sceneId = scene.id;
    particle.x = randomBetween(-80, WIDTH + 90);
    particle.y = fromTop ? randomBetween(-80, -12) : randomBetween(20, GROUND_Y - 24);
    particle.vx = randomBetween(config.vx[0], config.vx[1]);
    particle.vy = randomBetween(config.vy[0], config.vy[1]);
    particle.size = randomBetween(config.size[0], config.size[1]);
    particle.length = config.length ? randomBetween(config.length[0], config.length[1]) : 0;
    particle.phase = randomBetween(0, Math.PI * 2);
    particle.spin = randomBetween(1.2, 3.7);
    particle.seed = randomBetween(0, Math.PI * 2);
    particle.color = config.colors[Math.floor(Math.random() * config.colors.length)];
  }

  function readBestScore() {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  function writeBestScore(value) {
    bestScore = Math.max(bestScore, value);
    try {
      localStorage.setItem(BEST_KEY, String(bestScore));
    } catch {
      // localStorage can be blocked on some local-file browser settings.
    }
  }

  function resizeCanvas() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(WIDTH * pixelRatio);
    canvas.height = Math.round(HEIGHT * pixelRatio);
    ctx.imageSmoothingEnabled = false;
  }

  function startGame() {
    if (game.mode === "gameover") game = makeGame();
    if (game.mode === "ready") {
      game.mode = "running";
      statusText.textContent = "菲比奔跑中";
    }
  }

  function restartGame() {
    game = makeGame();
    jumpHeld = false;
    duckHeld = false;
    game.mode = "running";
    statusText.textContent = "菲比奔跑中";
  }

  function jump() {
    jumpHeld = true;
    if (game.mode !== "running") startGame();
    const player = game.player;
    if (game.mode === "running" && player.grounded) {
      duckHeld = false;
      player.ducking = false;
      player.duckTime = 0;
      player.width = PLAYER_W;
      player.height = PLAYER_H;
      player.y = GROUND_Y - PLAYER_H;
      player.vy = SMALL_JUMP_SPEED;
      player.grounded = false;
      player.jumpTime = 0;
      player.jumpBoosted = false;
      spawnDust(player.x + 28, GROUND_Y - 4, 4);
    }
  }

  function releaseJump() {
    jumpHeld = false;
    const player = game.player;
    if (game.mode !== "running" || player.grounded) return;
  }

  function setDuckIntent(active) {
    duckHeld = active;
    if (active && game.mode !== "running") startGame();
  }

  function endGame() {
    if (game.mode === "gameover") return;
    game.mode = "gameover";
    game.shake = 10;
    writeBestScore(game.score);
    statusText.textContent = "撞到障碍了，按 R 重开";
  }

  function update(dt) {
    game.time += dt;
    if (game.noticeTime > 0) game.noticeTime = Math.max(0, game.noticeTime - dt);
    updateMotes(dt);
    updateWeather(dt);
    updateDust(dt);
    updateShieldBits(dt);

    if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 32);
    if (game.mode !== "running") return;

    game.runTime += dt;
    game.distance += game.speed * dt;
    game.trackDistance += TRACK_SPEED * dt;
    game.sceneryDistance += SCENERY_SPEED * dt;
    game.runCycle += clamp(8.5 + game.speed / 92, 9, 16) * dt;
    game.score = Math.floor(game.distance / SCORE_DISTANCE_UNIT) + game.bonus;
    game.speed = speedForScore(game.score);
    updateSceneTransition(dt);
    game.nextObstacle -= game.speed * dt;
    game.nextPowerup -= game.speed * dt;

    updateShield(dt);
    updatePlayer(dt);
    updateObstacles(dt);
    updatePowerups(dt);

    if (game.nextObstacle <= 0) spawnObstacle();
    if (game.nextPowerup <= 0) spawnPowerup();

    const hitObstacle = game.shield.breakTime > 0 ? null : game.obstacles.find((item) => collidesWithObstacle(item));
    if (hitObstacle) {
      if (!consumeShield(hitObstacle)) endGame();
    }
  }

  function updatePlayer(dt) {
    const player = game.player;
    if (player.grounded) {
      player.ducking = duckHeld;
      player.duckTime = player.ducking ? player.duckTime + dt : Math.max(0, player.duckTime - dt * 5.5);
      player.width = player.ducking ? DUCK_W : PLAYER_W;
      player.height = player.ducking ? DUCK_H : PLAYER_H;
      player.y = GROUND_Y - player.height;
      return;
    }

    player.jumpTime += dt;
    boostJumpIfHeld(player);
    player.ducking = false;
    player.duckTime = 0;
    player.width = PLAYER_W;
    player.height = PLAYER_H;
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;

    if (player.y >= GROUND_Y - PLAYER_H) {
      player.y = GROUND_Y - PLAYER_H;
      player.vy = 0;
      player.grounded = true;
      player.jumpTime = 0;
      player.jumpBoosted = false;
      spawnDust(player.x + 24, GROUND_Y - 4, 5);
    }
  }

  function boostJumpIfHeld(player) {
    if (!jumpHeld || player.jumpBoosted || player.jumpTime < BIG_JUMP_HOLD_TIME) return;

    const t = player.jumpTime;
    const bigY = GROUND_Y - PLAYER_H + JUMP_SPEED * t + 0.5 * GRAVITY * t * t;
    const bigVy = JUMP_SPEED + GRAVITY * t;
    player.y = Math.min(player.y, bigY);
    player.vy = Math.min(player.vy, bigVy);
    player.jumpBoosted = true;
    spawnDust(player.x + 24, player.y + PLAYER_H - 4, 2);
  }

  function updateObstacles(dt) {
    for (const item of game.obstacles) {
      item.x -= game.speed * dt;
      const spec = OBSTACLES[item.type];
      if (spec.kind === "air") {
        item.y = item.baseY + Math.sin(game.time * 5 + item.phase) * 6;
      } else if (item.drop) {
        if (!item.landed) {
          item.fallVy += item.fallGravity * dt;
          item.y = Math.min(item.baseY, item.y + item.fallVy * dt);
          if (item.y >= item.baseY) {
            item.landed = true;
            item.bounceTime = 0;
            spawnDust(item.x + item.width * 0.5, GROUND_Y - 4, item.bounce ? 8 : 5);
          }
        } else if (item.bounce && !item.bounceDone) {
          item.bounceTime += dt;
          const progress = clamp(item.bounceTime / item.bounceDuration, 0, 1);
          item.y = item.baseY - Math.sin(progress * Math.PI) * item.bounceLift;
          if (progress >= 1) {
            item.y = item.baseY;
            item.bounceDone = true;
          }
        }
      }
      if (!item.passed && item.x + item.width < PLAYER_X) {
        item.passed = true;
        game.bonus += spec.kind === "air" ? 9 : 6;
      }
    }
    game.obstacles = game.obstacles.filter((item) => item.x + item.width > -140);
  }

  function updatePowerups(dt) {
    for (const item of game.powerups) {
      item.x -= game.speed * dt;
      item.phase += dt * 4;
      item.y = item.baseY + Math.sin(item.phase) * 4;
      if (!item.collected && intersects(playerHitbox(), powerupHitbox(item))) {
        item.collected = true;
        collectShieldPowerup(item);
      }
    }
    game.powerups = game.powerups.filter((item) => !item.collected && item.x + item.width > -90);
  }

  function updateShield(dt) {
    const shield = game.shield;
    if (shield.flash > 0) shield.flash = Math.max(0, shield.flash - dt);
    if (shield.breakTime > 0) shield.breakTime = Math.max(0, shield.breakTime - dt);
    if (!shield.active) return;

    shield.timeLeft = Math.max(0, shield.timeLeft - dt);
    if (shield.timeLeft <= 0) {
      shield.active = false;
      shield.charges = 0;
      setNotice("护盾失效", 1.4);
    }
  }

  function updateShieldBits(dt) {
    for (const bit of game.shieldBits) {
      bit.x += bit.vx * dt;
      bit.y += bit.vy * dt;
      bit.vy += 120 * dt;
      bit.life -= dt;
    }
    game.shieldBits = game.shieldBits.filter((bit) => bit.life > 0);
  }

  function updateMotes(dt) {
    const scene = SCENES[activeSceneIndex()];
    const isDark = scene.id === "moon" || scene.id === "ruins";
    for (const mote of game.motes) {
      mote.x -= (mote.drift + TRACK_SPEED * 0.015) * dt;
      mote.y += Math.sin(game.time * 0.8 + mote.phase) * 0.08;
      if (mote.x < -20) {
        mote.x = WIDTH + randomBetween(20, 220);
        mote.y = randomBetween(isDark ? 38 : 48, isDark ? 210 : 190);
        mote.size = randomBetween(1, 3);
      }
    }
  }

  function updateWeather(dt) {
    const scene = SCENES[activeSceneIndex()];
    const config = WEATHER_EFFECTS[scene.id] || WEATHER_EFFECTS.water;
    for (let index = 0; index < game.weather.length; index += 1) {
      const particle = game.weather[index];
      if (particle.sceneId !== scene.id && Math.random() < dt * 5.5) {
        resetWeatherParticle(particle, scene, false);
      }
      if (index >= config.count) continue;

      particle.phase += particle.spin * dt;
      const sway = Math.sin(game.time * 1.8 + particle.seed) * config.sway;
      particle.x += (particle.vx + sway) * dt;
      particle.y += particle.vy * dt;

      const bottomLimit = scene.id === "moon" ? HEIGHT + 40 : GROUND_Y + 34;
      if (particle.x < -110 || particle.x > WIDTH + 120 || particle.y > bottomLimit) {
        resetWeatherParticle(particle, scene, true);
      }
    }
  }

  function updateDust(dt) {
    for (const bit of game.dust) {
      bit.x += bit.vx * dt;
      bit.y += bit.vy * dt;
      bit.vy += 520 * dt;
      bit.life -= dt;
    }
    game.dust = game.dust.filter((bit) => bit.life > 0);
  }

  function spawnDust(x, y, count) {
    for (let index = 0; index < count; index += 1) {
      game.dust.push({
        x,
        y,
        vx: randomBetween(-90, 26),
        vy: randomBetween(-150, -45),
        life: randomBetween(0.18, 0.34),
      });
    }
  }

  function spawnObstacle() {
    const scene = SCENES[activeSceneIndex()];
    const last = game.obstacles[game.obstacles.length - 1];
    const pool = scene.obstacles.filter((type) => {
      const spec = OBSTACLES[type];
      if (game.score < spec.minScore) return false;
      if (game.score < 480 && spec.kind === "air") return false;
      if (last && last.x > WIDTH - 240) return false;
      return true;
    });
    const wantsBig = game.score >= BIG_OBSTACLE_SCORE && Math.random() < BIG_OBSTACLE_CHANCE;
    const bigPool = wantsBig
      ? pool.filter((type) => OBSTACLES[type].kind === "road" && BIG_OBSTACLE_TYPES.has(type))
      : [];
    const canDrop = game.score >= DROP_OBSTACLE_SCORE && bigPool.length === 0 && Math.random() < 0.34;
    const dropPool = canDrop ? pool.filter((type) => OBSTACLES[type].kind === "road") : [];
    const bouncePool =
      game.score >= BOUNCE_OBSTACLE_SCORE && dropPool.length > 0 && Math.random() < BOUNCE_OBSTACLE_CHANCE
        ? dropPool.filter((type) => BOUNCE_OBSTACLE_TYPES.has(type))
        : [];
    const finalPool = bigPool.length ? bigPool : bouncePool.length ? bouncePool : dropPool.length ? dropPool : pool;
    const type = finalPool[Math.floor(Math.random() * finalPool.length)] || scene.obstacles[0];
    const spec = OBSTACLES[type];
    const big = bigPool.length > 0 && BIG_OBSTACLE_TYPES.has(type);
    const drop = !big && canDrop && spec.kind === "road";
    const bounce = drop && bouncePool.length > 0 && BOUNCE_OBSTACLE_TYPES.has(type);
    const bounceSize = bounce ? chooseBounceSize() : "none";
    const bounceBig = bounceSize === "large";
    const size = obstacleSpawnSize(spec, big, bounceBig);
    const baseY = spec.kind === "air" ? GROUND_Y - 142 : GROUND_Y - size.height;
    const y = drop ? -size.height - randomBetween(24, 96) : baseY;

    game.obstacles.push({
      type,
      x: bounce ? WIDTH - randomBetween(12, 76) : drop ? WIDTH - randomBetween(18, 106) : WIDTH + 42,
      y,
      baseY,
      width: size.width,
      height: size.height,
      phase: randomBetween(0, Math.PI * 2),
      big,
      drop,
      bounce,
      bounceSize,
      bounceBig,
      bounceTime: 0,
      bounceDuration: randomBetween(BOUNCE_DURATION * 0.92, BOUNCE_DURATION * 1.08),
      bounceLift: randomBetween(BOUNCE_LIFT_MIN, BOUNCE_LIFT_MAX),
      bounceDone: false,
      landed: !drop,
      fallVy: drop ? randomBetween(320, 460) : 0,
      fallGravity: drop ? randomBetween(2700, 3300) : 0,
      passed: false,
    });

    game.nextObstacle = safeGap(spec, drop, big, size.width, bounce);
  }

  function chooseBounceSize() {
    // Large bouncing obstacles are added after 6000 score, but small ones remain the default.
    const size = game.lastBounceSize === "large" || Math.random() >= BOUNCE_BIG_CHANCE ? "small" : "large";
    game.lastBounceSize = size;
    return size;
  }

  function spawnPowerup() {
    if (game.shield.active || game.powerups.length > 0) {
      scheduleNextPowerup(900, 1400);
      return;
    }

    const last = game.obstacles[game.obstacles.length - 1];
    const x = Math.max(WIDTH + 80, last ? last.x + last.width + 180 : WIDTH + 80);
    game.powerups.push({
      type: "shield",
      x,
      y: GROUND_Y - 86,
      baseY: GROUND_Y - 86,
      width: SHIELD_SIZE,
      height: SHIELD_SIZE,
      phase: randomBetween(0, Math.PI * 2),
      collected: false,
    });
    scheduleNextPowerup(POWERUP_REPEAT_MIN_SCORE, POWERUP_REPEAT_MAX_SCORE);
  }

  function scheduleNextPowerup(min, max) {
    const levelDelay = speedLevel(game.score) * 100;
    game.nextPowerup = scoreToDistance(randomBetween(min + levelDelay, max + levelDelay));
  }

  function obstacleSpawnSize(spec, big, bounceBig = false) {
    if (bounceBig) {
      const height = Math.round(randomBetween(BOUNCE_BIG_MIN_HEIGHT, BOUNCE_BIG_MAX_HEIGHT));
      const proportionalWidth = spec.width * (height / spec.height);
      const minWidth = Math.max(72, spec.width * 1.25);
      const width = Math.round(clamp(proportionalWidth, minWidth, BOUNCE_BIG_MAX_WIDTH));
      return { width, height };
    }

    if (!big) return { width: spec.width, height: spec.height };

    const height = Math.round(randomBetween(BIG_OBSTACLE_MIN_HEIGHT, BIG_OBSTACLE_MAX_HEIGHT));
    const proportionalWidth = spec.width * (height / spec.height);
    const minWidth = Math.max(76, spec.width * 1.35);
    const width = Math.round(clamp(proportionalWidth, minWidth, BIG_OBSTACLE_MAX_WIDTH));
    return { width, height };
  }

  function safeGap(spec, drop = false, big = false, itemWidth = spec.width, bounce = false) {
    const jumpAirTime = (Math.abs(JUMP_SPEED) * 2) / GRAVITY;
    const travel = game.speed * jumpAirTime;
    const obstacleCost = spec.kind === "air" ? 45 : itemWidth * 0.85;
    const dropCost = drop ? 90 : 0;
    const bigCost = big ? 170 : 0;
    const bounceCost = bounce ? 150 : 0;
    const minGap = Math.max(big ? 590 : bounce ? 560 : 430, travel * 0.72 + obstacleCost + 140 + dropCost + bigCost + bounceCost);
    const maxGap = minGap + Math.max(big || bounce ? 190 : 150, 270 - game.score * 0.035);
    return randomBetween(minGap, maxGap);
  }

  function collectShieldPowerup(item) {
    game.shield.active = true;
    game.shield.timeLeft = SHIELD_DURATION;
    game.shield.charges = 1;
    game.shield.flash = 0.45;
    game.shield.breakTime = 0;
    game.bonus += 12;
    spawnShieldBits(item.x + item.width * 0.5, item.y + item.height * 0.45, 18, false);
    setNotice("获得护盾：30 秒内免疫一次死亡", 2.2);
  }

  function consumeShield(hitObstacle) {
    const shield = game.shield;
    if (!shield.active || shield.charges <= 0 || shield.timeLeft <= 0) return false;

    shield.active = false;
    shield.timeLeft = 0;
    shield.charges = 0;
    shield.flash = 0;
    shield.breakTime = 0.65;
    game.shake = Math.max(game.shake, 5);
    game.bonus += 20;
    game.obstacles = game.obstacles.filter((item) => item !== hitObstacle);
    spawnShieldBits(game.player.x + 34, game.player.y + 42, 28, true);
    setNotice("护盾挡下了一次撞击", 1.8);
    scheduleNextPowerup(1300, 2100);
    return true;
  }

  function updateSceneTransition(dt) {
    const wantedStep = Math.floor(game.score / SCENE_STEP);
    if (wantedStep !== game.sceneStep) {
      game.sceneStep = wantedStep;
      game.sceneFrom = game.sceneCurrent;
      game.sceneTo = wantedStep % SCENES.length;
      game.sceneBlend = game.sceneFrom === game.sceneTo ? 0 : 0.001;
      game.sceneBlendTime = 0;
      if (game.sceneFrom === game.sceneTo) game.sceneCurrent = game.sceneTo;
    }

    if (game.sceneBlend <= 0) return;
    game.sceneBlendTime += dt;
    const t = clamp(game.sceneBlendTime / SCENE_BLEND_SECONDS, 0, 1);
    game.sceneBlend = t * t * (3 - 2 * t);
    if (t >= 1) {
      game.sceneCurrent = game.sceneTo;
      game.sceneFrom = game.sceneCurrent;
      game.sceneBlend = 0;
      game.sceneBlendTime = 0;
    }
  }

  function sceneBlendInfo() {
    return {
      base: game.sceneFrom,
      next: game.sceneTo,
      blend: game.sceneBlend,
    };
  }

  function activeSceneIndex() {
    if (game.sceneBlend > 0.5) return game.sceneTo;
    return game.sceneCurrent;
  }

  function playerHitbox() {
    const player = game.player;
    if (player.ducking) {
      return {
        x: player.x + 10,
        y: player.y + 10,
        width: player.width - 22,
        height: player.height - 12,
      };
    }
    return {
      x: player.x + 16,
      y: player.y + 16,
      width: player.width - 30,
      height: player.height - 20,
    };
  }

  function obstacleHitbox(item) {
    if (item.drop && !item.landed && item.y < item.baseY - 14) {
      return { x: item.x, y: item.y, width: 0, height: 0 };
    }
    const [left, top, right, bottom] = OBSTACLES[item.type].hit;
    const spec = OBSTACLES[item.type];
    const scaleX = item.width / spec.width;
    const scaleY = item.height / spec.height;
    return {
      x: item.x + left * scaleX,
      y: item.y + top * scaleY,
      width: item.width - (left + right) * scaleX,
      height: item.height - (top + bottom) * scaleY,
    };
  }

  function powerupHitbox(item) {
    return {
      x: item.x + 6,
      y: item.y + 6,
      width: item.width - 12,
      height: item.height - 12,
    };
  }

  function collidesWithObstacle(item) {
    const player = game.player;
    const playerBox = playerHitbox();
    const obstacleBox = obstacleHitbox(item);

    if (item.bounceBig && item.landed && !item.bounceDone) {
      const horizontalHit = playerBox.x < obstacleBox.x + obstacleBox.width && playerBox.x + playerBox.width > obstacleBox.x;
      if (!horizontalHit) return false;
      return !(player.grounded && player.ducking);
    }

    return intersects(playerBox, obstacleBox);
  }

  function intersects(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function speedLevel(score) {
    return Math.floor(Math.max(0, score) / SPEED_STEP_SCORE);
  }

  function speedForScore(score) {
    return Math.min(SPEED_MAX, SPEED_BASE + speedLevel(score) * SPEED_STEP_GAIN);
  }

  function scoreToDistance(score) {
    return Math.max(0, score) * SCORE_DISTANCE_UNIT;
  }

  function setNotice(text, duration) {
    game.notice = text;
    game.noticeTime = duration;
  }

  function spawnShieldBits(x, y, count, strong) {
    const colors = strong ? ["#f8f6ff", "#a8f2ff", "#64d9ff", "#ffd86a"] : ["#dffbff", "#8be8ff", "#f9f1a7"];
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + randomBetween(-0.28, 0.28);
      const force = randomBetween(strong ? 90 : 46, strong ? 210 : 126);
      game.shieldBits.push({
        x,
        y,
        vx: Math.cos(angle) * force - game.speed * 0.08,
        vy: Math.sin(angle) * force,
        size: randomBetween(2, strong ? 5 : 4),
        life: randomBetween(0.32, strong ? 0.72 : 0.52),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  function render() {
    const info = sceneBlendInfo();
    const scene = SCENES[activeSceneIndex()];

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.save();

    if (game.shake > 0) {
      const amount = Math.ceil(game.shake);
      ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
    }

    drawScene(info.base, 1);
    if (info.blend > 0) drawScene(info.next, info.blend);
    drawWeather(scene);
    drawDust();
    drawObstacles();
    drawPowerups();
    drawPhoebe();
    drawShieldBits();
    drawOverlay();
    ctx.restore();

    scoreText.textContent = padScore(game.score);
    bestText.textContent = padScore(bestScore);
    sceneText.textContent = scene.name;
    if (game.mode === "running") statusText.textContent = runningStatusText();
  }

  function runningStatusText() {
    if (game.noticeTime > 0) return game.notice;
    const level = speedLevel(game.score) + 1;
    if (game.shield.active) return `护盾 ${Math.ceil(game.shield.timeLeft)}s / 速度 Lv.${level}`;
    return `菲比奔跑中 / 速度 Lv.${level}`;
  }

  function drawScene(index, alpha) {
    const scene = SCENES[index];
    const images = sceneImages[index];
    const farPan = game.sceneryDistance * 0.35 + index * 137;
    const midPan = game.trackDistance * (scene.midTrackFactor ?? 0.5) + index * 211;
    const trackOffset = game.trackDistance;

    ctx.save();
    ctx.globalAlpha = alpha;
    drawSky(scene);
    drawLayer(images.far, farPan, 0, 304, { mirrored: true, overlap: 6 });
    drawMotes(scene);
    drawLayer(images.ground, trackOffset, GROUND_Y - 54, 94, { mirrored: true, overlap: 10 });
    drawLayer(
      images.mid,
      midPan,
      (scene.midY ?? 112) + (scene.midYOffset ?? 0),
      (scene.midHeight ?? 184) * (scene.midScale ?? 1.1),
      { mirrored: true, overlap: 16, cropX: 1 }
    );
    rect(0, GROUND_Y + 34, WIDTH, HEIGHT - GROUND_Y - 34, colors.soil);
    rect(0, GROUND_Y + 38, WIDTH, 3, colors.soilLine);
    ctx.restore();
  }

  function drawSky(scene) {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, scene.tint[0]);
    gradient.addColorStop(0.54, scene.tint[1]);
    gradient.addColorStop(1, scene.tint[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  function drawLayer(image, offset, y, targetHeight, options = {}) {
    if (!image.complete || !image.naturalWidth) return;
    const settings = typeof options === "boolean" ? { mirrored: options } : options;
    const mirrored = Boolean(settings.mirrored);
    const cropX = Math.max(0, settings.cropX ?? 0);
    const sourceWidth = Math.max(1, image.naturalWidth - cropX * 2);
    const targetWidth = sourceWidth * (targetHeight / image.naturalHeight);
    const overlap = Math.min(settings.overlap ?? TILE_OVERLAP, Math.max(1, targetWidth * 0.08));

    if (mirrored) {
      const pairWidth = targetWidth * 2 - overlap * 2;
      const start = -positiveModulo(offset, pairWidth);
      for (let x = start - pairWidth; x < WIDTH + pairWidth; x += pairWidth) {
        drawTileImage(image, x, y, targetWidth, targetHeight, cropX, false);
        drawTileImage(image, x + targetWidth - overlap, y, targetWidth, targetHeight, cropX, true);
      }
      return;
    }

    const step = targetWidth - overlap;
    const start = -positiveModulo(offset, step);
    for (let x = start - step; x < WIDTH + step; x += step) {
      drawTileImage(image, x, y, targetWidth, targetHeight, cropX, false);
    }
  }

  function drawCoverLayer(image, pan, y, targetHeight, options = {}) {
    if (!image.complete || !image.naturalWidth) return;
    const scaleBoost = options.scale ?? 1;
    const scale = Math.max(WIDTH / image.naturalWidth, targetHeight / image.naturalHeight) * scaleBoost;
    const targetWidth = image.naturalWidth * scale;
    const targetDrawHeight = image.naturalHeight * scale;
    const panRange = Math.max(0, targetWidth - WIDTH);
    const x = panRange > 0 ? -pingPong(pan, panRange) : (WIDTH - targetWidth) / 2;
    ctx.drawImage(image, Math.round(x), Math.round(y), Math.ceil(targetWidth), Math.ceil(targetDrawHeight));
  }

  function drawTileImage(image, x, y, width, height, cropX = 0, flipped = false) {
    const sourceWidth = Math.max(1, image.naturalWidth - cropX * 2);
    const dx = Math.round(x);
    const dy = Math.round(y);
    const dw = Math.ceil(width) + 1;
    const dh = Math.ceil(height);
    if (!flipped) {
      ctx.drawImage(image, cropX, 0, sourceWidth, image.naturalHeight, dx, dy, dw, dh);
      return;
    }

    ctx.save();
    ctx.translate(Math.round(x + width) + 1, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(image, cropX, 0, sourceWidth, image.naturalHeight, 0, 0, dw, dh);
    ctx.restore();
  }

  function drawMotes(scene) {
    const darkScene = scene.id === "moon" || scene.id === "ruins";
    ctx.save();
    ctx.globalAlpha *= darkScene ? 0.72 : 0.34;
    ctx.fillStyle = darkScene ? "#b9d9ff" : "#ffffff";
    for (const mote of game.motes) {
      const size = Math.round(mote.size);
      rect(mote.x, mote.y, size, size, ctx.fillStyle);
    }
    ctx.restore();
  }

  function drawWeather(scene) {
    const config = WEATHER_EFFECTS[scene.id] || WEATHER_EFFECTS.water;
    ctx.save();
    ctx.globalAlpha = config.opacity;
    for (let index = 0; index < config.count && index < game.weather.length; index += 1) {
      const particle = game.weather[index];
      if (particle.sceneId !== scene.id) continue;
      if (config.shape === "leaf") drawLeafParticle(particle);
      else if (config.shape === "petal") drawPetalParticle(particle);
      else if (config.shape === "electricRain") drawElectricRainParticle(particle);
      else drawSparkParticle(particle);
    }
    ctx.restore();
  }

  function drawLeafParticle(particle) {
    const size = Math.max(2, Math.round(particle.size));
    const x = Math.round(particle.x + Math.sin(particle.phase) * 4);
    const y = Math.round(particle.y);
    rect(x, y, size * 2, size, particle.color);
    rect(x + size, y + size, size, size, particle.color);
    rect(x + size * 2, y, 1, size, "rgba(74, 83, 50, 0.55)");
  }

  function drawPetalParticle(particle) {
    const size = Math.max(2, Math.round(particle.size));
    const x = Math.round(particle.x + Math.sin(particle.phase) * 6);
    const y = Math.round(particle.y);
    rect(x, y, size, size, particle.color);
    rect(x + size, y + 1, size, Math.max(1, size - 1), particle.color);
    if (size > 2) rect(x + 1, y + size, size, 1, "rgba(255, 255, 255, 0.42)");
  }

  function drawElectricRainParticle(particle) {
    const x = Math.round(particle.x + Math.sin(particle.phase) * 2);
    const y = Math.round(particle.y);
    const length = Math.round(particle.length || 16);
    rect(x, y, 2, length, particle.color);
    rect(x + 2, y + Math.floor(length * 0.45), 1, Math.max(4, Math.floor(length * 0.35)), "#e8fbff");
    if (Math.sin(particle.phase * 2.1) > 0.78) {
      rect(x - 2, y + length - 3, 6, 2, "rgba(194, 240, 255, 0.72)");
    }
  }

  function drawSparkParticle(particle) {
    const size = Math.max(1, Math.round(particle.size));
    const pulse = Math.sin(particle.phase * 2) > 0.35;
    const x = Math.round(particle.x + Math.sin(particle.phase) * 3);
    const y = Math.round(particle.y);
    rect(x, y, size + 1, size + 1, particle.color);
    if (pulse) {
      rect(x - 2, y + size, 2, 1, "rgba(160, 243, 255, 0.68)");
      rect(x + size + 1, y + size, 2, 1, "rgba(196, 153, 255, 0.68)");
      rect(x + size, y - 2, 1, 2, "rgba(237, 247, 255, 0.58)");
    }
  }

  function drawDust() {
    ctx.save();
    ctx.fillStyle = "rgba(119, 95, 72, 0.5)";
    for (const bit of game.dust) {
      ctx.globalAlpha = clamp(bit.life / 0.34, 0, 1);
      ctx.fillRect(Math.round(bit.x), Math.round(bit.y), 3, 3);
    }
    ctx.restore();
  }

  function drawObstacles() {
    for (const item of game.obstacles) {
      const spec = OBSTACLES[item.type];
      drawDropWarning(item);
      drawBounceCue(item);
      drawObstacleGrounding(item, spec);
      drawBounceModelAccent(item);
      if (spec.image.complete && spec.image.naturalWidth) {
        ctx.drawImage(spec.image, Math.round(item.x), Math.round(item.y), Math.round(item.width), Math.round(item.height));
      } else {
        rect(item.x, item.y, item.width, item.height, "#69a6d8");
      }
      drawBounceModelHighlight(item);
    }
  }

  function drawBounceModelAccent(item) {
    if (!item.bounceBig) return;
    const pulse = item.landed && !item.bounceDone ? 0.42 + Math.sin(item.bounceTime * 18) * 0.18 : 0.28;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#ff7fcf";
    ctx.fillRect(Math.round(item.x - 3), Math.round(item.y + item.height * 0.18), 3, Math.round(item.height * 0.58));
    ctx.fillRect(Math.round(item.x + item.width), Math.round(item.y + item.height * 0.18), 3, Math.round(item.height * 0.58));
    ctx.fillRect(Math.round(item.x + item.width * 0.18), Math.round(item.y - 3), Math.round(item.width * 0.64), 3);
    ctx.restore();
  }

  function drawBounceModelHighlight(item) {
    if (!item.bounceBig) return;
    ctx.save();
    ctx.globalAlpha = item.landed && !item.bounceDone ? 0.58 : 0.36;
    ctx.fillStyle = "#fff1fb";
    ctx.fillRect(Math.round(item.x + item.width * 0.18), Math.round(item.y + item.height * 0.16), Math.max(8, Math.round(item.width * 0.22)), 3);
    ctx.fillRect(Math.round(item.x + item.width * 0.16), Math.round(item.y + item.height * 0.2), 3, Math.max(10, Math.round(item.height * 0.22)));
    ctx.restore();
  }

  function drawDropWarning(item) {
    if (!item.drop || item.landed) return;
    const progress = clamp((item.y + item.height + 80) / (item.baseY + item.height + 80), 0, 1);
    const x = Math.round(item.x + item.width * 0.18);
    const y = GROUND_Y + 4;
    const width = Math.round(item.width * 0.64);
    ctx.save();
    ctx.globalAlpha = 0.28 + progress * 0.34;
    ctx.fillStyle = item.bounce ? "#ff9bd7" : progress > 0.72 ? "#ffdc74" : "#8ee8ff";
    ctx.fillRect(x, y, width, 4);
    ctx.fillRect(x - 4, y - 6, 4, 10);
    ctx.fillRect(x + width, y - 6, 4, 10);
    if (progress > 0.55) {
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = "#fff5bd";
      ctx.fillRect(x + 5, y - 10, Math.max(8, width - 10), 2);
    }
    ctx.restore();
  }

  function drawBounceCue(item) {
    if (!item.bounce || !item.landed || item.bounceDone) return;
    const progress = clamp(item.bounceTime / item.bounceDuration, 0, 1);
    const x = Math.round(item.x + item.width * 0.08);
    const y = Math.round(GROUND_Y - 88 - Math.sin(progress * Math.PI) * 8);
    const width = Math.round(item.width * 0.84);
    ctx.save();
    ctx.globalAlpha = 0.38 + Math.sin(progress * Math.PI) * 0.34;
    ctx.fillStyle = "#ff9bd7";
    ctx.fillRect(x, y, width, 3);
    ctx.fillRect(x - 4, y - 5, 4, 13);
    ctx.fillRect(x + width, y - 5, 4, 13);
    ctx.fillStyle = "#fff3fb";
    ctx.fillRect(x + 6, y - 7, Math.max(8, width - 12), 2);
    ctx.restore();
  }

  function drawObstacleGrounding(item, spec) {
    const baseY = spec.kind === "air" ? item.y + item.height + 3 : GROUND_Y + 2;
    const width = spec.kind === "air" ? item.width * 0.45 : item.width * 0.62;
    const alpha = spec.kind === "air" ? 0.12 : item.big ? 0.31 : 0.22;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#30233d";
    ctx.fillRect(Math.round(item.x + item.width * 0.18), Math.round(baseY), Math.round(width), item.big ? 7 : spec.kind === "air" ? 3 : 5);
    ctx.restore();
  }

  function drawPowerups() {
    for (const item of game.powerups) {
      if (item.type !== "shield") continue;
      drawShieldPowerup(item);
    }
  }

  function drawShieldPowerup(item) {
    const x = Math.round(item.x);
    const y = Math.round(item.y);
    const pulse = 0.55 + Math.sin(game.time * 5 + item.phase) * 0.15;

    drawShadow(x + 8, GROUND_Y + 3, 32, 0.18);
    ctx.save();
    ctx.globalAlpha = 0.58;
    rect(x + 7, y + 3, 32, 4, "#e9fbff");
    rect(x + 3, y + 9, 40, 24, "#74ddff");
    rect(x + 9, y + 33, 28, 5, "#4cc7ef");
    ctx.globalAlpha = pulse;
    rect(x + 1, y + 14, 4, 14, "#ffffff");
    rect(x + 41, y + 14, 4, 14, "#ffffff");
    rect(x + 17, y - 1, 12, 4, "#fff0a8");
    rect(x + 19, y + 40, 8, 4, "#fff0a8");
    ctx.restore();

    drawShieldGlyph(x + 8, y + 4, 6, 1);
  }

  function drawShieldGlyph(x, y, scale, alpha) {
    const pixels = [
      "01110",
      "12221",
      "12321",
      "12321",
      "12221",
      "01210",
      "00100",
    ];
    const palette = {
      1: "#234d74",
      2: "#8cecff",
      3: "#ffffff",
    };
    ctx.save();
    ctx.globalAlpha *= alpha;
    for (let row = 0; row < pixels.length; row += 1) {
      for (let col = 0; col < pixels[row].length; col += 1) {
        const color = palette[pixels[row][col]];
        if (color) rect(x + col * scale, y + row * scale, scale, scale, color);
      }
    }
    ctx.restore();
  }

  function drawShieldBits() {
    ctx.save();
    for (const bit of game.shieldBits) {
      ctx.globalAlpha = clamp(bit.life / 0.72, 0, 1);
      rect(bit.x, bit.y, bit.size, bit.size, bit.color);
    }
    ctx.restore();
  }

  function drawPhoebe() {
    const player = game.player;
    const visualX = player.x + playerVisualShift(player);
    let image = hero.idle;
    let targetHeight = 102;
    let xOffset = -18;
    let bottom = GROUND_Y;

    if (game.mode === "gameover") {
      image = hero.hurt;
      targetHeight = 82;
      bottom = GROUND_Y + 2;
      xOffset = -12;
    } else if (player.ducking || player.duckTime > 0) {
      const index = duckFrameIndex(player.duckTime, player.ducking);
      image = hero.duck[index];
      targetHeight = 70;
      bottom = GROUND_Y + 4;
      xOffset = -20;
    } else if (!player.grounded) {
      image = hero.jump[jumpFrameIndex(player)];
      targetHeight = 100;
      bottom = player.y + PLAYER_H;
      xOffset = -18;
    } else if (game.mode === "running") {
      image = hero.run[Math.floor(game.runCycle) % hero.run.length];
      targetHeight = 100;
      bottom = GROUND_Y;
      xOffset = -18;
    }

    if (!image.complete || !image.naturalWidth) {
      rect(visualX, player.y, player.width, player.height, "#f3d46d");
      return;
    }

    const targetWidth = image.naturalWidth * (targetHeight / image.naturalHeight);
    const targetCenterX = visualX + (player.ducking ? 38 : 28);
    const x = player.ducking || !player.grounded || game.mode === "gameover" ? visualX + xOffset : targetCenterX - targetWidth * 0.5;
    const y = bottom - targetHeight;
    drawRunStreaks(visualX, player);
    drawShadow(visualX + 7, GROUND_Y + 3, player.ducking ? 58 : 44, player.grounded ? 0.26 : 0.1);
    drawShieldAura(targetCenterX, bottom - targetHeight * 0.5, targetWidth + 22, targetHeight + 18, false);
    ctx.drawImage(image, Math.round(x), Math.round(y), Math.round(targetWidth), Math.round(targetHeight));
    drawShieldAura(targetCenterX, bottom - targetHeight * 0.5, targetWidth + 22, targetHeight + 18, true);
  }

  function drawShieldAura(centerX, centerY, width, height, foreground) {
    const shield = game.shield;
    const activeAlpha = shield.active ? 0.42 : 0;
    const flashAlpha = shield.flash > 0 ? shield.flash * 0.85 : 0;
    const breakAlpha = shield.breakTime > 0 ? shield.breakTime * 0.95 : 0;
    const alpha = Math.max(activeAlpha, flashAlpha, breakAlpha);
    if (alpha <= 0) return;

    const rx = width * 0.56;
    const ry = height * 0.52;
    const color = shield.breakTime > 0 ? "#ffd86a" : "#8defff";
    const shine = shield.breakTime > 0 ? "#fff2b5" : "#f2feff";
    ctx.save();

    if (!foreground) {
      ctx.globalAlpha = alpha * 0.18;
      ctx.fillStyle = shield.breakTime > 0 ? "#ffeab0" : "#bdf8ff";
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha * 0.2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, rx - 3, ry - 3, 0, Math.PI * 1.02, Math.PI * 1.98);
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.28;
      rect(centerX - rx * 0.48, centerY - ry * 0.58, rx * 0.52, 5, shine);
      rect(centerX - rx * 0.56, centerY - ry * 0.48, 5, 18, shine);
      rect(centerX + rx * 0.34, centerY + ry * 0.5, rx * 0.34, 4, color);
      ctx.restore();
      return;
    }

    ctx.globalAlpha = alpha * 0.64;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, rx, ry, 0, 0.06, Math.PI * 0.94);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.78;
    for (let index = 0; index < 16; index += 1) {
      const angle = (Math.PI * 2 * index) / 16;
      if (Math.sin(angle) < -0.1) continue;
      const size = index % 4 === 0 ? 5 : 3;
      rect(centerX + Math.cos(angle) * rx, centerY + Math.sin(angle) * ry, size, size, index % 3 === 0 ? shine : color);
    }

    ctx.globalAlpha = alpha * 0.45;
    rect(centerX - rx * 0.36, centerY - ry * 0.7, 12, 4, shine);
    rect(centerX - rx * 0.5, centerY - ry * 0.6, 4, 12, shine);
    ctx.restore();
  }

  function playerVisualShift(player) {
    if (game.mode !== "running") return 0;
    const launchPush = clamp(game.runTime * 36, 0, 14);
    const speedPush = clamp((game.speed - 345) / 60, 0, 7);
    const duckPullback = player.ducking ? -4 : 0;
    return launchPush + speedPush + duckPullback;
  }

  function drawRunStreaks(visualX, player) {
    if (game.mode !== "running" || !player.grounded || player.ducking) return;
    const intensity = clamp((game.speed - 390) / 360, 0, 1);
    if (intensity <= 0) return;

    const scene = SCENES[activeSceneIndex()];
    const color = scene.id === "moon" || scene.id === "ruins" ? "rgba(180, 226, 255, 0.46)" : "rgba(255, 250, 220, 0.46)";
    const count = 2 + Math.floor(intensity * 4);
    const tickSeed = Math.floor(game.time * 24);
    ctx.save();
    ctx.fillStyle = color;
    for (let index = 0; index < count; index += 1) {
      const lane = (tickSeed * 17 + index * 29) % 64;
      const x = visualX - 18 - lane;
      const y = GROUND_Y - 82 + ((tickSeed * 11 + index * 23) % 54);
      const width = 8 + Math.floor(intensity * 14) + (index % 2) * 4;
      ctx.fillRect(Math.round(x), Math.round(y), width, 2);
    }
    ctx.restore();
  }

  function duckFrameIndex(time, held) {
    if (!held) return Math.max(0, Math.min(hero.duck.length - 1, Math.floor(time * 18)));
    if (time < 0.18) return Math.min(hero.duck.length - 1, Math.floor(time * 22));
    return 4 + (Math.floor(game.time * 8) % 2);
  }

  function jumpFrameIndex(player) {
    if (player.vy < -420) return 1;
    if (player.vy < -120) return 2;
    if (player.vy < 120) return 3;
    if (player.vy < 430) return 4;
    return 5;
  }

  function drawShadow(x, y, width, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#3c2e4c";
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), 5);
    ctx.restore();
  }

  function drawOverlay() {
    if (game.mode === "running") return;
    ctx.save();
    ctx.fillStyle = colors.paper;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = colors.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 42px Trebuchet MS, Microsoft YaHei, sans-serif";
    ctx.fillText(game.mode === "ready" ? "菲比快跑" : "游戏结束", WIDTH / 2, 166);
    ctx.font = "900 22px Consolas, Microsoft YaHei, monospace";
    ctx.fillText(game.mode === "ready" ? "SPACE / TAP TO RUN" : "PRESS R TO RETRY", WIDTH / 2, 214);
    ctx.font = "800 18px Trebuchet MS, Microsoft YaHei, sans-serif";
    ctx.fillText("分数越高速度越快，场景和障碍物会随进度变化", WIDTH / 2, 254);
    ctx.restore();
  }

  function tick(now) {
    if (!lastTime) lastTime = now;
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(tick);
  }

  function onKeyDown(event) {
    if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
      event.preventDefault();
      if (event.repeat) return;
      jump();
    }
    if (["ArrowDown", "KeyS"].includes(event.code)) {
      event.preventDefault();
      setDuckIntent(true);
    }
    if (event.code === "KeyR") {
      event.preventDefault();
      restartGame();
    }
  }

  function onKeyUp(event) {
    if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
      event.preventDefault();
      releaseJump();
    }
    if (["ArrowDown", "KeyS"].includes(event.code)) {
      event.preventDefault();
      setDuckIntent(false);
    }
  }

  function padScore(value) {
    return String(Math.max(0, Math.floor(value))).padStart(5, "0");
  }

  function positiveModulo(value, mod) {
    return ((value % mod) + mod) % mod;
  }

  function pingPong(value, range) {
    if (range <= 0) return 0;
    const cycle = positiveModulo(value, range * 2);
    return cycle <= range ? cycle : range * 2 - cycle;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }

  function bindJumpControl(element) {
    element.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      jump();
    });
    element.addEventListener("pointerup", (event) => {
      event.preventDefault();
      releaseJump();
    });
    element.addEventListener("pointerleave", releaseJump);
    element.addEventListener("pointercancel", releaseJump);
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", releaseJump);
  bindJumpControl(canvas);
  bindJumpControl(jumpBtn);
  restartBtn.addEventListener("click", restartGame);
  duckBtn.addEventListener("pointerdown", () => setDuckIntent(true));
  duckBtn.addEventListener("pointerup", () => setDuckIntent(false));
  duckBtn.addEventListener("pointerleave", () => setDuckIntent(false));
  duckBtn.addEventListener("pointercancel", () => setDuckIntent(false));

  resizeCanvas();
  render();
  requestAnimationFrame(tick);
})();
