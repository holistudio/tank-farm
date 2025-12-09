import p5 from "p5";
import { PLAYER_1, PLAYER_2, SYSTEM } from "@rcade/plugin-input-classic";
import { PLAYER_1 as SPINNER_1, PLAYER_2 as SPINNER_2 } from "@rcade/plugin-input-spinners";

// Rcade game dimensions
const WIDTH = 336;
const HEIGHT = 262;
const GAME_WIDTH = 262;
const GAME_HEIGHT = 262;
const GAME_X_OFFSET = (WIDTH - GAME_WIDTH) / 2;
const GAME_Y_OFFSET = (HEIGHT - GAME_HEIGHT) / 2;

const SCALE_FACTOR = 2 * GAME_WIDTH / 1000; // Original was 1000x1000

const sketch = (p) => {
    let tanks = [];
    let bullets;
    let gridState = [];
    const gridCols = 10;
    const gridRows = 10;
    const GRID_CELL_SIZE = GAME_WIDTH / gridCols;

    const tankSpeed = 3 * SCALE_FACTOR;
    const captureTime = 5000; // 5 seconds in milliseconds
    const tankRotationSpeed = 0.05;
    const turretSpeed = 0.05;
    const bulletSpeed = 7 * SCALE_FACTOR;

    let gameStarted = false;

    p.setup = () => {
        p.createCanvas(WIDTH, HEIGHT);
        p.rectMode(p.CENTER);
        p.textAlign(p.CENTER, p.CENTER);

        // Player 1
        tanks.push({
            x: GAME_X_OFFSET + GAME_WIDTH / 4,
            y: GAME_Y_OFFSET + GAME_HEIGHT / 2,
            w: 50 * SCALE_FACTOR,
            h: 40 * SCALE_FACTOR,
            player: 1,
            bodyAngle: 0, // Pointing up
            turretAngle: 0
        });
        // Player 2
        tanks.push({
            x: GAME_X_OFFSET + GAME_WIDTH * 3 / 4,
            y: GAME_Y_OFFSET + GAME_HEIGHT / 2,
            w: 50 * SCALE_FACTOR,
            h: 40 * SCALE_FACTOR,
            player: 2,
            bodyAngle: p.PI, 
            turretAngle: p.PI
        });
        bullets = [];

        // Initialize grid state
        for (let i = 0; i < gridCols; i++) {
            gridState[i] = [];
            for (let j = 0; j < gridRows; j++) {
            gridState[i][j] = {
                player1: false,
                player2: false,
                contestedTimestamp: null,
                fullyCaptured: false,
                singlePlayerTimestamp: null // Timer for decay
            };
            }
        }
    };

    p.draw = () => {
        p.background(20); // Dark grey for the outer area

        if (!gameStarted) {
            // Show start screen
            p.fill(255);
            p.textSize(18);
            p.text("Press 2P START", WIDTH / 2, HEIGHT / 2);
            p.textSize(12);
            p.text("Use D-PAD to move, \nSPINNER to rotate turret, \nBUTTONs to spray water or seeds", WIDTH / 2, HEIGHT / 2 + 30);

            if (SYSTEM.TWO_PLAYER) {
                gameStarted = true;
            }
            return;
        }

        // Draw the black game area background
        p.fill(0);
        p.noStroke();
        p.rect(GAME_X_OFFSET + GAME_WIDTH / 2, GAME_Y_OFFSET + GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);

        if (PLAYER_1.A || PLAYER_1.B) {
            p.fireBullet(tanks[0]);
        }
        if (PLAYER_2.A || PLAYER_2.B) {
            p.fireBullet(tanks[1]);
        }

        p.drawGrid();

        p.updateGridState();
        p.handleInput();

        p.updateBullets();
        p.drawTanks();
        p.drawBullets();

    };

    p.handleInput = () => {
        // Player 1 Controls 
        if (PLAYER_1.DPAD.up) { // - forward
            tanks[0].x += tankSpeed * p.cos(tanks[0].bodyAngle);
            tanks[0].y += tankSpeed * p.sin(tanks[0].bodyAngle);
        }
        if (PLAYER_1.DPAD.down) { // S - backward
            tanks[0].x -= tankSpeed * p.cos(tanks[0].bodyAngle);
            tanks[0].y -= tankSpeed * p.sin(tanks[0].bodyAngle);
        }
        if (PLAYER_1.DPAD.left) { // A - rotate left
            tanks[0].bodyAngle -= tankRotationSpeed;
        }
        if (PLAYER_1.DPAD.right) { // D - rotate right
            tanks[0].bodyAngle += tankRotationSpeed;
        }

        // tanks[0].turretAngle -= SPINNER_1.SPINNER.step_delta;
        // console.log(SPINNER_1.SPINNER.angle)
        tanks[0].turretAngle = SPINNER_1.SPINNER.angle;

        // Player 2 Controls (Arrow Keys, 2, 3)
        if (PLAYER_2.DPAD.up) { // Forward
            tanks[1].x += tankSpeed * p.cos(tanks[1].bodyAngle);
            tanks[1].y += tankSpeed * p.sin(tanks[1].bodyAngle);
        }
        if (PLAYER_2.DPAD.down) { // Backward
            tanks[1].x -= tankSpeed * p.cos(tanks[1].bodyAngle);
            tanks[1].y -= tankSpeed * p.sin(tanks[1].bodyAngle);
        }
        if (PLAYER_2.DPAD.left) { // Rotate left
            tanks[1].bodyAngle -= tankRotationSpeed;
        }
        if (PLAYER_2.DPAD.right) { // Rotate right
            tanks[1].bodyAngle += tankRotationSpeed;
        }
        // tanks[1].turretAngle -= SPINNER_2.SPINNER.step_delta;
        tanks[1].turretAngle = SPINNER_2.SPINNER.angle +p.PI;

        // Screen wrapping for both tanks
        for (let tank of tanks) {
            if (tank.x > GAME_X_OFFSET + GAME_WIDTH + tank.w / 2) {
            tank.x = GAME_X_OFFSET - tank.w / 2;
            } else if (tank.x < GAME_X_OFFSET - tank.w / 2) { // TODO: This should be based on game area
            tank.x = GAME_X_OFFSET + GAME_WIDTH + tank.w / 2;
            }

            if (tank.y > GAME_HEIGHT + tank.h / 2) {
            tank.y = -tank.h / 2;
            } else if (tank.y < -tank.h / 2) { // TODO: This should be based on game area
            tank.y = GAME_HEIGHT + tank.h / 2;
            }
        }
    };

    p.fireBullet = (tank) => {
        let bullet = {
            x: tank.x,
            y: tank.y,
            angle: tank.turretAngle,
            owner: tank.player
        };

        // Store the grid location at the time of firing
        bullet.originGridX = p.floor((tank.x - GAME_X_OFFSET) / GRID_CELL_SIZE);
        bullet.originGridY = p.floor((tank.y - GAME_Y_OFFSET) / GRID_CELL_SIZE);

        bullets.push(bullet);
    };

    p.drawGrid = () => {
        p.push(); // Isolate drawing styles
        p.rectMode(p.CORNER); // Use corner mode for grid drawing

        // Draw filled squares
        p.noStroke();
        for (let i = 0; i < gridCols; i++) {
            for (let j = 0; j < gridRows; j++) {
            if (gridState[i][j].player1) {
                if (gridState[i][j].fullyCaptured) {
                p.fill(0, 255, 0); // Fully opaque green
                } else {
                p.fill(0, 255, 0, 79); // Green with 75% transparency (25% opacity)
                }
                p.rect(GAME_X_OFFSET + i * GRID_CELL_SIZE, GAME_Y_OFFSET + j * GRID_CELL_SIZE, GRID_CELL_SIZE, GRID_CELL_SIZE);
            }
            // Only draw seeds if the cell is NOT fully captured
            if (gridState[i][j].player2 && !gridState[i][j].fullyCaptured) {
                // Draw "sprinkles" for player 2
                p.drawSeeds(i, j, GRID_CELL_SIZE);
            }
            }
        }

        // Draw grid lines
        p.stroke(0, 128, 0);
        p.strokeWeight(1);
        for (let i = 1; i < gridCols; i++) {
            p.line(GAME_X_OFFSET + i * GRID_CELL_SIZE, GAME_Y_OFFSET, GAME_X_OFFSET + i * GRID_CELL_SIZE, GAME_Y_OFFSET + GAME_HEIGHT);
        }
        for (let j = 1; j < gridRows; j++) {
            p.line(GAME_X_OFFSET, GAME_Y_OFFSET + j * GRID_CELL_SIZE, GAME_X_OFFSET + GAME_WIDTH, GAME_Y_OFFSET + j * GRID_CELL_SIZE);
        }
        p.pop(); // Restore original drawing styles

        // Restore rectMode for other draw functions
        p.rectMode(p.CENTER);
    };

    p.updateGridState = () => {
        const currentTime = p.millis();
        for (let i = 0; i < gridCols; i++) {
            for (let j = 0; j < gridRows; j++) {
            let cell = gridState[i][j];
            const isSinglePlayer = (cell.player1 && !cell.player2) || (!cell.player1 && cell.player2);

            // 1. Check for contested cells to become fully captured
            if (cell.contestedTimestamp && !cell.fullyCaptured) {
                if (currentTime - cell.contestedTimestamp > captureTime) {
                cell.fullyCaptured = true;
                cell.singlePlayerTimestamp = null; // Stop decay timer
                }
            }

            // 2. Check for single-player cells to decay back to neutral
            if (isSinglePlayer && cell.singlePlayerTimestamp) {
                if (currentTime - cell.singlePlayerTimestamp > captureTime) {
                // Reset the cell to its initial state
                cell.player1 = false;
                cell.player2 = false;
                cell.contestedTimestamp = null;
                cell.fullyCaptured = false;
                cell.singlePlayerTimestamp = null;
                }
            }
            }
        }
    };

    p.drawSeeds = (gridI, gridJ, size) => {
        p.push();
        // Use a single, constant seed to make the sprinkle pattern identical in every cell.
        p.randomSeed(1337);
        p.stroke(0, 128, 0);
        p.strokeWeight(2);
        for (let i = 0; i < 40; i++) { // Draw 20 seeds
            const x = GAME_X_OFFSET + gridI * size;
            const y = GAME_Y_OFFSET + gridJ * size;
            const seedSprinkX = x + p.random(size);
            const seedSprinkY = y + p.random(size);
            const angle = p.random(p.TWO_PI);
            const seedSprinkLength = 5 * SCALE_FACTOR;
            const endX = seedSprinkX + seedSprinkLength * p.cos(angle);
            const endY = seedSprinkY + seedSprinkLength * p.sin(angle);
            p.line(seedSprinkX, seedSprinkY, endX, endY);
        }
        // Reset the random seed so it doesn't affect other parts of the sketch that use random().
        p.randomSeed();
        p.pop();
    };

    p.drawTanks = () => {
        for (let tank of tanks) {
            p.push();
            p.translate(tank.x, tank.y);
            p.rectMode(p.CENTER);

            // Tank Body
            p.push();
            p.rotate(tank.bodyAngle);
            p.stroke(0, 128, 0);
            p.strokeWeight(2);
            p.fill(0);
            p.rect(0, 0, tank.w, tank.h);
            p.pop();

            // Calculate the offset for the turret towards the back of the tank
            const turretOffsetX = -2 * p.cos(tank.bodyAngle);
            const turretOffsetY = -2 * p.sin(tank.bodyAngle);

            // Turret
            p.push();
            p.translate(turretOffsetX, turretOffsetY); // Apply the offset
            p.rotate(tank.turretAngle);
            p.fill(0);
            p.stroke(0, 128, 0);
            p.ellipse(0, 0, 30 * SCALE_FACTOR, 30 * SCALE_FACTOR); // Turret base
            p.strokeWeight(3)
            p.line(0, 0, 40 * SCALE_FACTOR, 0); // Turret barrel
            p.pop();

            p.pop();
        }
    };

    p.updateBullets = () => {
        for (let i = bullets.length - 1; i >= 0; i--) {
            let bullet = bullets[i];
            let bulletGridX = p.floor((bullet.x - GAME_X_OFFSET) / GRID_CELL_SIZE);
            let bulletGridY = p.floor((bullet.y - GAME_Y_OFFSET) / GRID_CELL_SIZE);

            // Check if the bullet is in a neighboring square (but not the center one)
            const inNeighborSquare = p.abs(bulletGridX - bullet.originGridX) <= 1 && p.abs(bulletGridY - bullet.originGridY) <= 1;
            const inCenterSquare = bulletGridX === bullet.originGridX && bulletGridY === bullet.originGridY;

            if (inNeighborSquare && !inCenterSquare && bulletGridX >= 0 && bulletGridX < gridCols && bulletGridY >= 0 && bulletGridY < gridRows) {
            let cell = gridState[bulletGridX][bulletGridY];
            const wasContested = cell.player1 && cell.player2;

            if (bullet.owner === 1) {
                cell.player1 = true;
            } else if (bullet.owner === 2) {
                cell.player2 = true;
            }

            const isNowContested = cell.player1 && cell.player2;
            const isNowSinglePlayer = (cell.player1 && !cell.player2) || (!cell.player1 && cell.player2);

            if (isNowContested && !wasContested) {
                // State changed to contested: start capture timer, stop decay timer.
                cell.contestedTimestamp = p.millis(); // Start capture timer
                cell.singlePlayerTimestamp = null; // Stop decay timer
            } else if (isNowSinglePlayer) {
                // State is single-player: start or reset the decay timer.
                cell.singlePlayerTimestamp = p.millis();
            }

            bullets.splice(i, 1);
            continue; // Skip to the next bullet
            }

            bullet.x += bulletSpeed * p.cos(bullet.angle);
            bullet.y += bulletSpeed * p.sin(bullet.angle);

            // Remove bullets that go off-screen
            if (bullet.x < GAME_X_OFFSET || bullet.x > GAME_X_OFFSET + GAME_WIDTH || bullet.y < GAME_Y_OFFSET || bullet.y > GAME_Y_OFFSET + GAME_HEIGHT) {
            bullets.splice(i, 1);
            }
        }
    };

    p.drawBullets = () => {
        p.stroke(0, 128, 0);
        p.strokeWeight(1);
        for (let bullet of bullets) {
            p.push();
            p.translate(bullet.x, bullet.y);
            p.rotate(bullet.angle);
            p.line(0, 0, 10 * SCALE_FACTOR, 0); // Draw bullet as a short line
            p.pop();
        }
    };

};

new p5(sketch, document.getElementById("sketch"));
