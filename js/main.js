import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { createGame } from './game.js';
import { createInput } from './input.js';
import { loadSprites } from './renderer.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
canvas.focus();

const input = createInput(canvas);

loadSprites()
  .then((sprites) => {
    const game = createGame(canvas, sprites, input);
    game.start();
  })
  .catch((err) => {
    console.error(err);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Failed to load game assets.', 20, 40);
  });
