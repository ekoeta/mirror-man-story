import type { DialogueLine } from '../engine/types';

export class TextBox {
  private el: HTMLDivElement;
  private nameEl: HTMLSpanElement;
  private textEl: HTMLSpanElement;
  private continueHint: HTMLDivElement;
  private resolve: (() => void) | null = null;
  private typingTimer: number | null = null;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'text-box';
    this.el.addEventListener('click', () => this.onClick());

    this.nameEl = document.createElement('span');
    this.nameEl.id = 'speaker-name';

    this.textEl = document.createElement('span');
    this.textEl.id = 'dialogue-text';

    this.continueHint = document.createElement('div');
    this.continueHint.id = 'continue-hint';
    this.continueHint.textContent = '▼';

    this.el.append(this.nameEl, this.textEl, this.continueHint);
    container.appendChild(this.el);
  }

  show(line: DialogueLine, onComplete: () => void) {
    this.resolve = onComplete;

    if (line.character) {
      this.nameEl.textContent = line.character;
      this.nameEl.style.display = 'block';
    } else {
      this.nameEl.style.display = 'none';
    }

    // 打字机效果
    const fullText = line.text;
    this.textEl.textContent = '';
    this.el.classList.add('active');
    this.continueHint.classList.remove('visible');

    let i = 0;
    const speed = 35; // ms per character
    if (this.typingTimer) clearInterval(this.typingTimer);

    this.typingTimer = window.setInterval(() => {
      if (i < fullText.length) {
        this.textEl.textContent += fullText[i];
        i++;
      } else {
        clearInterval(this.typingTimer!);
        this.typingTimer = null;
        this.continueHint.classList.add('visible');
      }
    }, speed);
  }

  // 供外部调用（点击背景推进对话）
  click() {
    this.onClick();
  }

  isActive(): boolean {
    return this.el.classList.contains('active');
  }

  private onClick() {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
      const line = this.textEl.dataset.fullText;
      this.textEl.textContent = line ?? this.textEl.textContent;
      this.continueHint.classList.add('visible');
      return;
    }
    if (this.resolve && this.continueHint.classList.contains('visible')) {
      this.el.classList.remove('active');
      this.continueHint.classList.remove('visible');
      const cb = this.resolve;
      this.resolve = null;
      cb();
    }
  }

  setFullText(text: string) {
    this.textEl.dataset.fullText = text;
  }

  hide() {
    this.el.classList.remove('active');
  }
}
