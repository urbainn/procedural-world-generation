// Get canvas ctx
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

// Set canvas size
(updateCanvasSize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
})();

// URL parameters
const searchParams = new URLSearchParams(window.location.search);

// World generation settings
const settings = {
    seed: searchParams.get('sd') || Math.floor(Math.random() * 1000000),
    resolutionCap: 500,
}

// Current coords
let x = parseInt(searchParams.get('x') || 0);
let y = parseInt(searchParams.get('y') || 0);

// Current zoom
let zoom = parseInt(searchParams.get('zm') || 200);

// Set seed (number)
noise.seed(parseInt(settings.seed));

// World pos data
let worldHeight, centerWidth, centerHeight = 0;

// Update URL
const updateURL = () => window.history.replaceState({}, '', `?x=${x}&y=${y}&zm=${zoom}&sd=${settings.seed}`);

// Update coords
const coords_el = document.getElementById('coords');
const updateCoords = () => coords_el.innerHTML = 'x: ' + x + ', y: ' + y;
updateCoords();

// Update refresh rate
const refreshRate_el = document.getElementById('refreshRate');
const updateRefreshRate = (refreshRate) => {
    refreshRate_el.innerHTML = (refreshRate < 1000 ? (refreshRate).toFixed(1) + '/s' : "a lot!");
    refreshRate_el.style.color = `rgb(${255 - Math.round(refreshRate)}, ${Math.round(refreshRate)}, 70)`;
}

// Update current biome
const biome_el = document.getElementById('biome');
const updateBiomeInfo = (biome) => biome_el.innerHTML = biome.name;

// Draw world
drawMap();

/**
 * Clear canvas and draw world
 */
function drawMap() {

    let cappedZoom = zoom > settings.resolutionCap ? settings.resolutionCap : zoom;
    let squareSide = canvas.width / cappedZoom;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update & draw world
    generateWorld();

    // If zoom is less than 60, draw a grid    
    if (cappedZoom < 60) {
        ctx.strokeStyle = '#000000';
        ctx.globalAlpha = 1 - (cappedZoom / 60);
        ctx.lineWidth = 5 * (1 - (cappedZoom / 60));
        for (let wX = 0; wX < cappedZoom; wX++) {
            for (let wY = 0; wY < worldHeight; wY++) {
                ctx.strokeRect(wX * squareSide, wY * squareSide, squareSide, squareSide);
            }
        }
        ctx.globalAlpha = 1;
    }

}

// Move the world
function moveWorld(direction) {
    let moveSpeed = zoom > 60 ? Math.round(zoom / 60) : 1;
    switch (direction) {
        case 'up':
            y -= moveSpeed;
            break;
        case 'down':
            y += moveSpeed;
            break;
        case 'left':
            x -= moveSpeed;
            break;
        case 'right':
            x += moveSpeed;
            break;
    }
    window.requestAnimationFrame(drawMap);

    // Update coords
    updateCoords();
    updateURL();
}

// Move the world on key press
document.addEventListener('keydown', function (event) {
    switch (event.key) {
        case 'ArrowUp':
            moveWorld('up');
            break;
        case 'ArrowDown':
            moveWorld('down');
            break;
        case 'ArrowLeft':
            moveWorld('left');
            break;
        case 'ArrowRight':
            moveWorld('right');
            break;
    }
});

// Zoom in and out
canvas.addEventListener('wheel', function (event) {
    if (event.deltaY > 0) {
        zoom += Math.ceil(0.1 * zoom);
    } else {
        if (zoom < 5) return;
        zoom -= Math.ceil(0.1 * zoom);
    }
    window.requestAnimationFrame(drawMap);

    // Update URL
    updateURL();
});

// Handle window resize
window.addEventListener('resize', function () {
    updateCanvasSize();
    window.requestAnimationFrame(drawMap);
});

// Settings
const settingsModal = document.getElementById('settingsModal');
const settingsInputs = {
    seed: document.getElementById('seed'),
    resolutionCap: document.getElementById('resolutionCap'),
}

// 'Open settings' button
document.getElementById('openSettings').addEventListener('click', () => {
    Object.keys(settingsInputs).forEach(input => settingsInputs[input].value = settings[input]);
    settingsModal.classList.remove('hidden');
});

// 'Save settings' button
document.getElementById('saveSettings').addEventListener('click', () => {
    Object.keys(settingsInputs).forEach(input => settings[input] = settingsInputs[input].value);
    settingsModal.classList.add('hidden');

    // Update canvas & URL
    noise.seed(parseInt(settings.seed));
    window.requestAnimationFrame(drawMap);
    updateURL();
});

// Get mouse position map coords
const getMousePos = (evt) => {
    let squareSide = canvas.width / zoom;
    return {
        mapX: Math.floor(evt.clientX / squareSide) + x - centerWidth,
        mapY: Math.floor(evt.clientY / squareSide) + y - centerHeight
    }
}

// Give map coords on mouse location
const mouseCoords = document.getElementById('mouseCoords');
document.addEventListener('mousemove', function (event) {

    // If mouse is out of canvas, don't show coords
    if (event.target != canvas) return mouseCoords.innerHTML = '';

    let coords = getMousePos(event);
    mouseCoords.innerHTML = 'x: ' + (coords.mapX) + ', y: ' + (coords.mapY);
    mouseCoords.style.left = event.clientX + 10 + 'px';
    mouseCoords.style.top = event.clientY + 10 + 'px';

});

// Go to map coords on mouse click
canvas.addEventListener('click', function (event) {
    let coords = getMousePos(event);
    x = coords.mapX, y = coords.mapY;
    window.requestAnimationFrame(drawMap);

    // Update coords
    updateCoords();
    updateURL();
});