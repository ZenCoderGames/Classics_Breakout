import {
  ASSET_PATH,
  BALL,
  BLOOM,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CELL_PX,
  COLORS,
  GAME_STATE,
  GRID,
  JUICE,
  LIFE_LOST,
  OVERLAY_TEXT,
  PADDLE,
  PLAYFIELD_BOTTOM,
  SPRITE_NAMES,
  TOP_WALL_ROWS,
  WALL_PX,
} from './config.js';
import { getLifeLostAnimState, drawLivesCircles } from './livesDisplay.js';
import {
  getShakeOffset,
  getActiveShakeAmplitude,
  getPaddleHitShake,
  getRedFlashAlpha,
  isLifeLostPopupVisible,
  isClearFlashOn,
} from './effects.js';

let sceneCanvas = null;
let sceneCtx = null;
let bloomCanvas = null;
let bloomCtx = null;

function ensureRenderBuffers() {
  if (sceneCanvas) return;

  sceneCanvas = document.createElement('canvas');
  sceneCanvas.width = CANVAS_WIDTH;
  sceneCanvas.height = CANVAS_HEIGHT;
  sceneCtx = sceneCanvas.getContext('2d');

  bloomCanvas = document.createElement('canvas');
  bloomCanvas.width = CANVAS_WIDTH;
  bloomCanvas.height = CANVAS_HEIGHT;
  bloomCtx = bloomCanvas.getContext('2d');
}

function applyBloom(displayCtx) {
  displayCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  displayCtx.drawImage(sceneCanvas, 0, 0);

  bloomCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  bloomCtx.filter = `blur(${BLOOM.BLUR_PX}px)`;
  bloomCtx.drawImage(sceneCanvas, 0, 0);
  bloomCtx.filter = 'none';

  displayCtx.save();
  displayCtx.globalCompositeOperation = 'screen';
  displayCtx.globalAlpha = BLOOM.INTENSITY;
  displayCtx.drawImage(bloomCanvas, 0, 0);
  displayCtx.restore();
}

export function loadSprites() {
  const sprites = {};
  const promises = SPRITE_NAMES.map((name) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        sprites[name] = img;
        resolve();
      };
      img.onerror = () => reject(new Error(`Failed to load ${name}`));
      img.src = `${ASSET_PATH}${name}.png`;
    });
  });
  return Promise.all(promises).then(() => sprites);
}

function boardToCanvas(col, row) {
  return {
    x: WALL_PX + col * CELL_PX,
    y: row * CELL_PX,
  };
}

function drawEmptyGrid(ctx, sprites) {
  const empty = sprites.EmptyBlock;
  for (let row = TOP_WALL_ROWS; row < GRID.ROWS; row += 1) {
    for (let col = 0; col < GRID.COLS; col += 1) {
      const { x, y } = boardToCanvas(col, row);
      ctx.drawImage(empty, x, y, CELL_PX, CELL_PX);
    }
  }
}

function drawTopWallRow(ctx, sprites) {
  const wall = sprites.Walls;
  for (let col = 0; col < GRID.COLS; col += 1) {
    const { x, y } = boardToCanvas(col, 0);
    ctx.drawImage(wall, x, y, CELL_PX, CELL_PX);
  }
}

function drawWalls(ctx, sprites) {
  const wall = sprites.Walls;
  const innerBottom = GRID.ROWS * CELL_PX;

  for (let row = 0; row <= GRID.ROWS; row += 1) {
    const y = row * CELL_PX;
    ctx.drawImage(wall, 0, y, WALL_PX, CELL_PX);
    ctx.drawImage(wall, WALL_PX + GRID.COLS * CELL_PX, y, WALL_PX, CELL_PX);
  }

  for (let col = 0; col < GRID.COLS; col += 1) {
    ctx.drawImage(wall, WALL_PX + col * CELL_PX, innerBottom, CELL_PX, CELL_PX);
  }

  ctx.drawImage(wall, 0, 0, WALL_PX, WALL_PX);
  ctx.drawImage(wall, WALL_PX + GRID.COLS * CELL_PX, 0, WALL_PX, WALL_PX);
}

function drawBlocks(ctx, board, sprites, effects) {
  const flashing = new Map(
    effects.blockClears.map((clear) => [`${clear.col},${clear.row}`, clear]),
  );

  for (let row = 0; row < GRID.ROWS; row += 1) {
    for (let col = 0; col < GRID.COLS; col += 1) {
      const type = board.cells[row][col];
      if (!type) continue;
      const sprite = sprites[type];
      if (!sprite) continue;

      const { x, y } = boardToCanvas(col, row);
      ctx.drawImage(sprite, x, y, CELL_PX, CELL_PX);

      const clear = flashing.get(`${col},${row}`);
      if (clear && isClearFlashOn(clear.elapsed)) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
        ctx.fillRect(x, y, CELL_PX, CELL_PX);
      }
    }
  }
}

function drawParticles(ctx, effects) {
  for (const particle of effects.particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(
      particle.x - particle.size / 2,
      particle.y - particle.size / 2,
      particle.size,
      particle.size,
    );
  }
  ctx.globalAlpha = 1;
}

function drawPaddle(ctx, sprites, paddle, shake = { offsetY: 0, rotation: 0 }) {
  const left = sprites.Paddle_Left;
  const center = sprites.Paddle_Center;
  const { END_WIDTH, HEIGHT } = PADDLE;
  const centerWidth = paddle.w - END_WIDTH * 2;
  const cx = paddle.x + paddle.w / 2;
  const cy = paddle.y + paddle.h / 2;

  ctx.save();
  ctx.translate(cx, cy + shake.offsetY);
  ctx.rotate(shake.rotation);
  ctx.translate(-paddle.w / 2, -paddle.h / 2);

  ctx.drawImage(left, 0, 0, END_WIDTH, HEIGHT);

  let x = END_WIDTH;
  const centerEnd = END_WIDTH + centerWidth;
  while (x < centerEnd) {
    const tileWidth = Math.min(PADDLE.CENTER_TILE_WIDTH, centerEnd - x);
    ctx.drawImage(center, x, 0, tileWidth, HEIGHT);
    x += tileWidth;
  }

  const rightX = paddle.w - END_WIDTH;
  ctx.save();
  ctx.translate(rightX + END_WIDTH, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(left, 0, 0, END_WIDTH, HEIGHT);
  ctx.restore();

  ctx.restore();
}

function drawBallTrail(ctx, trail) {
  const count = trail.length;
  if (count === 0) return;

  for (let i = 0; i < count; i += 1) {
    const fade = (i + 1) / count;
    const size = BALL.SIZE * fade * 0.9;
    const alpha = fade * 0.4;
    const { x, y } = trail[i];

    ctx.fillStyle = `rgba(${COLORS.BALL_TRAIL}, ${alpha})`;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }
}

function drawBall(ctx, sprites, ball) {
  const sprite = sprites.Ball;
  const half = BALL.SIZE / 2;
  ctx.drawImage(sprite, ball.x - half, ball.y - half, BALL.SIZE, BALL.SIZE);
}

function drawOverlay(ctx, state) {
  const message = OVERLAY_TEXT[state];
  if (!message) return;

  ctx.fillStyle = COLORS.OVERLAY_BG;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = COLORS.TEXT;
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function drawLifeLostPopup(ctx, lifeLost) {
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  const animState = getLifeLostAnimState(lifeLost);

  ctx.fillStyle = COLORS.OVERLAY_BG;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = COLORS.TEXT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 28px monospace';
  ctx.fillText('Life Lost!', cx, cy - 56);

  drawLivesCircles(ctx, cx, cy, animState.filledCount, animState, {
    radius: 14,
    gap: 18,
  });

  ctx.font = '16px monospace';
  ctx.fillStyle = '#8e8e9e';
  ctx.fillText('Lives Remaining', cx, cy + 52);
}

export function render(displayCtx, sprites, board, paddle, ball, state, effects) {
  ensureRenderBuffers();
  const ctx = sceneCtx;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const shakeDuration =
    effects.lifeLost && effects.lifeLost.elapsed < LIFE_LOST.FREEZE_MS
      ? LIFE_LOST.SHAKE_DURATION_MS
      : JUICE.SHAKE.DURATION_MS;

  const shake = getShakeOffset(effects.shakeTimer, {
    amplitude: getActiveShakeAmplitude(effects),
    durationMs: shakeDuration,
  });
  ctx.save();
  ctx.translate(shake.x, shake.y);

  drawEmptyGrid(ctx, sprites);
  drawTopWallRow(ctx, sprites);
  drawWalls(ctx, sprites);
  drawBlocks(ctx, board, sprites, effects);
  drawPaddle(ctx, sprites, paddle, getPaddleHitShake(effects.paddleShake));
  drawBallTrail(ctx, effects.ballTrail);
  drawBall(ctx, sprites, ball);
  drawParticles(ctx, effects);

  ctx.restore();

  applyBloom(displayCtx);

  const redAlpha = getRedFlashAlpha(effects.redFlashTimer);
  if (redAlpha > 0) {
    displayCtx.fillStyle = `rgba(220, 40, 40, ${redAlpha})`;
    displayCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  if (state === GAME_STATE.LIFE_LOST && isLifeLostPopupVisible(effects)) {
    drawLifeLostPopup(displayCtx, effects.lifeLost);
  } else if (state !== GAME_STATE.PLAYING) {
    drawOverlay(displayCtx, state);
  }
}

export function getPaddleY() {
  return PLAYFIELD_BOTTOM - PADDLE.ROWS_FROM_BOTTOM * CELL_PX - PADDLE.HEIGHT;
}

export { boardToCanvas };
