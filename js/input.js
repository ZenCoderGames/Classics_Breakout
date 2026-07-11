import { DEBUG, INPUT_KEYS, INPUT_MODE } from './config.js';

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
  let touchLeft = false;
  let touchRight = false;
  let touchLaunch = false;

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
    return touchLeft || INPUT_KEYS.LEFT.some((k) => keys.has(k)) || keys.has(ARROW_LEFT);
  }

  function isRightPressed() {
    return touchRight || INPUT_KEYS.RIGHT.some((k) => keys.has(k)) || keys.has(ARROW_RIGHT);
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
    if (touchLaunch) {
      touchLaunch = false;
      return true;
    }
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

  function setInput(name, down) {
    if (name === 'left') {
      touchLeft = down;
      if (down) {
        mode = INPUT_MODE.KEYBOARD;
        pointerX = null;
      }
    } else if (name === 'right') {
      touchRight = down;
      if (down) {
        mode = INPUT_MODE.KEYBOARD;
        pointerX = null;
      }
    }
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
    setInput,
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
    },
  };
}

export function bindMobileControls(input, { onPointerDown } = {}) {
  const controls = document.getElementById('mobile-controls');
  if (!controls) return;

  const setPressed = (btn, pressed) => {
    btn.classList.toggle('is-pressed', pressed);
  };

  const onDown = (btn, name) => {
    input.setInput(name, true);
    setPressed(btn, true);
    onPointerDown?.();
  };

  const onUp = (btn, name) => {
    input.setInput(name, false);
    setPressed(btn, false);
  };

  for (const btn of controls.querySelectorAll('[data-input]')) {
    const name = btn.dataset.input;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      onDown(btn, name);
    });
    const release = () => onUp(btn, name);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', (e) => {
      if (!btn.hasPointerCapture(e.pointerId)) release();
    });
  }
}

export function applyMobileControlsDebug() {
  if (DEBUG.showMobileControls) {
    document.body.classList.add('debug-mobile-controls');
  }
}
