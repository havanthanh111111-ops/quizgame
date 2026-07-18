/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Trophy, RotateCcw, AlertCircle, Sparkles, Heart, Clock } from "lucide-react";
import { GoldenBellData, StudentProgress } from "../../types";
import { playSound } from "../../utils/sound";
import { MathText } from "../MathText";

interface Props {
  data: GoldenBellData;
  studentName: string;
  studentClass: string;
  lessonId: string;
  onComplete: (score: number, maxScore: number) => void;
  onBack: () => void;
}

export default function GoldenBell({ data, studentName, studentClass, lessonId, onComplete, onBack }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [lives, setLives] = useState(1); // 1 rescue opportunity
  const [isKnockedOut, setIsKnockedOut] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = data.questions[currentIdx];

  useEffect(() => {
    if (isFinished || isKnockedOut || isAnswered) return;

    if (timeLeft === 0) {
      handleTimeOut();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next > 0 && next <= 5) {
          playSound.tick();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, isKnockedOut, isFinished]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    setSelectedOption(-1); // Timeout
    playSound.wrong();
    if (lives > 0) {
      // Auto-trigger rescue notification
    } else {
      setIsKnockedOut(true);
      playSound.fail();
    }
  };

  const handleOptionSelect = (optionIdx: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIdx);
    setIsAnswered(true);

    if (optionIdx === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 10);
      playSound.correct();
    } else {
      // Wrong answer
      playSound.wrong();
    }
  };

  const handleNext = () => {
    const isCorrect = selectedOption === currentQuestion.correctAnswer;

    if (!isCorrect) {
      if (lives > 0) {
        // Use life to stay in game
        setLives(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setTimeLeft(20);
        if (currentIdx < data.questions.length - 1) {
          setCurrentIdx((prev) => prev + 1);
        } else {
          setIsFinished(true);
          onComplete(score, data.questions.length * 10);
          playSound.win();
        }
      } else {
        setIsKnockedOut(true);
        playSound.fail();
      }
      return;
    }

    // Correct
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(20);

    if (currentIdx < data.questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
      // Perfect score bonus!
      const finalScore = score + 10;
      setScore(finalScore);
      onComplete(finalScore, data.questions.length * 10);
      playSound.win();
    }
  };

  const handleRevive = () => {
    setIsKnockedOut(false);
    setLives(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(20);
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(20);
    setLives(1);
    setIsKnockedOut(false);
    setScore(0);
    setIsFinished(false);
  };

  if (isKnockedOut) {
    return (
      <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 text-center text-slate-900 shadow-xl relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500" />
        <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6 animate-pulse" />
        <h2 className="text-3xl font-black font-sans tracking-tight mb-2 uppercase text-red-600">Bạn Đã Bị Loại!</h2>
        <p className="text-slate-600 mb-6 font-sans font-medium">
          Rung Chuông Vàng yêu cầu câu trả lời chính xác tuyệt đối ở từng chặng. Bạn dừng chân ở câu hỏi số{" "}
          <span className="text-red-600 font-bold text-lg">{currentIdx + 1}</span>.
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-150 text-left max-w-2xl mx-auto">
          <p className="text-[10px] text-slate-400 font-mono uppercase font-black tracking-widest mb-1">CÂU HỎI VỪA QUA:</p>
          <p className="text-slate-700 font-bold mb-2 text-sm"><MathText text={currentQuestion.question} /></p>
          <p className="text-sm font-bold text-emerald-600">
            ✓ Đáp án đúng: <MathText text={currentQuestion.options[currentQuestion.correctAnswer]} />
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRestart}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-black px-8 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md uppercase text-xs tracking-wider"
          >
            <RotateCcw className="w-4 h-4" />
            Thi Lại Từ Đầu
          </button>
          <button
            onClick={onBack}
            className="bg-slate-100 text-slate-700 font-black px-8 py-3 rounded-xl hover:bg-slate-200 active:scale-95 transition-all border border-slate-200 uppercase text-xs tracking-wider"
          >
            Quay Lại Sảnh
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="w-full max-w-5xl mx-auto bg-white border-2 border-amber-200 rounded-3xl p-8 text-center text-slate-900 shadow-xl relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-400" />
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.5, rotate: -20 }}
            animate={{ scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
            className="w-24 h-24 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20"
          >
            <Bell className="w-12 h-12 text-white animate-bounce" />
          </motion.div>

          <Sparkles className="w-8 h-8 text-yellow-500 mx-auto mb-2 animate-pulse" />
          <h2 className="text-3xl font-black font-sans text-amber-600 mb-2 uppercase tracking-tight">
            RUNG CHUÔNG VÀNG THÀNH CÔNG!
          </h2>
          <p className="text-slate-600 max-w-md mx-auto mb-6 font-medium">
            Xin chúc mừng học sinh <span className="text-amber-600 font-extrabold">{studentName}</span> lớp{" "}
            <span className="text-amber-600 font-extrabold">{studentClass}</span> đã xuất sắc vượt qua toàn bộ 10 câu hỏi để rung chuông vàng danh giá!
          </p>

          <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200/80 mb-8 max-w-xs mx-auto shadow-inner">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <span className="text-[10px] text-amber-600 font-mono block uppercase font-black tracking-widest">TỔNG ĐIỂM ĐẠT ĐƯỢC</span>
            <span className="text-4xl font-black text-slate-800 font-sans">{score}</span>
            <span className="text-slate-500 block text-xs mt-1 font-bold">/ {data.questions.length * 10} điểm</span>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRestart}
              className="bg-slate-100 text-slate-700 font-black px-6 py-3 rounded-xl hover:bg-slate-200 active:scale-95 transition-all border border-slate-200 uppercase text-xs tracking-wider"
            >
              Chơi Lại
            </button>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-black px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg uppercase text-xs tracking-wider"
            >
              Danh Sách Trò Chơi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCorrect = selectedOption === currentQuestion.correctAnswer;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 text-slate-900 shadow-xl relative">
      {/* Top bar info */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-150">
        <div>
          <span className="text-xs font-mono text-indigo-600 uppercase font-black tracking-wider block">
            RUNG CHUÔNG VÀNG • CHẶNG {currentIdx + 1}/{data.questions.length}
          </span>
          <h3 className="text-sm font-sans font-bold text-slate-500 mt-0.5 uppercase tracking-wide">
            Thí sinh: {studentName} ({studentClass})
          </h3>
        </div>

        <div className="flex items-center gap-4">
          {/* Lifes / Rescues left */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shadow-inner">
            <Heart className={`w-4 h-4 ${lives > 0 ? "text-red-500 fill-red-500" : "text-slate-300"}`} />
            <span className="text-xs font-mono font-black uppercase text-slate-500 tracking-wider">
              {lives > 0 ? "Quyền cứu hộ" : "Hết cứu hộ"}
            </span>
          </div>

          {/* Time Limit bar */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shadow-inner">
            <Clock className={`w-4 h-4 ${timeLeft < 5 ? "text-red-500 animate-pulse" : "text-amber-500"}`} />
            <span className="text-xs font-mono font-bold text-slate-600">{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden border border-slate-200/60 shadow-inner">
        <div
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIdx) / data.questions.length) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="mb-8">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="text-lg md:text-2xl font-sans font-black text-slate-800 mb-6 leading-relaxed text-left"
        >
          <MathText text={currentQuestion.question} />
        </motion.div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, idx) => {
            let btnClass = "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 hover:shadow-sm";
            if (isAnswered) {
              if (idx === currentQuestion.correctAnswer) {
                btnClass = "bg-emerald-50 border-2 border-emerald-500 text-emerald-700 shadow-sm";
              } else if (idx === selectedOption) {
                btnClass = "bg-red-50 border-2 border-red-500 text-red-700 shadow-sm";
              } else {
                btnClass = "bg-slate-50/50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleOptionSelect(idx)}
                className={`flex items-start gap-3 text-left p-4 rounded-2xl border text-sm md:text-base font-sans font-bold transition-all duration-200 ${btnClass}`}
              >
                <span className="font-mono font-black bg-indigo-50 border border-indigo-100 w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-indigo-600 text-xs">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 mt-0.5"><MathText text={option} /></span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Answer feedback and Next controls */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-indigo-50/50 rounded-2xl p-5 border-2 border-indigo-100 mb-6 text-left shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <span className="text-emerald-600 font-black flex items-center gap-1 text-xs uppercase tracking-widest font-sans">
                  🎉 CHÍNH XÁC! (+10 ĐIỂM)
                </span>
              ) : (
                <span className="text-red-600 font-black flex items-center gap-1 text-xs uppercase tracking-widest font-sans">
                  ❌ CHƯA CHÍNH XÁC
                </span>
              )}
            </div>
            <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1">Giải thích học liệu:</p>
            <p className="text-slate-700 text-sm leading-relaxed mb-4 font-medium">
              <MathText text={currentQuestion.explanation} />
            </p>

            <div className="flex justify-between items-center border-t border-indigo-100/60 pt-4">
              <div>
                {!isCorrect && lives > 0 && (
                  <span className="text-[11px] text-amber-600 font-bold uppercase tracking-wide">
                    * Bạn sẽ tự động sử dụng quyền Cứu Trợ để tiếp tục chặng thi!
                  </span>
                )}
              </div>
              <button
                onClick={handleNext}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-black px-6 py-2.5 rounded-xl hover:opacity-95 active:scale-95 transition-all text-xs uppercase tracking-widest shadow-md"
              >
                {currentIdx < data.questions.length - 1 ? "Câu Tiếp Theo" : "Rung Chuông Vàng"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button */}
      <div className="flex justify-between mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors"
        >
          ← Thoát trò chơi
        </button>
        <div className="text-xs text-slate-500 font-mono font-black uppercase tracking-widest">
          ĐIỂM HIỆN TẠI: <span className="text-indigo-600 font-black font-sans text-sm">{score}</span>
        </div>
      </div>
    </div>
  );
}
