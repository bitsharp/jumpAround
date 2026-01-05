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
let deviceType = window.innerWidth <= 480 ? 'mobile' : 'desktop';

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
const activePlayersDisplay = document.getElementById('activePlayersDisplay');
const gameActivePlayersCount = document.getElementById('gameActivePlayers');
const activePlayersList = document.getElementById('activePlayersList');
const activePlayersPanel = document.getElementById('activePlayersPanel');

// Offline mode (localStorage) if server is not available
let useOnlineDB = true;
let activePlayersInterval = null;

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
        .then(data => {
            const allScores = [...(data.mobileScores || []), ...(data.desktopScores || [])];
            if (allScores.length > 0) {
                const best = allScores.reduce((max, score) => score.score > max.score ? score : max);
                highScoreElement.textContent = best.score;
                const playerElement = document.getElementById('highScorePlayer');
                if (playerElement) {
                    playerElement.textContent = `(${best.playerName})`;
                }
            }
        })
        .catch(error => {
            console.log('Offline mode - using local records');
        });
    
    // Mostra active players a tutti gli utenti
    showActivePlayersDisplay();
}

function changeCharacter(num) {
    currentCharacter = num;
    player.className = 'player char' + num;
}

function startGameWithName() {
    const name = playerNameInput.value.trim();
    if (!name) {
        alert('Please enter your name!');
        return;
    }
    
    playerName = name;
    playerNameScreen.classList.add('hidden');
    
    // Registra giocatore attivo (non blocking)
    if (playerName) {
        registerActivePlayer('start');
    }
    
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
        const spawnTrap = Math.random();
        
        // Aumenta probabilità di spawn con il punteggio
        const boostChance = Math.min(0.15, score / 500);
        const trapChance = Math.min(0.1, score / 600);
        
        if (spawnBoost < boostChance) {
            createBoostPlatform();
        } else if (spawnTrap < trapChance) {
            createTrap();
        } else if (random > 0.7) {
            createObstacle();
        } else if (random > 0.4) {
            createSpike();
        } else if (random > 0.2) {
            createMovingObstacle();
        } else {
            createDoubleObstacle();
        }
    }, 2000);
    
    // Incrementa punteggio
    scoreInterval = setInterval(() => {
        if (gameRunning) {
            score++;
            scoreElement.textContent = score;
            
            // Cambia personaggio ogni 1000 punti
            const newCharacter = Math.floor(score / 1000) + 1;
            if (newCharacter <= 6 && newCharacter !== currentCharacter) {
                changeCharacter(newCharacter);
            }
            
            // Aumenta difficoltà: accelera il terreno dopo 500 punti
            if (score > 500) {
                ground.classList.add('speed-boost');
            } else {
                ground.classList.remove('speed-boost');
            }
            
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
    
    // Altezza degli ostacoli aumenta con il punteggio
    const baseHeights = [40, 60, 80];
    const heightIncrease = Math.floor(score / 200) * 10;
    const heights = baseHeights.map(h => h + heightIncrease);
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

function createMovingObstacle() {
    if (!gameRunning) return;
    
    const movingObstacle = document.createElement('div');
    movingObstacle.classList.add('moving-obstacle');
    
    // Altezza aumenta con il punteggio
    const baseHeights = [30, 50, 70];
    const heightIncrease = Math.floor(score / 200) * 8;
    const heights = baseHeights.map(h => h + heightIncrease);
    const randomHeight = heights[Math.floor(Math.random() * heights.length)];
    movingObstacle.style.height = randomHeight + 'px';
    
    // Velocità dinamica basata sul punteggio
    const baseSpeed = 1.3;
    const speedIncrease = Math.floor(score / 100) * 0.2;
    const speed = Math.max(1.0, baseSpeed - speedIncrease);
    movingObstacle.style.animationDuration = speed + 's';
    
    gameArea.appendChild(movingObstacle);
    
    // Rimuovi ostacolo dopo l'animazione
    setTimeout(() => {
        if (movingObstacle.parentElement) {
            movingObstacle.remove();
        }
    }, speed * 1000);
}

function createDoubleObstacle() {
    if (!gameRunning) return;
    
    const doubleObstacle = document.createElement('div');
    doubleObstacle.classList.add('double-obstacle');
    
    // Altezza aumenta con il punteggio
    const baseHeights = [35, 55, 75];
    const heightIncrease = Math.floor(score / 200) * 10;
    const heights = baseHeights.map(h => h + heightIncrease);
    const randomHeight = heights[Math.floor(Math.random() * heights.length)];
    doubleObstacle.style.height = randomHeight + 'px';
    
    // Velocità dinamica basata sul punteggio
    const baseSpeed = 1.3;
    const speedIncrease = Math.floor(score / 100) * 0.2;
    const speed = Math.max(1.0, baseSpeed - speedIncrease);
    doubleObstacle.style.animationDuration = speed + 's';
    
    gameArea.appendChild(doubleObstacle);
    
    // Rimuovi ostacolo dopo l'animazione
    setTimeout(() => {
        if (doubleObstacle.parentElement) {
            doubleObstacle.remove();
        }
    }, speed * 1000);
}

function createTrap() {
    if (!gameRunning) return;
    
    const trap = document.createElement('div');
    trap.classList.add('trap');
    
    // Altezza della trappola
    const trapHeight = 50 + Math.floor(score / 200) * 8;
    trap.style.height = trapHeight + 'px';
    
    // Velocità dinamica basata sul punteggio
    const baseSpeed = 1.3;
    const speedIncrease = Math.floor(score / 100) * 0.2;
    const speed = Math.max(1.0, baseSpeed - speedIncrease);
    trap.style.animationDuration = speed + 's';
    
    gameArea.appendChild(trap);
    
    // Rimuovi trappola dopo l'animazione
    setTimeout(() => {
        if (trap.parentElement) {
            trap.remove();
        }
    }, speed * 1000);
}

function checkCollisions() {
    const obstacles = document.querySelectorAll('.obstacle');
    const spikes = document.querySelectorAll('.platform');
    const boostPlatforms = document.querySelectorAll('.boost-platform');
    const movingObstacles = document.querySelectorAll('.moving-obstacle');
    const doubleObstacles = document.querySelectorAll('.double-obstacle');
    const traps = document.querySelectorAll('.trap');
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
    
    // Controlla collisione con ostacoli mobili
    movingObstacles.forEach(obstacle => {
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
    
    // Controlla collisione con doppi ostacoli
    doubleObstacles.forEach(obstacle => {
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
    
    // Controlla collisione con trappole
    traps.forEach(trap => {
        const trapRect = trap.getBoundingClientRect();
        
        if (
            playerRect.left < trapRect.right &&
            playerRect.right > trapRect.left &&
            playerRect.bottom > trapRect.top &&
            playerRect.top < trapRect.bottom
        ) {
            endGame();
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
    
    // Deregistra giocatore attivo
    registerActivePlayer('end');
    
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
            score: score,
            deviceType: deviceType
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
        console.log('Error saving online, offline mode activated');
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
        .then(data => {
            displayGlobalLeaderboards(data);
        })
        .catch(error => {
            console.log('Loading local records');
            loadLocalTopScores();
        });
}

function displayGlobalLeaderboards(data) {
    const mobileScores = data.mobileScores || [];
    const desktopScores = data.desktopScores || [];
    
    topScoresContainer.classList.remove('hidden');
    topScoresContainer.innerHTML = '';
    
    const container = document.createElement('div');
    container.style.cssText = 'max-height: 400px; overflow-y: auto;';
    
    // Leaderboard Mobile
    const mobileSection = document.createElement('div');
    mobileSection.innerHTML = '<h4 style="color: #FF9800; margin: 15px 0 10px 0; font-size: 14px;">📱 MOBILE</h4>';
    const mobileTable = createLeaderboardTable(mobileScores);
    mobileSection.appendChild(mobileTable);
    container.appendChild(mobileSection);
    
    // Leaderboard Desktop
    const desktopSection = document.createElement('div');
    desktopSection.innerHTML = '<h4 style="color: #2196F3; margin: 15px 0 10px 0; font-size: 14px;">💻 DESKTOP/TABLET</h4>';
    const desktopTable = createLeaderboardTable(desktopScores);
    desktopSection.appendChild(desktopTable);
    container.appendChild(desktopSection);
    
    const button = document.createElement('button');
    button.id = 'closeRecordsBtn';
    button.className = 'close-records-btn';
    button.textContent = '✕';
    button.onclick = closeRecords;
    
    topScoresContainer.appendChild(button);
    topScoresContainer.appendChild(container);
}

function createLeaderboardTable(scores) {
    if (scores.length === 0) {
        const empty = document.createElement('p');
        empty.style.cssText = 'color: #bdc3c7; text-align: center; padding: 10px; font-size: 12px;';
        empty.textContent = 'No records';
        return empty;
    }
    
    const table = document.createElement('table');
    table.className = 'top-scores-table';
    table.innerHTML = '<thead><tr><th style="width: 30px;">Pos</th><th>Player</th><th>Score</th></tr></thead>';
    const tbody = document.createElement('tbody');
    
    scores.forEach((score, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.playerName}</td>
            <td>${score.score}</td>
        `;
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    return table;
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
        alert('Record reset!');
    }
}

// Funzione per registrare giocatore attivo (non-blocking)
function registerActivePlayer(action) {
    if (!playerName) return;
    
    // Usa setTimeout per evitare di bloccare il game loop
    setTimeout(() => {
        fetch('/api/active-players', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerName: playerName,
                deviceType: deviceType,
                action: action  // 'start', 'end', o 'update'
            })
        })
        .catch(error => console.log('Active player registration error:', error));
    }, 0);
}

// Mostra il widget dei giocatori attivi a tutti gli utenti
function showActivePlayersDisplay() {
    activePlayersDisplay.style.display = 'block';
    updateActivePlayersCount();
    
    // Aggiorna il conteggio ogni 2 secondi
    if (!activePlayersInterval) {
        activePlayersInterval = setInterval(() => {
            updateActivePlayersCount();
        }, 2000);
    }
}

// Nasconde il widget dei giocatori attivi
function hideActivePlayersDisplay() {
    activePlayersDisplay.style.display = 'none';
    if (activePlayersInterval) {
        clearInterval(activePlayersInterval);
        activePlayersInterval = null;
    }
}

// Aggiorna il conteggio dei giocatori attivi
function updateActivePlayersCount() {
    fetch('/api/active-players')
        .then(response => response.json())
        .then(data => {
            gameActivePlayersCount.textContent = data.count || 0;
            displayDesktopPlayers(data.players || []);
        })
        .catch(error => console.log('Error loading active players:', error));
}

// Mostra i nomi dei giocatori desktop nel pannello sulla destra
function displayDesktopPlayers(players) {
    activePlayersList.innerHTML = '';
    
    const desktopPlayers = players.filter(p => p.deviceType === 'desktop');
    
    if (desktopPlayers.length === 0) {
        activePlayersList.innerHTML = '<div style="color: #888; text-align: center; padding: 20px 0; font-size: 0.9em;">No players online</div>';
        return;
    }
    
    desktopPlayers.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'active-player-item';
        playerItem.textContent = player.playerName;
        activePlayersList.appendChild(playerItem);
    });
}

// Previeni lo scroll della pagina con spazio
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
    }
});
