import type { SaveData } from './types';
import { getState } from './GameState';

const SAVE_KEY = 'mirror-man-saves';
const AUTO_SAVE_SLOT = 0;
const MAX_SLOTS = 10;

function loadAll(): SaveData[] {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(data: SaveData[]) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function save(slot: number, description: string) {
  const saves = loadAll();
  const state = getState();
  const entry: SaveData = {
    slot,
    timestamp: Date.now(),
    sceneId: state.currentScene,
    dialogueIndex: state.dialogueIndex,
    flags: { ...state.flags },
    description,
  };
  const idx = saves.findIndex(s => s.slot === slot);
  if (idx >= 0) saves[idx] = entry;
  else saves.push(entry);
  saveAll(saves);
}

export function load(slot: number): boolean {
  const saves = loadAll();
  const entry = saves.find(s => s.slot === slot);
  if (!entry) return false;
  // 状态恢复由 ScriptEngine 处理
  (window as any).__loadData = entry;
  return true;
}

export function remove(slot: number) {
  const saves = loadAll().filter(s => s.slot !== slot);
  saveAll(saves);
}

export function listSlots(): (SaveData | null)[] {
  const saves = loadAll();
  return Array.from({ length: MAX_SLOTS }, (_, i) => {
    return saves.find(s => s.slot === i) ?? null;
  });
}

export function autoSave() {
  save(AUTO_SAVE_SLOT, '自动存档');
}

export function getAutoSave(): SaveData | null {
  const saves = loadAll();
  return saves.find(s => s.slot === AUTO_SAVE_SLOT) ?? null;
}

export function getLoadData(): SaveData | null {
  return (window as any).__loadData ?? null;
}

export function clearLoadData() {
  (window as any).__loadData = undefined;
}
