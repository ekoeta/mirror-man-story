import type { Character } from '../engine/types';

export const characters: Record<string, Character> = {
  lin_xiao: {
    id: 'lin_xiao',
    name: '林萧',
    color: '#e0e0e0',
  },
  su_he: {
    id: 'su_he',
    name: '苏鹤',
    color: '#7ec8e3',
  },
  shen_jie: {
    id: 'shen_jie',
    name: '沈姐',
    color: '#f4a460',
  },
  zhou_qishen: {
    id: 'zhou_qishen',
    name: '周其深',
    color: '#b8a9c9',
  },
};

// 旁白不需要在 characters 里
