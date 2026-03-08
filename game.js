const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');
const messageEl = document.getElementById('message');
const startBtn = document.getElementById('startBtn');

const keys = new Set();
const player = { x: canvas.width / 2 - 18, y: canvas.height - 70, size: 36, speed: 5 };

let asteroids = [];
let stars = [];
let score = 0;
let health = 3;
let running = false;
let spawnTimer = 0;
let frameId = null;

function initStars() {
  stars = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.8 + 0.4,
    speed: Math.random() * 0.8 + 0.2,
  }));
}

function resetGame() {
  asteroids = [];
  score = 0;
  health = 3;
  spawnTimer = 0;
  player.x = canvas.width / 2 - player.size / 2;
  player.y = canvas.height - 70;
  scoreEl.textContent = '0';
  healthEl.textContent = '3';
  messageEl.textContent = '小心！陨石正在加速坠落。';
}

function spawnAsteroid() {
  const size = Math.random() * 26 + 20;
  asteroids.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    size,
    speed: Math.random() * 2 + 1.6 + score * 0.01,
    spin: Math.random() * 0.04 - 0.02,
    angle: Math.random() * Math.PI * 2,
  });
}

function drawShip() {
  const { x, y, size } = player;
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.fillStyle = '#79f5ff';
  ctx.beginPath();
  ctx.moveTo(0, -size / 2);
  ctx.lineTo(size / 2.8, size / 2);
  ctx.lineTo(0, size / 4);
  ctx.lineTo(-size / 2.8, size / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#2f5fff';
  ctx.fillRect(-size / 7, size / 5, size / 3.5, size / 3.2);
  ctx.restore();
}

function drawAsteroid(asteroid) {
  ctx.save();
  ctx.translate(asteroid.x + asteroid.size / 2, asteroid.y + asteroid.size / 2);
  ctx.rotate(asteroid.angle);
  ctx.fillStyle = '#9a7f6b';
  ctx.beginPath();
  const r = asteroid.size / 2;
  for (let i = 0; i < 8; i++) {
    const theta = (Math.PI * 2 * i) / 8;
    const jitter = r * (0.75 + Math.random() * 0.3);
    const px = Math.cos(theta) * jitter;
    const py = Math.sin(theta) * jitter;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const star of stars) {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
    ctx.beginPath();
    ctx.fillStyle = '#d4ebff';
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function updatePlayer() {
  if (keys.has('arrowleft') || keys.has('a')) player.x -= player.speed;
  if (keys.has('arrowright') || keys.has('d')) player.x += player.speed;
  if (keys.has('arrowup') || keys.has('w')) player.y -= player.speed;
  if (keys.has('arrowdown') || keys.has('s')) player.y += player.speed;

  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
}

function collide(a, b) {
  return !(
    a.x + a.size < b.x ||
    a.x > b.x + b.size ||
    a.y + a.size < b.y ||
    a.y > b.y + b.size
  );
}

function loop() {
  if (!running) return;

  drawBackground();
  updatePlayer();

  spawnTimer += 1;
  const threshold = Math.max(15, 50 - Math.floor(score / 25));
  if (spawnTimer >= threshold) {
    spawnTimer = 0;
    spawnAsteroid();
  }

  const shipBox = { x: player.x + 5, y: player.y + 6, size: player.size - 10 };

  for (let i = asteroids.length - 1; i >= 0; i--) {
    const asteroid = asteroids[i];
    asteroid.y += asteroid.speed;
    asteroid.angle += asteroid.spin;

    if (asteroid.y > canvas.height) {
      asteroids.splice(i, 1);
      score += 1;
      scoreEl.textContent = String(score);
      continue;
    }

    drawAsteroid(asteroid);

    const asteroidBox = { x: asteroid.x, y: asteroid.y, size: asteroid.size };
    if (collide(shipBox, asteroidBox)) {
      asteroids.splice(i, 1);
      health -= 1;
      healthEl.textContent = String(health);
      if (health <= 0) {
        running = false;
        messageEl.textContent = `游戏结束！最终得分：${score}。点击“开始游戏”重来。`;
        startBtn.disabled = false;
        cancelAnimationFrame(frameId);
      }
    }
  }

  drawShip();

  if (running) {
    frameId = requestAnimationFrame(loop);
  }
}

window.addEventListener('keydown', (event) => {
  keys.add(event.key.toLowerCase());
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

startBtn.addEventListener('click', () => {
  resetGame();
  if (!stars.length) initStars();
  running = true;
  startBtn.disabled = true;
  frameId = requestAnimationFrame(loop);
});

initStars();
drawBackground();
drawShip();
