import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { createGame } from './game.js';
import { createInput } from './input.js';
import { loadMusic } from './music.js';
import { loadSprites } from './renderer.js';
import { createHud } from './ui.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
canvas.focus();

const input = createInput(canvas);
const hud = createHud({
  scoreEl: document.getElementById('score'),
  livesEl: document.getElementById('lives'),
});

Promise.all([loadSprites(), loadMusic()])
  .then(([sprites]) => {
    const game = createGame(canvas, sprites, input, hud);
    game.start();
  })
  .catch((err) => {
    console.error(err);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Failed to load game assets.', 20, 40);
  });
