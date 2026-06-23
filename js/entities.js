import {
  BALL,
  PADDLE,
  PLAYFIELD_LEFT,
  PLAYFIELD_WIDTH,
} from './config.js';
import { getPaddleY } from './renderer.js';

export function createPaddle() {
  const y = getPaddleY();
  return {
    x: PLAYFIELD_LEFT + (PLAYFIELD_WIDTH - PADDLE.WIDTH) / 2,
    y,
    w: PADDLE.WIDTH,
    h: PADDLE.HEIGHT,
    speed: PADDLE.SPEED,
  };
}

export function createBall(paddle) {
  return {
    x: paddle.x + paddle.w / 2,
    y: paddle.y - BALL.RADIUS - 2,
    vx: 0,
    vy: 0,
    r: BALL.RADIUS,
    speed: BALL.SPEED,
    attached: true,
  };
}

export function resetBallOnPaddle(ball, paddle) {
  ball.x = paddle.x + paddle.w / 2;
  ball.y = paddle.y - ball.r - 2;
  ball.vx = 0;
  ball.vy = 0;
  ball.speed = BALL.SPEED;
  ball.attached = true;
}

export function launchBall(ball) {
  const angle = BALL.LAUNCH_ANGLE;
  ball.vx = Math.cos(angle) * ball.speed;
  ball.vy = Math.sin(angle) * ball.speed;
  if (ball.vy <= 0) {
    ball.vy = Math.abs(ball.vy);
  }
  ball.attached = false;
}

export function clampPaddle(paddle) {
  const minX = PLAYFIELD_LEFT;
  const maxX = PLAYFIELD_LEFT + PLAYFIELD_WIDTH - paddle.w;
  paddle.x = Math.max(minX, Math.min(maxX, paddle.x));
}

export function movePaddle(paddle, direction, dt) {
  paddle.x += direction * paddle.speed * dt;
  clampPaddle(paddle);
}

export function syncBallToPaddle(ball, paddle) {
  if (ball.attached) {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 2;
  }
}

export function moveBall(ball, dt) {
  if (ball.attached) return;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
}

export function normalizeBallSpeed(ball) {
  const mag = Math.hypot(ball.vx, ball.vy);
  if (mag === 0) return;
  ball.vx = (ball.vx / mag) * ball.speed;
  ball.vy = (ball.vy / mag) * ball.speed;
}
