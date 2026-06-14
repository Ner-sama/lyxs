// ==================== 柳琴音阶与曲谱 ====================

// 柳琴音阶定义（三组八度）
const PIANO_NOTES = {
  low: [
    { name: 'G3', label: 'Sol₃', freq: 196.00 },
    { name: 'A3', label: 'La₃', freq: 220.00 },
    { name: 'B3', label: 'Si₃', freq: 246.94 },
    { name: 'C4', label: 'Do₄', freq: 261.63 },
    { name: 'D4', label: 'Re₄', freq: 293.66 },
    { name: 'E4', label: 'Mi₄', freq: 329.63 },
    { name: 'F4', label: 'Fa₄', freq: 349.23 },
  ],
  mid: [
    { name: 'G4', label: 'Sol₄', freq: 392.00 },
    { name: 'A4', label: 'La₄', freq: 440.00 },
    { name: 'B4', label: 'Si₄', freq: 493.88 },
    { name: 'C5', label: 'Do₅', freq: 523.25 },
    { name: 'D5', label: 'Re₅', freq: 587.33 },
    { name: 'E5', label: 'Mi₅', freq: 659.25 },
    { name: 'F5', label: 'Fa₅', freq: 698.46 },
  ],
  high: [
    { name: 'G5', label: 'Sol₅', freq: 783.99 },
    { name: 'A5', label: 'La₅', freq: 880.00 },
    { name: 'B5', label: 'Si₅', freq: 987.77 },
    { name: 'C6', label: 'Do₆', freq: 1046.50 },
    { name: 'D6', label: 'Re₆', freq: 1174.66 },
  ]
};

const OCTAVE_NAMES = ['low', 'mid', 'high'];
const OCTAVE_LABELS = ['低音区 (G3-F4)', '中音区 (G4-F5)', '高音区 (G5-D6)'];

// 示范曲谱
const melodies = [
  {
    name: '《喝面叶》选段',
    notes: 'G4 A4 C5 D5 E5 D5 C5 A4 G4',
    bpm: 100
  },
  {
    name: '拉魂腔小调',
    notes: 'C5 D5 E5 G5 E5 D5 C5 A4 G4',
    bpm: 90
  },
  {
    name: '沂蒙山小调',
    notes: 'G4 E5 D5 C5 A4 C5 D5 E5 G5',
    bpm: 80
  }
];
