import type { Scene, DialogueLine, Choice } from './types';
import {
  getState,
  setScene,
  advanceDialogue,
  setChoosing,
  setPlaying,
  setFlags,
  addHistory,
  markRead,
  isRead,
  setSkipping,
} from './GameState';
import { autoSave, getLoadData, clearLoadData } from './SaveManager';

let scenes: Map<string, Scene> = new Map();

export function registerScenes(sceneList: Scene[]) {
  scenes.clear();
  sceneList.forEach(s => scenes.set(s.id, s));
}

function currentScene(): Scene | undefined {
  return scenes.get(getState().currentScene);
}

type EventHandler = {
  onDialogue: (line: DialogueLine, onComplete: () => void) => void;
  onChoice: (choices: Choice[], onSelect: (c: Choice) => void) => void;
  onEffect: (effect: NonNullable<DialogueLine['effect']>, onComplete: () => void) => void;
  onSceneEnd: (nextScene?: string) => void;
};

let handler: EventHandler | null = null;

export function setHandler(h: EventHandler) {
  handler = h;
}

export function startGame() {
  const data = getLoadData();
  if (data && scenes.has(data.sceneId)) {
    setFlags(data.flags);
    setScene(data.sceneId);
    const s = getState();
    s.dialogueIndex = Math.min(data.dialogueIndex, (scenes.get(data.sceneId)?.dialogues.length ?? 1) - 1);
    clearLoadData();
  }
  setPlaying(true);
  runScene();
}

export function runScene() {
  const scene = currentScene();
  if (!scene) {
    handler?.onSceneEnd(undefined);
    return;
  }

  if (scene.onEnter?.setFlags) {
    setFlags(scene.onEnter.setFlags);
  }

  const state = getState();
  if (state.dialogueIndex < scene.dialogues.length) {
    showDialogue(scene.dialogues[state.dialogueIndex]);
  } else if (scene.choices && scene.choices.length > 0) {
    showChoices(scene.choices);
  } else if (scene.nextScene) {
    autoSave();
    setScene(scene.nextScene);
    runScene();
  } else {
    autoSave();
    handler?.onSceneEnd(undefined);
  }
}

function showDialogue(line: DialogueLine) {
  addHistory(line);
  const state = getState();
  const alreadyRead = isRead(state.currentScene, state.dialogueIndex);
  markRead(state.currentScene, state.dialogueIndex);

  if (state.isSkipping && state.skipMode === 'read' && !alreadyRead) {
    setSkipping(false);
  }

  handler?.onDialogue(line, () => {
    advanceDialogue();
    runScene();
  });
}

function showChoices(choices: Choice[]) {
  const state = getState();
  const available = choices.filter(c => {
    if (c.condition) {
      return state.flags[c.condition.flag] === c.condition.value;
    }
    return true;
  });

  if (available.length === 0) {
    setScene(choices[0].nextScene);
    runScene();
    return;
  }

  setChoosing(true);
  handler?.onChoice(available, (choice) => {
    if (choice.setFlag) {
      setFlags(choice.setFlag);
    }
    setChoosing(false);
    setScene(choice.nextScene);
    runScene();
  });
}

export function getCurrentChoices(): Choice[] {
  const scene = currentScene();
  if (!scene?.choices) return [];
  const state = getState();
  return scene.choices.filter(c => {
    if (c.condition) return state.flags[c.condition.flag] === c.condition.value;
    return true;
  });
}
