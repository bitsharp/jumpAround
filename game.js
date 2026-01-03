// Variabili globali
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let isJumping = false;
let currentCharacter = 1;
let gameLoop;
let obstacleInterval;
let scoreInterval;
let playerX = 50;

// Elementi DOM
const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverDiv = document.getElementById('gameOver');

// Inizializza high score
highScoreElement.textContent = highScore;

// Eventi
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', resetGame);

// Controlli tastiera e mouse
document.addEventListener('keydown', handleKeyPress);
gameArea.addEventListener('click', () => {
    if (gameRunning) jump();
});

function handleKeyPress(e) {
    if (e.code === 'Space' && gameRunning) {
        e.preventDefault();
        jump();
    }
    
    // Cambio personaggio con tasti 1-6
    if (e.key >= '1' && e.key <= '6') {
        changeCharacter(parseInt(e.key));
    }
}

function changeCharacter(num) {
    currentCharacter = num;
    player.className = 'player char' + num;
}

function startGame() {
    if (gameRunning) return;
    
    gameRunning = true;
    score = 0;
    scoreElement.textContent = score;
    startBtn.classList.add('hidden');
    restartBtn.classList.add('hidden');
    gameOverDiv.classList.add('hidden');
    
    // Rimuovi ostacoli e piattaforme esistenti
    document.querySelectorAll('.obstacle').forEach(obs => obs.remove());
    document.querySelectorAll('.platform').forEach(plat => plat.remove());
    
    // Genera stelle di sfondo
    createStars();
    
    // Inizia a generare ostacoli e piattaforme
    obstacleInterval = setInterval(() => {
        if (Math.random() > 0.4) {
            createObstacle();
        } else {
            createPlatform();
        }
    }, 2000);
    
    // Incrementa punteggio
    scoreInterval = setInterval(() => {
        if (gameRunning) {
            score++;
            scoreElement.textContent = score;
        }
    }, 100);
    
    // Loop del gioco
    gameLoop = setInterval(checkCollisions, 10);
}

function jump() {
    if (isJumping || !gameRunning) return;
    
    isJumping = true;
    player.classList.add('jumping');
    
    setTimeout(() => {
        player.classList.remove('jumping');
        playerX = 180;
        player.style.left = playerX + 'px';
        isJumping = false;
    }, 550);
}

function createObstacle() {
    if (!gameRunning) return;
    
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    
    // Varia altezza degli ostacoli
    const heights = [40, 60, 80];
    const randomHeight = heights[Math.floor(Math.random() * heights.length)];
    obstacle.style.height = randomHeight + 'px';
    
    // Varia velocità basata sul punteggio
    const baseSpeed = 3;
    const speedIncrease = Math.floor(score / 100) * 0.5;
    const speed = Math.max(1.5, baseSpeed - speedIncrease);
    obstacle.style.animationDuration = speed + 's';
    
    gameArea.appendChild(obstacle);
    
    // Rimuovi ostacolo dopo l'animazione
    setTimeout(() => {
        if (obstacle.parentElement) {
            obstacle.remove();
        }
    }, speed * 1000);
}

function createPlatform() {
    if (!gameRunning) return;
    
    const platform = document.createElement('div');
    platform.classList.add('platform');
    
    // Varia velocità basata dal punteggio
    const baseSpeed = 3;
    const speedIncrease = Math.floor(score / 100) * 0.5;
    const speed = Math.max(1.5, baseSpeed - speedIncrease);
    platform.style.animationDuration = speed + 's';
    
    gameArea.appendChild(platform);
    
    // Rimuovi piattaforma dopo l'animazione
    setTimeout(() => {
        if (platform.parentElement) {
            platform.remove();
        }
    }, speed * 1000);
}

function checkCollisions() {
    const obstacles = document.querySelectorAll('.obstacle');
    const platforms = document.querySelectorAll('.platform');
    const playerRect = player.getBoundingClientRect();
    
    // Controlla collisione con ostacoli
    obstacles.forEach(obstacle => {
        const obstacleRect = obstacle.getBoundingClientRect();
        
        if (
            playerRect.left < obstacleRect.right &&
            playerRect.right > obstacleRect.left &&
            playerRect.bottom > obstacleRect.top &&
            playerRect.top < obstacleRect.bottom
        ) {
            endGame();
        }
    });
    
    // Controlla contatto con piattaforme (bonus)
    platforms.forEach(platform => {
        const platformRect = platform.getBoundingClientRect();
        
        if (
            playerRect.left < platformRect.right &&
            playerRect.right > platformRect.left &&
            playerRect.bottom >= platformRect.top &&
            playerRect.bottom <= platformRect.top + 20 &&
            isJumping
        ) {
            // Bonus punteggi
            score += 10;
            scoreElement.textContent = score;
        }
    });
}

function endGame() {
    gameRunning = false;
    
    // Ferma tutti gli intervalli
    clearInterval(obstacleInterval);
    clearInterval(scoreInterval);
    clearInterval(gameLoop);
    
    // Rimuovi tutti gli ostacoli e piattaforme
    document.querySelectorAll('.obstacle').forEach(obs => obs.remove());
    document.querySelectorAll('.platform').forEach(plat => plat.remove());
    
    // Aggiorna high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    // Mostra schermata game over
    finalScoreElement.textContent = score;
    gameOverDiv.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
}

function resetGame() {
    // Reset del giocatore
    playerX = 50;
    player.style.left = '50px';
    player.style.bottom = '100px';
    player.classList.remove('jumping');
    player.classList.remove('falling');
    
    // Nascondi game over
    gameOverDiv.classList.add('hidden');
    
    // Rimuovi tutte le stelle
    document.querySelectorAll('.star').forEach(star => star.remove());
    
    // Riavvia il gioco
    startGame();
}

function createStars() {
    // Crea stelle decorative nello sfondo
    for (let i = 0; i < 30; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.width = Math.random() * 3 + 1 + 'px';
        star.style.height = star.style.width;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 70 + '%';
        star.style.animationDelay = Math.random() * 2 + 's';
        gameArea.appendChild(star);
    }
}

// Previeni lo scroll della pagina con spazio
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
    }
});
