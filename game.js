// Flappy Bird Game Logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const nextPlayerBtn = document.getElementById('nextPlayerBtn');
const topScoresList = document.getElementById('topScores');
const attemptsLeftSpan = document.getElementById('attemptsLeft');
const startDialog = document.getElementById('startDialog');
const countdownText = document.getElementById('countdownText');

let bird, pipes, score, gameActive, gravity, jump;
let playerAttempts = 0;
let playerScores = [];
let topScores = [];
const attemptLimit = 3;

let birdImg = new Image();
birdImg.src = 'actor.png';
let bmanImg = new Image();
bmanImg.src = 'biman.png';
bmanImg.onerror = function() {
    console.error('bman.png not found or failed to load. Please check the filename and location.');
};

// If plance.gif is a GIF, browsers won't animate it in canvas. We'll use a sprite sheet approach for animation.
// If you only have a GIF, convert it to a horizontal sprite sheet (e.g. using ezgif.com/split or similar).
// We'll default to 4 frames, but you can change PLANE_FRAMES below to match your sprite sheet.
const PLANE_FRAMES = 4; // Number of frames in your sprite sheet
const PLANE_FPS = 10; // Animation speed
let planeFrame = 0;
let planeFrameTick = 0;

function resetGame() {
    bird = { x: 50, y: 300, w: 30, h: 30, velocity: 0 };
    pipes = [];
    score = 0;
    gravity = 0.5;
    jump = -9;
    gameActive = false;
    startBtn.style.display = 'inline-block';
    nextPlayerBtn.style.display = 'none';
    draw();
}

function startGame() {
    if (playerAttempts >= attemptLimit) return;
    startBtn.style.display = 'none';
    nextPlayerBtn.style.display = 'none';
    showCountdown(3);
}

function showCountdown(n) {
    startDialog.style.display = 'block';
    countdownText.textContent = n;
    let count = n;
    let interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.textContent = count;
        } else {
            clearInterval(interval);
            startDialog.style.display = 'none';
            beginGame();
        }
    }, 700);
}

function beginGame() {
    gameActive = true;
    bird.y = 300;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    attemptsLeftSpan.textContent = `Attempts left: ${attemptLimit - playerAttempts}`;
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameActive) return;
    // Animate plane sprite
    planeFrameTick++;
    if (planeFrameTick >= 60 / PLANE_FPS) {
        planeFrame = (planeFrame + 1) % PLANE_FRAMES;
        planeFrameTick = 0;
    }
    update();
    draw();
    if (gameActive) requestAnimationFrame(gameLoop);
}

function update() {
    bird.velocity += gravity;
    bird.y += bird.velocity;
    if (bird.y < 0) bird.y = 0;
    if (bird.y + bird.h > canvas.height) {
        endGame();
        return;
    }
    // Pipes (side-scroller, move left)
    if (pipes.length === 0 || pipes[pipes.length-1].x < canvas.width - 200) {
        let gap = Math.floor(Math.random() * (230 - 150 + 1)) + 150;
        let top = Math.random() * (canvas.height - gap - 100) + 50;
        pipes.push({ x: canvas.width, top: top, bottom: top + gap, w: 50 });
    }
    for (let pipe of pipes) {
        pipe.x -= 3; // Move pipes left
    }
    // Remove off-screen pipes
    pipes = pipes.filter(pipe => pipe.x + pipe.w > 0);
    // Collision
    for (let pipe of pipes) {
        if (
            bird.x < pipe.x + pipe.w &&
            bird.x + bird.w > pipe.x &&
            (bird.y < pipe.top || bird.y + bird.h > pipe.bottom)
        ) {
            endGame();
            return;
        }
        // Score
        if (!pipe.passed && pipe.x + pipe.w < bird.x) {
            score++;
            pipe.passed = true;
        }
    }
}

function drawBmanPillar(x, y, w, h) {
    if (!bmanImg.complete || bmanImg.width === 0) {
        return;
    }
    let tileH = bmanImg.height * (w / bmanImg.width); // maintain aspect ratio
    for (let offsetY = y; offsetY < y + h; offsetY += tileH) {
        let drawH = Math.min(tileH, y + h - offsetY);
        ctx.drawImage(bmanImg, x, offsetY, w, drawH);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Bird - draw at natural size if possible, or integer scale
    if (birdImg && birdImg.complete && birdImg.width && birdImg.height) {
        ctx.imageSmoothingEnabled = true;
        let scale = Math.max(1, Math.floor(bird.w / birdImg.width));
        let drawW = birdImg.width * scale;
        let drawH = birdImg.height * scale;
        // If bird.w/h is smaller than image, just use image size
        if (drawW > bird.w || drawH > bird.h) {
            drawW = bird.w;
            drawH = bird.h;
        }
        let offsetX = bird.x + (bird.w - drawW) / 2;
        let offsetY = bird.y + (bird.h - drawH) / 2;
        ctx.drawImage(birdImg, offsetX, offsetY, drawW, drawH);
    } else if (birdImg) {
        birdImg.onload = function() {
            ctx.drawImage(birdImg, bird.x, bird.y, bird.w, bird.h);
        };
    }
    // Pillars (obstacles)
    for (let pipe of pipes) {
        drawBmanPillar(pipe.x, 0, pipe.w, pipe.top); // top pillar
        drawBmanPillar(pipe.x, pipe.bottom, pipe.w, canvas.height - pipe.bottom); // bottom pillar
    }
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '32px Arial';
    ctx.fillText(score, canvas.width/2 - 10, 50);
}

function endGame() {
    gameActive = false;
    playerScores.push(score);
    playerAttempts++;
    attemptsLeftSpan.textContent = `Attempts left: ${attemptLimit - playerAttempts}`;
    if (playerAttempts < attemptLimit) {
        startBtn.style.display = 'inline-block';
        nextPlayerBtn.style.display = 'none';
    } else {
        let totalScore = playerScores.reduce((a, b) => a + b, 0);
        let isTopScore = checkTopScore(totalScore);
        if (isTopScore) {
            askPlayerName(totalScore);
        } else {
            updateTopScores(totalScore, null);
            startBtn.style.display = 'none';
            nextPlayerBtn.style.display = 'inline-block';
        }
    }
}

function checkTopScore(newScore) {
    if (topScores.length < 3) return true;
    return topScores.some(s => newScore > s.score);
}

function askPlayerName(newScore) {
    setTimeout(function() {
        let name = prompt('Congratulations! You made the Top 3! Enter your name:');
        if (name === null || name.trim() === '') name = 'Anonymous';
        updateTopScores(newScore, name);
        startBtn.style.display = 'none';
        nextPlayerBtn.style.display = 'inline-block';
    }, 100);
}

function updateTopScores(newScore, name) {
    if (name !== null && name !== undefined) {
        topScores.push({ score: newScore, name });
    } else {
        topScores.push({ score: newScore, name: '' });
    }
    topScores.sort((a, b) => b.score - a.score);
    topScores = topScores.slice(0, 3);
    renderTopScores();
}

function renderTopScores() {
    topScoresList.innerHTML = '';
    topScores.forEach((entry, idx) => {
        let li = document.createElement('li');
        li.textContent = `#${idx+1}: ${entry.score} ${entry.name ? '- ' + entry.name : ''}`;
        topScoresList.appendChild(li);
    });
}

function resetPlayer() {
    playerAttempts = 0;
    playerScores = [];
    attemptsLeftSpan.textContent = `Attempts left: ${attemptLimit}`;
    resetGame();
}

// Event listeners
canvas.addEventListener('mousedown', () => {
    if (gameActive) bird.velocity = jump;
});
canvas.addEventListener('touchstart', () => {
    if (gameActive) bird.velocity = jump;
});
startBtn.addEventListener('click', startGame);
nextPlayerBtn.addEventListener('click', resetPlayer);

// Initialize
function init() {
    topScores = [];
    playerAttempts = 0;
    playerScores = [];
    resetGame();
    renderTopScores();
}
init();
