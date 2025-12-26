const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const payments = document.getElementById("payments");
const ui = document.getElementById("ui");
const shop = document.getElementById("shop");
const exitBtn = document.getElementById("exitBtn");

canvas.width = innerWidth;
canvas.height = innerHeight;

/* ---------- GAME STATE ---------- */
let gameRunning = false;
let shopOpen = false;
let gameOver = false;

/* ---------- INPUT ---------- */
const keys = {};
let mouse = { x: 0, y: 0 };

addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === "Escape" && gameRunning) exitToMenu();
    if (e.key.toLowerCase() === "b" && gameRunning) toggleShop();
});
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
addEventListener("mousemove", e => mouse = { x: e.clientX, y: e.clientY });
addEventListener("click", () => gameRunning && shoot());

/* ---------- DATA ---------- */
const GUNS = {
    pistol:{ name:"Pistol", dmg:10, rate:400, bullets:1, spread:0, speed:10 },
    shotgun:{ name:"Shotgun", dmg:6, rate:800, bullets:5, spread:0.5, speed:9 },
    rifle:{ name:"Rifle", dmg:14, rate:200, bullets:1, spread:0.05, speed:12 },
    laser:{ name:"Laser", dmg:25, rate:600, bullets:1, spread:0, speed:18 }
};

const ARMOR = {
    none:{ hp:100, red:0, spd:1 },
    light:{ hp:120, red:0.15, spd:0.95 },
    medium:{ hp:150, red:0.3, spd:0.85 },
    heavy:{ hp:200, red:0.45, spd:0.7 }
};

let player, bullets, enemies;
let wave, cooldown, spawnLeft, inCountdown;
let lastShot = 0;

/* ---------- MENU FUNCTIONS ---------- */
function startGame() {
    resetGame();
    menu.classList.add("hidden");
    payments.classList.add("hidden");
    ui.classList.remove("hidden");
    exitBtn.classList.remove("hidden");
    gameRunning = true;
}

function exitToMenu() {
    gameRunning = false;
    ui.classList.add("hidden");
    shop.classList.add("hidden");
    exitBtn.classList.add("hidden");
    menu.classList.remove("hidden");
}

function openPayments() {
    menu.classList.add("hidden");
    payments.classList.remove("hidden");
}

function backToMenu() {
    payments.classList.add("hidden");
    menu.classList.remove("hidden");
}

/* ---------- FAKE PAYMENTS ---------- */
function buyPremium() {
    alert("Premium Skin unlocked! 🔥");
}

function buyCoins() {
    player.coins += 500;
    alert("+500 Coins added!");
}

/* ---------- RESET GAME ---------- */
function resetGame() {
    player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        r: 15,
        gun: "pistol",
        armor: "none",
        hp: 100,
        coins: 0
    };
    bullets = [];
    enemies = [];
    wave = 0;
    cooldown = 5;
    spawnLeft = 0;
    inCountdown = true;
    gameOver = false;
}

/* ---------- SHOP ---------- */
function toggleShop() {
    shopOpen = !shopOpen;
    shop.classList.toggle("hidden", !shopOpen);
}

function buyGun(g) {
    const cost = { shotgun:150, rifle:200, laser:300 }[g];
    if (player.coins >= cost) {
        player.coins -= cost;
        player.gun = g;
    }
}

function buyArmor(a) {
    const cost = { light:150, medium:250, heavy:400 }[a];
    if (player.coins >= cost) {
        player.coins -= cost;
        player.armor = a;
        player.hp = ARMOR[a].hp;
    }
}

/* ---------- GAME LOOP ---------- */
function shoot() {
    if (!gameRunning || shopOpen || inCountdown) return;
    const g = GUNS[player.gun];
    if (Date.now() - lastShot < g.rate) return;
    lastShot = Date.now();

    const base = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    for (let i = 0; i < g.bullets; i++) {
        const a = base + (Math.random() - 0.5) * g.spread;
        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(a) * g.speed,
            vy: Math.sin(a) * g.speed,
            dmg: g.dmg
        });
    }
}

/* ---------- WAVES ---------- */
setInterval(() => {
    if (!gameRunning) return;

    if (inCountdown) {
        cooldown--;
        if (cooldown <= 0) {
            wave++;
            spawnLeft = 3 + wave * 2;
            cooldown = 5;
            inCountdown = false;
        }
    } else {
        if (spawnLeft > 0) {
            enemies.push({
                x: Math.random() < 0.5 ? -50 : canvas.width + 50,
                y: Math.random() * canvas.height,
                r: 20,
                hp: 40 + wave * 10
            });
            spawnLeft--;
        } else if (enemies.length === 0) {
            inCountdown = true;
        }
    }
}, 1000);

function update() {
    if (!gameRunning || shopOpen || inCountdown) return;

    const spd = 5 * ARMOR[player.armor].spd;
    if (keys.w) player.y -= spd;
    if (keys.s) player.y += spd;
    if (keys.a) player.x -= spd;
    if (keys.d) player.x += spd;

    bullets.forEach((b, i) => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0 || b.y < 0 || b.x > canvas.width || b.y > canvas.height)
            bullets.splice(i, 1);
    });

    enemies.forEach((e, ei) => {
        const a = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(a) * 2;
        e.y += Math.sin(a) * 2;

        bullets.forEach((b, bi) => {
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.r) {
                e.hp -= b.dmg;
                bullets.splice(bi, 1);
                if (e.hp <= 0) {
                    enemies.splice(ei, 1);
                    player.coins += 10;
                }
            }
        });
    });
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameRunning) return;

    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = "red";
    enemies.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
    });

    ui.innerHTML = `
💰 ${player.coins}<br>
🌊 Wave ${wave}<br>
${inCountdown ? `⏳ Next wave: ${cooldown}s` : `🧟 Enemies: ${enemies.length}`}<br>
Press B = Shop | ESC = Exit
`;
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
