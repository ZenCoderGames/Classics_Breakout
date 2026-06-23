import { BALL, BLOCK_SPEED_BY_TYPE, CELL_PX, GRID, PLAYFIELD_BOTTOM, PLAYFIELD_LEFT, PLAYFIELD_RIGHT, PLAYFIELD_TOP, TOP_WALL_ROWS } from './config.js';
import { normalizeBallSpeed } from './entities.js';
import { boardToCanvas } from './renderer.js';

function resolveWallCollisions(ball) {
  const impacts = [];
  const left = PLAYFIELD_LEFT + ball.r;
  const right = PLAYFIELD_RIGHT - ball.r;
  const top = PLAYFIELD_TOP + TOP_WALL_ROWS * CELL_PX + ball.r;

  if (ball.x < left) {
    ball.x = left;
    ball.vx = Math.abs(ball.vx);
    impacts.push({ x: ball.x, y: ball.y, kind: 'wall' });
  } else if (ball.x > right) {
    ball.x = right;
    ball.vx = -Math.abs(ball.vx);
    impacts.push({ x: ball.x, y: ball.y, kind: 'wall' });
  }

  if (ball.y < top) {
    ball.y = top;
    ball.vy = Math.abs(ball.vy);
    impacts.push({ x: ball.x, y: ball.y, kind: 'wall' });
  }

  return impacts;
}

function circleRectCollision(ball, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(ball.x, rx + rw));
  const closestY = Math.max(ry, Math.min(ball.y, ry + rh));
  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  const distSq = dx * dx + dy * dy;
  return distSq <= ball.r * ball.r;
}

function resolvePaddleCollision(ball, paddle) {
  if (ball.vy <= 0) return null;
  if (!circleRectCollision(ball, paddle.x, paddle.y, paddle.w, paddle.h)) {
    return null;
  }

  const hitOffset = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
  const clamped = Math.max(-1, Math.min(1, hitOffset));
  const maxBounceAngle = Math.PI / 3;
  const angle = clamped * maxBounceAngle;

  ball.vx = Math.sin(angle) * ball.speed;
  ball.vy = -Math.abs(Math.cos(angle) * ball.speed);
  ball.y = paddle.y - ball.r - 0.5;
  normalizeBallSpeed(ball);

  return { x: ball.x, y: paddle.y, kind: 'paddle', hitOffset: clamped };
}

function getBlockCollisions(ball, board, clearingKeys) {
  const hits = [];
  const minCol = Math.max(0, Math.floor((ball.x - ball.r - PLAYFIELD_LEFT) / CELL_PX));
  const maxCol = Math.min(GRID.COLS - 1, Math.floor((ball.x + ball.r - PLAYFIELD_LEFT) / CELL_PX));
  const minRow = Math.max(0, Math.floor((ball.y - ball.r - PLAYFIELD_TOP) / CELL_PX));
  const maxRow = Math.min(GRID.ROWS - 1, Math.floor((ball.y + ball.r - PLAYFIELD_TOP) / CELL_PX));

  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      if (!board.cells[row][col]) continue;
      if (clearingKeys.has(`${col},${row}`)) continue;

      const { x, y } = boardToCanvas(col, row);
      if (circleRectCollision(ball, x, y, CELL_PX, CELL_PX)) {
        hits.push({ col, row, x, y, blockType: board.cells[row][col] });
      }
    }
  }
  return hits;
}

function resolveBlockCollision(ball, block) {
  const cellCenterX = block.x + CELL_PX / 2;
  const cellCenterY = block.y + CELL_PX / 2;
  const dx = ball.x - cellCenterX;
  const dy = ball.y - cellCenterY;

  if (Math.abs(dx / CELL_PX) > Math.abs(dy / CELL_PX)) {
    ball.vx = dx > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
    ball.x = dx > 0 ? block.x + CELL_PX + ball.r : block.x - ball.r;
  } else {
    ball.vy = dy > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
    ball.y = dy > 0 ? block.y + CELL_PX + ball.r : block.y - ball.r;
  }

  ball.speed = BLOCK_SPEED_BY_TYPE[block.blockType] ?? BALL.SPEED;
  normalizeBallSpeed(ball);
}

export function updateCollisions(ball, paddle, board, clearingKeys) {
  const impacts = resolveWallCollisions(ball);

  const paddleImpact = resolvePaddleCollision(ball, paddle);
  if (paddleImpact) {
    impacts.push(paddleImpact);
    return { impacts, fell: false };
  }

  const hits = getBlockCollisions(ball, board, clearingKeys);
  if (hits.length > 0) {
    const block = hits[0];
    resolveBlockCollision(ball, block);
    impacts.push({
      x: ball.x,
      y: ball.y,
      kind: 'block',
      col: block.col,
      row: block.row,
      blockType: block.blockType,
    });
    return { impacts, fell: false };
  }

  const fell = ball.y - ball.r > PLAYFIELD_BOTTOM;
  return { impacts, fell };
}
