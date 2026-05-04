import type { SpriteConfig } from '../engine/types';

interface SpriteState {
  character: string;
  position: 'left' | 'center' | 'right';
  expression: string;
  visible: boolean;
  dimmed: boolean;
}

export class SpriteDisplay {
  private container: HTMLDivElement;
  private sprites: Map<string, SpriteState> = new Map();
  private elMap: Map<string, HTMLDivElement> = new Map();

  // 角色占位颜色
  private colors: Record<string, string> = {
    '苏鹤': '#4a6fa5',
    '沈姐': '#c0844a',
    '周其深': '#7b5ea7',
    '保安': '#5a7a5a',
    '林萧': '#4a7a8a',
  };

  constructor(container: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'sprite-layer';
    container.appendChild(this.container);
  }

  apply(configs: SpriteConfig[]) {
    // 标记所有现有 sprite 为待移除
    const toRemove = new Set(this.elMap.keys());

    configs.forEach(cfg => {
      toRemove.delete(cfg.character);
      const existing = this.sprites.get(cfg.character);

      if (existing) {
        // 更新位置或表情
        if (existing.position !== cfg.position || existing.expression !== (cfg.expression || 'default')) {
          existing.position = cfg.position;
          existing.expression = cfg.expression || 'default';
          this.updateEl(existing);
        }
        existing.visible = true;
      } else {
        // 新建
        const state: SpriteState = {
          character: cfg.character,
          position: cfg.position,
          expression: cfg.expression || 'default',
          visible: true,
          dimmed: false,
        };
        this.sprites.set(cfg.character, state);
        this.createEl(state);
      }
    });

    // 移除不在新配置中的 sprites
    toRemove.forEach(name => {
      const el = this.elMap.get(name);
      if (el) {
        el.classList.add('sprite-out');
        el.addEventListener('transitionend', () => el.remove());
        this.elMap.delete(name);
        this.sprites.delete(name);
      }
    });
  }

  // 单角色动作：show/hide/dim
  act(character: string, action: 'show' | 'hide' | 'dim', position?: string, expression?: string) {
    if (action === 'hide') {
      const el = this.elMap.get(character);
      if (el) {
        el.classList.add('sprite-out');
        el.addEventListener('transitionend', () => el.remove());
        this.elMap.delete(character);
        this.sprites.delete(character);
      }
      return;
    }

    if (action === 'dim') {
      const state = this.sprites.get(character);
      if (state) {
        state.dimmed = true;
        this.updateEl(state);
      }
      return;
    }

    // show
    const pos = (position as 'left' | 'center' | 'right') || 'center';
    const state: SpriteState = {
      character,
      position: pos,
      expression: expression || 'default',
      visible: true,
      dimmed: false,
    };
    const existing = this.sprites.get(character);
    if (existing) {
      existing.position = pos;
      existing.expression = expression || 'default';
      existing.dimmed = false;
      existing.visible = true;
      this.updateEl(existing);
    } else {
      this.sprites.set(character, state);
      this.createEl(state);
    }
  }

  // 高亮某个角色（说话时），其余角色变暗
  highlight(character?: string) {
    this.sprites.forEach((state, name) => {
      state.dimmed = !!(character && name !== character);
      const el = this.elMap.get(name);
      if (el) {
        el.classList.toggle('sprite-dim', state.dimmed);
      }
    });
  }

  clear() {
    this.elMap.forEach(el => {
      el.classList.add('sprite-out');
    });
    this.elMap.clear();
    this.sprites.clear();
  }

  private createEl(state: SpriteState) {
    const el = document.createElement('div');
    el.className = `sprite sprite-${state.position}`;
    el.style.setProperty('--sprite-color', this.colors[state.character] || '#555');
    el.innerHTML = `
      <div class="sprite-card">
        <div class="sprite-avatar">${state.character[0]}</div>
        <span class="sprite-name">${state.character}</span>
      </div>
    `;
    this.container.appendChild(el);
    this.elMap.set(state.character, el);
    // 触发入场动画
    requestAnimationFrame(() => el.classList.add('sprite-in'));
  }

  private updateEl(state: SpriteState) {
    const el = this.elMap.get(state.character);
    if (!el) return;
    el.className = `sprite sprite-${state.position}`;
    el.classList.toggle('sprite-dim', state.dimmed);
    if (state.visible) el.classList.add('sprite-in');
  }
}
