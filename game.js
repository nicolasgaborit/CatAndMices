const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const tileSize = 20;
const rows = Math.floor((window.innerHeight - 200) / tileSize); // Ajuster la hauteur du canvas
const cols = Math.floor(window.innerWidth / tileSize);
canvas.width = cols * tileSize;
canvas.height = rows * tileSize;

const directions = [
    { dx: -1, dy: 0 }, // gauche
    { dx: 1, dy: 0 },  // droite
    { dx: 0, dy: -1 }, // haut
    { dx: 0, dy: 1 }   // bas
];

let score = 0;
let timeRemaining = 120; // 2 minutes en secondes
let gameInterval;
let countdownInterval;
let nextDirection = null;

// Images
const catImg = new Image();
catImg.src = 'cat.png';
const mouseImg = new Image();
mouseImg.src = 'mouse.png';

const cat = {
    x: tileSize * 1,
    y: tileSize * 1,
    speed: tileSize / 5,
    dx: 0,
    dy: 0
};

let maze = generateMaze(rows, cols);
let mice = initializeMice();

function initializeMice() {
    const mice = [];
    for (let i = 0; i < 2; i++) {
        let mouse;
        do {
            mouse = {
                x: Math.floor(Math.random() * cols) * tileSize,
                y: Math.floor(Math.random() * rows) * tileSize,
                dx: 0,
                dy: 0,
                steps: 0,
                direction: null
            };
        } while (maze[Math.floor(mouse.y / tileSize)][Math.floor(mouse.x / tileSize)] === 1);
        mice.push(mouse);
    }
    return mice;
}

function addMouse() {
    let mouse;
    do {
        mouse = {
            x: Math.floor(Math.random() * cols) * tileSize,
            y: Math.floor(Math.random() * rows) * tileSize,
            dx: 0,
            dy: 0,
            steps: 0,
            direction: null
        };
    } while (maze[Math.floor(mouse.y / tileSize)][Math.floor(mouse.x / tileSize)] === 1);
    mice.push(mouse);
}

function drawCat() {
    ctx.drawImage(catImg, cat.x, cat.y, tileSize, tileSize);
}

function drawMice() {
    mice.forEach(mouse => {
        ctx.drawImage(mouseImg, mouse.x, mouse.y, tileSize, tileSize);
    });
}

function moveCat() {
    const newX = cat.x + cat.dx;
    const newY = cat.y + cat.dy;
    if (canMove(newX, newY, tileSize)) {
        cat.x = newX;
        cat.y = newY;
    } else {
        cat.dx = 0;
        cat.dy = 0;
    }

    if (nextDirection) {
        const nextX = cat.x + nextDirection.dx * cat.speed;
        const nextY = cat.y + nextDirection.dy * cat.speed;
        if (canMove(nextX, nextY, tileSize)) {
            cat.dx = nextDirection.dx * cat.speed;
            cat.dy = nextDirection.dy * cat.speed;
            nextDirection = null;
        }
    }
}

function moveMice() {
    mice.forEach(mouse => {
        if (mouse.steps <= 0 || !canMove(mouse.x + mouse.direction.dx * tileSize / 5, mouse.y + mouse.direction.dy * tileSize / 5, tileSize / 2)) {
            mouse.direction = findBestDirection(mouse);
            mouse.steps = 5;
        }
        const newX = mouse.x + mouse.direction.dx * tileSize / 5;
        const newY = mouse.y + mouse.direction.dy * tileSize / 5;
        if (canMove(newX, newY, tileSize / 2)) {
            mouse.x = newX;
            mouse.y = newY;
            mouse.steps--;
        } else {
            mouse.steps = 0;
        }
    });
}

function findBestDirection(mouse) {
    const possibleDirections = directions.filter(direction => canMove(mouse.x + direction.dx * tileSize, mouse.y + direction.dy * tileSize, tileSize) && (mouse.direction === null || !(mouse.direction.dx === -direction.dx && mouse.direction.dy === -direction.dy)));
    if (possibleDirections.length === 0) return { dx: -mouse.direction.dx, dy: -mouse.direction.dy };

    let bestDirection = possibleDirections[0];
    let maxDistance = 0;

    possibleDirections.forEach(direction => {
        const newX = mouse.x + direction.dx * tileSize;
        const newY = mouse.y + direction.dy * tileSize;
        const distance = Math.hypot(newX - cat.x, newY - cat.y);
        if (distance > maxDistance) {
            maxDistance = distance;
            bestDirection = direction;
        }
    });

    return bestDirection;
}

function canMove(x, y, size) {
    const col1 = Math.floor(x / tileSize);
    const row1 = Math.floor(y / tileSize);
    const col2 = Math.floor((x + size - 1) / tileSize);
    const row2 = Math.floor((y + size - 1) / tileSize);
    return maze[row1][col1] === 0 && maze[row1][col2] === 0 && maze[row2][col1] === 0 && maze[row2][col2] === 0;
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawMaze() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (maze[row][col] === 1) {
                ctx.fillStyle = 'blue';
                ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
            } else {
                ctx.fillStyle = 'black';
                ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
            }
        }
    }
}

function drawScore() {
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('time').textContent = 'Time: ' + timeRemaining;
}

function gameLoop() {
    clear();
    drawMaze();
    drawCat();
    drawMice();
    drawScore();
    moveCat();
    moveMice();
    checkCollision();
    if (timeRemaining > 0) {
        requestAnimationFrame(gameLoop);
    } else {
        endGame();
    }
}

function checkCollision() {
    for (let i = 0; i < mice.length; i++) {
        if (Math.abs(cat.x - mice[i].x) < tileSize && Math.abs(cat.y - mice[i].y) < tileSize) {
            mice.splice(i, 1);
            score++;
            setTimeout(addMouse, 2000);
            break;
        }
    }
}

function changeDirection(event) {
    const { keyCode } = event;
    switch (keyCode) {
        case 37: // flèche gauche
            nextDirection = { dx: -1, dy: 0 };
            break;
        case 38: // flèche haut
            nextDirection = { dx: 0, dy: -1 };
            break;
        case 39: // flèche droite
            nextDirection = { dx: 1, dy: 0 };
            break;
        case 40: // flèche bas
            nextDirection = { dx: 0, dy: 1 };
            break;
    }
}

function createControlButton(id, text, onClick) {
    const button = document.createElement('button');
    button.id = id;
    button.innerText = text;
    button.className = 'control-button';
    button.addEventListener('click', onClick);
    return button;
}

document.addEventListener('keydown', changeDirection);

function generateMaze(rows, cols) {
    const maze = Array.from({ length: rows }, () => Array(cols).fill(1));
    const stack = [{ x: 1, y: 1 }];
    maze[1][1] = 0;

    while (stack.length > 0) {
        const { x, y } = stack.pop();
        const directions = shuffleArray([
            { dx: -2, dy: 0 }, { dx: 2, dy: 0 },
            { dx: 0, dy: -2 }, { dx: 0, dy: 2 }
        ]);

        for (const { dx, dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (ny > 0 && ny < rows - 1 && nx > 0 && nx < cols - 1 && maze[ny][nx] === 1) {
                maze[ny][nx] = 0;
                maze[y + dy / 2][x + dx / 2] = 0;
                stack.push({ x: nx, y: ny });
            }
        }
    }

    // Ajouter des murs autour des bords
    for (let i = 0; i < rows; i++) {
        maze[i][0] = 1;
        maze[i][cols - 1] = 1;
    }
    for (let j = 0; j < cols; j++) {
        maze[0][j] = 1;
        maze[rows - 1][j] = 1;
    }

    return maze;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startCountdown() {
    countdownInterval = setInterval(() => {
        if (timeRemaining > 0) {
            timeRemaining--;
        } else {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function endGame() {
    clearInterval(gameInterval);
    clearInterval(countdownInterval);
    document.getElementById('score').textContent = 'Fin du jeu ! Score : ' + score;
    document.getElementById('time').textContent = '';
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Recommencer';
    restartButton.className = 'control-button';
    restartButton.onclick = restartGame;
    document.body.appendChild(restartButton);
}

function restartGame() {
    score = 0;
    timeRemaining = 120;
    maze = generateMaze(rows, cols);
    mice = initializeMice();
    cat.x = tileSize * 1;
    cat.y = tileSize * 1;
    cat.dx = 0;
    cat.dy = 0;
    nextDirection = null;
    document.body.removeChild(document.querySelector('button.control-button'));
    startGame();
}

function startGame() {
    document.getElementById('startButton').style.display = 'none';
    gameInterval = requestAnimationFrame(gameLoop);
    startCountdown();
}

catImg.onload = function() {
    mouseImg.onload = function() {
        document.getElementById('startButton').style.display = 'block';
    };
};

// Créer les boutons de contrôle
const controlContainer = document.createElement('div');
controlContainer.className = 'control-container';

const controlUp = createControlButton('control-up', '↑', () => { nextDirection = { dx: 0, dy: -1 }; });
const controlLeft = createControlButton('control-left', '←', () => { nextDirection = { dx: -1, dy: 0 }; });
const controlDown = createControlButton('control-down', '↓', () => { nextDirection = { dx: 0, dy: 1 }; });
const controlRight = createControlButton('control-right', '→', () => { nextDirection = { dx: 1, dy: 0 }; });

const controlRow = document.createElement('div');
controlRow.className = 'control-row';

controlRow.appendChild(controlLeft);
controlRow.appendChild(controlDown);
controlRow.appendChild(controlRight);

controlContainer.appendChild(controlUp);
controlContainer.appendChild(controlRow);

document.body.appendChild(controlContainer);

// Plein écran
const fullscreenButton = document.createElement('button');
fullscreenButton.id = 'fullscreenButton';
fullscreenButton.innerText = 'Plein écran';
fullscreenButton.className = 'control-button small-font'; // Ajout d'une classe pour le style
fullscreenButton.style.marginBottom = '20px'; // Ajouter une marge en bas
fullscreenButton.addEventListener('click', toggleFullScreen);
document.body.appendChild(fullscreenButton);

function toggleFullScreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) { // Safari
            document.documentElement.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { // Safari
            document.webkitExitFullscreen();
        }
    }
}

// Bouton de démarrage
const startButton = document.createElement('button');
startButton.id = 'startButton';
startButton.innerText = 'Démarrer le jeu';
startButton.className = 'control-button large-font';
startButton.style.display = 'none';
startButton.addEventListener('click', startGame);
document.body.appendChild(startButton);

// Auto Fullscreen on Scroll for Safari on iPhone
window.addEventListener('scroll', function() {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.navigator.standalone) {
        toggleFullScreen();
    }
});
