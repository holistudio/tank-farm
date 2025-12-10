# Tanks Go Bloom 🌱

This is an RCade port of [project-tank](https://github.com/holistudio/project-tank) p5js game.

It is now LIVE on RCade at [The Recurse Center](https://recurse.com)

https://github.com/user-attachments/assets/84a730c8-a320-4a74-9a29-5a4ce402c16c

## Getting Started 🛠️

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

This launches Vite on port 5173 and connects to the RCade cabinet emulator.

## Emulator Controls ⌨️

```
  | Key      | Action           |
  |----------|------------------|
  | Player 1 |                  |
  | W        | UP               |
  | S        | DOWN             |
  | A        | LEFT             |
  | D        | RIGHT            |
  | F        | A Button         |
  | G        | B Button         |
  | Player 2 |                  |
  | I        | UP               |
  | K        | DOWN             |
  | J        | LEFT             |
  | L        | RIGHT            |
  | ;        | A Button         |
  | '        | B Button         |
  | System   |                  |
  | 2        | Two Player Start |

  Spinner Controls (@rcade/input-spinners)

  | Key | Action           |
  |-----|------------------|
  | C   | P1 Spinner Left  |
  | V   | P1 Spinner Right |
  | .   | P2 Spinner Left  |
  | /   | P2 Spinner Right |
```

## Building 🏗️

```bash
npm run build
```

Output goes to `dist/` and is ready for deployment.

## Project Structure 🗂️

```
├── src/
│   ├── sketch.js     # p5.js sketch (game code)
│   └── style.css     # Styles
├── index.html        # HTML entry
└── package.json
```

## Arcade Controls 🕹️

This template uses `@rcade/plugin-input-classic` and `@rcade/plugin-input-spinners` for arcade input:

```js
import { PLAYER_1, PLAYER_2 SYSTEM } from '@rcade/plugin-input-classic'
import { PLAYER_1 as SPINNER_1, PLAYER_2 as SPINNER_2 } from "@rcade/plugin-input-spinners"

// D-pad
if (PLAYER_1.DPAD.up) { /* ... */ }
if (PLAYER_1.DPAD.down) { /* ... */ }
if (PLAYER_1.DPAD.left) { /* ... */ }
if (PLAYER_1.DPAD.right) { /* ... */ }

// Buttons
if (PLAYER_1.A) { /* ... */ }
if (PLAYER_1.B) { /* ... */ }

// Spinner Angle
tank.turretAngle = SPINNER_1.SPINNER.angle

// Same for PLAYER_2

// System
if (SYSTEM.TWO_PLAYER) { /* Start game */ }
```

## About RCade 👾

This game is built for [RCade](https://rcade.recurse.com), a custom arcade cabinet at The Recurse Center. Learn more about the project at [github.com/fcjr/RCade](https://github.com/fcjr/RCade).

---

Made with <3 at [The Recurse Center](https://recurse.com)
