// ========================================
// RHF GAMS : CODE RPG - Game Logic Lengkap
// ========================================

let game = {
  player: {
    lvl: 1,
    exp: 0,
    hp: { max: 100, cur: 100 },
    mp: { max: 50, cur: 50 },
    atk: 10,
    def: 5,
    spd: 10,
    luck: 5,
    gold: 0,
    class: null,
    area: 0 // 0 = Training Server, dst
  },
  inventory: [],
  maxSlots: 50,
  inCombat: false,
  currentEnemy: null,
  log: [],
  areas: [
    "Training Server",
    "Data Forest",
    "Binary Desert",
    "Firewall City",
    "Dark Core"
  ],
  monsters: [
    // area 0
    { name: "Common Bug", hp: { max: 50, cur: 50 }, atk: 8, def: 2, spd: 8, exp: 20, gold: 10, drops: ["Potion"] },
    // area 1
    { name: "Rare Bug", hp: { max: 120, cur: 120 }, atk: 15, def: 8, spd: 12, exp: 50, gold: 30, drops: ["Potion", "Sword Shard"] },
    // area 2
    { name: "Elite Bug", hp: { max: 200, cur: 200 }, atk: 25, def: 15, spd: 18, exp: 100, gold: 70, drops: ["Armor Plate", "Epic Potion"] },
    // area 3+
    { name: "Virus", hp: { max: 300, cur: 300 }, atk: 20, def: 10, spd: 25, exp: 200, gold: 150, drops: ["Script Core"] }
  ]
};

// ========================================
// Utility Functions
// ========================================
function log(message, type = 'info') {
  game.log.unshift({ message, type, time: new Date().toLocaleTimeString() });
  if (game.log.length > 50) game.log.pop();
  const logEl = document.getElementById('combat-log');
  logEl.innerHTML = game.log.map(e => 
    `<div class="log-entry \( {e.type}"> \){e.time} | ${e.message}</div>`
  ).join('');
  logEl.scrollTop = 0;
}

function updatePlayerStats() {
  const stats = document.getElementById('player-stats');
  stats.innerHTML = `
    <p><strong>Level:</strong> ${game.player.lvl}</p>
    <p><strong>HP:</strong> \( {game.player.hp.cur}/ \){game.player.hp.max}</p>
    <p><strong>MP:</strong> \( {game.player.mp.cur}/ \){game.player.mp.max}</p>
    <p><strong>ATK:</strong> ${game.player.atk} | <strong>DEF:</strong> ${game.player.def}</p>
    <p><strong>SPD:</strong> ${game.player.spd} | <strong>LUCK:</strong> ${game.player.luck}</p>
    <p><strong>Gold:</strong> ${game.player.gold.toLocaleString()}</p>
    <p><strong>EXP:</strong> ${game.player.exp} / ${game.player.lvl * 100}</p>
    <p><strong>Class:</strong> ${game.player.class ? game.player.class.toUpperCase() : 'Belum dipilih'}</p>
  `;
  document.getElementById('current-area').textContent = game.areas[game.player.area];
}

function saveGame() {
  localStorage.setItem('coderpg_save', JSON.stringify(game));
  log('Game disimpan!', 'success');
}

function loadGame() {
  const saved = localStorage.getItem('coderpg_save');
  if (saved) {
    game = JSON.parse(saved);
    updatePlayerStats();
    log('Game dimuat!', 'success');
  } else {
    log('Tidak ada save ditemukan.', 'warning');
  }
}

function resetGame() {
  if (confirm('Reset semua progress? Ini permanen!')) {
    localStorage.removeItem('coderpg_save');
    location.reload();
  }
}

// ========================================
// Class Selection
// ========================================
function selectClass(cls) {
  game.player.class = cls;
  switch (cls) {
    case 'warrior': game.player.atk += 8; break;
    case 'mage': game.player.mp.max += 30; game.player.mp.cur += 30; break;
    case 'rogue': game.player.spd += 8; game.player.luck += 5; break;
    case 'tank': game.player.def += 8; game.player.hp.max += 60; game.player.hp.cur += 60; break;
  }
  document.getElementById('class-modal').classList.add('hidden');
  updatePlayerStats();
  log(`Class dipilih: ${cls.toUpperCase()}! Petualangan dimulai.`);
}

// ========================================
// Combat System
// ========================================
function huntBug() {
  if (!game.player.class) return log('Pilih class terlebih dahulu!');
  if (game.inCombat) return log('Sedang bertarung!');

  const areaMonsters = game.monsters.filter(m => 
    game.monsters.indexOf(m) >= game.player.area * 1 && 
    game.monsters.indexOf(m) < (game.player.area + 1) * 2
  );

  if (areaMonsters.length === 0) return log('Tidak ada monster di area ini.');

  game.currentEnemy = JSON.parse(JSON.stringify(areaMonsters[Math.floor(Math.random() * areaMonsters.length)]));
  game.inCombat = true;

  log(`Monster muncul: ${game.currentEnemy.name} (HP: \( {game.currentEnemy.hp.cur}/ \){game.currentEnemy.hp.max})`);
  document.getElementById('combat-actions').classList.remove('hidden');
}

function playerAction(action) {
  if (!game.inCombat) return;

  let dmg = 0;

  switch (action) {
    case 'attack':
      dmg = Math.max(1, game.player.atk - game.currentEnemy.def + Math.floor(Math.random() * 5));
      game.currentEnemy.hp.cur -= dmg;
      log(`Kamu menyerang! Memberikan ${dmg} damage.`);
      break;

    case 'skill':
      if (game.player.mp.cur < 10) return log('MP tidak cukup!');
      game.player.mp.cur -= 10;
      dmg = Math.max(1, Math.floor(game.player.atk * 1.5) - game.currentEnemy.def);
      game.currentEnemy.hp.cur -= dmg;
      log(`Fire Code! Memberikan ${dmg} damage (MP -10)`);
      break;

    case 'potion':
      const potionIndex = game.inventory.findIndex(i => i === 'Potion');
      if (potionIndex === -1) return log('Tidak ada Potion!');
      game.inventory.splice(potionIndex, 1);
      const heal = 30;
      game.player.hp.cur = Math.min(game.player.hp.max, game.player.hp.cur + heal);
      log(`Potion digunakan! +${heal} HP`);
      break;

    case 'run':
      if (Math.random() < 0.6 + (game.player.spd / 100)) {
        log('Kamu berhasil kabur!');
        endCombat(false);
        return;
      } else {
        log('Gagal kabur!');
      }
      break;
  }

  if (game.currentEnemy.hp.cur <= 0) {
    endCombat(true);
    return;
  }

  // Giliran musuh
  setTimeout(enemyTurn, 800);
}

function enemyTurn() {
  const dmg = Math.max(1, game.currentEnemy.atk - game.player.def + Math.floor(Math.random() * 4));
  game.player.hp.cur -= dmg;
  log(`${game.currentEnemy.name} menyerang! Kamu menerima ${dmg} damage.`);

  if (game.player.hp.cur <= 0) {
    log('Kamu mati... Game Over (HP dikembalikan sedikit untuk mercy).', 'danger');
    game.player.hp.cur = 10;
    endCombat(false);
  }

  updatePlayerStats();
}

function endCombat(victory) {
  game.inCombat = false;
  document.getElementById('combat-actions').classList.add('hidden');

  if (victory) {
    const expGain = game.currentEnemy.exp;
    const goldGain = game.currentEnemy.gold;
    game.player.gold += goldGain;
    game.player.exp += expGain;

    log(`Kemenangan! +\( {expGain} EXP | + \){goldGain} Gold`);

    // Level up check
    const expNeeded = game.player.lvl * 100;
    if (game.player.exp >= expNeeded) {
      game.player.lvl++;
      game.player.exp -= expNeeded;
      game.player.hp.max += 10; game.player.hp.cur = game.player.hp.max;
      game.player.mp.max += 5; game.player.mp.cur = game.player.mp.max;
      game.player.atk += 3;
      game.player.def += 2;
      game.player.spd += 1;
      log(`LEVEL UP! Kamu sekarang level ${game.player.lvl}`, 'level-up');
    }

    // Loot
    if (Math.random() < 0.4 + (game.player.luck / 100)) {
      const drop = game.currentEnemy.drops[Math.floor(Math.random() * game.currentEnemy.drops.length)];
      if (game.inventory.length < game.maxSlots) {
        game.inventory.push(drop);
        log(`Drop: ${drop}!`);
      } else {
        log('Inventory penuh! Item tidak diambil.');
      }
    }
  }

  updatePlayerStats();
}

// ========================================
// Inventory, Shop, Area
// ========================================
function openInventory() {
  const modal = document.getElementById('inventory-modal');
  const list = document.getElementById('inventory-list');
  const count = document.getElementById('inv-count');

  list.innerHTML = game.inventory.length === 0 
    ? '<p>Inventory kosong.</p>'
    : game.inventory.map((item, i) => `<div class="item">\( {item} <button onclick="useItem( \){i})">Gunakan</button></div>`).join('');

  count.textContent = `\( {game.inventory.length}/ \){game.maxSlots}`;
  modal.classList.remove('hidden');
}

function useItem(index) {
  const item = game.inventory[index];
  if (item === 'Potion') {
    const heal = 30;
    game.player.hp.cur = Math.min(game.player.hp.max, game.player.hp.cur + heal);
    log(`Potion digunakan! +${heal} HP`);
  } else if (item === 'Sword Shard') {
    game.player.atk += 5;
    log('Sword Shard digunakan! ATK +5 permanen');
  }
  game.inventory.splice(index, 1);
  openInventory(); // refresh
  updatePlayerStats();
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function openShop() {
  document.getElementById('shop-gold').textContent = game.player.gold;
  document.getElementById('shop-modal').classList.remove('hidden');
}

function buyItem(item, price) {
  if (game.player.gold < price) return log('Gold tidak cukup!');
  game.player.gold -= price;
  game.inventory.push(item);
  log(`Membeli ${item} seharga ${price} Gold`);
  openShop();
  updatePlayerStats();
}

function changeArea() {
  const next = game.player.area + 1;
  if (next >= game.areas.length) return log('Sudah di area terakhir!');
  if (game.player.lvl < next * 5) return log(`Minimal level ${next * 5} untuk masuk area berikutnya!`);

  game.player.area = next;
  log(`Berpindah ke ${game.areas[next]}`);
  updatePlayerStats();
}

// ========================================
// Matrix Background Effect
// ========================================
function initMatrix() {
  const canvas = document.createElement('canvas');
  document.getElementById('matrix').appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'.split('');
  const fontSize = 14;
  const columns = canvas.width / fontSize;
  const drops = Array(Math.floor(columns)).fill(1);

  function draw() {
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff41';
    ctx.font = fontSize + 'px monospace';

    drops.forEach((y, i) => {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * fontSize, y * fontSize);
      if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  }

  setInterval(draw, 50);
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ========================================
// Init Game
// ========================================
window.onload = () => {
  initMatrix();
  loadGame();
  if (!game.player.class) {
    // Tampilkan pemilihan class jika baru mulai
    document.getElementById('class-modal').classList.remove('hidden');
  } else {
    updatePlayerStats();
  }
};
