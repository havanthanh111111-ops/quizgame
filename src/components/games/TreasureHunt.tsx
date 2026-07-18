/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, Ship, Anchor, MapPin, Gift, Trophy, ArrowRight, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react";
import { TreasureHuntData } from "../../types";
import { playSound } from "../../utils/sound";
import { MathText } from "../MathText";

interface Props {
  data: TreasureHuntData;
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

export default function TreasureHunt({ data, studentName, studentClass, lessonId, onComplete, onBack }: Props) {
  const [activeStation, setActiveStation] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [score, setScore] = useState(0);

  // Solved tracks
  const [solvedStations, setSolvedStations] = useState<boolean[]>([false, false, false, false, false]);

  // Question inputs
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [isFinished, setIsFinished] = useState(false);

  const currentStationData = data.stations[activeStation];
  const challengeType = currentStationData.challengeType;

  const handleVerify = () => {
    if (isAnswered) return;

    let correct = false;
    const answer = cleanText(currentStationData.correctAnswer);

    if (challengeType === "multiple-choice" || challengeType === "true-false") {
      if (selectedOption !== null) {
        const optionText = currentStationData.options?.[selectedOption] || "";
        const selectedText = cleanText(optionText);

        // Multiple matching strategies for options:
        // 1. Direct clean match
        if (selectedText === answer) {
          correct = true;
        }
        // 2. Index match
        else if (String(selectedOption) === answer) {
          correct = true;
        }
        // 3. Alphabetical index match
        else if (["A", "B", "C", "D", "E", "F"][selectedOption] === answer) {
          correct = true;
        }
        // 4. Removing prefix and comparing
        else {
          const optionTextWithoutPrefix = optionText.replace(/^[A-F][-.)\s]+/i, "");
          const cleanOptionWithoutPrefix = cleanText(optionTextWithoutPrefix);
          if (cleanOptionWithoutPrefix === answer) {
            correct = true;
          }
          // 5. Substring inclusion
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
      }
    } else {
      const cleanInput = cleanText(textInput);
      correct = cleanInput === answer;
    }

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setScore((prev) => prev + 20);
      const updatedSolved = [...solvedStations];
      updatedSolved[activeStation] = true;
      setSolvedStations(updatedSolved);
      playSound.correct();
    } else {
      playSound.wrong();
    }
  };

  const handleNextStation = () => {
    setIsAnswered(false);
    setSelectedOption(null);
    setTextInput("");
    playSound.click();

    if (activeStation < 4) {
      setActiveStation((prev) => (prev + 1) as any);
    } else {
      setIsFinished(true);
      onComplete(score, 100);
      playSound.win();
    }
  };

  const handleRestart = () => {
    setActiveStation(0);
    setScore(0);
    setSolvedStations([false, false, false, false, false]);
    setSelectedOption(null);
    setTextInput("");
    setIsAnswered(false);
    setIsCorrect(false);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 text-center text-slate-900 shadow-xl relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-yellow-500" />
        <Gift className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-bounce" />

        <h2 className="text-3xl font-black mb-2 text-amber-600 uppercase">ĐÃ MỞ HỒM KHO BÁU!</h2>
        <p className="text-slate-600 mb-6 font-sans font-medium">
          Thí sinh <span className="font-extrabold text-amber-600">{studentName}</span> đã cập bến hòn đảo tri thức và mở khóa rương kho báu thành công!
        </p>

        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 mb-8 max-w-xs mx-auto shadow-inner text-center">
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <span className="text-[10px] text-slate-400 font-mono block uppercase font-black tracking-widest">TỔNG ĐIỂM KHO BÁU ĐẠT ĐƯỢC</span>
          <span className="text-4xl font-black text-amber-600 font-sans block mt-1">{score}</span>
        </div>

        <button
          onClick={onBack}
          className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-black px-8 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wider shadow-md cursor-pointer"
        >
          Trở Lại Danh Sách Game
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 text-slate-900 shadow-xl animate-fade-in">
      {/* Top Map display */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-slate-150 gap-4">
        <div>
          <span className="text-xs font-mono text-amber-600 uppercase font-black tracking-widest block">
            TRUY TÌM KHO BÁU TRI THỨC
          </span>
          <p className="text-xs text-slate-500 mt-0.5 font-bold uppercase tracking-wide">Thí sinh: {studentName} ({studentClass})</p>
        </div>

        {/* 5 station milestones */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shadow-inner">
          {[0, 1, 2, 3, 4].map((idx) => {
            const isSolved = solvedStations[idx];
            const isCurrent = activeStation === idx;

            return (
              <div
                key={idx}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-black transition-all ${
                  isSolved
                    ? "bg-amber-500 text-white shadow-sm"
                    : isCurrent
                    ? "bg-cyan-500 text-white animate-pulse scale-110 shadow-sm"
                    : "bg-white border border-slate-200 text-slate-400"
                }`}
              >
                {isSolved ? "✓" : idx + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Map Visual, Right Station Quiz */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Expedition Map representation */}
        <div className="md:col-span-5 bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl text-center min-h-[220px] flex flex-col justify-between shadow-inner">
          <div>
            <Compass className="w-12 h-12 text-amber-600 mx-auto mb-4 animate-spin" style={{ animationDuration: "10s" }} />
            <h4 className="text-xs font-mono font-black text-amber-600 uppercase mb-2">BẢN ĐỒ EXPEDITION</h4>

            {/* Simulated route track pins */}
            <div className="relative h-20 bg-white border-2 border-slate-150/80 rounded-xl overflow-hidden flex items-center justify-around px-4 shadow-sm">
              <div className="absolute inset-x-4 h-0.5 border-t-2 border-dashed border-amber-300" />
              {[0, 1, 2, 3, 4].map((idx) => {
                const isSolved = solvedStations[idx];
                const isCurrent = activeStation === idx;

                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center">
                    <MapPin className={`w-5 h-5 ${
                      isSolved ? "text-amber-500 font-bold" : isCurrent ? "text-cyan-500 animate-bounce" : "text-slate-300"
                    }`} />
                    <span className="text-[9px] font-mono mt-1 text-slate-400 font-bold">Trạm {idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono mt-4 font-black uppercase tracking-wider">
            ĐIỂM KHO BÁU: <span className="text-amber-600 font-black">{score}</span>
          </div>
        </div>

        {/* Right Column: Active Station Questions */}
        <div className="md:col-span-7 bg-white border-2 border-slate-105 p-6 rounded-2xl shadow-sm">
          <span className="text-[10px] font-mono text-amber-600 font-black block uppercase mb-1 tracking-wider">ĐỀ BÀI TRẠM SỐ {activeStation + 1} • {currentStationData.name}</span>
          <h3 className="text-base font-black font-sans leading-relaxed mb-6 text-slate-800"><MathText text={currentStationData.question} /></h3>

          {/* Form types */}
          {!isAnswered ? (
            <div className="space-y-4">
              {challengeType === "multiple-choice" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentStationData.options?.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(idx)}
                      className={`p-4 rounded-xl border-2 text-left text-sm font-sans font-bold transition-all cursor-pointer ${
                        selectedOption === idx
                          ? "border-amber-500 bg-amber-50 text-amber-700 font-black shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-500/50 shadow-sm"
                      }`}
                    >
                      <MathText text={opt} />
                    </button>
                  ))}
                </div>
              )}

              {challengeType === "true-false" && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedOption(1)} // 1 represents True/Đúng
                    className={`p-4 rounded-xl border-2 font-sans font-black transition-all text-center cursor-pointer ${
                      selectedOption === 1
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-500/50"
                    }`}
                  >
                    ĐÚNG
                  </button>
                  <button
                    onClick={() => setSelectedOption(0)} // 0 represents False/Sai
                    className={`p-4 rounded-xl border-2 font-sans font-black transition-all text-center cursor-pointer ${
                      selectedOption === 0
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-red-500/50"
                    }`}
                  >
                    SAI
                  </button>
                </div>
              )}

              {(challengeType === "fill-blank" || challengeType === "cipher") && (
                <div className="space-y-3">
                  {currentStationData.cipherHint && (
                    <p className="text-xs text-amber-700 italic bg-amber-50 p-2.5 border-2 border-amber-200 rounded-xl font-semibold">
                      💡 Mật thư: {currentStationData.cipherHint}
                    </p>
                  )}
                  <input
                    type="text"
                    placeholder="Nhập câu trả lời viết liền không dấu..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase text-slate-800 font-bold shadow-inner w-full focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={selectedOption === null && !textInput}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-black py-3 rounded-xl text-xs uppercase shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác Nhận Giải Đố
              </button>
            </div>
          ) : (
            /* Solution explanation view */
            <div className="bg-slate-50 rounded-xl p-5 border-2 border-slate-150 space-y-4 shadow-inner animate-fade-in">
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <span className="text-emerald-600 font-black flex items-center gap-1 text-sm uppercase tracking-wider font-sans">
                    ✓ Trạm thi vượt qua thành công! (+20 Điểm)
                  </span>
                ) : (
                  <span className="text-red-600 font-black flex items-center gap-1 text-sm uppercase tracking-wider font-sans">
                    ✗ Đáp án giải mã chưa khớp! Bạn đã mất cơ hội cộng điểm.
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600 border-t border-slate-200 pt-3">
                <span className="text-[10px] font-mono text-slate-400 block uppercase mb-1 font-black">ĐIỂM GHI CHÚ:</span>
                <p className="leading-relaxed font-semibold"><MathText text={currentStationData.explanation} /></p>
                <p className="text-emerald-600 font-black mt-2 uppercase tracking-wide">
                  Đáp án chính xác: {currentStationData.correctAnswer}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNextStation}
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow cursor-pointer hover:opacity-90"
                >
                  {activeStation < 4 ? "Đi Tiếp Trạm Tiếp" : "Mở Rương Kho Báu"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-150 text-xs text-slate-400 font-bold">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
        >
          ← Trở lại sảnh
        </button>
        <span className="italic uppercase text-[10px] tracking-wider text-slate-400">Sử dụng kiến thức để chinh phục 5 trạm trên bản đồ hành trình học tập</span>
      </div>
    </div>
  );
}
