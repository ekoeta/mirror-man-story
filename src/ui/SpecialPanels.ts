import type { DialogueEffect } from '../engine/types';

type OnComplete = () => void;

export class SpecialPanels {
  private container: HTMLElement;
  private overlay: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.overlay = document.createElement('div');
    this.overlay.id = 'special-overlay';
    this.container.appendChild(this.overlay);
  }

  show(effect: DialogueEffect, onComplete: OnComplete) {
    switch (effect.type) {
      case 'photo_compare':
        this.showPhotoCompare(effect.before, effect.after, onComplete);
        break;
      case 'chat_message':
        this.showChatMessage(effect.sender, effect.message, effect.time, onComplete);
        break;
      case 'document_view':
        this.showDocument(effect.title, effect.content, onComplete);
        break;
      case 'social_post':
        this.showSocialPost(effect.platform, effect.content, effect.likes, effect.comments, onComplete);
        break;
      default:
        onComplete();
    }
  }

  private showPhotoCompare(before: string, after: string, done: OnComplete) {
    this.overlay.innerHTML = `
      <div class="special-panel photo-compare">
        <h3>照片对比</h3>
        <div class="photo-grid">
          <div class="photo-item">
            <div class="photo-placeholder" id="photo-before">${before}</div>
            <span class="photo-label">之前</span>
          </div>
          <div class="photo-item">
            <div class="photo-placeholder" id="photo-after">${after}</div>
            <span class="photo-label">现在</span>
          </div>
        </div>
        <button class="panel-close-btn">关闭</button>
      </div>
    `;
    this.overlay.classList.add('active');
    this.overlay.querySelector('.panel-close-btn')!.addEventListener('click', () => {
      this.close(done);
    });
  }

  private chatMessages: { sender: string; message: string; time: string }[] = [];

  private showChatMessage(sender: string, message: string, time: string, done: OnComplete) {
    this.chatMessages.push({ sender, message, time });

    const bubbles = this.chatMessages.map(m => {
      const isMe = m.sender === '我';
      return `
        <div class="chat-bubble ${isMe ? 'chat-me' : 'chat-other'}">
          <span class="chat-sender">${m.sender}</span>
          <span class="chat-msg">${m.message}</span>
          <span class="chat-time">${m.time}</span>
        </div>
      `;
    }).join('');

    this.overlay.innerHTML = `
      <div class="special-panel chat-panel">
        <div class="chat-header">📱 消息</div>
        <div class="chat-list">${bubbles}</div>
        <button class="panel-close-btn">关闭</button>
      </div>
    `;
    this.overlay.classList.add('active');
    // 滚动到底部
    const list = this.overlay.querySelector('.chat-list')!;
    list.scrollTop = list.scrollHeight;

    this.overlay.querySelector('.panel-close-btn')!.addEventListener('click', () => {
      this.close(done);
    });
  }

  private showDocument(title: string, content: string, done: OnComplete) {
    this.overlay.innerHTML = `
      <div class="special-panel document-panel">
        <h3>${title}</h3>
        <div class="document-content">${content}</div>
        <button class="panel-close-btn">关闭</button>
      </div>
    `;
    this.overlay.classList.add('active');
    this.overlay.querySelector('.panel-close-btn')!.addEventListener('click', () => {
      this.close(done);
    });
  }

  private showSocialPost(platform: string, content: string, likes: number, comments: number, done: OnComplete) {
    this.overlay.innerHTML = `
      <div class="special-panel social-panel">
        <div class="social-header">
          <span class="social-platform">${platform}</span>
        </div>
        <div class="social-content">${content}</div>
        <div class="social-stats">
          <span>❤️ ${likes}</span>
          <span>💬 ${comments}</span>
        </div>
        <button class="panel-close-btn">关闭</button>
      </div>
    `;
    this.overlay.classList.add('active');
    this.overlay.querySelector('.panel-close-btn')!.addEventListener('click', () => {
      this.close(done);
    });
  }

  private close(done: OnComplete) {
    this.overlay.classList.remove('active');
    this.overlay.innerHTML = '';
    done();
  }

  // 重置聊天记录（场景切换时调用）
  resetChat() {
    this.chatMessages = [];
  }
}
