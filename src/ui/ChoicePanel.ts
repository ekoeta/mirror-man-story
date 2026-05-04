import type { Choice } from '../engine/types';

export class ChoicePanel {
  private el: HTMLDivElement;
  private resolve: ((c: Choice) => void) | null = null;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'choice-panel';
    container.appendChild(this.el);
  }

  show(choices: Choice[], onSelect: (c: Choice) => void) {
    this.resolve = onSelect;
    this.el.innerHTML = '';
    this.el.classList.add('active');

    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice.text;
      btn.addEventListener('click', () => {
        if (this.resolve) {
          const cb = this.resolve;
          this.resolve = null;
          this.hide();
          cb(choice);
        }
      });
      this.el.appendChild(btn);
    });
  }

  hide() {
    this.el.classList.remove('active');
    this.el.innerHTML = '';
  }
}
