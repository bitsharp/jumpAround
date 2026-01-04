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
let jumpDistance = 130;
let jumpBoost = 0;
let boostDuration = 0;
let playerName = '';

// API endpoint - usa relative path /api/scores
const API_SCORES = '/api/scores';

// Elementi DOM
const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const gameOverPlayerNameElement = document.getElementById('gameOverPlayerName');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const viewRecordsBtn = document.getElementById('viewRecordsBtn');
const closeRecordsBtn = document.getElementById('closeRecordsBtn');
const gameOverDiv = document.getElementById('gameOver');
const playerNameScreen = document.getElementById('playerNameScreen');
const playerNameInput = document.getElementById('playerNameInput');
const startNameBtn = document.getElementById('startNameBtn');
const topScoresContainer = document.getElementById('topScoresContainer');
const topScoresBody = document.getElementById('topScoresBody');

// Modalità offline (localStorage) se il server non è disponibile
let useOnlineDB = true;

// Inizializza high score
highScoreElement.textContent = highScore;

// Carica il massimo punteggio globale all'avvio
loadGlobalHighScore();

// Eventi
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', resetGame);
viewRecordsBtn.addEventListener('click', showGlobalRecords);
closeRecordsBtn.addEventListener('click', closeRecords);
startNameBtn.addEventListener('click', startGameWithName);

// Supporto per pressione Enter nel campo del nome
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startGameWithName();
    }
});

// Controlli tastiera e mouse
document.addEventListener('keydown', handleKeyPress);
gameArea.addEventListener('click', () => {
    if (gameRunning) jump();
});

// Supporto touch per mobile
gameArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) jump();
}, { passive: false });

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

function loadGlobalHighScore() {
    fetch(API_SCORES)
        .then(response => response.json())
        .then(scores => {
            if (scores.length > 0) {
                const globalHighScore = scores[0].score;
                const globalHighScorePlayer = scores[0].playerName;
                highScoreElement.textContent = globalHighScore;
                const playerElement = document.getElementById('highScorePlayer');
                if (playerElement) {
                    playerElement.textContent = `(${globalHighScorePlayer})`;
                }
            }
        })
        .catch(error => {
            console.log('Modalità offline - usando record locale');
        });
}

function changeCharacter(num) {
    currentCharacter = num;
    player.className = 'player char' + num;
}

function startGameWithName() {
    const name = playerNameInput.value.trim();
    if (!name) {
        alert('Per favore inserisci il tuo nome!');
        return;
    }
    
    playerName = name;
    playerNameScreen.classList.add('hidden');
    startGame();
}

function startGame() {
    if (gameRunning) return;
    
    gameRunning = true;
    score = 0;
    jumpBoost = 0;
    playerX = 50;
    scoreElement.textContent = score;
    startBtn.classList.add('hidden');
    restartBtn.classList.add('hidden');
    gameOverDiv.classList.add('hidden');
    
    // Calcola la distanza di salto in base alla larghezza dello schermo
    const gameAreaWidth = gameArea.offsetWidth;
    jumpDistance = Math.max(100, Math.min(130, gameAreaWidth * 0.25));
    
    // Reset della posizione del giocatore
    player.style.left = playerX + 'px';
    
    // Rimuovi ostacoli e aculei esistenti
    document.querySelectorAll('.obstacle').forEach(obs => obs.remove());
    document.querySelectorAll('.platform').forEach(plat => plat.remove());
    document.querySelectorAll('.boost-platform').forEach(boost => boost.remove());
    
    // Genera stelle di sfondo
    createStars();
    
    // Inizia a generare ostacoli con difficoltà progressiva
    obstacleInterval = setInterval(() => {
        const random = Math.random();
        const spawnBoost = Math.random();
        
        // Aumenta probabilità di spawn con il punteggio
        const boostChance = Math.min(0.15, score / 500);
        
        if (spawnBoost < boostChance) {
            createBoostPlatform();
        } else if (random > 0.5) {
            createObstacle();
        } else {
            createSpike();
        }
    }, 2000);
    
    // Incrementa punteggio
    scoreInterval = setInterval(() => {
        if (gameRunning) {
            score++;
            scoreElement.textContent = score;
            
            // Diminuisci durata del boost ogni 50 punti
            if (score % 50 === 0 && jumpBoost > 0) {
                boostDuration = Math.max(1, boostDuration - 0.5);
            }
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
        isJumping = false;
    }, 600);
}

function createObstacle() {
    if (!gameRunning) return;
    
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    
    // Varia altezza degli ostacoli
    const heights = [40, 60, 80];
    const randomHeight = heights[Math.floor(Math.random() * heights.length)];
    obstacle.style.height = randomHeight + 'px';
    
    // Velocità dinamica basata sul punteggio
    const baseSpeed = 1.3;
    const speedIncrease = Math.floor(score / 100) * 0.2;
    const speed = Math.max(1.0, baseSpeed - speedIncrease);
    obstacle.style.animationDuration = speed + 's';
    
    gameArea.appendChild(obstacle);
    
    // Rimuovi ostacolo dopo l'animazione
    setTimeout(() => {
        if (obstacle.parentElement) {
            obstacle.remove();
        }
    }, speed * 1000);
}

function createSpike() {
    if (!gameRunning) return;
    
    const spike = document.createElement('div');
    spike.classList.add('platform');
    
    // Velocità dinamica basata dal punteggio
    const baseSpeed = 1.3;
    const speedIncrease = Math.floor(score / 100) * 0.2;
    const speed = Math.max(1.0, baseSpeed - speedIncrease);
    spike.style.animationDuration = speed + 's';
    
    gameArea.appendChild(spike);
    
    // Rimuovi aculeo dopo l'animazione
    setTimeout(() => {
        if (spike.parentElement) {
            spike.remove();
        }
    }, speed * 1000);
}

function createBoostPlatform() {
    if (!gameRunning) return;
    
    const boostPlatform = document.createElement('div');
    boostPlatform.classList.add('boost-platform');
    
    // Velocità dinamica basata sul punteggio
    const baseSpeed = 1.3;
    const speedIncrease = Math.floor(score / 100) * 0.2;
    const speed = Math.max(1.0, baseSpeed - speedIncrease);
    boostPlatform.style.animationDuration = speed + 's';
    
    gameArea.appendChild(boostPlatform);
    
    // Rimuovi piattaforma dopo l'animazione
    setTimeout(() => {
        if (boostPlatform.parentElement) {
            boostPlatform.remove();
        }
    }, speed * 1000);
}

function checkCollisions() {
    const obstacles = document.querySelectorAll('.obstacle');
    const spikes = document.querySelectorAll('.platform');
    const boostPlatforms = document.querySelectorAll('.boost-platform');
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
    
    // Controlla collisione con aculei
    spikes.forEach(spike => {
        const spikeRect = spike.getBoundingClientRect();
        
        if (
            playerRect.left < spikeRect.right &&
            playerRect.right > spikeRect.left &&
            playerRect.bottom > spikeRect.top &&
            playerRect.top < spikeRect.bottom
        ) {
            endGame();
        }
    });
    
    // Controlla collisione con piattaforme di boost
    boostPlatforms.forEach(boostPlatform => {
        const boostRect = boostPlatform.getBoundingClientRect();
        
        if (
            playerRect.left < boostRect.right &&
            playerRect.right > boostRect.left &&
            playerRect.bottom > boostRect.top &&
            playerRect.top < boostRect.bottom
        ) {
            activateBoost(boostPlatform);
        }
    });
    
    // Decrementare durata del boost
    if (boostDuration > 0) {
        boostDuration -= 0.01;
        if (boostDuration <= 0) {
            jumpBoost = 0;
            player.classList.remove('boosted');
        }
    }
}

function activateBoost(boostPlatform) {
    jumpBoost = 150;
    boostDuration = 5;
    player.classList.add('boosted');
    boostPlatform.remove();
}

function endGame() {
    gameRunning = false;
    
    // Ferma tutti gli intervalli
    clearInterval(obstacleInterval);
    clearInterval(scoreInterval);
    clearInterval(gameLoop);
    
    // Rimuovi tutti gli ostacoli, aculei e piattaforme di boost
    document.querySelectorAll('.obstacle').forEach(obs => obs.remove());
    document.querySelectorAll('.platform').forEach(plat => plat.remove());
    document.querySelectorAll('.boost-platform').forEach(boost => boost.remove());
    
    // Aggiorna high score locale
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    // Salva il punteggio nel database centralizzato
    saveScoreToDatabase();
    
    // Mostra schermata game over
    gameOverPlayerNameElement.textContent = playerName;
    finalScoreElement.textContent = score;
    gameOverDiv.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
}

function saveScoreToDatabase() {
    if (!playerName) return;
    
    fetch(API_SCORES, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            playerName: playerName,
            score: score
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.topScores) {
            displayTopScores(data.topScores);
        }
        // Aggiorna il record globale nella schermata principale
        loadGlobalHighScore();
    })
    .catch(error => {
        console.log('Errore nel salvataggio online, modalità offline attivata');
        useOnlineDB = false;
        loadLocalTopScores();
    });
}

function displayTopScores(scores) {
    topScoresBody.innerHTML = '';
    
    scores.forEach((score, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.playerName}</td>
            <td>${score.score}</td>
        `;
        topScoresBody.appendChild(row);
    });
    
    topScoresContainer.classList.remove('hidden');
}

function loadLocalTopScores() {
    // Carica i top 10 dal localStorage in caso il server non sia disponibile
    let scores = JSON.parse(localStorage.getItem('allScores') || '[]');
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10);
    displayTopScores(scores);
}

function resetGame() {
    // Reset del giocatore
    playerX = 50;
    player.style.left = '50px';
    jumpBoost = 0;
    boostDuration = 0;
    player.classList.remove('boosted');
    
    // Imposta il bottom corretto in base al dispositivo
    const isMobile = window.innerWidth <= 480;
    player.style.bottom = isMobile ? '72px' : '100px';
    
    player.classList.remove('jumping');
    player.classList.remove('falling');
    
    // Nascondi game over e mostra schermata del nome
    gameOverDiv.classList.add('hidden');
    topScoresContainer.classList.add('hidden');
    playerNameScreen.classList.remove('hidden');
    playerNameInput.value = '';
    playerNameInput.focus();
    
    // Rimuovi tutte le stelle
    document.querySelectorAll('.star').forEach(star => star.remove());
}

function showGlobalRecords() {
    fetch(API_SCORES)
        .then(response => response.json())
        .then(scores => {
            displayTopScores(scores);
        })
        .catch(error => {
            console.log('Caricamento record locali');
            loadLocalTopScores();
        });
}

function closeRecords() {
    topScoresContainer.classList.add('hidden');
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

function resetHighScore() {
    if (confirm('Sei sicuro di voler resettare il record?')) {
        highScore = 0;
        localStorage.setItem('highScore', 0);
        highScoreElement.textContent = 0;
        alert('Record resettato!');
    }
}

// Previeni lo scroll della pagina con spazio
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
    }
});
