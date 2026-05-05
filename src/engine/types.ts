// 视觉小说引擎类型定义

export interface DialogueLine {
  character?: string;
  text: string;
  expression?: string;
  position?: 'left' | 'center' | 'right';
  spriteAction?: 'show' | 'hide' | 'dim';
  effect?: DialogueEffect;
}

export type DialogueEffect =
  | { type: 'shake' }
  | { type: 'flash' }
  | { type: 'delay'; ms: number }
  | { type: 'photo_compare'; before: string; after: string }
  | { type: 'chat_message'; sender: string; message: string; time: string }
  | { type: 'document_view'; title: string; content: string }
  | { type: 'social_post'; platform: string; content: string; likes: number; comments: number };

export interface Choice {
  text: string;
  nextScene: string;
  condition?: { flag: string; value: boolean };
  setFlag?: Record<string, boolean>;
}

export interface SpriteConfig {
  character: string;
  position: 'left' | 'center' | 'right';
  expression?: string;
}

export type AudioMood = 'silent' | 'dark' | 'morning' | 'neutral' | 'tense' | 'sad' | 'digital' | 'climax';

export interface Scene {
  id: string;
  background?: string;
  bgm?: string;
  mood?: AudioMood;
  sprites?: SpriteConfig[];
  dialogues: DialogueLine[];
  choices?: Choice[];
  nextScene?: string;
  onEnter?: { setFlags?: Record<string, boolean> };
}

export interface Character {
  id: string;
  name: string;
  color: string;
  sprites?: Record<string, string>;
}

export interface SaveData {
  slot: number;
  timestamp: number;
  sceneId: string;
  dialogueIndex: number;
  flags: Record<string, boolean>;
  description: string;
}

export interface GameState {
  currentScene: string;
  dialogueIndex: number;
  flags: Record<string, boolean>;
  history: DialogueLine[];
  readLines: string[];
  isSkipping: boolean;
  skipMode: 'read' | 'all';
  isAuto: boolean;
  isChoosing: boolean;
  isPlaying: boolean;
}
