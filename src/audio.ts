const SOUND_KEY = 'lunar_cat_cafe_sound';

export function isSoundEnabled(): boolean {
  return localStorage.getItem(SOUND_KEY) !== 'off';
}

export function setSoundEnabled(on: boolean): void {
  localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
}
