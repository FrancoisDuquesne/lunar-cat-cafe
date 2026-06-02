class TouchControls {
  dx = 0;
  dy = 0;

  private interactCallbacks: Array<() => void> = [];
  private joystickBase!: HTMLElement;
  private joystickKnob!: HTMLElement;
  private activeTouchId: number | null = null;
  private readonly RADIUS = 46;

  addInteractListener(cb: () => void): void {
    this.interactCallbacks.push(cb);
  }

  init(): void {
    this.joystickBase = document.getElementById('joy-base')!;
    this.joystickKnob = document.getElementById('joy-knob')!;
    const interactBtn = document.getElementById('btn-interact')!;

    // Capture starts only on the base circle — the zone div is pointer-events:none
    // so it doesn't block taps on the game canvas behind it.
    // Move/end are tracked on document so the finger can roam outside the base.
    this.joystickBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.activeTouchId !== null) return;
      const t = e.changedTouches[0];
      this.activeTouchId = t.identifier;
      this.updateJoystick(t.clientX, t.clientY);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (this.activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this.activeTouchId) {
          e.preventDefault();
          this.updateJoystick(t.clientX, t.clientY);
          break;
        }
      }
    }, { passive: false });

    const endJoy = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.activeTouchId) {
          this.activeTouchId = null;
          this.dx = 0;
          this.dy = 0;
          this.joystickKnob.style.transform = 'translate(-50%, -50%)';
          break;
        }
      }
    };
    document.addEventListener('touchend', endJoy);
    document.addEventListener('touchcancel', endJoy);

    interactBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.interactCallbacks.forEach(cb => cb());
    }, { passive: false });
  }

  private updateJoystick(clientX: number, clientY: number): void {
    const rect = this.joystickBase.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const rawDx = clientX - cx;
    const rawDy = clientY - cy;
    const dist  = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
    const nx = dist > 0 ? rawDx / dist : 0;
    const ny = dist > 0 ? rawDy / dist : 0;
    const clamped = Math.min(dist, this.RADIUS);
    this.dx = (clamped / this.RADIUS) * nx;
    this.dy = (clamped / this.RADIUS) * ny;
    this.joystickKnob.style.transform =
      `translate(calc(-50% + ${nx * clamped}px), calc(-50% + ${ny * clamped}px))`;
  }
}

export const touchControls = new TouchControls();
