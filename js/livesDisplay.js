import { COLORS, LIFE_LOST, LIVES } from './config.js';

export const LIVES_CIRCLE = {
  MAX: LIVES.START,
  RADIUS: 9,
  GAP: 14,
  STROKE_WIDTH: 2,
  DOM_SIZE: 18,
  DOM_GAP: 10,
};

export function getLifeLostAnimState(lifeLost) {
  const popupElapsed = lifeLost.elapsed - LIFE_LOST.FREEZE_MS;
  const { previousLives, remainingLives } = lifeLost;
  const { POPUP_HOLD_MS, POPUP_ANIM_MS } = LIFE_LOST;

  if (popupElapsed < POPUP_HOLD_MS) {
    return {
      filledCount: previousLives,
      animatingIndex: -1,
      animProgress: 0,
    };
  }

  if (popupElapsed < POPUP_HOLD_MS + POPUP_ANIM_MS) {
    return {
      filledCount: previousLives,
      animatingIndex: remainingLives,
      animProgress: (popupElapsed - POPUP_HOLD_MS) / POPUP_ANIM_MS,
    };
  }

  return {
    filledCount: remainingLives,
    animatingIndex: -1,
    animProgress: 1,
  };
}

function getCircleState(index, filledCount, animatingIndex, animProgress) {
  if (animatingIndex >= 0 && animProgress < 1) {
    if (index < animatingIndex) {
      return { mode: 'filled', progress: 0 };
    }
    if (index === animatingIndex) {
      if (animProgress === 0) {
        return { mode: 'filled', progress: 0 };
      }
      return { mode: 'animating', progress: animProgress };
    }
    return { mode: 'empty', progress: 0 };
  }

  if (index < filledCount) {
    return { mode: 'filled', progress: 0 };
  }

  return { mode: 'empty', progress: 0 };
}

function drawSingleCircle(ctx, x, y, state, options = {}) {
  const radius = options.radius ?? LIVES_CIRCLE.RADIUS;
  const strokeWidth = options.strokeWidth ?? LIVES_CIRCLE.STROKE_WIDTH;
  const filledColor = options.filledColor ?? COLORS.TEXT;
  const emptyStroke = options.emptyStroke ?? '#8e8e9e';

  ctx.save();

  if (state.mode === 'animating') {
    const scale = 1 + Math.sin(state.progress * Math.PI) * 0.18;
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);
  }

  ctx.lineWidth = strokeWidth;

  if (state.mode === 'filled') {
    ctx.fillStyle = filledColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = filledColor;
    ctx.stroke();
  } else if (state.mode === 'animating') {
    const fillAlpha = 1 - state.progress;
    ctx.fillStyle = `rgba(255, 255, 255, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(fillAlpha, 0.35)})`;
    ctx.stroke();
  } else {
    ctx.fillStyle = 'transparent';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = emptyStroke;
    ctx.stroke();
  }

  ctx.restore();
}

export function drawLivesCircles(ctx, centerX, centerY, filledCount, animState = null, options = {}) {
  const max = options.max ?? LIVES_CIRCLE.MAX;
  const radius = options.radius ?? LIVES_CIRCLE.RADIUS;
  const gap = options.gap ?? LIVES_CIRCLE.GAP;
  const animatingIndex = animState?.animatingIndex ?? -1;
  const animProgress = animState?.animProgress ?? 0;
  const step = radius * 2 + gap;
  const startX = centerX - ((max - 1) * step) / 2;

  for (let i = 0; i < max; i += 1) {
    const x = startX + i * step;
    const state = getCircleState(i, filledCount, animatingIndex, animProgress);
    drawSingleCircle(ctx, x, centerY, state, options);
  }
}

function ensureDomCircles(container, max) {
  while (container.children.length < max) {
    const circle = document.createElement('span');
    circle.className = 'life-circle';
    circle.setAttribute('aria-hidden', 'true');
    container.appendChild(circle);
  }
  while (container.children.length > max) {
    container.removeChild(container.lastChild);
  }
}

export function setDomLivesCircles(container, filledCount, animState = null) {
  const max = LIVES_CIRCLE.MAX;
  const animatingIndex = animState?.animatingIndex ?? -1;
  const animProgress = animState?.animProgress ?? 0;

  ensureDomCircles(container, max);

  for (let i = 0; i < max; i += 1) {
    const circle = container.children[i];
    const state = getCircleState(i, filledCount, animatingIndex, animProgress);
    const isAnimating = state.mode === 'animating';

    circle.classList.toggle('filled', state.mode === 'filled');
    circle.classList.toggle('empty', state.mode === 'empty');
    circle.classList.toggle('animating', isAnimating);

    if (isAnimating) {
      const scale = 1 + Math.sin(state.progress * Math.PI) * 0.18;
      const fillAlpha = 1 - state.progress;
      circle.style.transform = `scale(${scale})`;
      circle.style.background = `rgba(255, 255, 255, ${fillAlpha})`;
      circle.style.borderColor = `rgba(255, 255, 255, ${Math.max(fillAlpha, 0.35)})`;
      circle.style.boxShadow = fillAlpha > 0.2 ? '0 0 8px rgba(255, 255, 255, 0.35)' : 'none';
    } else {
      circle.style.removeProperty('transform');
      circle.style.removeProperty('background');
      circle.style.removeProperty('border-color');
      circle.style.removeProperty('box-shadow');
    }
  }
}
