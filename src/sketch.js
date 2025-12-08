import p5 from "p5";
import { PLAYER_1, PLAYER_2, SYSTEM } from "@rcade/plugin-input-classic";
// import { PLAYER_1, PLAYER_2, SYSTEM } from "@rcade/plugin-input-spinners";

// Rcade game dimensions
const WIDTH = 336;
const HEIGHT = 262;

const sketch = (p) => {
    let tanks = [];
    let bullets;
    let gridState = [];
    const gridCols = 10;
    const gridRows = 10;
    const tankSpeed = 3;
    const captureTime = 5000; // 5 seconds in milliseconds
    const tankRotationSpeed = 0.05;
    const turretSpeed = 0.05;
    const bulletSpeed = 7;

    let x;
    let y;
    const speed = 4;
    const ballSize = 20;
    let gameStarted = false;

    p.setup = () => {
        p.createCanvas(WIDTH, HEIGHT);
        x = WIDTH / 2;
        y = HEIGHT / 2;
        // Player 1 (WASD)
        tanks.push({
            x: width / 4,
            y: height / 2,
            w: 50,
            h: 40,
            player: 1,
            bodyAngle: 0,
            turretAngle: 0
        });
        // Player 2 (Arrow Keys)
        tanks.push({
            x: width * 3 / 4,
            y: height / 2,
            w: 50,
            h: 40,
            player: 2,
            bodyAngle: PI,
            turretAngle: PI
        });
        bullets = [];
        rectMode(CENTER);

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
        p.background(0);

        if (!gameStarted) {
            // Show start screen
            p.fill(255);
            p.textSize(18);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("Press 2P START", WIDTH / 2, HEIGHT / 2);
            p.textSize(12);
            p.text("Use D-PAD to move, SPINNER to rotate turret, BUTTONs to spray water or seeds", WIDTH / 2, HEIGHT / 2 + 30);

            if (SYSTEM.TWO_PLAYER) {
                gameStarted = true;
            }
            return;
        }

        if (PLAYER_1.A) {
            p.fireBullet(tanks[0]);
        }
        if (PLAYER_2.A) {
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
            tanks[0].x += tankSpeed * cos(tanks[0].bodyAngle);
            tanks[0].y += tankSpeed * sin(tanks[0].bodyAngle);
        }
        if (PLAYER_1.DPAD.down) { // S - backward
            tanks[0].x -= tankSpeed * cos(tanks[0].bodyAngle);
            tanks[0].y -= tankSpeed * sin(tanks[0].bodyAngle);
        }
        if (PLAYER_1.DPAD.left) { // A - rotate left
            tanks[0].bodyAngle -= tankRotationSpeed;
        }
        if (PLAYER_1.DPAD.right) { // D - rotate right
            tanks[0].bodyAngle += tankRotationSpeed;
        }
        if (keyIsDown(66)) { // TODO: SPINNER
            tanks[0].turretAngle -= turretSpeed;
        }
        if (keyIsDown(78)) { // TODO: SPINNER
            tanks[0].turretAngle += turretSpeed;
        }
        // Player 2 Controls (Arrow Keys, 2, 3)
        if (PLAYER_2.DPAD.up) { // Forward
            tanks[1].x += tankSpeed * cos(tanks[1].bodyAngle);
            tanks[1].y += tankSpeed * sin(tanks[1].bodyAngle);
        }
        if (PLAYER_2.DPAD.down) { // Backward
            tanks[1].x -= tankSpeed * cos(tanks[1].bodyAngle);
            tanks[1].y -= tankSpeed * sin(tanks[1].bodyAngle);
        }
        if (PLAYER_2.DPAD.left) { // Rotate left
            tanks[1].bodyAngle -= tankRotationSpeed;
        }
        if (PLAYER_2.DPAD.right) { // Rotate right
            tanks[1].bodyAngle += tankRotationSpeed;
        }
        if (keyIsDown(99)) { // TODO: SPINNER
            tanks[1].turretAngle -= turretSpeed;
        }
        if (keyIsDown(98)) { // TODO: SPINNER
            tanks[1].turretAngle += turretSpeed;
        }

        // Screen wrapping for both tanks
        for (let tank of tanks) {
            if (tank.x > width + tank.w / 2) {
            tank.x = -tank.w / 2;
            } else if (tank.x < -tank.w / 2) {
            tank.x = width + tank.w / 2;
            }

            if (tank.y > height + tank.h / 2) {
            tank.y = -tank.h / 2;
            } else if (tank.y < -tank.h / 2) {
            tank.y = height + tank.h / 2;
            }
        }
    };

    p.fireBullet = (tank) => {
        const gridSize = 100;
        let bullet = {
            x: tank.x,
            y: tank.y,
            angle: tank.turretAngle,
            owner: tank.player
        };

        // Store the grid location at the time of firing
        bullet.originGridX = floor(tank.x / gridSize);
        bullet.originGridY = floor(tank.y / gridSize);

        bullets.push(bullet);
    };

    p.drawGrid = () => {
        const gridSize = 100;
        push(); // Isolate drawing styles
        rectMode(CORNER); // Use corner mode for grid drawing

        // Draw filled squares
        noStroke();
        for (let i = 0; i < gridCols; i++) {
            for (let j = 0; j < gridRows; j++) {
            if (gridState[i][j].player1) {
                if (gridState[i][j].fullyCaptured) {
                fill(0, 255, 0); // Fully opaque green
                } else {
                fill(0, 255, 0, 64); // Green with 75% transparency (25% opacity)
                }
                rect(i * gridSize, j * gridSize, gridSize, gridSize);
            }
            // Only draw seeds if the cell is NOT fully captured
            if (gridState[i][j].player2 && !gridState[i][j].fullyCaptured) {
                // Draw "sprinkles" for player 2
                drawSeeds(i, j, gridSize);
            }
            }
        }

        // Draw grid lines
        stroke(0, 128, 0);
        strokeWeight(1);
        for (let x = gridSize; x < width; x += gridSize) {
            line(x, 0, x, height);
        }
        for (let y = gridSize; y < height; y += gridSize) {
            line(0, y, width, y);
        }
        pop(); // Restore original drawing styles (including rectMode)
    };

    p.updateGridState = () => {
        const currentTime = millis();
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
        push();
        // Use a single, constant seed to make the sprinkle pattern identical in every cell.
        randomSeed(1337);
        stroke(0, 128, 0);
        strokeWeight(2);
        for (let i = 0; i < 40; i++) { // Draw 20 seeds
            const x = gridI * size;
            const y = gridJ * size;
            const seedSprinkX = x + random(size);
            const seedSprinkY = y + random(size);
            const angle = random(TWO_PI);
            const seedSprinkLength = 5;
            const endX = seedSprinkX + seedSprinkLength * cos(angle);
            const endY = seedSprinkY + seedSprinkLength * sin(angle);
            line(seedSprinkX, seedSprinkY, endX, endY);
        }
        // Reset the random seed so it doesn't affect other parts of the sketch that use random().
        randomSeed();
        pop();
    };

    p.drawTanks = () => {
        for (let tank of tanks) {
            // Tank Body
            push();
            translate(tank.x, tank.y);
            rotate(tank.bodyAngle);
            stroke(0, 128, 0);
            strokeWeight(2);
            fill(0);
            rect(0, 0, tank.w, tank.h);
            pop();
            // Turret
            push();
            translate(tank.x, tank.y);
            rotate(tank.turretAngle);
            fill(0);
            stroke(0, 128, 0);
            ellipse(0, 0, 30, 30); // Turret base
            line(0, 0, 40, 0); // Turret barrel
            pop();
        }
    };

    p.updateBullets = () => {
        for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];

        // Check for collision with neighboring squares
        const gridSize = 100;
        let bulletGridX = floor(bullet.x / gridSize);
        let bulletGridY = floor(bullet.y / gridSize);

        // Check if the bullet is in a neighboring square (but not the center one)
        const inNeighborSquare = Math.abs(bulletGridX - bullet.originGridX) <= 1 && Math.abs(bulletGridY - bullet.originGridY) <= 1;
        const inCenterSquare = bulletGridX === bullet.originGridX && bulletGridY === bullet.originGridY;

        if (inNeighborSquare && !inCenterSquare) {
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
            cell.contestedTimestamp = millis(); // Start capture timer
            cell.singlePlayerTimestamp = null; // Stop decay timer
        } else if (isNowSinglePlayer) {
            // State is single-player: start or reset the decay timer.
            cell.singlePlayerTimestamp = millis();
        }

        bullets.splice(i, 1);
        continue; // Skip to the next bullet
        }

        bullet.x += bulletSpeed * cos(bullet.angle);
        bullet.y += bulletSpeed * sin(bullet.angle);

        // Remove bullets that go off-screen
        if (bullet.x < 0 || bullet.x > width || bullet.y < 0 || bullet.y > height) {
        bullets.splice(i, 1);
        }
    }
    };

    p.drawBullets = () => {
        stroke(0, 128, 0);
        strokeWeight(3);
        for (let bullet of bullets) {
            push();
            translate(bullet.x, bullet.y);
            rotate(bullet.angle);
            line(0, 0, 10, 0); // Draw bullet as a short line
            pop();
        }
    }

};

new p5(sketch, document.getElementById("sketch"));
