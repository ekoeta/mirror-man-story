// 视觉小说引擎类型定义

export interface DialogueLine {
  character?: string; // undefined = 旁白
  text: string;
  expression?: string;
  position?: 'left' | 'center' | 'right'; // 立绘位置
  spriteAction?: 'show' | 'hide' | 'dim';  // 立绘动作
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

export interface Scene {
  id: string;
  background?: string;
  bgm?: string;
  sprites?: SpriteConfig[]; // 场景进入时的立绘配置
  dialogues: DialogueLine[];
  choices?: Choice[];
  nextScene?: string;
  onEnter?: { setFlags?: Record<string, boolean> };
}

export interface Character {
  id: string;
  name: string;
  color: string; // 名字显示颜色
  sprites?: Record<string, string>; // expression -> sprite url
}

export interface SaveData {
  slot: number;
  timestamp: number;
  sceneId: string;
  dialogueIndex: number;
  flags: Record<string, boolean>;
  description: string; // 简短描述，用于存档界面
}

export interface GameState {
  currentScene: string;
  dialogueIndex: number;
  flags: Record<string, boolean>;
  history: DialogueLine[]; // 已显示的历史记录
  isChoosing: boolean;
  isPlaying: boolean;
}
