import type { DialogueLine } from '../engine/types';
import { getState, isRead } from '../engine/GameState';

const SPEED_KEY = 'mirror-man-speed';
const SPEEDS: Record<string, number> = { slow: 70, medium: 35, fast: 10 };

function getSpeed(): number {
  const v = localStorage.getItem(SPEED_KEY);
  return SPEEDS[v as string] ?? 35;
}

export function getTextSpeed(): string {
  return localStorage.getItem(SPEED_KEY) ?? 'medium';
}

export function setTextSpeed(v: string) {
  if (SPEEDS[v]) localStorage.setItem(SPEED_KEY, v);
}

export class TextBox {
  private el: HTMLDivElement;
  private nameEl: HTMLSpanElement;
  private textEl: HTMLSpanElement;
  private continueHint: HTMLDivElement;
  private resolve: (() => void) | null = null;
  private typingTimer: number | null = null;
  private autoTimer: number | null = null;

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
    this.cancelAuto();

    if (line.character) {
      this.nameEl.textContent = line.character;
      this.nameEl.style.display = 'block';
    } else {
      this.nameEl.style.display = 'none';
    }

    const fullText = line.text;
    this.textEl.textContent = '';
    this.el.classList.add('active');
    this.continueHint.classList.remove('visible');

    let i = 0;
    if (this.typingTimer) clearTimeout(this.typingTimer);

    const typeNext = () => {
      const s = getState().isSkipping ? 5 : getSpeed();
      if (i < fullText.length) {
        this.textEl.textContent += fullText[i];
        i++;
        this.typingTimer = window.setTimeout(typeNext, s);
      } else {
        this.typingTimer = null;
        this.continueHint.classList.add('visible');
        this.checkAutoAdvance();
      }
    };
    this.typingTimer = window.setTimeout(typeNext, getState().isSkipping ? 5 : getSpeed());
  }

  click() {
    this.onClick();
  }

  isActive(): boolean {
    return this.el.classList.contains('active');
  }

  checkAuto() {
    this.checkAutoAdvance();
  }

  cancelAuto() {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  }

  private onClick() {
    this.cancelAuto();
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
      const line = this.textEl.dataset.fullText;
      this.textEl.textContent = line ?? this.textEl.textContent;
      this.continueHint.classList.add('visible');
      this.checkAutoAdvance();
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
    this.cancelAuto();
  }

  private checkAutoAdvance() {
    const state = getState();
    if (!this.resolve || !this.continueHint.classList.contains('visible')) return;

    if (state.isSkipping) {
      const skippable = state.skipMode === 'all' || isRead(state.currentScene, state.dialogueIndex);
      if (skippable) {
        this.autoTimer = window.setTimeout(() => this.onClick(), 120);
      }
    } else if (state.isAuto) {
      this.autoTimer = window.setTimeout(() => this.onClick(), 2000);
    }
  }
}
