export class Background {
  private container: HTMLElement;
  private bgEl: HTMLDivElement;
  private vignetteEl: HTMLDivElement;
  private currentBg: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    this.bgEl = document.createElement('div');
    this.bgEl.id = 'background';
    this.bgEl.style.position = 'absolute';
    this.bgEl.style.top = '0';
    this.bgEl.style.left = '0';
    this.bgEl.style.right = '0';
    this.bgEl.style.bottom = '0';
    this.bgEl.style.zIndex = '0';
    this.bgEl.style.transition = 'background 0.8s ease, background-image 0.8s ease';

    // 暗角遮罩
    this.vignetteEl = document.createElement('div');
    this.vignetteEl.id = 'vignette';
    this.vignetteEl.style.cssText =
      'position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;' +
      'background:radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.45) 100%);' +
      'pointer-events:none;';

    this.bgEl.appendChild(this.vignetteEl);
    container.prepend(this.bgEl);
  }

  set(bg: string | undefined) {
    if (!bg || bg === this.currentBg) return;
    this.currentBg = bg;

    this.bgEl.classList.remove('bg-ambient');

    if (bg.startsWith('#')) {
      this.bgEl.style.background = bg;
      this.bgEl.style.backgroundImage = '';
    } else if (bg.startsWith('radial-') || bg.startsWith('linear-')) {
      // 原生 CSS 渐变（不加 gradient: 前缀）
      this.bgEl.style.background = '';
      this.bgEl.style.backgroundImage = bg;
    } else if (bg.startsWith('gradient:')) {
      this.bgEl.style.background = '';
      this.bgEl.style.backgroundImage = bg.replace('gradient:', '');
    } else if (bg === 'ambient' || bg.startsWith('ambient:')) {
      // 动态氛围背景：缓慢色相变化
      const hue = bg.startsWith('ambient:') ? parseInt(bg.split(':')[1]) : 220;
      this.bgEl.style.background = `hsl(${hue}, 40%, 8%)`;
      this.bgEl.style.backgroundImage = `
        radial-gradient(ellipse at 30% 70%, hsl(${hue}, 50%, 12%) 0%, transparent 60%),
        radial-gradient(ellipse at 70% 30%, hsl(${hue + 30}, 30%, 15%) 0%, transparent 60%)
      `;
      this.bgEl.classList.add('bg-ambient');
    } else {
      // 图片路径
      this.bgEl.style.background = '';
      this.bgEl.style.backgroundImage = `url(${bg})`;
    }
    this.bgEl.style.backgroundSize = 'cover';
    this.bgEl.style.backgroundPosition = 'center';
  }

  flash(color: string = '#ffffff', duration: number = 200) {
    const flash = document.createElement('div');
    flash.style.cssText =
      `position:absolute;top:0;left:0;right:0;bottom:0;z-index:2;` +
      `background:${color};opacity:0.6;pointer-events:none;transition:opacity ${duration}ms ease;`;
    this.container.appendChild(flash);
    requestAnimationFrame(() => {
      flash.style.opacity = '0';
      flash.addEventListener('transitionend', () => flash.remove());
    });
  }

  reset() {
    this.currentBg = null;
    this.bgEl.style.background = '';
    this.bgEl.style.backgroundImage = '';
    this.bgEl.classList.remove('bg-ambient');
  }
}
