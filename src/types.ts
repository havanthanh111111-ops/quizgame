/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
  content: string; // The textbook raw text uploaded by the teacher
  createdAt: string;
  folderId?: string | null;
  gamesGenerated: { [gameKey: string]: boolean }; // Track which games have generated questions
  gameData: {
    goldenBell?: GoldenBellData;
    millionaire?: MillionaireData;
    olympia?: OlympiaData;
    wheelOfFortune?: WheelOfFortuneData;
    pictogram?: PictogramData;
    kahoot?: KahootData;
    quizizz?: QuizizzData;
    escapeRoom?: EscapeRoomData;
    secretCode?: SecretCodeData;
    treasureHunt?: TreasureHuntData;
  };
}

// 1. Rung Chuông Vàng (Golden Bell)
export interface GoldenBellQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  explanation: string;
}
export interface GoldenBellData {
  questions: GoldenBellQuestion[];
}

// 2. Ai Là Triệu Phú (Millionaire)
export interface MillionaireQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  level: number; // 1 to 15
  explanation: string;
  hints: {
    callFriend: string;
    audiencePoll: number[]; // Array of 4 percentages adding up to 100
    fiftyFifty: number[]; // Two option indices to KEEP (one is correct)
  };
}
export interface MillionaireData {
  questions: MillionaireQuestion[]; // Exactly 15 questions, from level 1 to 15
}

// 3. Đường Lên Đỉnh Olympia
export interface OlympiaRound1Question {
  id: string;
  question: string;
  answer: string; // Text answer (short) or option
  options?: string[]; // Optional multiple choice
}
export interface OlympiaRound2 {
  keyword: string; // Obstacle word
  cluesCount: number;
  clues: {
    question: string;
    options: string[];
    correctAnswer: number;
    answerLength: number; // Length of the horizontal word
    rowWord: string; // The actual answer for this row
  }[];
}
export interface OlympiaRound3Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
export interface OlympiaRound4Question {
  id: string;
  points: number; // 20, 30, or 40 points
  question: string;
  correctAnswer: string;
  options?: string[];
  explanation: string;
}
export interface OlympiaData {
  round1: OlympiaRound1Question[]; // Khởi động (10 questions)
  round2: OlympiaRound2; // Vượt chướng ngại vật
  round3: OlympiaRound3Question[]; // Tăng tốc (4 questions)
  round4: OlympiaRound4Question[]; // Về đích (3 questions: 20pt, 30pt, 40pt)
}

// 4. Chiếc Nón Kỳ Diệu (Wheel of Fortune)
export interface WheelWord {
  word: string; // The term to guess (uppercase, no accents or with standard format)
  clue: string; // Definition or context clue
}
export interface WheelOfFortuneData {
  words: WheelWord[];
}

// 5. Đuổi Hình Bắt Chữ (Pictogram)
export interface PictogramWord {
  word: string; // The answer (e.g., "CHIEN TRANH", "QUANG DUONG")
  emojis: string; // Visual representation (e.g., "⚔️💥🛡️")
  visualDescription: string; // Text riddle / picture description
  explanation: string; // Historical or scientific background explanation
}
export interface PictogramData {
  puzzles: PictogramWord[];
}

// 6. Kahoot Quiz
export interface KahootQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number; // in seconds, default 10 or 20
  points: number; // e.g. 1000
}
export interface KahootData {
  questions: KahootQuestion[];
}

// 7. Quizizz Challenge
export interface QuizizzQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  memeSuccess: string; // Fun feedback if correct
  memeFail: string; // Fun feedback if wrong
}
export interface QuizizzData {
  questions: QuizizzQuestion[];
}

// 8. Escape Room Giáo dục
export interface EscapeRoomLevel {
  levelNum: number;
  type: "padlock" | "anagram" | "matching" | "riddle" | "code";
  title: string;
  scenario: string; // Short story/description
  question: string;
  options?: string[]; // For padlock or matching
  correctAnswer: string; // The code or word that unlocks it
  explanation: string;
  hint: string;
}
export interface EscapeRoomData {
  levels: EscapeRoomLevel[]; // Exactly 5 levels
}

// 9. Mật Mã Bí Ẩn (Mysterious Code)
export interface SecretCodeData {
  secretWord: string; // Wordle-style word (5-6 letters, related to lesson)
  clues: string[]; // Progression of clues that can be unlocked
  wordDefinition: string;
  explanation: string;
}

// 10. Truy Tìm Kho Báu (Treasure Hunt)
export interface TreasureHuntStation {
  stationNum: number;
  name: string;
  coordinates: { x: number; y: number }; // Simulated map location percentages
  challengeType: "multiple-choice" | "true-false" | "fill-blank" | "cipher";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  cipherHint?: string; // Decrypted hint for cipher station
}
export interface TreasureHuntData {
  stations: TreasureHuntStation[]; // 5 stations
}

export interface StudentProgress {
  id?: string;
  studentName: string;
  studentClass: string;
  lessonId: string;
  gameKey: string;
  score: number;
  maxScore: number;
  completedAt: string;
  durationSeconds: number;
  teacherCode?: string;
  classCode?: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
}

export interface Teacher {
  code: string;
  name: string;
  createdAt: string;
  folders?: Folder[];
  password?: string;
  hasPassword?: boolean;
}

export interface ClassCode {
  code: string;
  name: string;
  teacherCode: string;
  assignedLessonIds: string[];
  createdAt: string;
}
