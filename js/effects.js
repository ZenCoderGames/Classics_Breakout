import { BLOCK_TINTS, COLORS, JUICE, BALL, PADDLE } from './config.js';
import { clearCell } from './board.js';

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

export function playDestroyPing(step = 0) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const frequency = 360 * 1.075 ** step;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, now);
  osc.frequency.exponentialRampToValueAtTime(frequency * 1.18, now + 0.05);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

function connectEnvelope(source, ctx, now, peak, duration) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  return gain;
}

export function playWallHit() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const { GAIN, DURATION } = JUICE.SFX.WALL;
  const master = ctx.createGain();
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(1400, now);
  lowpass.Q.setValueAtTime(0.8, now);
  lowpass.connect(master);
  master.gain.setValueAtTime(0.85, now);
  master.connect(ctx.destination);

  const partials = [
    { freq: 520, type: 'sine', gain: GAIN * 0.9 },
    { freq: 880, type: 'triangle', gain: GAIN * 0.45 },
    { freq: 1180, type: 'sine', gain: GAIN * 0.2 },
  ];

  for (const partial of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = partial.type;
    osc.frequency.setValueAtTime(partial.freq, now);
    osc.frequency.exponentialRampToValueAtTime(partial.freq * 0.9, now + DURATION * 0.7);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(partial.gain, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + DURATION);
    osc.connect(gain);
    gain.connect(lowpass);
    osc.start(now);
    osc.stop(now + DURATION + 0.02);
  }

  const bufferSize = Math.floor(ctx.sampleRate * 0.02);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(900, now);
  noiseFilter.Q.setValueAtTime(0.6, now);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(GAIN * 0.12, now + 0.003);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(lowpass);
  noise.start(now);
  noise.stop(now + 0.04);
}

export function playPaddleHit() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const { GAIN, DURATION } = JUICE.SFX.PADDLE;

  const body = ctx.createOscillator();
  body.type = 'sine';
  body.frequency.setValueAtTime(320, now);
  body.frequency.exponentialRampToValueAtTime(140, now + DURATION);
  connectEnvelope(body, ctx, now, GAIN, DURATION);
  body.start(now);
  body.stop(now + DURATION + 0.02);

  const knock = ctx.createOscillator();
  knock.type = 'triangle';
  knock.frequency.setValueAtTime(180, now);
  knock.frequency.exponentialRampToValueAtTime(90, now + DURATION * 0.7);
  connectEnvelope(knock, ctx, now, GAIN * 0.7, DURATION * 0.85);
  knock.start(now);
  knock.stop(now + DURATION + 0.02);

  const bufferSize = Math.floor(ctx.sampleRate * 0.04);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(900, now);
  lowpass.Q.setValueAtTime(0.7, now);
  noise.connect(lowpass);
  connectEnvelope(lowpass, ctx, now, GAIN * 0.45, DURATION * 0.6);
  noise.start(now);
  noise.stop(now + DURATION);
}

function particleColor(kind, blockType) {
  if (kind === 'block') {
    return BLOCK_TINTS[blockType] ?? '#aaa';
  }
  if (kind === 'paddle') {
    return COLORS.PARTICLE_PADDLE;
  }
  return COLORS.PARTICLE_WALL;
}

export function createEffects() {
  return {
    blockClears: [],
    clearingKeys: new Set(),
    particles: [],
    ballTrail: [],
    shakeTimer: 0,
    paddleShake: { timer: 0, hitOffset: 0 },
    destroyPingStep: 0,
  };
}

export function resetEffects(effects) {
  effects.blockClears = [];
  effects.clearingKeys.clear();
  effects.particles = [];
  effects.ballTrail = [];
  effects.shakeTimer = 0;
  effects.paddleShake = { timer: 0, hitOffset: 0 };
  effects.destroyPingStep = 0;
}

export function updateBallTrail(effects, ball) {
  if (ball.attached) {
    effects.ballTrail = [];
    return;
  }

  effects.ballTrail.push({ x: ball.x, y: ball.y });
  while (effects.ballTrail.length > BALL.TRAIL_LENGTH) {
    effects.ballTrail.shift();
  }
}

export function queueBlockClear(effects, col, row, type) {
  const key = `${col},${row}`;
  if (effects.clearingKeys.has(key)) return false;

  effects.clearingKeys.add(key);
  effects.blockClears.push({ col, row, type, elapsed: 0 });
  effects.shakeTimer = JUICE.SHAKE.DURATION_MS;
  return true;
}

export function spawnImpactParticles(effects, x, y, kind, blockType = null) {
  const color = particleColor(kind, blockType);
  const { COUNT, SPEED, LIFE_MS, SIZE } = JUICE.PARTICLES;

  for (let i = 0; i < COUNT; i += 1) {
    const angle = (Math.PI * 2 * i) / COUNT + Math.random() * 0.4;
    const speed = SPEED * (0.55 + Math.random() * 0.65);
    effects.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: LIFE_MS,
      maxLife: LIFE_MS,
      color,
      size: SIZE,
    });
  }
}

export function triggerPaddleShake(effects, hitOffset) {
  effects.paddleShake = {
    timer: PADDLE.HIT_SHAKE.DURATION_MS,
    hitOffset: Math.max(-1, Math.min(1, hitOffset)),
  };
}

export function triggerImpact(effects, impact) {
  spawnImpactParticles(effects, impact.x, impact.y, impact.kind, impact.blockType ?? null);

  if (impact.kind === 'wall') {
    playWallHit();
  } else if (impact.kind === 'paddle') {
    playPaddleHit();
    effects.destroyPingStep = 0;
    triggerPaddleShake(effects, impact.hitOffset ?? 0);
  } else if (impact.kind === 'block') {
    queueBlockClear(effects, impact.col, impact.row, impact.blockType);
  }
}

export function updateEffects(effects, board, dt) {
  const dtMs = dt * 1000;

  if (effects.shakeTimer > 0) {
    effects.shakeTimer = Math.max(0, effects.shakeTimer - dtMs);
  }

  if (effects.paddleShake.timer > 0) {
    effects.paddleShake.timer = Math.max(0, effects.paddleShake.timer - dtMs);
  }

  effects.particles = effects.particles.filter((particle) => {
    particle.life -= dtMs;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 180 * dt;
    return particle.life > 0;
  });

  const { FLASH_MS, REMOVE_DELAY_MS } = JUICE.BLOCK_CLEAR;
  const removeAt = FLASH_MS + REMOVE_DELAY_MS;

  effects.blockClears = effects.blockClears.filter((clear) => {
    clear.elapsed += dtMs;
    if (clear.elapsed >= removeAt) {
      clearCell(board, clear.col, clear.row);
      effects.clearingKeys.delete(`${clear.col},${clear.row}`);
      playDestroyPing(effects.destroyPingStep);
      effects.destroyPingStep += 1;
      return false;
    }
    return true;
  });
}

export function isClearFlashOn(elapsed) {
  const { FLASH_MS, FLASH_INTERVAL_MS } = JUICE.BLOCK_CLEAR;
  return (
    elapsed < FLASH_MS &&
    Math.floor(elapsed / FLASH_INTERVAL_MS) % 2 === 0
  );
}

export function getPaddleHitShake(paddleShake) {
  if (!paddleShake?.timer || paddleShake.timer <= 0) {
    return { offsetY: 0, rotation: 0 };
  }

  const { DURATION_MS, AMPLITUDE_PX, MAX_ROTATION_RAD } = PADDLE.HIT_SHAKE;
  const progress = 1 - paddleShake.timer / DURATION_MS;
  const decay = 1 - progress;
  const hitOffset = paddleShake.hitOffset ?? 0;

  return {
    offsetY: AMPLITUDE_PX * decay,
    rotation: hitOffset * MAX_ROTATION_RAD * decay,
  };
}

export function getShakeOffset(shakeTimer) {
  if (shakeTimer <= 0) {
    return { x: 0, y: 0 };
  }

  const { DURATION_MS, AMPLITUDE } = JUICE.SHAKE;
  const progress = 1 - shakeTimer / DURATION_MS;
  const amplitude = AMPLITUDE * (1 - progress);
  const t = DURATION_MS - shakeTimer;

  return {
    x: Math.sin(t * 0.085) * amplitude,
    y: Math.cos(t * 0.11) * amplitude * 0.55,
  };
}
