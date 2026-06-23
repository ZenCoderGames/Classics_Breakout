import { AUDIO_PATH, MUSIC } from './config.js';

let music = null;
let started = false;

export function loadMusic() {
  music = new Audio(`${AUDIO_PATH}${MUSIC.FILE}`);
  music.loop = true;
  music.preload = 'auto';
  music.volume = MUSIC.VOLUME;

  return new Promise((resolve, reject) => {
    music.addEventListener(
      'canplaythrough',
      () => resolve(),
      { once: true },
    );
    music.addEventListener(
      'error',
      () => reject(new Error(`Failed to load music: ${MUSIC.FILE}`)),
      { once: true },
    );
  });
}

export function startMusic() {
  if (!music || started) return;

  const playPromise = music.play();
  if (playPromise) {
    playPromise
      .then(() => {
        started = true;
      })
      .catch(() => {});
  }
}

export function stopMusic() {
  if (!music) return;
  music.pause();
  music.currentTime = 0;
  started = false;
}
