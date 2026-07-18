/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, Shield, Zap, Snowflake, HelpCircle, Trophy, Award, Flame } from "lucide-react";
import { QuizizzData } from "../../types";
import { MathText } from "../MathText";

interface Props {
  data: QuizizzData;
  studentName: string;
  studentClass: string;
  lessonId: string;
  onComplete: (score: number, maxScore: number) => void;
  onBack: () => void;
}

export default function QuizizzGame({ data, studentName, studentClass, lessonId, onComplete, onBack }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Power-ups inventory
  const [powerUps, setPowerUps] = useState([
    { id: "shield", name: "Khiên Bảo Vệ 🛡️", description: "Bảo vệ điểm số nếu chọn đáp án sai.", count: 1, active: false },
    { id: "double", name: "Nhân Đôi Điểm ⚡", description: "Nhận gấp đôi điểm nếu trả lời đúng.", count: 1, active: false },
    { id: "freeze", name: "Băng Đóng Băng ❄️", description: "Nhận trọn vẹn điểm tối đa không bị trừ theo giây.", count: 1, active: false }
  ]);

  const currentQuestion = data.questions[currentIdx];

  const togglePowerUp = (id: string) => {
    if (isAnswered) return;
    setPowerUps((prev) =>
      prev.map((pw) => {
        if (pw.id === id && pw.count > 0) {
          // Deactivate others, activate this one
          return { ...pw, active: !pw.active };
        }
        return { ...pw, active: false };
      })
    );
  };

  const handleOptionSelect = (optionIdx: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIdx);
    setIsAnswered(true);

    const correct = optionIdx === currentQuestion.correctAnswer;

    // Check active power-ups
    const doubleActive = powerUps.find(p => p.id === "double")?.active;
    const shieldActive = powerUps.find(p => p.id === "shield")?.active;

    let pointsEarned = 0;
    if (correct) {
      pointsEarned = 100;
      if (streak > 2) pointsEarned += 25; // Streak bonus
      if (doubleActive) pointsEarned *= 2;

      setStreak((prev) => prev + 1);
      setScore((prev) => prev + pointsEarned);
    } else {
      setStreak(0);
      if (!shieldActive) {
        // Penalty or no points
      }
    }

    // Deduct used powerup count
    setPowerUps((prev) =>
      prev.map((pw) => {
        if (pw.active) {
          return { ...pw, count: pw.count - 1, active: false };
        }
        return pw;
      })
    );

    // Roll random powerup award on correct streak
    if (correct && Math.random() > 0.6) {
      awardRandomPowerUp();
    }
  };

  const awardRandomPowerUp = () => {
    const rIdx = Math.floor(Math.random() * powerUps.length);
    setPowerUps((prev) =>
      prev.map((pw, idx) => (idx === rIdx ? { ...pw, count: pw.count + 1 } : pw))
    );
  };

  const handleNext = () => {
    setIsAnswered(false);
    setSelectedOption(null);

    if (currentIdx < data.questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
      onComplete(score, data.questions.length * 100);
    }
  };

  if (isFinished) {
    return (
      <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 text-center text-slate-900 shadow-xl relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-pulse" />

        <h2 className="text-3xl font-black mb-2 text-violet-600 uppercase animate-fade-in">QUYẾT ĐẤU HOÀN THÀNH!</h2>
        <p className="text-slate-600 mb-6 font-sans font-medium">
          Thí sinh <span className="font-extrabold text-violet-600">{studentName}</span> đã chinh phục toàn bộ đấu trường bài tập tự luyện Quizizz!
        </p>

        <div className="bg-violet-50 rounded-2xl p-6 border border-violet-100 mb-8 max-w-xs mx-auto shadow-inner">
          <Award className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
          <span className="text-[10px] text-slate-400 font-mono block uppercase font-black tracking-widest">TỔNG ĐIỂM HOẠT ĐỘNG</span>
          <span className="text-4xl font-black text-violet-600 font-sans block mt-1">{score}</span>
        </div>

        <button
          onClick={onBack}
          className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-black px-8 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md uppercase text-xs tracking-wider"
        >
          Trở Lại Danh Sách Game
        </button>
      </div>
    );
  }

  const isCorrect = selectedOption === currentQuestion.correctAnswer;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 text-slate-900 shadow-xl animate-fade-in">
      {/* Top statistics indicators */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-slate-150 gap-4">
        <div>
          <span className="text-xs font-mono text-violet-600 uppercase font-black tracking-widest block">
            QUIZIZZ CHALLENGE • CÂU {currentIdx + 1}/{data.questions.length}
          </span>
          <p className="text-xs text-slate-500 mt-0.5 font-bold uppercase tracking-wide">Thí sinh: {studentName} ({studentClass})</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak indicator */}
          {streak > 0 && (
            <div className="bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse fill-orange-500" />
              <span className="text-xs font-mono font-black text-orange-600">{streak} Liên tiếp</span>
            </div>
          )}

          <div className="bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-200 text-center shadow-inner">
            <span className="text-[10px] font-mono text-slate-400 block uppercase font-black tracking-wider">ĐIỂM SỐ CHUNG</span>
            <span className="text-sm font-black text-violet-600">{score}</span>
          </div>
        </div>
      </div>

      {/* Power-ups Inventory Rail */}
      <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-150 mb-6 shadow-inner">
        <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block mb-2">Hộp Trợ Giúp Power-ups (Nhấn kích hoạt trước khi trả lời)</span>
        <div className="flex gap-2 flex-wrap">
          {powerUps.map((pw) => (
            <button
              key={pw.id}
              onClick={() => togglePowerUp(pw.id)}
              disabled={pw.count === 0 || isAnswered}
              className={`px-3 py-1.5 rounded-lg border-2 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                pw.active
                  ? "bg-violet-100 border-violet-500 text-violet-800 shadow-sm"
                  : pw.count === 0
                  ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-white border-slate-200 text-slate-700 hover:border-violet-500 shadow-sm hover:bg-slate-50"
              }`}
            >
              <span>{pw.name}</span>
              <span className="bg-slate-200/80 px-1.5 py-0.5 rounded-md text-[9px] font-mono border border-slate-300 text-violet-700 font-bold">
                x{pw.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main question box */}
      <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-105 mb-6 text-center shadow-inner">
        <h2 className="text-base md:text-lg font-sans font-black leading-relaxed text-slate-800 text-left md:text-center">
          <MathText text={currentQuestion.question} />
        </h2>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {currentQuestion.options.map((option, idx) => {
          let btnClass = "border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 hover:border-slate-300 text-slate-700 shadow-sm";
          if (isAnswered) {
            if (idx === currentQuestion.correctAnswer) {
              btnClass = "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm font-black";
            } else if (idx === selectedOption) {
              btnClass = "border-red-500 bg-red-50 text-red-700 shadow-sm font-black";
            } else {
              btnClass = "border-slate-100 bg-slate-50/20 text-slate-400";
            }
          }

          return (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleOptionSelect(idx)}
              className={`flex items-start gap-3 text-left p-4 rounded-xl border-2 text-sm md:text-base font-sans font-bold transition-all cursor-pointer ${btnClass}`}
            >
              <span className="font-mono text-xs bg-white border border-slate-200 w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-violet-600 font-bold">
                {String.fromCharCode(65 + idx)}
              </span>
              <span><MathText text={option} /></span>
            </button>
          );
        })}
      </div>

      {/* Feedback meme cards */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl border-2 p-6 text-center relative overflow-hidden ${
              isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
            }`}
          >
            {/* Playful cartoon reaction bubble */}
            <div className="text-xl md:text-2xl font-black uppercase tracking-wider mb-2 font-sans text-slate-800">
              {isCorrect ? `✨ "${currentQuestion.memeSuccess}"` : `💔 "${currentQuestion.memeFail}"`}
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-150 text-left mb-4 shadow-sm">
              <span className="text-[10px] font-mono text-slate-400 block uppercase mb-1 font-black">KIẾN THỨC BỔ TRỢ</span>
              <p className="text-slate-700 text-sm leading-relaxed font-semibold"><MathText text={currentQuestion.explanation} /></p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
              >
                Câu Tiếp Theo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer back toggle */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-150 text-xs text-slate-400 font-bold">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
        >
          ← Thoát
        </button>
        <span className="italic uppercase text-[10px] tracking-wider text-slate-400">Gợi ý: Thu thập chuỗi liên tiếp để nhận thêm power-ups hỗ trợ!</span>
      </div>
    </div>
  );
}
