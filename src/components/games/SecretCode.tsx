/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, Key, Trophy, Award, Trash2, ArrowRight, CheckCircle, RotateCcw } from "lucide-react";
import { SecretCodeData } from "../../types";
import { MathText } from "../MathText";

interface Props {
  data: SecretCodeData;
  studentName: string;
  studentClass: string;
  lessonId: string;
  onComplete: (score: number, maxScore: number) => void;
  onBack: () => void;
}

const MAX_GUESSES = 6;

export default function SecretCode({ data, studentName, studentClass, lessonId, onComplete, onBack }: Props) {
  const [score, setScore] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [hintLevel, setHintLevel] = useState(0); // 0, 1, or 2 hint level reveal

  const secretWord = data.secretWord.toUpperCase().replace(/[^A-Z]/g, "");
  const wordLength = secretWord.length;

  const handleKeyPress = (char: string) => {
    if (guesses.length >= MAX_GUESSES || isFinished) return;
    if (char === "ENTER") {
      submitGuess();
    } else if (char === "BACKSPACE" || char === "BACK") {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (currentGuess.length < wordLength && /^[A-Z]$/i.test(char)) {
      setCurrentGuess((prev) => (prev + char).toUpperCase());
    }
  };

  const submitGuess = () => {
    if (currentGuess.length !== wordLength) return;

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess("");

    if (currentGuess === secretWord) {
      setIsWon(true);
      setIsFinished(true);
      const points = Math.max(10, 100 - (newGuesses.length - 1) * 15 - hintLevel * 20);
      setScore(points);
      onComplete(points, 100);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setIsWon(false);
      setIsFinished(true);
      onComplete(0, 100);
    }
  };

  const useHint = () => {
    if (hintLevel < 2) {
      setHintLevel((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    setGuesses([]);
    setCurrentGuess("");
    setIsFinished(false);
    setIsWon(false);
    setScore(0);
    setHintLevel(0);
  };

  // Keyboard layout
  const KEYBOARD_ROWS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"]
  ];

  // Map letter to status
  const getLetterStatus = (letter: string) => {
    let status = "default";
    guesses.forEach((guess) => {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === letter) {
          if (secretWord[i] === letter) {
            status = "correct";
          } else if (secretWord.includes(letter) && status !== "correct") {
            status = "present";
          } else if (status === "default") {
            status = "absent";
          }
        }
      }
    });
    return status;
  };

  if (isFinished) {
    return (
      <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 text-center text-slate-900 shadow-xl relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-indigo-500" />
        <Trophy className={`w-20 h-20 mx-auto mb-6 ${isWon ? "text-yellow-500 animate-bounce" : "text-slate-400"}`} />

        <h2 className="text-3xl font-black mb-2 text-teal-600 uppercase">
          {isWon ? "BẺ KHÓA THÀNH CÔNG!" : "KHÓA ĐÃ KHÓA LẠI"}
        </h2>
        <p className="text-slate-600 mb-6 font-sans font-medium">
          Mật mã bí ẩn của bài học tuần này là: <span className="font-mono text-teal-600 font-black tracking-widest block text-lg mt-1">{secretWord}</span>
        </p>

        {isWon ? (
          <div className="bg-teal-50 rounded-2xl p-6 border border-teal-100 mb-8 max-w-xs mx-auto shadow-inner">
            <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <span className="text-[10px] text-slate-400 font-mono block uppercase font-black tracking-widest">TỔNG ĐIỂM GIẢI MÃ</span>
            <span className="text-4xl font-black text-teal-600 font-sans block mt-1">{score}</span>
          </div>
        ) : (
          <p className="text-slate-500 mb-8 text-sm font-semibold max-w-sm mx-auto">Rất tiếc! Bạn đã hết {MAX_GUESSES} lượt thử. Hãy ôn tập lại bài học và thử sức một lần nữa.</p>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={handleRestart}
            className="bg-slate-100 text-slate-700 border border-slate-200 font-black px-6 py-3 rounded-xl hover:bg-slate-200 active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer"
          >
            Thử Lại
          </button>
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-black px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wider shadow-md cursor-pointer"
          >
            Trở Lại Danh Sách Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-6 text-slate-900 shadow-xl animate-fade-in">
      {/* Top statistics header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-150">
        <div>
          <span className="text-xs font-mono text-teal-600 uppercase font-black tracking-widest block">
            MẬT MÃ BÍ ẨN • {MAX_GUESSES} LƯỢT THỬ
          </span>
          <p className="text-xs text-slate-500 mt-0.5 font-bold uppercase tracking-wide">Thí sinh: {studentName} ({studentClass})</p>
        </div>

        <button
          onClick={useHint}
          disabled={hintLevel >= 2}
          className="bg-slate-50 border border-slate-200 text-teal-600 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hintLevel === 0 && "🔓 Mở gợi ý 1"}
          {hintLevel === 1 && "🔓 Mở gợi ý 2"}
          {hintLevel >= 2 && "🔓 Đã mở hết gợi ý"}
        </button>
      </div>

      {/* Clue Panel depending on hintLevel */}
      <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-105 mb-6 shadow-inner">
        <span className="text-[10px] font-mono font-black text-teal-600 block uppercase mb-1 tracking-wider">Mã lực gợi ý bài học</span>
        <div className="text-xs text-slate-700 leading-relaxed font-sans font-semibold">
          <MathText text={data.wordDefinition} />
        </div>
        {hintLevel >= 1 && (
          <div className="text-xs text-amber-600 mt-2 border-t border-slate-200 pt-2 font-black leading-relaxed">
            💡 Gợi ý bổ sung: <MathText text={data.clues[0]} />
          </div>
        )}
        {hintLevel >= 2 && (
          <div className="text-xs text-emerald-600 mt-1 font-black leading-relaxed">
            💡 Gợi ý bổ sung 2: <MathText text={data.clues[1]} />
          </div>
        )}
      </div>

      {/* Word Grid */}
      <div className="grid gap-2 mb-8 justify-center" style={{ gridTemplateRows: `repeat(${MAX_GUESSES}, minmax(0, 1fr))` }}>
        {Array.from({ length: MAX_GUESSES }).map((_, rIdx) => {
          const guess = guesses[rIdx];
          const isCurrentRow = rIdx === guesses.length;

          return (
            <div key={rIdx} className="flex gap-2 justify-center">
              {Array.from({ length: wordLength }).map((_, cIdx) => {
                let char = "";
                let status = "empty";

                if (guess) {
                  char = guess[cIdx];
                  if (secretWord[cIdx] === char) {
                    status = "correct";
                  } else if (secretWord.includes(char)) {
                    status = "present";
                  } else {
                    status = "absent";
                  }
                } else if (isCurrentRow) {
                  char = currentGuess[cIdx] || "";
                  status = char ? "toggled" : "empty";
                }

                let boxClass = "bg-slate-50 border-slate-200 text-slate-400 font-bold";
                if (status === "toggled") boxClass = "bg-white border-teal-500 text-teal-600 font-black animate-pulse shadow-sm";
                if (status === "correct") boxClass = "bg-emerald-500 border-emerald-600 text-white font-black shadow-sm";
                if (status === "present") boxClass = "bg-amber-400 border-amber-500 text-slate-900 font-black shadow-sm";
                if (status === "absent") boxClass = "bg-slate-150 border-slate-200 text-slate-400";

                return (
                  <div
                    key={cIdx}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold font-mono text-base transition-all duration-300 ${boxClass}`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Virtual Keyboard */}
      <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border-2 border-slate-150 shadow-inner">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1 justify-center">
            {row.map((key) => {
              const status = getLetterStatus(key);
              let keyClass = "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm";

              if (status === "correct") keyClass = "bg-emerald-500 text-white font-black border-emerald-600";
              else if (status === "present") keyClass = "bg-amber-400 text-slate-900 font-black border-amber-500";
              else if (status === "absent") keyClass = "bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed";

              const isWide = key === "ENTER" || key === "BACK";

              return (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className={`h-10 text-[10px] md:text-xs font-mono font-black rounded-md border flex items-center justify-center transition-all cursor-pointer ${keyClass} ${
                    isWide ? "px-3 md:px-4 shrink-0" : "w-7 md:w-8"
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Back list action */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-150 text-xs text-slate-400 font-bold">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
        >
          ← Trở lại sảnh
        </button>
        <span className="italic uppercase text-[10px] tracking-wider text-slate-400">Sử dụng 2 cấp độ gợi ý để mở khóa bách khoa thư từ vựng bài học</span>
      </div>
    </div>
  );
}
