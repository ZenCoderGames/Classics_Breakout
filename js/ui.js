import { setDomLivesCircles } from './livesDisplay.js';

export function createHud({ scoreEl, livesEl }) {
  function update(score, lives) {
    scoreEl.textContent = String(score);
    setDomLivesCircles(livesEl, lives);
  }

  function updateLivesAnim(animState) {
    setDomLivesCircles(livesEl, animState.filledCount, animState);
  }

  return { update, updateLivesAnim };
}
