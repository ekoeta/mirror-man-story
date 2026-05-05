import './style.css';
import { TextBox } from './ui/TextBox';
import { ChoicePanel } from './ui/ChoicePanel';
import { Background } from './ui/Background';
import { SpecialPanels } from './ui/SpecialPanels';
import { SpriteDisplay } from './ui/SpriteDisplay';
import { SaveLoadMenu } from './ui/SaveLoadMenu';
import { BacklogPanel } from './ui/BacklogPanel';
import { registerScenes, setHandler, startGame } from './engine/ScriptEngine';
import { subscribe, getState, resetGame, setSkipping, setSkipMode, setAutoMode } from './engine/GameState';
import { getTextSpeed, setTextSpeed } from './ui/TextBox';
import { storyScript } from './data/script';
import { getAutoSave, load, clearLoadData } from './engine/SaveManager';
import { audioEngine } from './engine/AudioEngine';
import type { DialogueLine, Choice, DialogueEffect } from './engine/types';

registerScenes(storyScript);

// —— 结局追踪 ——
const ENDING_KEY = 'mirror-man-endings';
const ENDING_NAMES: Record<string, string> = {
  ch6_ending_a: 'A · 换锁',
  ch6_ending_b: 'B · 裂缝',
  ch6_ending_c: 'C · 魔瓶',
  ch6_ending_d: 'D · 空画框',
};
function getEndings(): string[] {
  try { return JSON.parse(localStorage.getItem(ENDING_KEY) || '[]'); } catch { return []; }
}
function recordEnding(sceneId: string): string | undefined {
  const name = ENDING_NAMES[sceneId];
  if (!name) return undefined;
  const endings = getEndings();
  if (!endings.includes(name)) {
    endings.push(name);
    localStorage.setItem(ENDING_KEY, JSON.stringify(endings));
  }
  return name;
}

const app = document.querySelector<HTMLDivElement>('#app')!;

// —— 旋转提示 ——
const rotateHint = document.createElement('div');
rotateHint.id = 'rotate-hint';
rotateHint.innerHTML = '<div class="rotate-icon">📱</div><p>请旋转手机至横屏</p>';
app.appendChild(rotateHint);

try { (screen.orientation as any)?.lock?.('landscape')?.catch(() => {}); } catch {}

// —— UI 组件 ——
const background = new Background(app);
const spriteDisplay = new SpriteDisplay(app);
const textBox = new TextBox(app);
const choicePanel = new ChoicePanel(app);
const specialPanels = new SpecialPanels(app);

function returnToTitle() {
  setSkipping(false);
  setAutoMode(false);
  skipIndicator.classList.remove('active');
  autoIndicator.classList.remove('visible');
  textBox.cancelAuto();
  textBox.hide();
  choicePanel.hide();
  saveLoadMenu.hide();
  backlogPanel.hide();
  updateTitleScreen();
  titleScreen.classList.remove('hidden');
  menuBtn.classList.remove('visible');
  volumeContainer.classList.remove('visible');
  speedBtn.classList.remove('visible');
  skipModeBtn.classList.remove('visible');
  helpBtn.classList.remove('visible');
  resetGame();
  audioEngine.stop();
}

const saveLoadMenu = new SaveLoadMenu(app, returnToTitle);
const backlogPanel = new BacklogPanel(app);

// —— 场景过渡遮罩 ——
const transitionOverlay = document.createElement('div');
transitionOverlay.id = 'transition-overlay';
app.appendChild(transitionOverlay);
let transitionTimer: number | null = null;

// —— 菜单按钮 ——
const menuBtn = document.createElement('button');
menuBtn.id = 'menu-btn';
menuBtn.textContent = '☰';
menuBtn.title = '存档 / 读档';
menuBtn.addEventListener('click', (e) => { e.stopPropagation(); saveLoadMenu.toggle(); });
app.appendChild(menuBtn);

// —— 音量控制 ——
const volumeContainer = document.createElement('div');
volumeContainer.id = 'volume-container';
const volumeMuteBtn = document.createElement('button');
volumeMuteBtn.id = 'volume-mute-btn';
volumeMuteBtn.textContent = '♪';
volumeMuteBtn.title = '静音';
volumeMuteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const muted = volumeSlider.dataset.muted === 'true';
  if (muted) {
    volumeSlider.value = String(volumeSlider.dataset.prev || '60');
    volumeMuteBtn.textContent = '♪';
    volumeMuteBtn.classList.remove('muted');
    volumeSlider.dataset.muted = 'false';
  } else {
    volumeSlider.dataset.prev = volumeSlider.value;
    volumeSlider.value = '0';
    volumeMuteBtn.textContent = '♪̸';
    volumeMuteBtn.classList.add('muted');
    volumeSlider.dataset.muted = 'true';
  }
  audioEngine.setVolume(Number(volumeSlider.value) / 100);
});
const volumeSlider = document.createElement('input');
volumeSlider.type = 'range';
volumeSlider.id = 'volume-slider';
volumeSlider.min = '0';
volumeSlider.max = '100';
volumeSlider.value = '60';
volumeSlider.title = '音量';
volumeSlider.addEventListener('input', (e) => {
  e.stopPropagation();
  const v = Number(volumeSlider.value) / 100;
  audioEngine.setVolume(v);
  const muted = v === 0;
  volumeSlider.dataset.muted = muted ? 'true' : 'false';
  volumeMuteBtn.textContent = muted ? '♪̸' : '♪';
  if (muted) volumeMuteBtn.classList.add('muted');
  else volumeMuteBtn.classList.remove('muted');
  if (v > 0) volumeSlider.dataset.prev = volumeSlider.value;
});
volumeContainer.append(volumeMuteBtn, volumeSlider);
app.appendChild(volumeContainer);

// —— 快进指示器 ——
const skipIndicator = document.createElement('div');
skipIndicator.id = 'skip-indicator';
skipIndicator.textContent = '⏩ 快进中';
app.appendChild(skipIndicator);

// —— 快进模式按钮 ——
const skipModeBtn = document.createElement('button');
skipModeBtn.id = 'skip-mode-btn';
skipModeBtn.textContent = '⇉';
skipModeBtn.title = '快进范围：仅已读';
skipModeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const state = getState();
  const next = state.skipMode === 'read' ? 'all' : 'read';
  setSkipMode(next);
  skipModeBtn.textContent = next === 'all' ? '⇉⇉' : '⇉';
  skipModeBtn.title = '快进范围：' + (next === 'all' ? '全部跳过' : '仅已读');
  skipIndicator.textContent = next === 'all' ? '⏩ 全部快进' : '⏩ 快进中';
});
app.appendChild(skipModeBtn);

// —— 自动指示器 ——
const autoIndicator = document.createElement('div');
autoIndicator.id = 'auto-indicator';
autoIndicator.textContent = '▶ 自动';
app.appendChild(autoIndicator);

// —— 结局遮罩 ——
const endingOverlay = document.createElement('div');
endingOverlay.id = 'ending-overlay';
endingOverlay.innerHTML = `
  <div class="ending-panel">
    <h2 id="ending-name"></h2>
    <p class="ending-sub">— 感谢游玩 —</p>
    <button class="title-btn" id="btn-return-title">返回标题</button>
  </div>
`;
endingOverlay.querySelector('#btn-return-title')!.addEventListener('click', () => {
  endingOverlay.classList.remove('active');
  updateTitleScreen();
  titleScreen.classList.remove('hidden');
  menuBtn.classList.remove('visible');
  volumeContainer.classList.remove('visible');
  autoIndicator.classList.remove('visible');
  skipIndicator.classList.remove('active');
  resetGame();
  audioEngine.stop();
});
app.appendChild(endingOverlay);

// —— 快捷键提示 ——
const controlsHint = document.createElement('div');
controlsHint.id = 'controls-hint';
controlsHint.textContent = '↑ 回看 | Esc 存档 | Shift+Esc 回标题 | Ctrl 切换快进 | ⇉ 范围 | A 自动 | H 帮助';
let hintTimer: number | null = null;
function showHint() {
  controlsHint.classList.add('visible');
  if (hintTimer) clearTimeout(hintTimer);
  hintTimer = window.setTimeout(() => controlsHint.classList.remove('visible'), 8000);
}
app.appendChild(controlsHint);

// —— 文本速度按钮 ——
const speedLabels: Record<string, string> = { slow: '慢', medium: '中', fast: '快' };
let currentSpeed = getTextSpeed();
const speedBtn = document.createElement('button');
speedBtn.id = 'speed-btn';
speedBtn.textContent = speedLabels[currentSpeed] ?? '中';
speedBtn.title = '文本速度：' + (speedLabels[currentSpeed] ?? '中');
speedBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const next: Record<string, string> = { slow: 'medium', medium: 'fast', fast: 'slow' };
  currentSpeed = next[currentSpeed] ?? 'medium';
  setTextSpeed(currentSpeed);
  speedBtn.textContent = speedLabels[currentSpeed];
  speedBtn.title = '文本速度：' + speedLabels[currentSpeed];
});
app.appendChild(speedBtn);

// —— 帮助按钮 ——
const helpBtn = document.createElement('button');
helpBtn.id = 'help-btn';
helpBtn.textContent = '?';
helpBtn.title = '快捷键说明';
helpBtn.addEventListener('click', (e) => { e.stopPropagation(); showHint(); });
app.appendChild(helpBtn);

// —— 标题画面 ——
function buildEndingsHTML(): string {
  const endings = getEndings();
  if (endings.length === 0) return '';
  const all = ['A · 换锁', 'B · 裂缝', 'C · 魔瓶', 'D · 空画框'];
  return `<div class="endings-list">${all.map(e => endings.includes(e) ? `<span class="ending-unlocked">${e}</span>` : `<span class="ending-locked">?</span>`).join(' &nbsp;')}</div>`;
}

function updateTitleScreen() {
  titleScreen.innerHTML = `
    <h1>镜中人</h1>
    <span class="subtitle">The Person in the Mirror</span>
    ${buildEndingsHTML()}
    ${getAutoSave() ? '<button class="title-btn continue-btn" id="btn-continue">继续游戏</button>' : ''}
    <button class="title-btn" id="btn-start">新的游戏</button>
  `;
  document.getElementById('btn-start')!.addEventListener('click', () => {
    titleScreen.classList.add('hidden');
    menuBtn.classList.add('visible');
    volumeContainer.classList.add('visible');
    speedBtn.classList.add('visible');
    skipModeBtn.classList.add('visible');
    helpBtn.classList.add('visible');
    resetGame();
    startGame();
    showHint();
  });
  if (getAutoSave()) {
    document.getElementById('btn-continue')!.addEventListener('click', () => {
      load(0);
      titleScreen.classList.add('hidden');
      menuBtn.classList.add('visible');
      volumeContainer.classList.add('visible');
      speedBtn.classList.add('visible');
      skipModeBtn.classList.add('visible');
      helpBtn.classList.add('visible');
      resetGame();
      startGame();
      showHint();
    });
  }
}

const titleScreen = document.createElement('div');
titleScreen.id = 'title-screen';
app.appendChild(titleScreen);
updateTitleScreen();
clearLoadData();

// —— 立绘动作 ——
function handleSpriteAction(line: DialogueLine) {
  if (line.spriteAction && line.character) {
    spriteDisplay.act(line.character, line.spriteAction, line.position, line.expression);
  }
  if (line.character) {
    spriteDisplay.highlight(line.character);
  } else {
    spriteDisplay.highlight(undefined);
  }
}

// —— 脚本引擎回调 ——
setHandler({
  onDialogue(line: DialogueLine, onComplete: () => void) {
    handleSpriteAction(line);
    textBox.setFullText(line.text);
    textBox.show(line, () => {
      if (line.effect) {
        if (line.effect.type === 'delay') {
          setTimeout(onComplete, line.effect.ms);
          return;
        }
        specialPanels.show(line.effect, onComplete);
        return;
      }
      onComplete();
    });
  },

  onChoice(choices: Choice[], onSelect: (c: Choice) => void) {
    choicePanel.show(choices, onSelect);
  },

  onEffect(effect: DialogueEffect, onComplete: () => void) {
    specialPanels.show(effect, onComplete);
  },

  onSceneEnd(_nextScene?: string) {
    textBox.hide();
    choicePanel.hide();
    const endingName = recordEnding(getState().currentScene);
    const nameEl = endingOverlay.querySelector('#ending-name')!;
    nameEl.textContent = endingName || '旅程结束';
    setTimeout(() => {
      endingOverlay.classList.add('active');
    }, 1000);
  },
});

// —— 场景状态订阅 ——
let lastScene = '';
subscribe(state => {
  if (state.currentScene !== lastScene) {
    const prevScene = lastScene;
    lastScene = state.currentScene;
    const scene = storyScript.find(s => s.id === state.currentScene);
    if (!scene) return;

    if (transitionTimer) clearTimeout(transitionTimer);

    const applyScene = () => {
      background.set(scene.background);
      if (scene.sprites) spriteDisplay.apply(scene.sprites);
      const mood = scene.mood || 'silent';
      setTimeout(() => {
        try { audioEngine.setMood(mood); } catch {}
      }, 0);
      transitionOverlay.classList.remove('active');
    };

    if (!prevScene) {
      applyScene();
    } else {
      transitionOverlay.classList.add('active');
      transitionTimer = window.setTimeout(applyScene, 350);
    }
  }
});

// —— 快进/自动指示器同步 ——
subscribe(state => {
  if (!state.isSkipping) skipIndicator.classList.remove('active');
  else {
    skipIndicator.textContent = state.skipMode === 'all' ? '⏩ 全部快进' : '⏩ 快进中';
    textBox.checkAuto();
  }
  if (state.isAuto) {
    autoIndicator.classList.add('visible');
    textBox.checkAuto();
  } else {
    autoIndicator.classList.remove('visible');
  }
});

// —— 音频初始化 ——
function initAudio() {
  audioEngine.init();
  document.removeEventListener('click', initAudio);
  document.removeEventListener('keydown', initAudio);
}
document.addEventListener('click', initAudio);
document.addEventListener('keydown', initAudio);

// —— 键盘快捷键 ——
document.addEventListener('keydown', (e) => {
  const state = getState();
  if (!state.isPlaying) return;

  if (e.key === 'Control' && !state.isChoosing && !saveLoadMenu.isVisible() && !backlogPanel.isVisible()) {
    e.preventDefault();
    const next = !state.isSkipping;
    setSkipping(next);
    if (next) skipIndicator.classList.add('active');
    else { skipIndicator.classList.remove('active'); textBox.cancelAuto(); }
    return;
  }

  if (e.key === 'Escape') {
    if (e.shiftKey) {
      returnToTitle();
      return;
    }
    textBox.cancelAuto();
    setSkipping(false);
    skipIndicator.classList.remove('active');
    if (backlogPanel.isVisible()) {
      backlogPanel.hide();
    } else if (saveLoadMenu.isVisible()) {
      saveLoadMenu.hide();
    } else {
      saveLoadMenu.show();
    }
    return;
  }

  if ((e.key === 'a' || e.key === 'A') && !state.isChoosing && !saveLoadMenu.isVisible() && !backlogPanel.isVisible()) {
    e.preventDefault();
    const next = !state.isAuto;
    setAutoMode(next);
    if (next) setSkipping(false);
    skipIndicator.classList.remove('active');
    return;
  }

  if ((e.key === 'h' || e.key === 'H') && !state.isChoosing && !saveLoadMenu.isVisible() && !backlogPanel.isVisible()) {
    showHint();
  }

  if (e.key === 'ArrowUp' && !state.isChoosing && !saveLoadMenu.isVisible()) {
    backlogPanel.show(state.history);
  }
});

// —— 背景点击 ——
app.addEventListener('click', (e) => {
  const state = getState();
  if (!state.isPlaying || state.isChoosing) return;
  if (saveLoadMenu.isVisible() || backlogPanel.isVisible()) return;

  if (state.isSkipping || state.isAuto) {
    e.stopPropagation();
    setSkipping(false);
    setAutoMode(false);
    textBox.cancelAuto();
    return;
  }

  const textBoxEl = document.getElementById('text-box');
  if (textBoxEl && textBoxEl.contains(e.target as Node)) return;
  if (textBox.isActive()) {
    textBox.click();
  }
}, true);

// —— 移动端触控栏 ——
const mobileBar = document.createElement('div');
mobileBar.id = 'mobile-bar';
const mkBtn = (text: string, title: string, onClick: () => void) => {
  const b = document.createElement('button');
  b.className = 'mobile-btn';
  b.textContent = text;
  b.title = title;
  b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
  return b;
};
mobileBar.append(
  mkBtn('回', '对话回看', () => { const s = getState(); if (!s.isChoosing) backlogPanel.show(s.history); }),
  mkBtn('快', '切换快进', () => {
    const s = getState();
    if (!s.isChoosing) {
      const n = !s.isSkipping;
      setSkipping(n);
      if (n) skipIndicator.classList.add('active');
      else { skipIndicator.classList.remove('active'); textBox.cancelAuto(); }
    }
  }),
  mkBtn('自', '自动模式', () => {
    const s = getState();
    if (!s.isChoosing) {
      const n = !s.isAuto;
      setAutoMode(n);
      if (n) setSkipping(false);
      skipIndicator.classList.remove('active');
    }
  }),
);
app.appendChild(mobileBar);

subscribe(state => {
  if (state.isPlaying) mobileBar.classList.add('visible');
  else mobileBar.classList.remove('visible');
});
