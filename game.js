// Haven Pixel – Eternal Life Sim
// Versi 3-file maksimal – Professional & Anti-Bosan Edition

const canvas = document.getElementById('world-canvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');

let state = {
  gold: 500,
  happiness: 50,
  prestige: 0,
  day: 1,
  hour: 8,
  minute: 0,
  season: 0, // 0=semi, 1=panas, 2=gugur, 3=dingin
  tool: 'hand',
  world: Array(20).fill().map(() => Array(30).fill({
    ground: 'grass',
    plant: null,
    building: null,
    animal: null
  })),
  inventory: { seed_carrot: 8, seed_tomato: 5, seed_berry: 3 }
};

const TILE = 32;
const W = 30, H = 20;
const SEASONS = ['Semi', 'Panas', 'Gugur', 'Dingin'];
const WEATHERS = ['☀️ Cerah', '☁️ Berawan', '🌧️ Hujan', '❄️ Salju'];
const GROW_RATES = [1.4, 1.1, 0.7, 0.4]; // per musim

// Log system
function log(msg, color = '#00ff41') {
  const p = document.createElement('p');
  p.style.color = color;
  p.textContent = `[H ${state.day} \( {state.hour.toString().padStart(2,'0')}: \){state.minute.toString().padStart(2,'0')}] ${msg}`;
  document.getElementById('log-panel').prepend(p);
  if (document.getElementById('log-panel').children.length > 14) {
    document.getElementById('log-panel').removeChild(document.getElementById('log-panel').lastChild);
  }
}

// Update UI
function updateUI() {
  document.getElementById('gold').textContent = state.gold.toLocaleString();
  document.getElementById('happiness').textContent = Math.floor(state.happiness) + '%';
  document.getElementById('prestige').textContent = state.prestige;
  document.getElementById('season').textContent = SEASONS[state.season];
  document.getElementById('day').textContent = state.day;

  const timeOfDay = ['Pagi','Siang','Sore','Malam'][Math.floor(state.hour/6)];
  document.getElementById('time').textContent = `${timeOfDay} – \( {state.hour.toString().padStart(2,'0')}: \){state.minute.toString().padStart(2,'0')}`;

  // Weather random setiap jam
  if (state.minute === 0) {
    document.getElementById('weather').textContent = WEATHERS[Math.floor(Math.random()*WEATHERS.length)];
  }
}

// Draw world with glow & detail
function drawWorld() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = state.world[y][x];
      let baseColor = '#0f3f0f';

      if (t.ground === 'dirt') baseColor = '#6b4423';
      if (state.season === 2) baseColor = '#8b5a2b'; // gugur
      if (state.season === 3) baseColor = '#d0e0ff'; // dingin

      ctx.fillStyle = baseColor;
      ctx.fillRect(x*TILE, y*TILE, TILE, TILE);

      // Plant
      if (t.plant) {
        const g = t.plant.growth;
        let plantColor = g < 30 ? '#aaffaa' : g < 70 ? '#55ff55' : '#00ff41';
        if (g >= 100) plantColor = '#ffdd00';
        ctx.fillStyle = plantColor;
        ctx.shadowColor = plantColor;
        ctx.shadowBlur = 12;
        ctx.fillRect(x*TILE + 8, y*TILE + 8, TILE-16, TILE-16);
        ctx.shadowBlur = 0;
      }

      // Building
      if (t.building) {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x*TILE + 4, y*TILE + 4, TILE-8, TILE-8);
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(x*TILE + 6, y*TILE + 6, TILE-12, TILE-20);
      }

      // Animal
      if (t.animal) {
        ctx.fillStyle = t.animal.type === 'chicken' ? '#ffd700' : '#c19a6b';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x*TILE + TILE/2, y*TILE + TILE/2, TILE/3, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }
}

// Time tick (1 detik real = 1 menit game – cepat untuk testing, bisa diubah ke 60 detik)
setInterval(() => {
  state.minute++;
  if (state.minute >= 60) {
    state.minute = 0;
    state.hour++;
    if (state.hour >= 24) {
      state.hour = 0;
      state.day++;
      dailyEvent();
      if (state.day % 7 === 0) state.season = (state.season + 1) % 4;
    }
  }

  // Growth & happiness update
  let totalAnimalHappy = 0;
  let animalCount = 0;

  state.world.forEach((row, y) => row.forEach((t, x) => {
    if (t.plant) {
      let rate = GROW_RATES[state.season];
      if (document.getElementById('weather').textContent.includes('Hujan')) rate *= 1.5;
      t.plant.growth = Math.min(100, (t.plant.growth || 0) + rate);
    }
    if (t.animal) {
      animalCount++;
      totalAnimalHappy += t.animal.happiness = Math.max(0, Math.min(100, t.animal.happiness + (Math.random()*1.2 - 0.6)));
      if (Math.random() < 0.02) state.gold += 8; // telur/emas kecil
    }
  }));

  if (animalCount > 0) {
    state.happiness += (totalAnimalHappy / animalCount) * 0.015;
  }
  state.happiness = Math.max(10, Math.min(100, state.happiness + (Math.random()*0.4 - 0.2)));

  updateUI();
  drawWorld();
}, 1000); // 1 detik real = 1 menit game

// Daily surprise & seasonal effect
function dailyEvent() {
  const r = Math.random();
  if (r < 0.3) {
    state.gold += 60 + state.prestige * 15;
    log("Pedagang misterius lewat! + emas", '#ffd700');
  } else if (r < 0.45) {
    state.happiness += 10 + state.prestige * 2;
    log("Angin sepoi membawa kebahagiaan +10~", '#00d4ff');
  } else if (r < 0.55 && state.inventory.seed_carrot < 20) {
    state.inventory.seed_carrot += 4;
    log("Benih beterbangan datang! +4 wortel", '#88ff88');
  }
}

// Prestige Reset
function prestigeReset() {
  if (state.gold < 1500 && state.prestige === 0) {
    alert("Butuh minimal 1.500 emas atau prestige sebelumnya!");
    return;
  }
  if (!confirm("Reset dunia? Kamu akan dapat prestige point permanen!")) return;

  const gain = Math.floor(Math.sqrt(state.gold / 80) + state.day / 12 + state.happiness / 20);
  state.prestige += gain;
  log(`Prestige +${gain}! Dunia baru dimulai...`, '#ffea00');

  state.gold = 500 + state.prestige * 250;
  state.happiness = 50;
  state.day = 1;
  state.season = 0;
  state.hour = 8;
  state.minute = 0;

  // Bonus permanen
  state.inventory.seed_carrot += state.prestige * 3;

  // Reset world partially
  state.world.forEach(row => row.forEach(t => {
    t.plant = null;
    if (Math.random() < 0.3) t.ground = 'grass';
  }));

  drawWorld();
}

// Klik interaksi
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE);
  const y = Math.floor((e.clientY - rect.top) / TILE);

  if (x < 0 || x >= W || y < 0 || y >= H) return;

  const tile = state.world[y][x];

  if (state.tool === 'plant' && !tile.plant && state.inventory.seed_carrot > 0) {
    tile.plant = { type: 'carrot', growth: 0 };
    state.inventory.seed_carrot--;
    log(`Menanam wortel (\( {x}, \){y})`);
  }

  if (state.tool === 'harvest' && tile.plant?.growth >= 100) {
    state.gold += 45 + Math.floor(state.prestige * 1.5);
    tile.plant = null;
    log(`Panen berhasil! +${45 + Math.floor(state.prestige * 1.5)} emas`);
  }

  if (state.tool === 'build' && !tile.building && state.gold >= 280) {
    tile.building = 'house';
    state.gold -= 280;
    state.happiness += 9;
    log(`Rumah dibangun → Kebahagiaan +9`);
  }

  if (state.tool === 'animal' && !tile.animal && state.gold >= 180) {
    tile.animal = { type: 'chicken', happiness: 65 + Math.floor(Math.random()*20) };
    state.gold -= 180;
    log(`Ayam baru ditangkap! Mulai menghasilkan...`);
  }

  drawWorld();
});

// Tooltip hover
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE);
  const y = Math.floor((e.clientY - rect.top) / TILE);

  if (x >= 0 && x < W && y >= 0 && y < H) {
    const t = state.world[y][x];
    let tip = `(\( {x}, \){y})`;
    if (t.plant) tip += ` Tanaman: ${t.plant.growth.toFixed(0)}%`;
    if (t.building) tip += ` Bangunan: ${t.building}`;
    if (t.animal) tip += ` Hewan: ${t.animal.happiness.toFixed(0)}% happy`;
    tooltip.textContent = tip;
    tooltip.style.left = `${e.clientX + 16}px`;
    tooltip.style.top = `${e.clientY - 40}px`;
    tooltip.style.display = 'block';
  } else {
    tooltip.style.display = 'none';
  }
});

// Init
log("Selamat datang di Haven Pixel!", '#00ff41');
log("Klik mana saja → tanam, panen, bangun, pelihara...", '#88ff88');
drawWorld();
