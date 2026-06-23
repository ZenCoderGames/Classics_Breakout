import { INPUT_KEYS, INPUT_MODE } from './config.js';

const ARROW_LEFT = 'ArrowLeft';
const ARROW_RIGHT = 'ArrowRight';

function isLeft(key, code) {
  return INPUT_KEYS.LEFT.includes(key) || code === ARROW_LEFT;
}

function isRight(key, code) {
  return INPUT_KEYS.RIGHT.includes(key) || code === ARROW_RIGHT;
}

function isLaunch(key) {
  return INPUT_KEYS.LAUNCH.includes(key);
}

function isRestart(key) {
  return INPUT_KEYS.RESTART.includes(key);
}

function isPaddleKey(key, code) {
  return isLeft(key, code) || isRight(key, code);
}

export function createInput(canvas) {
  const keys = new Set();
  let mode = null;
  let pointerX = null;
  let clickLaunch = false;

  function setPointerX(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointerX = ((clientX - rect.left) / rect.width) * canvas.width;
  }

  function onKeyDown(e) {
    if (isPaddleKey(e.key, e.code)) {
      mode = INPUT_MODE.KEYBOARD;
      e.preventDefault();
    } else if (isLaunch(e.key) || isRestart(e.key)) {
      e.preventDefault();
    }
    keys.add(e.key);
    if (e.code) keys.add(e.code);
  }

  function onKeyUp(e) {
    keys.delete(e.key);
    if (e.code) keys.delete(e.code);
  }

  function isLeftPressed() {
    return INPUT_KEYS.LEFT.some((k) => keys.has(k)) || keys.has(ARROW_LEFT);
  }

  function isRightPressed() {
    return INPUT_KEYS.RIGHT.some((k) => keys.has(k)) || keys.has(ARROW_RIGHT);
  }

  function getPaddleDirection() {
    if (mode === INPUT_MODE.POINTER) return 0;

    const left = isLeftPressed();
    const right = isRightPressed();
    if (left && !right) return -1;
    if (right && !left) return 1;
    return 0;
  }

  function consumeLaunch() {
    const pressed = INPUT_KEYS.LAUNCH.some((k) => keys.has(k));
    if (pressed) {
      INPUT_KEYS.LAUNCH.forEach((k) => keys.delete(k));
      return true;
    }
    return false;
  }

  function consumeRestart() {
    const pressed = INPUT_KEYS.RESTART.some((k) => keys.has(k));
    if (pressed) {
      INPUT_KEYS.RESTART.forEach((k) => keys.delete(k));
      return true;
    }
    return false;
  }

  function onPointerDown(e) {
    mode = INPUT_MODE.POINTER;
    setPointerX(e.clientX, e.clientY);
    clickLaunch = true;
    canvas.focus();
  }

  function onPointerMove(e) {
    mode = INPUT_MODE.POINTER;
    setPointerX(e.clientX, e.clientY);
  }

  function consumeClickLaunch() {
    if (clickLaunch) {
      clickLaunch = false;
      return true;
    }
    return false;
  }

  function getPointerX() {
    if (mode === INPUT_MODE.KEYBOARD) return null;
    return pointerX;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);

  return {
    getPaddleDirection,
    consumeLaunch,
    consumeRestart,
    consumeClickLaunch,
    getPointerX,
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
    },
  };
}
