/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Key, Lock, Unlock, HelpCircle, AlertCircle, ArrowRight, ShieldCheck, Trophy, Sparkles, CheckCircle } from "lucide-react";
import { EscapeRoomData } from "../../types";
import { playSound } from "../../utils/sound";

interface Props {
  data: EscapeRoomData;
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

export default function EscapeRoom({ data, studentName, studentClass, lessonId, onComplete, onBack }: Props) {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const activeLevel = data.levels[currentLevelIdx] || data.levels[0];

  const handleVerify = () => {
    setErrorFeedback("");

    const answer = cleanText(activeLevel.correctAnswer);

    let correct = false;

    if (activeLevel.options && activeLevel.options.length > 0) {
      if (selectedOption === null) {
        setErrorFeedback("Vui lòng chọn một đáp án!");
        return;
      }
      
      const optionText = activeLevel.options[selectedOption];
      const selectedText = cleanText(optionText);
      
      // Try multiple matching strategies for multiple-choice options:
      
      // 1. Exact cleaned match
      if (selectedText === answer) {
        correct = true;
      }
      // 2. Index match (e.g., answer is "0", "1", etc.)
      else if (String(selectedOption) === answer) {
        correct = true;
      }
      // 3. Alphabetical index match (e.g., answer is "A", "B", "C", "D")
      else if (["A", "B", "C", "D", "E", "F"][selectedOption] === answer) {
        correct = true;
      }
      // 4. Remove leading letter prefix (like "A.", "B-", "1. ") from option and compare
      else {
        const optionTextWithoutPrefix = optionText.replace(/^[A-F][-.)\s]+/i, "");
        const cleanOptionWithoutPrefix = cleanText(optionTextWithoutPrefix);
        if (cleanOptionWithoutPrefix === answer) {
          correct = true;
        }
        // 5. Check if one contains the other as a substring
        else if (selectedText.includes(answer) && answer.length > 0) {
          correct = true;
        }
        else if (cleanOptionWithoutPrefix.includes(answer) && answer.length > 0) {
          correct = true;
        }
        else if (answer.includes(cleanOptionWithoutPrefix) && cleanOptionWithoutPrefix.length > 0) {
          correct = true;
        }
      }
    } else {
      if (!textInput.trim()) {
        setErrorFeedback("Vui lòng nhập đáp án giải mã!");
        return;
      }
      const inputVal = cleanText(textInput);
      correct = inputVal === answer;
    }

    if (correct) {
      setIsUnlocked(true);
      setErrorFeedback("");
      const earned = showHint ? 40 : 60; // Penalty if hint was shown
      setScore((prev) => prev + earned);
      playSound.correct();
    } else {
      setErrorFeedback("Mật mã không chính xác! Hãy suy luận kỹ hơn.");
      playSound.wrong();
    }
  };

  const handleNext = () => {
    setIsUnlocked(false);
    setSelectedOption(null);
    setTextInput("");
    setShowHint(false);
    setErrorFeedback("");
    playSound.click();

    if (currentLevelIdx < data.levels.length - 1) {
      setCurrentLevelIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
      onComplete(score, data.levels.length * 60);
      playSound.win();
    }
  };

  if (isFinished) {
    return (
      <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 text-slate-900 shadow-xl relative overflow-hidden animate-fade-in">
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gaveUp ? "from-red-500 to-amber-500" : "from-emerald-500 to-teal-500"}`} />
        
        {gaveUp ? (
          <div className="text-center mb-6">
            <Lock className="w-20 h-20 text-amber-500 mx-auto mb-6 animate-bounce" />
            <h2 className="text-3xl font-black mb-2 text-amber-600 uppercase">KẾT THÚC SỚM & XEM ĐÁP ÁN</h2>
            <p className="text-slate-600 max-w-lg mx-auto font-sans text-sm font-medium">
              Bạn đã chọn kết thúc hành trình giải mật mã sớm. Dưới đây là bản đồ tổng hợp tất cả các câu đố, mật mã chính xác và giải thích kiến thức để bạn ôn tập lại!
            </p>
          </div>
        ) : (
          <div className="text-center mb-6">
            <Unlock className="w-20 h-20 text-emerald-500 mx-auto mb-6 animate-pulse" />
            <h2 className="text-3xl font-black mb-2 text-emerald-600 uppercase">ĐẪ THOÁT KHỎI PHÒNG THÀNH CÔNG!</h2>
            <p className="text-slate-600 max-w-lg mx-auto font-sans text-sm font-medium">
              Thí sinh <span className="font-extrabold text-emerald-600">{studentName}</span> đã bẻ khóa thành công cả {data.levels.length} chốt bảo vệ để thoát khỏi Escape Room giáo dục!
            </p>
          </div>
        )}

        <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 mb-8 max-w-xs mx-auto text-center shadow-inner">
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <span className="text-[10px] text-slate-400 font-mono block uppercase font-black tracking-widest">TỔNG ĐIỂM SỢI CHỈ KHÓA</span>
          <span className={`text-4xl font-black font-sans block mt-1 ${gaveUp ? "text-amber-600" : "text-emerald-600"}`}>{score}</span>
          <span className="text-slate-500 block text-xs mt-1 font-semibold">/ {data.levels.length * 60} điểm tối đa</span>
        </div>

        {/* Level details / answers block */}
        <div className="space-y-4 mb-8 text-left max-h-[350px] overflow-y-auto pr-2 custom-scrollbar border-t border-slate-150 pt-6">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-3 font-black">
            BẢN ĐỒ CHI TIẾT MÃ KHÓA {gaveUp ? "(TIẾT LỘ)" : "(ĐẪ GIẢI QUYẾT)"}:
          </h3>
          {data.levels.map((lvl, idx) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-black text-indigo-600">
                  CHỐT SỐ {idx + 1}: {lvl.title}
                </span>
                <span className="bg-slate-200 text-[10px] text-slate-600 px-2 py-0.5 rounded uppercase font-black tracking-wide">
                  {lvl.type}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-sans font-bold">
                <strong className="text-slate-400 font-mono text-[10px] block font-black uppercase tracking-wide">CÂU HỎI / THỬ THÁCH:</strong> {lvl.question}
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-slate-150 grid grid-cols-1 gap-2 text-xs shadow-inner">
                <div>
                  <span className="text-slate-400 font-mono text-[10px] block font-black uppercase">MÃ KHÓA ĐÁP ÁN:</span>
                  <span className="text-emerald-600 font-mono font-black uppercase">{lvl.correctAnswer}</span>
                </div>
                {lvl.explanation && (
                  <div>
                    <span className="text-slate-400 font-mono text-[10px] block font-black uppercase">TÓM TẮT KIẾN THỨC:</span>
                    <span className="text-slate-600 leading-relaxed block text-[11px] font-semibold">{lvl.explanation}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onBack}
            className={`font-black px-8 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md text-xs uppercase tracking-wider text-white bg-gradient-to-r ${gaveUp ? "from-amber-500 to-yellow-600" : "from-emerald-500 to-teal-600"}`}
          >
            Trở Lại Danh Sách Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 text-slate-900 shadow-xl animate-fade-in">
      {/* Top Map display */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-slate-150 gap-4">
        <div>
          <span className="text-xs font-mono text-emerald-600 uppercase font-black tracking-widest block">
            ESCAPE ROOM GIÁO DỤC • PHÒNG ĐỌC BẢN ĐỒ
          </span>
          <p className="text-xs text-slate-500 mt-0.5 font-bold uppercase tracking-wide">Thí sinh: {studentName} ({studentClass})</p>
        </div>

        {/* Level Map trackers */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shadow-inner">
          {data.levels.map((lvl, idx) => {
            const isPassed = idx < currentLevelIdx;
            const isCurrent = idx === currentLevelIdx;

            return (
              <div
                key={idx}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-black transition-all ${
                  isPassed
                    ? "bg-emerald-500 text-white shadow-sm"
                    : isCurrent
                    ? "bg-amber-500 text-white animate-pulse scale-110 shadow-sm"
                    : "bg-white border border-slate-200 text-slate-400"
                }`}
              >
                {isPassed ? "✓" : idx + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Lock Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left column: Lock scenario illustration & details */}
        <div className="md:col-span-5 bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 flex flex-col justify-between min-h-[300px] shadow-inner">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-white border border-slate-200 text-emerald-600 font-mono text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm">
                CHỐT SỐ {currentLevelIdx + 1}
              </span>
              <span className="text-slate-400 font-mono text-[10px] uppercase font-black tracking-wider">
                {activeLevel.type} Lock
              </span>
            </div>

            <h3 className="text-lg font-black font-sans mb-3 text-slate-800">
              {activeLevel.title}
            </h3>

            {/* Immersive roleplaying scenario text */}
            <p className="text-xs text-slate-500 leading-relaxed font-sans italic border-l-4 border-slate-200 pl-3 py-1 mb-4 bg-white/60">
              "{activeLevel.scenario}"
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400 font-black tracking-wide uppercase">
              <span>ĐIỂM TÍCH LŨY:</span>
              <span className="text-emerald-600 font-black">{score}</span>
            </div>

            {/* Hint Trigger */}
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-xs font-black text-amber-600 hover:underline text-left block cursor-pointer"
            >
              {showHint ? "Ẩn gợi ý" : "💡 Tôi cần mật thư gợi ý (-20 điểm chặng này)"}
            </button>

            {showHint && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 leading-relaxed font-semibold">
                {activeLevel.hint}
              </p>
            )}

            {/* Give up & reveal all answers */}
            <button
              onClick={() => {
                setGaveUp(true);
                setIsFinished(true);
                onComplete(score, data.levels.length * 60);
                playSound.fail();
              }}
              className="w-full mt-2 bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200/60 font-black py-2.5 rounded-xl text-[11px] uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              🏳️ Kết thúc & Xem tất cả mã
            </button>
          </div>
        </div>

        {/* Right column: active puzzle questions */}
        <div className="md:col-span-7 bg-white border-2 border-slate-105 p-6 rounded-2xl min-h-[300px] flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-mono text-emerald-600 font-black block uppercase mb-1 tracking-wider">CÂU ĐỐ CHẶNG NÀY</span>
            <p className="text-base font-black font-sans leading-relaxed mb-6 text-slate-800">
              {activeLevel.question}
            </p>

            {/* Puzzle interactive input based on option existence */}
            {!isUnlocked ? (
              <div className="space-y-4">
                {activeLevel.options && activeLevel.options.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5">
                    {activeLevel.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedOption(idx)}
                        className={`p-3.5 rounded-xl border-2 text-left text-xs md:text-sm font-sans font-bold transition-all cursor-pointer ${
                          selectedOption === idx
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-black shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-500/50 shadow-sm"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Gõ đáp án mở khóa viết hoa liền không dấu..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                      className="bg-white border-2 border-slate-200 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-3 text-sm font-mono uppercase text-slate-800 font-bold shadow-inner w-full"
                    />
                  </div>
                )}

                {/* Error panel */}
                {errorFeedback && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-600 rounded-xl p-3 text-xs flex gap-2 items-center font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorFeedback}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleVerify}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-3 rounded-xl text-xs uppercase shadow-md hover:opacity-95 transition-all cursor-pointer"
                  >
                    Xác Nhận Giải Đố
                  </button>
                  <button
                    onClick={() => {
                      setIsUnlocked(true);
                      setErrorFeedback("");
                      playSound.correct();
                    }}
                    className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-amber-600 font-black rounded-xl text-xs uppercase border-2 border-slate-200 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    title="Tiết lộ mã khóa chặng này"
                  >
                    🔑 Tiết Lộ Mã
                  </button>
                </div>
              </div>
            ) : (
              /* Success unlocked panel */
              <div className="bg-slate-50 p-5 rounded-xl border-2 border-slate-150 space-y-4 shadow-inner animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-600 font-black text-sm uppercase tracking-wider font-sans">
                    ✓ Chốt khóa {currentLevelIdx + 1} đã được bẻ gãy!
                  </span>
                </div>

                <div className="text-xs text-slate-600 border-t border-slate-200 pt-3">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase mb-1 font-black">GHI CHÚ HỌC TẬP:</span>
                  <p className="leading-relaxed font-semibold">{activeLevel.explanation}</p>
                  <p className="text-emerald-600 font-black mt-2 font-mono uppercase tracking-wide">
                    MÃ MỞ KHÓA CHUẨN: {activeLevel.correctAnswer}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action next button */}
          {isUnlocked && (
            <div className="flex justify-end mt-6">
              <button
                onClick={handleNext}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer shadow"
              >
                {currentLevelIdx < data.levels.length - 1 ? "Chốt Tiếp Theo" : "Thoát Phòng"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer statistics back toggle */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-150 text-xs text-slate-400 font-bold">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
        >
          ← Trở lại sảnh
        </button>
        <span className="italic uppercase text-[10px] tracking-wider text-slate-400">Hoàn thành bẻ khóa toàn bộ chốt phòng liên tục để tìm cổng ra!</span>
      </div>
    </div>
  );
}
