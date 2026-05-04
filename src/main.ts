import './style.css';
import { TextBox } from './ui/TextBox';
import { ChoicePanel } from './ui/ChoicePanel';
import { Background } from './ui/Background';
import { SpecialPanels } from './ui/SpecialPanels';
import { SpriteDisplay } from './ui/SpriteDisplay';
import { SaveLoadMenu } from './ui/SaveLoadMenu';
import { registerScenes, setHandler, startGame } from './engine/ScriptEngine';
import { subscribe, getState, resetGame } from './engine/GameState';
import { storyScript } from './data/script';
import { getAutoSave, load, clearLoadData } from './engine/SaveManager';
import type { DialogueLine, Choice, DialogueEffect } from './engine/types';

// —— 注册场景 ——
registerScenes(storyScript);

// —— 获取容器 ——
const app = document.querySelector<HTMLDivElement>('#app')!;

// —— 初始化 UI 组件 ——
const background = new Background(app);
const spriteDisplay = new SpriteDisplay(app);
const textBox = new TextBox(app);
const choicePanel = new ChoicePanel(app);
const specialPanels = new SpecialPanels(app);
const saveLoadMenu = new SaveLoadMenu(app);

// —— 菜单按钮 ——
const menuBtn = document.createElement('button');
menuBtn.id = 'menu-btn';
menuBtn.textContent = '☰';
menuBtn.title = '存档 / 读档';
menuBtn.addEventListener('click', () => saveLoadMenu.toggle());
app.appendChild(menuBtn);

// —— 创建标题画面 ——
const autoSave = getAutoSave();

const titleScreen = document.createElement('div');
titleScreen.id = 'title-screen';
titleScreen.innerHTML = `
  <h1>镜中人</h1>
  <span class="subtitle">The Person in the Mirror</span>
  ${autoSave ? '<button class="title-btn continue-btn" id="btn-continue">继续游戏</button>' : ''}
  <button class="title-btn" id="btn-start">新的游戏</button>
`;
app.appendChild(titleScreen);

// —— 标题画面按钮事件 ——
document.getElementById('btn-start')!.addEventListener('click', () => {
  titleScreen.classList.add('hidden');
  menuBtn.classList.add('visible');
  resetGame();
  startGame();
});

if (autoSave) {
  document.getElementById('btn-continue')!.addEventListener('click', () => {
    load(0);
    titleScreen.classList.add('hidden');
    menuBtn.classList.add('visible');
    resetGame();
    startGame();
  });
}

clearLoadData();

// —— 处理立绘动作 ——
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

// —— 设置脚本引擎回调 ——
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
  },
});

// —— 订阅状态变化（用于背景 + 立绘切换） ——
let lastScene = '';
subscribe(state => {
  if (state.currentScene !== lastScene) {
    lastScene = state.currentScene;
    const scene = storyScript.find(s => s.id === state.currentScene);
    if (scene) {
      background.set(scene.background);
      // 应用场景立绘配置
      if (scene.sprites) {
        spriteDisplay.apply(scene.sprites);
      }
    }
  }
});

// —— 键盘快捷键 ——
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && getState().isPlaying) {
    if (saveLoadMenu.isVisible()) {
      saveLoadMenu.hide();
    } else {
      saveLoadMenu.show();
    }
  }
});

// —— 点击背景推进对话 ——
app.addEventListener('click', (e) => {
  const state = getState();
  if (!state.isPlaying || state.isChoosing) return;
  if (saveLoadMenu.isVisible()) return;
  // 不重复处理文本框自身的点击
  const textBoxEl = document.getElementById('text-box');
  if (textBoxEl && textBoxEl.contains(e.target as Node)) return;
  if (textBox.isActive()) {
    textBox.click();
  }
});
