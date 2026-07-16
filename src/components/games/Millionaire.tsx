/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, Users, PhoneCall, Award, Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { MillionaireData } from "../../types";
import { playSound } from "../../utils/sound";

interface Props {
  data: MillionaireData;
  studentName: string;
  studentClass: string;
  lessonId: string;
  onComplete: (score: number, maxScore: number) => void;
  onBack: () => void;
}

const MONEY_MILESTONES = [
  "200.000", "400.000", "600.000", "1.000.000", "2.000.000",
  "3.000.000", "6.000.000", "10.000.000", "14.000.000", "22.000.000",
  "30.000.000", "40.000.000", "60.000.000", "85.000.000", "150.000.000"
];

const MILESTONE_SCORES = [
  2, 4, 6, 10, 20,
  30, 60, 100, 140, 220,
  300, 400, 600, 850, 1500
];

export default function Millionaire({ data, studentName, studentClass, lessonId, onComplete, onBack }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Lifelines
  const [usedFiftyFifty, setUsedFiftyFifty] = useState(false);
  const [activeFiftyFifty, setActiveFiftyFifty] = useState<number[] | null>(null);

  const [usedAudience, setUsedAudience] = useState(false);
  const [activeAudience, setActiveAudience] = useState<number[] | null>(null);

  const [usedCall, setUsedCall] = useState(false);
  const [activeCallHint, setActiveCallHint] = useState<string | null>(null);

  const [isLockedIn, setIsLockedIn] = useState(false);

  const currentQuestion = data.questions[currentIdx] || data.questions[0];

  const handleOptionSelect = (optionIdx: number) => {
    if (isAnswered || isLockedIn) return;
    setSelectedOption(optionIdx);
  };

  const handleLockIn = () => {
    if (selectedOption === null) return;
    setIsLockedIn(true);
    playSound.click();

    // Simulate lock-in suspense
    setTimeout(() => {
      setIsAnswered(true);
      setIsLockedIn(false);
      const correct = selectedOption === currentQuestion.correctAnswer;
      if (correct) {
        setScore(MILESTONE_SCORES[currentIdx]);
        playSound.correct();
      } else {
        playSound.wrong();
      }
    }, 1500);
  };

  const useFiftyFifty = () => {
    if (usedFiftyFifty || isAnswered || isLockedIn) return;
    setUsedFiftyFifty(true);
    playSound.click();
    // Keep correct and one random wrong option
    const kept = currentQuestion.hints?.fiftyFifty || [currentQuestion.correctAnswer];
    if (kept.length === 1) {
      // Fallback
      let wrongIdx = (currentQuestion.correctAnswer + 1) % 4;
      kept.push(wrongIdx);
    }
    setActiveFiftyFifty(kept);
  };

  const useAudience = () => {
    if (usedAudience || isAnswered || isLockedIn) return;
    setUsedAudience(true);
    playSound.click();
    const votes = currentQuestion.hints?.audiencePoll || [10, 15, 60, 15]; // fallback
    setActiveAudience(votes);
  };

  const useCall = () => {
    if (usedCall || isAnswered || isLockedIn) return;
    setUsedCall(true);
    playSound.click();
    const hint = currentQuestion.hints?.callFriend || "Tôi nghĩ đáp án chính là một lựa chọn hợp lý nhất!";
    setActiveCallHint(hint);
  };

  const handleWalkAway = () => {
    setIsFinished(true);
    onComplete(score, 1500);
    playSound.win();
  };

  const handleNext = () => {
    const isCorrect = selectedOption === currentQuestion.correctAnswer;

    if (!isCorrect) {
      // Game over, calculate check-point points (milestone 5 or 10)
      let finalScore = 0;
      if (currentIdx >= 9) {
        finalScore = MILESTONE_SCORES[9]; // Level 10 checkpoint
      } else if (currentIdx >= 4) {
        finalScore = MILESTONE_SCORES[4]; // Level 5 checkpoint
      }
      setScore(finalScore);
      setIsFinished(true);
      onComplete(finalScore, 1500);
      playSound.fail();
      return;
    }

    // Clear active lifelines
    setActiveFiftyFifty(null);
    setActiveAudience(null);
    setActiveCallHint(null);
    setSelectedOption(null);
    setIsAnswered(false);

    if (currentIdx < 14) {
      setCurrentIdx((prev) => prev + 1);
      playSound.click();
    } else {
      // Won the ultimate prize!
      setIsFinished(true);
      onComplete(1500, 1500);
      playSound.win();
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    setUsedFiftyFifty(false);
    setUsedAudience(false);
    setUsedCall(false);
    setActiveFiftyFifty(null);
    setActiveAudience(null);
    setActiveCallHint(null);
    setIsLockedIn(false);
  };

  if (isFinished) {
    const isUltimateWinner = currentIdx === 14 && selectedOption === currentQuestion.correctAnswer;
    return (
      <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 text-center text-slate-900 shadow-xl relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <Trophy className={`w-20 h-20 mx-auto mb-6 ${isUltimateWinner ? "text-yellow-400 animate-bounce" : "text-slate-300"}`} />

        <h2 className="text-3xl font-black font-sans tracking-tight mb-2 uppercase text-indigo-600">
          {isUltimateWinner ? "KỶ LỤC TRIỆU PHÚ!" : "KẾT THÚC CUỘC CHƠI"}
        </h2>
        <p className="text-slate-600 mb-6 font-sans font-medium">
          Thí sinh <span className="font-extrabold text-indigo-600">{studentName}</span> lớp <span className="font-extrabold text-indigo-600">{studentClass}</span> đã hoàn thành hành trình chinh phục tri thức.
        </p>

        <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 mb-8 max-w-xs mx-auto shadow-inner">
          <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <span className="text-[10px] text-slate-400 font-mono block uppercase font-black tracking-widest">PHẦN THƯỞNG ĐẠT ĐƯỢC</span>
          <span className="text-3xl font-black text-indigo-600 font-sans block mt-1">
            {currentIdx > 0 || isUltimateWinner ? MONEY_MILESTONES[isUltimateWinner ? 14 : currentIdx - 1] : "0"} ĐIỂM
          </span>
          <span className="text-slate-500 block text-xs mt-1 font-semibold">(Tương đương {score} điểm hệ thống)</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRestart}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black px-8 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md uppercase text-xs tracking-wider"
          >
            <RotateCcw className="w-4 h-4" />
            Chơi Lại
          </button>
          <button
            onClick={onBack}
            className="bg-slate-100 text-slate-700 font-black px-8 py-3 rounded-xl hover:bg-slate-200 active:scale-95 transition-all border border-slate-200 uppercase text-xs tracking-wider"
          >
            Danh Sách Trò Chơi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full max-w-5xl mx-auto text-slate-900 animate-fade-in">
      {/* Sidebar: Progress list */}
      <div className="lg:col-span-1 bg-slate-50 border-2 border-slate-200/80 rounded-3xl p-5 hidden md:flex flex-col justify-between shadow-sm">
        <div>
          <h3 className="text-[10px] font-mono font-black uppercase text-slate-400 mb-4 tracking-widest">MỐC TIỀN THƯỞNG</h3>
          <div className="space-y-1.5">
            {[...MONEY_MILESTONES].reverse().map((amount, idx) => {
              const originalLevel = 14 - idx;
              const isCurrent = currentIdx === originalLevel;
              const isPassed = currentIdx > originalLevel;
              const isMilestone = originalLevel === 4 || originalLevel === 9 || originalLevel === 14;

              let textClass = "text-slate-400 font-semibold";
              if (isCurrent) textClass = "text-indigo-700 font-extrabold bg-indigo-50 border-l-4 border-indigo-600 px-2.5 py-1 rounded-r shadow-sm";
              else if (isPassed) textClass = "text-indigo-500 font-bold";
              else if (isMilestone) textClass = "text-slate-700 font-bold";

              return (
                <div key={originalLevel} className={`flex justify-between items-center text-xs font-mono ${textClass}`}>
                  <span>{originalLevel + 1}</span>
                  <span>{amount}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200/80">
          <button
            onClick={handleWalkAway}
            disabled={currentIdx === 0 || isAnswered || isLockedIn}
            className="w-full bg-red-50 text-red-600 border border-red-200 font-black py-2.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-100 transition-colors disabled:opacity-40"
          >
            Dừng Cuộc Chơi (Dành Điểm)
          </button>
        </div>
      </div>

      {/* Main Game Interface */}
      <div className="lg:col-span-3 bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden shadow-lg">
        {/* Top Header info */}
        <div>
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-150">
            <div>
              <span className="text-xs font-mono text-indigo-600 uppercase font-black tracking-wider block">
                AI LÀ TRIỆU PHÚ • CÂU {currentIdx + 1}/15
              </span>
              <p className="text-xs text-slate-500 mt-0.5 font-bold uppercase tracking-wide">Thí sinh: {studentName} ({studentClass})</p>
            </div>

            {/* Lifelines Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={useFiftyFifty}
                disabled={usedFiftyFifty || isAnswered || isLockedIn}
                title="Sự trợ giúp 50:50"
                className={`px-3 py-1.5 rounded-full border text-[10px] font-mono font-black uppercase transition-all ${
                  usedFiftyFifty
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                }`}
              >
                50:50
              </button>
              <button
                onClick={useAudience}
                disabled={usedAudience || isAnswered || isLockedIn}
                title="Hỏi ý kiến khán giả trong trường quay"
                className={`p-2 rounded-full border transition-all ${
                  usedAudience
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                }`}
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={useCall}
                disabled={usedCall || isAnswered || isLockedIn}
                title="Gọi điện thoại cho người thân"
                className={`p-2 rounded-full border transition-all ${
                  usedCall
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                }`}
              >
                <PhoneCall className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lifelines Visual Display */}
          <AnimatePresence>
            {activeCallHint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 mb-4 text-sm text-blue-800 flex gap-3 items-start shadow-sm"
              >
                <PhoneCall className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block text-[10px] uppercase text-blue-600 tracking-wider mb-1">Người thân tư vấn:</span>
                  <p className="italic font-bold">"{activeCallHint}"</p>
                </div>
              </motion.div>
            )}

            {activeAudience && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl p-4 mb-4 shadow-sm"
              >
                <span className="font-black block text-[10px] uppercase text-indigo-600 tracking-widest mb-3">Kết quả ý kiến khán giả:</span>
                <div className="grid grid-cols-4 gap-2 h-20 items-end max-w-sm mx-auto">
                  {activeAudience.map((pct, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-indigo-600 w-full rounded-t transition-all duration-500"
                        style={{ height: `${pct * 0.7}px` }}
                      />
                      <span className="text-[10px] font-mono mt-1.5 font-bold text-slate-600">{String.fromCharCode(65 + idx)}: {pct}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question Display */}
          <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 mb-6 text-center shadow-inner relative">
            <h2 className="text-base md:text-xl font-sans font-black leading-relaxed text-slate-800 text-left md:text-center">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, idx) => {
              const isFiftyFiftyHidden = activeFiftyFifty && !activeFiftyFifty.includes(idx);

              let btnClass = "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:shadow-sm";

              if (isFiftyFiftyHidden) {
                btnClass = "border-slate-100 bg-slate-50/50 text-slate-400 cursor-not-allowed select-none opacity-40";
              } else if (isAnswered) {
                if (idx === currentQuestion.correctAnswer) {
                  btnClass = "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm";
                } else if (idx === selectedOption) {
                  btnClass = "border-red-500 bg-red-50 text-red-700 shadow-sm";
                } else {
                  btnClass = "border-slate-100 bg-slate-50/50 text-slate-400";
                }
              } else if (idx === selectedOption) {
                btnClass = isLockedIn
                  ? "border-amber-500 bg-amber-50 text-amber-700 animate-pulse"
                  : "border-indigo-500 bg-indigo-50 text-indigo-700";
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered || isLockedIn || !!isFiftyFiftyHidden}
                  onClick={() => handleOptionSelect(idx)}
                  className={`flex items-start gap-3 text-left p-4 rounded-2xl border font-sans font-bold transition-all duration-200 text-sm md:text-base ${btnClass}`}
                >
                  <span className="font-mono font-black text-xs bg-indigo-50 border border-indigo-100 w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-indigo-600">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className={`flex-1 mt-0.5 ${isFiftyFiftyHidden ? "opacity-10" : ""}`}>{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info/controls */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors"
          >
            ← Thoát trò chơi
          </button>

          <div className="flex gap-4">
            {selectedOption !== null && !isAnswered && !isLockedIn && (
              <button
                onClick={handleLockIn}
                className="bg-amber-500 hover:bg-amber-400 text-white font-black px-6 py-2.5 rounded-xl active:scale-95 transition-all shadow-md text-xs uppercase tracking-widest"
              >
                Chốt Đáp Án
              </button>
            )}

            {isAnswered && (
              <div className="flex items-center gap-4">
                <p className="text-xs text-slate-500 max-w-xs text-right italic font-medium leading-normal hidden sm:block">
                  {currentQuestion.explanation}
                </p>
                <button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black px-6 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md text-xs uppercase tracking-widest flex items-center gap-1.5"
                >
                  Tiếp Tục
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
