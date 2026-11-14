# Bolt Puzzle

Bolt Puzzle is a color-sorting game for phones and computers. Move colored bolts between poles, make stacks of five matching bolts, and clear the board in the displayed color order.

> **Status:** Playable prototype. Generated levels, undo, restart, and local progress work. Next: playtest and tune level difficulty.

**[Play Bolt Puzzle](https://timleitch.github.io/bolt-puzzle/)**

## How to play

1. Select a pole with bolts, then select another pole.
2. The entire group of matching bolts at the top moves together. It must fit: each pole holds at most five bolts.
3. Move onto an empty pole or a pole topped by the same color.
4. Make a stack of five matching bolts. It clears automatically when that color is next in the displayed order; otherwise it waits on its pole.
5. Clear every color to finish the level. If several completed stacks are next in order, they clear one after another.
6. Choose **Next level** for another generated puzzle. Undo or restart if you get stuck.

Each level is generated deterministically from its level number and has a valid solution. Regular levels start with three colors and add more as you progress, up to five. Every fifth level is larger: four groups of poles, alternating between 16 poles (two colors per group) and 20 poles (three colors per group). Colors repeat across groups, so they also appear more than once in the clearing order. You can move bolts between groups.

## Controls

| Action | Touch | Mouse / keyboard |
| --- | --- | --- |
| Select a pole or destination | Tap it | Click it, or focus it and press Enter or Space |
| Cancel a selection | Tap the selected pole again | Click or activate the selected pole again |
| Undo, restart, or start the next level | Tap the button | Click or focus the button and activate it |

Colors also use distinct symbols. The board supports portrait and landscape layouts and touch targets of at least 44 pixels.

## Run it

No installation or build step is required.

1. Open `index.html` in a browser. Alternatively, open a terminal in the `bolt-puzzle` folder and run:
   ```sh
   python -m http.server 8080
   ```
2. If using the server, open `http://localhost:8080`. The command works on Windows and Linux when Python is installed.

## Tests

With Node.js installed, run from the `bolt-puzzle` folder:

```sh
node --test test/game.test.js
```

The tests cover grouped moves, the five-bolt limit, ordered clearing, and generated solutions.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Game screen |
| `style.css` | Responsive visual styling |
| `js/data.js` | Colors and level tuning values |
| `js/game.js` | Level generation and game rules |
| `js/app.js` | Controls, rendering, undo, and local save |
| `test/game.test.js` | Game rule and generation tests |
| `.github/workflows/pages.yml` | Tests and deploys the game to GitHub Pages |

## Hosting and saves

Progress is saved in the browser's `localStorage`; there is no account or cloud save. Clearing browser data or switching browsers can remove that progress. GitHub Actions tests and deploys the static game to GitHub Pages on pushes to `main`.

## Build status

- **[DONE]** Generated, solvable levels with grouped moves and ordered clearing.
- **[DONE]** Larger generated levels with 16 or 20 poles, grouped on the board, and angled bolt artwork.
- **[DONE]** Touch, mouse, and keyboard controls, local progress, undo, and restart.
- **[DONE]** Rule and generated-solution tests.
- **[TODO]** Playtest and tune level difficulty.
- **[DONE]** Configure GitHub Pages deployment.

## Change log

### Bolt sorting concept (added 2026-11-14 at Tim's request)

Documented the idea: bolts stack on poles up to five tall; matching colors form stacks of five and clear.

### Generated puzzles and ordered clearing (added 2026-11-14 at Tim's request)

Built the game with generated levels, entire matching top groups moving together, and completed stacks clearing in the displayed color order.

### Larger boards and angled bolts (added 2026-11-14 at Tim's request)

Added grouped 16- and 20-pole levels and redrew the bolts to show their tops and stacks at an angle.
