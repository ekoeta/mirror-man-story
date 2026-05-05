import { listSlots, save, load, remove } from '../engine/SaveManager';
import { resetGame } from '../engine/GameState';
import { startGame } from '../engine/ScriptEngine';
import type { SaveData } from '../engine/types';

export class SaveLoadMenu {
  private overlay: HTMLDivElement;
  private visible = false;
  private onReturnTitle: (() => void) | null;
  private deletingIndex = -1;

  constructor(container: HTMLElement, onReturnTitle?: () => void) {
    this.onReturnTitle = onReturnTitle || null;
    this.overlay = document.createElement('div');
    this.overlay.id = 'save-menu';
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        e.stopPropagation();
        this.hide();
      }
    });
    container.appendChild(this.overlay);
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
  }

  show() {
    this.visible = true;
    this.render();
    this.overlay.classList.add('active');
  }

  hide() {
    this.visible = false;
    this.overlay.classList.remove('active');
  }

  isVisible() { return this.visible; }

  private render() {
    const slots = listSlots();
    this.overlay.innerHTML = `
      <div class="save-menu-panel">
        <div class="save-menu-header">
          <h2>存档 / 读档</h2>
          <span class="save-menu-hint">Esc 关闭</span>
        </div>
        <div class="save-slots">
          ${slots.map((s, i) => this.renderSlot(s, i)).join('')}
        </div>
        <button class="return-title-btn" id="return-title-btn">← 返回标题</button>
      </div>
    `;

    this.overlay.querySelector('#return-title-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
      this.onReturnTitle?.();
    });

    slots.forEach((_, i) => {
      const slotEl = this.overlay.querySelector(`#save-slot-${i}`);
      if (!slotEl) return;

      slotEl.querySelector('.btn-save')?.addEventListener('click', (e) => {
        e.stopPropagation();
        save(i, `存档 ${i + 1}`);
        this.render();
      });

      slotEl.querySelector('.btn-load')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (load(i)) {
          this.hide();
          resetGame();
          startGame();
        }
      });

      slotEl.querySelector('.btn-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.deletingIndex === i) {
          remove(i);
          this.deletingIndex = -1;
          this.render();
        } else {
          this.deletingIndex = i;
          const btn = slotEl.querySelector('.btn-delete') as HTMLButtonElement;
          if (btn) {
            btn.textContent = '确认';
            btn.classList.add('confirm');
          }
          setTimeout(() => {
            if (this.deletingIndex === i) {
              this.deletingIndex = -1;
              this.render();
            }
          }, 3000);
        }
      });
    });
  }

  private renderSlot(s: SaveData | null, index: number): string {
    const sceneHint = s ? this.sceneLabel(s.sceneId) : '';
    const date = s ? new Date(s.timestamp).toLocaleString('zh-CN') : '';
    const isAuto = index === 0;

    if (s) {
      return `
        <div class="save-slot" id="save-slot-${index}">
          <div class="slot-info">
            <span class="slot-label">${isAuto ? '🔄 自动存档' : `存档 ${index + 1}`}</span>
            <span class="slot-scene">${sceneHint}</span>
            <span class="slot-date">${date}</span>
          </div>
          <div class="slot-actions">
            <button class="slot-btn btn-save">覆盖</button>
            <button class="slot-btn btn-load">读取</button>
            ${isAuto ? '' : '<button class="slot-btn btn-delete">删除</button>'}
          </div>
        </div>
      `;
    }

    return `
      <div class="save-slot empty" id="save-slot-${index}">
        <div class="slot-info">
          <span class="slot-label">存档 ${index + 1}</span>
          <span class="slot-scene empty-hint">— 空 —</span>
        </div>
        <div class="slot-actions">
          <button class="slot-btn btn-save">保存</button>
        </div>
      </div>
    `;
  }

  private sceneLabel(id: string): string {
    const labels: Record<string, string> = {
      'prologue_start': '序章 · 镜',
      'prologue_ask_shen': '序章 · 追问沈姐',
      'prologue_uneasy': '序章 · 不安',
      'prologue_reply_msg': '序章 · 回复短信',
      'prologue_ignore_msg': '序章 · 忽略短信',
      'ch1_start': '第一章 · 出版社',
      'ch1_check_mirror': '第一章 · 镜子前',
      'ch1_meet_zhou': '第一章 · 周其深办公室',
      'ch1_sign_contract': '第一章 · 签合同',
      'ch1_ask_zhou': '第一章 · 追问周其深',
      'ch1_end_choice': '第一章 · 抉择',
      'ch2_investigate_email': '第二章 · 调查邮箱',
      'ch2_email_deep': '第二章 · 深入调查',
      'ch2_reply_stranger': '第二章 · 回复短信',
      'ch2_check_link': '第二章 · 验证链接',
      'ch2_suhe_chat': '第二章 · 加密聊天室',
      'ch2_call_zhou': '第二章 · 致电周其深',
      'ch2_alone': '第二章 · 独处',
      'ch2_suhe_explain': '第二章 · 苏鹤的解释',
      'ch2_suhe_past': '第二章 · 苏鹤的过去',
      'ch2_counterplan': '第二章 · 对策',
      'ch2_converge': '第二章 · 终局',
      'ch3_start': '第三章 · 失联',
      'ch3_bank': '第三章 · 银行',
      'ch3_police': '第三章 · 报警',
      'ch3_evidence': '第三章 · 证据',
      'ch3_hospital': '第三章 · 七院',
      'ch3_ask_suhe': '第三章 · 追问苏鹤',
      'ch3_end': '第三章 · 裂痕',
      'ch4_start': '第四章 · 余波',
      'ch4_fallout': '第四章 · 坠落',
      'ch4_margins': '第四章 · 边缘',
      'ch4_meet_suhe': '第四章 · 再见苏鹤',
      'ch4_contact_publisher': '第四章 · 联系出版社',
      'ch5_start': '第五章 · 发布会前',
      'ch5_arrival': '第五章 · 到场',
      'ch5_confront': '第五章 · 对峙',
      'ch5_rendezvous': '第五章 · 会合',
      'ch5_climax': '第五章 · 高潮',
      'ch6_ending_a': '结局 A · 换锁',
      'ch6_ending_b': '结局 B · 裂缝',
      'ch6_ending_c': '结局 C · 魔瓶',
      'ch6_ending_d': '结局 D · 空画框',
    };
    return labels[id] || id;
  }
}
