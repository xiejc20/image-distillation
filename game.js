const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("start-btn");
const controls = document.querySelectorAll(".mobile-controls [data-dir]");

const state = {
  running: false,
  score: 0,
  highScore: Number(localStorage.getItem("space-high-score") || 0),
  ship: { x: canvas.width / 2 - 20, y: canvas.height - 90, w: 40, h: 54, speed: 6 },
  keys: new Set(),
  meteors: [],
  stars: Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.4,
    s: Math.random() * 1.2 + 0.4,
  })),
};

highScoreEl.textContent = state.highScore;

function resetGame() {
  state.score = 0;
  scoreEl.textContent = "0";
  state.meteors = [];
  state.ship.x = canvas.width / 2 - state.ship.w / 2;
  state.ship.y = canvas.height - 90;
}

function spawnMeteor() {
  const size = 20 + Math.random() * 36;
  state.meteors.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    size,
    speed: 2.4 + Math.random() * 2.7 + state.score * 0.015,
  });
}

function moveShip() {
  const { ship, keys } = state;
  if (keys.has("ArrowLeft") || keys.has("a")) ship.x -= ship.speed;
  if (keys.has("ArrowRight") || keys.has("d")) ship.x += ship.speed;
  if (keys.has("ArrowUp") || keys.has("w")) ship.y -= ship.speed;
  if (keys.has("ArrowDown") || keys.has("s")) ship.y += ship.speed;

  ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));
}

function updateWorld() {
  state.stars.forEach((star) => {
    star.y += star.s;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });

  if (Math.random() < 0.03 + state.score * 0.00003) {
    spawnMeteor();
  }

  state.meteors.forEach((meteor) => {
    meteor.y += meteor.speed;
  });

  state.meteors = state.meteors.filter((meteor) => meteor.y < canvas.height + meteor.size);
}

function hitTest(meteor) {
  const ship = state.ship;
  return !(
    ship.x + ship.w < meteor.x ||
    ship.x > meteor.x + meteor.size ||
    ship.y + ship.h < meteor.y ||
    ship.y > meteor.y + meteor.size
  );
}

function drawShip() {
  const { x, y, w, h } = state.ship;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);

  ctx.fillStyle = "#87f6ff";
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(w / 2, h / 2);
  ctx.lineTo(0, h / 3);
  ctx.lineTo(-w / 2, h / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#1c3956";
  ctx.beginPath();
  ctx.arc(0, -8, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f5faff";
  state.stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });

  state.meteors.forEach((meteor) => {
    ctx.fillStyle = "#9f5d4b";
    ctx.beginPath();
    ctx.arc(
      meteor.x + meteor.size / 2,
      meteor.y + meteor.size / 2,
      meteor.size / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });

  drawShip();
}

function gameOver() {
  state.running = false;
  statusEl.textContent = `游戏结束！你的得分是 ${Math.floor(state.score)}。点击“开始游戏”再来一局。`;
  statusEl.classList.add("game-over");
}

function tick() {
  if (!state.running) {
    drawScene();
    return;
  }

  moveShip();
  updateWorld();

  for (const meteor of state.meteors) {
    if (hitTest(meteor)) {
      gameOver();
      return;
    }
  }

  state.score += 0.16;
  const displayScore = Math.floor(state.score);
  scoreEl.textContent = String(displayScore);

  if (displayScore > state.highScore) {
    state.highScore = displayScore;
    highScoreEl.textContent = String(displayScore);
    localStorage.setItem("space-high-score", String(displayScore));
  }

  drawScene();
  requestAnimationFrame(tick);
}

function startGame() {
  resetGame();
  statusEl.textContent = "航线已开启，祝你好运！";
  statusEl.classList.remove("game-over");
  state.running = true;
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  state.keys.add(event.key);
});

window.addEventListener("keyup", (event) => {
  state.keys.delete(event.key);
});

controls.forEach((btn) => {
  const map = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
  const key = map[btn.dataset.dir];
  btn.addEventListener("touchstart", () => state.keys.add(key));
  btn.addEventListener("touchend", () => state.keys.delete(key));
  btn.addEventListener("mousedown", () => state.keys.add(key));
  btn.addEventListener("mouseup", () => state.keys.delete(key));
  btn.addEventListener("mouseleave", () => state.keys.delete(key));
});

startBtn.addEventListener("click", startGame);
drawScene();
