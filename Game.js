const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let gameState = 'playing'; // 'playing', 'won', 'lost'
let killCount = 0;
let playerHealth = 3;
let gameWidth = canvas.width = 1000;
let gameHeight = canvas.height = 600;

// Player (Wasp)
const player = {
    x: gameWidth / 2,
    y: gameHeight / 2,
    vx: 0,
    vy: 0,
    speed: 4,
    size: 12,
    angle: 0,
    stingCooldown: 0,
    stingRange: 30,
    health: 3
};

// Enemies (Bumblebees)
let enemies = [];
let enemySpawnTimer = 0;
const maxEnemies = 8;

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Mouse tracking for angle
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
});

// Enemy class
class Bumblebee {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.speed = 1.5;
        this.size = 14;
        this.angle = Math.random() * Math.PI * 2;
        this.health = 1;
        this.attackCooldown = 0;
        this.attackRange = 35;
    }

    update() {
        // Chase player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.vx = (dx / distance) * this.speed;
            this.vy = (dy / distance) * this.speed;
            this.angle = Math.atan2(dy, dx);
        }

        this.x += this.vx;
        this.y += this.vy;

        // Wrap around screen (isometric movement)
        if (this.x < -50) this.x = gameWidth + 50;
        if (this.x > gameWidth + 50) this.x = -50;
        if (this.y < -50) this.y = gameHeight + 50;
        if (this.y > gameHeight + 50) this.y = -50;

        // Check collision with player
        const playerDist = Math.sqrt(dx * dx + dy * dy);
        if (playerDist < this.size + player.size) {
            if (this.attackCooldown <= 0) {
                playerHealth--;
                this.attackCooldown = 30;
                if (playerHealth <= 0) {
                    gameState = 'lost';
                    showGameOver();
                }
            }
        }

        this.attackCooldown--;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Isometric shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 8, this.size * 1.2, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (golden yellow)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.2, this.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stripes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 4, -this.size * 0.7);
            ctx.lineTo(i * 4, this.size * 0.7);
            ctx.stroke();
        }

        // Head
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, -this.size * 0.6, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-this.size * 0.25, -this.size * 0.7, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.size * 0.25, -this.size * 0.7, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-this.size * 0.25, -this.size * 0.7, this.size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.size * 0.25, -this.size * 0.7, this.size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.8, -this.size * 0.2, this.size * 0.6, this.size * 0.4, -0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(this.size * 0.8, -this.size * 0.2, this.size * 0.6, this.size * 0.4, 0.3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

function updatePlayer() {
    // Movement
    let moveX = 0;
    let moveY = 0;

    if (keys['w']) moveY -= player.speed;
    if (keys['s']) moveY += player.speed;
    if (keys['a']) moveX -= player.speed;
    if (keys['d']) moveX += player.speed;

    player.x += moveX;
    player.y += moveY;

    // Screen boundaries
    if (player.x < player.size) player.x = player.size;
    if (player.x > gameWidth - player.size) player.x = gameWidth - player.size;
    if (player.y < player.size) player.y = player.size;
    if (player.y > gameHeight - player.size) player.y = gameHeight - player.size;

    player.stingCooldown--;
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Isometric shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 8, player.size * 1.2, player.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (black with red stripes - wasp colors)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(0, 0, player.size * 1.2, player.size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stripes
    ctx.strokeStyle = '#FF4500';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 5, -player.size * 0.7);
        ctx.lineTo(i * 5, player.size * 0.7);
        ctx.stroke();
    }

    // Head
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, -player.size * 0.6, player.size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-player.size * 0.25, -player.size * 0.7, player.size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.size * 0.25, -player.size * 0.7, player.size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(-player.size * 0.25, -player.size * 0.7, player.size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.size * 0.25, -player.size * 0.7, player.size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.strokeStyle = 'rgba(255, 100, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-player.size * 0.8, -player.size * 0.2, player.size * 0.6, player.size * 0.4, -0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(player.size * 0.8, -player.size * 0.2, player.size * 0.6, player.size * 0.4, 0.3, 0, Math.PI * 2);
    ctx.stroke();

    // Stinger
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, player.size * 0.8);
    ctx.lineTo(0, player.size * 1.2);
    ctx.stroke();

    ctx.restore();
}

function spawnEnemy() {
    if (enemies.length >= maxEnemies) return;

    // Spawn at edges
    let x, y;
    const side = Math.random();
    if (side < 0.25) {
        x = Math.random() * gameWidth;
        y = -30;
    } else if (side < 0.5) {
        x = Math.random() * gameWidth;
        y = gameHeight + 30;
    } else if (side < 0.75) {
        x = -30;
        y = Math.random() * gameHeight;
    } else {
        x = gameWidth + 30;
        y = Math.random() * gameHeight;
    }

    enemies.push(new Bumblebee(x, y));
}

function updateEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].update();

        // Check if enemy was stung
        if (enemies[i].health <= 0) {
            enemies.splice(i, 1);
            killCount++;
            if (killCount >= 10) {
                gameState = 'won';
                showGameOver();
            }
            i--;
        }
    }

    // Spawn enemies
    enemySpawnTimer++;
    if (enemySpawnTimer > 60 && enemies.length < maxEnemies) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }
}

function drawEnemies() {
    for (let enemy of enemies) {
        enemy.draw();
    }
}

function checkStinging() {
    for (let enemy of enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.stingRange + enemy.size) {
            // Check if enemy is in front of player (based on angle)
            const enemyAngle = Math.atan2(dy, dx);
            const angleDiff = Math.abs(enemyAngle - player.angle);

            if (angleDiff < Math.PI / 3 || angleDiff > Math.PI * 1.67) {
                enemy.health = 0;
            }
        }
    }
}

function showGameOver() {
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('gameOverText').textContent = gameState === 'won' ? 'You Won!' : 'Game Over!';
    document.getElementById('finalScore').textContent = killCount;
}

function updateUI() {
    document.getElementById('killCount').textContent = killCount;
    document.getElementById('health').textContent = playerHealth;
    document.getElementById('enemyCount').textContent = enemies.length;
}

function gameLoop() {
    // Clear canvas
    ctx.fillStyle = 'rgba(135, 206, 235, 0.1)';
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    if (gameState === 'playing') {
        updatePlayer();
        updateEnemies();
        checkStinging();
        updateUI();
    }

    // Draw game
    drawEnemies();
    drawPlayer();

    // Draw health indicator
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Health: ${playerHealth}/3`, 10, 25);

    requestAnimationFrame(gameLoop);
}

gameLoop();const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let gameState = 'playing'; // 'playing', 'won', 'lost'
let killCount = 0;
let playerHealth = 3;
let gameWidth = canvas.width = 1000;
let gameHeight = canvas.height = 600;

// Player (Wasp)
const player = {
    x: gameWidth / 2,
    y: gameHeight / 2,
    vx: 0,
    vy: 0,
    speed: 4,
    size: 12,
    angle: 0,
    stingCooldown: 0,
    stingRange: 30,
    health: 3
};

// Enemies (Bumblebees)
let enemies = [];
let enemySpawnTimer = 0;
const maxEnemies = 8;

// Touch/Mobile variables
let touchStartX = 0;
let touchStartY = 0;
let touchX = 0;
let touchY = 0;
let isTouching = false;
let joystickRadius = 80;
let joystickX = 100;
let joystickY = gameHeight - 100;

// Input handling (Keyboard)
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Mouse tracking for angle (Desktop)
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
});

// Touch Controls
canvas.addEventListener('touchstart', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    touchStartX = touch.clientX - rect.left;
    touchStartY = touch.clientY - rect.top;
    touchX = touchStartX;
    touchY = touchStartY;
    isTouching = true;
    e.preventDefault();
});

canvas.addEventListener('touchmove', (e) => {
    if (!isTouching) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    touchX = touch.clientX - rect.left;
    touchY = touch.clientY - rect.top;
    
    // Update player angle based on touch position (aiming)
    player.angle = Math.atan2(touchY - player.y, touchX - player.x);
    e.preventDefault();
});

canvas.addEventListener('touchend', (e) => {
    isTouching = false;
    e.preventDefault();
});

// ... rest of the code remains the same until drawVirtualJoystick function ...

function drawVirtualJoystick() {
    // Only draw on mobile/touch devices
    if (!('ontouchstart' in window)) return;

    ctx.save();

    // Outer circle (joystick background)
    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.beginPath();
    ctx.arc(joystickX, joystickY, joystickRadius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(joystickX, joystickY, joystickRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle (joystick control)
    if (isTouching && touchStartX < gameWidth / 3) {
        const dx = touchX - joystickX;
        const dy = touchY - joystickY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const moveDistance = Math.min(distance, joystickRadius);

        if (distance > 0) {
            const controlX = joystickX + (dx / distance) * moveDistance;
            const controlY = joystickY + (dy / distance) * moveDistance;

            ctx.fillStyle = 'rgba(100, 150, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(controlX, controlY, joystickRadius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(joystickX, joystickY, joystickRadius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(joystickX, joystickY, joystickRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function gameLoop() {
    // Clear canvas
    ctx.fillStyle = 'rgba(135, 206, 235, 0.1)';
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    if (gameState === 'playing') {
        updatePlayer();
        updateEnemies();
        checkStinging();
        updateUI();
    }

    // Draw game
    drawEnemies();
    drawPlayer();
    drawVirtualJoystick();

    // Draw health indicator
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Health: ${playerHealth}/3`, 10, 25);

    requestAnimationFrame(gameLoop);
}

gameLoop();
