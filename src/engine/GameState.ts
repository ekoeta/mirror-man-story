import type { GameState, DialogueLine } from './types';

type Listener = (state: GameState) => void;

const READ_KEY = 'mirror-man-read';

function loadReadLines(): string[] {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveReadLines(lines: string[]) {
  try { localStorage.setItem(READ_KEY, JSON.stringify(lines)); } catch {}
}

const initialState = (): GameState => ({
  currentScene: 'prologue_start',
  dialogueIndex: 0,
  flags: {},
  history: [],
  readLines: loadReadLines(),
  isSkipping: false,
  skipMode: 'read',
  isAuto: false,
  isChoosing: false,
  isPlaying: false,
});

let state = initialState();
const listeners = new Set<Listener>();

export function getState(): GameState {
  return state;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  const snap = getState();
  listeners.forEach(fn => fn(snap));
}

export function resetGame() {
  state = initialState();
  notify();
}

export function setScene(sceneId: string) {
  state.currentScene = sceneId;
  state.dialogueIndex = 0;
  state.isChoosing = false;
  notify();
}

export function advanceDialogue() {
  state.dialogueIndex++;
  notify();
}

export function setChoosing(v: boolean) {
  state.isChoosing = v;
  notify();
}

export function setPlaying(v: boolean) {
  state.isPlaying = v;
  notify();
}

export function setFlags(flags: Record<string, boolean>) {
  Object.assign(state.flags, flags);
  notify();
}

export function getFlag(key: string): boolean {
  return state.flags[key] ?? false;
}

export function addHistory(line: DialogueLine) {
  state.history.push(line);
}

export function markRead(sceneId: string, index: number) {
  const key = `${sceneId}:${index}`;
  if (!state.readLines.includes(key)) {
    state.readLines.push(key);
    saveReadLines(state.readLines);
  }
}

export function isRead(sceneId: string, index: number): boolean {
  return state.readLines.includes(`${sceneId}:${index}`);
}

export function setSkipping(v: boolean) {
  state.isSkipping = v;
  notify();
}

export function setSkipMode(m: 'read' | 'all') {
  state.skipMode = m;
  notify();
}

export function setAutoMode(v: boolean) {
  state.isAuto = v;
  notify();
}
