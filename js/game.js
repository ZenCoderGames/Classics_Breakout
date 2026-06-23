import { createBoard, remainingBlocks, resetBoard } from './board.js';
import { updateCollisions } from './collision.js';
import { GAME_STATE, LIVES, PLAYFIELD_LEFT, PLAYFIELD_WIDTH } from './config.js';
import {
  createEffects,
  resetEffects,
  triggerImpact,
  updateBallTrail,
  unlockAudio,
  updateEffects,
} from './effects.js';
import {
  createBall,
  createPaddle,
  launchBall,
  moveBall,
  movePaddle,
  resetBallOnPaddle,
  syncBallToPaddle,
} from './entities.js';
import { render } from './renderer.js';

export function createGame(canvas, sprites, input) {
  const ctx = canvas.getContext('2d');
  const board = createBoard();
  resetBoard(board);

  const paddle = createPaddle();
  const ball = createBall(paddle);
  const effects = createEffects();
  let state = GAME_STATE.READY;
  let lives = LIVES.START;
  let lastTime = 0;

  function restart() {
    resetBoard(board);
    resetEffects(effects);
    lives = LIVES.START;
    paddle.x = PLAYFIELD_LEFT + (PLAYFIELD_WIDTH - paddle.w) / 2;
    resetBallOnPaddle(ball, paddle);
    state = GAME_STATE.READY;
  }

  function respawnBall() {
    resetEffects(effects);
    resetBallOnPaddle(ball, paddle);
    state = GAME_STATE.READY;
  }

  function tryLaunch() {
    if (state !== GAME_STATE.READY) return;
    unlockAudio();
    launchBall(ball);
    state = GAME_STATE.PLAYING;
  }

  function update(dt) {
    updateEffects(effects, board, dt);

    if (state === GAME_STATE.VICTORY || state === GAME_STATE.GAME_OVER) {
      if (input.consumeRestart() || input.consumeClickLaunch()) {
        unlockAudio();
        restart();
      }
      return;
    }

    const direction = input.getPaddleDirection();
    const pointerX = input.getPointerX();

    if (direction !== 0) {
      movePaddle(paddle, direction, dt);
    } else if (pointerX !== null) {
      paddle.x = pointerX - paddle.w / 2;
      paddle.x = Math.max(
        PLAYFIELD_LEFT,
        Math.min(PLAYFIELD_LEFT + PLAYFIELD_WIDTH - paddle.w, paddle.x),
      );
    }

    if (state === GAME_STATE.READY) {
      syncBallToPaddle(ball, paddle);
      updateBallTrail(effects, ball);
      if (input.consumeLaunch() || input.consumeClickLaunch()) {
        tryLaunch();
      }
      return;
    }

    if (state !== GAME_STATE.PLAYING) return;

    moveBall(ball, dt);
    updateBallTrail(effects, ball);
    const result = updateCollisions(ball, paddle, board, effects.clearingKeys);

    for (const impact of result.impacts) {
      triggerImpact(effects, impact);
    }

    if (result.fell) {
      lives -= 1;
      if (lives > 0) {
        respawnBall();
      } else {
        state = GAME_STATE.GAME_OVER;
      }
      return;
    }

    if (remainingBlocks(board) === 0 && effects.blockClears.length === 0) {
      state = GAME_STATE.VICTORY;
    }
  }

  function draw() {
    render(ctx, sprites, board, paddle, ball, state, effects, lives);
  }

  function frame(time) {
    const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  return {
    start() {
      requestAnimationFrame(frame);
    },
  };
}
