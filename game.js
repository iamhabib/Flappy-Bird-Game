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
let playerAttempts, playerScores;
let topScores = [];
const attemptLimit = 3;

let birdImg = new Image();
birdImg.src = 'actor.png';

function resetGame() {
    bird = { x: 50, y: 300, w: 30, h: 30, velocity: 0 };
    pipes = [];
    score = 0;
    gravity = 0.5;
    jump = -10; // Easier: stronger jump
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
    // Pipes
    if (pipes.length === 0 || pipes[pipes.length-1].x < canvas.width - 200) {
        let gap = 170; // Easier: increased gap
        let top = Math.random() * (canvas.height - gap - 100) + 50;
        pipes.push({ x: canvas.width, top: top, bottom: top + gap, w: 50 });
    }
    for (let pipe of pipes) {
        pipe.x -= 2; // Easier: slower pipe speed
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

function drawStonePillar(x, y, w, h) {
    // Colorful stone effect using gradient and colored circles
    let grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#ffb347'); // orange
    grad.addColorStop(0.5, '#87ceeb'); // blue
    grad.addColorStop(1, '#90ee90'); // green
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    // Add some "stones" as colored circles
    const colors = ['#fff', '#ff69b4', '#ffd700', '#00bfff', '#32cd32', '#ffa500'];
    for (let i = 0; i < 6; i++) {
        let stoneX = x + Math.random() * (w - 12);
        let stoneY = y + Math.random() * (h - 12);
        ctx.beginPath();
        ctx.arc(stoneX, stoneY, 6 + Math.random() * 4, 0, 2 * Math.PI);
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.stroke();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Bird
    if (birdImg && birdImg.complete) {
        ctx.drawImage(birdImg, bird.x, bird.y, bird.w, bird.h);
    } else if (birdImg) {
        birdImg.onload = function() {
            ctx.drawImage(birdImg, bird.x, bird.y, bird.w, bird.h);
        };
    }
    // Pillars (obstacles)
    for (let pipe of pipes) {
        drawStonePillar(pipe.x, 0, pipe.w, pipe.top);
        drawStonePillar(pipe.x, pipe.bottom, pipe.w, canvas.height - pipe.bottom);
    }
    // Score
    ctx.fillStyle = '#000'; // Black score text
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
