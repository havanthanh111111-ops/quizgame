/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Image, Lightbulb, CheckCircle, RotateCcw, ArrowRight, HelpCircle, Trophy } from "lucide-react";
import { PictogramData } from "../../types";
import { playSound } from "../../utils/sound";
import { MathText } from "../MathText";

interface Props {
  data: PictogramData;
  studentName: string;
  studentClass: string;
  lessonId: string;
  onComplete: (score: number, maxScore: number) => void;
  onBack: () => void;
}

function cleanText(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]/g, "");
}

export default function PictogramGame({ data, studentName, studentClass, lessonId, onComplete, onBack }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [guessInput, setGuessInput] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [revealedLettersCount, setRevealedLettersCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentPuzzle = data.puzzles[currentIdx];
  const cleanedAnswer = cleanText(currentPuzzle.word);

  const handleGuessSubmit = () => {
    if (isAnswered) return;

    const formattedGuess = cleanText(guessInput);
    const correct = formattedGuess === cleanedAnswer;

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      // Calculate score based on hints used (base 100, -15 per revealed letter)
      const earned = Math.max(20, 100 - (revealedLettersCount * 20));
      setScore((prev) => prev + earned);
      playSound.correct();
    } else {
      playSound.wrong();
    }
  };

  const useHint = () => {
    if (isAnswered) return;
    playSound.click();
    if (revealedLettersCount < cleanedAnswer.length - 1) {
      setRevealedLettersCount((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setIsAnswered(false);
    setIsCorrect(false);
    setGuessInput("");
    setRevealedLettersCount(0);
    playSound.click();

    if (currentIdx < data.puzzles.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
      onComplete(score, data.puzzles.length * 100);
      playSound.win();
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setScore(0);
    setGuessInput("");
    setIsAnswered(false);
    setIsCorrect(false);
    setRevealedLettersCount(0);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 text-center text-slate-900 shadow-xl relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-bounce" />

        <h2 className="text-3xl font-black mb-2 text-purple-600 uppercase">ĐUỔI HÌNH THÀNH CÔNG!</h2>
        <p className="text-slate-600 mb-6 font-sans font-medium">
          Thí sinh <span className="font-extrabold text-pink-600">{studentName}</span> đã giải mã thành công toàn bộ các mảnh ghép hình ảnh giáo khoa!
        </p>

        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 mb-8 max-w-xs mx-auto shadow-inner">
          <span className="text-[10px] text-slate-400 font-mono block uppercase font-black tracking-widest">TỔNG ĐIỂM SÁNG TẠO</span>
          <span className="text-4xl font-black text-pink-600 font-sans block mt-1">{score}</span>
          <span className="text-slate-500 block text-xs mt-1 font-semibold">/ {data.puzzles.length * 100} điểm tối đa</span>
        </div>

        <button
          onClick={onBack}
          className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-black px-8 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md uppercase text-xs tracking-wider"
        >
          Trở Lại Danh Sách Game
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 text-slate-900 shadow-xl animate-fade-in">
      {/* Top statistics header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-150">
        <div>
          <span className="text-xs font-mono text-purple-600 uppercase font-black tracking-widest block">
            ĐUỔI HÌNH BẮT CHỮ • CÂU {currentIdx + 1}/{data.puzzles.length}
          </span>
          <p className="text-xs text-slate-500 mt-0.5 font-bold uppercase tracking-wide">Thí sinh: {studentName} ({studentClass})</p>
        </div>

        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-center shadow-inner">
          <span className="text-[10px] font-mono text-slate-400 block uppercase font-black tracking-wider">ĐIỂM HIỆN TẠI</span>
          <span className="text-sm font-black text-purple-600">{score}</span>
        </div>
      </div>

      {/* REBUS CANVAS: Visual emoji board representation */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-2xl border-2 border-purple-100/60 p-8 text-center mb-6 shadow-sm relative flex flex-col items-center justify-center min-h-[160px]">
        {/* Dynamic decorative icons */}
        <div className="absolute top-4 left-4 text-purple-500/10"><Image className="w-20 h-20" /></div>

        <motion.div
          key={currentIdx}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl md:text-7xl mb-4 select-none filter drop-shadow-sm cursor-help tracking-widest"
          title="Dữ kiện hình vẽ Emoji"
        >
          {currentPuzzle.emojis}
        </motion.div>

        {/* Picture descriptive riddle */}
        <div className="text-sm md:text-base text-slate-700 max-w-lg mt-2 font-bold italic">
          "<MathText text={currentPuzzle.visualDescription} />"
        </div>
      </div>

      {/* Answer Slots Display showing letters and blanks */}
      <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
        {cleanedAnswer.split("").map((letter, idx) => {
          const isRevealedByHint = idx < revealedLettersCount;
          const isSolved = isAnswered && isCorrect;

          return (
            <div
              key={idx}
              className={`w-7 h-9 rounded border flex items-center justify-center font-black font-mono text-sm transition-all duration-300 ${
                isSolved
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                  : isRevealedByHint
                  ? "bg-purple-50 border-purple-500 text-purple-700 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-transparent"
              }`}
            >
              {(isRevealedByHint || isSolved) ? letter : "?"}
            </div>
          );
        })}
      </div>

      {/* Guess Input Section */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Gõ đáp án viết liền không dấu, không cách..."
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            disabled={isAnswered}
            onKeyDown={(e) => e.key === "Enter" && handleGuessSubmit()}
            className="bg-white border-2 border-slate-200 focus:border-purple-500 focus:outline-none rounded-xl px-4 py-3 text-sm font-mono uppercase tracking-wider text-slate-800 w-full font-bold shadow-inner"
          />

          <button
            onClick={useHint}
            disabled={isAnswered || revealedLettersCount >= cleanedAnswer.length - 1}
            title="Mở thêm 1 ký tự gợi ý"
            className="bg-slate-50 border-2 border-slate-200 text-purple-600 hover:bg-slate-100 px-4 py-3 rounded-xl active:scale-95 transition-all shrink-0 flex items-center gap-1 cursor-pointer font-black text-xs"
          >
            <Lightbulb className="w-4 h-4 text-yellow-500 animate-pulse" />
            <span className="text-xs font-black hidden sm:inline uppercase tracking-wider">Gợi ý</span>
          </button>
        </div>

        {!isAnswered ? (
          <button
            onClick={handleGuessSubmit}
            disabled={!guessInput}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black py-3.5 rounded-xl text-xs transition-all shadow-md active:scale-95 uppercase tracking-widest cursor-pointer"
          >
            Kiểm Tra Đáp Án
          </button>
        ) : null}
      </div>

      {/* Answer feedback and Explanations */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-100 mt-6 shadow-inner"
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <span className="text-emerald-600 font-black flex items-center gap-1 text-sm uppercase tracking-widest font-sans">
                  🎉 GIẢI ĐỐ THÀNH CÔNG!
                </span>
              ) : (
                <span className="text-red-500 font-black flex items-center gap-1 text-sm uppercase tracking-widest font-sans">
                  ❌ CHƯA CHÍNH XÁC
                </span>
              )}
            </div>

            <p className="text-slate-700 font-mono text-sm mb-3 font-semibold">
              Đáp án chính xác: <span className="text-yellow-600 font-black uppercase">{currentPuzzle.word}</span>
            </p>

            <div className="text-slate-600 text-sm leading-relaxed mb-4 font-medium">
              <MathText text={currentPuzzle.explanation} />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
              >
                Câu Tiếp Theo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer controls */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-105 text-xs text-slate-400 font-bold">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
        >
          ← Trở lại sảnh
        </button>
        <span className="italic uppercase text-[10px] tracking-wider text-slate-400">Mẹo: Tên khái niệm được viết liền và viết hoa không dấu</span>
      </div>
    </div>
  );
}
