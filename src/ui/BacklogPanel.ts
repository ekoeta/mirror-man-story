import type { DialogueLine } from '../engine/types';

export class BacklogPanel {
  private el: HTMLDivElement;
  private listEl: HTMLDivElement;
  private dismissHint: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'backlog';

    this.listEl = document.createElement('div');
    this.listEl.id = 'backlog-list';

    this.dismissHint = document.createElement('div');
    this.dismissHint.id = 'backlog-hint';
    this.dismissHint.textContent = '点击任意处或按 Esc 关闭';

    this.el.append(this.listEl, this.dismissHint);
    this.el.addEventListener('click', (e) => { e.stopPropagation(); this.hide(); });
    container.appendChild(this.el);
  }

  show(history: DialogueLine[]): void {
    this.listEl.innerHTML = history.map((line, i) => {
      const name = line.character
        ? `<span class="backlog-name">${line.character}</span>`
        : '';
      return `<div class="backlog-line ${i === history.length - 1 ? 'backlog-latest' : ''}">
        ${name}
        <span class="backlog-text">${line.text}</span>
      </div>`;
    }).join('');

    this.el.classList.add('active');
    requestAnimationFrame(() => {
      this.listEl.scrollTop = this.listEl.scrollHeight;
    });
  }

  hide(): void {
    this.el.classList.remove('active');
  }

  isVisible(): boolean {
    return this.el.classList.contains('active');
  }
}
