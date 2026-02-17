export class InputManager {
  public keys = { w: false, a: false, s: false, d: false, space: false };
  public mouse = { x: 0, y: 0, down: false };
  
  private domElement: HTMLElement;
  private onClickCallback: ((e: MouseEvent) => void) | null = null;
  private onMouseMoveCallback: ((dx: number, dy: number) => void) | null = null;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.init();
  }

  private init() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  public dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
  }

  public setClickCallback(callback: (e: MouseEvent) => void) {
    this.onClickCallback = callback;
  }

  public setMouseMoveCallback(callback: (dx: number, dy: number) => void) {
    this.onMouseMoveCallback = callback;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
        case 'w': this.keys.w = true; break;
        case 'a': this.keys.a = true; break;
        case 's': this.keys.s = true; break;
        case 'd': this.keys.d = true; break;
        case ' ': this.keys.space = true; break;
    }
  }

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
        case 'w': this.keys.w = false; break;
        case 'a': this.keys.a = false; break;
        case 's': this.keys.s = false; break;
        case 'd': this.keys.d = false; break;
        case ' ': this.keys.space = false; break;
    }
  }

  private onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { 
          this.mouse.down = true;
          this.mouse.x = e.clientX;
          this.mouse.y = e.clientY;
          if (this.onClickCallback) this.onClickCallback(e);
      }
  }

  private onMouseMove = (e: MouseEvent) => {
      if (this.mouse.down) {
          const deltaX = e.clientX - this.mouse.x;
          const deltaY = e.clientY - this.mouse.y;
          
          this.mouse.x = e.clientX;
          this.mouse.y = e.clientY;

          if (this.onMouseMoveCallback) {
              this.onMouseMoveCallback(deltaX, deltaY);
          }
      }
  }

  private onMouseUp = () => {
      this.mouse.down = false;
  }

  private onContextMenu = (e: Event) => e.preventDefault();
}